export type Severity = "critical" | "warning" | "info";
export type Category = "seo" | "content" | "accessibility";
export type ScanStatus = "complete" | "partial" | "failed" | "demo";

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  evidence: string;
  why: string;
  fix: string;
}

export interface Scores {
  overall: number;
  seo: number;
  content: number;
  accessibility: number;
  provisional: boolean;
}

export interface PageMeta {
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
}

export interface ScanResult {
  url: string;
  status: ScanStatus;
  reason: string;
  scannedAt: string;
  scores: Scores | null;
  findings: Finding[];
  meta: PageMeta | null;
}

export type AiAction = "explain" | "rewrite" | "plan";

export interface AcceptedChange {
  findingId: string;
  field: string;
  original: string;
  suggested: string;
  acceptedAt: string;
}

export interface PlanItem {
  title: string;
  why: string;
  effort: "low" | "medium" | "high";
}
