"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { isStaff, requireStaff, requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { forumCategories, postLikes, posts, topics, users } from "@/lib/db/schema";
import { pushToast, pushToasts } from "@/lib/flash";
import { failure, fromZodError, type FormState } from "@/lib/form-state";
import { slugify } from "@/lib/format";
import { newId, newSlugSuffix } from "@/lib/ids";
import { notify } from "@/lib/notifications";
import { consumeRateLimit } from "@/lib/rate-limit";
import { formToObject } from "@/lib/validation";
import { evaluateAchievements } from "@/lib/xp/achievements";
import { awardXp, awardsToToasts, revokeXp } from "@/lib/xp/award";
import { MIN_POST_LENGTH_FOR_XP } from "@/lib/xp/rules";

const BodySchema = z
  .string()
  .trim()
  .min(2, "Yazın boş olamaz.")
  .max(8000, "Yazı en fazla 8000 karakter olabilir.");

const TopicSchema = z.object({
  categoryId: z.string().min(1, "Kategori seç."),
  title: z.string().trim().min(5, "Başlık en az 5 karakter olmalı.").max(120, "En fazla 120 karakter."),
  body: BodySchema,
});

/** Yazıda geçen @kullanici adlarına bildirim gönderir. */
async function notifyMentions(
  body: string,
  authorId: string,
  authorName: string,
  topicTitle: string,
  href: string,
) {
  const names = [...new Set([...body.matchAll(/(^|\s)@([a-z0-9_]{3,24})/g)].map((m) => m[2]!))].slice(0, 5);
  if (names.length === 0) return;
  const mentioned = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.username, names));
  await Promise.all(
    mentioned
      .filter((u) => u.id !== authorId)
      .map((u) =>
        notify(u.id, {
          type: "mention",
          title: `${authorName} senden bahsetti`,
          body: topicTitle,
          href,
        }),
      ),
  );
}

export async function createTopic(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = TopicSchema.safeParse(formToObject(formData, ["categoryId", "title", "body"]));
  if (!parsed.success) return fromZodError(parsed.error);

  if (!(await consumeRateLimit(`topic:${user.id}`, 8, 60 * 60 * 1000))) {
    return failure("Kısa sürede çok fazla konu açtın. Biraz sonra tekrar dene.");
  }

  const [category] = await db
    .select({ id: forumCategories.id })
    .from(forumCategories)
    .where(eq(forumCategories.id, parsed.data.categoryId))
    .limit(1);
  if (!category) return failure("Kategori bulunamadı.");

  const now = Date.now();
  const topicId = newId();
  const postId = newId();
  const slug = `${slugify(parsed.data.title) || "konu"}-${newSlugSuffix()}`;

  await db.batch([
    db.insert(topics).values({
      id: topicId,
      slug,
      categoryId: category.id,
      authorId: user.id,
      title: parsed.data.title,
      lastPostAt: now,
      lastPostById: user.id,
      createdAt: now,
    }),
    db.insert(posts).values({
      id: postId,
      topicId,
      authorId: user.id,
      body: parsed.data.body,
      isOpening: true,
      createdAt: now,
    }),
  ]);

  const award = await awardXp(user.id, "topic_create", { dedupeKey: `topic:${topicId}` });
  const earned = await evaluateAchievements(user.id, "topic");
  await pushToasts(awardsToToasts([award, ...earned]));
  await notifyMentions(
    parsed.data.body,
    user.id,
    user.displayName,
    parsed.data.title,
    `/forum/konu/${slug}`,
  );

  revalidatePath("/", "layout");
  redirect(`/forum/konu/${slug}`);
}

export async function createPost(topicId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = BodySchema.safeParse(formData.get("body"));
  if (!parsed.success) {
    return { ok: false, fieldErrors: { body: [parsed.error.issues[0]!.message] } };
  }
  if (!(await consumeRateLimit(`post:${user.id}`, 12, 60 * 1000))) {
    return failure("Biraz yavaş. Bir dakika içinde çok fazla yazı gönderdin.");
  }

  const [topic] = await db
    .select({
      id: topics.id,
      slug: topics.slug,
      title: topics.title,
      authorId: topics.authorId,
      isLocked: topics.isLocked,
    })
    .from(topics)
    .where(and(eq(topics.id, topicId), isNull(topics.deletedAt)))
    .limit(1);
  if (!topic) return failure("Konu bulunamadı.");
  if (topic.isLocked && !isStaff(user)) return failure("Bu konu yanıtlara kapatılmış.");

  const now = Date.now();
  const postId = newId();
  await db.batch([
    db.insert(posts).values({
      id: postId,
      topicId,
      authorId: user.id,
      body: parsed.data,
      createdAt: now,
    }),
    db
      .update(topics)
      .set({
        replyCount: sql`${topics.replyCount} + 1`,
        lastPostAt: now,
        lastPostById: user.id,
      })
      .where(eq(topics.id, topicId)),
  ]);

  // Kısa yazılar yayınlanır ama XP kazandırmaz.
  const award =
    parsed.data.length >= MIN_POST_LENGTH_FOR_XP
      ? await awardXp(user.id, "post_create", { dedupeKey: `post:${postId}` })
      : null;
  const earned = await evaluateAchievements(user.id, "post");
  await pushToasts(awardsToToasts([award, ...earned]));

  const href = `/forum/konu/${topic.slug}#yazi-${postId}`;
  if (topic.authorId !== user.id) {
    await notify(topic.authorId, {
      type: "reply",
      title: `${user.displayName} konuna yanıt yazdı`,
      body: topic.title,
      href,
    });
  }
  await notifyMentions(parsed.data, user.id, user.displayName, topic.title, href);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function editPost(postId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = BodySchema.safeParse(formData.get("body"));
  if (!parsed.success) {
    return { ok: false, fieldErrors: { body: [parsed.error.issues[0]!.message] } };
  }

  const [post] = await db
    .select({
      authorId: posts.authorId,
      topicSlug: topics.slug,
    })
    .from(posts)
    .innerJoin(topics, eq(posts.topicId, topics.id))
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);
  if (!post) return failure("Yazı bulunamadı.");
  if (post.authorId !== user.id && !isStaff(user)) return failure("Bu yazıyı düzenleyemezsin.");

  await db
    .update(posts)
    .set({ body: parsed.data, editedAt: Date.now() })
    .where(eq(posts.id, postId));

  revalidatePath("/", "layout");
  redirect(`/forum/konu/${post.topicSlug}#yazi-${postId}`);
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; count: number } | null> {
  const user = await requireUser();
  if (!(await consumeRateLimit(`like:${user.id}`, 40, 60 * 1000))) return null;

  const [post] = await db
    .select({ authorId: posts.authorId, likeCount: posts.likeCount, topicSlug: topics.slug, topicTitle: topics.title })
    .from(posts)
    .innerJoin(topics, eq(posts.topicId, topics.id))
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);
  if (!post) return null;
  if (post.authorId === user.id) {
    await pushToast({ kind: "info", message: "Kendi yazını beğenemezsin." });
    return { liked: false, count: post.likeCount };
  }

  const removed = await db
    .delete(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)))
    .returning({ postId: postLikes.postId });

  if (removed.length > 0) {
    const [row] = await db
      .update(posts)
      .set({ likeCount: sql`MAX(${posts.likeCount} - 1, 0)` })
      .where(eq(posts.id, postId))
      .returning({ likeCount: posts.likeCount });
    return { liked: false, count: row?.likeCount ?? 0 };
  }

  await db
    .insert(postLikes)
    .values({ postId, userId: user.id, createdAt: Date.now() })
    .onConflictDoNothing();
  const [row] = await db
    .update(posts)
    .set({ likeCount: sql`${posts.likeCount} + 1` })
    .where(eq(posts.id, postId))
    .returning({ likeCount: posts.likeCount });

  // Benzersiz anahtar sayesinde beğen-kaldır-beğen döngüsü ikinci kez ödül vermez.
  const received = await awardXp(post.authorId, "like_received", {
    dedupeKey: `like_received:${postId}:${user.id}`,
  });
  const given = await awardXp(user.id, "like_given", {
    dedupeKey: `like_given:${postId}:${user.id}`,
  });
  if (received) {
    await notify(post.authorId, {
      type: "like",
      title: `${user.displayName} yazını beğendi`,
      body: post.topicTitle,
      href: `/forum/konu/${post.topicSlug}#yazi-${postId}`,
    });
    await evaluateAchievements(post.authorId, "like");
  }
  await pushToasts(awardsToToasts([given]));
  return { liked: true, count: row?.likeCount ?? 0 };
}

export async function deletePost(postId: string): Promise<void> {
  const user = await requireUser();
  const [post] = await db
    .select({
      authorId: posts.authorId,
      isOpening: posts.isOpening,
      topicId: posts.topicId,
      topicSlug: topics.slug,
    })
    .from(posts)
    .innerJoin(topics, eq(posts.topicId, topics.id))
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);
  if (!post) return;
  if (post.authorId !== user.id && !isStaff(user)) return;

  if (post.isOpening) {
    await softDeleteTopic(post.topicId, post.authorId);
    await pushToast({ kind: "info", message: "Konu silindi." });
    revalidatePath("/", "layout");
    redirect("/forum");
  }

  await db.batch([
    db.update(posts).set({ deletedAt: Date.now() }).where(eq(posts.id, postId)),
    db
      .update(topics)
      .set({ replyCount: sql`MAX(${topics.replyCount} - 1, 0)` })
      .where(eq(topics.id, post.topicId)),
  ]);
  await revokeXp(post.authorId, `post:${postId}`, "Yazı silindi");
  await pushToast({ kind: "info", message: "Yazı silindi." });
  revalidatePath("/", "layout");
}

async function softDeleteTopic(topicId: string, authorId: string) {
  await db.update(topics).set({ deletedAt: Date.now() }).where(eq(topics.id, topicId));
  await revokeXp(authorId, `topic:${topicId}`, "Konu silindi");
}

export async function setTopicPinned(topicId: string, pinned: boolean): Promise<void> {
  const staff = await requireStaff();
  const [topic] = await db
    .update(topics)
    .set({ isPinned: pinned })
    .where(eq(topics.id, topicId))
    .returning({ authorId: topics.authorId, title: topics.title, slug: topics.slug });
  if (topic && pinned && topic.authorId !== staff.id) {
    // Aynı konu tekrar tekrar başa alınsa da ödül bir kez verilir.
    const award = await awardXp(topic.authorId, "topic_pinned", {
      dedupeKey: `topic_pinned:${topicId}`,
    });
    if (award) {
      await notify(topic.authorId, {
        type: "topic",
        title: "Konun manşete çıktı",
        body: topic.title,
        href: `/forum/konu/${topic.slug}`,
      });
    }
  }
  revalidatePath("/", "layout");
}

export async function setTopicLocked(topicId: string, locked: boolean): Promise<void> {
  await requireStaff();
  await db.update(topics).set({ isLocked: locked }).where(eq(topics.id, topicId));
  revalidatePath("/", "layout");
}
