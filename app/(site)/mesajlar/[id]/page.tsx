import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChatRoom } from "@/components/messages/chat-room";
import { Skeleton } from "@/components/ui/page";
import { requireUser } from "@/lib/auth/dal";
import { getConversationAccess, listMessages, markConversationRead } from "@/lib/queries/messages";

export default function ConversationPage({ params }: PageProps<"/mesajlar/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[70dvh] w-full" />}>
      <Conversation params={params} />
    </Suspense>
  );
}

async function Conversation({ params }: Pick<PageProps<"/mesajlar/[id]">, "params">) {
  const [{ id }, me] = await Promise.all([params, requireUser()]);
  const access = await getConversationAccess(id, me.id);
  if (!access) notFound();

  const messages = await listMessages(id, { limit: 80 });
  const newest = messages[messages.length - 1];
  if (newest) await markConversationRead(id, me.id, newest.createdAt);

  return (
    <ChatRoom
      key={id}
      conversationId={id}
      meId={me.id}
      isStaff={me.role === "admin" || me.role === "moderator"}
      title={access.type === "room" ? (access.title ?? "Tribün") : (access.other?.displayName ?? "Sohbet")}
      subtitle={access.type === "room" ? "Tüm üyelere açık ortak sohbet" : access.other ? `@${access.other.username}` : undefined}
      peer={access.type === "direct" ? access.other : null}
      isRoom={access.type === "room"}
      initialMessages={messages}
    />
  );
}
