"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { computeStats, scoreTone } from "@/lib/stats";
import { clearHistory, signOut, useHistory, useHydrated, useUser } from "@/lib/store";

const TONE = { good: "var(--ok)", ok: "var(--warn-fg)", bad: "var(--crit-fg)" } as const;
const SEV = {
  critical: { bg: "var(--crit-bg)", fg: "var(--crit-fg)", icon: "⛔", label: "Critical" },
  warning: { bg: "var(--warn-bg)", fg: "var(--warn-fg)", icon: "⚠", label: "Warning" },
  info: { bg: "var(--info-bg)", fg: "var(--info-fg)", icon: "ℹ", label: "Info" },
} as const;
const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const host = (u: string) => (u.startsWith("demo://") ? "Demo: Brightside Bakery" : u.replace(/^https?:\/\//, "").replace(/\/$/, ""));

function ScoreRing({ value, size = 140 }: { value: number; size?: number }) {
  const r = 52, c = 2 * Math.PI * r;
  const color = TONE[scoreTone(value)];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Latest overall score ${value} out of 100`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--d-line)" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold" style={{ color }}>{value}</span>
        <span className="text-[11px]" style={{ color: "var(--d-muted)" }}>out of 100</span>
      </div>
    </div>
  );
}

function Tile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="panel panel-hover rise p-4">
      <div className="text-xs uppercase tracking-wide" style={{ color: "var(--d-muted)" }}>{label}</div>
      <div className="mt-1 text-3xl font-extrabold" style={{ color: color ?? "var(--d-fg)" }}>{value}</div>
      {sub && <div className="mt-1 text-xs" style={{ color: "var(--d-muted)" }}>{sub}</div>}
    </div>
  );
}

function TrendChart({ points }: { points: { id: string; overall: number; scannedAt: string; url: string }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const W = 640, H = 220, L = 34, R = 14, T = 14, B = 26;
  const x = (i: number) => (points.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (points.length - 1));
  const y = (v: number) => T + (1 - v / 100) * (H - T - B);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.overall).toFixed(1)}`).join(" ");
  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Score trend</h2>
        <button className="btn btn-ghost" style={{ padding: "5px 12px" }} onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? "Show chart" : "Show as table"}
        </button>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--d-muted)" }}>Overall score of each saved scan, oldest to newest.</p>

      {asTable ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead style={{ color: "var(--d-muted)" }}><tr><th className="py-2 pr-3">#</th><th className="pr-3">When</th><th className="pr-3">Site</th><th>Score</th></tr></thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--d-line)" }}>
                  <td className="py-2 pr-3">{i + 1}</td><td className="pr-3">{fmt(p.scannedAt)}</td><td className="pr-3 break-all">{host(p.url)}</td><td className="font-semibold">{p.overall}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Line chart of ${points.length} overall scores, from ${points[0].overall} to ${points[points.length - 1].overall}`}>
            {[0, 50, 100].map((g) => (
              <g key={g}>
                <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="var(--d-line)" strokeWidth="1" strokeDasharray={g === 0 ? undefined : "3 4"} />
                <text x={L - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--d-muted)">{g}</text>
              </g>
            ))}
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--d-muted)" strokeWidth="1" />}
            {points.length > 1 && <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
            {points.map((p, i) => (
              <g key={p.id}>
                <circle cx={x(i)} cy={y(p.overall)} r={5} fill="var(--brand)" stroke="var(--d-panel)" strokeWidth="2" />
                <circle
                  cx={x(i)} cy={y(p.overall)} r={16} fill="transparent" tabIndex={0} style={{ cursor: "pointer" }}
                  aria-label={`Scan ${i + 1}, ${host(p.url)}, score ${p.overall}, ${fmt(p.scannedAt)}`}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                />
              </g>
            ))}
            {points.length > 1 && (
              <>
                <text x={x(0)} y={H - 8} textAnchor="start" fontSize="11" fill="var(--d-muted)">{fmt(points[0].scannedAt)}</text>
                <text x={x(points.length - 1)} y={H - 8} textAnchor="end" fontSize="11" fill="var(--d-muted)">{fmt(points[points.length - 1].scannedAt)}</text>
              </>
            )}
          </svg>
          {hp && hover !== null && (
            <div
              className="pointer-events-none absolute z-10 rounded-lg px-3 py-2 text-xs shadow-lg"
              style={{
                left: `${(x(hover) / W) * 100}%`, top: `${(y(hp.overall) / H) * 100}%`,
                transform: `translate(${hover > points.length / 2 ? "-105%" : "5%"}, -120%)`,
                background: "var(--d-panel2)", border: "1px solid var(--d-line)", maxWidth: 240,
              }}
            >
              <div className="font-bold" style={{ color: TONE[scoreTone(hp.overall)] }}>Score {hp.overall}</div>
              <div className="break-all">{host(hp.url)}</div>
              <div style={{ color: "var(--d-muted)" }}>{fmt(hp.scannedAt)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const hydrated = useHydrated();
  const user = useUser();
  const history = useHistory();
  const stats = useMemo(() => computeStats(history), [history]);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!hydrated) return <div className="workspace flex items-center justify-center"><span className="spinner" /></div>;

  if (!user) {
    return (
      <div className="workspace flex items-center justify-center px-4">
        <div className="panel max-w-md p-8 text-center">
          <h1 className="text-2xl font-extrabold">Sign in to see your dashboard</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--d-muted)" }}>Your scan history is saved in this browser and shown here once you enter your name.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="btn btn-primary">Sign in</Link>
            <Link href="/app" className="btn btn-ghost">Continue as guest</Link>
          </div>
        </div>
      </div>
    );
  }

  const latest = stats.latest;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  function exportHistory() {
    const blob = new Blob([JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), scans: history }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sitepilot-history.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="workspace">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight"><span style={{ color: "var(--brand)" }}>◆</span> SitePilot AI</Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle surface="dark" />
          <Link href="/app" className="btn btn-primary" style={{ padding: "7px 14px" }}>New scan</Link>
          <span className="hidden rounded-full px-3 py-1 text-sm sm:inline" style={{ background: "var(--d-panel2)", border: "1px solid var(--d-line)" }}>{user.name}</span>
          <button className="btn btn-ghost" style={{ padding: "7px 14px" }} onClick={() => signOut()}>Sign out</button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-16">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{greeting}, {user.name}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--d-muted)" }}>
            {stats.count ? "Here is how your audited sites are doing." : "Run your first audit and it will appear here."}
          </p>
        </div>

        {!latest ? (
          <div className="panel p-10 text-center">
            <h2 className="text-xl font-bold">No scans yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--d-muted)" }}>
              Every complete, partial or demo scan you run in the workspace is saved here, so you can track your score over time.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/app?demo=1" className="btn btn-primary">Try the demo site</Link>
              <Link href="/app" className="btn btn-ghost">Scan a website</Link>
            </div>
          </div>
        ) : (
          <>
            <section className="panel rise flex flex-col items-center gap-6 p-6 sm:flex-row" style={{ borderColor: "var(--brand)" }}>
              <ScoreRing value={latest.scores.overall} />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>Latest scan</span>
                <h2 className="mt-2 break-all text-xl font-extrabold sm:text-2xl">{host(latest.url)}</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--d-muted)" }}>
                  {scoreTone(latest.scores.overall) === "good" ? "Looking healthy." : scoreTone(latest.scores.overall) === "ok" ? "Room to improve." : "Needs attention."}{" "}
                  {stats.delta !== null && (stats.delta === 0 ? "No change since the previous scan of this site. " : `${stats.delta > 0 ? "Up" : "Down"} ${Math.abs(stats.delta)} point${Math.abs(stats.delta) === 1 ? "" : "s"} since the previous scan. `)}
                  {latest.scores.overall < 100 ? `${100 - latest.scores.overall} points are available by fixing the ${latest.findings.length} open finding${latest.findings.length === 1 ? "" : "s"} below.` : "All checks pass."}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Link href={latest.url.startsWith("demo://") ? "/app?demo=1" : `/app?url=${encodeURIComponent(latest.url)}`} className="btn btn-primary">Rescan this site</Link>
                  <Link href="/app" className="btn btn-ghost">Scan another site</Link>
                  <button className="btn btn-ghost" onClick={exportHistory}>Export history</button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile label="Average score" value={String(stats.average)} sub={`across ${stats.count} saved scan${stats.count === 1 ? "" : "s"}`} />
              <Tile label="Best score" value={String(stats.best)} />
              <Tile label="Sites tracked" value={String(stats.sites.length)} />
              <Tile label="Critical issues" value={String(stats.criticalInLatest)} color={stats.criticalInLatest ? "var(--crit-fg)" : "var(--ok)"} sub="in the latest scan" />
            </section>

            <section className="grid gap-5 lg:grid-cols-5">
              <div className="panel rise p-5 lg:col-span-3">
                <h2 className="text-lg font-bold">What to fix next</h2>
                <p className="mt-1 text-xs" style={{ color: "var(--d-muted)" }}>From your latest scan, most important first. Point gains are approximate and come from the published scoring rules.</p>
                {stats.nextActions.length === 0 ? (
                  <p className="mt-4 text-sm" style={{ color: "var(--ok)" }}>Nothing to fix: every check passed.</p>
                ) : (
                  <ol className="mt-3 space-y-2">
                    {stats.nextActions.slice(0, 5).map((a, i) => (
                      <li key={a.id} className="flex items-start gap-3 rounded-lg p-3 text-sm" style={{ background: "var(--d-panel2)" }}>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "var(--brand)" }}>{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{a.title}</span>
                          {a.fix && <span className="mt-0.5 block" style={{ color: "var(--d-muted)" }}>{a.fix}</span>}
                        </span>
                        <span className="badge shrink-0" style={{ background: SEV[a.severity].bg, color: SEV[a.severity].fg }}>≈ +{a.gain} pts</span>
                      </li>
                    ))}
                  </ol>
                )}
                {stats.nextActions.length > 5 && <p className="mt-2 text-xs" style={{ color: "var(--d-muted)" }}>+ {stats.nextActions.length - 5} more in the workspace.</p>}
              </div>

              <div className="panel rise p-5 lg:col-span-2">
                <h2 className="text-lg font-bold">Your sites</h2>
                <ul className="mt-3 space-y-2">
                  {stats.sites.slice(0, 6).map((s) => {
                    const d = s.previous === null ? null : s.latest - s.previous;
                    return (
                      <li key={s.key} className="flex items-center gap-3 rounded-lg p-3 text-sm" style={{ background: "var(--d-panel2)" }}>
                        <span className="w-9 shrink-0 text-center text-lg font-extrabold" style={{ color: TONE[scoreTone(s.latest)] }}>{s.latest}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block break-all font-medium">{host(s.url)}</span>
                          <span className="text-xs" style={{ color: "var(--d-muted)" }}>{s.scans} scan{s.scans === 1 ? "" : "s"}</span>
                        </span>
                        {d !== null && d !== 0 && <span className="shrink-0 text-xs font-semibold" style={{ color: d > 0 ? "var(--ok)" : "var(--crit-fg)" }}>{d > 0 ? "▲ +" : "▼ "}{d}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2"><TrendChart points={stats.trend} /></div>
              <div className="panel p-5">
                <h2 className="text-lg font-bold">Category averages</h2>
                <div className="mt-4 space-y-4">
                  {([["SEO basics", stats.categoryAverage!.seo], ["Content structure", stats.categoryAverage!.content], ["Accessibility", stats.categoryAverage!.accessibility]] as const).map(([l, v]) => (
                    <div key={l}>
                      <div className="mb-1 flex justify-between text-sm"><span>{l}</span><span style={{ color: "var(--d-muted)" }}>{v}</span></div>
                      <div className="h-2 rounded-full" style={{ background: "var(--d-line)" }}><div className="h-2 rounded-full" style={{ width: `${v}%`, background: TONE[scoreTone(v)] }} /></div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs" style={{ color: "var(--d-muted)" }}>Scores reflect these checks only; they do not predict search rankings.</p>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="panel p-5">
                <h2 className="text-lg font-bold">Most frequent issues</h2>
                {stats.topIssues.length === 0 ? (
                  <p className="mt-3 text-sm" style={{ color: "var(--ok)" }}>No issues found in any saved scan.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {stats.topIssues.map((i) => (
                      <li key={i.id} className="flex items-center gap-3 rounded-lg p-3 text-sm" style={{ background: "var(--d-panel2)" }}>
                        <span className="badge shrink-0" style={{ background: SEV[i.severity].bg, color: SEV[i.severity].fg }}>{SEV[i.severity].icon} {SEV[i.severity].label}</span>
                        <span className="min-w-0 flex-1 break-words">{i.title}</span>
                        <span className="shrink-0 font-semibold">{i.count}×</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">Recent scans</h2>
                  {confirmClear ? (
                    <span className="flex items-center gap-2 text-sm">
                      Delete all?
                      <button className="btn btn-ghost" style={{ padding: "4px 10px", color: "var(--crit-fg)" }} onClick={() => { clearHistory(); setConfirmClear(false); }}>Yes, clear</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setConfirmClear(false)}>Keep</button>
                    </span>
                  ) : (
                    <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setConfirmClear(true)}>Clear history</button>
                  )}
                </div>
                <ul className="mt-3 space-y-2">
                  {history.slice(0, 6).map((h) => (
                    <li key={h.id} className="flex items-center gap-3 rounded-lg p-3 text-sm" style={{ background: "var(--d-panel2)" }}>
                      <span className="w-10 shrink-0 text-center text-xl font-extrabold" style={{ color: TONE[scoreTone(h.scores.overall)] }}>{h.scores.overall}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-all font-medium">{host(h.url)}</span>
                        <span className="text-xs" style={{ color: "var(--d-muted)" }}>
                          {fmt(h.scannedAt)} · {h.status}{h.scores.provisional ? " (provisional)" : ""} · {h.findings.length} finding{h.findings.length === 1 ? "" : "s"}
                        </span>
                      </span>
                      <Link
                        href={h.url.startsWith("demo://") ? "/app?demo=1" : `/app?url=${encodeURIComponent(h.url)}`}
                        className="btn btn-ghost shrink-0" style={{ padding: "5px 12px" }}
                      >Rescan</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
