import type { Metadata } from "next";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button";
import { ActionForm, ConfirmButton, Field, FormMessage, SelectField, SubmitButton } from "@/components/ui/form";
import { Trash } from "@/components/ui/icons";
import { ListSkeleton, PageHeader, SectionTitle } from "@/components/ui/page";
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/auth/dal";
import { listAllCategories } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Forum" };

export default function AdminForumPage() {
  return (
    <>
      <PageHeader
        title="Forum kategorileri"
        description="Konu başa alma, kilitleme ve silme işlemleri konunun kendi sayfasından yapılır."
      />
      <Suspense fallback={<ListSkeleton rows={8} />}>
        <CategoryEditor />
      </Suspense>
    </>
  );
}

function VisibilityField({ defaultValue }: { defaultValue: string }) {
  return (
    <SelectField label="Görünürlük" name="visibility" defaultValue={defaultValue}>
      <option value="public">Herkese açık</option>
      <option value="members">Yalnızca üyeler</option>
    </SelectField>
  );
}

async function CategoryEditor() {
  await requireAdmin();
  const categories = await listAllCategories();

  return (
    <div className="grid gap-8 xl:grid-cols-12">
      <ul className="space-y-3 xl:col-span-8">
        {categories.map((category) => (
          <li key={category.id} className="panel p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <p className="font-semibold">{category.name}</p>
              <span className="text-sm text-smoke">
                /forum/{category.slug}, {category.topicCount} konu
              </span>
              <span className="ml-auto">
                <ConfirmButton
                  action={deleteCategory.bind(null, category.id)}
                  message={`${category.name} ve içindeki ${category.topicCount} konu kalıcı olarak silinecek. Emin misin?`}
                  className={buttonClass("quiet", "sm", "hover:text-al-bright")}
                >
                  <Trash size={15} />
                  Sil
                </ConfirmButton>
              </span>
            </div>
            <ActionForm action={updateCategory.bind(null, category.id)} className="grid items-start gap-3 md:grid-cols-[1fr_2fr]">
              <Field label="Ad" name="name" defaultValue={category.name} required />
              <Field label="Açıklama" name="description" defaultValue={category.description} />
              <Field label="Sıra" name="sortOrder" type="number" defaultValue={category.sortOrder} required />
              <VisibilityField defaultValue={category.visibility} />
              <div>
                <SubmitButton variant="ghost" pendingLabel="Kaydediliyor...">
                  Kaydet
                </SubmitButton>
              </div>
              <FormMessage className="md:col-span-2" />
            </ActionForm>
          </li>
        ))}
      </ul>
      <aside className="xl:col-span-4">
        <div className="xl:sticky xl:top-24">
          <SectionTitle>Yeni kategori</SectionTitle>
          <ActionForm action={createCategory} resetOnSuccess className="panel flex flex-col gap-4 p-5">
            <FormMessage />
            <Field label="Ad" name="name" required />
            <Field label="Açıklama" name="description" />
            <Field label="Sıra" name="sortOrder" type="number" defaultValue={100} required />
            <VisibilityField defaultValue="public" />
            <div>
              <SubmitButton pendingLabel="Ekleniyor...">Kategori ekle</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </aside>
    </div>
  );
}
