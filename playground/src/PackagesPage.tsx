import { iconCategories, iconManifest } from "@sonojs/icons";

const PACKAGES = [
  {
    name: "@sonojs/icons",
    blurb:
      "Copy icon files into your project with npx — no SonoJS runtime dependency.",
    importExample: `npx @sonojs/icons add my-icon`,
  },
];

export function PackagesPage() {
  const bySource = new Map<string, number>();
  for (const e of iconManifest) {
    const s = e.source ?? "manual";
    bySource.set(s, (bySource.get(s) ?? 0) + 1);
  }

  const sources = [...bySource.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <article className="doc-page" dir="ltr" lang="en">
      <header className="doc-hero">
        <p className="doc-eyebrow">Packages</p>
        <h1>What ships in this repo</h1>
        <p className="doc-lead">
          {iconManifest.length} icons across {iconCategories.length} categories.
          The npm release is the CLI; icons are copied into your project with{" "}
          <code>npx</code>.
        </p>
      </header>

      <section className="doc-section">
        <h2>Import paths</h2>
        <div className="doc-cards">
          {PACKAGES.map((p) => (
            <div key={p.name} className="doc-card">
              <h3>
                <code>{p.name}</code>
              </h3>
              <p>{p.blurb}</p>
              <pre>
                <code>{p.importExample}</code>
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section className="doc-section">
        <h2>Artwork sources</h2>
        {sources.length === 0 ? (
          <p>
            No icons yet. Add SVG sources under <code>assets/</code>, run{" "}
            <code>npm run generate</code>, then refresh this page.
          </p>
        ) : (
          <div className="doc-table-wrap">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(([id, count]) => (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="doc-section">
        <h2>Publish status</h2>
        <p>
          Version <code>0.1.0</code> publishes the CLI as{" "}
          <code>@sonojs/icons</code>. Brand registry lives under{" "}
          <code>registry/</code>.
        </p>
      </section>
    </article>
  );
}
