import Link from "next/link";
import { Avatar } from "@/components/member/avatar";
import { ChatsCircle } from "@/components/ui/icons";
import { requireUser } from "@/lib/auth/dal";
import { timeAgo } from "@/lib/format";
import { listConversations } from "@/lib/queries/messages";
import { NewConversation } from "./new-conversation";
import { requestTime } from "@/lib/request";

export async function ConversationList() {
  const user = await requireUser();
  const conversations = await listConversations(user.id);
  const now = await requestTime();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-4">
        <h1 className="display text-3xl">Mesajlar</h1>
        <div className="mt-3">
          <NewConversation />
        </div>
      </div>
      <ul className="flex-1 divide-y divide-line overflow-y-auto">
        {conversations.map((c) => {
          const title = c.type === "room" ? (c.title ?? "Tribün") : (c.other?.displayName ?? "Üye");
          const preview = c.last
            ? `${c.last.senderId === user.id ? "Sen: " : c.type === "room" ? `${c.last.senderName}: ` : ""}${c.last.body}`
            : "Henüz mesaj yok";
          return (
            <li key={c.id}>
              <Link href={`/mesajlar/${c.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-coal">
                {c.type === "room" ? (
                  <span className="shield flex size-11 shrink-0 items-center justify-center bg-al text-bone">
                    <ChatsCircle size={22} />
                  </span>
                ) : c.other ? (
                  <Avatar user={c.other} size="md" />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">{title}</span>
                    {c.last && <span className="shrink-0 text-xs text-smoke">{timeAgo(c.last.createdAt, now)}</span>}
                  </span>
                  <span className={`mt-0.5 block truncate text-sm ${c.unread > 0 ? "font-medium text-bone" : "text-smoke"}`}>
                    {preview}
                  </span>
                </span>
                {c.unread > 0 && c.type === "direct" && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center bg-al px-1 text-xs font-bold">
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
