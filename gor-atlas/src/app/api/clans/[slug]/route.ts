import { fail, ok } from "@/lib/api";
import { clanRelationships, getClan, tandasForClan } from "@/lib/repository";

export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const clan = getClan(slug);
  if (!clan) return fail("not_found", `No clan with slug ${slug}`, 404);
  return ok({
    clan,
    relationships: clanRelationships(clan.id),
    settlements: tandasForClan(clan.id).map(({ tanda, band }) => ({
      id: tanda.id,
      name: tanda.primaryName,
      band,
      isDemo: tanda.isDemo,
    })),
  });
}
