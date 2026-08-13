"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { STATES, WORLD_VIEW } from "@/data/geography";
import { MARKER_COLORS, baseStyle, type BaseLayerKey } from "@/lib/mapStyles";

export interface MapPoint {
  id: string;
  name: string;
  lng: number;
  lat: number;
  markerKey: string;
  isDemo: boolean;
  /** 0-100. Drives the height of the 3D column. */
  completeness?: number;
}

export interface MapLine {
  id: string;
  name: string;
  coordinates: [number, number][];
  color: string;
  /** 0–1; used to reveal a route progressively along the timeline. */
  progress?: number;
}

interface MapViewProps {
  points?: MapPoint[];
  lines?: MapLine[];
  baseLayer?: BaseLayerKey;
  showHeatmap?: boolean;
  showLabels?: boolean;
  cluster?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  flyTo?: { lng: number; lat: number; zoom?: number } | null;
  className?: string;
  interactive?: boolean;
  initialZoom?: number;
  /** Globe projection. Falls back to Mercator when false. */
  globe?: boolean;
  /** Extruded columns + camera pitch. */
  threeD?: boolean;
  /** Slow idle rotation, for the world view. Never runs under reduced motion. */
  autoSpin?: boolean;
  center?: [number, number];
}

/**
 * MapLibre wrapper.
 *
 * maplibre-gl is imported dynamically inside an effect rather than at module
 * scope: it touches `window` on load, and a client component is still
 * server-rendered for the initial HTML.
 */
export function MapView({
  points = [],
  lines = [],
  baseLayer = "standard",
  showHeatmap = false,
  showLabels = false,
  cluster = true,
  selectedId = null,
  onSelect,
  flyTo = null,
  className = "",
  interactive = true,
  initialZoom,
  globe = true,
  threeD = false,
  autoSpin = false,
  center,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  onSelectRef.current = onSelect;

  /* ---------------------------------------------------------------- */
  /* Create the map once                                              */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    (async () => {
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled || !containerRef.current) return;

        map = new maplibregl.Map({
          container: containerRef.current,
          style: baseStyle(baseLayer, globe),
          center: center ?? WORLD_VIEW.center,
          zoom: initialZoom ?? WORLD_VIEW.zoom,
          attributionControl: { compact: true },
          interactive,
          // Pitch and rotation are enabled only in 3D. In 2D the map stays
          // north-up and flat, because a tilted map you cannot un-tilt is a
          // usability trap on a small screen.
          maxPitch: threeD ? 70 : 0,
          pitch: threeD ? 50 : 0,
          dragRotate: threeD,
          renderWorldCopies: false,
        });

        if (interactive) {
          map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
          map.addControl(
            new maplibregl.ScaleControl({ maxWidth: 90, unit: "metric" }),
            "bottom-left",
          );
        }

        map.on("load", () => {
          if (cancelled || !map) return;
          installLayers(map);
          setReady(true);
        });

        map.on("error", () => setFailed(true));
        mapRef.current = map;
      } catch {
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // Intentionally created once; style and data changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /* Layer installation                                               */
  /* ---------------------------------------------------------------- */
  function installLayers(map: MapLibreMap) {
    map.addSource("tandas", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster,
      clusterRadius: 45,
      clusterMaxZoom: 9,
    });

    map.addSource("routes", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // Columns are a SEPARATE source from the clustered points, because they
    // must never cluster: a merged column would express a height nobody
    // claimed.
    map.addSource("columns", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    map.addSource("state-labels", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: STATES.map((s) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: s.centroid },
          properties: { name: s.name },
        })),
      },
    });

    // Settlement density. Weighted equally per settlement: weighting by
    // population would misrepresent density where population is undocumented,
    // which is most places.
    map.addLayer({
      id: "tanda-heat",
      type: "heatmap",
      source: "tandas",
      layout: { visibility: "none" },
      paint: {
        "heatmap-weight": 1,
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 1, 10, 3],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 18, 10, 40],
        "heatmap-opacity": 0.75,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(0,0,0,0)",
          0.2, "rgba(47,182,191,0.35)",
          0.45, "rgba(201,162,39,0.55)",
          0.7, "rgba(212,103,74,0.75)",
          1, "rgba(224,90,66,0.9)",
        ],
      },
    });

    map.addLayer({
      id: "routes-line",
      type: "line",
      source: "routes",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ["get", "color"],
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.5, 8, 4],
        "line-opacity": 0.85,
        "line-dasharray": [2, 1.5],
      },
    });

    /*
     * Extruded "evidence columns".
     *
     * Height is PROFILE COMPLETENESS, not population. That choice is the whole
     * argument for having 3D here at all: population is undocumented for
     * almost every settlement, so extruding it would build a skyline out of
     * missing data. Completeness is a fact the archive actually knows about
     * itself, so the tallest column always means "best documented" and a plain
     * of short stubs is an honest picture of an archive at the start.
     */
    map.addLayer({
      id: "tanda-columns",
      type: "fill-extrusion",
      source: "columns",
      layout: { visibility: "none" },
      paint: {
        "fill-extrusion-color": [
          "match",
          ["get", "markerKey"],
          "verified", MARKER_COLORS.verified,
          "partial", MARKER_COLORS.partial,
          "historical", MARKER_COLORS.historical,
          "diaspora", MARKER_COLORS.diaspora,
          "disputed", MARKER_COLORS.disputed,
          MARKER_COLORS.basic,
        ],
        "fill-extrusion-opacity": 0.85,
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": 0,
        "fill-extrusion-vertical-gradient": true,
      },
    });

    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "tandas",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "rgba(27,31,59,0.9)",
        "circle-stroke-color": "#2fb6bf",
        "circle-stroke-width": 2,
        "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 30, 200, 38],
      },
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "tandas",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
      paint: { "text-color": "#f2ece1" },
    });

    // Halo so a marker stays visible against satellite imagery.
    map.addLayer({
      id: "tanda-halo",
      type: "circle",
      source: "tandas",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 8, 12, 16],
        "circle-color": "rgba(13,15,24,0.55)",
        "circle-blur": 0.4,
      },
    });

    map.addLayer({
      id: "tanda-points",
      type: "circle",
      source: "tandas",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 5, 12, 10],
        "circle-color": [
          "match",
          ["get", "markerKey"],
          "verified", MARKER_COLORS.verified,
          "partial", MARKER_COLORS.partial,
          "historical", MARKER_COLORS.historical,
          "diaspora", MARKER_COLORS.diaspora,
          "disputed", "rgba(0,0,0,0)",
          // Regions open for documentation are hollow rings, never filled
          // dots: they are not settlements and must not read as any.
          "region", "rgba(0,0,0,0)",
          MARKER_COLORS.basic,
        ],
        // Disputed markers are drawn as a red outline with a hollow centre, so
        // the state is legible without relying on colour alone.
        "circle-stroke-width": [
          "case",
          ["==", ["get", "markerKey"], "disputed"], 3,
          ["==", ["get", "markerKey"], "region"], 1.5,
          1.5,
        ],
        "circle-stroke-color": [
          "case",
          ["==", ["get", "markerKey"], "disputed"], MARKER_COLORS.disputed,
          ["==", ["get", "markerKey"], "region"], MARKER_COLORS.region,
          "rgba(13,15,24,0.85)",
        ],
      },
    });

    map.addLayer({
      id: "tanda-selected",
      type: "circle",
      source: "tandas",
      filter: ["==", ["get", "id"], "__none__"],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 11, 12, 20],
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#f2ece1",
      },
    });

    map.addLayer({
      id: "state-label",
      type: "symbol",
      source: "state-labels",
      layout: {
        visibility: "none",
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": 11,
        "text-letter-spacing": 0.12,
        "text-transform": "uppercase",
      },
      paint: {
        "text-color": "#f2ece1",
        "text-halo-color": "rgba(13,15,24,0.85)",
        "text-halo-width": 1.4,
      },
    });

    map.on("click", "tanda-points", (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) onSelectRef.current?.(id);
    });

    map.on("click", "clusters", async (e) => {
      const feature = e.features?.[0];
      const clusterId = feature?.properties?.cluster_id;
      if (clusterId === undefined) return;
      const src = map.getSource("tandas") as GeoJSONSource;
      const zoom = await src.getClusterExpansionZoom(clusterId as number);
      map.easeTo({
        center: (feature!.geometry as GeoJSON.Point).coordinates as [number, number],
        zoom,
      });
    });

    for (const layer of ["tanda-points", "clusters"]) {
      map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
    }
  }

  /* ---------------------------------------------------------------- */
  /* Data updates                                                     */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // Columns need polygons, so each point becomes a small hexagon. Radius is
    // corrected for latitude so a column near the equator and one in the Gulf
    // read at the same footprint rather than smearing east-west.
    const hexagon = (lng: number, lat: number, metres: number) => {
      const dLat = metres / 111_320;
      const dLng = dLat / Math.max(0.15, Math.cos((lat * Math.PI) / 180));
      const ring: [number, number][] = [];
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ring.push([lng + Math.cos(a) * dLng, lat + Math.sin(a) * dLat]);
      }
      return [ring];
    };

    const columns = map.getSource("columns") as GeoJSONSource | undefined;
    columns?.setData({
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: hexagon(p.lng, p.lat, 16000) },
        properties: {
          id: p.id,
          name: p.name,
          markerKey: p.markerKey,
          // A record with nothing documented still gets a visible stub, so it
          // reads as "present but empty" rather than vanishing from the scene.
          height: 12_000 + (p.completeness ?? 0) * 1_800,
        },
      })),
    });

    const src = map.getSource("tandas") as GeoJSONSource | undefined;
    src?.setData({
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: { id: p.id, name: p.name, markerKey: p.markerKey, isDemo: p.isDemo },
      })),
    });
  }, [points, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource("routes") as GeoJSONSource | undefined;
    src?.setData({
      type: "FeatureCollection",
      features: lines.map((l) => {
        const p = l.progress ?? 1;
        const keep = Math.max(2, Math.ceil(l.coordinates.length * p));
        return {
          type: "Feature",
          geometry: { type: "LineString", coordinates: l.coordinates.slice(0, keep) },
          properties: { id: l.id, name: l.name, color: l.color },
        };
      }),
    });
  }, [lines, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty("tanda-heat", "visibility", showHeatmap ? "visible" : "none");
    for (const id of ["tanda-points", "tanda-halo", "clusters", "cluster-count"]) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", showHeatmap ? "none" : "visible");
      }
    }
  }, [showHeatmap, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty("state-label", "visibility", showLabels ? "visible" : "none");
  }, [showLabels, ready]);

  // 3D: show the columns, tilt the camera, and hand back rotation control.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (map.getLayer("tanda-columns")) {
      map.setLayoutProperty("tanda-columns", "visibility", threeD ? "visible" : "none");
    }
    map.setMaxPitch(threeD ? 70 : 0);
    if (threeD) map.dragRotate.enable();
    else map.dragRotate.disable();
    map.easeTo({ pitch: threeD ? 50 : 0, duration: reduced ? 0 : 700 });
  }, [threeD, ready]);

  /*
   * Idle rotation for the world view.
   *
   * Stops permanently on any user interaction rather than resuming: a globe
   * that drifts back under the reader's cursor is the single most irritating
   * thing a map like this can do. Never starts under reduced motion or when
   * the tab is hidden.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !autoSpin) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let stopped = false;
    let last = performance.now();

    const stop = () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
    for (const evt of ["mousedown", "touchstart", "wheel", "keydown"] as const) {
      map.getCanvas().addEventListener(evt, stop, { once: true, passive: true });
    }

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!stopped && !document.hidden && map.getZoom() < 4) {
        map.setCenter([map.getCenter().lng + dt * 0.0022, map.getCenter().lat]);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoSpin, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setFilter("tanda-selected", ["==", ["get", "id"], selectedId ?? "__none__"]);
  }, [selectedId, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !flyTo) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    map.easeTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 9,
      duration: reduced ? 0 : 900,
    });
  }, [flyTo, ready]);

  // Style swap preserves data by reinstalling layers after the new style loads.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(baseStyle(baseLayer, globe));
    map.once("styledata", () => {
      if (!map.getSource("tandas")) installLayers(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseLayer, globe]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className={`h-full w-full ${baseLayer === "archival" ? "map-archival" : ""}`}
        role="application"
        aria-label="Interactive map of documented Tandas. A keyboard-accessible text directory of the same records is available."
      />
      {failed ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-14 mx-auto max-w-md rounded-lg border border-line-strong bg-surface-1 p-3 text-center text-xs text-muted">
          Base map tiles could not be loaded. Markers and filters still work, and the{" "}
          <span className="text-peacock">text directory</span> has the same records.
        </div>
      ) : null}
    </div>
  );
}
