import type { Metadata } from "next";
import Link from "next/link";
import { Card, LIGHT_BG, PageHero, SiteFooter, SiteNav } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Security — SitePilot AI" };

const SECTIONS = [
  {
    t: "Safe fetching (SSRF protection)",
    items: [
      "Only http and https on ports 80, 443, 8080 and 8443; no credentials in URLs.",
      "Blocks localhost, .local, .internal and single-label hostnames.",
      "Blocks private, loopback, link-local, CGNAT, multicast and reserved IPv4/IPv6 ranges, including IPv4-mapped IPv6.",
      "DNS is checked at connect time, so a public name that resolves to a private address is refused.",
      "Redirects are followed manually (max 5) and every hop is re-validated.",
      "10-second timeout, 2 MB size cap, HTML content types only.",
    ],
  },
  {
    t: "AI safety",
    items: [
      "Page text is sent to the model inside <page_data> tags and declared untrusted data.",
      "The model is asked for one JSON object; the answer is parsed and validated before use.",
      "AI output is rendered as plain text only, never as HTML, and never executed.",
      "Nothing is applied to any website. Accepting a suggestion only records it in your report.",
    ],
  },
  {
    t: "Secrets",
    items: [
      "The Gemini API key lives only in the server environment (.env.local) and is sent in a request header, never in a URL.",
      "The key never reaches the browser, logs or the JSON report.",
      "AI errors use fixed messages that never include keys, headers or response bodies.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <div className="light-page min-h-screen" style={LIGHT_BG}>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4">
        <PageHero
          eyebrow="Security"
          title="Built to fetch the web safely"
          intro="A tool that fetches arbitrary URLs on a server must not become a way into that server's network. Here is how SitePilot AI is hardened."
        />
        <section className="grid gap-4 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Card key={s.t}>
              <h2 className="text-lg font-bold">{s.t}</h2>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--l-muted)" }}>
                {s.items.map((i) => (
                  <li key={i} className="flex gap-2"><span style={{ color: "var(--brand)" }}>✓</span><span>{i}</span></li>
                ))}
              </ul>
            </Card>
          ))}
        </section>
        <Card className="mt-6 text-sm">
          <strong>Try it:</strong>{" "}
          <span style={{ color: "var(--l-muted)" }}>scan </span>
          <code className="font-mono">http://localhost</code>
          <span style={{ color: "var(--l-muted)" }}> or </span>
          <code className="font-mono">http://169.254.169.254</code>
          <span style={{ color: "var(--l-muted)" }}> in the workspace. Both are refused with a clear reason.</span>
        </Card>
        <div className="mt-10 text-center">
          <Link href="/app" className="btn btn-primary" style={{ padding: "12px 22px", fontSize: 16 }}>Open workspace</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
