import { NextResponse } from "next/server";
import type { TandaFilter } from "@/lib/repository";
import type { VerificationStatus } from "@/lib/types";

/**
 * API envelope.
 *
 * `meta.disclaimer` is attached whenever a response contains demo rows. It is
 * there so that a downstream consumer who never reads the documentation still
 * cannot mistake prototype data for real data — the warning travels with the
 * payload rather than living only in the UI.
 */

export const DEMO_DISCLAIMER =
  "This response contains demonstration records. They are invented, are flagged with isDemo, and must not be used as data about real settlements.";

export function ok<T>(data: T, extraMeta: Record<string, unknown> = {}) {
  const demoCount = countDemo(data);
  return NextResponse.json(
    {
      data,
      meta: {
        generatedAt: new Date().toISOString(),
        demoRecordCount: demoCount,
        ...(demoCount > 0 ? { disclaimer: DEMO_DISCLAIMER } : {}),
        ...extraMeta,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

function countDemo(value: unknown): number {
  if (Array.isArray(value)) return value.reduce<number>((n, v) => n + countDemo(v), 0);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    let n = obj.isDemo === true ? 1 : 0;
    for (const key of Object.keys(obj)) {
      if (key === "isDemo") continue;
      n += countDemo(obj[key]);
    }
    return n;
  }
  return 0;
}

const VERIFICATION_VALUES: VerificationStatus[] = [
  "not_documented",
  "unverified",
  "partially_verified",
  "verified",
  "disputed",
];

/** Parse the shared Tanda filter from a query string. */
export function parseTandaFilter(url: URL): TandaFilter {
  const p = url.searchParams;
  const num = (key: string) => {
    const v = p.get(key);
    if (v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const verification = (p.get("verification") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is VerificationStatus =>
      (VERIFICATION_VALUES as string[]).includes(s),
    );

  let near: TandaFilter["near"];
  const nearRaw = p.get("near");
  if (nearRaw) {
    const [lat, lng, radiusKm] = nearRaw.split(",").map(Number);
    if ([lat, lng, radiusKm].every(Number.isFinite)) near = { lat, lng, radiusKm };
  }

  return {
    state: p.get("state") ?? undefined,
    district: p.get("district") ?? undefined,
    clan: p.get("clan") ?? undefined,
    surname: p.get("surname") ?? undefined,
    settlementType: p.get("settlementType") ?? undefined,
    minPop: num("minPop"),
    maxPop: num("maxPop"),
    periodFrom: num("periodFrom"),
    periodTo: num("periodTo"),
    verification: verification.length ? verification : undefined,
    q: p.get("q") ?? undefined,
    near,
    excludeDemo: p.get("excludeDemo") === "true",
  };
}
