import type { Metadata } from "next";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button";
import { ActionForm, CheckboxField, ConfirmButton, Field, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import { Trash } from "@/components/ui/icons";
import { ListSkeleton, PageHeader, SectionTitle } from "@/components/ui/page";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/lib/actions/admin-content";
import { requireStaff } from "@/lib/auth/dal";
import { formatDate } from "@/lib/format";
import { listAllAnnouncements } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Duyurular" };

export default function AdminAnnouncementsPage() {
  return (
    <>
      <PageHeader
        title="Duyurular"
        description="Üst başlığı &ldquo;Kamuoyuna Duyuru&rdquo; olan son duyuru ana sayfadaki afişte görünür."
      />
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <AnnouncementEditor />
      </Suspense>
    </>
  );
}

async function AnnouncementEditor() {
  await requireStaff();
  const items = await listAllAnnouncements();
  return (
    <div className="grid gap-8 xl:grid-cols-12">
      <ul className="space-y-3 xl:col-span-8">
        {items.map((item) => (
          <li key={item.id}>
            <details className="panel group">
              <summary className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-al-bright">{item.kicker}</span>
                  <span className="block font-semibold">{item.title}</span>
                </span>
                <span className="text-sm text-smoke">
                  {!item.published && <span className="mr-3 font-medium text-al-bright">Taslak</span>}
                  {formatDate(item.publishedAt)}
                </span>
              </summary>
              <div className="border-t border-line p-4">
                <ActionForm action={updateAnnouncement.bind(null, item.id)} className="flex flex-col gap-4">
                  <FormMessage />
                  <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                    <Field label="Üst başlık" name="kicker" defaultValue={item.kicker} required />
                    <Field label="Başlık" name="title" defaultValue={item.title} required />
                  </div>
                  <TextArea label="Metin" name="body" rows={4} defaultValue={item.body} required />
                  <div className="flex flex-wrap gap-6">
                    <CheckboxField label="Başa tuttur" name="pinned" defaultChecked={item.pinned} />
                    <CheckboxField label="Yayında" name="published" defaultChecked={item.published} />
                  </div>
                  <div>
                    <SubmitButton variant="ghost" pendingLabel="Kaydediliyor...">
                      Kaydet
                    </SubmitButton>
                  </div>
                </ActionForm>
                <div className="mt-3">
                  <ConfirmButton
                    action={deleteAnnouncement.bind(null, item.id)}
                    message="Bu duyuru silinecek. Emin misin?"
                    className={buttonClass("quiet", "sm", "hover:text-al-bright")}
                  >
                    <Trash size={15} />
                    Duyuruyu sil
                  </ConfirmButton>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
      <aside className="xl:col-span-4">
        <div className="xl:sticky xl:top-24">
          <SectionTitle>Yeni duyuru</SectionTitle>
          <ActionForm action={createAnnouncement} resetOnSuccess className="panel flex flex-col gap-4 p-5">
            <FormMessage />
            <Field label="Üst başlık" name="kicker" defaultValue="Kamuoyuna Duyuru" required />
            <Field label="Başlık" name="title" required />
            <TextArea label="Metin" name="body" rows={5} required />
            <CheckboxField label="Başa tuttur" name="pinned" />
            <CheckboxField label="Yayında" name="published" defaultChecked />
            <div>
              <SubmitButton pendingLabel="Yayınlanıyor...">Yayınla</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </aside>
    </div>
  );
}
