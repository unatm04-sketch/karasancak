import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { avatars } from "@/lib/db/schema";

/** Üye görseli. Adresteki ?v= sürümü değiştiği için uzun süre önbelleğe alınabilir. */
export async function GET(_request: NextRequest, context: RouteContext<"/api/avatar/[id]">) {
  const { id } = await context.params;
  const [row] = await db.select().from(avatars).where(eq(avatars.userId, id)).limit(1);
  if (!row) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
