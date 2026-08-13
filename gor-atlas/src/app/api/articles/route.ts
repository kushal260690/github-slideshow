import { ok } from "@/lib/api";
import { listArticles } from "@/lib/repository";

export function GET() {
  return ok(
    listArticles().map(({ body, ...rest }) => ({ ...rest, bodyLength: body.length })),
    { note: "Index only. Fetch an individual article for its body." },
  );
}
