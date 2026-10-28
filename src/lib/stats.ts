import { PENALTIES } from "./checkInfo";
import type { Category, ScanStatus, Scores, Severity } from "./types";

export interface HistoryFinding { id: string; severity: Severity; category: Category; title: string; fix?: string }
export interface HistoryEntry {
  id: string;
  url: string;
  status: ScanStatus;
  scannedAt: string;
  scores: Scores;
  findings: HistoryFinding[];
}

export interface TopIssue { id: string; title: string; severity: Severity; count: number }
export interface SiteSummary { key: string; url: string; scans: number; latest: number; previous: number | null; lastScan: string }
/** `gain` is the approximate overall-score gain from fixing this one finding (its category penalty / 3 categories). */
export interface NextAction { id: string; title: string; severity: Severity; fix?: string; gain: number }
export interface Stats {
  count: number;
  average: number | null;
  best: number | null;
  latest: HistoryEntry | null;
  /** latest overall minus the scan before it for the same URL; null when there is no earlier scan */
  delta: number | null;
  categoryAverage: { seo: number; content: number; accessibility: number } | null;
  /** oldest -> newest */
  trend: { id: string; label: string; overall: number; scannedAt: string; url: string; status: ScanStatus }[];
  topIssues: TopIssue[];
  criticalInLatest: number;
  sites: SiteSummary[];
  nextActions: NextAction[];
}

const siteKey = (url: string) => url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "").toLowerCase();

const SEV_RANK: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

/** `history` is newest-first (as stored). Pure; never throws on empty input. */
export function computeStats(history: HistoryEntry[]): Stats {
  if (!history.length) {
    return { count: 0, average: null, best: null, latest: null, delta: null, categoryAverage: null, trend: [], topIssues: [], criticalInLatest: 0, sites: [], nextActions: [] };
  }
  const bySite = new Map<string, HistoryEntry[]>();
  for (const h of history) bySite.set(siteKey(h.url), [...(bySite.get(siteKey(h.url)) ?? []), h]);
  const sites: SiteSummary[] = [...bySite.entries()].map(([key, list]) => ({
    key, url: list[0].url, scans: list.length, latest: list[0].scores.overall,
    previous: list[1] ? list[1].scores.overall : null, lastScan: list[0].scannedAt,
  }));
  const latest = history[0];
  const previousSame = history.slice(1).find((h) => h.url === latest.url);
  const issues = new Map<string, TopIssue>();
  for (const h of history) {
    for (const f of h.findings) {
      const cur = issues.get(f.id);
      if (cur) cur.count++;
      else issues.set(f.id, { id: f.id, title: f.title, severity: f.severity, count: 1 });
    }
  }
  return {
    count: history.length,
    average: avg(history.map((h) => h.scores.overall)),
    best: Math.max(...history.map((h) => h.scores.overall)),
    latest,
    delta: previousSame ? latest.scores.overall - previousSame.scores.overall : null,
    categoryAverage: {
      seo: avg(history.map((h) => h.scores.seo)),
      content: avg(history.map((h) => h.scores.content)),
      accessibility: avg(history.map((h) => h.scores.accessibility)),
    },
    trend: [...history].reverse().map((h, i) => ({ id: h.id, label: `#${i + 1}`, overall: h.scores.overall, scannedAt: h.scannedAt, url: h.url, status: h.status })),
    topIssues: [...issues.values()].sort((a, b) => b.count - a.count || SEV_RANK[a.severity] - SEV_RANK[b.severity]).slice(0, 5),
    criticalInLatest: latest.findings.filter((f) => f.severity === "critical").length,
    sites,
    nextActions: [...latest.findings]
      .sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity])
      .map((f) => ({ id: f.id, title: f.title, severity: f.severity, fix: f.fix, gain: Math.max(1, Math.round(PENALTIES[f.severity] / 3)) })),
  };
}

export function scoreTone(score: number): "good" | "ok" | "bad" {
  return score >= 80 ? "good" : score >= 50 ? "ok" : "bad";
}
