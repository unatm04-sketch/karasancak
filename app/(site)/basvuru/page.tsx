import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ApplicationForm } from "@/components/member/application-form";
import { Skeleton } from "@/components/ui/page";
import { getCurrentUser } from "@/lib/auth/session";
import { findUserByReferralCode } from "@/lib/queries/members";
import { REFERRAL_COOKIE } from "@/lib/referral";

export const metadata: Metadata = {
  title: "Başvuru Formu",
  description: "Kara Sancak 1903 üyelik başvuru formu. Başvurular yönetim tarafından tek tek incelenir.",
};

const STEPS = [
  { title: "Formu doldur", body: "Kim olduğunu ve neden saflarımızda olmak istediğini anlat." },
  { title: "Yönetim incelesin", body: "Her başvuru tek tek okunur." },
  { title: "Rütbeni al", body: "Onayla birlikte rütben verilir, ilk XP'lerin hesabına geçer." },
];

export default function ApplicationPage() {
  return (
    <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-5 py-12 md:px-10 lg:grid-cols-12 lg:py-20">
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <h1 className="display text-[clamp(3.4rem,7vw,6rem)]">
            Sürüye katıl<span className="text-al">.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-fog">
            Tüm yol arkadaşlarımızı saflarımıza çağırıyoruz.
          </p>
          <ol className="mt-10 space-y-6">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="display flex size-10 shrink-0 items-center justify-center bg-bone text-xl text-ink">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-1 text-sm text-fog">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-sm text-fog">
            Zaten üye misin?{" "}
            <Link href="/giris" className="font-semibold text-bone underline underline-offset-4 hover:text-al-bright">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
      <div className="lg:col-span-7">
        <Suspense fallback={<Skeleton className="h-[720px] w-full" />}>
          <ApplicationGate />
        </Suspense>
      </div>
    </div>
  );
}

async function ApplicationGate() {
  const user = await getCurrentUser();
  if (user) redirect("/panel");

  const code = (await cookies()).get(REFERRAL_COOKIE)?.value;
  const referrer = code ? await findUserByReferralCode(code) : null;

  return (
    <>
      {referrer && (
        <p className="mb-6 border-l-4 border-al bg-coal py-3 pl-4 pr-3 text-sm">
          <span className="font-semibold">{referrer.displayName}</span> seni sürüye çağırdı. Başvurun
          onaylanınca kendisi de ödül kazanacak.
        </p>
      )}
      <ApplicationForm />
    </>
  );
}
