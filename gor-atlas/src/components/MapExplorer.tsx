"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CLANS } from "@/data/clans";
import { STATES } from "@/data/geography";
import { MapView, type MapPoint } from "@/components/MapView";
import { VerificationChip } from "@/components/ui";
import { formatNumber, formatPeriod, markerState } from "@/lib/format";
import { foundingEvent, latestPopulation, listTandas, majorClans } from "@/lib/repository";
import { BASE_LAYERS, MARKER_LEGEND, type BaseLayerKey } from "@/lib/mapStyles";
import type { VerificationStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "verified", label: "Verified" },
  { value: "partially_verified", label: "Partially verified" },
  { value: "unverified", label: "Location only" },
  { value: "disputed", label: "Disputed" },
];

const PERIODS = [
  { label: "Any period", from: undefined, to: undefined },
  { label: "Before 1800", from: undefined, to: 1800 },
  { label: "1800–1900", from: 1800, to: 1900 },
  { label: "1900–1947", from: 1900, to: 1947 },
  { label: "After 1947", from: 1947, to: undefined },
];

export function MapExplorer() {
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [clanId, setClanId] = useState("");
  const [statuses, setStatuses] = useState<VerificationStatus[]>([]);
  const [periodIdx, setPeriodIdx] = useState(0);
  const [minPop, setMinPop] = useState("");
  const [baseLayer, setBaseLayer] = useState<BaseLayerKey>("standard");
  const [heatmap, setHeatmap] = useState(false);
  const [labels, setLabels] = useState(false);
  const [threeD, setThreeD] = useState(false);
  const [globe, setGlobe] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<{ lng: number; lat: number; zoom?: number } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [nearMe, setNearMe] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const districts = STATES.find((s) => s.id === stateId)?.districts ?? [];
  const period = PERIODS[periodIdx];

  const results = useMemo(
    () =>
      listTandas({
        state: stateId || undefined,
        district: districtId || undefined,
        clan: clanId || undefined,
        verification: statuses.length ? statuses : undefined,
        periodFrom: period.from,
        periodTo: period.to,
        minPop: minPop ? Number(minPop) : undefined,
        near: nearMe ? { ...nearMe, radiusKm: 150 } : undefined,
      }),
    [stateId, districtId, clanId, statuses, period, minPop, nearMe],
  );

  const points: MapPoint[] = useMemo(
    () =>
      results
        .filter((t) => t.coordinates !== null)
        .map((t) => ({
          id: t.id,
          name: t.primaryName,
          lng: t.coordinates![0],
          lat: t.coordinates![1],
          markerKey: markerState(t.verification, t.settlementType).key,
          isDemo: t.isDemo,
          completeness: t.completenessPct,
        })),
    [results],
  );

  const selectedTanda = results.find((t) => t.id === selected) ?? null;

  function reset() {
    setStateId("");
    setDistrictId("");
    setClanId("");
    setStatuses([]);
    setPeriodIdx(0);
    setMinPop("");
    setNearMe(null);
    setGeoError(null);
  }

  function locate() {
    if (!navigator.geolocation) {
      setGeoError("This browser does not provide location access.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setNearMe({ lat: latitude, lng: longitude });
        setFlyTo({ lat: latitude, lng: longitude, zoom: 7 });
        setGeoError(null);
      },
      () =>
        setGeoError(
          "Location was not shared. You can still filter by state and district, and your location is never sent to this server.",
        ),
    );
  }

  const control =
    "w-full rounded-sm border border-line bg-surface-0 px-2 py-1.5 text-sm text-ink focus:border-peacock";
  const chip =
    "rounded-sm border border-line px-2 py-1 text-[11px] text-muted hover:border-peacock hover:text-peacock";
  const chipOn = "border-peacock bg-surface-2 text-peacock";

  const filterPanel = (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-terracotta">
          State
        </label>
        <select
          className={control}
          value={stateId}
          onChange={(e) => {
            setStateId(e.target.value);
            setDistrictId("");
          }}
        >
          <option value="">All states</option>
          {STATES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-terracotta">
          District
        </label>
        <select
          className={control}
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          disabled={!stateId}
        >
          <option value="">{stateId ? "All districts" : "Select a state first"}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-terracotta">
          Clan recorded in settlement
        </label>
        <select className={control} value={clanId} onChange={(e) => setClanId(e.target.value)}>
          <option value="">Any clan</option>
          {[...CLANS]
            .sort((a, b) => a.primaryName.localeCompare(b.primaryName))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.primaryName}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-terracotta">
          Settlement period
        </label>
        <select
          className={control}
          value={periodIdx}
          onChange={(e) => setPeriodIdx(Number(e.target.value))}
        >
          {PERIODS.map((p, i) => (
            <option key={p.label} value={i}>
              {p.label}
            </option>
          ))}
        </select>
        {periodIdx > 0 ? (
          <p className="mt-1 text-[11px] text-muted">
            Settlements with no recorded founding period are excluded rather than assumed.
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-terracotta"
          htmlFor="minpop"
        >
          Minimum recorded population
        </label>
        <input
          id="minpop"
          type="number"
          min={0}
          step={100}
          value={minPop}
          onChange={(e) => setMinPop(e.target.value)}
          placeholder="Any"
          className={control}
        />
        {minPop ? (
          <p className="mt-1 text-[11px] text-muted">
            Settlements with no dated population figure are excluded — they are not counted as
            zero.
          </p>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
          Verification status
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((o) => {
            const on = statuses.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setStatuses((prev) =>
                    prev.includes(o.value)
                      ? prev.filter((v) => v !== o.value)
                      : [...prev, o.value],
                  )
                }
                className={`${chip} ${on ? chipOn : ""}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={locate} className={chip}>
          Tandas near me
        </button>
        <button type="button" onClick={reset} className={chip}>
          Reset filters
        </button>
      </div>
      {geoError ? <p className="text-[11px] text-muted">{geoError}</p> : null}
      {nearMe ? (
        <p className="text-[11px] text-peacock">
          Showing settlements within 150 km of your position. Your coordinates stay in the browser.
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="relative flex h-[calc(100vh-6rem)] min-h-[560px] flex-col lg:flex-row">
      {/* Desktop filter rail */}
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-line bg-surface-1 p-4 lg:block">
        <h2 className="mb-3 font-display text-lg text-ink-strong">Filters</h2>
        {filterPanel}
        <div className="mt-6 border-t border-line pt-4">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
            Marker legend
          </h3>
          <ul className="space-y-1.5">
            {MARKER_LEGEND.map((m) => (
              <li key={m.key} className="flex items-center gap-2 text-xs text-muted">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 rounded-full"
                  style={
                    m.key === "disputed"
                      ? { border: `3px solid ${m.color}` }
                      : { backgroundColor: m.color }
                  }
                />
                {m.label}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted">
            No demonstration record appears in green. Demo rows are blocked from verification at
            the database level, so a green marker can only ever mean a real settlement checked
            against real sources.
          </p>
        </div>
      </aside>

      {/* Map */}
      <div className="relative min-h-[320px] flex-1">
        <MapView
          points={points}
          baseLayer={baseLayer}
          showHeatmap={heatmap}
          showLabels={labels}
          threeD={threeD}
          globe={globe}
          autoSpin={!threeD && !flyTo}
          selectedId={selected}
          onSelect={setSelected}
          flyTo={flyTo}
          className="h-full w-full"
        />

        {/* Layer controls */}
        <div className="absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)] rounded-lg border border-line-strong bg-surface-1/95 p-2 backdrop-blur">
          <div className="flex flex-wrap gap-1">
            {(Object.keys(BASE_LAYERS) as BaseLayerKey[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={baseLayer === k}
                onClick={() => setBaseLayer(k)}
                className={`${chip} ${baseLayer === k ? chipOn : ""}`}
                title={BASE_LAYERS[k].note}
              >
                {BASE_LAYERS[k].label}
              </button>
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <button
              type="button"
              aria-pressed={heatmap}
              onClick={() => setHeatmap((v) => !v)}
              className={`${chip} ${heatmap ? chipOn : ""}`}
            >
              Settlement density
            </button>
            <button
              type="button"
              aria-pressed={labels}
              onClick={() => setLabels((v) => !v)}
              className={`${chip} ${labels ? chipOn : ""}`}
              title="Boundary geometry is not loaded in this prototype; state labels are shown instead."
            >
              Administrative labels
            </button>
            <button
              type="button"
              aria-pressed={threeD}
              onClick={() => {
                const next = !threeD;
                setThreeD(next);
                // Columns are metres tall; at world zoom they are invisible
                // specks. Turning 3D on has to bring the camera down to where
                // the data actually is, or the control appears to do nothing.
                if (next && points.length > 0) {
                  const lng = points.reduce((n, p) => n + p.lng, 0) / points.length;
                  const lat = points.reduce((n, p) => n + p.lat, 0) / points.length;
                  setFlyTo({ lng, lat, zoom: 5.2 });
                }
              }}
              className={`${chip} ${threeD ? chipOn : ""}`}
              title="Tilt the camera and extrude each settlement into a column whose height is how complete its profile is"
            >
              3D columns
            </button>
            <button
              type="button"
              aria-pressed={globe}
              onClick={() => setGlobe((v) => !v)}
              className={`${chip} ${globe ? chipOn : ""}`}
              title="Globe projection. Mercator distorts exactly the latitudes this archive covers."
            >
              {globe ? "Globe" : "Flat"}
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={`${chip} lg:hidden`}
            >
              Filters
            </button>
          </div>
          {threeD ? (
            <p className="mt-1 max-w-64 text-[10px] text-muted">
              Column height is <strong className="text-ink">profile completeness</strong>, not
              population — population is undocumented almost everywhere, and extruding it would
              build a skyline out of missing data. Drag with right button to rotate.
            </p>
          ) : null}
          {baseLayer === "archival" ? (
            <p className="mt-1 max-w-56 text-[10px] text-muted">{BASE_LAYERS.archival.note}</p>
          ) : null}
        </div>

        {/* Result count + accessible alternative */}
        <div className="absolute right-3 top-3 z-10 hidden rounded-lg border border-line-strong bg-surface-1/95 px-3 py-2 text-right backdrop-blur sm:block">
          <p className="tabular text-sm text-ink">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>
          <Link href="/directory" className="text-[11px] text-peacock underline">
            Open the text directory
          </Link>
        </div>
      </div>

      {/* Desktop result list */}
      <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-line bg-surface-1 lg:block">
        <ResultList results={results} onSelect={(t) => { setSelected(t); }} onFly={setFlyTo} selected={selected} />
      </aside>

      {/* Mobile bottom sheet */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 lg:hidden">
        <div className="pointer-events-auto max-h-[55vh] overflow-y-auto rounded-t-xl border-t border-line-strong bg-surface-1 shadow-2xl">
          {selectedTanda ? (
            <div className="p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="font-display text-lg text-ink-strong">
                  {selectedTanda.primaryName}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className={chip}
                  aria-label="Close settlement details"
                >
                  Close
                </button>
              </div>
              <TandaSummary id={selectedTanda.id} />
            </div>
          ) : (
            <ResultList
              results={results}
              onSelect={setSelected}
              onFly={setFlyTo}
              selected={selected}
              compact
            />
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface-0 lg:hidden">
          <div className="flex items-center justify-between border-b border-line p-4">
            <h2 className="font-display text-lg text-ink-strong">Filters</h2>
            <button type="button" onClick={() => setFiltersOpen(false)} className={chip}>
              Done
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{filterPanel}</div>
        </div>
      ) : null}
    </div>
  );
}

function ResultList({
  results,
  onSelect,
  onFly,
  selected,
  compact = false,
}: {
  results: ReturnType<typeof listTandas>;
  onSelect: (id: string) => void;
  onFly: (v: { lng: number; lat: number; zoom?: number }) => void;
  selected: string | null;
  compact?: boolean;
}) {
  if (results.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted">
          No settlements match these filters. In an archive at this stage that is usually a fact
          about the archive rather than about the world.
        </p>
        <Link href="/contribute" className="mt-2 inline-block text-sm text-peacock underline">
          Document a Tanda →
        </Link>
      </div>
    );
  }

  return (
    <ul className={compact ? "" : "divide-y divide-line"}>
      {!compact ? (
        <li className="border-b border-line px-4 py-2 text-[11px] uppercase tracking-wider text-terracotta">
          {results.length} settlements
        </li>
      ) : null}
      {results.map((t) => {
        const pop = latestPopulation(t);
        const founded = foundingEvent(t);
        const clans = majorClans(t);
        return (
          <li key={t.id} className={compact ? "border-b border-line" : ""}>
            <button
              type="button"
              onClick={() => {
                onSelect(t.id);
                if (t.coordinates) onFly({ lng: t.coordinates[0], lat: t.coordinates[1], zoom: 9 });
              }}
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-surface-2 ${
                selected === t.id ? "bg-surface-2" : ""
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-display text-base text-ink-strong">{t.primaryName}</span>
                {t.isDemo ? (
                  <span className="rounded-sm bg-v-disputed px-1 text-[10px] font-bold text-white">
                    DEMO
                  </span>
                ) : null}
              </div>
              {t.names.filter((n) => !n.isPrimary).length > 0 ? (
                <p className="truncate text-[11px] text-muted">
                  also:{" "}
                  {t.names
                    .filter((n) => !n.isPrimary)
                    .map((n) => n.name)
                    .join(" · ")}
                </p>
              ) : null}
              <p className="mt-0.5 text-xs text-muted">
                {STATES.find((s) => s.id === t.stateId)?.districts.find((d) => d.id === t.districtId)
                  ?.name ?? ""}
                , {STATES.find((s) => s.id === t.stateId)?.name}
              </p>
              <dl className="mt-1.5 space-y-0.5 text-[11px] text-muted">
                <div>
                  <span className="text-ink">Population: </span>
                  {pop?.totalPopulation
                    ? `${formatNumber(pop.totalPopulation)} (${pop.asOfYear}${
                        pop.isCommunityEstimate ? ", community estimate" : ""
                      })`
                    : "Not yet documented"}
                </div>
                <div>
                  <span className="text-ink">Established: </span>
                  {founded ? formatPeriod(founded.period) : "Not yet documented"}
                </div>
                <div>
                  <span className="text-ink">Major clans: </span>
                  {clans.length ? clans.join(", ") : "Not yet documented"}
                </div>
              </dl>
              <div className="mt-2 flex items-center justify-between gap-2">
                <VerificationChip status={t.verification} size="sm" />
                <Link
                  href={`/tanda/${t.id}`}
                  className="text-[11px] text-peacock underline underline-offset-2"
                >
                  Explore Tanda →
                </Link>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function TandaSummary({ id }: { id: string }) {
  const t = listTandas().find((x) => x.id === id);
  if (!t) return null;
  const pop = latestPopulation(t);
  const founded = foundingEvent(t);
  return (
    <div className="space-y-2 text-sm">
      <VerificationChip status={t.verification} size="sm" />
      <dl className="space-y-1 text-xs text-muted">
        <div>
          <span className="text-ink">Population: </span>
          {pop?.totalPopulation
            ? `${formatNumber(pop.totalPopulation)} (${pop.asOfYear})`
            : "Not yet documented"}
        </div>
        <div>
          <span className="text-ink">Established: </span>
          {founded ? formatPeriod(founded.period) : "Not yet documented"}
        </div>
        <div>
          <span className="text-ink">Major clans: </span>
          {majorClans(t).join(", ") || "Not yet documented"}
        </div>
      </dl>
      <Link
        href={`/tanda/${t.id}`}
        className="inline-block rounded-sm bg-terracotta px-3 py-1.5 text-xs font-semibold text-terracotta-ink"
      >
        Explore Tanda
      </Link>
    </div>
  );
}
