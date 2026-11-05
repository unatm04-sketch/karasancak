"use client";

import { useEffect, useState } from "react";

const UNITS = [
  { label: "Gün", ms: 86_400_000 },
  { label: "Saat", ms: 3_600_000 },
  { label: "Dakika", ms: 60_000 },
  { label: "Saniye", ms: 1000 },
];

/** Sunucu ile istemci saat farkı hidrasyon hatası vermesin diye değerler yüklemeden sonra gelir. */
export function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (now !== null && now >= target) {
    return <p className="display text-4xl text-al-bright">Maç başladı</p>;
  }

  const remaining = now === null ? 0 : target - now;
  const parts = UNITS.map((unit, index) => {
    const larger = UNITS[index - 1];
    const value = larger ? remaining % larger.ms : remaining;
    return { label: unit.label, value: Math.floor(value / unit.ms) };
  });

  return (
    <div className="flex gap-5 md:gap-8" role="timer" aria-label="Maça kalan süre">
      {parts.map((part) => (
        <div key={part.label}>
          <p className="display text-5xl tabular-nums md:text-7xl">
            {now === null ? "--" : String(part.value).padStart(2, "0")}
          </p>
          <p className="mt-2 text-xs font-medium text-fog md:text-sm">{part.label}</p>
        </div>
      ))}
    </div>
  );
}
