import { ok, parseTandaFilter } from "@/lib/api";
import { tandasGeoJSON } from "@/lib/repository";

/** Map payload. `?fields=minimal` serves the low-bandwidth property set. */
export function GET(request: Request) {
  const url = new URL(request.url);
  const minimal = url.searchParams.get("fields") === "minimal";
  return ok(tandasGeoJSON(parseTandaFilter(url), minimal));
}
