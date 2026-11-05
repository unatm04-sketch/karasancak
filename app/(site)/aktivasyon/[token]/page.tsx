import type { Metadata } from "next";
import { and, eq, gt, isNull } from "drizzle-orm";
import { Suspense } from "react";
import { Emblem } from "@/components/brand/emblem";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/page";
import { redeemPasswordToken } from "@/lib/actions/auth";
import { db } from "@/lib/db";
import { passwordTokens, users } from "@/lib/db/schema";
import { sha256 } from "@/lib/ids";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = { title: "Şifre belirle", robots: { index: false } };

export default function ActivationPage({ params }: PageProps<"/aktivasyon/[token]">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
      <Emblem className="h-24 w-auto self-start" title="" />
      <Suspense fallback={<Skeleton className="mt-8 h-72 w-full" />}>
        <ActivationForm params={params} />
      </Suspense>
    </div>
  );
}

async function ActivationForm({ params }: Pick<PageProps<"/aktivasyon/[token]">, "params">) {
  const [{ token }, now] = await Promise.all([params, requestTime()]);
  const [row] = await db
    .select({ displayName: users.displayName, purpose: passwordTokens.purpose })
    .from(passwordTokens)
    .innerJoin(users, eq(passwordTokens.userId, users.id))
    .where(
      and(
        eq(passwordTokens.id, sha256(token)),
        isNull(passwordTokens.usedAt),
        gt(passwordTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) {
    return (
      <>
        <h1 className="display mt-6 text-5xl">Link geçersiz</h1>
        <p className="mt-3 text-fog">
          Bu linkin süresi dolmuş ya da daha önce kullanılmış. Yönetimden yeni bir link iste.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="display mt-6 text-5xl">
        {row.purpose === "activation" ? "Sürüye hoş geldin" : "Yeni şifre"}
      </h1>
      <p className="mt-3 text-fog">{row.displayName}, hesabın için bir şifre belirle.</p>
      <ActionForm action={redeemPasswordToken.bind(null, token)} className="mt-8 flex flex-col gap-5">
        <FormMessage />
        <Field
          label="Şifre"
          name="password"
          type="password"
          autoComplete="new-password"
          help="En az 8 karakter."
          required
        />
        <Field label="Şifre tekrar" name="passwordConfirm" type="password" autoComplete="new-password" required />
        <SubmitButton size="lg" pendingLabel="Kaydediliyor...">
          Şifreyi kaydet
        </SubmitButton>
      </ActionForm>
    </>
  );
}
