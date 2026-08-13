import { ok } from "@/lib/api";
import { listSurnames } from "@/lib/repository";

export function GET() {
  return ok(listSurnames(), {
    note: "Surname-to-clan associations are many-to-many, region-qualified and strength-graded. Nothing in this response supports inferring an individual's clan, caste or family from a name.",
  });
}
