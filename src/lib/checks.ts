import * as cheerio from "cheerio";
import type { Category, Finding, PageMeta, Scores, Severity } from "./types";

type $ = cheerio.CheerioAPI;
type Check = ($: $) => Finding | null;

const clip = (s: string, n = 200) => (s.length > n ? s.slice(0, n) + "…" : s);

const mk = (
  id: string,
  category: Category,
  severity: Severity,
  title: string,
  evidence: string,
  why: string,
  fix: string,
): Finding => ({ id, category, severity, title, evidence, why, fix });

const titleText = ($: $) => $("head title").first().text().trim() || $("title").first().text().trim();
const metaDesc = ($: $) => ($('meta[name="description" i]').first().attr("content") ?? "").trim();

export const CHECKS: Check[] = [
  ($) =>
    titleText($)
      ? null
      : mk("title-missing", "seo", "critical", "Page has no title", "No non-empty <title> element found.",
          "The title is the main label shown in browser tabs and search results.", "Add a unique, descriptive <title> in <head>."),
  ($) => {
    const t = titleText($);
    if (!t || (t.length >= 30 && t.length <= 60)) return null;
    return mk("title-length", "seo", "info", "Title length outside 30–60 characters", `<title>${clip(t)}</title> (${t.length} chars)`,
      "Very short titles say little; very long ones get cut off in results.", "Aim for a clear title of 30–60 characters.");
  },
  ($) =>
    metaDesc($)
      ? null
      : mk("meta-desc-missing", "seo", "warning", "No meta description", 'No <meta name="description"> with content found.',
          "Search engines often use it as the snippet under your link.", "Add a meta description summarising the page."),
  ($) => {
    const d = metaDesc($);
    if (!d || (d.length >= 70 && d.length <= 160)) return null;
    return mk("meta-desc-length", "seo", "info", "Meta description length outside 70–160 characters",
      `<meta name="description" content="${clip(d)}"> (${d.length} chars)`,
      "Too short wastes space; too long is truncated.", "Rewrite it to 70–160 characters.");
  },
  ($) =>
    $("h1").length
      ? null
      : mk("h1-missing", "content", "critical", "Page has no H1 heading", "No <h1> element found.",
          "The H1 tells visitors and assistive tech what the page is about.", "Add one clear <h1> describing the page."),
  ($) => {
    const h = $("h1");
    if (h.length <= 1) return null;
    return mk("h1-multiple", "content", "warning", `Page has ${h.length} H1 headings`,
      h.toArray().slice(0, 3).map((e) => `<h1>${clip($(e).text().trim(), 80)}</h1>`).join("\n"),
      "Several H1s blur the page's main topic.", "Keep one H1 and demote the others to H2/H3.");
  },
  ($) => {
    const bad = $("img").filter((_, e) => $(e).attr("alt") === undefined);
    if (!bad.length) return null;
    return mk("img-alt-missing", "accessibility", "critical", `${bad.length} image(s) without alt attribute`,
      bad.toArray().slice(0, 3).map((e) => clip($.html(e) ?? "", 160)).join("\n"),
      "Screen-reader users get no description of these images.", 'Add alt text, or alt="" for purely decorative images.');
  },
  ($) =>
    ($("html").attr("lang") ?? "").trim()
      ? null
      : mk("html-lang-missing", "accessibility", "warning", "<html> has no lang attribute", clip($.html($("html").first()).split(">")[0] + ">", 120),
          "Screen readers use it to pick the right pronunciation.", 'Add lang, e.g. <html lang="en">.'),
  ($) =>
    $('meta[name="viewport" i]').length
      ? null
      : mk("viewport-missing", "seo", "warning", "No viewport meta tag", 'No <meta name="viewport"> found.',
          "Without it, mobile browsers render the page zoomed out.", 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.'),
  ($) =>
    $('link[rel="canonical" i]').length
      ? null
      : mk("canonical-missing", "seo", "warning", "No canonical link", 'No <link rel="canonical"> found.',
          "It tells search engines which URL is the main version of the page.", 'Add <link rel="canonical" href="…"> pointing to the preferred URL.'),
];

export function runChecks(html: string): { findings: Finding[]; meta: PageMeta } {
  let $: $;
  try {
    $ = cheerio.load(html);
  } catch {
    $ = cheerio.load("");
  }
  const findings: Finding[] = [];
  for (const c of CHECKS) {
    try {
      const f = c($);
      if (f) findings.push(f);
    } catch {
      /* a broken check must never break the scan */
    }
  }
  const h1 = $("h1").first().text().trim();
  return {
    findings,
    meta: { title: titleText($) || null, metaDescription: metaDesc($) || null, h1: h1 || null },
  };
}

const PENALTY: Record<Severity, number> = { critical: 20, warning: 10, info: 3 };

export function computeScores(findings: Finding[], provisional = false): Scores {
  const s = { seo: 100, content: 100, accessibility: 100 };
  for (const f of findings) s[f.category] = Math.max(0, s[f.category] - PENALTY[f.severity]);
  const overall = Math.round((s.seo + s.content + s.accessibility) / 3);
  return { ...s, overall, provisional };
}
