/**
 * Repository — the single seam between the application and its data store.
 *
 * In this prototype every function reads the typed in-memory dataset in
 * src/data. In production each becomes a SQL query against PostgreSQL/PostGIS
 * (see db/schema.sql), with no change required in pages, components or route
 * handlers. Where the SQL differs materially from the in-memory version, the
 * intended query is written in the comment above the function.
 */

import { ARTICLES, ARTICLE_BY_SLUG } from "@/data/articles";
import { CLANS, CLAN_BY_SLUG, CLAN_RELATIONSHIPS } from "@/data/clans";
import { ALL_DISTRICTS, STATES, STATE_BY_ID } from "@/data/geography";
import { COMMUNITY_TIMELINE, MIGRATION_ROUTES, ROUTE_BY_SLUG } from "@/data/migration";
import { SOURCES } from "@/data/sources";
import { SURNAMES, SURNAME_BY_SLUG, allSurnameForms } from "@/data/surnames";
import { TANDAS, TANDA_BY_ID } from "@/data/tandas";
import type {
  Article,
  Clan,
  MigrationRoute,
  Surname,
  Tanda,
  VerificationStatus,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

export interface TandaFilter {
  state?: string;
  district?: string;
  clan?: string;
  surname?: string;
  minPop?: number;
  maxPop?: number;
  periodFrom?: number;
  periodTo?: number;
  verification?: VerificationStatus[];
  settlementType?: string;
  q?: string;
  near?: { lat: number; lng: number; radiusKm: number };
  excludeDemo?: boolean;
}

/** Latest population figure with its year and whether it is an estimate. */
export function latestPopulation(t: Tanda) {
  if (t.populationRecords.length === 0) return null;
  const sorted = [...t.populationRecords].sort((a, b) => b.asOfYear - a.asOfYear);
  return sorted[0];
}

/** The founding period, if one is recorded. Never a single fabricated year. */
export function foundingEvent(t: Tanda) {
  return t.events.find((e) => e.kind === "settlement_founded") ?? null;
}

export function majorClans(t: Tanda): string[] {
  return t.clanPresence
    .filter((c) => c.band === "predominant" || c.band === "substantial")
    .map((c) => CLANS.find((k) => k.id === c.clanId)?.primaryName ?? c.clanId);
}

/** Haversine. In production this is ST_DWithin against a GiST index. */
function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Normalised, accent- and case-insensitive comparison. The production
 * equivalent is `lower(unaccent(...))` with a pg_trgm GIN index, matching the
 * generated columns in db/schema.sql.
 */
function normalise(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Trigram similarity, the same measure Postgres's pg_trgm uses. Spelling
 * tolerance is not a nicety here: the same settlement is legitimately written
 * six ways across five scripts, so an exact-match search would be useless.
 */
export function similarity(a: string, b: string): number {
  const grams = (s: string) => {
    const padded = `  ${normalise(s)} `;
    const out = new Set<string>();
    for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
    return out;
  };
  const ga = grams(a);
  const gb = grams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let shared = 0;
  for (const g of ga) if (gb.has(g)) shared++;
  return shared / (ga.size + gb.size - shared);
}

/* ------------------------------------------------------------------ */
/* Tandas                                                              */
/* ------------------------------------------------------------------ */

export function listTandas(filter: TandaFilter = {}): Tanda[] {
  let out = [...TANDAS];

  if (filter.excludeDemo) out = out.filter((t) => !t.isDemo);
  if (filter.state) out = out.filter((t) => t.stateId === filter.state);
  if (filter.district) out = out.filter((t) => t.districtId === filter.district);
  if (filter.settlementType) out = out.filter((t) => t.settlementType === filter.settlementType);

  if (filter.verification?.length) {
    out = out.filter((t) => filter.verification!.includes(t.verification));
  }

  if (filter.clan) {
    out = out.filter((t) => t.clanPresence.some((c) => c.clanId === filter.clan));
  }

  if (filter.surname) {
    // A surname filter resolves through the surname's clan associations. It
    // never asserts that a person of that surname lives in the settlement.
    const sn = SURNAME_BY_SLUG.get(filter.surname);
    const clanIds = new Set(sn?.clanAssociations.map((a) => a.clanId) ?? []);
    out = out.filter((t) => t.clanPresence.some((c) => clanIds.has(c.clanId)));
  }

  if (filter.minPop !== undefined || filter.maxPop !== undefined) {
    out = out.filter((t) => {
      const pop = latestPopulation(t)?.totalPopulation;
      // A settlement with no recorded population is not silently treated as
      // zero — it is excluded from a population filter, and the UI says so.
      if (pop === null || pop === undefined) return false;
      if (filter.minPop !== undefined && pop < filter.minPop) return false;
      if (filter.maxPop !== undefined && pop > filter.maxPop) return false;
      return true;
    });
  }

  if (filter.periodFrom !== undefined || filter.periodTo !== undefined) {
    out = out.filter((t) => {
      const ev = foundingEvent(t);
      const start = ev?.period.start;
      const end = ev?.period.end;
      if (start === null || start === undefined) return false;
      if (filter.periodTo !== undefined && start > filter.periodTo) return false;
      if (filter.periodFrom !== undefined && (end ?? start) < filter.periodFrom) return false;
      return true;
    });
  }

  if (filter.near) {
    const { lat, lng, radiusKm } = filter.near;
    out = out.filter(
      (t) =>
        t.coordinates !== null &&
        !t.sensitiveLocation &&
        distanceKm(t.coordinates, [lng, lat]) <= radiusKm,
    );
  }

  if (filter.q) {
    const q = filter.q;
    out = out.filter((t) =>
      t.names.some((n) => normalise(n.name).includes(normalise(q)) || similarity(n.name, q) > 0.3),
    );
  }

  return out;
}

export function getTanda(id: string): Tanda | undefined {
  return TANDA_BY_ID.get(id);
}

/** GeoJSON for the map. `fields=minimal` drops everything but the essentials. */
export function tandasGeoJSON(filter: TandaFilter = {}, minimal = false) {
  const features = listTandas(filter)
    .filter((t) => t.coordinates !== null)
    .map((t) => {
      const pop = latestPopulation(t);
      const founded = foundingEvent(t);
      return {
        type: "Feature" as const,
        id: t.id,
        geometry: { type: "Point" as const, coordinates: t.coordinates as [number, number] },
        properties: minimal
          ? {
              id: t.id,
              name: t.primaryName,
              state: STATE_BY_ID.get(t.stateId)?.name ?? t.stateId,
              status: t.verification,
              type: t.settlementType,
              isDemo: t.isDemo,
            }
          : {
              id: t.id,
              publicId: t.publicId,
              name: t.primaryName,
              altNames: t.names
                .filter((n) => !n.isPrimary)
                .map((n) => n.name)
                .join(" · "),
              state: STATE_BY_ID.get(t.stateId)?.name ?? t.stateId,
              district: ALL_DISTRICTS.find((d) => d.id === t.districtId)?.name ?? t.districtId,
              status: t.verification,
              type: t.settlementType,
              population: pop?.totalPopulation ?? null,
              populationYear: pop?.asOfYear ?? null,
              populationIsEstimate: pop?.isCommunityEstimate ?? null,
              clans: majorClans(t).join(", "),
              foundedFrom: founded?.period.start ?? null,
              foundedTo: founded?.period.end ?? null,
              foundedPrecision: founded?.period.precision ?? null,
              completeness: t.completenessPct,
              isDemo: t.isDemo,
              coordinatePrecision: t.coordinatePrecision,
            },
      };
    });

  return { type: "FeatureCollection" as const, features };
}

/* ------------------------------------------------------------------ */
/* Geography                                                           */
/* ------------------------------------------------------------------ */

/** Mirrors v_district_completeness. Counts are real; demo rows counted apart. */
export function stateDirectory() {
  return STATES.map((s) => {
    const inState = TANDAS.filter((t) => t.stateId === s.id);
    return {
      ...s,
      documented: inState.filter((t) => !t.isDemo).length,
      demo: inState.filter((t) => t.isDemo).length,
      verified: inState.filter((t) => !t.isDemo && t.verification === "verified").length,
      districtCount: s.districts.length,
    };
  });
}

export function districtDirectory(stateId: string) {
  const state = STATE_BY_ID.get(stateId);
  if (!state) return null;
  return {
    state,
    districts: state.districts.map((d) => {
      const inDistrict = TANDAS.filter((t) => t.districtId === d.id);
      return {
        ...d,
        documented: inDistrict.filter((t) => !t.isDemo).length,
        demo: inDistrict.filter((t) => t.isDemo).length,
        verified: inDistrict.filter((t) => !t.isDemo && t.verification === "verified").length,
      };
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Clans, surnames, routes, articles                                   */
/* ------------------------------------------------------------------ */

export function listClans(): Clan[] {
  return [...CLANS].sort((a, b) => a.primaryName.localeCompare(b.primaryName));
}

export function getClan(slug: string): Clan | undefined {
  return CLAN_BY_SLUG.get(slug);
}

export function clanRelationships(clanId?: string) {
  return clanId
    ? CLAN_RELATIONSHIPS.filter((r) => r.fromClanId === clanId || r.toClanId === clanId)
    : CLAN_RELATIONSHIPS;
}

/** Settlements where a clan is recorded — presence bands only, never counts. */
export function tandasForClan(clanId: string) {
  return TANDAS.filter((t) => t.clanPresence.some((c) => c.clanId === clanId)).map((t) => ({
    tanda: t,
    band: t.clanPresence.find((c) => c.clanId === clanId)!.band,
  }));
}

export function listSurnames(): Surname[] {
  return [...SURNAMES].sort((a, b) => a.primaryForm.localeCompare(b.primaryForm));
}

export function getSurname(slug: string): Surname | undefined {
  return SURNAME_BY_SLUG.get(slug);
}

export function listRoutes(): MigrationRoute[] {
  return MIGRATION_ROUTES;
}

export function getRoute(slug: string): MigrationRoute | undefined {
  return ROUTE_BY_SLUG.get(slug);
}

export function timeline() {
  return [...COMMUNITY_TIMELINE].sort(
    (a, b) => (a.period.start ?? 0) - (b.period.start ?? 0),
  );
}

export function listArticles(): Article[] {
  return ARTICLES;
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLE_BY_SLUG.get(slug);
}

export function listSources() {
  return SOURCES;
}

/* ------------------------------------------------------------------ */
/* Universal search                                                    */
/* ------------------------------------------------------------------ */

export type SearchResultKind = "tanda" | "clan" | "surname" | "article" | "route" | "place";

export interface SearchResult {
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  href: string;
  score: number;
  isDemo?: boolean;
  matchedOn?: string;
}

/**
 * Universal fuzzy search across every name index.
 *
 * Production: a UNION over pg_trgm similarity on tanda_names, clan_name_variants
 * and surname_variants, plus tsvector rank on articles, ordered by score.
 */
export function search(query: string, limit = 20): SearchResult[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const results: SearchResult[] = [];

  for (const t of TANDAS) {
    let best = 0;
    let matched = "";
    for (const n of t.names) {
      const s = normalise(n.name).includes(normalise(q)) ? 1 : similarity(n.name, q);
      if (s > best) {
        best = s;
        matched = n.name;
      }
    }
    if (best > 0.28) {
      results.push({
        kind: "tanda",
        title: t.primaryName,
        subtitle: `${ALL_DISTRICTS.find((d) => d.id === t.districtId)?.name ?? ""}, ${
          STATE_BY_ID.get(t.stateId)?.name ?? ""
        }`,
        href: `/tanda/${t.id}`,
        score: best,
        isDemo: t.isDemo,
        matchedOn: matched !== t.primaryName ? matched : undefined,
      });
    }
  }

  for (const c of CLANS) {
    const forms = [c.primaryName, ...c.variants.map((v) => v.variant)];
    let best = 0;
    let matched = "";
    for (const f of forms) {
      const s = normalise(f).includes(normalise(q)) ? 1 : similarity(f, q);
      if (s > best) {
        best = s;
        matched = f;
      }
    }
    if (best > 0.28) {
      results.push({
        kind: "clan",
        title: c.primaryName,
        subtitle: "Clan name",
        href: `/clans/${c.slug}`,
        score: best,
        matchedOn: matched !== c.primaryName ? matched : undefined,
      });
    }
  }

  const seenSurnames = new Set<string>();
  for (const { form, surnameSlug } of allSurnameForms()) {
    const s = normalise(form).includes(normalise(q)) ? 1 : similarity(form, q);
    if (s > 0.28 && !seenSurnames.has(surnameSlug)) {
      seenSurnames.add(surnameSlug);
      const sn = SURNAME_BY_SLUG.get(surnameSlug)!;
      results.push({
        kind: "surname",
        title: sn.primaryForm,
        subtitle: "Surname and spelling variants",
        href: `/surnames?s=${sn.slug}`,
        score: s,
        matchedOn: form !== sn.primaryForm ? form : undefined,
      });
    }
  }

  for (const a of ARTICLES) {
    const hay = `${a.title} ${a.standfirst} ${a.section}`;
    const s = normalise(hay).includes(normalise(q)) ? 0.9 : similarity(a.title, q);
    if (s > 0.28) {
      results.push({
        kind: "article",
        title: a.title,
        subtitle: a.section,
        href: `/encyclopedia/${a.slug}`,
        score: s,
      });
    }
  }

  for (const r of MIGRATION_ROUTES) {
    const s = normalise(r.name).includes(normalise(q)) ? 0.85 : similarity(r.name, q);
    if (s > 0.3) {
      results.push({
        kind: "route",
        title: r.name,
        subtitle: "Migration route",
        href: `/migration?route=${r.slug}`,
        score: s,
        isDemo: r.isDemo,
      });
    }
  }

  for (const st of STATES) {
    if (normalise(st.name).includes(normalise(q))) {
      results.push({
        kind: "place",
        title: st.name,
        subtitle: "State directory",
        href: `/states/${st.id}`,
        score: 0.8,
      });
    }
    for (const d of st.districts) {
      if (normalise(d.name).includes(normalise(q))) {
        results.push({
          kind: "place",
          title: d.name,
          subtitle: `District · ${st.name}`,
          href: `/states/${st.id}#${d.id}`,
          score: 0.75,
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Public statistics — mirrors v_public_stats                          */
/* ------------------------------------------------------------------ */

/**
 * Homepage counters.
 *
 * Real rows only. Demo rows are counted separately and labelled separately, so
 * that no figure presented as a project statistic can be a fabrication. At the
 * time of this prototype almost every real counter is zero, and the homepage
 * shows the zeros.
 */
export function publicStats() {
  const real = TANDAS.filter((t) => !t.isDemo);
  const demo = TANDAS.filter((t) => t.isDemo);
  return {
    tandasDocumented: real.length,
    tandasDemo: demo.length,
    tandasVerified: real.filter((t) => t.verification === "verified").length,
    statesCovered: new Set(real.map((t) => t.stateId)).size,
    statesOpenForDocumentation: STATES.length,
    districtsOpenForDocumentation: ALL_DISTRICTS.length,
    documentarySources: SOURCES.filter(
      (s) =>
        !s.isDemo &&
        ["census", "government_record", "academic", "archival_document"].includes(s.category),
    ).length,
    oralHistories: TANDAS.flatMap((t) => t.media).filter(
      (m) =>
        !m.isDemo &&
        m.isPublished &&
        (m.kind === "audio_oral_history" || m.kind === "video_interview"),
    ).length,
    clansDocumented: CLANS.filter((c) => !c.isDemo).length,
    surnamesIndexed: SURNAMES.length,
    articlesPublished: ARTICLES.length,
    migrationRoutes: MIGRATION_ROUTES.filter((r) => !r.isDemo).length,
  };
}

export function latestAdditions(limit = 4) {
  return [...ARTICLES]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
    .map((a) => ({
      title: a.title,
      href: `/encyclopedia/${a.slug}`,
      kind: "Encyclopedia article",
      at: a.updatedAt,
      verification: a.verification,
    }));
}
