import { ok } from "@/lib/api";
import { stateDirectory } from "@/lib/repository";

export function GET() {
  return ok(stateDirectory(), {
    note: "documented counts exclude demo records. A count of zero is the truthful starting state, not a loading error.",
  });
}
