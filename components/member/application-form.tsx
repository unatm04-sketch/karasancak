"use client";

import Link from "next/link";
import {
  ActionForm,
  CheckboxField,
  Field,
  FormMessage,
  SubmitButton,
  TextArea,
} from "@/components/ui/form";
import { submitApplication } from "@/lib/actions/application";

export function ApplicationForm() {
  return (
    <ActionForm action={submitApplication} className="panel flex flex-col gap-6 p-6 md:p-8">
      <FormMessage />

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Ad soyad" name="fullName" autoComplete="name" required />
        <Field
          label="Kullanıcı adı"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          help="Küçük harf, rakam ve alt çizgi. Örn: kartal_1903"
          required
        />
        <Field label="E-posta" name="email" type="email" autoComplete="email" required />
        <Field label="Telefon" name="phone" type="tel" autoComplete="tel" help="İsteğe bağlı" />
        <Field label="Şehir" name="city" autoComplete="address-level1" required />
        <Field label="Tribün" name="tribune" help="İsteğe bağlı. Örn: Kapalı, Deplasman" />
      </div>

      <Field
        label="Instagram kullanıcı adı"
        name="instagram"
        autoCapitalize="none"
        help="İsteğe bağlı"
      />

      <TextArea
        label="Neden Kara Sancak?"
        name="motivation"
        rows={5}
        help="Beşiktaş ve Cumhuriyet senin için ne ifade ediyor? En az 30 karakter."
        required
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Şifre"
          name="password"
          type="password"
          autoComplete="new-password"
          help="En az 8 karakter. Onaylandığında bu şifreyle gireceksin."
          required
        />
        <Field label="Şifre tekrar" name="passwordConfirm" type="password" autoComplete="new-password" required />
      </div>

      {/* Botlar için görünmez alan */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="website">Web siteniz</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <CheckboxField
        name="kvkk"
        required
        label={
          <>
            <Link href="/kvkk" target="_blank" className="font-semibold text-bone underline underline-offset-2">
              KVKK aydınlatma metnini
            </Link>{" "}
            okudum, başvurumun değerlendirilmesi için kişisel verilerimin işlenmesini kabul ediyorum.
          </>
        }
      />

      <SubmitButton size="xl" pendingLabel="Gönderiliyor...">
        Başvur
      </SubmitButton>
    </ActionForm>
  );
}
