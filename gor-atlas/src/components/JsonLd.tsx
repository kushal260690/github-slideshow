/**
 * Structured data for search engines. Tanda profiles emit schema.org Place,
 * articles emit Article. Nothing marked demo emits structured data at all —
 * publishing a fabricated settlement as machine-readable Place data would put
 * it into knowledge graphs, which is precisely the kind of laundering of
 * invented information this project exists to avoid.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
