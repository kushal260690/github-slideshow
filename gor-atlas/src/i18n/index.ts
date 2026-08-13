/**
 * Multilingual architecture — interface layer.
 * See docs/08-multilingual-architecture.md.
 *
 * Adding a locale = add one file in ./locales and one entry to LOCALES.
 * Locale files are DeepPartial<Dictionary>: a locale may be partially
 * translated, and every missing key falls back to English at merge time. The
 * shape is still typed against English, so a *misspelled* key is a compile
 * error even though an *absent* key is legal.
 */

import { en } from "./locales/en";
import { hi } from "./locales/hi";
import { te } from "./locales/te";
import { mr } from "./locales/mr";
import { kn } from "./locales/kn";

export type Dictionary = typeof en;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type PartialDictionary = DeepPartial<Dictionary>;
export type LocaleCode = "en" | "hi" | "te" | "mr" | "kn";

/** How a locale's interface strings were produced. Shown to the user. */
export type TranslationReview = "original" | "needs_community_review" | "community_reviewed";

export interface LocaleDefinition {
  code: LocaleCode;
  /** Endonym — a language is named in its own language. */
  label: string;
  englishLabel: string;
  script: string;
  review: TranslationReview;
}

export const LOCALES: LocaleDefinition[] = [
  { code: "en", label: "English", englishLabel: "English", script: "Latn", review: "original" },
  { code: "hi", label: "हिन्दी", englishLabel: "Hindi", script: "Deva", review: "needs_community_review" },
  { code: "te", label: "తెలుగు", englishLabel: "Telugu", script: "Telu", review: "needs_community_review" },
  { code: "mr", label: "मराठी", englishLabel: "Marathi", script: "Deva", review: "needs_community_review" },
  { code: "kn", label: "ಕನ್ನಡ", englishLabel: "Kannada", script: "Knda", review: "needs_community_review" },
];

/**
 * Locales the architecture is ready for but which have no dictionary yet.
 * Listed in the UI as planned rather than hidden, so the roadmap is visible.
 *
 * Gor Boli appears twice, by script: script is a separate dimension from
 * language (docs/08 §2). Gor Boli is predominantly spoken and written
 * orthography varies by region — no script is treated as canonical here.
 */
export const PLANNED_LOCALES = [
  { code: "gbl-Deva", label: "गोरबोली", englishLabel: "Gor Boli (Devanagari)" },
  { code: "gbl-Telu", label: "గోర్ బోలి", englishLabel: "Gor Boli (Telugu script)" },
  { code: "gu", label: "ગુજરાતી", englishLabel: "Gujarati" },
  { code: "raj", label: "राजस्थानी", englishLabel: "Rajasthani" },
  { code: "ta", label: "தமிழ்", englishLabel: "Tamil" },
  { code: "or", label: "ଓଡ଼ିଆ", englishLabel: "Odia" },
] as const;

const PARTIALS: Record<LocaleCode, PartialDictionary> = { en, hi, te, mr, kn };

export const DEFAULT_LOCALE: LocaleCode = "en";

export function isLocale(value: string | undefined | null): value is LocaleCode {
  return !!value && LOCALES.some((l) => l.code === value);
}

function mergeDeep<T>(base: T, override: DeepPartial<T>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override ?? {})) {
    if (value === undefined) continue;
    const current = out[key];
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current !== null &&
      typeof current === "object"
    ) {
      out[key] = mergeDeep(current, value as DeepPartial<unknown>);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

const cache = new Map<LocaleCode, Dictionary>();

/** Always returns a complete dictionary; untranslated keys fall back to English. */
export function getDictionary(locale: string | undefined | null): Dictionary {
  const code = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const cached = cache.get(code);
  if (cached) return cached;
  const merged = code === "en" ? en : mergeDeep(en, PARTIALS[code]);
  cache.set(code, merged);
  return merged;
}

export function localeDefinition(locale: string | undefined | null): LocaleDefinition {
  const code = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return LOCALES.find((l) => l.code === code)!;
}

/** Count of keys still falling back to English, for the translation badge. */
export function untranslatedKeyCount(locale: LocaleCode): number {
  const countLeaves = (obj: unknown): number =>
    typeof obj === "object" && obj !== null
      ? Object.values(obj as Record<string, unknown>).reduce<number>(
          (n, v) => n + countLeaves(v),
          0,
        )
      : 1;
  return Math.max(0, countLeaves(en) - countLeaves(PARTIALS[locale]));
}
