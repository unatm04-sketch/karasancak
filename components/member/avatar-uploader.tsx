"use client";

import { useRef, useState, useTransition } from "react";
import { removeAvatar, uploadAvatar } from "@/lib/actions/profile";
import { buttonClass } from "@/components/ui/button";
import { Avatar } from "./avatar";

const TARGET_SIZE = 256;

/** Görseli tarayıcıda ortadan kırpıp küçültür. Sunucuya en fazla birkaç on KB gider. */
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    TARGET_SIZE,
    TARGET_SIZE,
  );
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), "image/webp", 0.85);
  });
}

export function AvatarUploader({
  user,
}: {
  user: { id: string; displayName: string; avatarVersion: number };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="panel flex flex-wrap items-center gap-5 p-5 md:p-7">
      <Avatar user={user} size="xl" />
      <div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className={buttonClass("ghost", "md")}
          >
            {pending ? "Yükleniyor..." : "Görsel seç"}
          </button>
          {user.avatarVersion > 0 && (
            <form action={removeAvatar}>
              <button type="submit" className={buttonClass("quiet", "md")}>
                Kaldır
              </button>
            </form>
          )}
        </div>
        <p className="mt-2 text-xs text-smoke">JPEG, PNG veya WebP. Arma biçiminde kırpılır.</p>
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-al-bright">
            {error}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Profil görseli seç"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setError(null);
            startTransition(async () => {
              try {
                const blob = await shrinkImage(file);
                const data = new FormData();
                data.set("avatar", new File([blob], "avatar.webp", { type: blob.type }));
                const result = await uploadAvatar(data);
                if (result.error) setError(result.error);
              } catch {
                setError("Bu görsel okunamadı. Başka bir görsel dene.");
              }
            });
          }}
        />
      </div>
    </div>
  );
}
