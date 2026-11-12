"use client";

import { createContext, useContext, useMemo } from "react";
import { makeTr, type Lang, type Tr } from "@/lib/i18n";

const Ctx = createContext<{ lang: Lang; tr: Tr }>({ lang: "id", tr: makeTr("id") });

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, tr: makeTr(lang) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx).lang;
export const useTr = () => useContext(Ctx).tr;
