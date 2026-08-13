import { ok, parseTandaFilter } from "@/lib/api";
import { listTandas } from "@/lib/repository";

export function GET(request: Request) {
  const url = new URL(request.url);
  const filter = parseTandaFilter(url);
  const results = listTandas(filter);
  return ok(results, { count: results.length, filter });
}
