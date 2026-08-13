import { ok } from "@/lib/api";
import { publicStats } from "@/lib/repository";

/** Homepage counters. Computed from actual rows; demo rows counted separately. */
export function GET() {
  return ok(publicStats(), {
    note: "Real records only. Demo records are reported under tandasDemo and are excluded from every other count.",
  });
}
