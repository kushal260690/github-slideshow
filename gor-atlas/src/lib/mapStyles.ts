import type { StyleSpecification } from "maplibre-gl";

/**
 * Base map styles.
 *
 * Deliberately built from open raster tile sources rather than a proprietary
 * vector map service. The brief's requirement — that the core experience must
 * not depend on an expensive proprietary map — is also a sustainability
 * requirement for a community archive that may never have a commercial budget.
 * Everything here is replaceable by changing one object.
 *
 * The "archival" style is a CSS tint applied to the standard basemap. It is a
 * visual treatment and NOT a historical map source, and the UI says so where
 * it is offered — an aged-looking basemap that a reader mistakes for a
 * historical survey would be a quiet form of fabrication.
 */

export type BaseLayerKey = "standard" | "satellite" | "terrain" | "archival";

interface BaseLayer {
  key: BaseLayerKey;
  label: string;
  note?: string;
  tiles: string[];
  attribution: string;
  maxzoom: number;
}

export const BASE_LAYERS: Record<BaseLayerKey, BaseLayer> = {
  standard: {
    key: "standard",
    label: "Standard",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxzoom: 19,
  },
  satellite: {
    key: "satellite",
    label: "Satellite",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "Imagery © Esri, Maxar, Earthstar Geographics and the GIS User Community",
    maxzoom: 18,
  },
  terrain: {
    key: "terrain",
    label: "Terrain",
    tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png"],
    attribution:
      '© <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA), © OpenStreetMap contributors',
    maxzoom: 16,
  },
  archival: {
    key: "archival",
    label: "Archival tint",
    note: "A styling treatment applied to the standard base map. It is not a historical map source and shows present-day geography.",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxzoom: 19,
  },
};

export function baseStyle(key: BaseLayerKey, globe = true): StyleSpecification {
  const layer = BASE_LAYERS[key];
  return {
    version: 8,
    /*
     * Globe, not Mercator, as the default projection.
     *
     * This is an editorial decision before it is a visual one. Mercator
     * inflates the high latitudes and flattens the equatorial band, which for
     * an atlas of a South Asian community and its diaspora across the Gulf,
     * Africa and south-east Asia distorts precisely the regions the archive is
     * about. A globe also makes the one honest claim a world map should make
     * at low zoom: these are distances people travelled, not a flat chart.
     *
     * Falls back to Mercator when the reader asks for reduced motion or
     * low-data mode, where spinning a sphere is the wrong thing to do.
     */
    projection: { type: globe ? "globe" : "mercator" },
    // MapLibre cannot render ANY text in a symbol layer without a glyph
    // source — cluster counts and administrative labels fail silently without
    // this line. The endpoint is MapLibre's own open font server; it is the
    // only external font dependency and is swappable for a self-hosted set of
    // .pbf ranges, which is what a production deployment should do so the map
    // keeps working on a restricted network.
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      base: {
        type: "raster",
        tiles: layer.tiles,
        tileSize: 256,
        maxzoom: layer.maxzoom,
        attribution: layer.attribution,
      },
    },
    // Atmosphere around the globe's limb. Purely spatial cueing — it tells the
    // eye that the surface curves away, which is the whole point of the globe.
    sky: {
      "sky-color": "#0b1020",
      "horizon-color": "#1b1f3b",
      "fog-color": "#0d0f18",
      "fog-ground-blend": 0.6,
      "horizon-fog-blend": 0.5,
      "sky-horizon-blend": 0.8,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.9, 5, 0.4, 7, 0],
    },
    layers: [
      {
        id: "background",
        type: "background",
        // Visible if tiles fail to load, so markers still read against a
        // deliberate ground rather than white. On the globe this doubles as
        // the planet's body colour.
        paint: { "background-color": "#12151f" },
      },
      {
        id: "base",
        type: "raster",
        source: "base",
        paint: {
          "raster-opacity": key === "satellite" ? 1 : 0.86,
          "raster-saturation": key === "satellite" ? 0 : -0.35,
          "raster-contrast": key === "satellite" ? 0 : -0.05,
        },
      },
    ],
  };
}

/** Marker colours, matching src/lib/format.ts markerState and the legend. */
export const MARKER_COLORS: Record<string, string> = {
  verified: "#3ab36a",
  partial: "#d99a1f",
  basic: "#9096a5",
  historical: "#5a95e0",
  diaspora: "#a077d6",
  disputed: "#e05a42",
  /** Not a settlement state — a region open for documentation. */
  region: "#2fb6bf",
};

export const MARKER_LEGEND = [
  { key: "verified", label: "Verified Tanda profile", color: MARKER_COLORS.verified },
  { key: "partial", label: "Partially verified", color: MARKER_COLORS.partial },
  { key: "basic", label: "Basic location only", color: MARKER_COLORS.basic },
  {
    key: "historical",
    label: "Historical or relocated settlement",
    color: MARKER_COLORS.historical,
  },
  { key: "diaspora", label: "Diaspora settlement", color: MARKER_COLORS.diaspora },
  { key: "disputed", label: "Disputed data — requires review", color: MARKER_COLORS.disputed },
];
