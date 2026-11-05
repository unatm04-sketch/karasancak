"use client";

import { startTransition } from "react";
import { CopyField } from "@/components/ui/form";
import { ShareNetwork, TelegramLogo, WhatsappLogo, XLogo } from "@/components/ui/icons";
import { recordReferralShare } from "@/lib/actions/engagement";
import { buttonClass } from "@/components/ui/button";

const MESSAGE = "Gökte Kartal, Yerde Bozkurt. Kara Sancak 1903 saflarına seni de bekliyorum:";

export function ReferralShare({ url }: { url: string }) {
  const text = encodeURIComponent(`${MESSAGE} ${url}`);
  const channels = [
    { label: "WhatsApp", href: `https://wa.me/?text=${text}`, icon: <WhatsappLogo size={18} /> },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(MESSAGE)}`,
      icon: <TelegramLogo size={18} />,
    },
    { label: "X", href: `https://x.com/intent/post?text=${text}`, icon: <XLogo size={18} /> },
  ];

  const record = () => startTransition(() => recordReferralShare());

  return (
    <div>
      <CopyField value={url} />
      <div className="mt-3 flex flex-wrap gap-2">
        {channels.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={record}
            className={buttonClass("ghost", "sm")}
          >
            {channel.icon}
            {channel.label}
          </a>
        ))}
        <button
          type="button"
          className={buttonClass("ghost", "sm")}
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({ title: "Kara Sancak 1903", text: MESSAGE, url });
                record();
              } catch {
                // Kullanıcı paylaşımdan vazgeçti.
              }
            } else {
              await navigator.clipboard.writeText(url);
              record();
            }
          }}
        >
          <ShareNetwork size={18} />
          Paylaş
        </button>
      </div>
    </div>
  );
}
