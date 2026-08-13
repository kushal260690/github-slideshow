import type { AuditEntry, Dispute, Submission } from "@/lib/types";

/**
 * Demonstration moderation queue.
 *
 * These submissions are invented, and they are chosen to exercise the review
 * cases that actually matter: a field-level partial acceptance, a duplicate
 * candidate, a submission that must be blocked for missing consent, a
 * privacy-violating submission that must be rejected outright, and a
 * conflicting-coordinates case.
 *
 * The last two are the point. A moderation dashboard that only demonstrates
 * the happy path is not a moderation dashboard.
 */

export const SUBMISSIONS: Submission[] = [
  {
    id: "sub-1042",
    referenceCode: "GA-2026-1042",
    kind: "population",
    status: "pending",
    tandaId: "demo-0001",
    contributorLabel: "Contributor #4471 (village-only attribution)",
    relationshipToTanda: "Resident",
    sourceCategory: "community_submission",
    sourceDescription:
      "Household count taken by the contributor with the local school, March 2026. No document attached.",
    consentProvided: true,
    fields: [
      {
        field: "population_total",
        label: "Total population (2026 community estimate)",
        currentValue: "1,610 (2024 community estimate)",
        proposedValue: "1,742",
        decision: "pending",
      },
      {
        field: "households",
        label: "Households",
        currentValue: "352",
        proposedValue: "381",
        decision: "pending",
      },
      {
        field: "male_population",
        label: "Male population",
        currentValue: "Not documented",
        proposedValue: "889",
        decision: "pending",
        reviewerNote:
          "A community headcount without a stated method cannot support a sex breakdown at this confidence. Recommend rejecting this field while accepting the totals.",
      },
    ],
    permissionToPublish: true,
    attribution: "village_only",
    submittedAt: "2026-08-02T09:14:00Z",
    flags: ["no_documentary_source", "breakdown_exceeds_source_precision"],
  },
  {
    id: "sub-1043",
    referenceCode: "GA-2026-1043",
    kind: "new_tanda",
    status: "in_review",
    proposedTandaName: "Gundlapally Tanda (proposed)",
    contributorLabel: "Contributor #5120 (full name attribution)",
    relationshipToTanda: "Origin family, now resident elsewhere",
    sourceCategory: "community_submission",
    sourceDescription: "Personal knowledge; contributor's family originates from the settlement.",
    consentProvided: true,
    proposedCoordinates: [79.36, 17.14],
    fields: [
      {
        field: "primary_name",
        label: "Settlement name",
        currentValue: null,
        proposedValue: "Gundlapally Tanda",
        decision: "pending",
      },
      {
        field: "district",
        label: "District",
        currentValue: null,
        proposedValue: "Nalgonda, Telangana",
        decision: "pending",
      },
      {
        field: "established_period",
        label: "Established",
        currentValue: null,
        proposedValue: "1892",
        decision: "pending",
        reviewerNote:
          "An exact year from family memory alone cannot be stored as an exact year — the schema will reject it. Ask the contributor whether the period can be given as a decade or quarter-century instead.",
      },
    ],
    permissionToPublish: true,
    attribution: "full_name",
    submittedAt: "2026-08-04T16:02:00Z",
    assignedTo: "District researcher — Nalgonda",
    flags: ["duplicate_candidate_within_5km", "exact_year_without_document"],
  },
  {
    id: "sub-1044",
    referenceCode: "GA-2026-1044",
    kind: "oral_history",
    status: "evidence_requested",
    tandaId: "demo-0004",
    contributorLabel: "Contributor #3390 (anonymous)",
    relationshipToTanda: "Researcher",
    sourceCategory: "oral_history",
    sourceDescription:
      "Audio recording of an interview with an elder, 42 minutes, in Gor Boli with a Telugu summary.",
    consentProvided: false,
    fields: [
      {
        field: "media_audio",
        label: "Audio recording",
        currentValue: null,
        proposedValue: "interview-2026-03.m4a (42:11)",
        decision: "evidence_requested",
        reviewerNote:
          "Blocked. No consent record is attached, and the platform cannot publish or even archive a recording of an identifiable narrator without one. Recorded verbal consent in the narrator's own language is acceptable and is usually the right route for an elder narrator — the contributor has been asked to supply it.",
      },
    ],
    permissionToPublish: false,
    attribution: "anonymous",
    submittedAt: "2026-08-05T11:41:00Z",
    assignedTo: "State editor — Andhra Pradesh",
    decisionNote: "Awaiting consent record. Nothing from this submission is visible publicly.",
    flags: ["consent_missing", "identifiable_narrator"],
  },
  {
    id: "sub-1045",
    referenceCode: "GA-2026-1045",
    kind: "clan_surname",
    status: "pending",
    tandaId: "demo-0001",
    contributorLabel: "Contributor #6612 (initials)",
    relationshipToTanda: "Resident",
    sourceCategory: "community_submission",
    sourceDescription: "Submitted as a list of families by name and clan.",
    consentProvided: true,
    fields: [
      {
        field: "clan_composition",
        label: "Clan composition",
        currentValue: "Rathod (predominant), Banoth (substantial), Bhukya (present)",
        proposedValue:
          "[Withheld by the system — submission contained a list of named households]",
        decision: "rejected",
        reviewerNote:
          "Rejected on privacy grounds and the household-level data was discarded rather than stored. The archive's minimum publishable unit is the settlement, and clan composition is published only as a band. The contributor has been thanked and asked whether they can confirm the band levels instead, which is the same information at a resolution that is safe to hold.",
      },
    ],
    permissionToPublish: true,
    attribution: "initials",
    submittedAt: "2026-08-06T08:20:00Z",
    flags: ["household_level_data_rejected", "privacy_violation_blocked"],
  },
  {
    id: "sub-1046",
    referenceCode: "GA-2026-1046",
    kind: "correction",
    status: "pending",
    tandaId: "demo-0003",
    contributorLabel: "Contributor #2205 (village-only attribution)",
    relationshipToTanda: "Verified Tanda representative",
    sourceCategory: "community_submission",
    sourceDescription: "Correction to the recorded location following the settlement's relocation.",
    consentProvided: true,
    proposedCoordinates: [76.91, 17.38],
    fields: [
      {
        field: "coordinates",
        label: "Coordinates",
        currentValue: "76.8, 17.3 (original site)",
        proposedValue: "76.91, 17.38 (present site)",
        decision: "pending",
        reviewerNote:
          "Do not overwrite. A relocated settlement keeps its original point as a historical record and gains a second linked point for the present site — the earlier location is frequently the only surviving trace of where a community lived. Create the link rather than editing the coordinate.",
      },
    ],
    permissionToPublish: true,
    attribution: "village_only",
    submittedAt: "2026-08-08T13:55:00Z",
    flags: ["coordinate_conflict", "would_destroy_historical_record"],
  },
];

export const DISPUTES: Dispute[] = [
  {
    id: "dsp-201",
    subjectType: "tanda",
    subjectLabel: "Sangapur Tanda (demo)",
    field: "established_period",
    raisedBy: "Contributor #1180",
    reason:
      "Two founding accounts are recorded with roughly seventy years between them. The contributor states that the later account is the one held by most families in the settlement and asks that the earlier be removed.",
    status: "coexisting",
    resolutionNote:
      "Both accounts retained. Prevalence within a settlement is not evidence of accuracy, and removing a minority account would erase precisely the variation this archive exists to record. The relative prevalence has been added as an editorial note on the earlier account instead.",
    createdAt: "2026-07-19T10:00:00Z",
  },
  {
    id: "dsp-202",
    subjectType: "clan",
    subjectLabel: "Vadtya / Badavath",
    field: "clan_relationship",
    raisedBy: "Subject-matter expert #14",
    reason:
      "Whether Vadtya is a distinct clan or a group associated with Rathod is reported differently in different districts of Telangana.",
    status: "open",
    createdAt: "2026-07-28T15:30:00Z",
  },
];

export const AUDIT_LOG: AuditEntry[] = [
  {
    id: "aud-9001",
    actor: "State editor — Telangana",
    action: "reject_field",
    subjectType: "submission",
    subjectLabel: "GA-2026-1045",
    field: "clan_composition",
    before: "—",
    after: "rejected",
    reason: "Household-level data. Discarded, not stored.",
    occurredAt: "2026-08-06T09:02:00Z",
  },
  {
    id: "aud-9002",
    actor: "District researcher — Nalgonda",
    action: "claim_submission",
    subjectType: "submission",
    subjectLabel: "GA-2026-1043",
    occurredAt: "2026-08-05T07:40:00Z",
  },
  {
    id: "aud-9003",
    actor: "State editor — Andhra Pradesh",
    action: "request_evidence",
    subjectType: "submission",
    subjectLabel: "GA-2026-1044",
    field: "media_audio",
    reason: "Consent record missing for an identifiable narrator.",
    occurredAt: "2026-08-05T12:10:00Z",
  },
  {
    id: "aud-9004",
    actor: "Historian reviewer",
    action: "open_dispute",
    subjectType: "clan",
    subjectLabel: "Vadtya / Badavath",
    field: "clan_relationship",
    reason: "Conflicting regional accounts.",
    occurredAt: "2026-07-28T15:31:00Z",
  },
  {
    id: "aud-9005",
    actor: "System",
    action: "consent_withdrawal_applied",
    subjectType: "media_asset",
    subjectLabel: "(asset unpublished)",
    reason:
      "Consent withdrawn or expired; asset unpublished. The person who withdrew is deliberately not recorded in the public log.",
    occurredAt: "2026-07-11T00:05:00Z",
  },
];

/** Editorial roles and what each may do. Mirrors db/policies.sql. */
export const EDITORIAL_ROLES = [
  {
    role: "Public contributor",
    canDo: "Submit information and evidence. Cannot publish anything.",
    maxVerification: "—",
  },
  {
    role: "Verified Tanda representative",
    canDo: "Confirm settlement identity and location for their own Tanda.",
    maxVerification: "Unverified",
  },
  {
    role: "District researcher",
    canDo: "Review submissions field by field within their district.",
    maxVerification: "Partially verified",
  },
  {
    role: "Subject-matter expert",
    canDo: "Review interpretive claims; may open a dispute.",
    maxVerification: "Partially verified",
  },
  {
    role: "State editor",
    canDo: "Decide submissions and verify records within their state.",
    maxVerification: "Verified (own state)",
  },
  {
    role: "Historian / reviewer",
    canDo: "Verify or mark disputed nationally; adjudicate evidence quality.",
    maxVerification: "Verified, Disputed",
  },
  {
    role: "Super administrator",
    canDo: "All of the above, plus rollback and role management.",
    maxVerification: "All",
  },
];
