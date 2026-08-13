import { ok } from "@/lib/api";
import { clanRelationships, listClans } from "@/lib/repository";

export function GET() {
  return ok(
    { clans: listClans(), relationships: clanRelationships() },
    {
      note: "Relationships are typed associations, not a genealogy. No clan is recorded as ancestor, parent or superior of another.",
    },
  );
}
