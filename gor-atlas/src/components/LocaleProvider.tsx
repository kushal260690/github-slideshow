"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  getDictionary,
  isLocale,
  localeDefinition,
  type Dictionary,
  type LocaleCode,
  type LocaleDefinition,
} from "@/i18n";

/**
 * Interface locale, actually applied.
 *
 * Resolution order on first load, most explicit first:
 *   1. `?lang=` in the URL — so a locale is shareable as a link
 *   2. the visitor's previous choice, from localStorage
 *   3. the browser's own language preferences
 *   4. English
 *
 * The URL is read from `window.location` inside an effect rather than through
 * `useSearchParams`, deliberately: this provider wraps the whole app, and
 * `useSearchParams` would opt every page out of static rendering. Switching
 * afterwards goes through `setLocale` rather than a navigation, so the choice
 * costs no round trip — which matters on the slow connections this archive is
 * built for.
 */

interface LocaleContextValue {
  locale: LocaleCode;
  dict: Dictionary;
  definition: LocaleDefinition;
  setLocale: (code: LocaleCode) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const KEY = "gor-atlas-locale";

function detectFromBrowser(): LocaleCode | null {
  const candidates = navigator.languages ?? [navigator.language];
  for (const tag of candidates) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isLocale(fromUrl)) {
      setLocaleState(fromUrl);
      return;
    }
    try {
      const saved = localStorage.getItem(KEY);
      if (isLocale(saved)) {
        setLocaleState(saved);
        return;
      }
    } catch {
      /* localStorage unavailable */
    }
    const detected = detectFromBrowser();
    if (detected) setLocaleState(detected);
  }, []);

  // Keep the document language in sync so screen readers switch voice and the
  // Indic line-height rules in globals.css apply.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
    try {
      localStorage.setItem(KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dict: getDictionary(locale),
      definition: localeDefinition(locale),
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Safe outside the provider, so components can render in isolation. */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  return {
    locale: DEFAULT_LOCALE,
    dict: getDictionary(DEFAULT_LOCALE),
    definition: localeDefinition(DEFAULT_LOCALE),
    setLocale: () => {},
  };
}
