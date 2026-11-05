import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TopicRow } from "@/components/forum/topic-row";
import { buttonClass } from "@/components/ui/button";
import { Plus } from "@/components/ui/icons";
import { EmptyState, ListSkeleton, PageContainer, PageHeader, Pagination, parsePage, Skeleton } from "@/components/ui/page";
import { getCurrentUser } from "@/lib/auth/session";
import { getCategoryBySlug, listTopicsInCategory, TOPICS_PER_PAGE } from "@/lib/queries/forum";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = { title: "Forum" };

export default function CategoryPage(props: PageProps<"/forum/[kategori]">) {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <>
            <Skeleton className="mb-10 h-20 w-96 max-w-full" />
            <ListSkeleton rows={8} />
          </>
        }
      >
        <CategoryContent {...props} />
      </Suspense>
    </PageContainer>
  );
}

async function CategoryContent({ params, searchParams }: PageProps<"/forum/[kategori]">) {
  const [{ kategori }, { sayfa }, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const category = await getCategoryBySlug(kategori);
  if (!category) notFound();

  const breadcrumb = [{ href: "/forum", label: "Forum" }];

  if (category.visibility === "members" && !user) {
    return (
      <>
        <PageHeader title={category.name} breadcrumb={breadcrumb} />
        <EmptyState
          title="Burası üyelere özel"
          action={
            <Link href={`/giris?devam=/forum/${category.slug}`} className={buttonClass("primary", "md")}>
              Giriş yap
            </Link>
          }
        >
          Bu kategorideki konuları görmek için giriş yapman gerekiyor.
        </EmptyState>
      </>
    );
  }

  const page = parsePage(sayfa);
  const { items, total } = await listTopicsInCategory(category.id, page);
  const now = await requestTime();

  return (
    <>
      <PageHeader
        title={category.name}
        description={category.description}
        breadcrumb={breadcrumb}
        actions={
          <Link href={`/forum/yeni?kategori=${category.slug}`} className={buttonClass("primary", "md")}>
            <Plus size={16} />
            Yeni konu
          </Link>
        }
      />
      {items.length === 0 ? (
        <EmptyState title="Henüz konu yok">Bu kategorideki ilk konuyu sen aç.</EmptyState>
      ) : (
        <ul>
          {items.map((topic) => (
            <TopicRow key={topic.id} topic={topic} now={now} />
          ))}
        </ul>
      )}
      <Pagination page={page} total={total} perPage={TOPICS_PER_PAGE} basePath={`/forum/${category.slug}`} />
    </>
  );
}
