import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./session";

/**
 * Yetki kontrolünün tek kapısı. Her sayfa ve her Server Action veriye dokunmadan
 * önce bunlardan birini çağırır. Arayüzde butonu gizlemek yetki kontrolü sayılmaz.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/panel");
  return user;
}

/** Yönetici veya moderatör */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!isStaff(user)) redirect("/panel");
  return user;
}

export const isStaff = (user: Pick<CurrentUser, "role"> | null | undefined) =>
  user?.role === "admin" || user?.role === "moderator";
