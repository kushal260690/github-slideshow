# 06 — Visual Design System

## 1. Intent

Culturally rooted, contemporary, evidential. The reference points are a museum archive and
a documentary — not a government portal.

**Revised after review.** The first version of this system treated restraint as the whole
answer: a near-monochrome charcoal ground on the theory that the interface should be a
quiet gallery wall. That was the wrong call for this subject. Banjara material culture is
chromatically extraordinary, and an archive of it rendered in greys reads as an outsider's
view of the community — respectful in intention, drained in effect.

The system now runs a **cobalt field with bright embroidery thread laid on it** — which is
what the textiles actually do. Cobalt is not a neutral here; it is the dyed ground. Cream
carries the display type and the paper panels, and the discipline moved from "use little
colour" to "keep two colour systems apart".

## 2. Two colour systems, never mixed

This is the rule that makes the brightness safe:

| System | Purpose | Where it may appear |
| --- | --- | --- |
| **Decorative** (`--gor-*`) | Mood, motifs, bands, section marks, illustration, route lines, hero | Anywhere |
| **Semantic** (`--v-*`) | The evidential state of a record | Verification chips, markers, columns, legends only |

The two sets share no values, and a decorative colour is never used to indicate anything
about reliability. A reader must never have to wonder whether a bright colour is telling
them something about a record's evidence.

### The seven named colours (decorative)

| Name | Token | Dark | Light |
| --- | --- | --- | --- |
| Turmeric | `--gor-turmeric` | `#f5c518` | `#c99a00` |
| Hot magenta | `--gor-magenta` | `#ed1e79` | `#c50f62` |
| Vermilion | `--gor-vermilion` | `#f26522` | `#d2470b` |
| Peacock | `--gor-peacock` | `#16a8a0` | `#0c7b74` |
| Cobalt | `--gor-cobalt` | `#0f2a9c` | `#0f2a9c` |
| Cream | `--gor-cream` | `#f4ead5` | `#f4ead5` |
| Mirror silver | `--gor-mirror` | `#c7c9ce` | `#8b8f9c` |

### `.paper` — the cream panel

The art direction sets cream cards on the cobalt field. Rather than fork every component
into a light variant, `.paper` re-declares the surface, ink, line and semantic tokens for
its own subtree. Any existing component dropped inside renders dark-on-cream unchanged.
Used for stat tiles, world-region cards, the featured Tanda and article cards.

## 3. Base tokens

Defined once in `src/app/globals.css` as CSS custom properties; Tailwind v4 consumes them
through `@theme`.

| Token | Light | Dark (default) | Role |
| --- | --- | --- | --- |
| `--ink` | `#1a1526` | `#f8f2e6` | Body text |
| `--surface-0` | `#fff8ec` parchment | `#141123` indigo-violet | Page ground |
| `--surface-1` | `#fdefd9` sand | `#1e1935` | Cards |
| `--surface-2` | `#f7e2c2` | `#292142` | Raised / hover |
| `--indigo` | `#2a2170` | `#2a2170` | Dye ground, map body |
| `--terracotta` | `#d1462a` | `#ff7a4d` | Primary accent, CTAs |
| `--peacock` | `#0a8f97` | `#26d3d3` | Interactive, links, highlights |
| `--gold` | `#a8760d` | `#ffc844` | Verified heritage content only |
| `--muted` | `#5f5168` | `#bdb3c4` | Secondary text |
| `--line` | `#e6ceac` | `#362c53` | Borders |

### Semantic (verification) colours — never reused decoratively

| State | Token | Dark | Light |
| --- | --- | --- | --- |
| Verified | `--v-verified` | `#35d07f` green | `#17804a` |
| Partially verified | `--v-partial` | `#ffb627` amber | `#96650a` |
| Location only | `--v-basic` | `#a8aec4` grey | `#55596b` |
| Historical / relocated | `--v-historical` | `#5aa9ff` blue | `#1f56a8` |
| Diaspora | `--v-diaspora` | `#c07bff` purple | `#6a30b0` |
| Disputed | `--v-disputed` | `#ff5f52` red outline | `#b32718` |

Because these six carry meaning, they are **never** used for buttons, headings or
backgrounds. Colour is also never the sole channel: every marker state has a distinct
shape/stroke treatment and every chip carries a text label (WCAG 1.4.1).

## 4. Typography

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

## 5. Pattern and texture

Three motif components, used generously but never behind body copy:

- **`.textile-band`** — the full 22px five-colour embroidery band: diamonds in lac,
  marigold, parrot, fuchsia and turquoise, separated by mirrorwork dots on an indigo
  ground. Sits under the site header, the footer and every page header.
- **`.textile-rule`** — the slim chevron rule, for lighter dividers.
- **`.mirror-dot`** — a mirrorwork disc with a lac-red bezel and a marigold glow, used as
  a section mark before major headings.
- **`.gor-wash`** — a soft fuchsia/turquoise/marigold radial wash behind hero and feature
  sections. Kept under 22% so text contrast is unaffected.

What has not changed: motifs are geometric abstractions constructed for this project, not
reproductions of any specific community's protected embroidery designs, and they never
appear as an overlay on photographs of people.

## 6. Elevation and shape

- Radius: `4px` controls, `8px` cards, `14px` sheets. No pill buttons.
- Shadows are minimal and warm-tinted; on dark ground, elevation is expressed by surface
  lightness and a 1px `--line` border rather than by shadow.

## 7. Motion

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

## 8. Component inventory

`VerificationChip` · `SourceBadge` · `FactRow` (value + provenance popover) ·
`NotDocumented` · `DemoBanner` · `SectionCard` · `PageHeader` · `Timeline` ·
`ClanNetwork` · `MapView` · `MapFilters` · `TandaSheet` · `StatCounter` ·
`ContributionWizard` · `ReviewQueue` · `FieldDiff` · `LanguageSwitcher` ·
`TextileRule` (rule / band / gold) · `MirrorDot` · `Reveal` · `CountUp` ·
`HeroGlobe` · `WorldStrip` · `Prose`.

## 9. Accessibility commitments (WCAG 2.2 AA)

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
