"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LANG_COOKIE, isLang } from "@/lib/i18n";

/** Menyimpan pilihan bahasa di perangkat (cookie) dan di akun, agar notifikasi ikut berbahasa sama */
export async function setLangAction(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const session = await auth().catch(() => null);
  if (session?.user?.id) await db.user.update({ where: { id: session.user.id }, data: { lang } }).catch(() => {});
}
