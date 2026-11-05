import type { ZodError } from "zod";

/** Tüm form Server Action'larının ortak dönüş tipi */
export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Forma geri gönderilecek ek veri (ör. üretilen aktivasyon linki) */
  data?: Record<string, string>;
};

export const initialFormState: FormState = {};

// Bu dosya istemci koduna da girer; Zod'u pakete taşımamak için yalnızca tipi kullanılır.
export function fromZodError(error: ZodError): FormState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key) (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, message: "Lütfen işaretli alanları kontrol et.", fieldErrors };
}

export const failure = (message: string): FormState => ({ ok: false, message });
export const fieldFailure = (field: string, message: string): FormState => ({
  ok: false,
  message: "Lütfen işaretli alanları kontrol et.",
  fieldErrors: { [field]: [message] },
});
