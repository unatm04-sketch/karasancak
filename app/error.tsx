"use client";

import { useEffect } from "react";
import { buttonClass } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center bg-ink px-6 py-20 text-center">
      <h1 className="display text-5xl md:text-7xl">Bir şeyler ters gitti</h1>
      <p className="mt-4 max-w-md text-fog">Beklenmeyen bir hata oluştu. Tekrar deneyebilirsin.</p>
      <button type="button" onClick={reset} className={`${buttonClass("primary", "lg")} mt-8`}>
        Tekrar dene
      </button>
    </div>
  );
}
