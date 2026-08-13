import { fail, ok } from "@/lib/api";
import { getArticle } from "@/lib/repository";

export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const article = getArticle(slug);
  if (!article) return fail("not_found", `No article with slug ${slug}`, 404);
  return ok(article);
}
