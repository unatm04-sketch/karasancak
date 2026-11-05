import "server-only";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

/** Yönetim işlemlerinin kaydı. Birden fazla yönetici olduğunda kimin ne yaptığı görünür. */
export async function logAudit(
  actorId: string,
  action: string,
  summary: string,
  target?: { type: string; id: string },
): Promise<void> {
  await db.insert(auditLogs).values({
    id: newId(),
    actorId,
    action,
    summary,
    targetType: target?.type ?? null,
    targetId: target?.id ?? null,
    createdAt: Date.now(),
  });
}
