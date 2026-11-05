import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { RichText } from "@/components/forum/rich-text";
import { PushPin } from "@/components/ui/icons";
import { EmptyState, ListSkeleton, PageContainer, PageHeader } from "@/components/ui/page";
import { formatDate } from "@/lib/format";
import { listAnnouncements } from "@/lib/queries/content";

export const metadata: Metadata = {
  title: "Duyurular",
  description: "Kara Sancak 1903 Taraftar Grubu duyuruları.",
};

export default function AnnouncementsPage() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title="Duyurular" />
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <AnnouncementList />
      </Suspense>
    </PageContainer>
  );
}

async function AnnouncementList() {
  await connection();
  const items = await listAnnouncements(50);
  if (items.length === 0) {
    return <EmptyState title="Henüz duyuru yok">Yeni duyurular burada yayınlanacak.</EmptyState>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="panel p-5 md:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-al-bright">
            {item.pinned && <PushPin size={15} weight="fill" aria-label="Başa tutturuldu" />}
            {item.kicker}
          </div>
          <h2 className="display mt-2 text-3xl md:text-4xl">{item.title}</h2>
          <RichText text={item.body} className="mt-3 text-fog" />
          <p className="mt-4 text-xs text-smoke">{formatDate(item.publishedAt)}</p>
        </li>
      ))}
    </ul>
  );
}
