"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Three user preferences that are accessibility and access features, not
 * decoration:
 *
 *  - theme: dark (default) / light
 *  - contrast: normal / high  (WCAG 2.2, doc 06 §8)
 *  - lowData: on / off — disables hero animation, decorative grain and the
 *    heavy map property set. This exists because a large share of the intended
 *    audience is on inexpensive Android handsets and metered mobile data, and
 *    treating that as an afterthought would make the archive unusable for the
 *    people it is about.
 *
 * All three persist to localStorage and are applied as data attributes on
 * <html> so CSS can respond without a React re-render.
 */

type Theme = "dark" | "light";

interface Prefs {
  theme: Theme;
  highContrast: boolean;
  lowData: boolean;
  setTheme: (t: Theme) => void;
  toggleContrast: () => void;
  toggleLowData: () => void;
}

const PrefsContext = createContext<Prefs | null>(null);

const KEY = "gor-atlas-prefs";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [highContrast, setHighContrast] = useState(false);
  const [lowData, setLowData] = useState(false);

  // Restore saved preferences, and honour the OS-level contrast and data
  // settings on first visit rather than waiting to be asked.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Prefs>;
        if (saved.theme === "light" || saved.theme === "dark") setThemeState(saved.theme);
        if (typeof saved.highContrast === "boolean") setHighContrast(saved.highContrast);
        if (typeof saved.lowData === "boolean") setLowData(saved.lowData);
        return;
      }
    } catch {
      /* localStorage unavailable — fall through to system defaults */
    }
    if (window.matchMedia?.("(prefers-contrast: more)").matches) setHighContrast(true);
    const conn = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") {
      setLowData(true);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-contrast", highContrast ? "high" : "normal");
    root.setAttribute("data-lowdata", lowData ? "on" : "off");
    try {
      localStorage.setItem(KEY, JSON.stringify({ theme, highContrast, lowData }));
    } catch {
      /* ignore */
    }
  }, [theme, highContrast, lowData]);

  const value = useMemo<Prefs>(
    () => ({
      theme,
      highContrast,
      lowData,
      setTheme: setThemeState,
      toggleContrast: () => setHighContrast((v) => !v),
      toggleLowData: () => setLowData((v) => !v),
    }),
    [theme, highContrast, lowData],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsContext);
  if (!ctx) {
    // Safe fallback so components can render outside the provider (e.g. in
    // isolated tests) without throwing.
    return {
      theme: "dark",
      highContrast: false,
      lowData: false,
      setTheme: () => {},
      toggleContrast: () => {},
      toggleLowData: () => {},
    };
  }
  return ctx;
}

export function PreferenceToggles() {
  const { theme, setTheme, highContrast, toggleContrast, lowData, toggleLowData } = usePrefs();

  const btn =
    "rounded-sm border border-line px-2 py-1 text-[11px] text-muted transition-colors hover:border-peacock hover:text-peacock";
  const active = "border-peacock text-peacock";

  const onTheme = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme],
  );

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={onTheme} className={btn} aria-pressed={theme === "light"}>
        {theme === "dark" ? "Light" : "Dark"}
      </button>
      <button
        type="button"
        onClick={toggleContrast}
        className={`${btn} ${highContrast ? active : ""}`}
        aria-pressed={highContrast}
        title="High contrast mode"
      >
        Contrast
      </button>
      <button
        type="button"
        onClick={toggleLowData}
        className={`${btn} ${lowData ? active : ""}`}
        aria-pressed={lowData}
        title="Low-bandwidth mode: disables animation and heavy map data"
      >
        Low data
      </button>
    </div>
  );
}
