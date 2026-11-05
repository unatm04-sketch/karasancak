import type { Metadata } from "next";
import { and, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ActionForm, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import { PageContainer, PageHeader, Skeleton } from "@/components/ui/page";
import { editPost } from "@/lib/actions/forum";
import { isStaff, requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { posts, topics } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Yazıyı düzenle", robots: { index: false } };

export default function EditPostPage({ params }: PageProps<"/forum/duzenle/[id]">) {
  return (
    <PageContainer className="max-w-3xl">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <EditPostForm params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function EditPostForm({ params }: Pick<PageProps<"/forum/duzenle/[id]">, "params">) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const [post] = await db
    .select({
      body: posts.body,
      authorId: posts.authorId,
      topicSlug: topics.slug,
      topicTitle: topics.title,
    })
    .from(posts)
    .innerJoin(topics, eq(posts.topicId, topics.id))
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1);
  if (!post) notFound();
  if (post.authorId !== user.id && !isStaff(user)) redirect(`/forum/konu/${post.topicSlug}`);

  return (
    <>
      <PageHeader
        title="Yazıyı düzenle"
        description={post.topicTitle}
        breadcrumb={[
          { href: "/forum", label: "Forum" },
          { href: `/forum/konu/${post.topicSlug}`, label: "Konuya dön" },
        ]}
      />
      <ActionForm action={editPost.bind(null, id)} className="panel flex flex-col gap-5 p-5 md:p-8">
        <FormMessage />
        <TextArea label="İçerik" name="body" rows={10} defaultValue={post.body} required />
        <div>
          <SubmitButton pendingLabel="Kaydediliyor...">Kaydet</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
