# 01 — Information Architecture

**Gor Atlas — The Living Encyclopedia of Banjara Heritage**
_Every Tanda. Every Clan. Every Story._

---

## 1. Product definition

Gor Atlas is a **source-attributed geographic and cultural archive** of the Gor / Banjara /
Lambadi / Lambani community. It is not an encyclopedia that asserts facts; it is a
**register of claims with evidence attached to each one**.

The single most important structural decision in this product: **there is no bare factual
field anywhere in the system.** Every value carries its own provenance envelope (source,
period, verification state, confidence, contributor, reviewer, editorial note). The UI
never displays a value without also making its evidential status visible. This is what
separates Gor Atlas from a wiki.

## 2. Audience segments

| Segment | Primary need | Entry point |
| --- | --- | --- |
| Community member from a Tanda | See my settlement documented; contribute what I know | Search → Tanda profile → Document Your Tanda |
| Diaspora / second generation | Trace family origin, clan, migration | Clan Explorer → Surname → Migration Map |
| Researcher / student | Cited, exportable, methodologically transparent data | Methodology → Sources → dataset export |
| Journalist | Verified, quotable claims with confidence levels | Encyclopedia → Article → Citations |
| Government / NGO | Settlement coverage and completeness by district | State Directory → District Directory |
| Editorial board | Review queue, disputes, audit trail | Admin Dashboard |

## 3. Navigation model

Three navigation planes, deliberately kept separate so users never confuse *place*,
*people* and *knowledge*:

```
PLACE plane          PEOPLE plane            KNOWLEDGE plane
─────────────        ─────────────           ───────────────
Explore Map          Clan Explorer           Cultural Encyclopedia
State Directory      Clan Detail             Article
District Directory   Surname Explorer        Media Archive
Tanda Profile        Migration Map           Oral Histories
                     Historical Timeline
```

Cross-cutting (persistent in header/footer):
Search · Document Your Tanda · Methodology · Sources · About · Editorial Board ·
Privacy & Community Data Policy · Admin.

### Primary header

`Explore Map | Tandas | Clans & Surnames | History | Encyclopedia | Contribute`
plus universal search, language switcher, low-bandwidth toggle, high-contrast toggle.

### Route map

| # | Page | Route | Rendering |
| --- | --- | --- | --- |
| 1 | Homepage | `/` | SSR (counters from DB) |
| 2 | Explore Map | `/map` | SSR shell + client map |
| 3 | Tanda Profile | `/tanda/[id]` | SSR, SEO + JSON-LD `Place` |
| 4 | State Directory | `/states` | SSR |
| 5 | District Directory | `/states/[state]` | SSR |
| 6 | Clan Explorer | `/clans` | SSR + client network graph |
| 7 | Clan Detail | `/clans/[id]` | SSR |
| 8 | Surname Explorer | `/surnames` | SSR + client filter |
| 9 | Migration Map | `/migration` | SSR shell + client map |
| 10 | Historical Timeline | `/timeline` | SSR + client scrubber |
| 11 | Cultural Encyclopedia | `/encyclopedia` | SSR |
| 12 | Article | `/encyclopedia/[slug]` | SSR, JSON-LD `Article` |
| 13 | Media Archive | `/archive` | SSR |
| 14 | Oral Histories | `/oral-histories` | SSR |
| 15 | Document Your Tanda | `/contribute` | Client wizard → API |
| 16 | Contribution Status | `/contribute/status` | Client |
| 17 | Methodology | `/methodology` | Static |
| 18 | Sources & Research Partners | `/sources` | SSR |
| 19 | About the Project | `/about` | Static |
| 20 | Editorial Board | `/editorial-board` | Static |
| 21 | Privacy & Community Data Policy | `/privacy` | Static |
| 22 | Admin Dashboard | `/admin` | Client, role-gated |

Supporting routes: `/search` (universal results), `/directory` (keyboard-accessible
text alternative to the map, required for WCAG), `/changelog` (public change log).

## 4. Content hierarchy of a Tanda Profile

Sections are ordered by what a community member looks for first, not by what a database
designer finds tidy:

1. **Identity header** — names in every spelling and script, ID, verification chip
2. **Where it is** — map inset, admin hierarchy, classification
3. **People** — population records by census year, trend, confidence
4. **Clans & surnames** — aggregated only, never household-level
5. **History** — interactive timeline of settlement, migration, administrative change
6. **Culture** — dialect, festivals, dress, food, music, occupations
7. **Governance & institutions** — Naik system, panchayat, public institutions
8. **Media archive** — photographs, audio, documents, each with consent metadata
9. **Sources & verification** — the full evidence table for every claim above
10. **Contribute / correct** — always present, never buried

## 5. Global states the IA must express

- `not_documented` — the honest default. Shown as **"Not yet documented"** with a
  contribution call to action. Never filled with a guess.
- `demo` — prototype records. Rendered with a permanent red banner and a `DEMO` chip
  adjacent to every occurrence of the name.
- `disputed` — two or more incompatible claims held simultaneously, both displayed with
  their own sources. The platform does not adjudicate.

## 6. Search architecture

One search box, six intents, resolved by a query classifier:

| Intent | Example | Resolution |
| --- | --- | --- |
| Place lookup | "Nandiwada" | Tanda / village fuzzy match |
| Administrative | "Nalgonda district" | District directory |
| Clan / surname | "Rathod", "Rathwad" | Clan detail via variant index |
| Structured filter | "Rathod-majority Tandas in Telangana" | Parsed into filter set |
| Temporal | "Tandas established before 1900" | Period range filter |
| Proximity | "Banjara settlements near Hyderabad" | PostGIS radius query |

Fuzzy matching is mandatory: `pg_trgm` similarity over a **name-variant table**, not over
a single canonical string, because the same settlement is legitimately spelled six ways
across five scripts.

## 7. Editorial workflow (IA view)

```
Contributor submits ─► submission (status: pending)
                         │
                         ├─ automated checks: duplicate, coordinate sanity, consent present
                         │
                         ▼
                    review queue ─► field-level accept / reject / request-evidence
                         │
                         ├─ rejected ──► contributor notified, reason recorded
                         │
                         ▼
                    revision created ─► published value replaced
                         │
                         └─ audit log entry + rollback point + public changelog line
```

Nothing bypasses this. There is no path from a submission to a published value that does
not create a revision, an audit entry and a changelog line.

## 8. Non-goals

Explicitly out of scope, permanently:

- Household-level or individual-level genealogy
- Political affiliation of settlements
- Ranking or status ordering of clans
- Contact directories of private individuals
- Any assertion of racial, royal or ancient descent
- Inferring a person's clan or caste from their surname
