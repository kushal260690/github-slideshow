import { ok } from "@/lib/api";
import { listRoutes } from "@/lib/repository";

export function GET() {
  return ok(listRoutes(), {
    note: "Each route carries several evidence entries with different interpretation labels. Do not collapse them into a single confidence value.",
  });
}
