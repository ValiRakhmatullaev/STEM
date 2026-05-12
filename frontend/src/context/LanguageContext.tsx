import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Locale, TRANSLATIONS } from "../i18n/translations";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "stem_lang";

function getInitialLocale(): Locale {
  const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (saved === "ru" || saved === "uz" || saved === "en") return saved;

  const browser = typeof navigator !== "undefined" ? navigator.language : "ru";
  if (browser.toLowerCase().startsWith("uz")) return "uz";
  if (browser.toLowerCase().startsWith("en")) return "en";
  return "ru";
}

function getByPath(obj: any, path: string): unknown {
  return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = (next: Locale) => setLocaleState(next);

  const t = (key: string) => {
    const valueRu = getByPath(TRANSLATIONS.ru, key);
    const valueSelected = getByPath(TRANSLATIONS[locale], key);
    const resolved = (typeof valueSelected === "string" ? valueSelected : valueRu) as unknown;
    return typeof resolved === "string" ? resolved : key;
  };

  const ctx = useMemo(() => ({ locale, setLocale, t }), [locale]);

  return <LanguageContext.Provider value={ctx}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

