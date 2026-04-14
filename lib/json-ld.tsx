type JsonLdObject = Record<string, unknown>;

export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Escape `</` so a malicious string field can't break out of the tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
