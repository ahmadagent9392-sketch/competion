import { describe, expect, it } from "vitest";
import { computeStats, scoreTone, type HistoryEntry } from "@/lib/stats";

const entry = (id: string, url: string, overall: number, ids: [string, "critical" | "warning" | "info"][] = []): HistoryEntry => ({
  id, url, status: "complete", scannedAt: `2026-01-0${id}T00:00:00Z`,
  scores: { overall, seo: overall, content: overall, accessibility: overall, provisional: false },
  findings: ids.map(([fid, severity]) => ({ id: fid, severity, category: "seo", title: `title ${fid}` })),
});

describe("computeStats", () => {
  it("handles empty history without throwing", () => {
    const s = computeStats([]);
    expect(s.count).toBe(0);
    expect(s.average).toBeNull();
    expect(s.trend).toEqual([]);
  });
  it("averages, best, and chronological trend (history is newest-first)", () => {
    const s = computeStats([entry("3", "a", 90), entry("2", "a", 60), entry("1", "b", 30)]);
    expect(s.count).toBe(3);
    expect(s.average).toBe(60);
    expect(s.best).toBe(90);
    expect(s.trend.map((t) => t.overall)).toEqual([30, 60, 90]);
    expect(s.latest?.id).toBe("3");
  });
  it("delta compares with the previous scan of the SAME url", () => {
    expect(computeStats([entry("3", "a", 90), entry("2", "b", 10), entry("1", "a", 70)]).delta).toBe(20);
    expect(computeStats([entry("2", "a", 90), entry("1", "b", 70)]).delta).toBeNull();
  });
  it("ranks recurring issues by count, then severity", () => {
    const s = computeStats([
      entry("3", "a", 50, [["x", "info"], ["y", "critical"]]),
      entry("2", "a", 50, [["x", "info"]]),
      entry("1", "a", 50, [["y", "critical"], ["z", "warning"]]),
    ]);
    expect(s.topIssues.map((i) => [i.id, i.count])).toEqual([["y", 2], ["x", 2], ["z", 1]]);
    expect(s.criticalInLatest).toBe(1);
  });
  it("scoreTone bands", () => {
    expect([scoreTone(95), scoreTone(80), scoreTone(79), scoreTone(50), scoreTone(49)]).toEqual(["good", "good", "ok", "ok", "bad"]);
  });
});
