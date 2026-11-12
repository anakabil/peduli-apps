import { cookies } from "next/headers";
import { LANG_COOKIE, isLang, makeTr, type Lang } from "./i18n";

/** Bahasa tampilan dari cookie; bawaan Bahasa Indonesia */
export async function getLang(): Promise<Lang> {
  try {
    const v = (await cookies()).get(LANG_COOKIE)?.value;
    return isLang(v) ? v : "id";
  } catch {
    return "id";
  }
}

export async function getTr() {
  const lang = await getLang();
  return { lang, tr: makeTr(lang) };
}
