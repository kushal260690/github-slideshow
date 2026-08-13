"use client";

import { useState } from "react";
import { AUDIT_LOG, DISPUTES, EDITORIAL_ROLES, SUBMISSIONS } from "@/data/moderation";
import { stateDirectory } from "@/lib/repository";
import type { FieldDecision, Submission } from "@/lib/types";

type Tab = "queue" | "disputes" | "duplicates" | "consent" | "coverage" | "roles" | "audit";

const TABS: { key: Tab; label: string; count?: number }[] = [
  { key: "queue", label: "Review queue", count: SUBMISSIONS.length },
  { key: "disputes", label: "Disputes", count: DISPUTES.filter((d) => d.status === "open").length },
  { key: "duplicates", label: "Duplicates" },
  { key: "consent", label: "Consent" },
  { key: "coverage", label: "Coverage" },
  { key: "roles", label: "Roles" },
  { key: "audit", label: "Audit log" },
];

const FLAG_EXPLANATION: Record<string, string> = {
  no_documentary_source: "Submitted without a documentary source.",
  breakdown_exceeds_source_precision:
    "A demographic breakdown is offered that the stated source cannot support.",
  duplicate_candidate_within_5km: "An existing settlement is recorded within 5 km.",
  exact_year_without_document: "An exact year is proposed from memory rather than a document.",
  consent_missing: "Media or testimony submitted without a consent record. Blocked.",
  identifiable_narrator: "The narrator is identifiable in the recording.",
  household_level_data_rejected: "Household-level data was submitted; it was discarded, not stored.",
  privacy_violation_blocked: "Blocked under the community data policy.",
  coordinate_conflict: "Proposed coordinates conflict with the recorded position.",
  would_destroy_historical_record:
    "Accepting this as an edit would overwrite a historical location that should be kept.",
};

/**
 * Moderation dashboard.
 *
 * Field-level review is the point. A reviewer accepts three of five proposed
 * changes and rejects two, each with its own recorded reason, rather than
 * facing an all-or-nothing decision on a submission — which is how good
 * information gets thrown away along with the bad.
 *
 * Prototype note: decisions here are local state and are not persisted. In
 * production each writes a revision, an audit entry and a changelog line in one
 * transaction, and the whole surface is role-gated per db/policies.sql.
 */
export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("queue");
  const [activeId, setActiveId] = useState<string>(SUBMISSIONS[0]?.id ?? "");
  const [decisions, setDecisions] = useState<Record<string, FieldDecision>>({});
  const [log, setLog] = useState<string[]>([]);

  const active = SUBMISSIONS.find((s) => s.id === activeId) ?? null;

  function decide(sub: Submission, field: string, decision: FieldDecision) {
    const key = `${sub.id}:${field}`;
    setDecisions((d) => ({ ...d, [key]: decision }));
    setLog((l) => [
      `${new Date().toISOString().slice(0, 19).replace("T", " ")} — ${decision} · ${sub.referenceCode} · ${field}`,
      ...l,
    ]);
  }

  const btn =
    "rounded-sm border border-line px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-peacock hover:text-peacock";

  return (
    <div>
      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-1 border-b border-line pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key}
            className={`rounded-sm px-3 py-1.5 text-sm ${
              tab === t.key
                ? "bg-surface-2 text-peacock"
                : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.count !== undefined ? (
              <span className="tabular ml-1.5 text-[11px] text-terracotta">{t.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Queue */}
      {tab === "queue" ? (
        <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface-1">
            {SUBMISSIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-surface-2 ${
                    activeId === s.id ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="tabular block text-sm text-terracotta">{s.referenceCode}</span>
                  <span className="block text-sm text-ink">{s.kind.replace(/_/g, " ")}</span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    {s.status.replace(/_/g, " ")} · {s.fields.length} fields
                  </span>
                  {s.flags.length > 0 ? (
                    <span
                      className="mt-1 block text-[10px]"
                      style={{ color: "var(--v-partial)" }}
                    >
                      {s.flags.length} automated {s.flags.length === 1 ? "flag" : "flags"}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>

          {active ? (
            <article className="rounded-lg border border-line bg-surface-1 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl text-ink-strong">{active.referenceCode}</h2>
                <span className="rounded-sm border border-line-strong px-2 py-0.5 text-[11px] text-ink">
                  {active.status.replace(/_/g, " ")}
                </span>
              </div>

              <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                {[
                  ["Contributor", active.contributorLabel],
                  ["Relationship", active.relationshipToTanda],
                  ["Source category", active.sourceCategory.replace(/_/g, " ")],
                  ["Consent", active.consentProvided ? "Provided" : "MISSING"],
                  ["Attribution", active.attribution.replace(/_/g, " ")],
                  ["Assigned to", active.assignedTo ?? "Unassigned"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="inline text-muted">{k}: </dt>
                    <dd
                      className="inline"
                      style={{
                        color: v === "MISSING" ? "var(--v-disputed)" : "var(--ink)",
                      }}
                    >
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-2 text-sm text-muted">{active.sourceDescription}</p>

              {active.flags.length > 0 ? (
                <div className="mt-4 rounded-sm border-l-4 border-l-[color:var(--v-partial)] bg-surface-0 p-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-terracotta">
                    Automated checks
                  </h3>
                  <ul className="mt-1 space-y-1 text-xs text-muted">
                    {active.flags.map((f) => (
                      <li key={f}>
                        <span className="text-ink">{f.replace(/_/g, " ")}</span> —{" "}
                        {FLAG_EXPLANATION[f] ?? "Flagged for reviewer attention."}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <h3 className="mt-5 font-display text-base text-ink-strong">
                Field-level review
              </h3>
              <p className="mt-1 text-xs text-muted">
                Decide each field separately. Accepting some and rejecting others is the normal
                outcome — an all-or-nothing decision throws away good information along with bad.
              </p>

              <ul className="mt-3 space-y-3">
                {active.fields.map((f) => {
                  const key = `${active.id}:${f.field}`;
                  const decision = decisions[key] ?? f.decision;
                  return (
                    <li key={f.field} className="rounded-lg border border-line bg-surface-0 p-3">
                      <p className="text-sm font-medium text-ink">{f.label}</p>
                      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                        <div className="rounded-sm border border-line p-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted">Current</p>
                          <p className="mt-0.5 text-ink">{f.currentValue ?? "Not documented"}</p>
                        </div>
                        <div
                          className="rounded-sm border p-2"
                          style={{ borderColor: "var(--peacock)" }}
                        >
                          <p className="text-[10px] uppercase tracking-wider text-muted">
                            Proposed
                          </p>
                          <p className="mt-0.5 text-ink">{f.proposedValue}</p>
                        </div>
                      </div>

                      {f.reviewerNote ? (
                        <p className="mt-2 text-[11px] italic text-muted">
                          Reviewer note: {f.reviewerNote}
                        </p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decide(active, f.field, "accepted")}
                          className={btn}
                          style={
                            decision === "accepted"
                              ? { borderColor: "var(--v-verified)", color: "var(--v-verified)" }
                              : undefined
                          }
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(active, f.field, "rejected")}
                          className={btn}
                          style={
                            decision === "rejected"
                              ? { borderColor: "var(--v-disputed)", color: "var(--v-disputed)" }
                              : undefined
                          }
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(active, f.field, "evidence_requested")}
                          className={btn}
                          style={
                            decision === "evidence_requested"
                              ? { borderColor: "var(--v-partial)", color: "var(--v-partial)" }
                              : undefined
                          }
                        >
                          Request evidence
                        </button>
                        <span className="text-[11px] text-muted">
                          Current decision: {decision.replace(/_/g, " ")}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {log.length > 0 ? (
                <div className="mt-4 rounded-sm border border-line bg-surface-0 p-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-terracotta">
                    This session&rsquo;s actions
                  </h4>
                  <ul className="tabular mt-1 space-y-0.5 text-[11px] text-muted">
                    {log.slice(0, 6).map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-[10px] text-muted">
                    Prototype: not persisted. In production each of these writes a revision, an
                    audit entry and a public changelog line in one transaction.
                  </p>
                </div>
              ) : null}
            </article>
          ) : null}
        </div>
      ) : null}

      {/* Disputes */}
      {tab === "disputes" ? (
        <ul className="space-y-3">
          {DISPUTES.map((d) => (
            <li key={d.id} className="rounded-lg border border-line bg-surface-1 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base text-ink-strong">{d.subjectLabel}</h2>
                <span className="text-[11px] uppercase tracking-wider text-terracotta">
                  {d.field.replace(/_/g, " ")}
                </span>
                <span
                  className="rounded-sm border px-2 py-0.5 text-[11px]"
                  style={{
                    borderColor:
                      d.status === "open" ? "var(--v-disputed)" : "var(--line-strong)",
                    color: d.status === "open" ? "var(--v-disputed)" : "var(--ink)",
                  }}
                >
                  {d.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{d.reason}</p>
              {d.resolutionNote ? (
                <p className="mt-2 rounded-sm border-l-2 border-l-[color:var(--peacock)] bg-surface-0 p-2 text-sm text-ink">
                  {d.resolutionNote}
                </p>
              ) : null}
              <p className="mt-2 text-[11px] text-muted">
                Raised by {d.raisedBy} · {d.createdAt.slice(0, 10)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Duplicates */}
      {tab === "duplicates" ? (
        <div className="rounded-lg border border-line bg-surface-1 p-5">
          <h2 className="font-display text-xl text-ink-strong">Duplicate candidates</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            New settlement submissions are checked against every existing record within 5 km and
            against every recorded name variant. Duplicates are the most common data-quality
            failure in a settlement gazetteer, because the same place is legitimately written six
            ways.
          </p>
          <ul className="mt-4 space-y-2">
            {SUBMISSIONS.filter((s) => s.flags.includes("duplicate_candidate_within_5km")).map(
              (s) => (
                <li key={s.id} className="rounded-sm border border-line bg-surface-0 p-3 text-sm">
                  <span className="tabular text-terracotta">{s.referenceCode}</span> —{" "}
                  <span className="text-ink">{s.proposedTandaName}</span>
                  <p className="mt-1 text-xs text-muted">
                    An existing record lies within 5 km. Merging two distinct settlements is as
                    damaging as duplicating one — the reviewer must confirm with the contributor
                    rather than decide from the map.
                  </p>
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}

      {/* Consent */}
      {tab === "consent" ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-surface-1 p-5">
            <h2 className="font-display text-xl text-ink-strong">Consent review</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted">
              No media asset can be published without a live consent record whose scope permits it.
              This is enforced by a database trigger, not by this screen — the dashboard shows the
              queue, but the guarantee lives in the schema.
            </p>
          </div>
          <ul className="space-y-3">
            {SUBMISSIONS.filter((s) => !s.consentProvided).map((s) => (
              <li
                key={s.id}
                className="rounded-lg border-2 p-4"
                style={{ borderColor: "var(--v-disputed)" }}
              >
                <p className="tabular text-sm text-terracotta">{s.referenceCode}</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--v-disputed)" }}>
                  Blocked — no consent record
                </p>
                <p className="mt-1 text-sm text-muted">{s.sourceDescription}</p>
                <p className="mt-2 text-xs text-muted">
                  Recorded verbal consent in the narrator&rsquo;s own language is acceptable and is
                  usually the right route for an elder narrator. The contributor has been asked to
                  supply it.
                </p>
              </li>
            ))}
            {SUBMISSIONS.every((s) => s.consentProvided) ? (
              <li className="text-sm text-muted">No submissions are currently blocked.</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {/* Coverage */}
      {tab === "coverage" ? (
        <div className="rounded-lg border border-line bg-surface-1 p-5">
          <h2 className="font-display text-xl text-ink-strong">Completeness by state</h2>
          <p className="mt-1 text-sm text-muted">
            Where the archive is empty. This view exists to direct effort, so it deliberately
            emphasises the gaps rather than the achievements.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-terracotta">
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2 pr-3 text-right">Districts</th>
                  <th className="py-2 pr-3 text-right">Documented</th>
                  <th className="py-2 pr-3 text-right">Verified</th>
                  <th className="py-2">Coverage</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {stateDirectory().map((s) => (
                  <tr key={s.id} className="border-b border-line">
                    <td className="py-2 pr-3 text-ink">{s.name}</td>
                    <td className="py-2 pr-3 text-right text-muted">{s.districtCount}</td>
                    <td className="py-2 pr-3 text-right">{s.documented}</td>
                    <td className="py-2 pr-3 text-right" style={{ color: "var(--gold)" }}>
                      {s.verified}
                    </td>
                    <td className="py-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-0">
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.min(100, (s.documented / Math.max(1, s.districtCount)) * 100)}%`,
                            backgroundColor: "var(--peacock)",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Roles */}
      {tab === "roles" ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface-1">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="bg-surface-2">
              <tr className="text-left text-[11px] uppercase tracking-wider text-terracotta">
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Can do</th>
                <th className="px-4 py-2">May verify up to</th>
              </tr>
            </thead>
            <tbody>
              {EDITORIAL_ROLES.map((r) => (
                <tr key={r.role} className="border-t border-line">
                  <td className="px-4 py-2 text-ink">{r.role}</td>
                  <td className="px-4 py-2 text-muted">{r.canDo}</td>
                  <td className="px-4 py-2 text-muted">{r.maxVerification}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line p-4 text-xs text-muted">
            Promotion to verified always requires a reviewer distinct from the contributor.
            Self-verification is blocked by a database constraint, not by this interface — so it
            cannot be bypassed by calling the API directly.
          </p>
        </div>
      ) : null}

      {/* Audit */}
      {tab === "audit" ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface-1">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-surface-2">
              <tr className="text-left text-[11px] uppercase tracking-wider text-terracotta">
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Actor</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Subject</th>
                <th className="px-4 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((a) => (
                <tr key={a.id} className="border-t border-line align-top">
                  <td className="tabular px-4 py-2 text-muted">
                    {a.occurredAt.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-4 py-2 text-ink">{a.actor}</td>
                  <td className="px-4 py-2 text-muted">{a.action.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 text-muted">
                    {a.subjectLabel}
                    {a.field ? <span className="block text-[11px]">{a.field}</span> : null}
                  </td>
                  <td className="px-4 py-2 text-muted">{a.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line p-4 text-xs text-muted">
            The audit log is append-only — <code>UPDATE</code> and <code>DELETE</code> are blocked
            by rules on the table. A rollback restores a prior revision and writes a{" "}
            <em>new</em> audit row; history is added to, never rewritten.
          </p>
        </div>
      ) : null}
    </div>
  );
}
