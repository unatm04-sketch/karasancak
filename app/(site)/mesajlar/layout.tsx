import type { ReactNode } from "react";
import { Suspense } from "react";
import { ConversationList } from "@/components/messages/conversation-list";
import { MessagesShell } from "@/components/messages/messages-shell";
import { ListSkeleton, Skeleton } from "@/components/ui/page";

export const metadata = { title: "Mesajlar", robots: { index: false } };

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-8 h-[70dvh] w-full max-w-[1400px]" />}>
      <MessagesShell
        list={
          <Suspense fallback={<ListSkeleton rows={5} />}>
            <ConversationList />
          </Suspense>
        }
      >
        {children}
      </MessagesShell>
    </Suspense>
  );
}
