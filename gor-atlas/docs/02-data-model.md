# 02 — Data Model and Entity Relationships

Canonical DDL: [`db/schema.sql`](../db/schema.sql). Access rules: [`db/policies.sql`](../db/policies.sql).
This document explains *why* the schema is shaped the way it is.

## 1. Three structural decisions

**(a) Assertions, not columns.** A Tanda row holds identity and geometry only. Every
contestable statement about it — population, founding period, major clans, dialect — lives
in a separate table with its own source, verification status and confidence. This is what
makes "two sources disagree" representable instead of destructive.

**(b) Names are a table, not a string.** `tanda_names`, `clan_name_variants` and
`surname_variants` exist because a settlement legitimately has an official name, a local
name, a historical name, transliterations in five scripts and half a dozen spellings.
Search runs against the variant tables. There is no "correct" spelling privileged in
lookup, only a `is_primary` display preference.

**(c) Periods, not dates.** Historical time is stored as `period_start` / `period_end`
plus a `precision` enum. The system is structurally unable to record "founded 1887" when
the evidence says "late nineteenth century".

## 2. Entity groups

### Geography
`states` → `districts` → `subdistricts` (mandal/tehsil/taluk) → `villages` → `tandas`

`tandas` carries `geom geography(Point,4326)`, `coordinate_precision`, `location_source`,
`settlement_type` (`rural`|`urban`|`relocated`|`absorbed`|`historical`|`diaspora`) and
`sensitive_location` (privacy control, §6 of doc 04). GiST index on `geom` powers
"near me" and radius search.

### Population
`population_records` — one row per (tanda, as_of_year, source). Never overwritten; a new
census year is a new row, which is what makes trend a query rather than a stored value.
`NOT NULL` on both `as_of_year` and `source_id` is the anti-fabrication rule from doc 03.
Sex/child columns are nullable and suppressed below the household floor.

### Clans and surnames
```
clans ─┬─ clan_name_variants
       ├─ subclans ── subclan_variants
       └─ clan_relationships (clan ↔ clan, typed, sourced, non-hierarchical)

surnames ── surname_variants
         └─ surname_clan_associations (strength, region, source)  ← many-to-many
```
`surname_clan_associations` is deliberately many-to-many **with a region qualifier**,
because the same surname is associated with different clans in different states and
asserting a single mapping would be a fabrication. `clan_relationships` has no parent/child
column — relationships are typed (`associated_with`, `regionally_grouped_with`,
`shares_tradition_with`) and each carries its own source, so no implied genealogy.

`tanda_clan_presence` links Tanda ↔ clan with a `presence_band` enum, never a count.

### History and migration
`historical_events` (typed, periodised, sourced) · `migration_routes` ·
`migration_route_waypoints` (ordered, PostGIS points) · `migration_route_evidence`
(each route may carry several evidence rows with *different* interpretation labels —
this is how "documented" and "oral tradition" versions of one route coexist).

### Culture, institutions, people
`languages` · `dialect_variants` · `cultural_practices` (typed: festival, dress, music,
dance, food, craft, marriage custom, occupation) · `institutions` (public only) ·
`people` (public historical significance only, gated by doc 04 §3).

### Evidence layer
`sources` · `citations` (polymorphic: subject_type + subject_id + field) ·
`verification_records` · `disputes` · `revisions`.

### Contribution layer
`contributors` · `contributor_roles` · `submissions` · `submission_fields` (field-level,
so a reviewer accepts three of five proposed changes) · `reviews` · `audit_log`.

### Media and consent
`media_assets` → `consent_records` (1:1 required before publish) → `media_subjects`.

### Translation
`translations` (subject_type, subject_id, field, locale, value, `translation_method`,
`translator`, `reviewed`) — see doc 08.

## 3. The provenance envelope

Applied to every assertion-bearing table via a shared column set (implemented as a
composite `DOMAIN`-backed convention plus a trigger):

```sql
source_id       uuid    references sources(id)
verification    verification_status  not null default 'unverified'
confidence      confidence_level     not null default 'low'
period_start    integer
period_end      integer
date_precision  date_precision
contributor_id  uuid    references contributors(id)
reviewer_id     uuid    references contributors(id)
reviewed_at     timestamptz
editorial_note  text                 -- public
is_demo         boolean not null default false
superseded_by   uuid    self-reference
created_at / updated_at
```

`CHECK (verification <> 'verified' OR (source_id IS NOT NULL AND reviewer_id IS NOT NULL))`
— a value cannot be verified without both a source and a reviewer. `CHECK (reviewer_id IS
DISTINCT FROM contributor_id)` blocks self-verification.

## 4. Why not a document store

Because the questions are relational and multi-hop: *"Rathod-majority Tandas in Telangana
established before 1900 with population above 5,000"* joins clan variants → presence →
tanda → district → state → founding assertion → population records, with a period filter
and a confidence filter. Plus PostGIS for proximity and `pg_trgm` for fuzzy names. A
document store would force denormalisation exactly where correctness matters most.

## 5. Indexing

| Index | Purpose |
| --- | --- |
| GiST on `tandas.geom` | proximity, viewport, radius |
| GIN `pg_trgm` on `tanda_names.name_normalised` | fuzzy name search |
| GIN `pg_trgm` on `surname_variants.variant_normalised` | spelling-tolerant surname search |
| GIN `tsvector` on `articles.body` | full-text encyclopedia search |
| btree `(district_id, verification)` | district completeness dashboards |
| btree `population_records (tanda_id, as_of_year desc)` | latest-figure lookup |

## 6. Reference views

- `v_tanda_card` — the map/hover payload, precomputed
- `v_district_completeness` — documented vs. verified counts per district, drives the
  admin coverage view and the state directory
- `v_public_stats` — homepage counters, computed from real rows so no figure on the
  homepage can be fabricated (demo rows are counted separately and labelled)
