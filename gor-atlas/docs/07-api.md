# 07 — API Structure

All handlers live in `src/app/api/**/route.ts`. In the prototype they are backed by
`src/lib/repository.ts`, which reads the typed in-memory demo dataset. The repository
interface is the seam: swapping to Supabase/PostGIS means reimplementing
`repository.ts` against SQL, with no change to the route handlers, pages or components.

## Conventions

- JSON only. `application/json; charset=utf-8`.
- Envelope: `{ data, meta }` on success, `{ error: { code, message, details? } }` on failure.
- `meta` always carries `{ generatedAt, demoRecordCount, disclaimer }` for any response
  containing demo rows, so a downstream consumer of the API cannot mistake demo data for
  real data even if they never read the docs.
- Read endpoints are public. Write endpoints require a session and a role.
- Cursor pagination: `?limit=&cursor=`; responses return `meta.nextCursor`.
- Every factual value is returned as a provenance envelope, never as a bare scalar:
  `{ value, verification, confidence, sourceId, period, editorialNote, isDemo }`.

## Public read

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/tandas` | List/filter. `state, district, clan, surname, minPop, maxPop, periodFrom, periodTo, verification, q, near=lat,lng,radiusKm` |
| GET | `/api/tandas/[id]` | Full profile with all assertions and citations |
| GET | `/api/tandas/geojson` | FeatureCollection for the map; respects the same filters |
| GET | `/api/states` | State directory with completeness counts |
| GET | `/api/states/[code]` | Districts within a state |
| GET | `/api/clans` | Clan list + relationship graph |
| GET | `/api/clans/[id]` | Clan detail, variants, distribution, sources |
| GET | `/api/surnames` | Surname index with variants |
| GET | `/api/migration-routes` | Routes with waypoints and per-interpretation evidence |
| GET | `/api/timeline` | Historical events, periodised |
| GET | `/api/articles` | Encyclopedia index |
| GET | `/api/articles/[slug]` | Article + citations + revision history |
| GET | `/api/media` | Archive listing (published + consented only) |
| GET | `/api/sources` | Source register |
| GET | `/api/search?q=` | Universal fuzzy search across all indexes |
| GET | `/api/stats` | Homepage counters, computed from actual rows |

### Filter semantics worth noting

- `verification` accepts multiple values; `not_documented` is a queryable state, which is
  how the coverage dashboards find gaps.
- `near` uses PostGIS `ST_DWithin` in production; the prototype uses haversine.
- Demo records are **included by default but always flagged**; `?excludeDemo=true`
  removes them. Bulk export defaults to `excludeDemo=true`.

## Contribution

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/submissions` | contributor | Create a submission. **Always returns status `pending`.** There is no code path that writes directly to a published table. |
| GET | `/api/submissions/[ref]` | contributor (own) | Status tracking by reference code |
| POST | `/api/media/upload-url` | contributor | Signed object-storage URL; requires a consent record id |
| POST | `/api/disputes` | any authenticated | Open a dispute on an assertion |

`POST /api/submissions` validates: required consent for any media, source declaration,
contributor relationship to the Tanda, coordinate sanity (inside India bbox or flagged as
diaspora), and duplicate detection against existing Tanda names within 5 km.

## Editorial (role-gated)

| Method | Route | Minimum role |
| --- | --- | --- |
| GET | `/api/admin/queue` | district_researcher |
| POST | `/api/admin/submissions/[id]/fields/[field]` | district_researcher (accept / reject / request evidence, **per field**) |
| POST | `/api/admin/submissions/[id]/decision` | state_editor |
| POST | `/api/admin/verify` | state_editor (≤ verified, own state); historian (any) |
| GET | `/api/admin/duplicates` | district_researcher |
| POST | `/api/admin/merge` | state_editor |
| GET | `/api/admin/consent` | state_editor |
| POST | `/api/admin/rollback` | super_admin |
| GET | `/api/admin/audit` | state_editor (read), super_admin (full) |
| GET | `/api/admin/export` | state_editor — CSV/GeoJSON, privacy-filtered per doc 04 §8 |

Every editorial mutation writes an `audit_log` row `{actor, action, subject, before,
after, reason, at}` in the same transaction as the change. Rollback restores a prior
revision and writes a *new* audit row — history is append-only and never rewritten.

## Errors

| Code | Meaning |
| --- | --- |
| `validation_failed` | Field-level details returned |
| `consent_required` | Media submitted without a consent record |
| `source_required` | Attempt to set a population or a verified status without a source |
| `self_verification_blocked` | Reviewer is the contributor |
| `role_insufficient` | Below the required editorial role |
| `duplicate_candidate` | Possible existing Tanda; returns candidates for the contributor to confirm |

## Rate limiting and abuse

Submissions: 20/day/contributor, 5/hour. Media: 50 assets/day. Disputes: 10/day.
Search: 60/min/IP. Exceeding returns `429` with `Retry-After`.

## Caching

Public GETs: `s-maxage=300, stale-while-revalidate=3600`. Tanda profiles and articles are
statically regenerated on publish. Admin routes are `no-store`. GeoJSON for the map is
cached per filter signature and served gzipped; low-bandwidth mode requests a reduced
property set (`?fields=minimal`) that drops everything except id, name, state and status.
