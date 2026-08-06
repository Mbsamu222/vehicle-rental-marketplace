/**
 * Emits a JSON-LD `<script>`.
 *
 * A server component on purpose: structured data must be present in the initial
 * HTML response, because crawlers that don't execute JavaScript will otherwise
 * never see it.
 *
 * `JSON.stringify` output is escaped so a `<` inside any string value (e.g. in
 * admin-authored blog copy) can't terminate the script element early and inject
 * markup.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
