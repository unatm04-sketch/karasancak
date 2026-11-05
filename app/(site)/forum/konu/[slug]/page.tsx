import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostCard } from "@/components/forum/post-card";
import { ReplyForm } from "@/components/forum/reply-form";
import { buttonClass } from "@/components/ui/button";
import { Lock, LockOpen, PushPin } from "@/components/ui/icons";
import { ListSkeleton, PageContainer, PageHeader, Pagination, parsePage, Skeleton } from "@/components/ui/page";
import { setTopicLocked, setTopicPinned } from "@/lib/actions/forum";
import { isStaff } from "@/lib/auth/dal";
import { getCurrentUser } from "@/lib/auth/session";
import { getTopicBySlug, incrementTopicViews, listPosts, POSTS_PER_PAGE } from "@/lib/queries/forum";

export const metadata: Metadata = { title: "Konu" };

export default function TopicPage(props: PageProps<"/forum/konu/[slug]">) {
  return (
    <PageContainer className="max-w-[1100px]">
      <Suspense
        fallback={
          <>
            <Skeleton className="mb-10 h-24 w-full" />
            <ListSkeleton rows={4} />
          </>
        }
      >
        <TopicContent {...props} />
      </Suspense>
    </PageContainer>
  );
}

async function TopicContent({ params, searchParams }: PageProps<"/forum/konu/[slug]">) {
  const [{ slug }, { sayfa }, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const breadcrumb = [
    { href: "/forum", label: "Forum" },
    { href: `/forum/${topic.categorySlug}`, label: topic.categoryName },
  ];

  if (topic.categoryVisibility === "members" && !user) {
    return (
      <>
        <PageHeader title="Üyelere özel konu" breadcrumb={breadcrumb} />
        <Link href={`/giris?devam=/forum/konu/${slug}`} className={buttonClass("primary", "md")}>
          Giriş yap
        </Link>
      </>
    );
  }

  const page = parsePage(sayfa);
  const [{ items, total }] = await Promise.all([
    listPosts(topic.id, page, user?.id ?? null),
    page === 1 ? incrementTopicViews(topic.id) : Promise.resolve(),
  ]);
  const staff = isStaff(user);
  const lastPage = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));

  return (
    <>
      <PageHeader
        title={<span className="text-[0.72em]">{topic.title}</span>}
        breadcrumb={breadcrumb}
        actions={
          staff ? (
            <>
              <form action={setTopicPinned.bind(null, topic.id, !topic.isPinned)}>
                <button type="submit" className={buttonClass("ghost", "sm")}>
                  <PushPin size={15} weight={topic.isPinned ? "fill" : "regular"} />
                  {topic.isPinned ? "Manşetten kaldır" : "Manşete al"}
                </button>
              </form>
              <form action={setTopicLocked.bind(null, topic.id, !topic.isLocked)}>
                <button type="submit" className={buttonClass("ghost", "sm")}>
                  {topic.isLocked ? <LockOpen size={15} /> : <Lock size={15} />}
                  {topic.isLocked ? "Yanıtlara aç" : "Yanıtlara kapat"}
                </button>
              </form>
            </>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3">
        {items.map((post) => (
          <PostCard key={post.id} post={post} viewerId={user?.id ?? null} viewerIsStaff={staff} />
        ))}
      </div>

      <Pagination page={page} total={total} perPage={POSTS_PER_PAGE} basePath={`/forum/konu/${slug}`} />

      <div className="mt-10">
        {!user ? (
          <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="text-fog">Yanıt yazmak için sürüye katılman gerekiyor.</p>
            <div className="flex gap-2">
              <Link href={`/giris?devam=/forum/konu/${slug}`} className={buttonClass("ghost", "md")}>
                Giriş
              </Link>
              <Link href="/basvuru" className={buttonClass("primary", "md")}>
                Sürüye Katıl
              </Link>
            </div>
          </div>
        ) : topic.isLocked && !staff ? (
          <p className="panel flex items-center gap-2 p-6 text-fog">
            <Lock size={18} />
            Bu konu yanıtlara kapatılmış.
          </p>
        ) : page === lastPage ? (
          <ReplyForm topicId={topic.id} />
        ) : (
          <Link href={`/forum/konu/${slug}?sayfa=${lastPage}`} className={buttonClass("ghost", "md")}>
            Yanıtlamak için son sayfaya git
          </Link>
        )}
      </div>
    </>
  );
}
