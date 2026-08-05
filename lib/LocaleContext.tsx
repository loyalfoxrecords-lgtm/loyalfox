"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Locale, T } from "./i18n";

type LocaleCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: T;
};

const Ctx = createContext<LocaleCtx>({
  locale: "es",
  setLocale: () => {},
  t: translations.es,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  // Detectar idioma del navegador al cargar
  useEffect(() => {
    const saved = localStorage.getItem("loyalfox-locale") as Locale | null;
    if (saved && ["es","en","de"].includes(saved)) {
      setLocaleState(saved);
      return;
    }
    const browserLang = navigator.language.slice(0,2).toLowerCase();
    if (browserLang === "de") setLocaleState("de");
    else if (browserLang === "en") setLocaleState("en");
    else setLocaleState("es");
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("loyalfox-locale", l);
  };

  return (
    <Ctx.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLocale() {
  return useContext(Ctx);
}