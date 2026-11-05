import Link from "next/link";
import { Avatar } from "@/components/member/avatar";
import { LevelBadge, MemberLink, RankBadge, RoleBadge } from "@/components/member/badges";
import { ConfirmButton } from "@/components/ui/form";
import { PencilSimple, Trash } from "@/components/ui/icons";
import { deletePost } from "@/lib/actions/forum";
import { formatDateTime } from "@/lib/format";
import type { AuthorSummary } from "@/lib/queries/forum";
import { LikeButton } from "./like-button";
import { RichText } from "./rich-text";

export type PostData = {
  id: string;
  body: string;
  isOpening: boolean;
  likeCount: number;
  createdAt: number;
  editedAt: number | null;
  likedByViewer: boolean;
  author: AuthorSummary;
};

export function PostCard({
  post,
  viewerId,
  viewerIsStaff,
}: {
  post: PostData;
  viewerId: string | null;
  viewerIsStaff: boolean;
}) {
  const own = viewerId === post.author.id;
  const canManage = own || viewerIsStaff;

  return (
    <article id={`yazi-${post.id}`} className="panel scroll-mt-24 md:grid md:grid-cols-[190px_1fr]">
      <aside className="flex items-center gap-3 border-b border-line p-4 md:flex-col md:items-start md:border-b-0 md:border-r">
        <Avatar user={post.author} size="lg" className="max-md:size-11 max-md:text-sm" />
        <div className="min-w-0 space-y-1.5">
          <MemberLink username={post.author.username} displayName={post.author.displayName} className="block truncate" />
          <div className="flex flex-wrap items-center gap-2">
            <RankBadge name={post.author.rankName} order={post.author.rankOrder} />
            <RoleBadge role={post.author.role} />
          </div>
          <LevelBadge level={post.author.level} className="block" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col p-4 md:p-6">
        <RichText text={post.body} className="flex-1 text-[15px] text-bone/95" />
        <footer className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-smoke">
          <LikeButton
            postId={post.id}
            initial={{ liked: post.likedByViewer, count: post.likeCount }}
            canLike={!own}
            loggedIn={viewerId !== null}
          />
          <time dateTime={new Date(post.createdAt).toISOString()}>{formatDateTime(post.createdAt)}</time>
          {post.editedAt && <span>düzenlendi</span>}
          {canManage && (
            <span className="ml-auto flex items-center gap-1">
              <Link
                href={`/forum/duzenle/${post.id}`}
                className="inline-flex h-9 items-center gap-1.5 px-2 text-fog hover:text-bone"
              >
                <PencilSimple size={15} />
                Düzenle
              </Link>
              <ConfirmButton
                action={deletePost.bind(null, post.id)}
                message={post.isOpening ? "Konunun tamamı silinecek. Emin misin?" : "Bu yazı silinecek. Emin misin?"}
                className="inline-flex h-9 items-center gap-1.5 px-2 text-fog hover:text-al-bright"
              >
                <Trash size={15} />
                Sil
              </ConfirmButton>
            </span>
          )}
        </footer>
      </div>
    </article>
  );
}
