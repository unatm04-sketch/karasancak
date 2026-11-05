import type { Metadata } from "next";
import { Suspense } from "react";
import { RankBadge } from "@/components/member/badges";
import { buttonClass } from "@/components/ui/button";
import { ActionForm, ConfirmButton, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { Check, Trash } from "@/components/ui/icons";
import { ListSkeleton, PageHeader, SectionTitle } from "@/components/ui/page";
import { createRank, deleteRank, setDefaultRank, updateRank } from "@/lib/actions/admin-members";
import { requireAdmin } from "@/lib/auth/dal";
import { rankMemberCounts } from "@/lib/queries/admin";
import { listRanks } from "@/lib/queries/members";

export const metadata: Metadata = { title: "Rütbeler" };

export default function RanksPage() {
  return (
    <>
      <PageHeader
        title="Rütbeler"
        description="Rütbeleri yönetim verir. Sıra numarası büyük olan daha yüksek rütbedir. Adlarını grubun yapısına göre değiştirebilirsin."
      />
      <Suspense fallback={<ListSkeleton rows={7} />}>
        <RankEditor />
      </Suspense>
    </>
  );
}

async function RankEditor() {
  await requireAdmin();
  const [ranks, counts] = await Promise.all([listRanks(), rankMemberCounts()]);
  const ordered = [...ranks].reverse();

  return (
    <div className="grid gap-8 xl:grid-cols-12">
      <ul className="space-y-3 xl:col-span-8">
        {ordered.map((rank) => (
          <li key={rank.id} className="panel p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <RankBadge name={rank.name} order={rank.sortOrder} />
              <span className="text-sm text-fog">{counts.get(rank.id) ?? 0} üye</span>
              {rank.isDefault && (
                <span className="flex items-center gap-1 text-xs font-semibold text-bone">
                  <Check size={14} />
                  Varsayılan
                </span>
              )}
              <span className="ml-auto flex items-center gap-1">
                {!rank.isDefault && (
                  <form action={setDefaultRank.bind(null, rank.id)}>
                    <button type="submit" className={buttonClass("quiet", "sm")}>
                      Varsayılan yap
                    </button>
                  </form>
                )}
                {!rank.isDefault && (
                  <ConfirmButton
                    action={deleteRank.bind(null, rank.id)}
                    message={`${rank.name} rütbesi silinecek. Bu rütbedeki üyeler rütbesiz kalır. Emin misin?`}
                    className={buttonClass("quiet", "sm", "hover:text-al-bright")}
                  >
                    <Trash size={15} />
                    Sil
                  </ConfirmButton>
                )}
              </span>
            </div>
            <ActionForm action={updateRank.bind(null, rank.id)} className="grid items-start gap-3 md:grid-cols-[1fr_2fr_90px_auto]">
              <Field label="Ad" name="name" defaultValue={rank.name} required />
              <Field label="Açıklama" name="description" defaultValue={rank.description} />
              <Field label="Sıra" name="sortOrder" type="number" defaultValue={rank.sortOrder} required />
              <div className="md:pt-[26px]">
                <SubmitButton variant="ghost" pendingLabel="...">
                  Kaydet
                </SubmitButton>
              </div>
              <FormMessage className="md:col-span-4" />
            </ActionForm>
          </li>
        ))}
      </ul>

      <aside className="xl:col-span-4">
        <div className="xl:sticky xl:top-24">
          <SectionTitle>Yeni rütbe</SectionTitle>
          <ActionForm action={createRank} resetOnSuccess className="panel flex flex-col gap-4 p-5">
            <FormMessage />
            <Field label="Ad" name="name" required />
            <Field label="Açıklama" name="description" />
            <Field label="Sıra" name="sortOrder" type="number" defaultValue={25} help="Er 10, Alp 20, Buyruk 30..." required />
            <div>
              <SubmitButton pendingLabel="Ekleniyor...">Rütbe ekle</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </aside>
    </div>
  );
}
