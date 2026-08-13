import { fail, ok } from "@/lib/api";
import { getTanda } from "@/lib/repository";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const tanda = getTanda(id);
  if (!tanda) return fail("not_found", `No Tanda with id ${id}`, 404);
  return ok(tanda);
}
