# 08 — Multilingual Architecture

## 1. Two separate problems

**Interface strings** and **archival content** are handled differently, because they have
different failure costs. A clumsy button translation is an annoyance; a machine-translated
oral history is a corruption of the record.

## 2. Interface layer

- Dictionaries in `src/i18n/locales/*.ts`, keyed by dotted namespace.
- Launch locales: **English (en), Hindi (hi), Telugu (te), Marathi (mr), Kannada (kn)**.
- Architecture-ready: **Gor Boli / Gormati (gbl)**, Gujarati (gu), Rajasthani (raj),
  Tamil (ta), Odia (or).
- Adding a locale = adding one file to `src/i18n/locales` and one entry in `LOCALES`.
- Locale files are `DeepPartial<Dictionary>`, typed against the English dictionary: a
  locale may be **partially** translated (which is the honest state of a new locale), but
  a *misspelled* key is still a compile error.
- `getDictionary()` deep-merges the locale over English, so every key resolves at runtime.
  Untranslated keys silently fall back to English rather than rendering a raw key path,
  and `untranslatedKeyCount()` drives a visible "partially translated" badge in the
  language switcher — the gap is disclosed, not hidden.
- Each locale carries a `review` state (`original` / `needs_community_review` /
  `community_reviewed`). The five launch dictionaries beyond English are drafted and
  marked `needs_community_review` until a community editor signs them off.
- Routing: `?lang=te` in the prototype; production uses `/[locale]/…` path segments with
  `hreflang` alternates and a `Content-Language` header for SEO.

### Gor Boli specifically

Gor Boli (Gormati / Lambadi, ISO 639-3 `lmn`) is an Indo-Aryan language and is
predominantly spoken rather than written; script practice varies by region — Devanagari
and Telugu script are both in community use, and there is no single settled orthography.
The architecture therefore treats **script as a separate dimension from language**:
`locale = language + script` (e.g. `gbl-Deva`, `gbl-Telu`). Content in Gor Boli may exist
in several scripts simultaneously without one being canonical, and audio is a first-class
representation for a language whose primary transmission is oral — a `gbl` article may
carry an audio recording as its **primary** rendition with a transliteration attached.

## 3. Content layer

Translated content is stored in a separate `translations` table, never overwriting the
original:

```
translations(
  subject_type, subject_id, field, locale,
  value,
  translation_method  -- 'human' | 'machine' | 'machine_post_edited' | 'community'
  translator_id, reviewed_by, reviewed_at,
  source_locale,      -- what it was translated FROM
  is_authoritative    -- only ever true for the original
)
```

Rules:

1. **The original is immutable by translation.** The original-language record is the
   authoritative one; translations reference it via `source_locale`.
2. **Machine assistance is disclosed in the UI**, per field, with a visible badge:
   *"Machine-assisted translation — not yet reviewed by a human"*. This badge is not
   dismissible.
3. **Oral histories are never machine-translated for publication.** A transcript in the
   narrator's language may carry a human or community translation; a machine draft may
   exist internally as `archive_only` to help reviewers, but cannot be published.
4. **Quotations retain the original alongside the translation**, always, so a reader can
   see what was actually said.
5. Translation of a value does not inherit its verification status automatically — a
   translation carries its own review state, because a mistranslation can invert a
   carefully hedged claim.

## 4. Names and scripts

`tanda_names`, `clan_name_variants` and `surname_variants` each carry `script` and
`locale`. A settlement's name in Telugu script is a *name variant*, not a *translation* —
transliteration and translation are different operations and are stored differently.
Search normalises across scripts using a transliteration index so that a query typed in
Telugu script finds a record whose primary name is stored in Latin script.

## 5. Typography and rendering

Noto fallbacks are declared for Devanagari, Telugu and Kannada; Indic ranges get looser
line-height (see doc 06 §3). Numerals render in Latin digits by default with a per-locale
option for Indic digits. Right-to-left is not required for the launch locales but the
layout uses logical properties (`margin-inline`, `padding-block`) throughout so an RTL
locale can be added without a rewrite.

## 6. What is *not* translated

- Source titles and citations — a citation must be quotable in its original form.
- Proper names of institutions.
- The `DEMO` label and the demo banner, which appear in English in every locale so the
  warning cannot be lost in translation, alongside the localised text.
