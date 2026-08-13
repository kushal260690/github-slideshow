# Gor Atlas — The Living Encyclopedia of Banjara Heritage

**Every Tanda. Every Clan. Every Story.**

A source-attributed geographic and cultural archive of the Gor / Banjara / Lambadi /
Lambani community. This repository contains a working prototype: the interactive map, the
Tanda profile template, the clan and surname explorers, the migration and timeline
experiences, the contribution workflow, the moderation dashboard, the database schema and
the API.

---

## The one idea everything else follows from

**There is no bare factual field anywhere in this system.**

Every contestable statement — a population count, a founding period, a dialect name, a
clan association — is stored with its own source, verification status, confidence level,
contributor and reviewer, and the interface never renders a value without also rendering
that provenance. Two sources that disagree are held as two claims, not resolved into one.

That is what separates this from a wiki, and it is why the schema was designed before the
interface.

## What this prototype deliberately does not contain

No fabricated data, with exactly one labelled exception. The archive currently holds:

| | |
| --- | --- |
| Real settlement records | **0** |
| Verified records | **0** |
| Oral histories | **0** |
| Demonstration records | **5**, labelled on every screen |

Those zeros appear on the homepage. A cultural archive that opens with impressive numbers
it cannot source has already told you what kind of archive it is.

The five demonstration records are invented. They carry `isDemo: true`, which drives a
permanent banner, a `DEMO` chip beside every occurrence of the name, exclusion from every
public counter, `noindex` on the page, suppression of `schema.org` structured data, a
warning embedded in the share text so the label survives forwarding, and — by a database
rule — an absolute block on ever being marked verified. That last rule is why **no demo
record is green on the map**: a green marker can only ever mean a real settlement checked
against real sources by a real reviewer.

## Running it

```bash
cd gor-atlas
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

No API keys, no accounts, no external services. Base map tiles come from open raster
sources (OpenStreetMap, OpenTopoMap, Esri imagery); the app degrades to markers over a
dark ground if tiles cannot be reached.

## Layout

```
docs/     Architecture written before the code
  01-information-architecture.md    Routes, navigation planes, editorial workflow
  02-data-model.md                  Why the schema is shaped this way
  03-verification-model.md          The core intellectual apparatus
  04-privacy-and-consent.md         Hard prohibitions, consent, data sovereignty
  05-wireframes.md                  Desktop and mobile structure
  06-design-system.md               Tokens, typography, motion, accessibility
  07-api.md                         Endpoints, envelope, roles, rate limits
  08-multilingual-architecture.md   Interface vs. content translation

db/
  schema.sql        PostgreSQL 15+ / PostGIS — full entity model, constraints, triggers
  policies.sql      Row-level security, verification authority, consent cascade

src/
  app/              25 routes: 22 from the brief plus /directory, /search, /changelog
  app/api/          REST handlers over the repository seam
  components/       Map, timeline, clan network, wizard, dashboard, provenance UI
  data/             Typed dataset — geography, sources, clans, surnames, tandas, articles
  i18n/             en · hi · te · mr · kn, partial dictionaries with English fallback
  lib/              types · repository · format · api · mapStyles
```

`src/lib/repository.ts` is the seam. In this prototype every function reads the typed
in-memory dataset; in production each becomes a SQL query against PostGIS, with no change
required in pages, components or route handlers.

## Anti-fabrication rules, and where they are enforced

These are enforced in the schema, not left to editorial goodwill — a rule that depends on
everyone remembering it is not a rule.

| Rule | Enforcement |
| --- | --- |
| No population figure without a dated source | `NOT NULL` on both `as_of_year` and `source_id` |
| No exact year when only a period is known | `period_start`/`period_end` + precision enum; `CHECK` blocks marking a range as exact |
| No surname exclusivity | Many-to-many, region-qualified, strength-graded — no column can say "belongs to" |
| No self-verification | `CHECK (reviewer_id IS DISTINCT FROM contributor_id)` plus a trigger |
| No unconsented media | FK to `consent_records` + a publish-guard trigger |
| No household-level data | No column exists for it |
| Demo rows can never be verified | Trigger raises `demo_records_cannot_be_verified` |

The precision rule is visible in the UI too: a founding dated 1850–1900 renders as
*"second half of the 1800s (approx.)"*, never as a midpoint year, and the timeline draws
each event at the width of its evidence.

## What the prototype demonstrates

- **Map** — clustering, settlement-density heatmap, four base layers, six marker states,
  filters by state / district / clan / period / population / verification, GPS proximity
  search that never sends coordinates to the server, mobile bottom sheet, and a
  keyboard-accessible text directory at `/directory` carrying the same records.
- **Tanda profile** — eight sections, every value paired with its evidence, contested
  claims rendered side by side with no visual hierarchy between them, and
  *"Not yet documented"* as a first-class state with a contribution prompt.
- **Clan explorer** — a ring layout with no root, because a tree implies descent that no
  source establishes. Disputed associations stay visible as dashed red edges.
- **Migration map** — a timeline scrubber, and an evidence panel that shows each
  interpretation of a route separately: a route can be *documented* as to the trade that
  moved along it and *insufficient evidence* as to its chronology.
- **Contribution wizard** — seven steps, draft autosave for patchy connections, periods
  instead of dates, and a consent step where recorded verbal consent in the narrator's own
  language is an equal option rather than a lesser one.
- **Moderation dashboard** — field-level accept / reject / request-evidence, automated
  flags, duplicate detection, a consent queue, coverage by state, and an append-only audit
  log.
- **Working language switcher** — English, Hindi, Telugu, Marathi and Kannada, resolved
  from `?lang=`, then a saved choice, then the browser's own preferences. Switching costs
  no round trip, and a locale still falling back to English says so rather than hiding it.
- **Installable PWA** — manifest, icon and a service worker with three strategies:
  cache-first for content-hashed build assets, network-first with a cache fallback for
  pages, and capped cache-first for map tiles, which are the largest data cost on the site.
  "Save for offline" on a profile really stores the page and its API payload.
  `/api/submissions`, `/api/admin` and `/admin` are never cached — a reviewer must not see
  a stale queue, and consent state must never come from a cache a revocation cannot reach.

## Accessibility and access

WCAG 2.2 AA target. Dark, light and high-contrast themes; visible focus rings; no meaning
carried by colour alone; reduced-motion honoured throughout; keyboard alternatives for
every drag interaction. A low-bandwidth mode — auto-enabled from `navigator.connection` —
disables hero animation, decorative grain and the heavy map property set, because a large
share of the intended audience is on inexpensive handsets and metered data.

## Status

Prototype. Not deployed, no auth provider wired up, no files uploaded, no editorial board
appointed. Each of those absences is stated on the page where a reader might otherwise
assume otherwise.

See [`docs/03-verification-model.md`](docs/03-verification-model.md) for the evidence model
and [`docs/04-privacy-and-consent.md`](docs/04-privacy-and-consent.md) for why the
safeguards are as strict as they are.
