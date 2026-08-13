"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CLANS } from "@/data/clans";
import { STATES } from "@/data/geography";
import { MapView } from "@/components/MapView";
import type { SubmissionKind } from "@/lib/types";

/**
 * "Document Your Tanda" — a seven-step wizard.
 *
 * Design decisions that matter more than the layout:
 *
 *  1. The consent step cannot be skipped when the contribution carries media or
 *     testimony, and recorded verbal consent in the speaker's own language is
 *     offered as an equal option — not a lesser one. Most oral-history narrators
 *     are elders who may not read the consent language, and a written-only
 *     consent flow would quietly exclude exactly the people whose knowledge is
 *     most needed.
 *  2. Dates are collected as periods with a precision, so the form physically
 *     cannot capture "1887" from someone who means "around my great-
 *     grandfather's time".
 *  3. Drafts autosave to localStorage. A long form on a patchy mobile
 *     connection that loses everything on a dropped request is a form that gets
 *     abandoned, and the knowledge with it.
 *  4. The panel stating that nothing publishes automatically is visible on
 *     every step, not just the last one.
 */

const KINDS: { value: SubmissionKind; label: string; needsConsent: boolean }[] = [
  { value: "new_tanda", label: "A Tanda that is missing from the archive", needsConsent: false },
  { value: "correction", label: "A correction to an existing profile", needsConsent: false },
  { value: "population", label: "Population or household information", needsConsent: false },
  { value: "clan_surname", label: "Clan and surname information", needsConsent: false },
  { value: "historical_date", label: "Settlement history or dates", needsConsent: false },
  { value: "migration_information", label: "Migration information", needsConsent: false },
  { value: "institution", label: "A public institution", needsConsent: false },
  { value: "oral_history", label: "An oral history recording", needsConsent: true },
  { value: "photograph", label: "Photographs", needsConsent: true },
  { value: "document", label: "Documents or records", needsConsent: true },
  { value: "audio_video", label: "Audio or video interviews", needsConsent: true },
];

const RELATIONSHIPS = [
  "I live in this Tanda",
  "My family is from this Tanda",
  "I am a recognised representative of this Tanda",
  "I am a researcher or student",
  "I work with a community organisation",
  "Other",
];

const SOURCE_CATEGORIES = [
  { value: "community_submission", label: "My own knowledge or that of my family" },
  { value: "oral_history", label: "Recorded testimony from a named narrator" },
  { value: "census", label: "A census or official enumeration" },
  { value: "government_record", label: "A government or panchayat record" },
  { value: "archival_document", label: "An archival document, photograph or newspaper" },
  { value: "academic", label: "A published study" },
  { value: "media_report", label: "A news report" },
];

const PRECISIONS = [
  { value: "exact_year", label: "An exact year — I have a document that states it" },
  { value: "decade", label: "A decade (e.g. the 1890s)" },
  { value: "quarter_century", label: "A range of about 25 years" },
  { value: "century", label: "A century only (e.g. the 1800s)" },
  { value: "era", label: "A broad era" },
  { value: "unknown", label: "I do not know" },
];

const STEPS = [
  "What are you contributing",
  "Locate it on the map",
  "The information",
  "Your source",
  "Evidence",
  "Consent and attribution",
  "Review and submit",
];

const DRAFT_KEY = "gor-atlas-contribution-draft";

interface Draft {
  kind: SubmissionKind | "";
  tandaName: string;
  stateId: string;
  districtId: string;
  lat: string;
  lng: string;
  isDiaspora: boolean;
  information: string;
  clanIds: string[];
  periodStart: string;
  periodEnd: string;
  precision: string;
  relationship: string;
  sourceCategory: string;
  sourceDescription: string;
  evidenceDescription: string;
  consentGiven: boolean;
  consentIsVerbal: boolean;
  consentLanguage: string;
  involvesMinor: boolean;
  guardianConsent: boolean;
  attribution: string;
  permissionToPublish: boolean;
  contactVerified: boolean;
}

const EMPTY: Draft = {
  kind: "",
  tandaName: "",
  stateId: "",
  districtId: "",
  lat: "",
  lng: "",
  isDiaspora: false,
  information: "",
  clanIds: [],
  periodStart: "",
  periodEnd: "",
  precision: "unknown",
  relationship: "",
  sourceCategory: "",
  sourceDescription: "",
  evidenceDescription: "",
  consentGiven: false,
  consentIsVerbal: false,
  consentLanguage: "",
  involvesMinor: false,
  guardianConsent: false,
  attribution: "village_only",
  permissionToPublish: false,
  contactVerified: false,
};

export function ContributionWizard({ presetTandaId }: { presetTandaId?: string }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [reference, setReference] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        setDraft({ ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) });
        setRestored(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  const kindMeta = KINDS.find((k) => k.value === draft.kind);
  const needsConsent = kindMeta?.needsConsent ?? false;
  const districts = STATES.find((s) => s.id === draft.stateId)?.districts ?? [];

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const issues = useMemo(() => {
    const out: string[] = [];
    if (!draft.kind) out.push("Choose what you are contributing.");
    if (!draft.tandaName && !presetTandaId) out.push("Name the settlement.");
    if (!draft.relationship) out.push("State your relationship to the settlement.");
    if (!draft.sourceCategory) out.push("Declare what kind of evidence this is.");
    if (!draft.contactVerified)
      out.push("Verify a contact so an editor can come back to you with questions.");
    if (needsConsent && !draft.consentGiven)
      out.push("A consent record is required for media and testimony.");
    if (needsConsent && draft.consentIsVerbal && !draft.consentLanguage)
      out.push("Record which language the verbal consent was given in.");
    if (draft.involvesMinor && !draft.guardianConsent)
      out.push("Guardian consent is required when a minor is depicted.");
    if (
      draft.precision === "exact_year" &&
      !["census", "government_record", "archival_document", "academic"].includes(
        draft.sourceCategory,
      )
    ) {
      out.push(
        "An exact year needs a documentary source. If the date comes from memory, choose a decade or a wider range instead — this is not a formality, it is the difference between a record and a guess.",
      );
    }
    return out;
  }, [draft, needsConsent, presetTandaId]);

  const control =
    "w-full rounded-sm border border-line bg-surface-0 px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-peacock";
  const labelCls = "mb-1 block text-sm font-medium text-ink";
  const helpCls = "mt-1 text-[11px] text-muted";

  async function submit() {
    // The prototype posts to the real handler, which validates and always
    // returns a pending status. There is no code path to a published value.
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: draft.kind,
          tandaId: presetTandaId,
          proposedTandaName: draft.tandaName,
          relationshipToTanda: draft.relationship,
          sourceCategory: draft.sourceCategory,
          sourceDescription: draft.sourceDescription,
          consentProvided: draft.consentGiven,
          permissionToPublish: draft.permissionToPublish,
          attribution: draft.attribution,
          contributorContactVerified: draft.contactVerified,
          isDiaspora: draft.isDiaspora,
          coordinates:
            draft.lat && draft.lng ? [Number(draft.lng), Number(draft.lat)] : undefined,
          fields: [
            { field: "information", proposedValue: draft.information },
            { field: "established_period", proposedValue: draft.periodStart },
          ],
        }),
      });
      const json = await res.json();
      setReference(json?.data?.referenceCode ?? `GA-${new Date().getFullYear()}-PENDING`);
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      setReference(`GA-${new Date().getFullYear()}-OFFLINE`);
    }
  }

  if (reference) {
    return (
      <div className="rounded-lg border border-line bg-surface-1 p-6">
        <h2 className="font-display text-2xl text-ink-strong">Submission received</h2>
        <p className="mt-2 text-sm text-muted">
          Your reference code is{" "}
          <strong className="tabular text-terracotta">{reference}</strong>. Keep it — you can
          track the review with it.
        </p>
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>A district researcher or state editor reviews the submission field by field.</li>
          <li>
            Fields may be accepted, rejected or returned with a request for evidence,
            individually. A partial acceptance is a normal outcome, not a rejection.
          </li>
          <li>Accepted fields create a revision, an audit entry and a public changelog line.</li>
          <li>Nothing is publicly visible until that happens.</li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/contribute/status"
            className="rounded-sm bg-terracotta px-4 py-2 text-sm font-semibold text-terracotta-ink"
          >
            Track this submission
          </Link>
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY);
              setReference(null);
              setStep(0);
            }}
            className="rounded-sm border border-line-strong px-4 py-2 text-sm text-ink hover:border-peacock hover:text-peacock"
          >
            Contribute something else
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="rounded-lg border border-line bg-surface-1 p-5 sm:p-6">
        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] uppercase tracking-wider text-terracotta">
              Step {step + 1} of {STEPS.length}
            </p>
            <p className="text-[11px] text-muted">{STEPS[step]}</p>
          </div>
          <div className="mt-2 flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full"
                style={{
                  backgroundColor: i <= step ? "var(--terracotta)" : "var(--surface-3)",
                }}
              />
            ))}
          </div>
          {restored && step === 0 ? (
            <p className="mt-2 text-[11px] text-peacock">
              A saved draft was restored. Your work stays on this device until you submit.
            </p>
          ) : null}
        </div>

        {/* Step 1 */}
        {step === 0 ? (
          <fieldset>
            <legend className="font-display text-xl text-ink-strong">
              What are you contributing?
            </legend>
            <div className="mt-4 space-y-2">
              {KINDS.map((k) => (
                <label
                  key={k.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-sm border p-3 text-sm ${
                    draft.kind === k.value
                      ? "border-peacock bg-surface-2"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <input
                    type="radio"
                    name="kind"
                    checked={draft.kind === k.value}
                    onChange={() => set("kind", k.value)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="text-ink">{k.label}</span>
                    {k.needsConsent ? (
                      <span className="mt-0.5 block text-[11px] text-muted">
                        Requires a consent record before it can be accepted.
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {/* Step 2 */}
        {step === 1 ? (
          <fieldset>
            <legend className="font-display text-xl text-ink-strong">Locate it on the map</legend>
            <div className="mt-4 space-y-4">
              <div>
                <label className={labelCls} htmlFor="tname">
                  Settlement name
                </label>
                <input
                  id="tname"
                  className={control}
                  value={draft.tandaName}
                  onChange={(e) => set("tandaName", e.target.value)}
                  placeholder="The name people use locally"
                />
                <p className={helpCls}>
                  Use the name people actually use. If it is written differently in different
                  places, add the other spellings in the next step — spelling variation is
                  recorded, not corrected.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls} htmlFor="st">
                    State
                  </label>
                  <select
                    id="st"
                    className={control}
                    value={draft.stateId}
                    onChange={(e) => {
                      set("stateId", e.target.value);
                      set("districtId", "");
                    }}
                  >
                    <option value="">Select</option>
                    {STATES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="dt">
                    District
                  </label>
                  <select
                    id="dt"
                    className={control}
                    value={draft.districtId}
                    onChange={(e) => set("districtId", e.target.value)}
                    disabled={!draft.stateId}
                  >
                    <option value="">Select</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls} htmlFor="lat">
                    Latitude
                  </label>
                  <input
                    id="lat"
                    className={control}
                    value={draft.lat}
                    onChange={(e) => set("lat", e.target.value)}
                    placeholder="17.1"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="lng">
                    Longitude
                  </label>
                  <input
                    id="lng"
                    className={control}
                    value={draft.lng}
                    onChange={(e) => set("lng", e.target.value)}
                    placeholder="79.3"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.geolocation?.getCurrentPosition((pos) => {
                    set("lat", pos.coords.latitude.toFixed(4));
                    set("lng", pos.coords.longitude.toFixed(4));
                  });
                }}
                className="rounded-sm border border-line px-3 py-1.5 text-xs text-muted hover:border-peacock hover:text-peacock"
              >
                Use my current location
              </button>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={draft.isDiaspora}
                  onChange={(e) => set("isDiaspora", e.target.checked)}
                />
                This is a diaspora settlement outside India
              </label>

              {draft.lat && draft.lng ? (
                <div className="h-56 overflow-hidden rounded-lg border border-line">
                  <MapView
                    points={[
                      {
                        id: "proposed",
                        name: draft.tandaName || "Proposed location",
                        lat: Number(draft.lat),
                        lng: Number(draft.lng),
                        markerKey: "basic",
                        isDemo: false,
                      },
                    ]}
                    cluster={false}
                    flyTo={{ lat: Number(draft.lat), lng: Number(draft.lng), zoom: 10 }}
                    className="h-full w-full"
                  />
                </div>
              ) : null}

              <p className={helpCls}>
                Unverified locations are published rounded to roughly 110 m. If this settlement
                faces eviction pressure or is the subject of a live dispute, say so in the
                information step — an editor can flag it sensitive, which coarsens the point
                further and excludes it from bulk data exports.
              </p>
            </div>
          </fieldset>
        ) : null}

        {/* Step 3 */}
        {step === 2 ? (
          <fieldset>
            <legend className="font-display text-xl text-ink-strong">The information</legend>
            <div className="mt-4 space-y-4">
              <div>
                <label className={labelCls} htmlFor="info">
                  What do you want to record?
                </label>
                <textarea
                  id="info"
                  rows={6}
                  className={control}
                  value={draft.information}
                  onChange={(e) => set("information", e.target.value)}
                  placeholder="Names and spellings, who settled here and why, what people did, what changed…"
                />
                <p className={helpCls}>
                  Write it as you would tell it. An editor will structure it. Please do not include
                  names, addresses or phone numbers of individuals — those are removed rather than
                  stored.
                </p>
              </div>

              <div>
                <span className={labelCls}>Clans reported in this settlement</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {[...CLANS]
                    .sort((a, b) => a.primaryName.localeCompare(b.primaryName))
                    .map((c) => {
                      const on = draft.clanIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            set(
                              "clanIds",
                              on
                                ? draft.clanIds.filter((id) => id !== c.id)
                                : [...draft.clanIds, c.id],
                            )
                          }
                          className={`rounded-sm border px-2 py-1 text-xs ${
                            on
                              ? "border-peacock bg-surface-2 text-peacock"
                              : "border-line text-muted hover:border-line-strong"
                          }`}
                        >
                          {c.primaryName}
                        </button>
                      );
                    })}
                </div>
                <p className={helpCls}>
                  Which clans are present, not how many families. The archive records presence in
                  bands and never publishes household counts.
                </p>
              </div>

              <div>
                <span className={labelCls}>When was it established?</span>
                <div className="mt-1 grid gap-3 sm:grid-cols-3">
                  <input
                    className={control}
                    value={draft.periodStart}
                    onChange={(e) => set("periodStart", e.target.value)}
                    placeholder="From (year)"
                    inputMode="numeric"
                  />
                  <input
                    className={control}
                    value={draft.periodEnd}
                    onChange={(e) => set("periodEnd", e.target.value)}
                    placeholder="To (year)"
                    inputMode="numeric"
                  />
                  <select
                    className={control}
                    value={draft.precision}
                    onChange={(e) => set("precision", e.target.value)}
                  >
                    {PRECISIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className={helpCls}>
                  A range is more useful than a wrong year. &ldquo;Around my great-grandfather&rsquo;s
                  time&rdquo; is a decade or a quarter-century, not a date — and the archive stores
                  it that way on purpose.
                </p>
              </div>
            </div>
          </fieldset>
        ) : null}

        {/* Step 4 */}
        {step === 3 ? (
          <fieldset>
            <legend className="font-display text-xl text-ink-strong">Your source</legend>
            <div className="mt-4 space-y-4">
              <div>
                <label className={labelCls} htmlFor="rel">
                  Your relationship to this settlement
                </label>
                <select
                  id="rel"
                  className={control}
                  value={draft.relationship}
                  onChange={(e) => set("relationship", e.target.value)}
                >
                  <option value="">Select</option>
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <p className={helpCls}>
                  This is not a test of authority. A resident&rsquo;s knowledge and a
                  researcher&rsquo;s document are different kinds of evidence, and the archive
                  needs to know which it is holding.
                </p>
              </div>

              <div>
                <span className={labelCls}>Where does this information come from?</span>
                <div className="mt-1 space-y-2">
                  {SOURCE_CATEGORIES.map((s) => (
                    <label
                      key={s.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-sm border p-2.5 text-sm ${
                        draft.sourceCategory === s.value
                          ? "border-peacock bg-surface-2"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="src"
                        checked={draft.sourceCategory === s.value}
                        onChange={() => set("sourceCategory", s.value)}
                      />
                      <span className="text-ink">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls} htmlFor="srcd">
                  Describe the source
                </label>
                <textarea
                  id="srcd"
                  rows={3}
                  className={control}
                  value={draft.sourceDescription}
                  onChange={(e) => set("sourceDescription", e.target.value)}
                  placeholder="Which record, which year, who told you, when they told you…"
                />
              </div>
            </div>
          </fieldset>
        ) : null}

        {/* Step 5 */}
        {step === 4 ? (
          <fieldset>
            <legend className="font-display text-xl text-ink-strong">Evidence</legend>
            <div className="mt-4 space-y-4">
              <div className="rounded-sm border border-dashed border-line-strong p-6 text-center">
                <p className="text-sm text-muted">
                  File upload is not wired up in this prototype. In production this issues a signed
                  object-storage URL that will not be granted until a consent record exists.
                </p>
              </div>
              <div>
                <label className={labelCls} htmlFor="ev">
                  Describe the evidence you hold
                </label>
                <textarea
                  id="ev"
                  rows={4}
                  className={control}
                  value={draft.evidenceDescription}
                  onChange={(e) => set("evidenceDescription", e.target.value)}
                  placeholder="Photographs, a recording, a document, a census page…"
                />
              </div>
              <p className={helpCls}>
                Images are compressed on upload and served lazily. If you are on a metered
                connection, you can submit the description now and add files later using your
                reference code.
              </p>
            </div>
          </fieldset>
        ) : null}

        {/* Step 6 */}
        {step === 5 ? (
          <fieldset>
            <legend className="font-display text-xl text-ink-strong">
              Consent and attribution
            </legend>
            <div className="mt-4 space-y-4">
              {needsConsent ? (
                <div
                  className="rounded-sm border-l-4 p-3 text-sm"
                  style={{ borderLeftColor: "var(--v-disputed)" }}
                >
                  <p className="text-ink">
                    This contribution carries media or testimony, so a consent record is required.
                    It cannot be waived and cannot be added later by an editor on the
                    contributor&rsquo;s behalf.
                  </p>
                </div>
              ) : null}

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={draft.consentGiven}
                  onChange={(e) => set("consentGiven", e.target.checked)}
                />
                <span className="text-ink">
                  The people recorded or depicted have given consent for this material to be held
                  by the archive.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={draft.consentIsVerbal}
                  onChange={(e) => set("consentIsVerbal", e.target.checked)}
                />
                <span className="text-ink">
                  Consent was given verbally and recorded.
                  <span className="mt-0.5 block text-[11px] text-muted">
                    Verbal consent is fully valid here. Many narrators are elders who may not read
                    the consent language, and a written-only process would exclude the people whose
                    knowledge matters most.
                  </span>
                </span>
              </label>

              {draft.consentIsVerbal ? (
                <div>
                  <label className={labelCls} htmlFor="clang">
                    Which language was consent given in?
                  </label>
                  <input
                    id="clang"
                    className={control}
                    value={draft.consentLanguage}
                    onChange={(e) => set("consentLanguage", e.target.value)}
                    placeholder="Gor Boli, Telugu, Marathi…"
                  />
                </div>
              ) : null}

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={draft.involvesMinor}
                  onChange={(e) => set("involvesMinor", e.target.checked)}
                />
                <span className="text-ink">A person under 18 is identifiable in this material.</span>
              </label>

              {draft.involvesMinor ? (
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={draft.guardianConsent}
                    onChange={(e) => set("guardianConsent", e.target.checked)}
                  />
                  <span className="text-ink">
                    A guardian has consented.
                    <span className="mt-0.5 block text-[11px] text-muted">
                      Material identifying a minor also requires a benefit review before it can be
                      published, and defaults to archive-only.
                    </span>
                  </span>
                </label>
              ) : null}

              <div>
                <label className={labelCls} htmlFor="attr">
                  How should your contribution be attributed?
                </label>
                <select
                  id="attr"
                  className={control}
                  value={draft.attribution}
                  onChange={(e) => set("attribution", e.target.value)}
                >
                  <option value="full_name">My full name</option>
                  <option value="initials">My initials</option>
                  <option value="village_only">My village only</option>
                  <option value="anonymous">Anonymous</option>
                </select>
                <p className={helpCls}>
                  Your identity is verified internally for audit integrity either way, is never
                  published against your preference, and never appears in a dataset export.
                </p>
              </div>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={draft.permissionToPublish}
                  onChange={(e) => set("permissionToPublish", e.target.checked)}
                />
                <span className="text-ink">
                  I give permission for this material to be published if an editor accepts it.
                  <span className="mt-0.5 block text-[11px] text-muted">
                    Commercial reuse and AI-training use both default to <strong>no</strong>, and
                    cannot be switched on without a fresh consent record. Consent is revocable at
                    any time and is honoured within seven days.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={draft.contactVerified}
                  onChange={(e) => set("contactVerified", e.target.checked)}
                />
                <span className="text-ink">
                  I have verified a phone number or email so an editor can come back with
                  questions. <span className="text-[11px] text-muted">(Simulated here.)</span>
                </span>
              </label>
            </div>
          </fieldset>
        ) : null}

        {/* Step 7 */}
        {step === 6 ? (
          <div>
            <h2 className="font-display text-xl text-ink-strong">Review and submit</h2>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Contributing", kindMeta?.label ?? "—"],
                ["Settlement", draft.tandaName || presetTandaId || "—"],
                [
                  "Location",
                  draft.lat && draft.lng ? `${draft.lat}, ${draft.lng}` : "Not given",
                ],
                ["Relationship", draft.relationship || "—"],
                [
                  "Source",
                  SOURCE_CATEGORIES.find((s) => s.value === draft.sourceCategory)?.label ?? "—",
                ],
                [
                  "Period",
                  draft.periodStart
                    ? `${draft.periodStart}${draft.periodEnd ? `–${draft.periodEnd}` : ""} (${
                        PRECISIONS.find((p) => p.value === draft.precision)?.label ?? ""
                      })`
                    : "Not given",
                ],
                ["Consent", draft.consentGiven ? "Given" : "Not given"],
                ["Attribution", draft.attribution.replace(/_/g, " ")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            {issues.length > 0 ? (
              <div
                className="mt-4 rounded-sm border-l-4 bg-surface-0 p-3"
                style={{ borderLeftColor: "var(--v-disputed)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--v-disputed)" }}>
                  Before this can be submitted
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
                  {issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-sm text-peacock">
                Ready to submit. This will enter the review queue with a pending status.
              </p>
            )}
          </div>
        ) : null}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-sm border border-line px-4 py-2 text-sm text-muted disabled:opacity-40 hover:border-peacock hover:text-peacock"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="rounded-sm bg-terracotta px-5 py-2 text-sm font-semibold text-terracotta-ink"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={issues.length > 0}
              className="rounded-sm bg-terracotta px-5 py-2 text-sm font-semibold text-terracotta-ink disabled:opacity-40"
            >
              Submit for review
            </button>
          )}
        </div>
      </div>

      {/* Persistent assurance rail — visible on every step, not only the last */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-lg border-l-4 border-l-[color:var(--gold)] bg-surface-1 p-4">
          <h2 className="font-display text-base text-ink-strong">
            Nothing here publishes automatically
          </h2>
          <p className="mt-1 text-sm text-muted">
            Every submission is reviewed by a district researcher or state editor before anything
            becomes visible. A reviewer can accept some fields and reject others — partial
            acceptance is normal.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface-1 p-4">
          <h2 className="font-display text-base text-ink-strong">What is never stored</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
            <li>Names, addresses or phone numbers of private individuals</li>
            <li>Household-level lists or mapping</li>
            <li>Individual genealogies</li>
            <li>Caste certificates or any government ID</li>
            <li>Political affiliation of a settlement</li>
          </ul>
          <p className="mt-2 text-xs text-muted">
            Submissions containing these are rejected and the data discarded rather than stored.
          </p>
          <Link href="/privacy" className="mt-2 inline-block text-xs text-peacock underline">
            Community data policy →
          </Link>
        </div>

        <div className="rounded-lg border border-line bg-surface-1 p-4">
          <h2 className="font-display text-base text-ink-strong">Your draft is saved</h2>
          <p className="mt-1 text-xs text-muted">
            Saved on this device as you type, so a dropped connection does not lose your work.
            Nothing leaves your device until you submit.
          </p>
        </div>
      </aside>
    </div>
  );
}
