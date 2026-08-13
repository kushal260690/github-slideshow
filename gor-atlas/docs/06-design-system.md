# 06 — Visual Design System

## 1. Intent

Culturally rooted, contemporary, evidential. The reference points are a museum archive and
a documentary — not a government portal, not a festival poster. Restraint is the point:
Banjara material culture is chromatically extraordinary, and the interface's job is to be
the quiet gallery wall that lets it read.

## 2. Colour tokens

Defined once in `src/app/globals.css` as CSS custom properties; Tailwind v4 consumes them
through `@theme`.

| Token | Light | Dark (default) | Role |
| --- | --- | --- | --- |
| `--ink` | `#12131a` | `#f2ece1` | Body text |
| `--surface-0` | `#f7f2e8` parchment | `#0d0f18` near-black indigo | Page ground |
| `--surface-1` | `#efe6d6` sand | `#161a28` | Cards |
| `--surface-2` | `#e5d9c3` | `#1f2434` | Raised / hover |
| `--indigo` | `#1b1f3b` | `#1b1f3b` | Brand ground, map ground |
| `--terracotta` | `#b4472e` | `#d4674a` | Primary accent, CTAs |
| `--peacock` | `#0e7c86` | `#2fb6bf` | Interactive, links, highlights |
| `--gold` | `#9a7b2f` | `#c9a227` | Verified heritage content only |
| `--muted` | `#5c5647` | `#9a9484` | Secondary text |
| `--line` | `#d8ccb4` | `#2a3042` | Borders |

### Semantic (verification) colours — never reused decoratively

| State | Token | Hex |
| --- | --- | --- |
| Verified | `--v-verified` | `#2e9e5b` green |
| Partially verified | `--v-partial` | `#c98a1b` amber |
| Location only | `--v-basic` | `#8b8f9c` grey |
| Historical / relocated | `--v-historical` | `#3f7fd1` blue |
| Diaspora | `--v-diaspora` | `#8a5fc4` purple |
| Disputed | `--v-disputed` | `#c2402c` red outline |

Because these six carry meaning, they are **never** used for buttons, headings or
backgrounds. Colour is also never the sole channel: every marker state has a distinct
shape/stroke treatment and every chip carries a text label (WCAG 1.4.1).

## 3. Typography

- **Display / editorial:** a transitional serif — `ui-serif, "Iowan Old Style", "Source
  Serif 4", Georgia, serif`. Used for headlines, article body, Tanda names, pull quotes.
- **Interface:** `ui-sans-serif, "Inter", system-ui, "Noto Sans", sans-serif` for
  navigation, controls, tables, metadata.
- **Indic scripts:** Noto family fallbacks declared for Devanagari, Telugu and Kannada so
  Hindi/Marathi, Telugu and Kannada content renders at parity rather than in a browser
  default. Line-height is set 0.15em looser for Indic ranges, which need more vertical
  room than Latin at the same optical size.
- **Numerals:** tabular figures in all data tables (`font-variant-numeric: tabular-nums`).

Scale (rem): 0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3 / 4.
Body copy caps at `68ch` measure. Article body is 1.125rem at 1.7 line-height.

## 4. Pattern and texture

Banjara textile geometry appears **only** as:
- a 4px repeating border-motif on section dividers and page headers,
- a low-opacity (≤ 0.05) archival-paper grain on parchment surfaces,
- a diamond/mirror-derived SVG motif used as a section mark.

It never appears as a full-bleed background, never behind text, never as a decorative
overlay on photographs. Motifs are geometric abstractions rendered in SVG — not
reproductions of any specific community's protected embroidery designs.

## 5. Elevation and shape

- Radius: `4px` controls, `8px` cards, `14px` sheets. No pill buttons.
- Shadows are minimal and warm-tinted; on dark ground, elevation is expressed by surface
  lightness and a 1px `--line` border rather than by shadow.

## 6. Motion

| Interaction | Duration | Easing |
| --- | --- | --- |
| Hover / focus | 120 ms | `ease-out` |
| Panel & bottom sheet | 240 ms | `cubic-bezier(.2,.8,.2,1)` |
| Map fly-to | 900 ms | maplibre default |
| Timeline scrub | frame-synced | — |
| Migration route draw | 1200 ms per leg | linear |

All motion is wrapped in `@media (prefers-reduced-motion: reduce)` and reduced to opacity
only. Migration animation stops entirely; the route renders statically at full extent.
Low-bandwidth mode additionally disables the animated hero.

## 7. Component inventory

`VerificationChip` · `SourceBadge` · `FactRow` (value + provenance popover) ·
`NotDocumented` · `DemoBanner` · `SectionCard` · `PageHeader` · `Timeline` ·
`ClanNetwork` · `MapView` · `MapFilters` · `TandaSheet` · `StatCounter` ·
`ContributionWizard` · `ReviewQueue` · `FieldDiff` · `LanguageSwitcher` ·
`TextileRule` · `Prose`.

## 8. Accessibility commitments (WCAG 2.2 AA)

- Contrast ≥ 4.5:1 body, ≥ 3:1 large text and UI boundaries, in both themes and in
  high-contrast mode.
- Every map has an equivalent **text directory** at `/directory` — full keyboard operation
  and screen-reader parity, linked from the map itself, not hidden in a footer.
- Visible focus ring: 2px `--peacock` with 2px offset, on every interactive element.
- Target size ≥ 24×24 px (2.5.8), map controls ≥ 44 px.
- No content conveyed by colour alone; no keyboard trap in the map or the bottom sheet.
- Dragging alternatives (2.5.7): the timeline slider accepts arrow keys and has stepped
  previous/next buttons.
- `prefers-contrast: more` and a manual high-contrast toggle both supported.
