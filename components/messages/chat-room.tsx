"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Avatar } from "@/components/member/avatar";
import { LevelBadge, RankBadge } from "@/components/member/badges";
import { buttonClass } from "@/components/ui/button";
import { CaretRight, PaperPlaneTilt, Trash } from "@/components/ui/icons";
import { clearMessage, sendMessage } from "@/lib/actions/messages";
import type { AuthorSummary } from "@/lib/queries/forum";
import type { MessageDTO } from "@/lib/queries/messages";

const POLL_MS = 3500;

const timeFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
});
const dayFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
});

type Props = {
  conversationId: string;
  meId: string;
  isStaff: boolean;
  isRoom: boolean;
  title: string;
  subtitle?: string;
  peer: AuthorSummary | null;
  initialMessages: MessageDTO[];
};

export function ChatRoom({ conversationId, meId, isStaff, isRoom, title, subtitle, peer, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const newestRef = useRef(initialMessages[initialMessages.length - 1]?.createdAt ?? 0);

  // Yeni mesaj geldiğinde yalnızca kullanıcı zaten en alttaysa aşağı kaydır.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const merge = useCallback((incoming: MessageDTO[]) => {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const known = new Set(current.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      return fresh.length > 0 ? [...current, ...fresh] : current;
    });
    const newest = incoming[incoming.length - 1]!.createdAt;
    if (newest > newestRef.current) newestRef.current = newest;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/mesajlar/${conversationId}?after=${newestRef.current}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { messages: MessageDTO[] };
        if (!cancelled) merge(data.messages);
      } catch {
        // Bağlantı koptuysa bir sonraki turda yeniden denenir.
      }
    };
    const interval = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [conversationId, merge]);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    stickToBottom.current = true;
    const result = await sendMessage(conversationId, text);
    setSending(false);
    if (result.ok) {
      setBody("");
      merge([result.message]);
    } else {
      setError(result.error);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <div className="flex h-[calc(100dvh-68px)] flex-col md:h-[calc(100dvh-68px-4rem)]">
      <header className="flex items-center gap-3 border-b border-line p-4">
        <Link href="/mesajlar" aria-label="Sohbetlere dön" className="rotate-180 text-fog hover:text-bone md:hidden">
          <CaretRight size={20} />
        </Link>
        {peer && <Avatar user={peer} size="sm" />}
        <div className="min-w-0 flex-1">
          {peer ? (
            <Link href={`/uye/${peer.username}`} className="block truncate font-semibold hover:text-al-bright">
              {title}
            </Link>
          ) : (
            <p className="display text-2xl">{title}</p>
          )}
          {subtitle && <p className="truncate text-xs text-smoke">{subtitle}</p>}
        </div>
        {peer && <RankBadge name={peer.rankName} order={peer.rankOrder} />}
      </header>

      <div
        ref={scrollerRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 space-y-1 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="Mesajlar"
      >
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-fog">İlk mesajı sen yaz.</p>
        )}
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const mine = message.sender.id === meId;
          const grouped =
            previous?.sender.id === message.sender.id && message.createdAt - previous.createdAt < 5 * 60 * 1000;
          const newDay =
            !previous || dayFormat.format(previous.createdAt) !== dayFormat.format(message.createdAt);
          return (
            <div key={message.id}>
              {newDay && (
                <p className="my-4 text-center text-xs text-smoke">{dayFormat.format(message.createdAt)}</p>
              )}
              <div className={`group flex gap-2.5 ${mine ? "flex-row-reverse" : ""} ${grouped ? "" : "mt-3"}`}>
                {isRoom && !mine && (
                  <div className="w-9 shrink-0">{!grouped && <Avatar user={message.sender} size="sm" />}</div>
                )}
                <div className={`flex min-w-0 max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
                  {isRoom && !mine && !grouped && (
                    <div className="mb-1 flex items-center gap-2">
                      <Link href={`/uye/${message.sender.username}`} className="text-sm font-semibold hover:text-al-bright">
                        {message.sender.displayName}
                      </Link>
                      <LevelBadge level={message.sender.level} />
                    </div>
                  )}
                  <div
                    className={`whitespace-pre-wrap break-words px-3 py-2 text-[15px] leading-snug ${
                      mine ? "bg-bone text-ink" : "bg-ash text-bone"
                    }`}
                  >
                    {message.body}
                  </div>
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-smoke">
                    {timeFormat.format(message.createdAt)}
                    {(mine || isStaff) && (
                      <button
                        type="button"
                        aria-label="Mesajı sil"
                        className="opacity-0 transition-opacity hover:text-al-bright focus-visible:opacity-100 group-hover:opacity-100"
                        onClick={async () => {
                          if (!window.confirm("Bu mesaj silinsin mi?")) return;
                          await clearMessage(message.id);
                          setMessages((current) => current.filter((m) => m.id !== message.id));
                        }}
                      >
                        <Trash size={13} />
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="border-t border-line p-3">
        {error && (
          <p role="alert" className="mb-2 text-xs font-medium text-al-bright">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="mesaj" className="sr-only">
            Mesajın
          </label>
          <textarea
            id="mesaj"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            placeholder="Mesajını yaz, Enter ile gönder"
            className="input max-h-40 flex-1 resize-none"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            aria-label="Gönder"
            className={buttonClass("primary", "md", "shrink-0 px-4")}
          >
            <PaperPlaneTilt size={18} weight="fill" />
          </button>
        </div>
      </form>
    </div>
  );
}
