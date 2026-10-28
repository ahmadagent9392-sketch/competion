import type { Metadata } from "next";
import Link from "next/link";
import { Card, LIGHT_BG, PageHero, SiteFooter, SiteNav } from "@/components/SiteChrome";
import { CHECK_INFO, PENALTIES } from "@/lib/checkInfo";

export const metadata: Metadata = { title: "Checks and scoring — SitePilot AI" };

const SEV_STYLE = {
  critical: { bg: "#fee2e2", fg: "#b91c1c", icon: "⛔" },
  warning: { bg: "#fef3c7", fg: "#b45309", icon: "⚠" },
  info: { bg: "#e0f2fe", fg: "#0369a1", icon: "ℹ" },
} as const;
const CAT_LABEL = { seo: "SEO basics", content: "Content structure", accessibility: "Accessibility" } as const;

export default function ChecksPage() {
  return (
    <div className="light-page min-h-screen" style={LIGHT_BG}>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4">
        <PageHero
          eyebrow="Transparent rules"
          title="Every check, every point"
          intro="These are the only rules that produce findings. Each one is a pure function run on the page's HTML; AI never adds or removes a finding."
        />

        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead style={{ background: "var(--l-line)", color: "var(--l-muted)" }}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Check</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Severity</th>
                  <th className="px-4 py-3 font-semibold">Fails when…</th>
                </tr>
              </thead>
              <tbody>
                {CHECK_INFO.map((c) => {
                  const s = SEV_STYLE[c.severity];
                  return (
                    <tr key={c.id} style={{ borderTop: "1px solid var(--l-line)" }}>
                      <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                      <td className="px-4 py-3">{CAT_LABEL[c.category]}</td>
                      <td className="px-4 py-3">
                        <span className="badge" style={{ background: s.bg, color: s.fg }}>{s.icon} {c.severity} −{PENALTIES[c.severity]}</span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--l-muted)" }}>{c.rule}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <Card>
            <h2 className="text-lg font-bold">1 · Start at 100</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--l-muted)" }}>SEO basics, content structure and accessibility each start at 100.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">2 · Subtract once</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--l-muted)" }}>Each failing check subtracts once from its category: critical −20, warning −10, info −3. Never below 0.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">3 · Average</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--l-muted)" }}>The overall score is the rounded mean of the three. Partial scans are marked provisional; failed scans get no score.</p>
          </Card>
        </section>

        <Card className="mt-6 text-sm">
          <strong>What scores do not mean.</strong>{" "}
          <span style={{ color: "var(--l-muted)" }}>They reflect these ten checks only. They do not predict search rankings, traffic or conversions.</span>
        </Card>

        <div className="mt-10 text-center">
          <Link href="/app?demo=1" className="btn btn-primary" style={{ padding: "12px 22px", fontSize: 16 }}>See them run on the demo site</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
