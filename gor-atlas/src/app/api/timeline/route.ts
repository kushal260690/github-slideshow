import { ok } from "@/lib/api";
import { timeline } from "@/lib/repository";

export function GET() {
  return ok(timeline());
}
