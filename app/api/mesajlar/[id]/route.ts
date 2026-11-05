import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getConversationAccess, listMessages, markConversationRead } from "@/lib/queries/messages";

/** Sohbet ekranının yeni mesajları almak için kısa aralıklarla çağırdığı uç */
export async function GET(request: NextRequest, context: RouteContext<"/api/mesajlar/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await context.params;
  const access = await getConversationAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const after = Number(request.nextUrl.searchParams.get("after")) || undefined;
  const messages = await listMessages(id, { after, limit: 100 });
  const newest = messages[messages.length - 1];
  if (newest) await markConversationRead(id, user.id, newest.createdAt);

  return NextResponse.json({ messages }, { headers: { "Cache-Control": "private, no-store" } });
}
