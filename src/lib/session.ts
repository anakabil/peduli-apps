import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "./db";
import type { Role } from "./constants";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

const loadUser = cache(async () => {
  const session = await auth().catch(() => null);
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.user.findUnique({
    where: { id },
    include: { area: true, atasan: { select: { id: true, name: true, role: true } } },
  });
  return user;
});

export async function getCurrentUser() {
  return loadUser();
}

/** Mewajibkan pengguna aktif; opsional membatasi peran */
export async function requireUser(roles?: Role[]) {
  const user = await loadUser();
  if (!user) redirect("/masuk");
  if (user.status !== "ACTIVE") redirect("/menunggu");
  if (roles && !roles.includes(user.role as Role)) redirect("/beranda?error=akses");
  return user;
}

export function hasRole(user: { role: string }, roles: Role[]) {
  return roles.includes(user.role as Role);
}
