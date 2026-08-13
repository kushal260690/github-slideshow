-- ============================================================================
-- Gor Atlas — Row Level Security and editorial authority
--
-- Written for Supabase-style auth (auth.uid() maps to contributors.id), but the
-- logic is plain Postgres and portable. The rule this file exists to enforce:
--   * The public reads published, non-sensitive rows.
--   * Contributors write only to submissions — never to published tables.
--   * Reviewers act within their geographic scope.
--   * Nobody verifies their own contribution.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: does the current user hold this role, scoped to this state/district?
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION current_contributor() RETURNS uuid AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION has_role(
  wanted contributor_role,
  state_scope uuid DEFAULT NULL,
  district_scope uuid DEFAULT NULL
) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM contributor_role_grants g
    WHERE g.contributor_id = current_contributor()
      AND g.revoked_at IS NULL
      AND g.role = wanted
      AND (g.scope_state_id    IS NULL OR g.scope_state_id    = state_scope)
      AND (g.scope_district_id IS NULL OR g.scope_district_id = district_scope)
  );
$$ LANGUAGE sql STABLE;

-- Ordered authority. A higher role satisfies a lower requirement.
CREATE OR REPLACE FUNCTION role_rank(r contributor_role) RETURNS int AS $$
  SELECT CASE r
    WHEN 'public_contributor'            THEN 1
    WHEN 'verified_tanda_representative' THEN 2
    WHEN 'district_researcher'           THEN 3
    WHEN 'subject_matter_expert'         THEN 4
    WHEN 'state_editor'                  THEN 5
    WHEN 'historian_reviewer'            THEN 6
    WHEN 'super_admin'                   THEN 7
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION at_least(
  wanted contributor_role,
  state_scope uuid DEFAULT NULL,
  district_scope uuid DEFAULT NULL
) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM contributor_role_grants g
    WHERE g.contributor_id = current_contributor()
      AND g.revoked_at IS NULL
      AND role_rank(g.role) >= role_rank(wanted)
      AND (g.scope_state_id    IS NULL OR g.scope_state_id    = state_scope)
      AND (g.scope_district_id IS NULL OR g.scope_district_id = district_scope)
  );
$$ LANGUAGE sql STABLE;

-- ---------------------------------------------------------------------------
-- Public read surfaces
-- ---------------------------------------------------------------------------

ALTER TABLE tandas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanda_names         ENABLE ROW LEVEL SECURITY;
ALTER TABLE population_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE surnames            ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_practices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources             ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_fields   ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log           ENABLE ROW LEVEL SECURITY;

CREATE POLICY tandas_public_read ON tandas
  FOR SELECT USING (true);

CREATE POLICY tanda_names_public_read ON tanda_names
  FOR SELECT USING (true);

CREATE POLICY population_public_read ON population_records
  FOR SELECT USING (true);

CREATE POLICY clans_public_read ON clans FOR SELECT USING (true);
CREATE POLICY surnames_public_read ON surnames FOR SELECT USING (true);
CREATE POLICY events_public_read ON historical_events FOR SELECT USING (true);
CREATE POLICY practices_public_read ON cultural_practices FOR SELECT USING (true);
CREATE POLICY institutions_public_read ON institutions FOR SELECT USING (true);
CREATE POLICY sources_public_read ON sources FOR SELECT USING (true);

CREATE POLICY articles_public_read ON articles
  FOR SELECT USING (published_at IS NOT NULL OR at_least('district_researcher'));

-- Media: only published assets with live consent are publicly readable.
CREATE POLICY media_public_read ON media_assets
  FOR SELECT USING (
    (is_published AND EXISTS (
        SELECT 1 FROM consent_records c
        WHERE c.id = media_assets.consent_id
          AND c.revoked_at IS NULL
          AND (c.expires_at IS NULL OR c.expires_at > now())
          AND c.scope <> 'archive_only'
     ))
    OR at_least('district_researcher')
  );

-- Consent records are never public. Editorial and super-admin only.
CREATE POLICY consent_editorial_read ON consent_records
  FOR SELECT USING (at_least('state_editor'));

-- Contributors can read only their own row; super admins read all.
CREATE POLICY contributors_self_read ON contributors
  FOR SELECT USING (id = current_contributor() OR at_least('super_admin'));

-- ---------------------------------------------------------------------------
-- Write surfaces — the public writes ONLY to submissions
-- ---------------------------------------------------------------------------

CREATE POLICY submissions_insert_own ON submissions
  FOR INSERT WITH CHECK (
    contributor_id = current_contributor()
    -- A submission always enters the queue. It can never be created accepted.
    AND status IN ('draft', 'pending')
  );

CREATE POLICY submissions_read_own_or_reviewer ON submissions
  FOR SELECT USING (
    contributor_id = current_contributor()
    OR at_least('district_researcher')
  );

-- A contributor may edit only their own draft, and only while it is a draft.
CREATE POLICY submissions_update_own_draft ON submissions
  FOR UPDATE USING (
    contributor_id = current_contributor() AND status = 'draft'
  ) WITH CHECK (
    contributor_id = current_contributor() AND status IN ('draft','pending','withdrawn')
  );

-- Reviewers move submissions along, but never their own.
CREATE POLICY submissions_review ON submissions
  FOR UPDATE USING (
    at_least('district_researcher') AND contributor_id <> current_contributor()
  );

CREATE POLICY submission_fields_reviewer ON submission_fields
  FOR ALL USING (
    at_least('district_researcher')
    AND EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_fields.submission_id
        AND s.contributor_id <> current_contributor()
    )
  );

-- There is deliberately NO insert/update policy for the public on tandas,
-- population_records, clans, media_assets or articles. The only path from a
-- contributor to a published value runs through submissions and a reviewer.

CREATE POLICY tandas_editorial_write ON tandas
  FOR ALL USING (at_least('state_editor', state_id))
  WITH CHECK (at_least('state_editor', state_id));

CREATE POLICY population_editorial_write ON population_records
  FOR ALL USING (at_least('district_researcher'))
  WITH CHECK (at_least('district_researcher'));

CREATE POLICY articles_editorial_write ON articles
  FOR ALL USING (at_least('subject_matter_expert'))
  WITH CHECK (at_least('subject_matter_expert'));

-- Audit log: append only, readable by editors, never mutable by anyone.
CREATE POLICY audit_read ON audit_log
  FOR SELECT USING (at_least('state_editor'));
CREATE POLICY audit_append ON audit_log
  FOR INSERT WITH CHECK (actor_id = current_contributor());

-- ---------------------------------------------------------------------------
-- Verification authority — enforced in a trigger, not left to the API
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_verification_authority() RETURNS trigger AS $$
DECLARE actor uuid := current_contributor();
BEGIN
  IF NEW.verification = 'verified'
     AND (TG_OP = 'INSERT' OR OLD.verification IS DISTINCT FROM 'verified') THEN

    -- Promotion to 'verified' requires state_editor within the state, or above.
    IF NOT at_least('state_editor', NEW.state_id) THEN
      RAISE EXCEPTION
        'role_insufficient: promotion to verified requires a state editor or above';
    END IF;

    -- The reviewer must exist and must not be the contributor.
    IF NEW.reviewed_by IS NULL THEN
      RAISE EXCEPTION 'reviewer_required: verified records need a named reviewer';
    END IF;
    IF NEW.reviewed_by = NEW.created_by THEN
      RAISE EXCEPTION 'self_verification_blocked';
    END IF;
    IF actor IS NOT NULL AND actor = NEW.created_by THEN
      RAISE EXCEPTION 'self_verification_blocked';
    END IF;

    -- Demo rows can never be verified.
    IF NEW.is_demo THEN
      RAISE EXCEPTION 'demo_records_cannot_be_verified';
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tanda_verification_authority
  BEFORE INSERT OR UPDATE ON tandas
  FOR EACH ROW EXECUTE FUNCTION enforce_verification_authority();

-- ---------------------------------------------------------------------------
-- Coordinate precision as a privacy control (docs/04 §6)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION apply_coordinate_precision() RETURNS trigger AS $$
BEGIN
  IF NEW.geom IS NULL THEN RETURN NEW; END IF;

  IF NEW.sensitive_location THEN
    NEW.geom := ST_SnapToGrid(NEW.geom::geometry, 0.05)::geography;
    NEW.coord_precision := 'obscured';
  ELSIF NEW.verification IN ('unverified','not_documented') THEN
    NEW.geom := ST_SnapToGrid(NEW.geom::geometry, 0.001)::geography;
    IF NEW.coord_precision = 'surveyed' THEN
      NEW.coord_precision := 'reduced';
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tanda_coordinate_precision
  BEFORE INSERT OR UPDATE ON tandas
  FOR EACH ROW EXECUTE FUNCTION apply_coordinate_precision();

-- ---------------------------------------------------------------------------
-- Consent revocation cascade (docs/04 §4) — honoured within 7 days, run daily
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION apply_consent_revocations() RETURNS void AS $$
BEGIN
  UPDATE media_assets m
     SET is_published = false
    FROM consent_records c
   WHERE m.consent_id = c.id
     AND m.is_published
     AND (c.revoked_at IS NOT NULL
          OR (c.expires_at IS NOT NULL AND c.expires_at < now()));

  -- The changelog records that a withdrawal happened, never who withdrew it.
  INSERT INTO audit_log (actor_id, action, subject_type, subject_id, reason)
  SELECT NULL, 'consent_withdrawal_applied', 'media_asset', m.id,
         'Consent withdrawn or expired; asset unpublished.'
    FROM media_assets m
    JOIN consent_records c ON c.id = m.consent_id
   WHERE c.revoked_at IS NOT NULL
     AND NOT m.is_published;
END $$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Export filter (docs/04 §8) — what leaves the system in a bulk download
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_export_tandas AS
SELECT
  t.public_id, t.primary_name,
  s.name AS state, d.name AS district,
  t.settlement_type, t.verification, t.completeness_pct,
  CASE WHEN t.sensitive_location THEN NULL ELSE ST_Y(t.geom::geometry) END AS lat,
  CASE WHEN t.sensitive_location THEN NULL ELSE ST_X(t.geom::geometry) END AS lng,
  t.coord_precision
FROM tandas t
JOIN states s ON s.id = t.state_id
JOIN districts d ON d.id = t.district_id
WHERE NOT t.is_demo;          -- demo rows never leave in an export
-- Contributor identities, consent evidence, archive_only media and
-- sensitive coordinates are absent from this view by construction.
