import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { Suspense } from "react";
import { AvatarUploader } from "@/components/member/avatar-uploader";
import { ActionForm, Field, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import { PageContainer, PageHeader, SectionTitle, Skeleton } from "@/components/ui/page";
import { changePassword, updateProfile } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Ayarlar", robots: { index: false } };

export default function SettingsPage() {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title="Ayarlar" />
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <SettingsForms />
      </Suspense>
    </PageContainer>
  );
}

async function SettingsForms() {
  const me = await requireUser();
  const [profile] = await db
    .select({
      displayName: users.displayName,
      bio: users.bio,
      city: users.city,
      tribune: users.tribune,
      instagram: users.instagram,
      avatarVersion: users.avatarVersion,
    })
    .from(users)
    .where(eq(users.id, me.id))
    .limit(1);
  if (!profile) return null;

  return (
    <div className="space-y-12">
      <section>
        <SectionTitle>Profil görseli</SectionTitle>
        <AvatarUploader user={{ id: me.id, displayName: profile.displayName, avatarVersion: profile.avatarVersion }} />
      </section>

      <section>
        <SectionTitle>Profil</SectionTitle>
        <ActionForm action={updateProfile} className="panel flex flex-col gap-5 p-5 md:p-7">
          <FormMessage />
          <Field label="Görünen ad" name="displayName" defaultValue={profile.displayName} required />
          <TextArea
            label="Hakkımda"
            name="bio"
            rows={4}
            maxLength={400}
            defaultValue={profile.bio ?? ""}
            help="Biyografi, şehir ve tribün bilgilerini doldurunca bir kereye mahsus XP kazanırsın."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Şehir" name="city" defaultValue={profile.city ?? ""} />
            <Field label="Tribün" name="tribune" defaultValue={profile.tribune ?? ""} />
          </div>
          <Field label="Instagram kullanıcı adı" name="instagram" defaultValue={profile.instagram ?? ""} />
          <div>
            <SubmitButton pendingLabel="Kaydediliyor...">Kaydet</SubmitButton>
          </div>
        </ActionForm>
      </section>

      <section>
        <SectionTitle>Şifre</SectionTitle>
        <ActionForm action={changePassword} resetOnSuccess className="panel flex flex-col gap-5 p-5 md:p-7">
          <FormMessage />
          <Field label="Mevcut şifre" name="current" type="password" autoComplete="current-password" required />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Yeni şifre" name="password" type="password" autoComplete="new-password" help="En az 8 karakter." required />
            <Field label="Yeni şifre tekrar" name="passwordConfirm" type="password" autoComplete="new-password" required />
          </div>
          <div>
            <SubmitButton variant="ghost" pendingLabel="Değiştiriliyor...">
              Şifreyi değiştir
            </SubmitButton>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
