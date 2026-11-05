import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { unreadNotificationCount } from "@/lib/notifications";
import { unreadConversationCount } from "@/lib/queries/messages";
import { LiveBadges } from "./live-badges";
import { UserMenu } from "./user-menu";

/** Oturuma göre değişen sağ üst köşe. Çerez okuduğu için Suspense içinde akar. */
export async function HeaderUser() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <Link
          href="/giris"
          className="hidden h-11 items-center px-3 text-sm font-medium text-fog hover:text-bone sm:inline-flex"
        >
          Giriş
        </Link>
        <Link href="/basvuru" className={buttonClass("primary", "sm", "sm:h-11 sm:px-5 sm:text-sm")}>
          Sürüye Katıl
        </Link>
      </>
    );
  }

  const [notifications, messages] = await Promise.all([
    unreadNotificationCount(user.id),
    unreadConversationCount(user.id),
  ]);

  return (
    <>
      <LiveBadges initialNotifications={notifications} initialMessages={messages} />
      <UserMenu
        user={{
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarVersion: user.avatarVersion,
          level: user.level,
          role: user.role,
        }}
      />
    </>
  );
}
