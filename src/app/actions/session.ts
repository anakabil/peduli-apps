"use server";

import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";

/** Keluar dari akun; notifikasi ponsel untuk perangkat ini ikut dilepas agar tidak sampai ke pengguna berikutnya */
export async function logoutAction(fd: FormData) {
  const endpoint = String(fd.get("pushEndpoint") ?? "");
  const session = await auth().catch(() => null);
  if (endpoint && session?.user?.id) await db.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } }).catch(() => {});
  await signOut({ redirectTo: "/masuk" });
}
