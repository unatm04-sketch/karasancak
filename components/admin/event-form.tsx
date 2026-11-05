"use client";

import { ActionForm, CheckboxField, Field, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import type { FormState } from "@/lib/form-state";

type EventValues = {
  title: string;
  description: string;
  location: string;
  city: string | null;
  startsAtValue: string;
  timeAnnounced: boolean;
  xpReward: number;
  published: boolean;
};

export function EventForm({
  action,
  values,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  values?: EventValues;
  submitLabel: string;
}) {
  return (
    <ActionForm action={action} className="panel flex flex-col gap-5 p-5 md:p-6">
      <FormMessage />
      <Field label="Başlık" name="title" defaultValue={values?.title} required />
      <TextArea label="Açıklama" name="description" rows={6} defaultValue={values?.description} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Yer" name="location" defaultValue={values?.location} required />
        <Field label="Şehir" name="city" defaultValue={values?.city ?? ""} />
        <Field
          label="Tarih ve saat"
          name="startsAt"
          type="datetime-local"
          defaultValue={values?.startsAtValue}
          help="Türkiye saati"
          required
        />
        <Field
          label="Yoklama XP'si"
          name="xpReward"
          type="number"
          min={0}
          defaultValue={values?.xpReward ?? 150}
          required
        />
      </div>
      <CheckboxField
        label="Saat açıklandı"
        name="timeAnnounced"
        defaultChecked={values?.timeAnnounced ?? true}
        help="İşaretli değilse yalnızca tarih gösterilir."
      />
      <CheckboxField label="Yayında" name="published" defaultChecked={values?.published ?? true} />
      <div>
        <SubmitButton pendingLabel="Kaydediliyor...">{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
