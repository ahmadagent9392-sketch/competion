import Link from "next/link";

const FEATURES = [
  { t: "Real checks, not guesses", d: "Ten deterministic checks run on the page's actual HTML. Every finding quotes the evidence it found." },
  { t: "Explained like a consultant", d: "Gemma 4 turns findings into plain English, drafts better headings and meta descriptions, and plans your top 3 fixes." },
  { t: "You stay in control", d: "Nothing is ever applied to your site. Compare original and suggested text side by side, then copy or accept." },
];

export default function Landing() {
  return (
    <div className="light-page min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="text-lg font-extrabold tracking-tight">
          <span style={{ color: "var(--brand)" }}>◆</span> SitePilot AI
        </span>
        <Link href="/app" className="btn btn-light">Open workspace</Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20">
        <section className="py-14 text-center sm:py-24">
          <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>Website audit workspace</span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Audit like an engineer.<br />Explain like a consultant.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg" style={{ color: "var(--l-muted)" }}>
            Paste a public URL and get real findings on SEO, content structure and accessibility, with evidence from the HTML, why it matters and how to fix it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/app" className="btn btn-primary" style={{ padding: "12px 22px", fontSize: 16 }}>Start an audit</Link>
            <Link href="/app?demo=1" className="btn btn-light" style={{ padding: "12px 22px", fontSize: 16 }}>Try the demo site</Link>
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--l-muted)" }}>
            Scores reflect these checks only. They do not predict search rankings.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-2xl p-6" style={{ background: "var(--l-card)", border: "1px solid var(--l-line)" }}>
              <h2 className="text-lg font-bold">{f.t}</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--l-muted)" }}>{f.d}</p>
            </div>
          ))}
        </section>

        <section className="mt-14 rounded-2xl p-6 text-sm leading-relaxed" style={{ background: "var(--l-card)", border: "1px solid var(--l-line)", color: "var(--l-muted)" }}>
          <strong style={{ color: "var(--l-fg)" }}>How honesty works here.</strong> AI never creates findings; only the check functions do.
          AI text is always labelled as a suggestion to review. The demo is a fictional site audited by the same engine and is clearly marked DEMO.
          Scans are marked complete, partial, failed or demo, each with a reason.
        </section>
      </main>
    </div>
  );
}
