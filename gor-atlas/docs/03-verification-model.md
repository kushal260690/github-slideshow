# 03 — The Verification Model

This is the core intellectual apparatus of Gor Atlas. Everything else is presentation.

## 1. The problem

Knowledge about Banjara settlements arrives from five sources that have genuinely
different epistemic properties, and flattening them into one "fact" destroys information:

- A **census figure** is precise, dated, methodologically documented, and often
  undercounts hamlets that are administratively folded into a parent village.
- A **gazetteer or revenue record** is authoritative about administrative status and
  frequently wrong or colonial-inflected about community history.
- An **academic study** is interpretive; two competent scholars disagree.
- An **oral history** is the community's own memory. It is the *primary* record for
  settlement formation, migration and clan relationships, and is often the only record.
  It is not "lesser" evidence — it is different evidence, with different failure modes
  (compression of chronology, retrospective coherence).
- An **unverified community submission** is a lead, not a finding.

A platform that displays all five identically is lying about its own confidence.

## 2. Two orthogonal axes

Gor Atlas separates **what kind of evidence this is** from **how well it has been
checked**. These are independent and both are always shown.

### Axis A — Source category (what kind of evidence)

| Category | Meaning |
| --- | --- |
| `government_record` | Revenue, gazetteer, panchayat, survey records |
| `census` | Census of India or state enumeration |
| `academic` | Peer-reviewed or scholarly-published research |
| `archival_document` | Photographs, manuscripts, newspapers, colonial files |
| `oral_history` | Recorded community testimony with a named narrator and consent |
| `community_submission` | Submitted knowledge, not yet corroborated |
| `media_report` | Journalism |
| `demo_placeholder` | Prototype data. Never publishable. |

### Axis B — Verification status (how well checked)

| Status | Bar it must clear | Marker colour |
| --- | --- | --- |
| `verified` | ≥2 independent sources, ≥1 documentary, reviewed by a state editor or above | Green |
| `partially_verified` | 1 credible source, or multiple oral accounts agreeing, reviewed | Amber |
| `unverified` | Submitted, plausible, not yet corroborated | Grey |
| `disputed` | Credible sources conflict — all versions retained | Red outline |
| `not_documented` | No claim exists. The honest empty state. | — |

### Derived: confidence

`high` / `medium` / `low` is a reviewer's judgement combining both axes plus the
specificity of the claim. A precisely dated settlement year from a single oral account is
`oral_history` + `partially_verified` + **low** confidence, because the *precision* of the
claim exceeds what the evidence can carry.

## 3. Precision rules (anti-fabrication)

These are enforced at the schema level, not left to editorial goodwill:

1. **No population figure without a dated source.** `population_records` requires
   `source_id NOT NULL` and `as_of_year NOT NULL`.
2. **No exact establishment year when only a period is known.** Historical dating uses a
   `period_start` / `period_end` range plus a `precision` enum
   (`exact_year` | `decade` | `quarter_century` | `century` | `era` | `unknown`).
   A record dated "late 19th century" is stored as 1875–1900 / `quarter_century`, and the
   UI renders "late 1800s (approx.)" — never "1887".
3. **No surname exclusivity.** A surname→clan link carries `association_strength`
   (`commonly_associated` | `regionally_associated` | `contested`) and can never be
   expressed as "belongs to".
4. **No inference.** The system will not derive a person's clan, caste or family
   relationship from a surname. There is no code path that does this.
5. **Rounded coordinates for unverified points.** Locations not confirmed by a verified
   Tanda representative are stored and displayed at reduced precision, and labelled
   "approximate location".
6. **Empty is a valid, visible answer.** `Not yet documented` is a first-class render
   state with a contribution CTA, not a blank.

## 4. The provenance envelope

Every factual assertion in the system — a population count, a founding period, a dialect
name, a festival — is stored as an *assertion row*, not a column value:

```
assertion {
  subject      (tanda | clan | surname | route | article …)
  predicate    (population_total, established_period, major_clan …)
  value        (typed)
  period       (applicable from → to)
  source_id    → sources
  verification (verified | partially_verified | unverified | disputed | not_documented)
  confidence   (high | medium | low)
  contributor  → contributors
  reviewer     → contributors
  reviewed_at
  editorial_note  (public)
  superseded_by   (revision chain)
}
```

Two assertions with the same subject+predicate and different values are not a bug. That
is what `disputed` means, and both render side by side.

## 5. Reviewer roles and what each may promote to

| Role | May set status up to |
| --- | --- |
| Public contributor | (submits only — cannot publish) |
| Verified Tanda representative | `unverified` → may confirm location and identity fields |
| District researcher | `partially_verified` |
| State editor | `verified` within their state |
| Subject-matter expert | `partially_verified`, may open `disputed` |
| Historian / reviewer | `verified`, `disputed` |
| Super administrator | all, plus rollback |

Promotion to `verified` always requires a second reviewer distinct from the contributor.
Self-verification is blocked at the database level (see `db/policies.sql`).

## 6. Dispute handling

1. Anyone may open a dispute against any assertion, with a stated reason and, ideally,
   a counter-source.
2. The assertion is immediately marked `disputed` and rendered with a red outline. It is
   **not** hidden — suppressing a contested claim is itself an editorial act.
3. A reviewer at historian level attaches an editorial note explaining the state of the
   evidence.
4. Resolution is either: one version verified and the other retained in history with a
   note; or permanent coexistence, which is a legitimate and common outcome for
   traditions that genuinely differ by region.

The platform's position: **regional variation in oral tradition is data, not error.**

## 7. Labels used in public UI

For historical and migration claims specifically, these five labels appear verbatim:

- **Documented** — contemporaneous written or material evidence exists
- **Widely accepted interpretation** — scholarly consensus, but interpretive
- **Oral tradition** — community memory, attributed to named narrators
- **Disputed** — credible accounts conflict
- **Insufficient evidence** — the claim circulates but cannot currently be assessed

No speculative origin theory is ever presented in the voice of the platform.
