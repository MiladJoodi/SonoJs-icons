import { useState, type ReactNode } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CodeLang = "bash" | "tsx";

/** Lightweight VS Code Dark+–style token coloring. */
function highlightCode(code: string, lang: CodeLang): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  const push = (text: string, cls?: string) => {
    if (!text) return;
    out.push(
      cls ? (
        <span key={key++} className={cls}>
          {text}
        </span>
      ) : (
        <span key={key++}>{text}</span>
      ),
    );
  };

  if (lang === "bash") {
    const re =
      /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:npx|npm|pnpm|yarn|add|install)\b)|(--[\w-]+)|(@[\w.-]+\/[\w.-]+)|([\w][\w./@-]*)/g;
    let m: RegExpExecArray | null;
    let last = 0;
    while ((m = re.exec(code))) {
      if (m.index > last) push(code.slice(last, m.index));
      if (m[1]) push(m[1], "tok-comment");
      else if (m[2]) push(m[2], "tok-string");
      else if (m[3]) push(m[3], "tok-keyword");
      else if (m[4]) push(m[4], "tok-flag");
      else if (m[5]) push(m[5], "tok-string");
      else if (m[6]) push(m[6], "tok-attr");
      last = m.index + m[0].length;
    }
    if (last < code.length) push(code.slice(last));
    return out;
  }

  // tsx
  const re =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*')|(\b(?:import|from|export|function|return|const|let|var|type|interface)\b)|(\b(?:size|title|name|className)\b(?=\s*=))|(<\/?[A-Za-z][\w.]*)|(\{|\}|\(|\)|=|>|;|,)|(\b\d+\b)|(\S+)/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) push(code.slice(last, m.index));
    if (m[1]) push(m[1], "tok-comment");
    else if (m[2]) push(m[2], "tok-string");
    else if (m[3]) push(m[3], "tok-keyword");
    else if (m[4]) push(m[4], "tok-attr");
    else if (m[5]) push(m[5], "tok-tag");
    else if (m[6]) push(m[6], "tok-punct");
    else if (m[7]) push(m[7], "tok-number");
    else if (m[8]) push(m[8], "tok-plain");
    last = m.index + m[0].length;
  }
  if (last < code.length) push(code.slice(last));
  return out;
}

function CodeBlock({
  code,
  label,
  lang,
}: {
  code: string;
  label: string;
  lang: CodeLang;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="doc-code" dir="ltr" lang="en">
      <div className="doc-code-bar">
        <span className="doc-code-label">{label}</span>
        <button
          type="button"
          className="doc-copy"
          aria-label={copied ? "Copied" : "Copy"}
          title={copied ? "Copied" : "Copy"}
          onClick={async () => {
            const ok = await copyText(code);
            if (ok) {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            }
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <pre className="doc-code-pre">
        <code>{highlightCode(code, lang)}</code>
      </pre>
    </div>
  );
}

export function GuidePage() {
  return (
    <article className="doc-page" dir="ltr" lang="en">
      <header className="doc-hero">
        <h1>Using SonoJS Icons</h1>
        <p className="doc-lead">
          Add only the icons you need with the CLI — no full-package install
          required.
        </p>
      </header>

      <section className="doc-section">
        <h2>Install icons with the CLI</h2>
        <p>
          The <code>@sonojs/icons</code> package copies selected icons into your
          project. It does not add a runtime dependency to{" "}
          <code>package.json</code>.
        </p>
        <CodeBlock
          label="bash"
          lang="bash"
          code={`npx @sonojs/icons add my-icon`}
        />
        <p>You can add several icons in one command:</p>
        <CodeBlock
          label="bash"
          lang="bash"
          code={`npx @sonojs/icons add icon-one icon-two`}
        />
        <p>
          Icon files land in <code>src/components/icons</code> or{" "}
          <code>components/icons</code>, and you can edit them like any other
          component.
        </p>
      </section>

      <section className="doc-section">
        <h2>Customizing appearance</h2>
        <p>
          Icons keep their original artwork — brand marks stay colored, stroke
          icons already follow <code>currentColor</code>. Set size, title, and
          CSS classes:
        </p>
        <CodeBlock
          label="tsx"
          lang="tsx"
          code={`<MyIcon
  size={32}
  title="My icon"
  className="brand-icon"
/>`}
        />
        <p className="doc-note">
          <strong>Note:</strong> Copied icons need React and React DOM 18 or 19
          in your project.
        </p>
      </section>
    </article>
  );
}
