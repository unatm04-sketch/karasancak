"use client";

import {
  createContext,
  startTransition,
  use,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Check, Copy } from "@/components/ui/icons";
import { initialFormState, type FormState } from "@/lib/form-state";
import { buttonClass } from "./button";

type ContextValue = { state: FormState; pending: boolean };
const FormContext = createContext<ContextValue>({ state: initialFormState, pending: false });

type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

/**
 * Server Action'a bağlı form. Hata ve bekleme durumunu alan bileşenlerine dağıtır.
 *
 * `action` prop'u JavaScript yüklenmeden de formun çalışmasını sağlar. JavaScript
 * yüklendikten sonra onSubmit devreye girer; böylece React formu otomatik sıfırlamaz
 * ve doğrulama hatasında kullanıcının yazdıkları kaybolmaz.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  id,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  id?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <FormContext value={{ state, pending }}>
      <form
        ref={ref}
        id={id}
        action={formAction}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => formAction(data));
        }}
        className={className}
      >
        {children}
      </form>
    </FormContext>
  );
}

function useFieldError(name: string) {
  const { state } = use(FormContext);
  return state.fieldErrors?.[name]?.[0];
}

function FieldShell({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-bone">
        {label}
      </label>
      {children}
      {help && !error && (
        <p id={`${id}-yardim`} className="text-xs leading-relaxed text-smoke">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-hata`} role="alert" className="text-xs font-medium text-al-bright">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, help: unknown, error: unknown) {
  if (error) return `${id}-hata`;
  return help ? `${id}-yardim` : undefined;
}

export function Field({
  label,
  name,
  help,
  ...props
}: Omit<ComponentProps<"input">, "name"> & { label: ReactNode; name: string; help?: ReactNode }) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <FieldShell id={id} label={label} help={help} error={error}>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, help, error)}
        {...props}
        className={`input ${props.className ?? ""}`}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  name,
  help,
  ...props
}: Omit<ComponentProps<"textarea">, "name"> & { label: ReactNode; name: string; help?: ReactNode }) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <FieldShell id={id} label={label} help={help} error={error}>
      <textarea
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, help, error)}
        {...props}
        className={`input resize-y ${props.className ?? ""}`}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  help,
  children,
  ...props
}: Omit<ComponentProps<"select">, "name"> & { label: ReactNode; name: string; help?: ReactNode }) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <FieldShell id={id} label={label} help={help} error={error}>
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, help, error)}
        {...props}
        className={`input ${props.className ?? ""}`}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  name,
  help,
  ...props
}: Omit<ComponentProps<"input">, "name" | "type"> & {
  label: ReactNode;
  name: string;
  help?: ReactNode;
}) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-relaxed text-fog">
        <input
          id={id}
          name={name}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          {...props}
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-al)]"
        />
        <span>{label}</span>
      </label>
      {help && !error && <p className="pl-8 text-xs text-smoke">{help}</p>}
      {error && (
        <p role="alert" className="pl-8 text-xs font-medium text-al-bright">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Gönderiliyor...",
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: Parameters<typeof buttonClass>[0];
  size?: Parameters<typeof buttonClass>[1];
  className?: string;
}) {
  const { pending } = use(FormContext);
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, size, className)}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Formun genel sonucu: üstte veya düğmenin yanında görünür. */
export function FormMessage({ className = "" }: { className?: string }) {
  const { state } = use(FormContext);
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`border-l-4 py-2 pl-3 text-sm leading-relaxed ${
        state.ok ? "border-bone text-bone" : "border-al text-al-bright"
      } ${className}`}
    >
      {state.message}
    </p>
  );
}

/** Üretilen aktivasyon linki gibi tek seferlik değerleri gösterir. */
export function GeneratedLink({ label = "Aktivasyon linki" }: { label?: string }) {
  const { state } = use(FormContext);
  const link = state.data?.link;
  if (!link) return null;
  return (
    <div className="border border-line bg-ink p-4">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2">
        <CopyField value={link} />
      </div>
    </div>
  );
}

export function CopyField({ value, label = "Kopyala" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={value}
        aria-label="Kopyalanacak link"
        onFocus={(event) => event.currentTarget.select()}
        className="input min-w-0 flex-1 font-mono text-xs"
      />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }}
        className={buttonClass("ghost", "md", "shrink-0")}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Kopyalandı" : label}
      </button>
    </div>
  );
}

/** Geri alınamaz işlemlerde onay soran tek düğmelik form */
export function ConfirmButton({
  action,
  message,
  children,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
