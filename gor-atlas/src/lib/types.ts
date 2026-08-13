/**
 * Gor Atlas domain types.
 *
 * The central idea, and the reason this file is shaped the way it is: there is
 * no bare factual value anywhere in the system. Every contestable statement is
 * a `Fact<T>` carrying its own evidence. A component that renders a value
 * cannot avoid also having the provenance in hand.
 *
 * Mirrors db/schema.sql. See docs/02 and docs/03.
 */

export type VerificationStatus =
  | "not_documented"
  | "unverified"
  | "partially_verified"
  | "verified"
  | "disputed";

export type ConfidenceLevel = "low" | "medium" | "high";

export type SourceCategory =
  | "census"
  | "government_record"
  | "academic"
  | "archival_document"
  | "oral_history"
  | "community_submission"
  | "media_report"
  | "demo_placeholder";

/** Public-facing labels for historical and migration claims (docs/03 §7). */
export type InterpretationLabel =
  | "documented"
  | "widely_accepted_interpretation"
  | "oral_tradition"
  | "disputed"
  | "insufficient_evidence";

export type DatePrecision =
  | "exact_year"
  | "decade"
  | "quarter_century"
  | "century"
  | "era"
  | "unknown";

export type SettlementType =
  | "rural"
  | "urban"
  | "relocated"
  | "absorbed"
  | "historical"
  | "diaspora";

export type CoordinatePrecision = "surveyed" | "approximate" | "reduced" | "obscured";

/** Aggregation bands — never counts, never percentages (docs/04 §2). */
export type PresenceBand =
  | "predominant"
  | "substantial"
  | "present"
  | "reported"
  | "not_documented";

export type AssociationStrength =
  | "commonly_associated"
  | "regionally_associated"
  | "contested";

export type ClanRelationshipType =
  | "associated_with"
  | "regionally_grouped_with"
  | "shares_tradition_with"
  | "name_variant_of"
  | "disputed_association";

export type ContributorRole =
  | "public_contributor"
  | "verified_tanda_representative"
  | "district_researcher"
  | "state_editor"
  | "subject_matter_expert"
  | "historian_reviewer"
  | "super_admin";

export type SubmissionKind =
  | "new_tanda"
  | "correction"
  | "population"
  | "clan_surname"
  | "historical_date"
  | "oral_history"
  | "photograph"
  | "document"
  | "audio_video"
  | "institution"
  | "migration_information";

export type SubmissionStatus =
  | "draft"
  | "pending"
  | "in_review"
  | "evidence_requested"
  | "accepted"
  | "partially_accepted"
  | "rejected"
  | "withdrawn";

export type FieldDecision = "pending" | "accepted" | "rejected" | "evidence_requested";

export type ConsentScope = "archive_only" | "public_display" | "public_reuse_cc";

export type AttributionPreference =
  | "full_name"
  | "initials"
  | "village_only"
  | "anonymous";

export type MediaKind =
  | "historical_photograph"
  | "present_day_photograph"
  | "drone_image"
  | "audio_oral_history"
  | "audio_folk_song"
  | "video_interview"
  | "documentary"
  | "document_scan"
  | "newspaper_clipping"
  | "census_page"
  | "map";

export type CulturalPracticeKind =
  | "festival"
  | "dress_embroidery"
  | "jewellery"
  | "music"
  | "instrument"
  | "dance"
  | "food"
  | "marriage_custom"
  | "oral_literature"
  | "traditional_occupation"
  | "contemporary_livelihood"
  | "craft"
  | "spiritual_tradition";

export type InstitutionKind =
  | "gram_panchayat"
  | "municipality"
  | "community_hall"
  | "temple_shrine"
  | "school"
  | "college"
  | "cultural_organisation"
  | "ngo"
  | "cooperative"
  | "library";

export type HistoricalEventKind =
  | "settlement_founded"
  | "migration_arrival"
  | "migration_departure"
  | "relocation"
  | "administrative_change"
  | "displacement"
  | "urban_absorption"
  | "institution_founded"
  | "natural_event"
  | "legal_policy_change"
  | "other";

/* ------------------------------------------------------------------------ */
/* Periods — the structural defence against fabricated exact dates            */
/* ------------------------------------------------------------------------ */

export interface Period {
  start: number | null;
  end: number | null;
  precision: DatePrecision;
}

/* ------------------------------------------------------------------------ */
/* The provenance envelope                                                    */
/* ------------------------------------------------------------------------ */

export interface Provenance {
  verification: VerificationStatus;
  confidence: ConfidenceLevel;
  /** Source register ids. Empty means unsourced — which the UI states plainly. */
  sourceIds: string[];
  interpretation?: InterpretationLabel;
  period?: Period;
  contributor?: string;
  reviewer?: string;
  reviewedAt?: string;
  /** Public editorial note shown alongside the value. */
  editorialNote?: string;
  isDemo?: boolean;
}

/**
 * A single factual assertion. `value === null` means "not yet documented" —
 * a first-class state, never rendered as a blank or filled with a guess.
 */
export interface Fact<T> extends Provenance {
  value: T | null;
}

/**
 * Two or more incompatible claims held at once. This is what `disputed` means:
 * the platform records the disagreement instead of adjudicating it.
 */
export interface ContestedFact<T> {
  claims: Fact<T>[];
  editorialNote?: string;
}

/* ------------------------------------------------------------------------ */
/* Sources                                                                    */
/* ------------------------------------------------------------------------ */

export interface Source {
  id: string;
  title: string;
  authorOrOrg?: string;
  publicationYear?: number;
  category: SourceCategory;
  url?: string;
  archiveReference?: string;
  publisher?: string;
  language?: string;
  narratorAttribution?: string;
  notes?: string;
  isDemo?: boolean;
}

/* ------------------------------------------------------------------------ */
/* Geography and settlements                                                  */
/* ------------------------------------------------------------------------ */

export interface StateRecord {
  id: string;
  code: string;
  name: string;
  nameLocal?: string;
  /** Rough label placement for the map only. Not a boundary claim. */
  centroid: [number, number];
  districts: DistrictRecord[];
}

export interface DistrictRecord {
  id: string;
  stateId: string;
  name: string;
}

export interface TandaName {
  name: string;
  kind: "official" | "local" | "historical" | "alternate_spelling" | "transliteration";
  script?: string;
  locale?: string;
  isPrimary?: boolean;
  sourceIds?: string[];
  period?: Period;
}

export interface PopulationRecord {
  asOfYear: number;
  /** Non-optional by design: no population figure without a dated source. */
  sourceId: string;
  totalPopulation: number | null;
  households: number | null;
  malePopulation?: number | null;
  femalePopulation?: number | null;
  childPopulation?: number | null;
  isCommunityEstimate: boolean;
  migrationIn?: number | null;
  migrationOut?: number | null;
  verification: VerificationStatus;
  confidence: ConfidenceLevel;
  editorialNote?: string;
  isDemo?: boolean;
}

export interface ClanPresence {
  clanId: string;
  band: PresenceBand;
  verification: VerificationStatus;
  confidence: ConfidenceLevel;
  sourceIds: string[];
  editorialNote?: string;
}

export interface HistoricalEvent {
  id: string;
  kind: HistoricalEventKind;
  title: string;
  description?: string;
  period: Period;
  interpretation: InterpretationLabel;
  verification: VerificationStatus;
  confidence: ConfidenceLevel;
  sourceIds: string[];
  editorialNote?: string;
  /** null = community-wide event rather than settlement-specific */
  tandaId?: string | null;
  isDemo?: boolean;
}

export interface CulturalPractice {
  id: string;
  kind: CulturalPracticeKind;
  name: string;
  description?: string;
  region?: string;
  verification: VerificationStatus;
  confidence: ConfidenceLevel;
  interpretation: InterpretationLabel;
  sourceIds: string[];
  editorialNote?: string;
  isDemo?: boolean;
}

export interface Institution {
  id: string;
  kind: InstitutionKind;
  name: string;
  /** Public institutional contact only. Never a private individual's. */
  publicPhone?: string;
  publicEmail?: string;
  established?: Period;
  verification: VerificationStatus;
  sourceIds: string[];
  isDemo?: boolean;
}

/**
 * Traditional governance recorded as a STRUCTURE, not as a register of the
 * people currently holding office.
 */
export interface GovernanceRole {
  roleName: string;
  description?: string;
  isCustomary: boolean;
  currentlyActive: boolean | null;
  verification: VerificationStatus;
  confidence: ConfidenceLevel;
  sourceIds: string[];
  editorialNote?: string;
}

export interface ConsentRecord {
  id: string;
  scope: ConsentScope;
  attribution: AttributionPreference;
  commercialUsePermitted: boolean;
  aiTrainingPermitted: boolean;
  isVerbal: boolean;
  consentLanguage?: string;
  involvesMinor: boolean;
  guardianConsent: boolean;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
}

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  title: string;
  description?: string;
  ownerAttribution?: string;
  contributorLabel?: string;
  consentId: string;
  captured?: Period;
  tandaId?: string;
  clanId?: string;
  sourceIds: string[];
  verification: VerificationStatus;
  isPublished: boolean;
  durationSeconds?: number;
  isDemo?: boolean;
}

export interface Tanda {
  id: string;
  publicId: string;
  primaryName: string;
  names: TandaName[];
  stateId: string;
  districtId: string;
  subdistrict: Fact<string>;
  nearestVillage: Fact<string>;
  pinCode: Fact<string>;
  settlementType: SettlementType;
  /** [lng, lat] — null when only an administrative location is known. */
  coordinates: [number, number] | null;
  coordinatePrecision: CoordinatePrecision;
  coordinateNote?: string;
  sensitiveLocation: boolean;
  verification: VerificationStatus;
  completenessPct: number;
  isDemo: boolean;

  populationRecords: PopulationRecord[];
  populationTrend: Fact<string>;
  clanPresence: ClanPresence[];
  surnameNotes: Fact<string>;
  events: HistoricalEvent[];
  originStory: ContestedFact<string> | null;
  previousLocation: Fact<string>;
  migrationRouteIds: string[];

  dialect: Fact<string>;
  languagesSpoken: Fact<string[]>;
  practices: CulturalPractice[];
  governance: GovernanceRole[];
  institutions: Institution[];
  media: MediaAsset[];

  editorialNote?: string;
  lastReviewedAt?: string;
}

/* ------------------------------------------------------------------------ */
/* Clans and surnames                                                         */
/* ------------------------------------------------------------------------ */

export interface ClanVariant {
  variant: string;
  script?: string;
  region?: string;
  sourceIds?: string[];
}

export interface Subclan {
  name: string;
  region?: string;
  verification: VerificationStatus;
  confidence: ConfidenceLevel;
  sourceIds: string[];
  editorialNote?: string;
}

export interface Clan {
  id: string;
  slug: string;
  primaryName: string;
  summary: string;
  variants: ClanVariant[];
  subclans: Subclan[];
  /** Regions where the name is reported. Not a distribution measurement. */
  reportedRegions: Fact<string[]>;
  traditionalOccupations: Fact<string[]>;
  oralTraditions: ContestedFact<string> | null;
  verification: VerificationStatus;
  confidence: ConfidenceLevel;
  sourceIds: string[];
  editorialNote?: string;
  isDemo?: boolean;
}

/** Typed, sourced, and deliberately non-hierarchical. */
export interface ClanRelationship {
  fromClanId: string;
  toClanId: string;
  relationship: ClanRelationshipType;
  region?: string;
  verification: VerificationStatus;
  confidence: ConfidenceLevel;
  sourceIds: string[];
  editorialNote?: string;
}

export interface Surname {
  id: string;
  slug: string;
  primaryForm: string;
  variants: { variant: string; script?: string; region?: string }[];
  /** Many-to-many and region-qualified. Never "belongs to". */
  clanAssociations: {
    clanId: string;
    strength: AssociationStrength;
    region?: string;
    verification: VerificationStatus;
    confidence: ConfidenceLevel;
    sourceIds: string[];
    editorialNote?: string;
  }[];
  notes?: string;
}

/* ------------------------------------------------------------------------ */
/* Migration                                                                  */
/* ------------------------------------------------------------------------ */

export interface RouteWaypoint {
  label: string;
  coordinates: [number, number];
  note?: string;
}

export interface RouteEvidence {
  interpretation: InterpretationLabel;
  summary: string;
  sourceIds: string[];
  verification: VerificationStatus;
  confidence: ConfidenceLevel;
  editorialNote?: string;
}

export interface MigrationRoute {
  id: string;
  slug: string;
  name: string;
  description: string;
  period: Period;
  waypoints: RouteWaypoint[];
  /** Several evidence rows with DIFFERENT labels may coexist by design. */
  evidence: RouteEvidence[];
  isDemo?: boolean;
}

/* ------------------------------------------------------------------------ */
/* Encyclopedia                                                               */
/* ------------------------------------------------------------------------ */

export interface ArticleRevision {
  at: string;
  by: string;
  summary: string;
}

export interface Article {
  id: string;
  slug: string;
  section: string;
  title: string;
  standfirst: string;
  body: string;
  locale: string;
  readingMinutes: number;
  verification: VerificationStatus;
  /** Source leads that an editor must confirm before they become citations. */
  sourceIds: string[];
  sourceLeads?: string[];
  contributors: string[];
  revisions: ArticleRevision[];
  editorialNote?: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------------ */
/* Contribution and moderation                                                */
/* ------------------------------------------------------------------------ */

export interface SubmissionField {
  field: string;
  label: string;
  currentValue: string | null;
  proposedValue: string;
  decision: FieldDecision;
  reviewerNote?: string;
}

export interface Submission {
  id: string;
  referenceCode: string;
  kind: SubmissionKind;
  status: SubmissionStatus;
  tandaId?: string;
  proposedTandaName?: string;
  contributorLabel: string;
  relationshipToTanda: string;
  sourceCategory: SourceCategory;
  sourceDescription: string;
  consentProvided: boolean;
  proposedCoordinates?: [number, number];
  fields: SubmissionField[];
  permissionToPublish: boolean;
  attribution: AttributionPreference;
  submittedAt: string;
  assignedTo?: string;
  decisionNote?: string;
  /** Automated checks run at submission time (docs/07). */
  flags: string[];
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  subjectType: string;
  subjectLabel: string;
  field?: string;
  before?: string;
  after?: string;
  reason?: string;
  occurredAt: string;
}

export interface Dispute {
  id: string;
  subjectType: string;
  subjectLabel: string;
  field: string;
  raisedBy: string;
  reason: string;
  status: "open" | "resolved" | "coexisting";
  resolutionNote?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------------ */
/* Helpers                                                                    */
/* ------------------------------------------------------------------------ */

/** The honest empty value. Used everywhere data is genuinely absent. */
export function notDocumented<T>(note?: string): Fact<T> {
  return {
    value: null,
    verification: "not_documented",
    confidence: "low",
    sourceIds: [],
    editorialNote: note,
  };
}

export function isDocumented<T>(fact: Fact<T> | undefined | null): boolean {
  return !!fact && fact.value !== null && fact.verification !== "not_documented";
}
