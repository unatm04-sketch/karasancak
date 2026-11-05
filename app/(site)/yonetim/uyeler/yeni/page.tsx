import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm, Field, FormMessage, GeneratedLink, SelectField, SubmitButton } from "@/components/ui/form";
import { PageHeader, Skeleton } from "@/components/ui/page";
import { createMember } from "@/lib/actions/admin-members";
import { requireAdmin } from "@/lib/auth/dal";
import { listRanks } from "@/lib/queries/members";

export const metadata: Metadata = { title: "Yeni üye" };

export default function NewMemberPage() {
  return (
    <>
      <PageHeader
        title="Yeni üye tanımla"
        description="Başvuru formu olmadan doğrudan üye ekle. Üye, sana verilen tek kullanımlık linkle kendi şifresini belirler."
        breadcrumb={[{ href: "/yonetim/uyeler", label: "Üyeler" }]}
      />
      <Suspense fallback={<Skeleton className="h-96 w-full max-w-3xl" />}>
        <NewMemberForm />
      </Suspense>
    </>
  );
}

async function NewMemberForm() {
  await requireAdmin();
  const ranks = await listRanks();
  const defaultRank = ranks.find((r) => r.isDefault)?.id ?? ranks[0]?.id ?? "";
  return (
    <ActionForm action={createMember} resetOnSuccess className="panel flex max-w-3xl flex-col gap-5 p-5 md:p-7">
      <FormMessage />
      <GeneratedLink />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Ad soyad" name="displayName" required />
        <Field
          label="Kullanıcı adı"
          name="username"
          autoCapitalize="none"
          help="Küçük harf, rakam ve alt çizgi."
          required
        />
        <Field label="E-posta" name="email" type="email" help="İsteğe bağlı" />
        <Field label="Telefon" name="phone" type="tel" help="İsteğe bağlı" />
        <Field label="Şehir" name="city" help="İsteğe bağlı" />
        <Field label="Başlangıç XP'si" name="xp" type="number" min={0} defaultValue={0} help="Hoş geldin XP'sine eklenir." />
        <SelectField label="Rütbe" name="rankId" defaultValue={defaultRank} required>
          {ranks.map((rank) => (
            <option key={rank.id} value={rank.id}>
              {rank.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Yetki" name="role" defaultValue="member">
          <option value="member">Üye</option>
          <option value="moderator">Moderatör</option>
          <option value="admin">Yönetici</option>
        </SelectField>
      </div>
      <div>
        <SubmitButton size="lg" pendingLabel="Tanımlanıyor...">
          Üyeyi tanımla
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
