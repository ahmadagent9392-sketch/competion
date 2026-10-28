import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeScores, runChecks } from "@/lib/checks";

const ids = (html: string) => runChecks(html).findings.map((f) => f.id);
const GOOD = `<!doctype html><html lang="en"><head><title>A perfectly sized page title for tests</title>
<meta name="description" content="A meta description that is comfortably long enough to sit inside the seventy to one hundred sixty range."/>
<meta name="viewport" content="width=device-width"><link rel="canonical" href="https://x.test/"></head>
<body><h1>Hello</h1><img src="a.png" alt=""></body></html>`;

describe("checks", () => {
  it("good page has no findings", () => expect(ids(GOOD)).toEqual([]));
  it("empty/malformed html does not throw", () => {
    expect(() => runChecks("")).not.toThrow();
    expect(() => runChecks("<div><<p>>>")).not.toThrow();
    expect(ids("")).toContain("title-missing");
  });
  it("title-missing and title-length", () => {
    expect(ids(GOOD.replace(/<title>.*<\/title>/, ""))).toContain("title-missing");
    expect(ids(GOOD.replace(/<title>.*<\/title>/, "<title>Short</title>"))).toContain("title-length");
  });
  it("meta description missing / length", () => {
    expect(ids(GOOD.replace(/<meta name="description"[^>]*>/, ""))).toContain("meta-desc-missing");
    expect(ids(GOOD.replace(/content="A meta[^"]*"/, 'content="tiny"'))).toContain("meta-desc-length");
  });
  it("h1 missing / multiple", () => {
    expect(ids(GOOD.replace("<h1>Hello</h1>", ""))).toContain("h1-missing");
    expect(ids(GOOD.replace("<h1>Hello</h1>", "<h1>a</h1><h1>b</h1>"))).toContain("h1-multiple");
  });
  it("img alt: missing flagged, empty alt fine", () => {
    expect(ids(GOOD.replace('alt=""', ""))).toContain("img-alt-missing");
    expect(ids(GOOD)).not.toContain("img-alt-missing");
  });
  it("lang, viewport, canonical", () => {
    expect(ids(GOOD.replace(' lang="en"', ""))).toContain("html-lang-missing");
    expect(ids(GOOD.replace(/<meta name="viewport"[^>]*>/, ""))).toContain("viewport-missing");
    expect(ids(GOOD.replace(/<link rel="canonical"[^>]*>/, ""))).toContain("canonical-missing");
  });
  it("evidence is quoted from the HTML", () => {
    const f = runChecks(GOOD.replace('alt=""', "")).findings.find((x) => x.id === "img-alt-missing")!;
    expect(f.evidence).toContain('<img src="a.png"');
  });
  it("demo fixture has real findings", () => {
    const got = ids(readFileSync("src/fixtures/demo-site.html", "utf8"));
    for (const id of ["title-length", "meta-desc-missing", "h1-multiple", "img-alt-missing", "html-lang-missing", "viewport-missing", "canonical-missing"])
      expect(got).toContain(id);
  });
});

describe("scoring", () => {
  const f = (category: "seo" | "content" | "accessibility", severity: "critical" | "warning" | "info") =>
    ({ id: "x", category, severity, title: "", evidence: "", why: "", fix: "" });
  it("perfect = 100", () => expect(computeScores([]).overall).toBe(100));
  it("penalties per severity", () => {
    const s = computeScores([f("seo", "critical"), f("seo", "warning"), f("seo", "info"), f("accessibility", "critical")]);
    expect(s.seo).toBe(67);
    expect(s.accessibility).toBe(80);
    expect(s.content).toBe(100);
    expect(s.overall).toBe(Math.round((67 + 100 + 80) / 3));
  });
  it("floors at 0", () => expect(computeScores(Array(10).fill(f("content", "critical"))).content).toBe(0));
  it("provisional flag", () => expect(computeScores([], true).provisional).toBe(true));
});
