import "server-only";
import { and, asc, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db";
import { forumCategories, postLikes, posts, ranks, topics, users } from "@/lib/db/schema";

export const authorColumns = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  level: users.level,
  xp: users.xp,
  role: users.role,
  avatarVersion: users.avatarVersion,
  rankName: ranks.name,
  rankOrder: ranks.sortOrder,
};

export type AuthorSummary = {
  id: string;
  username: string;
  displayName: string;
  level: number;
  xp: number;
  role: "member" | "moderator" | "admin";
  avatarVersion: number;
  rankName: string | null;
  rankOrder: number | null;
};

export const TOPICS_PER_PAGE = 20;
export const POSTS_PER_PAGE = 20;

/** Giriş yapmamış ziyaretçi üyelere özel kategorileri göremez. */
const visibleCategories = (loggedIn: boolean) =>
  loggedIn ? undefined : eq(forumCategories.visibility, "public");

export async function listCategories(loggedIn: boolean) {
  const rows = await db
    .select({
      id: forumCategories.id,
      slug: forumCategories.slug,
      name: forumCategories.name,
      description: forumCategories.description,
      visibility: forumCategories.visibility,
      topicCount: sql<number>`(SELECT COUNT(*) FROM topics t WHERE t.category_id = "forum_categories"."id" AND t.deleted_at IS NULL)`,
      postCount: sql<number>`(SELECT COUNT(*) FROM posts p INNER JOIN topics t ON p.topic_id = t.id WHERE t.category_id = "forum_categories"."id" AND t.deleted_at IS NULL AND p.deleted_at IS NULL)`,
    })
    .from(forumCategories)
    .where(visibleCategories(loggedIn))
    .orderBy(asc(forumCategories.sortOrder));
  return rows;
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(forumCategories)
    .where(eq(forumCategories.slug, slug))
    .limit(1);
  return row ?? null;
}

const lastPoster = alias(users, "last_poster");

const topicListColumns = {
  id: topics.id,
  slug: topics.slug,
  title: topics.title,
  isPinned: topics.isPinned,
  isLocked: topics.isLocked,
  viewCount: topics.viewCount,
  replyCount: topics.replyCount,
  lastPostAt: topics.lastPostAt,
  createdAt: topics.createdAt,
  categorySlug: forumCategories.slug,
  categoryName: forumCategories.name,
  lastPosterName: lastPoster.displayName,
  lastPosterUsername: lastPoster.username,
  author: authorColumns,
};

function topicListBase() {
  return db
    .select(topicListColumns)
    .from(topics)
    .innerJoin(users, eq(topics.authorId, users.id))
    .leftJoin(ranks, eq(users.rankId, ranks.id))
    .innerJoin(forumCategories, eq(topics.categoryId, forumCategories.id))
    .leftJoin(lastPoster, eq(topics.lastPostById, lastPoster.id));
}

export async function listTopicsInCategory(categoryId: string, page: number) {
  const where = and(eq(topics.categoryId, categoryId), isNull(topics.deletedAt));
  const [items, totals] = await Promise.all([
    topicListBase()
      .where(where)
      .orderBy(desc(topics.isPinned), desc(topics.lastPostAt))
      .limit(TOPICS_PER_PAGE)
      .offset((page - 1) * TOPICS_PER_PAGE),
    db.select({ n: count() }).from(topics).where(where),
  ]);
  return { items, total: totals[0]?.n ?? 0 };
}

export async function latestTopics(limit: number, loggedIn: boolean) {
  return topicListBase()
    .where(and(isNull(topics.deletedAt), visibleCategories(loggedIn)))
    .orderBy(desc(topics.lastPostAt))
    .limit(limit);
}

export async function getTopicBySlug(slug: string) {
  const [row] = await db
    .select({
      id: topics.id,
      slug: topics.slug,
      title: topics.title,
      isPinned: topics.isPinned,
      isLocked: topics.isLocked,
      viewCount: topics.viewCount,
      replyCount: topics.replyCount,
      createdAt: topics.createdAt,
      authorId: topics.authorId,
      categoryId: topics.categoryId,
      categorySlug: forumCategories.slug,
      categoryName: forumCategories.name,
      categoryVisibility: forumCategories.visibility,
    })
    .from(topics)
    .innerJoin(forumCategories, eq(topics.categoryId, forumCategories.id))
    .where(and(eq(topics.slug, slug), isNull(topics.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function listPosts(topicId: string, page: number, viewerId: string | null) {
  const where = and(eq(posts.topicId, topicId), isNull(posts.deletedAt));
  const [rows, totals] = await Promise.all([
    db
      .select({
        id: posts.id,
        body: posts.body,
        isOpening: posts.isOpening,
        likeCount: posts.likeCount,
        createdAt: posts.createdAt,
        editedAt: posts.editedAt,
        author: authorColumns,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(ranks, eq(users.rankId, ranks.id))
      .where(where)
      .orderBy(asc(posts.createdAt))
      .limit(POSTS_PER_PAGE)
      .offset((page - 1) * POSTS_PER_PAGE),
    db.select({ n: count() }).from(posts).where(where),
  ]);

  let liked = new Set<string>();
  if (viewerId && rows.length > 0) {
    const likes = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(
        and(
          eq(postLikes.userId, viewerId),
          inArray(
            postLikes.postId,
            rows.map((r) => r.id),
          ),
        ),
      );
    liked = new Set(likes.map((l) => l.postId));
  }

  return {
    items: rows.map((r) => ({ ...r, likedByViewer: liked.has(r.id) })),
    total: totals[0]?.n ?? 0,
  };
}

export async function incrementTopicViews(topicId: string) {
  await db
    .update(topics)
    .set({ viewCount: sql`${topics.viewCount} + 1` })
    .where(eq(topics.id, topicId));
}

export async function searchTopics(query: string, loggedIn: boolean, limit = 30) {
  const q = `%${query.replace(/[%_]/g, "")}%`;
  return topicListBase()
    .where(
      and(
        isNull(topics.deletedAt),
        visibleCategories(loggedIn),
        or(sql`${topics.title} LIKE ${q}`),
      ),
    )
    .orderBy(desc(topics.lastPostAt))
    .limit(limit);
}

export async function recentPostsByUser(userId: string, loggedIn: boolean, limit = 6) {
  return db
    .select({
      id: posts.id,
      body: posts.body,
      createdAt: posts.createdAt,
      topicSlug: topics.slug,
      topicTitle: topics.title,
    })
    .from(posts)
    .innerJoin(topics, eq(posts.topicId, topics.id))
    .innerJoin(forumCategories, eq(topics.categoryId, forumCategories.id))
    .where(
      and(
        eq(posts.authorId, userId),
        isNull(posts.deletedAt),
        isNull(topics.deletedAt),
        visibleCategories(loggedIn),
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}
