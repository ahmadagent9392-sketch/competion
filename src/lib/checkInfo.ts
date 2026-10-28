import type { Category, Severity } from "./types";

/** Human-readable catalogue of the rules implemented in checks.ts (kept in the same order). */
export const CHECK_INFO: { id: string; category: Category; severity: Severity; rule: string }[] = [
  { id: "title-missing", category: "seo", severity: "critical", rule: "The page has no non-empty <title>." },
  { id: "title-length", category: "seo", severity: "info", rule: "The title is shorter than 30 or longer than 60 characters." },
  { id: "meta-desc-missing", category: "seo", severity: "warning", rule: 'There is no <meta name="description"> with content.' },
  { id: "meta-desc-length", category: "seo", severity: "info", rule: "The meta description is shorter than 70 or longer than 160 characters." },
  { id: "h1-missing", category: "content", severity: "critical", rule: "The page has no <h1> heading." },
  { id: "h1-multiple", category: "content", severity: "warning", rule: "The page has more than one <h1> heading." },
  { id: "img-alt-missing", category: "accessibility", severity: "critical", rule: 'One or more <img> elements have no alt attribute (alt="" is fine for decorative images).' },
  { id: "html-lang-missing", category: "accessibility", severity: "warning", rule: "The <html> element has no lang attribute." },
  { id: "viewport-missing", category: "seo", severity: "warning", rule: 'There is no <meta name="viewport"> tag.' },
  { id: "canonical-missing", category: "seo", severity: "warning", rule: 'There is no <link rel="canonical">.' },
];

export const PENALTIES: Record<Severity, number> = { critical: 20, warning: 10, info: 3 };
