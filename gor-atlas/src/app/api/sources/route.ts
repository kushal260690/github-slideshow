import { ok } from "@/lib/api";
import { listSources } from "@/lib/repository";

export function GET() {
  return ok(listSources(), {
    note: "Entries in category demo_placeholder are not real documents. Entries in other categories are reference leads whose bibliographic detail must be confirmed before citation.",
  });
}
