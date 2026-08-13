import { fail, ok } from "@/lib/api";
import { districtDirectory } from "@/lib/repository";

export async function GET(_request: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const result = districtDirectory(code.toUpperCase());
  if (!result) return fail("not_found", `No state with code ${code}`, 404);
  return ok(result);
}
