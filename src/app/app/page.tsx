"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { recordScan, useUser } from "@/lib/store";
import type { AcceptedChange, Finding, PlanItem, ScanResult, Severity } from "@/lib/types";

type Field = "title" | "h1" | "meta-description";
const FIELD_OF: Record<string, Field> = {
  "title-missing": "title", "title-length": "title",
  "h1-missing": "h1", "h1-multiple": "h1",
  "meta-desc-missing": "meta-description", "meta-desc-length": "meta-description",
};
const SEV: Record<Severity, { label: string; bg: string; fg: string; icon: string }> = {
  critical: { label: "Critical", bg: "var(--crit-bg)", fg: "var(--crit-fg)", icon: "⛔" },
  warning: { label: "Warning", bg: "var(--warn-bg)", fg: "var(--warn-fg)", icon: "⚠" },
  info: { label: "Info", bg: "var(--info-bg)", fg: "var(--info-fg)", icon: "ℹ" },
};
const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  complete: { label: "COMPLETE", bg: "rgba(52,211,153,.15)", fg: "var(--ok)" },
  partial: { label: "PARTIAL", bg: "var(--warn-bg)", fg: "var(--warn-fg)" },
  failed: { label: "FAILED", bg: "var(--crit-bg)", fg: "var(--crit-fg)" },
  demo: { label: "DEMO — fictional site", bg: "var(--info-bg)", fg: "var(--info-fg)" },
};

interface AiState { configured: boolean; model: string; provider?: string | null }
interface Suggest {
  finding: Finding; field: Field; original: string;
  loading: boolean; suggestion?: string; warning?: string | null; note?: string; error?: string; model?: string;
}

async function postJson<T>(url: string, body: unknown): Promise<{ ok: boolean; data: T & { error?: string; code?: string } }> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({ error: "Unexpected server response." }));
  return { ok: r.ok, data };
}

function Ring({ value, provisional }: { value: number; provisional: boolean }) {
  const r = 52, c = 2 * Math.PI * r;
  const color = value >= 80 ? "var(--ok)" : value >= 50 ? "var(--warn-fg)" : "var(--crit-fg)";
  return (
    <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`Overall score ${value} out of 100${provisional ? ", provisional" : ""}`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--d-line)" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold">{value}</span>
        <span className="text-[11px]" style={{ color: "var(--d-muted)" }}>{provisional ? "provisional" : "/ 100"}</span>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "var(--ok)" : value >= 50 ? "var(--warn-fg)" : "var(--crit-fg)";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span style={{ color: "var(--d-muted)" }}>{value}</span></div>
      <div className="h-2 rounded-full" style={{ background: "var(--d-line)" }}>
        <div className="h-2 rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Workspace() {
  const [url, setUrl] = useState("");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ai, setAi] = useState<AiState | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [explain, setExplain] = useState<Record<string, { loading?: boolean; text?: string; error?: string }>>({});
  const [sg, setSg] = useState<Suggest | null>(null);
  const [accepted, setAccepted] = useState<AcceptedChange[]>([]);
  const [plan, setPlan] = useState<{ items: PlanItem[]; model: string } | null>(null);
  const [planState, setPlanState] = useState<{ loading: boolean; error?: string }>({ loading: false });
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const user = useUser();
  const sgRef = useRef<HTMLElement>(null);
  const planRef = useRef<HTMLElement>(null);
  const sgKey = sg ? `${sg.finding.id}:${sg.loading}` : "";

  // Bring the side-by-side panel / plan into view when they open, so users never hunt for them.
  useEffect(() => {
    if (sgKey) sgRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [sgKey]);
  useEffect(() => {
    if (plan) planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [plan]);

  const runScan = useCallback(async (demo: boolean, target?: string) => {
    setLoading(true); setErr(null); setScan(null); setSg(null); setPlan(null); setAccepted([]); setExplain({}); setOpen({});
    try {
      const { ok, data } = await postJson<ScanResult>("/api/scan", demo ? { demo: true } : { url: target });
      if (!ok) setErr(data.error ?? "Scan request failed.");
      else {
        setScan(data as ScanResult);
        recordScan(data as ScanResult);
      }
    } catch {
      setErr("Could not reach the SitePilot server. Is it running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch("/api/ai/status").then((r) => r.json()).then(setAi).catch(() => setAi({ configured: false, model: "" }));
    const q = new URLSearchParams(window.location.search);
    const target = q.get("url");
    if (q.get("demo") === "1") setTimeout(() => runScan(true), 0);
    else if (target) setTimeout(() => { setUrl(target); runScan(false, target); }, 0);
  }, [runScan]);

  const aiReady = ai?.configured === true;

  async function doExplain(f: Finding) {
    setExplain((s) => ({ ...s, [f.id]: { loading: true } }));
    const { ok, data } = await postJson<{ explanation: string }>("/api/ai", { action: "explain", finding: f }).catch(() => ({ ok: false, data: { error: "Network error." } as { error: string; explanation?: string } }));
    setExplain((s) => ({ ...s, [f.id]: ok ? { text: data.explanation } : { error: data.error } }));
  }

  async function doSuggest(f: Finding) {
    const field = FIELD_OF[f.id];
    if (!field || !scan?.meta) return;
    const original = (field === "title" ? scan.meta.title : field === "h1" ? scan.meta.h1 : scan.meta.metaDescription) ?? "";
    setSg({ finding: f, field, original, loading: true });
    const { ok, data } = await postJson<{ suggestion: string; warning: string | null; note?: string; model: string }>("/api/ai", {
      action: "rewrite", field, original, pageTitle: scan.meta.title,
    }).catch(() => ({ ok: false, data: { error: "Network error." } as { error: string; suggestion?: string; warning?: string | null; note?: string; model?: string } }));
    setSg({ finding: f, field, original, loading: false, ...(ok ? { suggestion: data.suggestion, warning: data.warning, note: data.note, model: data.model } : { error: data.error }) });
  }

  async function doPlan() {
    if (!scan) return;
    setPlanState({ loading: true });
    const { ok, data } = await postJson<{ items: PlanItem[]; model: string }>("/api/ai", { action: "plan", findings: scan.findings }).catch(() => ({ ok: false, data: { error: "Network error." } as { error: string; items?: PlanItem[]; model?: string } }));
    if (ok && data.items) { setPlan({ items: data.items, model: data.model ?? "" }); setPlanState({ loading: false }); }
    else setPlanState({ loading: false, error: data.error });
  }

  function accept() {
    if (!sg?.suggestion) return;
    setAccepted((a) => [...a.filter((x) => x.findingId !== sg.finding.id), { findingId: sg.finding.id, field: sg.field, original: sg.original, suggested: sg.suggestion!, acceptedAt: new Date().toISOString() }]);
    setSg(null);
  }

  async function copy() {
    if (!sg?.suggestion) return;
    try { await navigator.clipboard.writeText(sg.suggestion); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); }
  }

  function download() {
    if (!scan) return;
    const report = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      disclaimers: [
        "Findings come only from deterministic checks on the page HTML. AI never creates findings.",
        "Scores reflect these checks only and do not predict search rankings.",
        "AI text is a suggestion to review. Nothing was applied to any website.",
      ],
      scan: { url: scan.url, status: scan.status, reason: scan.reason, scannedAt: scan.scannedAt, scores: scan.scores, findings: scan.findings },
      acceptedChanges: accepted,
      actionPlan: plan ? { aiGenerated: true, model: plan.model, items: plan.items } : null,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sitepilot-report-${scan.status}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const groups: Severity[] = ["critical", "warning", "info"];
  const st = scan ? STATUS[scan.status] : null;

  return (
    <div className="workspace">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight"><span style={{ color: "var(--brand)" }}>◆</span> SitePilot AI</Link>
        <nav className="flex items-center gap-2 text-sm">
          <span className="hidden text-xs sm:inline" style={{ color: "var(--d-muted)" }}>{ai ? (aiReady ? `AI ready · ${ai.model}` : "AI not configured") : "…"}</span>
          <Link href="/dashboard" className="btn btn-ghost" style={{ padding: "6px 12px" }}>Dashboard</Link>
          {!user && <Link href="/login" className="btn btn-primary" style={{ padding: "6px 12px" }}>Sign in</Link>}
          {user && <span className="rounded-full px-3 py-1" style={{ background: "var(--d-panel2)", border: "1px solid var(--d-line)" }}>{user.name}</span>}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-16">
        <form className="panel flex flex-col gap-3 p-4 sm:flex-row" onSubmit={(e) => { e.preventDefault(); runScan(false, url); }}>
          <input
            value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-website.com" aria-label="Website URL"
            className="min-w-0 flex-1 rounded-lg px-4 py-3 text-base outline-none"
            style={{ background: "var(--d-bg)", border: "1px solid var(--d-line)", color: "var(--d-fg)" }}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1 sm:flex-none" disabled={loading || !url.trim()}>
              {loading ? <><span className="spinner" /> Scanning…</> : "Scan website"}
            </button>
            <button type="button" className="btn btn-ghost flex-1 sm:flex-none" disabled={loading} onClick={() => runScan(true)}>Try demo</button>
          </div>
        </form>

        {ai && !aiReady && (
          <div className="panel p-4 text-sm" style={{ borderColor: "var(--warn-fg)" }}>
            <strong>AI features are off.</strong> Scans and reports work fully without it. To enable explanations, rewrites and the action plan:
            add <code className="font-mono">DEEPSEEK_API_KEY=your_key</code> (or <code className="font-mono">GEMINI_API_KEY=your_key</code> for Gemma) to <code className="font-mono">.env.local</code> in the project folder, then restart the server.
          </div>
        )}

        {loading && (
          <div className="panel flex items-center gap-3 p-6" role="status"><span className="spinner" /> Fetching and analysing the page… this can take up to 10 seconds.</div>
        )}

        {err && <div className="panel p-4" role="alert" style={{ borderColor: "var(--crit-fg)", color: "var(--crit-fg)" }}>{err}</div>}

        {!scan && !loading && !err && (
          <div className="panel p-10 text-center">
            <h2 className="text-xl font-bold">Ready when you are</h2>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--d-muted)" }}>
              Enter a public website URL above, or try the built-in demo site to see a full audit in seconds.
            </p>
          </div>
        )}

        {scan && st && (
          <>
            <section className="panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="badge" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                <span className="min-w-0 break-all text-sm" style={{ color: "var(--d-muted)" }}>{scan.url}</span>
              </div>
              <p className="mt-2 text-sm">{scan.reason}</p>

              {scan.scores ? (
                <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
                  <Ring value={scan.scores.overall} provisional={scan.scores.provisional} />
                  <div className="grid flex-1 gap-3">
                    <Bar label="SEO basics" value={scan.scores.seo} />
                    <Bar label="Content structure" value={scan.scores.content} />
                    <Bar label="Accessibility" value={scan.scores.accessibility} />
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm" style={{ color: "var(--crit-fg)" }}>No score: the page could not be analysed. Fix the issue above and scan again.</p>
              )}
              <p className="mt-4 text-xs" style={{ color: "var(--d-muted)" }}>
                How scoring works: each category starts at 100; every failing check subtracts once (critical −20, warning −10, info −3). Scores reflect these checks only; they do not predict search rankings.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-ghost" onClick={download}>Download JSON report</button>
                {scan.findings.length > 0 && (
                  <button className="btn btn-primary" disabled={!aiReady || planState.loading} onClick={doPlan} title={aiReady ? "" : "Add DEEPSEEK_API_KEY or GEMINI_API_KEY to enable"}>
                    {planState.loading ? <><span className="spinner" /> Planning…</> : "Generate action plan"}
                  </button>
                )}
              </div>
              {planState.error && <p className="mt-3 text-sm" role="alert" style={{ color: "var(--crit-fg)" }}>{planState.error}</p>}
            </section>

            {plan && (
              <section ref={planRef} className="panel p-5">
                <h2 className="text-lg font-bold">Top fixes <span className="badge ml-2" style={{ background: "var(--info-bg)", color: "var(--info-fg)" }}>AI suggestion — review before use</span></h2>
                <ol className="mt-3 space-y-3">
                  {plan.items.map((it, i) => (
                    <li key={i} className="rounded-lg p-3" style={{ background: "var(--d-panel2)" }}>
                      <div className="font-semibold">{i + 1}. {it.title} <span className="text-xs font-normal" style={{ color: "var(--d-muted)" }}>· effort: {it.effort}</span></div>
                      <p className="mt-1 text-sm" style={{ color: "var(--d-muted)" }}>{it.why}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-xs" style={{ color: "var(--d-muted)" }}>Drafted by {plan.model} from the findings above only.</p>
              </section>
            )}

            {scan.status !== "failed" && scan.findings.length === 0 && (
              <div className="panel p-6 text-center" style={{ borderColor: "var(--ok)" }}>
                <strong style={{ color: "var(--ok)" }}>No issues found by these 10 checks.</strong>
                <p className="mt-1 text-sm" style={{ color: "var(--d-muted)" }}>That does not guarantee the page is perfect; it only means none of these checks failed.</p>
              </div>
            )}

            {groups.map((sev) => {
              const list = scan.findings.filter((f) => f.severity === sev);
              if (!list.length) return null;
              const s = SEV[sev];
              return (
                <section key={sev} className="space-y-2">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: s.fg }}>{s.icon} {s.label} · {list.length}</h2>
                  {list.map((f) => {
                    const isOpen = open[f.id];
                    const ex = explain[f.id];
                    const canRewrite = Boolean(FIELD_OF[f.id]);
                    return (
                      <div key={f.id} className="panel overflow-hidden">
                        <button className="flex w-full items-start gap-3 p-4 text-left" aria-expanded={!!isOpen} onClick={() => setOpen((o) => ({ ...o, [f.id]: !o[f.id] }))}>
                          <span className="badge shrink-0" style={{ background: s.bg, color: s.fg }}>{s.icon} {s.label}</span>
                          <span className="flex-1 font-semibold">{f.title}</span>
                          <span aria-hidden>{isOpen ? "−" : "+"}</span>
                        </button>
                        {isOpen && (
                          <div className="space-y-3 border-t p-4 text-sm" style={{ borderColor: "var(--d-line)" }}>
                            <div>
                              <div className="mb-1 text-xs uppercase" style={{ color: "var(--d-muted)" }}>Evidence from the page</div>
                              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg p-3 font-mono text-xs" style={{ background: "var(--d-bg)" }}>{f.evidence}</pre>
                            </div>
                            <p><strong>Why it matters.</strong> {f.why}</p>
                            <p><strong>How to fix.</strong> {f.fix}</p>
                            {ex?.text && <p className="rounded-lg p-3" style={{ background: "var(--info-bg)" }}><strong>AI explanation (review before use).</strong> {ex.text}</p>}
                            {ex?.error && <p role="alert" style={{ color: "var(--crit-fg)" }}>{ex.error}</p>}
                            <div className="flex flex-wrap gap-2">
                              <button className="btn btn-ghost" disabled={!aiReady || ex?.loading} onClick={() => doExplain(f)} title={aiReady ? "" : "Add DEEPSEEK_API_KEY or GEMINI_API_KEY to enable"}>
                                {ex?.loading ? <><span className="spinner" /> Explaining…</> : "Explain in plain English"}
                              </button>
                              {canRewrite && scan.meta && (
                                <button className="btn btn-primary" disabled={!aiReady} onClick={() => doSuggest(f)} title={aiReady ? "" : "Add DEEPSEEK_API_KEY or GEMINI_API_KEY to enable"}>Improve with AI</button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              );
            })}

            {sg && (
              <section ref={sgRef} className="panel p-5" aria-live="polite" style={{ borderColor: "var(--brand)" }}>
                <h2 className="text-lg font-bold">Improve {sg.field} <span className="badge ml-2" style={{ background: "var(--info-bg)", color: "var(--info-fg)" }}>AI suggestion — review before use</span></h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg p-3" style={{ background: "var(--d-panel2)" }}>
                    <div className="mb-1 text-xs uppercase" style={{ color: "var(--d-muted)" }}>Original · {sg.original.length} chars</div>
                    <p className="whitespace-pre-wrap break-words text-sm">{sg.original || "(empty — nothing found on the page)"}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "var(--d-panel2)", border: "1px solid var(--brand)" }}>
                    <div className="mb-1 text-xs uppercase" style={{ color: "var(--d-muted)" }}>Suggested{sg.suggestion ? ` · ${sg.suggestion.length} chars` : ""}</div>
                    {sg.loading && <p className="flex items-center gap-2 text-sm"><span className="spinner" /> Drafting…</p>}
                    {sg.error && <p className="text-sm" role="alert" style={{ color: "var(--crit-fg)" }}>{sg.error}</p>}
                    {sg.suggestion && <p className="whitespace-pre-wrap break-words text-sm">{sg.suggestion}</p>}
                    {sg.warning && <p className="mt-2 text-xs" style={{ color: "var(--warn-fg)" }}>⚠ {sg.warning}</p>}
                    {sg.note && <p className="mt-2 text-xs" style={{ color: "var(--d-muted)" }}>{sg.note}</p>}
                  </div>
                </div>
                <p className="mt-3 text-xs" style={{ color: "var(--d-muted)" }}>Accepting only records the change in your report. SitePilot never edits your website.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn btn-primary" disabled={!sg.suggestion} onClick={accept}>Accept</button>
                  <button className="btn btn-ghost" disabled={!sg.suggestion} onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
                  <button className="btn btn-ghost" disabled={sg.loading} onClick={() => doSuggest(sg.finding)}>Retry</button>
                  <button className="btn btn-ghost" onClick={() => setSg(null)}>Cancel</button>
                </div>
              </section>
            )}

            {accepted.length > 0 && (
              <section className="panel p-5">
                <h2 className="text-lg font-bold">Proposed changes ({accepted.length})</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {accepted.map((c) => (
                    <li key={c.findingId} className="rounded-lg p-3" style={{ background: "var(--d-panel2)" }}>
                      <div className="text-xs uppercase" style={{ color: "var(--d-muted)" }}>{c.field}</div>
                      <div style={{ color: "var(--d-muted)", textDecoration: "line-through" }} className="break-words">{c.original || "(empty)"}</div>
                      <div className="break-words">{c.suggested}</div>
                      <button className="btn btn-ghost mt-2" onClick={() => setAccepted((a) => a.filter((x) => x.findingId !== c.findingId))}>Remove</button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs" style={{ color: "var(--d-muted)" }}>These are suggestions you accepted. Copy them into your site yourself; nothing was applied.</p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
