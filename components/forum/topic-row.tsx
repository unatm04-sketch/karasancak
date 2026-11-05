import Link from "next/link";
import { Avatar } from "@/components/member/avatar";
import { RankBadge } from "@/components/member/badges";
import { ChatCircleDots, Eye, Lock, PushPin } from "@/components/ui/icons";
import { formatNumber, timeAgo } from "@/lib/format";
import type { AuthorSummary } from "@/lib/queries/forum";

export type TopicRowData = {
  id: string;
  slug: string;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  lastPostAt: number;
  categorySlug: string;
  categoryName: string;
  lastPosterName: string | null;
  author: AuthorSummary;
};

export function TopicRow({
  topic,
  now,
  showCategory = false,
}: {
  topic: TopicRowData;
  now: number;
  showCategory?: boolean;
}) {
  return (
    <li className="group relative flex gap-4 border-b border-line py-4 last:border-b-0">
      <Avatar user={topic.author} size="md" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          {topic.isPinned && <PushPin size={16} weight="fill" className="mt-1 shrink-0 text-al-bright" aria-label="Başa tutturuldu" />}
          {topic.isLocked && <Lock size={16} className="mt-1 shrink-0 text-smoke" aria-label="Yanıtlara kapalı" />}
          <h3 className="font-semibold leading-snug">
            <Link href={`/forum/konu/${topic.slug}`} className="after:absolute after:inset-0 group-hover:text-al-bright">
              {topic.title}
            </Link>
          </h3>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-smoke">
          <span className="text-fog">{topic.author.displayName}</span>
          <RankBadge name={topic.author.rankName} order={topic.author.rankOrder} />
          {showCategory && (
            <Link href={`/forum/${topic.categorySlug}`} className="relative z-10 underline-offset-2 hover:text-bone hover:underline">
              {topic.categoryName}
            </Link>
          )}
          <span>
            {topic.lastPosterName ? `Son yazan ${topic.lastPosterName}, ` : ""}
            {timeAgo(topic.lastPostAt, now)}
          </span>
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-5 text-sm text-fog sm:flex">
        <span className="flex items-center gap-1.5" title="Yanıt">
          <ChatCircleDots size={18} aria-label="Yanıt" />
          {formatNumber(topic.replyCount)}
        </span>
        <span className="flex w-14 items-center gap-1.5 text-smoke" title="Görüntülenme">
          <Eye size={18} aria-label="Görüntülenme" />
          {formatNumber(topic.viewCount)}
        </span>
      </div>
    </li>
  );
}
