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

export function baseStyle(key: BaseLayerKey): StyleSpecification {
  const layer = BASE_LAYERS[key];
  return {
    version: 8,
    // A local glyph-free style: no external font server is contacted, so the
    // map still renders where outbound requests are restricted.
    sources: {
      base: {
        type: "raster",
        tiles: layer.tiles,
        tileSize: 256,
        maxzoom: layer.maxzoom,
        attribution: layer.attribution,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        // Visible if tiles fail to load, so markers still read against a
        // deliberate ground rather than white.
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
