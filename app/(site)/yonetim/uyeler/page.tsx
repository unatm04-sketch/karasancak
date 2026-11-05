import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/member/avatar";
import { RankBadge, RoleBadge } from "@/components/member/badges";
import { buttonClass } from "@/components/ui/button";
import { MagnifyingGlass, Plus } from "@/components/ui/icons";
import { EmptyState, ListSkeleton, PageHeader, Pagination, parsePage } from "@/components/ui/page";
import { requireAdmin } from "@/lib/auth/dal";
import { formatNumber } from "@/lib/format";
import { ADMIN_PAGE_SIZE, listMembers } from "@/lib/queries/admin";
import { listRanks } from "@/lib/queries/members";

export const metadata: Metadata = { title: "Üyeler" };

export default function MembersPage({ searchParams }: PageProps<"/yonetim/uyeler">) {
  return (
    <>
      <PageHeader
        title="Üyeler"
        actions={
          <Link href="/yonetim/uyeler/yeni" className={buttonClass("primary", "md")}>
            <Plus size={16} />
            Yeni üye tanımla
          </Link>
        }
      />
      <Suspense fallback={<ListSkeleton rows={8} />}>
        <MemberTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const asString = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

async function MemberTable({ searchParams }: Pick<PageProps<"/yonetim/uyeler">, "searchParams">) {
  await requireAdmin();
  const [params, ranks] = await Promise.all([searchParams, listRanks()]);
  const q = asString(params.q).trim();
  const rankId = asString(params.rutbe);
  const status = asString(params.durum);
  const page = parsePage(params.sayfa);
  const { items, total } = await listMembers({ q, rankId, status, page });

  return (
    <>
      <form action="/yonetim/uyeler" className="mb-6 flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1">
          <label htmlFor="uye-q" className="mb-1.5 block text-sm font-medium">
            Ara
          </label>
          <input id="uye-q" name="q" type="search" defaultValue={q} placeholder="Ad, kullanıcı adı veya e-posta" className="input" />
        </div>
        <div>
          <label htmlFor="uye-rutbe" className="mb-1.5 block text-sm font-medium">
            Rütbe
          </label>
          <select id="uye-rutbe" name="rutbe" defaultValue={rankId} className="input">
            <option value="">Tümü</option>
            {ranks.map((rank) => (
              <option key={rank.id} value={rank.id}>
                {rank.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="uye-durum" className="mb-1.5 block text-sm font-medium">
            Durum
          </label>
          <select id="uye-durum" name="durum" defaultValue={status} className="input">
            <option value="">Tümü</option>
            <option value="active">Aktif</option>
            <option value="suspended">Askıda</option>
          </select>
        </div>
        <button type="submit" className={buttonClass("ghost", "md", "h-[46px]")}>
          <MagnifyingGlass size={16} />
          Filtrele
        </button>
      </form>

      <p className="mb-3 text-sm text-fog">{formatNumber(total)} üye</p>
      {items.length === 0 ? (
        <EmptyState title="Üye bulunamadı">Filtreleri değiştirmeyi dene.</EmptyState>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs text-smoke">
              <tr>
                <th scope="col" className="p-3 font-medium">Üye</th>
                <th scope="col" className="p-3 font-medium">Rütbe</th>
                <th scope="col" className="p-3 font-medium">Şehir</th>
                <th scope="col" className="p-3 text-right font-medium">Seviye</th>
                <th scope="col" className="p-3 text-right font-medium">XP</th>
                <th scope="col" className="p-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-ash">
                  <td className="p-3">
                    <Link href={`/yonetim/uyeler/${member.id}`} className="flex items-center gap-3">
                      <Avatar user={member} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold hover:text-al-bright">{member.displayName}</span>
                        <span className="block truncate text-xs text-smoke">@{member.username}</span>
                      </span>
                      <RoleBadge role={member.role} />
                    </Link>
                  </td>
                  <td className="p-3">
                    <RankBadge name={member.rankName} order={member.rankOrder} />
                  </td>
                  <td className="p-3 text-fog">{member.city ?? ""}</td>
                  <td className="p-3 text-right tabular-nums">{member.level}</td>
                  <td className="p-3 text-right tabular-nums">{formatNumber(member.xp)}</td>
                  <td className="p-3">
                    {member.status === "suspended" ? (
                      <span className="font-medium text-al-bright">Askıda</span>
                    ) : !member.hasPassword ? (
                      <span className="text-fog">Aktivasyon bekliyor</span>
                    ) : (
                      <span className="text-fog">Aktif</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        total={total}
        perPage={ADMIN_PAGE_SIZE}
        basePath="/yonetim/uyeler"
        query={{ q: q || undefined, rutbe: rankId || undefined, durum: status || undefined }}
      />
    </>
  );
}
