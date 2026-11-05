import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { searchMembers } from "@/lib/queries/members";

/** Yeni sohbet kutusundaki üye araması. Yalnızca giriş yapmış üyeler arayabilir. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ members: [] }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ members: [] });

  const members = await searchMembers(q, 8, user.id);
  return NextResponse.json(
    {
      members: members.map((m) => ({
        id: m.id,
        username: m.username,
        displayName: m.displayName,
        avatarVersion: m.avatarVersion,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
