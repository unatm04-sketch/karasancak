import { ChatCircleDots } from "@/components/ui/icons";

export default function MessagesIndexPage() {
  return (
    <div className="flex h-full min-h-[60dvh] flex-col items-center justify-center p-10 text-center">
      <ChatCircleDots size={44} className="text-smoke" />
      <p className="display mt-4 text-3xl">Bir sohbet seç</p>
      <p className="mt-2 max-w-sm text-sm text-fog">
        Tribün sohbetine katıl ya da yukarıdan bir üye arayıp yeni sohbet başlat.
      </p>
    </div>
  );
}
