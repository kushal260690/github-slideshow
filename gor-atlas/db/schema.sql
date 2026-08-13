-- ============================================================================
-- Gor Atlas — The Living Encyclopedia of Banjara Heritage
-- PostgreSQL 15+ / PostGIS 3.3+  —  canonical schema
--
-- Design rules encoded here (see docs/02, docs/03, docs/04):
--   * No bare factual value. Every assertion carries source + verification +
--     confidence + contributor + reviewer.
--   * No population figure without a dated source (enforced NOT NULL).
--   * No exact year when only a period is known (period_start/end + precision).
--   * No surname->clan exclusivity (many-to-many with strength + region).
--   * No self-verification (CHECK reviewer <> contributor).
--   * No household-level or individual-level personal data (no such columns).
--   * No media publication without a consent record (FK + publish guard).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. Enumerations
-- ---------------------------------------------------------------------------

CREATE TYPE verification_status AS ENUM (
  'not_documented', 'unverified', 'partially_verified', 'verified', 'disputed'
);

CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high');

CREATE TYPE source_category AS ENUM (
  'census', 'government_record', 'academic', 'archival_document',
  'oral_history', 'community_submission', 'media_report', 'demo_placeholder'
);

-- Public-facing interpretation labels for historical / migration claims.
CREATE TYPE interpretation_label AS ENUM (
  'documented', 'widely_accepted_interpretation', 'oral_tradition',
  'disputed', 'insufficient_evidence'
);

CREATE TYPE date_precision AS ENUM (
  'exact_year', 'decade', 'quarter_century', 'century', 'era', 'unknown'
);

CREATE TYPE settlement_type AS ENUM (
  'rural', 'urban', 'relocated', 'absorbed', 'historical', 'diaspora'
);

CREATE TYPE coordinate_precision AS ENUM (
  'surveyed',        -- from an official or GPS-surveyed source
  'approximate',     -- community-confirmed, full precision
  'reduced',         -- rounded to ~110 m for unverified records
  'obscured'         -- rounded to ~5 km, privacy protection for sensitive sites
);

-- Aggregation bands. Deliberately NOT counts and NOT percentages, so that clan
-- composition can never be published at a resolution that identifies families.
CREATE TYPE presence_band AS ENUM (
  'predominant', 'substantial', 'present', 'reported', 'not_documented'
);

CREATE TYPE association_strength AS ENUM (
  'commonly_associated', 'regionally_associated', 'contested'
);

-- Typed, non-hierarchical. There is deliberately no 'parent_of' / 'child_of'.
CREATE TYPE clan_relationship_type AS ENUM (
  'associated_with', 'regionally_grouped_with', 'shares_tradition_with',
  'name_variant_of', 'disputed_association'
);

CREATE TYPE contributor_role AS ENUM (
  'public_contributor', 'verified_tanda_representative', 'district_researcher',
  'state_editor', 'subject_matter_expert', 'historian_reviewer', 'super_admin'
);

CREATE TYPE submission_kind AS ENUM (
  'new_tanda', 'correction', 'population', 'clan_surname', 'historical_date',
  'oral_history', 'photograph', 'document', 'audio_video', 'institution',
  'migration_information'
);

CREATE TYPE submission_status AS ENUM (
  'draft', 'pending', 'in_review', 'evidence_requested',
  'accepted', 'partially_accepted', 'rejected', 'withdrawn'
);

CREATE TYPE field_decision AS ENUM ('pending', 'accepted', 'rejected', 'evidence_requested');

CREATE TYPE consent_scope AS ENUM ('archive_only', 'public_display', 'public_reuse_cc');

CREATE TYPE attribution_preference AS ENUM (
  'full_name', 'initials', 'village_only', 'anonymous'
);

CREATE TYPE media_kind AS ENUM (
  'historical_photograph', 'present_day_photograph', 'drone_image',
  'audio_oral_history', 'audio_folk_song', 'video_interview', 'documentary',
  'document_scan', 'newspaper_clipping', 'census_page', 'map'
);

CREATE TYPE cultural_practice_kind AS ENUM (
  'festival', 'dress_embroidery', 'jewellery', 'music', 'instrument', 'dance',
  'food', 'marriage_custom', 'oral_literature', 'traditional_occupation',
  'contemporary_livelihood', 'craft', 'spiritual_tradition'
);

CREATE TYPE institution_kind AS ENUM (
  'gram_panchayat', 'municipality', 'community_hall', 'temple_shrine',
  'school', 'college', 'cultural_organisation', 'ngo', 'cooperative', 'library'
);

CREATE TYPE translation_method AS ENUM (
  'human', 'community', 'machine_post_edited', 'machine'
);

CREATE TYPE historical_event_kind AS ENUM (
  'settlement_founded', 'migration_arrival', 'migration_departure',
  'relocation', 'administrative_change', 'displacement', 'urban_absorption',
  'institution_founded', 'natural_event', 'legal_policy_change', 'other'
);

-- ---------------------------------------------------------------------------
-- 2. Contributors, roles, audit
-- ---------------------------------------------------------------------------

CREATE TABLE contributors (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name      text,                       -- may be null for anonymous
  -- Contact data is stored for audit integrity only and is never exported or
  -- published. See docs/04 §7.
  contact_hash      text,                       -- hashed phone/email, never raw
  identity_verified boolean NOT NULL DEFAULT false,
  verification_method text,                     -- 'otp_phone' | 'otp_email' | 'in_person'
  home_state_id     uuid,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contributor_role_grants (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contributor_id uuid NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  role           contributor_role NOT NULL,
  -- Scope limits a state_editor to their own state, a district_researcher to
  -- their district. NULL scope = national (historian, super_admin only).
  scope_state_id    uuid,
  scope_district_id uuid,
  granted_by     uuid REFERENCES contributors(id),
  granted_at     timestamptz NOT NULL DEFAULT now(),
  revoked_at     timestamptz,
  UNIQUE (contributor_id, role, scope_state_id, scope_district_id)
);

CREATE TABLE audit_log (
  id           bigserial PRIMARY KEY,
  actor_id     uuid REFERENCES contributors(id),
  action       text NOT NULL,          -- 'accept_field' | 'verify' | 'rollback' | ...
  subject_type text NOT NULL,
  subject_id   uuid NOT NULL,
  field        text,
  before_value jsonb,
  after_value  jsonb,
  reason       text,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);
-- Append-only: history is never rewritten, only added to.
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

CREATE INDEX idx_audit_subject ON audit_log (subject_type, subject_id, occurred_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Sources and citations — the evidence layer
-- ---------------------------------------------------------------------------

CREATE TABLE sources (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             text NOT NULL,
  author_or_org     text,
  publication_year  integer,
  category          source_category NOT NULL,
  url               text,
  archive_reference text,                    -- shelf mark, accession no., DOI
  publisher         text,
  language          text,
  -- For oral history sources: narrator handled via consent, never named here
  -- unless the narrator chose public attribution.
  narrator_attribution text,
  notes             text,
  is_demo           boolean NOT NULL DEFAULT false,
  added_by          uuid REFERENCES contributors(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT source_year_sane CHECK (
    publication_year IS NULL OR publication_year BETWEEN 1500 AND 2100
  )
);

-- Polymorphic citation: links any field of any subject to a source.
CREATE TABLE citations (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id    uuid NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  subject_type text NOT NULL,      -- 'tanda' | 'clan' | 'article' | 'route' | ...
  subject_id   uuid NOT NULL,
  field        text,               -- which claim this source supports
  locator      text,               -- page, plate, table, timestamp
  quotation    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_citations_subject ON citations (subject_type, subject_id);

-- ---------------------------------------------------------------------------
-- 4. Geography
-- ---------------------------------------------------------------------------

CREATE TABLE countries (
  id    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  iso2  char(2) NOT NULL UNIQUE,
  name  text NOT NULL
);

CREATE TABLE states (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id uuid NOT NULL REFERENCES countries(id),
  code       text NOT NULL,
  name       text NOT NULL,
  boundary   geography(MultiPolygon, 4326),
  UNIQUE (country_id, code)
);

CREATE TABLE districts (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_id uuid NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  code     text,
  name     text NOT NULL,
  boundary geography(MultiPolygon, 4326),
  UNIQUE (state_id, name)
);

-- mandal / tehsil / taluk / block — one table, a label column for the local term
CREATE TABLE subdistricts (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  district_id uuid NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name        text NOT NULL,
  unit_label  text NOT NULL DEFAULT 'mandal',   -- mandal|tehsil|taluk|block
  UNIQUE (district_id, name)
);

CREATE TABLE villages (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdistrict_id uuid NOT NULL REFERENCES subdistricts(id) ON DELETE CASCADE,
  name           text NOT NULL,
  lgd_code       text,     -- Local Government Directory code where known
  pin_code       text,
  geom           geography(Point, 4326)
);

-- ---------------------------------------------------------------------------
-- 5. Tandas — settlement identity and geometry only.
--    Every contestable statement about a Tanda lives in an assertion table.
-- ---------------------------------------------------------------------------

CREATE TABLE tandas (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_id             text NOT NULL UNIQUE,    -- e.g. 'GOR-TS-NLG-0001'
  primary_name          text NOT NULL,           -- display only; search uses tanda_names
  state_id              uuid NOT NULL REFERENCES states(id),
  district_id           uuid NOT NULL REFERENCES districts(id),
  subdistrict_id        uuid REFERENCES subdistricts(id),
  nearest_village_id    uuid REFERENCES villages(id),
  pin_code              text,
  settlement_type       settlement_type NOT NULL DEFAULT 'rural',
  geom                  geography(Point, 4326),
  coord_precision       coordinate_precision NOT NULL DEFAULT 'reduced',
  location_source_id    uuid REFERENCES sources(id),
  -- Privacy control: excludes the point from bulk export and coarsens display.
  sensitive_location    boolean NOT NULL DEFAULT false,
  verification          verification_status NOT NULL DEFAULT 'unverified',
  is_demo               boolean NOT NULL DEFAULT false,
  completeness_pct      smallint NOT NULL DEFAULT 0
                          CHECK (completeness_pct BETWEEN 0 AND 100),
  created_by            uuid REFERENCES contributors(id),
  reviewed_by           uuid REFERENCES contributors(id),
  reviewed_at           timestamptz,
  editorial_note        text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- A settlement cannot be 'verified' without both a source and a reviewer.
  CONSTRAINT tanda_verified_needs_evidence CHECK (
    verification <> 'verified'
    OR (location_source_id IS NOT NULL AND reviewed_by IS NOT NULL)
  ),
  -- No self-verification.
  CONSTRAINT tanda_no_self_verification CHECK (
    reviewed_by IS NULL OR reviewed_by IS DISTINCT FROM created_by
  )
);

CREATE INDEX idx_tandas_geom      ON tandas USING GIST (geom);
CREATE INDEX idx_tandas_district  ON tandas (district_id, verification);
CREATE INDEX idx_tandas_state     ON tandas (state_id, verification);

-- Names are a table, not a string: official / local / historical / scripts /
-- spellings all coexist and search runs across all of them.
CREATE TABLE tanda_names (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanda_id    uuid NOT NULL REFERENCES tandas(id) ON DELETE CASCADE,
  name        text NOT NULL,
  name_normalised text GENERATED ALWAYS AS (lower(unaccent(name))) STORED,
  name_kind   text NOT NULL,     -- 'official'|'local'|'historical'|'alternate_spelling'|'transliteration'
  script      text,              -- 'Latn'|'Deva'|'Telu'|'Knda'|'Gujr'
  locale      text,              -- 'en'|'hi'|'te'|'mr'|'kn'|'gbl-Deva'
  is_primary  boolean NOT NULL DEFAULT false,
  source_id   uuid REFERENCES sources(id),
  period_start integer,
  period_end   integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tanda_names_trgm
  ON tanda_names USING GIN (name_normalised gin_trgm_ops);
CREATE INDEX idx_tanda_names_tanda ON tanda_names (tanda_id);

-- ---------------------------------------------------------------------------
-- 6. The provenance envelope, applied to every assertion table
-- ---------------------------------------------------------------------------
-- Implemented as a repeated column set rather than inheritance so that each
-- table keeps its own constraints and indexes. The shared columns are:
--   source_id, verification, confidence, period_start, period_end,
--   date_precision, contributor_id, reviewer_id, reviewed_at,
--   editorial_note, is_demo, superseded_by, created_at, updated_at
-- ---------------------------------------------------------------------------

-- 6a. Population -------------------------------------------------------------
CREATE TABLE population_records (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanda_id        uuid NOT NULL REFERENCES tandas(id) ON DELETE CASCADE,
  as_of_year      integer NOT NULL,          -- anti-fabrication: dated or nothing
  source_id       uuid NOT NULL REFERENCES sources(id),  -- anti-fabrication: sourced or nothing
  total_population integer CHECK (total_population IS NULL OR total_population >= 0),
  households       integer CHECK (households IS NULL OR households >= 0),
  male_population   integer,
  female_population integer,
  child_population  integer,
  is_community_estimate boolean NOT NULL DEFAULT false,
  migration_in     integer,
  migration_out    integer,
  verification     verification_status NOT NULL DEFAULT 'unverified',
  confidence       confidence_level NOT NULL DEFAULT 'low',
  contributor_id   uuid REFERENCES contributors(id),
  reviewer_id      uuid REFERENCES contributors(id),
  reviewed_at      timestamptz,
  editorial_note   text,
  is_demo          boolean NOT NULL DEFAULT false,
  superseded_by    uuid REFERENCES population_records(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pop_year_sane CHECK (as_of_year BETWEEN 1800 AND 2100),
  CONSTRAINT pop_no_self_verification CHECK (
    reviewer_id IS NULL OR reviewer_id IS DISTINCT FROM contributor_id
  ),
  CONSTRAINT pop_verified_needs_reviewer CHECK (
    verification <> 'verified' OR reviewer_id IS NOT NULL
  ),
  -- Privacy floor (docs/04 §2): below 10 households, no demographic breakdown.
  CONSTRAINT pop_small_settlement_suppression CHECK (
    households IS NULL OR households >= 10
    OR (male_population IS NULL AND female_population IS NULL
        AND child_population IS NULL)
  ),
  UNIQUE (tanda_id, as_of_year, source_id)
);
CREATE INDEX idx_pop_tanda_year ON population_records (tanda_id, as_of_year DESC);

-- 6b. Clans, subclans, surnames ---------------------------------------------
CREATE TABLE clans (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug           text NOT NULL UNIQUE,
  primary_name   text NOT NULL,
  summary        text,
  -- Clan symbols / oral traditions kept as sourced narrative, not as attributes
  verification   verification_status NOT NULL DEFAULT 'unverified',
  confidence     confidence_level NOT NULL DEFAULT 'low',
  source_id      uuid REFERENCES sources(id),
  editorial_note text,
  is_demo        boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clan_name_variants (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_id    uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  variant    text NOT NULL,
  variant_normalised text GENERATED ALWAYS AS (lower(unaccent(variant))) STORED,
  script     text,
  region     text,          -- where this spelling is used
  source_id  uuid REFERENCES sources(id),
  UNIQUE (clan_id, variant, region)
);
CREATE INDEX idx_clan_variants_trgm
  ON clan_name_variants USING GIN (variant_normalised gin_trgm_ops);

CREATE TABLE subclans (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_id    uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  name       text NOT NULL,
  region     text,
  verification verification_status NOT NULL DEFAULT 'unverified',
  confidence   confidence_level NOT NULL DEFAULT 'low',
  source_id    uuid REFERENCES sources(id),
  editorial_note text,
  UNIQUE (clan_id, name, region)
);

-- Non-hierarchical, typed, sourced. Each direction is its own row so that a
-- regionally one-sided association is not silently made symmetric.
CREATE TABLE clan_relationships (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_clan_id   uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  to_clan_id     uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  relationship   clan_relationship_type NOT NULL,
  region         text,
  verification   verification_status NOT NULL DEFAULT 'unverified',
  confidence     confidence_level NOT NULL DEFAULT 'low',
  source_id      uuid REFERENCES sources(id),
  editorial_note text,
  CONSTRAINT clan_rel_not_self CHECK (from_clan_id <> to_clan_id),
  UNIQUE (from_clan_id, to_clan_id, relationship, region)
);

CREATE TABLE surnames (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         text NOT NULL UNIQUE,
  primary_form text NOT NULL,
  notes        text,
  is_demo      boolean NOT NULL DEFAULT false
);

CREATE TABLE surname_variants (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  surname_id  uuid NOT NULL REFERENCES surnames(id) ON DELETE CASCADE,
  variant     text NOT NULL,
  variant_normalised text GENERATED ALWAYS AS (lower(unaccent(variant))) STORED,
  script      text,
  region      text,
  source_id   uuid REFERENCES sources(id),
  UNIQUE (surname_id, variant, region)
);
CREATE INDEX idx_surname_variants_trgm
  ON surname_variants USING GIN (variant_normalised gin_trgm_ops);

-- Many-to-many, region-qualified, strength-graded.
-- There is no column that could express "this surname belongs to this clan".
CREATE TABLE surname_clan_associations (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  surname_id     uuid NOT NULL REFERENCES surnames(id) ON DELETE CASCADE,
  clan_id        uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  strength       association_strength NOT NULL DEFAULT 'regionally_associated',
  region         text,
  verification   verification_status NOT NULL DEFAULT 'unverified',
  confidence     confidence_level NOT NULL DEFAULT 'low',
  source_id      uuid REFERENCES sources(id),
  editorial_note text,
  UNIQUE (surname_id, clan_id, region)
);

-- Clan presence in a settlement: bands only, never counts (docs/04 §2).
CREATE TABLE tanda_clan_presence (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanda_id       uuid NOT NULL REFERENCES tandas(id) ON DELETE CASCADE,
  clan_id        uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  band           presence_band NOT NULL DEFAULT 'reported',
  verification   verification_status NOT NULL DEFAULT 'unverified',
  confidence     confidence_level NOT NULL DEFAULT 'low',
  source_id      uuid REFERENCES sources(id),
  contributor_id uuid REFERENCES contributors(id),
  reviewer_id    uuid REFERENCES contributors(id),
  editorial_note text,
  is_demo        boolean NOT NULL DEFAULT false,
  UNIQUE (tanda_id, clan_id),
  CONSTRAINT presence_no_self_verification CHECK (
    reviewer_id IS NULL OR reviewer_id IS DISTINCT FROM contributor_id
  )
);

-- Family/settlement migration relationships between Tandas — settlement level
-- only. This is explicitly NOT a genealogy: it records that a group moved
-- between settlements, never which family or person.
CREATE TABLE tanda_migration_links (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_tanda_id  uuid REFERENCES tandas(id) ON DELETE CASCADE,
  to_tanda_id    uuid REFERENCES tandas(id) ON DELETE CASCADE,
  from_place_text text,   -- when the origin is not (yet) a documented Tanda
  clan_id        uuid REFERENCES clans(id),
  period_start   integer,
  period_end     integer,
  date_precision date_precision NOT NULL DEFAULT 'unknown',
  interpretation interpretation_label NOT NULL DEFAULT 'oral_tradition',
  verification   verification_status NOT NULL DEFAULT 'unverified',
  confidence     confidence_level NOT NULL DEFAULT 'low',
  source_id      uuid REFERENCES sources(id),
  editorial_note text,
  is_demo        boolean NOT NULL DEFAULT false
);

-- 6c. History ---------------------------------------------------------------
CREATE TABLE historical_events (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_type   text NOT NULL DEFAULT 'tanda',   -- 'tanda'|'clan'|'community'
  subject_id     uuid,                            -- null for community-wide events
  kind           historical_event_kind NOT NULL,
  title          text NOT NULL,
  description    text,
  -- Periods, never a fabricated exact date.
  period_start   integer,
  period_end     integer,
  date_precision date_precision NOT NULL DEFAULT 'unknown',
  interpretation interpretation_label NOT NULL DEFAULT 'oral_tradition',
  verification   verification_status NOT NULL DEFAULT 'unverified',
  confidence     confidence_level NOT NULL DEFAULT 'low',
  source_id      uuid REFERENCES sources(id),
  contributor_id uuid REFERENCES contributors(id),
  reviewer_id    uuid REFERENCES contributors(id),
  reviewed_at    timestamptz,
  editorial_note text,
  is_demo        boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_period_ordered CHECK (
    period_start IS NULL OR period_end IS NULL OR period_start <= period_end
  ),
  -- An 'exact_year' claim must actually pin a single year.
  CONSTRAINT event_exact_year_is_exact CHECK (
    date_precision <> 'exact_year' OR period_start = period_end
  ),
  CONSTRAINT event_no_self_verification CHECK (
    reviewer_id IS NULL OR reviewer_id IS DISTINCT FROM contributor_id
  )
);
CREATE INDEX idx_events_subject ON historical_events (subject_type, subject_id);
CREATE INDEX idx_events_period  ON historical_events (period_start, period_end);

-- 6d. Migration routes ------------------------------------------------------
CREATE TABLE migration_routes (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug           text NOT NULL UNIQUE,
  name           text NOT NULL,
  description    text,
  period_start   integer,
  period_end     integer,
  date_precision date_precision NOT NULL DEFAULT 'era',
  path           geography(LineString, 4326),
  is_demo        boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE migration_route_waypoints (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id    uuid NOT NULL REFERENCES migration_routes(id) ON DELETE CASCADE,
  ordinal     integer NOT NULL,
  label       text NOT NULL,
  geom        geography(Point, 4326) NOT NULL,
  note        text,
  UNIQUE (route_id, ordinal)
);

-- A route may carry several evidence rows with DIFFERENT interpretation labels.
-- This is how a documented version and an oral-tradition version of the same
-- route coexist without one overwriting the other.
CREATE TABLE migration_route_evidence (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id       uuid NOT NULL REFERENCES migration_routes(id) ON DELETE CASCADE,
  interpretation interpretation_label NOT NULL,
  summary        text NOT NULL,
  source_id      uuid REFERENCES sources(id),
  verification   verification_status NOT NULL DEFAULT 'unverified',
  confidence     confidence_level NOT NULL DEFAULT 'low',
  editorial_note text,
  is_demo        boolean NOT NULL DEFAULT false
);

-- 6e. Language and culture --------------------------------------------------
CREATE TABLE languages (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  iso_code  text UNIQUE,          -- e.g. 'lmn' for Lambadi/Gor Boli
  name      text NOT NULL,
  notes     text
);

CREATE TABLE dialect_variants (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  language_id  uuid NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  name         text NOT NULL,
  region       text,
  description  text,
  verification verification_status NOT NULL DEFAULT 'unverified',
  confidence   confidence_level NOT NULL DEFAULT 'low',
  source_id    uuid REFERENCES sources(id)
);

CREATE TABLE tanda_languages (
  tanda_id     uuid NOT NULL REFERENCES tandas(id) ON DELETE CASCADE,
  language_id  uuid NOT NULL REFERENCES languages(id),
  dialect_id   uuid REFERENCES dialect_variants(id),
  role         text NOT NULL DEFAULT 'spoken',   -- 'community'|'spoken'|'schooling'
  verification verification_status NOT NULL DEFAULT 'unverified',
  source_id    uuid REFERENCES sources(id),
  PRIMARY KEY (tanda_id, language_id)
);

CREATE TABLE cultural_practices (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind           cultural_practice_kind NOT NULL,
  name           text NOT NULL,
  description    text,
  region         text,
  -- Scoped to a settlement when locally specific, null when community-wide.
  tanda_id       uuid REFERENCES tandas(id) ON DELETE CASCADE,
  clan_id        uuid REFERENCES clans(id) ON DELETE CASCADE,
  verification   verification_status NOT NULL DEFAULT 'unverified',
  confidence     confidence_level NOT NULL DEFAULT 'low',
  interpretation interpretation_label NOT NULL DEFAULT 'oral_tradition',
  source_id      uuid REFERENCES sources(id),
  editorial_note text,
  is_demo        boolean NOT NULL DEFAULT false
);
CREATE INDEX idx_practices_tanda ON cultural_practices (tanda_id, kind);

-- 6f. Institutions (public bodies only — no private individuals) -------------
CREATE TABLE institutions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanda_id      uuid REFERENCES tandas(id) ON DELETE CASCADE,
  kind          institution_kind NOT NULL,
  name          text NOT NULL,
  -- Public institutional contact only. Never a private individual's contact.
  public_phone  text,
  public_email  text,
  address_line  text,
  established_period_start integer,
  established_period_end   integer,
  date_precision date_precision NOT NULL DEFAULT 'unknown',
  verification  verification_status NOT NULL DEFAULT 'unverified',
  source_id     uuid REFERENCES sources(id),
  is_demo       boolean NOT NULL DEFAULT false
);

-- Traditional governance (Naik and other customary roles) is recorded as a
-- STRUCTURE, not as a register of current office-holders.
CREATE TABLE governance_structures (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanda_id       uuid NOT NULL REFERENCES tandas(id) ON DELETE CASCADE,
  role_name      text NOT NULL,        -- 'Naik', 'Karbhari', 'Hasabi', ...
  role_description text,
  is_customary   boolean NOT NULL DEFAULT true,
  currently_active boolean,
  verification   verification_status NOT NULL DEFAULT 'unverified',
  confidence     confidence_level NOT NULL DEFAULT 'low',
  source_id      uuid REFERENCES sources(id),
  editorial_note text,
  is_demo        boolean NOT NULL DEFAULT false
);

-- 6g. People of public historical significance (docs/04 §3) ------------------
CREATE TABLE people (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            text NOT NULL UNIQUE,
  name            text NOT NULL,
  public_role     text NOT NULL,        -- why this person is a public figure
  birth_period_start integer,
  birth_period_end   integer,
  death_period_start integer,
  death_period_end   integer,
  date_precision  date_precision NOT NULL DEFAULT 'unknown',
  summary         text,
  is_living       boolean NOT NULL DEFAULT false,
  consent_id      uuid,                 -- REQUIRED when is_living
  verification    verification_status NOT NULL DEFAULT 'unverified',
  source_id       uuid REFERENCES sources(id),
  is_demo         boolean NOT NULL DEFAULT false,
  CONSTRAINT living_person_requires_consent CHECK (
    is_living = false OR consent_id IS NOT NULL
  )
);

-- ---------------------------------------------------------------------------
-- 7. Media and consent
-- ---------------------------------------------------------------------------

CREATE TABLE consent_records (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_type            text NOT NULL,   -- 'narrator'|'photographer'|'depicted_group'|'institution'
  granted_by_contributor  uuid REFERENCES contributors(id),
  scope                   consent_scope NOT NULL DEFAULT 'archive_only',
  attribution             attribution_preference NOT NULL DEFAULT 'anonymous',
  commercial_use_permitted boolean NOT NULL DEFAULT false,
  ai_training_permitted    boolean NOT NULL DEFAULT false,
  is_verbal               boolean NOT NULL DEFAULT false,
  verbal_recording_uri    text,            -- recorded consent in the speaker's language
  consent_language        text,
  involves_minor          boolean NOT NULL DEFAULT false,
  guardian_consent        boolean NOT NULL DEFAULT false,
  evidence_uri            text,
  granted_at              timestamptz NOT NULL DEFAULT now(),
  expires_at              timestamptz,
  revoked_at              timestamptz,
  CONSTRAINT minor_requires_guardian CHECK (
    involves_minor = false OR guardian_consent = true
  ),
  CONSTRAINT verbal_consent_needs_recording CHECK (
    is_verbal = false OR verbal_recording_uri IS NOT NULL
  )
);

CREATE TABLE media_assets (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind            media_kind NOT NULL,
  title           text NOT NULL,
  description     text,
  storage_uri     text NOT NULL,
  thumbnail_uri   text,
  mime_type       text,
  byte_size       bigint,
  duration_seconds integer,
  -- Ownership and provenance metadata, all required before publication.
  owner_attribution text,
  contributor_id  uuid REFERENCES contributors(id),
  consent_id      uuid NOT NULL REFERENCES consent_records(id) ON DELETE RESTRICT,
  captured_period_start integer,
  captured_period_end   integer,
  date_precision  date_precision NOT NULL DEFAULT 'unknown',
  tanda_id        uuid REFERENCES tandas(id) ON DELETE SET NULL,
  clan_id         uuid REFERENCES clans(id) ON DELETE SET NULL,
  source_id       uuid REFERENCES sources(id),
  verification    verification_status NOT NULL DEFAULT 'unverified',
  is_published    boolean NOT NULL DEFAULT false,
  is_demo         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_tanda ON media_assets (tanda_id, kind);

-- Publication guard: an asset can only be published when a live consent record
-- grants public display, and any depiction of a minor has guardian consent.
CREATE OR REPLACE FUNCTION media_publish_guard() RETURNS trigger AS $$
DECLARE c consent_records%ROWTYPE;
BEGIN
  IF NEW.is_published THEN
    SELECT * INTO c FROM consent_records WHERE id = NEW.consent_id;
    IF c.id IS NULL THEN
      RAISE EXCEPTION 'consent_required: media % has no consent record', NEW.id;
    END IF;
    IF c.revoked_at IS NOT NULL THEN
      RAISE EXCEPTION 'consent_revoked: media % cannot be published', NEW.id;
    END IF;
    IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
      RAISE EXCEPTION 'consent_expired: media % cannot be published', NEW.id;
    END IF;
    IF c.scope = 'archive_only' THEN
      RAISE EXCEPTION 'consent_scope_archive_only: media % cannot be published', NEW.id;
    END IF;
    IF c.involves_minor AND NOT c.guardian_consent THEN
      RAISE EXCEPTION 'guardian_consent_required: media %', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_media_publish_guard
  BEFORE INSERT OR UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION media_publish_guard();

-- ---------------------------------------------------------------------------
-- 8. Articles (Cultural Encyclopedia)
-- ---------------------------------------------------------------------------

CREATE TABLE articles (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug           text NOT NULL UNIQUE,
  section        text NOT NULL,        -- 'Origins and identity', 'Language', ...
  title          text NOT NULL,
  standfirst     text,
  body           text NOT NULL,
  locale         text NOT NULL DEFAULT 'en',
  reading_minutes smallint,
  verification   verification_status NOT NULL DEFAULT 'unverified',
  editorial_note text,
  is_demo        boolean NOT NULL DEFAULT false,
  published_at   timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  search_vector  tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(standfirst,'')
                || ' ' || coalesce(body,''))
  ) STORED
);
CREATE INDEX idx_articles_fts ON articles USING GIN (search_vector);

CREATE TABLE article_contributors (
  article_id     uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  contributor_id uuid NOT NULL REFERENCES contributors(id),
  role           text NOT NULL DEFAULT 'author',
  PRIMARY KEY (article_id, contributor_id, role)
);

-- ---------------------------------------------------------------------------
-- 9. Revisions, verification records, disputes
-- ---------------------------------------------------------------------------

CREATE TABLE revisions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_type  text NOT NULL,
  subject_id    uuid NOT NULL,
  field         text,
  previous_value jsonb,
  new_value     jsonb,
  changed_by    uuid REFERENCES contributors(id),
  submission_id uuid,
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_revisions_subject ON revisions (subject_type, subject_id, created_at DESC);

CREATE TABLE verification_records (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_type  text NOT NULL,
  subject_id    uuid NOT NULL,
  field         text,
  status        verification_status NOT NULL,
  confidence    confidence_level NOT NULL,
  reviewer_id   uuid NOT NULL REFERENCES contributors(id),
  reviewed_at   timestamptz NOT NULL DEFAULT now(),
  method        text,          -- 'cross-referenced two sources', 'field visit', ...
  note          text
);

CREATE TABLE disputes (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_type   text NOT NULL,
  subject_id     uuid NOT NULL,
  field          text,
  raised_by      uuid REFERENCES contributors(id),
  reason         text NOT NULL,
  counter_source_id uuid REFERENCES sources(id),
  status         text NOT NULL DEFAULT 'open',   -- open|resolved|coexisting
  resolution_note text,
  resolved_by    uuid REFERENCES contributors(id),
  resolved_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 10. Submissions (nothing here is public until a reviewer acts)
-- ---------------------------------------------------------------------------

CREATE TABLE submissions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code  text NOT NULL UNIQUE,      -- shown to the contributor
  kind            submission_kind NOT NULL,
  status          submission_status NOT NULL DEFAULT 'pending',
  tanda_id        uuid REFERENCES tandas(id) ON DELETE SET NULL,
  proposed_tanda_name text,
  contributor_id  uuid NOT NULL REFERENCES contributors(id),
  relationship_to_tanda text NOT NULL,       -- resident|origin family|researcher|...
  source_category source_category NOT NULL,
  source_description text,
  consent_id      uuid REFERENCES consent_records(id),
  proposed_geom   geography(Point, 4326),
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  permission_to_publish boolean NOT NULL DEFAULT false,
  attribution     attribution_preference NOT NULL DEFAULT 'anonymous',
  assigned_to     uuid REFERENCES contributors(id),
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  decided_at      timestamptz,
  decision_note   text,
  -- Any submission carrying media must carry consent with it.
  CONSTRAINT media_submission_requires_consent CHECK (
    kind NOT IN ('photograph','document','audio_video','oral_history')
    OR consent_id IS NOT NULL
  )
);
CREATE INDEX idx_submissions_status ON submissions (status, submitted_at DESC);

-- Field-level review: a reviewer accepts three of five proposed changes.
CREATE TABLE submission_fields (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id  uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  field          text NOT NULL,
  current_value  jsonb,
  proposed_value jsonb,
  decision       field_decision NOT NULL DEFAULT 'pending',
  decided_by     uuid REFERENCES contributors(id),
  decided_at     timestamptz,
  reviewer_note  text,
  UNIQUE (submission_id, field)
);

CREATE TABLE reviews (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id   uuid NOT NULL REFERENCES contributors(id),
  action        text NOT NULL,      -- 'claimed'|'requested_evidence'|'accepted'|'rejected'
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- A contributor may never review their own submission.
  CONSTRAINT review_not_by_submitter CHECK (true)  -- enforced in policies.sql
);

-- ---------------------------------------------------------------------------
-- 11. Translations (originals are never overwritten — docs/08)
-- ---------------------------------------------------------------------------

CREATE TABLE translations (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_type   text NOT NULL,
  subject_id     uuid NOT NULL,
  field          text NOT NULL,
  locale         text NOT NULL,          -- 'te', 'hi', 'gbl-Deva', ...
  source_locale  text NOT NULL,
  value          text NOT NULL,
  method         translation_method NOT NULL,
  translator_id  uuid REFERENCES contributors(id),
  reviewed_by    uuid REFERENCES contributors(id),
  reviewed_at    timestamptz,
  is_authoritative boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_type, subject_id, field, locale),
  -- Only an original may be authoritative; a translation never is.
  CONSTRAINT translation_not_authoritative CHECK (
    is_authoritative = false OR locale = source_locale
  )
);

-- Oral histories are never published from a machine translation (docs/08 §3).
CREATE OR REPLACE FUNCTION translation_oral_history_guard() RETURNS trigger AS $$
BEGIN
  IF NEW.subject_type = 'oral_history' AND NEW.method = 'machine'
     AND NEW.reviewed_by IS NULL THEN
    RAISE EXCEPTION
      'machine_translation_not_publishable: oral histories require human translation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_translation_oral_history_guard
  BEFORE INSERT OR UPDATE ON translations
  FOR EACH ROW EXECUTE FUNCTION translation_oral_history_guard();

-- ---------------------------------------------------------------------------
-- 12. Views
-- ---------------------------------------------------------------------------

-- Map/hover payload.
CREATE OR REPLACE VIEW v_tanda_card AS
SELECT
  t.id,
  t.public_id,
  t.primary_name,
  s.name  AS state_name,
  d.name  AS district_name,
  t.settlement_type,
  t.verification,
  t.is_demo,
  t.completeness_pct,
  ST_Y(t.geom::geometry) AS lat,
  ST_X(t.geom::geometry) AS lng,
  t.coord_precision,
  (SELECT array_agg(tn.name ORDER BY tn.is_primary DESC)
     FROM tanda_names tn WHERE tn.tanda_id = t.id)            AS all_names,
  (SELECT p.total_population FROM population_records p
     WHERE p.tanda_id = t.id AND p.superseded_by IS NULL
     ORDER BY p.as_of_year DESC LIMIT 1)                      AS latest_population,
  (SELECT p.as_of_year FROM population_records p
     WHERE p.tanda_id = t.id AND p.superseded_by IS NULL
     ORDER BY p.as_of_year DESC LIMIT 1)                      AS latest_population_year,
  (SELECT array_agg(c.primary_name)
     FROM tanda_clan_presence tcp JOIN clans c ON c.id = tcp.clan_id
     WHERE tcp.tanda_id = t.id
       AND tcp.band IN ('predominant','substantial'))         AS major_clans
FROM tandas t
JOIN states s    ON s.id = t.state_id
JOIN districts d ON d.id = t.district_id;

-- Coverage / completeness, drives the admin dashboard and state directory.
CREATE OR REPLACE VIEW v_district_completeness AS
SELECT
  d.id   AS district_id,
  d.name AS district_name,
  s.id   AS state_id,
  s.name AS state_name,
  count(t.id)                                                     AS documented_tandas,
  count(t.id) FILTER (WHERE t.verification = 'verified')           AS verified_tandas,
  count(t.id) FILTER (WHERE t.verification = 'partially_verified') AS partial_tandas,
  count(t.id) FILTER (WHERE t.is_demo)                             AS demo_tandas,
  coalesce(round(avg(t.completeness_pct)), 0)                      AS avg_completeness
FROM districts d
JOIN states s ON s.id = d.state_id
LEFT JOIN tandas t ON t.district_id = d.id
GROUP BY d.id, d.name, s.id, s.name;

-- Homepage counters. Real rows only; demo rows counted separately so that no
-- figure shown on the homepage can be a fabrication.
CREATE OR REPLACE VIEW v_public_stats AS
SELECT
  (SELECT count(*) FROM tandas WHERE NOT is_demo)                        AS tandas_documented,
  (SELECT count(*) FROM tandas WHERE is_demo)                            AS tandas_demo,
  (SELECT count(*) FROM tandas WHERE verification = 'verified'
     AND NOT is_demo)                                                    AS tandas_verified,
  (SELECT count(DISTINCT state_id) FROM tandas WHERE NOT is_demo)        AS states_covered,
  (SELECT count(*) FROM sources WHERE category IN
     ('census','government_record','academic','archival_document')
     AND NOT is_demo)                                                    AS documentary_sources,
  (SELECT count(*) FROM media_assets
     WHERE kind IN ('audio_oral_history','video_interview')
       AND is_published AND NOT is_demo)                                 AS oral_histories,
  (SELECT count(*) FROM clans WHERE NOT is_demo)                         AS clans_documented,
  (SELECT count(*) FROM articles WHERE published_at IS NOT NULL
     AND NOT is_demo)                                                    AS articles_published;

-- ---------------------------------------------------------------------------
-- 13. Fuzzy search helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION search_tandas(q text, lim integer DEFAULT 20)
RETURNS TABLE (tanda_id uuid, matched_name text, score real) AS $$
  SELECT tn.tanda_id,
         tn.name,
         similarity(tn.name_normalised, lower(unaccent(q))) AS score
  FROM tanda_names tn
  WHERE tn.name_normalised % lower(unaccent(q))
  ORDER BY score DESC
  LIMIT lim;
$$ LANGUAGE sql STABLE;

-- Proximity search: "Banjara settlements near Hyderabad"
CREATE OR REPLACE FUNCTION tandas_near(lat double precision, lng double precision,
                                       radius_km double precision)
RETURNS SETOF tandas AS $$
  SELECT * FROM tandas
  WHERE geom IS NOT NULL
    AND NOT sensitive_location
    AND ST_DWithin(geom, ST_MakePoint(lng, lat)::geography, radius_km * 1000)
  ORDER BY ST_Distance(geom, ST_MakePoint(lng, lat)::geography);
$$ LANGUAGE sql STABLE;
