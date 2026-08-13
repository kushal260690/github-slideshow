import type { Metadata } from "next";
import { MapExplorer } from "@/components/MapExplorer";

export const metadata: Metadata = {
  title: "Explore Map",
  description:
    "Interactive map of documented Gor/Banjara Tandas. Filter by state, district, clan, settlement period, population and verification status.",
};

export default function MapPage() {
  return (
    <>
      <h1 className="sr-only">Explore the Tanda map</h1>
      <MapExplorer />
    </>
  );
}
