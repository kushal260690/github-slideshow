# 05 — Wireframes (desktop and mobile)

Low-fidelity structure only. Visual treatment is in doc 06.

## Homepage — desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│ GOR ATLAS   Map  Tandas  Clans  History  Encyclopedia  Contribute   │
│                                    [search] [EN▾] [low-data] [◑]     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│        ░░ dark terrain map of India, glowing Tanda points ░░         │
│        ░░ slow animated migration arcs (reduced-motion off) ░░       │
│                                                                      │
│                   EVERY TANDA HAS A STORY                            │
│      Explore the living history, clans, journeys and culture         │
│                  of the Gor/Banjara people.                          │
│                                                                      │
│      ┌────────────────────────────────────────────────┐              │
│      │ Search a Tanda, clan, surname, district, state │              │
│      └────────────────────────────────────────────────┘              │
│           [ Explore the Map ]   [ Document Your Tanda ]              │
│                                                                      │
│      ⚠ Prototype: contains 5 clearly labelled demo records           │
├──────────────────────────────────────────────────────────────────────┤
│  5 Tandas │ 0 verified │ 0 states │ 0 oral histories │ 0 sources    │  ← live from DB
│  every counter links to the query that produced it                   │
├──────────────────────────────────────────────────────────────────────┤
│  [ Interactive map preview — click to open full map ]                │
├───────────────────────────────┬──────────────────────────────────────┤
│  Featured Tanda (card)        │  Explore clans & surnames (grid)     │
├───────────────────────────────┴──────────────────────────────────────┤
│  Animated migration story  →  timeline strip, "Read the evidence"    │
├──────────────────────────────────────────────────────────────────────┤
│  Cultural archive (6 article cards)                                  │
├──────────────────────────────────────────────────────────────────────┤
│  Contribute CTA  │  Research partners & sources  │  Latest additions │
├──────────────────────────────────────────────────────────────────────┤
│ Footer: Methodology · Privacy · Editorial board · Changelog · Text   │
│         directory (accessible alternative to the map)                │
└──────────────────────────────────────────────────────────────────────┘
```

## Explore Map — desktop

```
┌─────────┬────────────────────────────────────────────┬───────────────┐
│ FILTERS │                                            │  RESULT LIST  │
│         │                                            │               │
│ State ▾ │            full-bleed map                  │ ● Tanda A     │
│ Distr ▾ │                                            │ ● Tanda B     │
│ Clan  ▾ │        ◉ clusters · ◍ heatmap              │ ● Tanda C     │
│ Period▾ │                                            │               │
│ Pop   ⇄ │   [layers: standard|satellite|terrain]     │ 5 results     │
│ Status☑ │   [◍ heatmap] [⊞ boundaries] [↦ routes]    │               │
│         │                                            │ ⌨ Open text   │
│ Reset   │            ┌─ hover card ─┐                │   directory   │
└─────────┴────────────┴──────────────┴────────────────┴───────────────┘
```

Hover card: name · alt spellings · district, state · approx. population ·
major clans · established (period) · verification chip · **Explore Tanda →**

## Explore Map — mobile

Map fills the viewport. A bottom sheet at three detents:
`peek (72px: result count + filter button)` → `half (hover card + list)` →
`full (Tanda summary, scrollable)`. Filters open as a full-screen sheet with large
touch targets. A floating "Tandas near me" GPS button sits above the sheet.
Sheet is dismissible by swipe **and** by an explicit close button (2.5.7).

## Tanda Profile — desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠ DEMO DATA — NOT HISTORICALLY VERIFIED  (demo records only)         │
├──────────────────────────────────────────────────────────────────────┤
│ Nandiwada Tanda  [DEMO] [◐ partially verified]                       │
│ నందివాడ తండా · नंदिवाडा तांडा · also: Nandivada, Nandiwad            │
│ Nalgonda district, Telangana · GOR-DEMO-0001                         │
│ [Share] [WhatsApp] [Save offline] [Suggest a correction]             │
├───────────────────────────────────────┬──────────────────────────────┤
│ ▸ Identity                            │  map inset                   │
│ ▸ Population        (table by year)   │  ─────────────               │
│ ▸ Clans & surnames  (bands, not %)    │  At a glance                 │
│ ▸ History           (timeline)        │  Completeness ▓▓▓░░ 62%      │
│ ▸ Culture                             │  Sources: 3                  │
│ ▸ Governance & institutions           │  Last reviewed: —            │
│ ▸ Media archive     (consent chips)   │  Contributors: 0             │
│ ▸ Sources & verification (full table) │                              │
└───────────────────────────────────────┴──────────────────────────────┘
```

Every `FactRow` is `label · value · [chip] · ⓘ` where ⓘ opens the provenance popover:
source, author, year, category, verification, confidence, reviewer, last reviewed,
editorial note. Missing values render as **Not yet documented → Contribute this**.

Mobile: single column, sections collapse to an accordion, the aside becomes a sticky
summary strip under the header.

## Clan Explorer

```
┌───────────────────────────┬──────────────────────────────────────────┐
│ list / search of clans    │   zoomable relationship network          │
│ [Rathod] [Pawar] …        │   nodes = clans, edges = typed, sourced  │
│                           │   ⚠ "Not a genealogy. Regional versions  │
│ filter: region, status    │      differ and are shown separately."   │
└───────────────────────────┴──────────────────────────────────────────┘
```

Clan Detail: variants · associated groups (never "parent") · concentration map ·
Tandas where documented · historical references · oral accounts · verification ·
editorial notes on disputed classification.

## Migration Map

Full-bleed map, bottom timeline scrubber with era ticks, animated arcs drawn per period,
right rail listing routes in view; selecting a route opens its evidence panel showing
each interpretation label separately (Documented / Oral tradition / Disputed …).
Keyboard: arrow keys step the timeline; every route is reachable via the rail list.

## Document Your Tanda — 7 steps

`1 What are you contributing` → `2 Locate on map` → `3 The information` →
`4 Your source` → `5 Evidence upload` → `6 Consent & attribution` → `7 Review & submit`

Persistent right rail: "Nothing here publishes automatically. Every submission is
reviewed by a district researcher or state editor." Draft autosaves to localStorage so a
dropped connection on a slow network does not lose the entry.

## Admin Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│ Queue (12) │ Disputes (2) │ Duplicates │ Consent │ Coverage │ Audit  │
├────────────────────┬─────────────────────────────────────────────────┤
│ submission list    │  FIELD-LEVEL DIFF                               │
│ ▸ #1042 population │  population_total  1,240 → 1,610   [✓] [✗] [?]  │
│ ▸ #1043 new tanda  │  source: attached PDF              [view]       │
│ ▸ #1044 oral hist. │  consent: ✓ verbal, Telugu, 2026-03             │
│                    │  ─────────────────────────────────────────────  │
│                    │  [Approve selected] [Reject] [Request evidence] │
└────────────────────┴─────────────────────────────────────────────────┘
```

Coverage tab: completeness heatmap by district; Audit tab: immutable log with rollback.
