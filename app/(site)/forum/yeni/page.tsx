import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm, Field, FormMessage, SelectField, SubmitButton, TextArea } from "@/components/ui/form";
import { PageContainer, PageHeader, Skeleton } from "@/components/ui/page";
import { createTopic } from "@/lib/actions/forum";
import { requireUser } from "@/lib/auth/dal";
import { listCategories } from "@/lib/queries/forum";

export const metadata: Metadata = { title: "Yeni konu", robots: { index: false } };

export default function NewTopicPage({ searchParams }: PageProps<"/forum/yeni">) {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title="Yeni konu" breadcrumb={[{ href: "/forum", label: "Forum" }]} />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <NewTopicForm searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function NewTopicForm({ searchParams }: Pick<PageProps<"/forum/yeni">, "searchParams">) {
  await requireUser();
  const [{ kategori }, categories] = await Promise.all([searchParams, listCategories(true)]);
  const selected = categories.find((c) => c.slug === kategori)?.id;

  return (
    <ActionForm action={createTopic} className="panel flex flex-col gap-5 p-5 md:p-8">
      <FormMessage />
      <SelectField label="Kategori" name="categoryId" defaultValue={selected ?? ""} required>
        <option value="" disabled>
          Seç
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <Field label="Başlık" name="title" maxLength={120} required />
      <TextArea
        label="İçerik"
        name="body"
        rows={9}
        help="Birinden bahsetmek için @kullaniciadi yaz. Linkler otomatik tıklanabilir olur."
        required
      />
      <div>
        <SubmitButton size="lg" pendingLabel="Açılıyor...">
          Konuyu aç
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
