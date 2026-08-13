# 04 — Privacy, Consent and Community Data Safeguards

Gor Atlas documents a community that has been surveilled, mis-registered and criminalised
by earlier record-keeping systems — the Criminal Tribes Act of 1871 notified a number of
nomadic and itinerant communities, including Banjara groups in several provinces, and the
Act was not repealed until 1952, after which affected communities were "denotified".
That history is the reason this archive is built with the safeguards below rather than
having them retrofitted. **A cultural archive of a historically over-policed community
must be structurally incapable of being used as a registry of people.**

## 1. Hard prohibitions (enforced in schema and code, not policy prose)

The following have no storage location in the data model. There is no column, no upload
category and no API field for them:

- Household-level mapping or household enumeration
- Names, addresses or phone numbers of private individuals
- Individual-level genealogical records
- Caste certificates, ration/BPL identifiers, Aadhaar or any government ID
- Political-party classification of a Tanda or clan
- Land-ownership or dispute records attributable to a family
- Any ranking of clans by status, purity or precedence

Only **public institutional** contact details (a school, a panchayat office, a registered
society) may be stored, and only in `institutions`, which has no relationship to any
person entity.

## 2. Aggregation floor

Clan and surname information is stored **only at community level**. The minimum
publishable unit is the Tanda, and distribution is expressed as a band
(`predominant` / `substantial` / `present` / `reported`), never as a count of families and
never as a percentage unless a dated, credible source supplies one.

Population data is published at settlement level only, with a suppression rule: if a
settlement's recorded household count is below **10**, sex/child breakdowns are withheld
even when a source supplies them, because at that size a breakdown becomes individually
identifying.

## 3. People of public historical significance

The `people` table exists only for individuals who are **public figures by virtue of
documented public roles** — historical leaders, office-holders, published authors,
recognised artists. Inclusion requires either (a) death and documented public record, or
(b) an explicit, revocable consent record for living persons. Ordinary community members
never appear as entities.

## 4. Consent model for media and oral histories

Every media asset carries a `consent_records` row before it can be published. Nothing
publishes without one — enforced by a foreign key and a publish-time check.

The consent record captures:

| Field | Purpose |
| --- | --- |
| `subject_type` | narrator / photographer / depicted group / institution |
| `granted_by` | who gave it (recorded internally, not published) |
| `scope` | `archive_only` \| `public_display` \| `public_reuse_cc` |
| `attribution_preference` | full name / initials / village only / anonymous |
| `commercial_use_permitted` | boolean, default **false** |
| `ai_training_permitted` | boolean, default **false** |
| `revocable` | always true |
| `expires_at` | optional |
| `evidence_uri` | signed form or recorded verbal consent |

**Verbal consent is valid** and must be, because a large share of oral-history narrators
are elders who may not read the consent language. Recorded verbal consent in the
narrator's own language is captured as an audio file attached to the consent record.

### Revocation

Revocation is honoured within 7 days and cascades: the asset is unpublished, removed from
caches and search indexes, and the changelog records that a withdrawal occurred **without
naming the person who withdrew it**.

## 5. Children and vulnerable persons

- No identifying media of a minor is published without guardian consent **and** a
  narrator-side benefit review.
- School photographs, if published, carry no names.
- Media depicting a person in distress, a disaster, a displacement or an eviction may be
  archived but is `archive_only` by default and requires historian-level review to
  publish.
- Face-visible imagery of minors may be published only where the guardian selected
  `public_display` **and** the depicted content is a public cultural event.

## 6. Location precision as a privacy control

Coordinate precision is a privacy setting, not only an accuracy setting:

- `verified` settlement centroid — full precision
- `unverified` / community-submitted — rounded to 3 decimal places (~110 m)
- `sensitive` flag (set by a Tanda representative, e.g. a settlement facing eviction
  pressure or a site of a current dispute) — rounded to 0.05° and excluded from bulk
  dataset export

There is never a household-level coordinate. The smallest geographic unit is the
settlement.

## 7. Contributor data

Contributor identity is verified (phone or email OTP, plus a stated relationship to the
Tanda) but is **not public by default**. Contributors choose per submission:
public name, village-only attribution, or anonymous. Internal identity is retained for
audit integrity and is accessible only to super administrators.

Contributor personal data is never included in dataset exports.

## 8. Data sovereignty

- The community, not the platform, is the owner of contributed cultural material. The
  platform holds a licence to display, revocable per §4.
- A **Tanda-level withdrawal** mechanism exists: a verified representative body of a
  settlement may request removal of that settlement's culturally-specific material
  (media, oral histories, ritual detail). Geographic and census-derived facts, which are
  public record, remain.
- Bulk export excludes: contributor identities, consent evidence, `archive_only` media,
  `sensitive`-flagged coordinates, and any oral-history transcript whose consent scope is
  not `public_reuse_cc`.
- No `ai_training_permitted` default of true, anywhere, ever.

## 9. Grievance mechanism

A named, reachable route for correction and removal is published on `/privacy`, with a
committed response window (acknowledge 72 h, resolve or explain 30 days), an appeal to the
editorial board, and a public (anonymised) log of grievance outcomes so the mechanism is
itself auditable.
