import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { computeScores, runChecks } from "@/lib/checks";
import { safeFetch } from "@/lib/fetcher";
import type { ScanResult } from "@/lib/types";


export async function POST(req: Request) {
  let body: { url?: unknown; demo?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const now = new Date().toISOString();

  if (body.demo === true) {
    const html = await readFile(path.join(process.cwd(), "src", "fixtures", "demo-site.html"), "utf8");
    const { findings, meta } = runChecks(html);
    const result: ScanResult = {
      url: "demo://brightside-bakery",
      status: "demo",
      reason: "Built-in fictional demo site, audited by the same real engine.",
      scannedAt: now,
      scores: computeScores(findings),
      findings,
      meta,
    };
    return NextResponse.json(result);
  }

  if (typeof body.url !== "string") return NextResponse.json({ error: "Enter a website URL." }, { status: 400 });

  const out = await safeFetch(body.url);
  if (!out.ok) {
    const result: ScanResult = {
      url: body.url.slice(0, 2048),
      status: "failed",
      reason: out.reason,
      scannedAt: now,
      scores: null,
      findings: [],
      meta: null,
    };
    return NextResponse.json(result);
  }
  const { findings, meta } = runChecks(out.html);
  const result: ScanResult = {
    url: out.finalUrl,
    status: out.truncated ? "partial" : "complete",
    reason: out.truncated ? (out.note ?? "Only part of the page was analysed, so scores are provisional.") : "Page fetched and analysed in full.",
    scannedAt: now,
    scores: computeScores(findings, out.truncated),
    findings,
    meta,
  };
  return NextResponse.json(result);
}
