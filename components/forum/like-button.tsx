"use client";

import Link from "next/link";
import { startTransition, useOptimistic, useState } from "react";
import { ThumbsUp } from "@/components/ui/icons";
import { toggleLike } from "@/lib/actions/forum";

type LikeState = { liked: boolean; count: number };

export function LikeButton({
  postId,
  initial,
  canLike,
  loggedIn,
}: {
  postId: string;
  initial: LikeState;
  canLike: boolean;
  loggedIn: boolean;
}) {
  const [state, setState] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(state);

  const className = `inline-flex h-9 items-center gap-2 border px-3 text-sm font-medium transition-colors ${
    optimistic.liked
      ? "border-al bg-al text-bone"
      : "border-line text-fog hover:border-bone hover:text-bone"
  }`;

  if (!loggedIn) {
    return (
      <Link href="/giris" className={className} title="Beğenmek için giriş yap">
        <ThumbsUp size={16} />
        {optimistic.count}
      </Link>
    );
  }

  if (!canLike) {
    return (
      <span className="inline-flex h-9 items-center gap-2 px-1 text-sm text-smoke" title="Kendi yazın">
        <ThumbsUp size={16} />
        {optimistic.count}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={optimistic.liked}
      aria-label={optimistic.liked ? "Beğeniyi kaldır" : "Beğen"}
      className={className}
      onClick={() => {
        startTransition(async () => {
          setOptimistic({
            liked: !optimistic.liked,
            count: optimistic.count + (optimistic.liked ? -1 : 1),
          });
          const result = await toggleLike(postId);
          if (result) startTransition(() => setState(result));
        });
      }}
    >
      <ThumbsUp size={16} weight={optimistic.liked ? "fill" : "regular"} />
      {optimistic.count}
    </button>
  );
}
