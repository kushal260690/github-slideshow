import Link from "next/link";
import type { ReactNode } from "react";
import { getSource, SOURCE_CATEGORY_LABEL } from "@/data/sources";
import {
  CONFIDENCE_LABEL,
  INTERPRETATION_LABEL,
  INTERPRETATION_MEANING,
  VERIFICATION_COLOR,
  VERIFICATION_LABEL,
  VERIFICATION_MEANING,
  formatPeriod,
  periodPrecisionNote,
} from "@/lib/format";
import type {
  ConfidenceLevel,
  ContestedFact,
  Fact,
  InterpretationLabel,
  VerificationStatus,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Status chips                                                        */
/* ------------------------------------------------------------------ */

/**
 * Colour is never the only channel: every chip carries its text label and a
 * distinct dot treatment, so the meaning survives greyscale, colour-blindness
 * and high-contrast mode (WCAG 1.4.1).
 */
export function VerificationChip({
  status,
  size = "md",
}: {
  status: VerificationStatus;
  size?: "sm" | "md";
}) {
  const disputed = status === "disputed";
  return (
    <span
      title={VERIFICATION_MEANING[status]}
      className={`inline-flex items-center gap-1.5 rounded-sm border font-medium whitespace-nowrap ${
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs"
      }`}
      style={{
        color: VERIFICATION_COLOR[status],
        borderColor: VERIFICATION_COLOR[status],
        borderWidth: disputed ? 2 : 1,
        backgroundColor: "transparent",
      }}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: disputed ? "transparent" : VERIFICATION_COLOR[status],
          border: disputed ? `2px solid ${VERIFICATION_COLOR[status]}` : undefined,
        }}
      />
      {VERIFICATION_LABEL[status]}
    </span>
  );
}

export function ConfidenceChip({ level }: { level: ConfidenceLevel }) {
  const bars = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted" title={CONFIDENCE_LABEL[level]}>
      <span aria-hidden className="inline-flex items-end gap-[2px]">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="inline-block w-[3px] rounded-[1px]"
            style={{
              height: `${i * 3 + 2}px`,
              backgroundColor: i <= bars ? "var(--peacock)" : "var(--line-strong)",
            }}
          />
        ))}
      </span>
      {CONFIDENCE_LABEL[level]}
    </span>
  );
}

export function InterpretationChip({ label }: { label: InterpretationLabel }) {
  return (
    <span
      title={INTERPRETATION_MEANING[label]}
      className="inline-block rounded-sm border border-line-strong bg-surface-2 px-2 py-0.5 text-[11px] text-ink"
    >
      {INTERPRETATION_LABEL[label]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Demo labelling                                                      */
/* ------------------------------------------------------------------ */

export function DemoChip() {
  return (
    <span
      className="inline-block rounded-sm bg-v-disputed px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wider text-white"
      title="Demonstration record. Invented data, not historically verified."
    >
      DEMO
    </span>
  );
}

/**
 * Not dismissible, not collapsible, and rendered before the content rather
 * than after it. A warning the reader can close is a warning that will be
 * screenshotted without it.
 */
export function DemoBanner({ detail }: { detail?: string }) {
  return (
    <div
      role="note"
      className="border-y-2 px-4 py-3 text-sm"
      style={{
        borderColor: "var(--v-disputed)",
        backgroundColor: "color-mix(in srgb, var(--v-disputed) 12%, transparent)",
      }}
    >
      <p className="font-semibold" style={{ color: "var(--v-disputed)" }}>
        Demo data — not historically verified
      </p>
      <p className="mt-1 max-w-3xl text-muted">
        {detail ??
          "This record is invented. Its name, coordinates, population, dates and clan composition are fabrications used to demonstrate the interface. It is excluded from every public counter and, by a database rule, can never be marked verified."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

export function SourceBadge({ id }: { id: string }) {
  const source = getSource(id);
  if (!source) {
    return <span className="text-[11px] text-muted">Unknown source reference</span>;
  }
  const demo = source.category === "demo_placeholder";
  return (
    <span
      className="inline-flex max-w-full items-baseline gap-1.5 text-[11px]"
      title={source.notes}
    >
      <span
        className="shrink-0 rounded-sm px-1.5 py-0.5"
        style={{
          backgroundColor: demo ? "color-mix(in srgb, var(--v-disputed) 20%, transparent)" : "var(--surface-2)",
          color: demo ? "var(--v-disputed)" : "var(--muted)",
        }}
      >
        {SOURCE_CATEGORY_LABEL[source.category] ?? source.category}
      </span>
      <span className="text-muted">
        {source.title}
        {source.publicationYear ? ` (${source.publicationYear})` : ""}
        {source.authorOrOrg ? ` — ${source.authorOrOrg}` : ""}
      </span>
    </span>
  );
}

export function SourceList({ ids, emptyNote }: { ids: string[]; emptyNote?: string }) {
  if (ids.length === 0) {
    return (
      <p className="text-[11px] text-muted">
        {emptyNote ?? "No source attached. This claim is recorded but not evidenced."}
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {ids.map((id) => (
        <li key={id}>
          <SourceBadge id={id} />
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Facts                                                               */
/* ------------------------------------------------------------------ */

export function NotDocumented({ note, contributeHref }: { note?: string; contributeHref?: string }) {
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="italic text-muted">Not yet documented</span>
      {note ? <span className="text-[11px] text-muted">{note}</span> : null}
      <Link
        href={contributeHref ?? "/contribute"}
        className="text-[11px] text-peacock underline underline-offset-2"
      >
        Contribute this information →
      </Link>
    </span>
  );
}

/**
 * The workhorse. A value cannot be rendered here without its evidence being
 * rendered with it — the provenance is a sibling element, not an optional prop.
 */
export function FactRow<T extends ReactNode>({
  label,
  fact,
  contributeHref,
}: {
  label: string;
  fact: Fact<T>;
  contributeHref?: string;
}) {
  const documented = fact.value !== null && fact.verification !== "not_documented";
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[minmax(9rem,14rem)_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="text-sm">
        {documented ? (
          <>
            <div className="text-ink">{fact.value}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <VerificationChip status={fact.verification} size="sm" />
              <ConfidenceChip level={fact.confidence} />
              {fact.interpretation ? <InterpretationChip label={fact.interpretation} /> : null}
            </div>
            {fact.sourceIds.length > 0 ? (
              <div className="mt-1.5">
                <SourceList ids={fact.sourceIds} />
              </div>
            ) : (
              <p className="mt-1.5 text-[11px] text-muted">
                No source attached. Recorded, not evidenced.
              </p>
            )}
            {fact.editorialNote ? (
              <p className="mt-1.5 max-w-2xl text-[11px] italic text-muted">
                Editorial note: {fact.editorialNote}
              </p>
            ) : null}
          </>
        ) : (
          <NotDocumented note={fact.editorialNote} contributeHref={contributeHref} />
        )}
      </dd>
    </div>
  );
}

/**
 * Two or more incompatible claims, shown side by side. There is deliberately
 * no "primary" claim and no visual hierarchy between them.
 */
export function ContestedBlock({
  label,
  contested,
}: {
  label: string;
  contested: ContestedFact<string>;
}) {
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-medium text-muted">{label}</h4>
        {contested.claims.length > 1 ? (
          <span className="text-[11px] font-medium" style={{ color: "var(--v-disputed)" }}>
            {contested.claims.length} incompatible accounts recorded
          </span>
        ) : null}
      </div>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        {contested.claims.map((claim, i) => (
          <div
            key={i}
            className="rounded-lg border p-3"
            style={{
              borderColor:
                contested.claims.length > 1 ? "var(--v-disputed)" : "var(--line)",
              borderWidth: contested.claims.length > 1 ? 2 : 1,
            }}
          >
            <p className="text-sm text-ink">{claim.value}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <VerificationChip status={claim.verification} size="sm" />
              <ConfidenceChip level={claim.confidence} />
              {claim.interpretation ? <InterpretationChip label={claim.interpretation} /> : null}
            </div>
            <div className="mt-2">
              <SourceList ids={claim.sourceIds} />
            </div>
          </div>
        ))}
      </div>
      {contested.editorialNote ? (
        <p className="mt-2 max-w-3xl text-[11px] italic text-muted">
          Editorial note: {contested.editorialNote}
        </p>
      ) : null}
    </div>
  );
}

export function PeriodValue({
  period,
  interpretation,
}: {
  period: Parameters<typeof formatPeriod>[0];
  interpretation?: InterpretationLabel;
}) {
  const note = periodPrecisionNote(period);
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="text-ink">{formatPeriod(period)}</span>
      {note ? <span className="text-[11px] text-muted">{note}</span> : null}
      {interpretation ? (
        <span className="mt-1">
          <InterpretationChip label={interpretation} />
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

export function TextileRule({ gold = false }: { gold?: boolean }) {
  return <div aria-hidden className={gold ? "textile-rule-gold" : "textile-rule"} />;
}

export function SectionCard({
  title,
  id,
  description,
  action,
  children,
}: {
  title: string;
  id?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-lg border border-line bg-surface-1 p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink-strong">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  standfirst,
  children,
}: {
  eyebrow?: string;
  title: string;
  standfirst?: string;
  children?: ReactNode;
}) {
  return (
    <header className="paper-grain border-b border-line bg-surface-1">
      <TextileRule />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl text-ink-strong sm:text-4xl">{title}</h1>
        {standfirst ? (
          <p className="mt-3 max-w-3xl text-base text-muted sm:text-lg">{standfirst}</p>
        ) : null}
        {children}
      </div>
    </header>
  );
}

export function Stat({
  value,
  label,
  note,
  href,
  tone = "default",
}: {
  value: string | number;
  label: string;
  note?: string;
  href?: string;
  tone?: "default" | "demo" | "gold";
}) {
  const color =
    tone === "demo" ? "var(--v-disputed)" : tone === "gold" ? "var(--gold)" : "var(--ink-strong)";
  const inner = (
    <>
      <div className="tabular font-display text-3xl" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-sm text-ink">{label}</div>
      {note ? <div className="mt-1 text-[11px] text-muted">{note}</div> : null}
    </>
  );
  const className =
    "block rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:bg-surface-2";
  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "gold";
  title?: string;
  children: ReactNode;
}) {
  const color =
    tone === "warn" ? "var(--v-disputed)" : tone === "gold" ? "var(--gold)" : "var(--peacock)";
  return (
    <div
      className="rounded-lg border-l-4 bg-surface-1 p-4"
      style={{ borderLeftColor: color }}
    >
      {title ? (
        <p className="mb-1 text-sm font-semibold" style={{ color }}>
          {title}
        </p>
      ) : null}
      <div className="text-sm text-muted [&_a]:text-peacock [&_a]:underline">{children}</div>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {item.href ? (
              <Link href={item.href} className="hover:text-peacock">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
            {i < items.length - 1 ? <span aria-hidden>/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
