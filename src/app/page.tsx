import Link from "next/link";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";

const FEATURES = [
  { t: "Real checks, not guesses", d: "Ten deterministic checks run on the page's actual HTML. Every finding quotes the evidence it found." },
  { t: "Explained like a consultant", d: "Gemma 4 turns findings into plain English, drafts better headings and meta descriptions, and plans your top 3 fixes." },
  { t: "You stay in control", d: "Nothing is ever applied to your site. Compare original and suggested text side by side, then copy or accept." },
];

export default function Landing() {
  return (
    <div
      className="light-page min-h-screen"
      style={{ background: "radial-gradient(1200px 500px at 50% -120px, #ccfbf1 0%, rgba(204,251,241,0) 70%), var(--l-bg)" }}
    >
      <SiteNav />

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

        <section className="mb-10 grid grid-cols-3 gap-3 text-center">
          {[
            ["10", "deterministic checks"],
            ["3", "score categories"],
            ["0", "changes made to your site"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-2xl px-2 py-5" style={{ background: "var(--l-card)", border: "1px solid var(--l-line)" }}>
              <div className="text-3xl font-extrabold" style={{ color: "var(--brand)" }}>{n}</div>
              <div className="mt-1 text-xs sm:text-sm" style={{ color: "var(--l-muted)" }}>{l}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-2xl p-6" style={{ background: "var(--l-card)", border: "1px solid var(--l-line)" }}>
              <h2 className="text-lg font-bold">{f.t}</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--l-muted)" }}>{f.d}</p>
            </div>
          ))}
        </section>

        <section className="mt-14">
          <h2 className="text-center text-2xl font-extrabold tracking-tight">Three steps to a clearer website</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["1", "Scan", "Paste a public URL. The server fetches it safely and runs the checks."],
              ["2", "Understand", "See your score, evidence from your HTML and plain-English explanations."],
              ["3", "Improve", "Get AI-drafted titles and descriptions, compare side by side, export your plan."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-2xl p-6" style={{ background: "var(--l-card)", border: "1px solid var(--l-line)" }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white" style={{ background: "var(--brand)" }}>{n}</span>
                <h3 className="mt-3 text-lg font-bold">{t}</h3>
                <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm"><Link href="/how-it-works" className="font-semibold hover:underline" style={{ color: "var(--brand-strong)" }}>Learn how it works →</Link></p>
        </section>

        <section className="mt-14 rounded-2xl p-6 text-sm leading-relaxed" style={{ background: "var(--l-card)", border: "1px solid var(--l-line)", color: "var(--l-muted)" }}>
          <strong style={{ color: "var(--l-fg)" }}>How honesty works here.</strong> AI never creates findings; only the check functions do.
          AI text is always labelled as a suggestion to review. The demo is a fictional site audited by the same engine and is clearly marked DEMO.
          Scans are marked complete, partial, failed or demo, each with a reason.
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
