type Variant = "primary" | "light" | "ghost" | "danger" | "quiet";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-al text-bone hover:bg-al-dark",
  light: "bg-bone text-ink hover:bg-white",
  ghost: "border border-line text-bone hover:border-bone",
  danger: "border border-al/70 text-al-bright hover:bg-al hover:text-bone hover:border-al",
  quiet: "text-fog hover:text-bone",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-xs font-semibold uppercase tracking-wide",
  md: "h-11 px-5 text-sm font-semibold uppercase tracking-wide",
  lg: "h-12 px-6 text-sm font-bold uppercase tracking-wide",
  // Afiş düğmesi: başlık yazı tipiyle
  xl: "h-14 px-8 font-display text-xl uppercase tracking-[0.02em]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = ""): string {
  return [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-[background-color,color,border-color,transform] duration-200",
    "active:translate-y-px disabled:opacity-50 disabled:pointer-events-none select-none",
    VARIANTS[variant],
    SIZES[size],
    extra,
  ].join(" ");
}
