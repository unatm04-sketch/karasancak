import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionForm, CheckboxField, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { ListSkeleton, PageHeader, SectionTitle } from "@/components/ui/page";
import { updateXpRule } from "@/lib/actions/admin-members";
import { requireAdmin } from "@/lib/auth/dal";
import { timeAgo } from "@/lib/format";
import { listXpLog } from "@/lib/queries/admin";
import { listXpRules } from "@/lib/queries/members";
import { XP_CATEGORIES } from "@/lib/xp/rules";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = { title: "XP kuralları" };

export default function XpRulesPage() {
  return (
    <>
      <PageHeader
        title="XP kuralları"
        description="Her hareketin kaç XP kazandıracağını ve günde kaç kez ödül vereceğini buradan ayarla. Değişiklik hemen geçerli olur, geçmiş kazanımları etkilemez."
      />
      <Suspense fallback={<ListSkeleton rows={10} />}>
        <RuleEditor />
      </Suspense>
    </>
  );
}

async function RuleEditor() {
  await requireAdmin();
  const [rules, log] = await Promise.all([listXpRules(), listXpLog(25)]);
  const now = await requestTime();

  return (
    <div className="grid gap-10 xl:grid-cols-12">
      <div className="space-y-8 xl:col-span-8">
        {XP_CATEGORIES.map((category) => {
          const list = rules.filter((r) => r.category === category);
          if (list.length === 0) return null;
          return (
            <section key={category}>
              <SectionTitle>{category}</SectionTitle>
              <ul className="panel divide-y divide-line">
                {list.map((rule) => (
                  <li key={rule.key} className="p-4">
                    <ActionForm
                      action={updateXpRule.bind(null, rule.key)}
                      className="grid items-start gap-3 md:grid-cols-[1fr_90px_100px_auto_auto]"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{rule.label}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-fog">{rule.description}</p>
                      </div>
                      <Field label="XP" name="amount" type="number" min={0} defaultValue={rule.amount} required />
                      <Field
                        label="Günlük limit"
                        name="dailyCap"
                        type="number"
                        min={1}
                        defaultValue={rule.dailyCap ?? ""}
                        placeholder="Yok"
                      />
                      <div className="md:pt-[34px]">
                        <CheckboxField label="Açık" name="active" defaultChecked={rule.active} />
                      </div>
                      <div className="md:pt-[26px]">
                        <SubmitButton variant="ghost" pendingLabel="...">
                          Kaydet
                        </SubmitButton>
                      </div>
                      <FormMessage className="md:col-span-5" />
                    </ActionForm>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <aside className="xl:col-span-4">
        <SectionTitle>Son XP hareketleri</SectionTitle>
        <ul className="panel divide-y divide-line">
          {log.map((event) => (
            <li key={event.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <Link href={`/uye/${event.username}`} className="block truncate font-medium hover:text-al-bright">
                  {event.displayName}
                </Link>
                <p className="truncate text-xs text-smoke">
                  {event.ruleKey === "manual" ? `Elle: ${event.reason ?? ""}` : (event.label ?? event.reason ?? event.ruleKey)}, {timeAgo(event.createdAt, now)}
                </p>
              </div>
              <span className={`display shrink-0 text-lg ${event.amount < 0 ? "text-al-bright" : ""}`}>
                {event.amount > 0 ? "+" : ""}
                {event.amount}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
