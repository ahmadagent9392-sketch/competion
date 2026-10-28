import type { Metadata } from "next";
import Link from "next/link";
import { Card, LIGHT_BG, PageHero, SiteFooter, SiteNav } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "How it works — SitePilot AI" };

const STEPS = [
  { n: "01", t: "Fetch safely", d: "The server fetches one public page with strict limits: http/https only, 10-second timeout, 2 MB cap, up to 5 redirects, each re-checked." },
  { n: "02", t: "Run real checks", d: "Ten deterministic checks parse the HTML. Each finding quotes the evidence it found, explains why it matters and how to fix it." },
  { n: "03", t: "Score transparently", d: "Three category scores start at 100 and lose fixed points per failing check. The rules are published on the Checks page." },
  { n: "04", t: "Explain with AI", d: "Gemma 4 explains a finding in plain English, drafts a better title, H1 or meta description, and orders the top 3 fixes." },
  { n: "05", t: "You decide", d: "Compare original and suggested text side by side. Copy it, accept it into your report, or retry. Nothing touches your website." },
  { n: "06", t: "Export", d: "Download a JSON report with the scan status, scores, findings, accepted changes and the AI plan. It never contains keys or raw HTML." },
];

const STATUSES = [
  { s: "COMPLETE", c: "#047857", bg: "#d1fae5", d: "The page was fetched and analysed in full." },
  { s: "PARTIAL", c: "#b45309", bg: "#fef3c7", d: "The page exceeded 2 MB; only the first 2 MB was analysed, so scores are provisional." },
  { s: "FAILED", c: "#b91c1c", bg: "#fee2e2", d: "The URL was blocked, unreachable, timed out or was not HTML. The reason is always shown." },
  { s: "DEMO", c: "#0369a1", bg: "#e0f2fe", d: "A fictional built-in site, audited by the same engine and clearly labelled." },
];

export default function HowItWorks() {
  return (
    <div className="light-page min-h-screen" style={LIGHT_BG}>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4">
        <PageHero
          eyebrow="How it works"
          title="From URL to action plan in seconds"
          intro="An engineering-grade audit engine produces the facts. AI only helps you understand and act on them."
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.n}>
              <div className="font-mono text-sm font-bold" style={{ color: "var(--brand)" }}>{s.n}</div>
              <h2 className="mt-2 text-lg font-bold">{s.t}</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--l-muted)" }}>{s.d}</p>
            </Card>
          ))}
        </section>

        <h2 className="mt-14 text-center text-2xl font-extrabold tracking-tight">Every scan says what happened</h2>
        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          {STATUSES.map((s) => (
            <Card key={s.s} className="flex items-start gap-3">
              <span className="badge shrink-0" style={{ background: s.bg, color: s.c }}>{s.s}</span>
              <p className="text-sm" style={{ color: "var(--l-muted)" }}>{s.d}</p>
            </Card>
          ))}
        </section>

        <h2 className="mt-14 text-center text-2xl font-extrabold tracking-tight">Engine vs. AI</h2>
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="font-bold">The audit engine</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--l-muted)" }}>
              <li>Creates every finding and every score</li>
              <li>Deterministic: same HTML, same result</li>
              <li>Quotes evidence from the real page</li>
            </ul>
          </Card>
          <Card>
            <h3 className="font-bold">The AI layer (Gemma 4)</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--l-muted)" }}>
              <li>Explains, rewrites and prioritises only</li>
              <li>Output is validated and shown as plain text</li>
              <li>Always labelled &quot;AI suggestion — review before use&quot;</li>
            </ul>
          </Card>
        </section>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/app" className="btn btn-primary" style={{ padding: "12px 22px", fontSize: 16 }}>Start an audit</Link>
          <Link href="/checks" className="btn btn-light" style={{ padding: "12px 22px", fontSize: 16 }}>See the scoring rules</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
