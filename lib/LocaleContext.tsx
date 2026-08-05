"use client";
import { createContext, useContext, useState } from "react";
import { Locale, translations, T } from "./i18n";

interface LocaleCtx { locale: Locale; t: T; setLocale: (l: Locale) => void; }
const Ctx = createContext<LocaleCtx>({} as LocaleCtx);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");
  return (
    <Ctx.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLocale = () => useContext(Ctx);