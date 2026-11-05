import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Emblem } from "@/components/brand/emblem";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/page";
import { login } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Giriş" };

export default function LoginPage({ searchParams }: PageProps<"/giris">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
      <Emblem className="h-24 w-auto self-start" title="" />
      <h1 className="display mt-6 text-6xl">Giriş</h1>
      <p className="mt-3 text-fog">Sürüye hoş geldin. Yoklaman seni bekliyor.</p>
      <Suspense fallback={<Skeleton className="mt-8 h-64 w-full" />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
      <p className="mt-8 text-sm text-fog">
        Henüz üye değil misin?{" "}
        <Link href="/basvuru" className="font-semibold text-bone underline underline-offset-4 hover:text-al-bright">
          Başvuru formunu doldur
        </Link>
      </p>
      <p className="mt-2 text-sm text-smoke">
        Şifreni unuttuysan yönetimden tek kullanımlık şifre linki iste.
      </p>
    </div>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/giris">, "searchParams">) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const next = typeof params.devam === "string" ? params.devam : "";
  if (user) redirect(safeInternalPath(next));

  return (
    <ActionForm action={login} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <FormMessage />
      <Field label="Kullanıcı adı veya e-posta" name="identifier" autoComplete="username" autoCapitalize="none" required />
      <Field label="Şifre" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton size="lg" pendingLabel="Giriş yapılıyor...">
        Giriş yap
      </SubmitButton>
    </ActionForm>
  );
}
