"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/member/avatar";
import { startConversation } from "@/lib/actions/messages";

type Result = { id: string; username: string; displayName: string; avatarVersion: number };

/** Üye adına göre arayıp yeni sohbet başlatır. */
export function NewConversation() {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Result[]>([]);
  const q = query.trim();
  const results = q.length >= 2 ? found : [];

  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/uyeler?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (res.ok) setFound((await res.json()).members);
      } catch {
        // İstek iptal edildi veya bağlantı koptu.
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  return (
    <div className="relative">
      <label htmlFor="uye-ara" className="sr-only">
        Yeni sohbet için üye ara
      </label>
      <input
        id="uye-ara"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Yeni sohbet için üye ara"
        autoComplete="off"
        className="input py-2 text-sm"
      />
      {results.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 border border-line bg-coal shadow-[0_18px_40px_rgb(0_0_0/0.55)]">
          {results.map((member) => (
            <li key={member.id}>
              <form action={startConversation.bind(null, member.username)}>
                <button type="submit" className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-ash">
                  <Avatar user={member} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{member.displayName}</span>
                    <span className="block truncate text-xs text-smoke">@{member.username}</span>
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
