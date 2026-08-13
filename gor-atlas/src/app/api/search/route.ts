import { fail, ok } from "@/lib/api";
import { search } from "@/lib/repository";

export function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return fail("validation_failed", "Query must be at least 2 characters", 400);
  }
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 50);
  return ok(search(q, limit), { query: q });
}
