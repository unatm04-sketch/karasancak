import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm, Field, FormMessage, SelectField, SubmitButton, TextArea } from "@/components/ui/form";
import { CheckCircle, X } from "@/components/ui/icons";
import { PageHeader, SectionTitle, Skeleton } from "@/components/ui/page";
import { approveApplication, rejectApplication } from "@/lib/actions/admin-members";
import { requireAdmin } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { getApplication } from "@/lib/queries/admin";
import { listRanks } from "@/lib/queries/members";

export const metadata: Metadata = { title: "Başvuru" };

export default function ApplicationDetailPage({ params }: PageProps<"/yonetim/basvurular/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ApplicationDetail params={params} />
    </Suspense>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div>
      <dt className="text-xs text-smoke">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  );
}

async function ApplicationDetail({ params }: Pick<PageProps<"/yonetim/basvurular/[id]">, "params">) {
  const [{ id }] = await Promise.all([params, requireAdmin()]);
  const [application, ranks] = await Promise.all([getApplication(id), listRanks()]);
  if (!application) notFound();

  const defaultRank = ranks.find((r) => r.isDefault)?.id ?? ranks[0]?.id ?? "";

  return (
    <>
      <PageHeader
        title={application.fullName}
        description={`${formatDateTime(application.createdAt)} tarihinde başvurdu`}
        breadcrumb={[{ href: "/yonetim/basvurular", label: "Başvurular" }]}
      />
      <div className="grid gap-8 xl:grid-cols-12">
        <section className="xl:col-span-7">
          <dl className="panel grid gap-5 p-5 sm:grid-cols-2 md:p-6">
            <Row label="Kullanıcı adı">@{application.username}</Row>
            <Row label="E-posta">{application.email}</Row>
            <Row label="Telefon">{application.phone}</Row>
            <Row label="Şehir">{application.city}</Row>
            <Row label="Tribün">{application.tribune}</Row>
            <Row label="Instagram">
              {application.instagram && (
                <a
                  href={`https://www.instagram.com/${application.instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-al-bright"
                >
                  {application.instagram}
                </a>
              )}
            </Row>
            <Row label="Davet eden">
              {application.referrerName && (
                <Link href={`/uye/${application.referrerUsername}`} className="underline underline-offset-2 hover:text-al-bright">
                  {application.referrerName}
                </Link>
              )}
            </Row>
          </dl>
          <div className="panel mt-3 p-5 md:p-6">
            <p className="text-xs text-smoke">Neden Kara Sancak?</p>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{application.motivation}</p>
          </div>
        </section>

        <aside className="xl:col-span-5">
          {application.status === "pending" ? (
            <div className="space-y-4">
              <section className="panel p-5 md:p-6" aria-labelledby="onayla">
                <SectionTitle>
                  <span id="onayla">Onayla</span>
                </SectionTitle>
                <ActionForm action={approveApplication.bind(null, application.id)} className="flex flex-col gap-4">
                  <FormMessage />
                  <SelectField label="Rütbe" name="rankId" defaultValue={defaultRank} required>
                    {ranks.map((rank) => (
                      <option key={rank.id} value={rank.id}>
                        {rank.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label="Yetki" name="role" defaultValue="member" help="Çoğu üye için Üye seçili kalmalı.">
                    <option value="member">Üye</option>
                    <option value="moderator">Moderatör</option>
                    <option value="admin">Yönetici</option>
                  </SelectField>
                  <Field label="Not" name="note" help="İsteğe bağlı, yalnızca yönetim görür." />
                  <SubmitButton size="lg" pendingLabel="Onaylanıyor...">
                    <CheckCircle size={18} weight="fill" />
                    Onayla ve üye yap
                  </SubmitButton>
                </ActionForm>
              </section>
              <section className="panel p-5 md:p-6" aria-labelledby="reddet">
                <SectionTitle>
                  <span id="reddet">Reddet</span>
                </SectionTitle>
                <ActionForm action={rejectApplication.bind(null, application.id)} className="flex flex-col gap-4">
                  <FormMessage />
                  <TextArea label="Sebep" name="note" rows={3} help="İsteğe bağlı, yalnızca yönetim görür." />
                  <SubmitButton variant="danger" pendingLabel="Reddediliyor...">
                    <X size={16} />
                    Başvuruyu reddet
                  </SubmitButton>
                </ActionForm>
              </section>
            </div>
          ) : (
            <section className="panel p-5 md:p-6">
              <p className="display text-3xl">{application.status === "approved" ? "Onaylandı" : "Reddedildi"}</p>
              <p className="mt-2 text-sm text-fog">
                {application.reviewerName ?? "Yönetim"}
                {application.reviewedAt ? `, ${formatDateTime(application.reviewedAt)}` : ""}
              </p>
              {application.reviewNote && <p className="mt-3 text-sm">{application.reviewNote}</p>}
              {application.createdUserId && (
                <Link
                  href={`/yonetim/uyeler/${application.createdUserId}`}
                  className="mt-4 inline-block font-semibold underline underline-offset-4 hover:text-al-bright"
                >
                  Üye kaydına git
                </Link>
              )}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
