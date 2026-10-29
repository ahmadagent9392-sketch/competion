import { NextResponse } from "next/server";
import { clientKey, rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rateLimit";
import { z } from "zod";
import { actionPlan, AiError, explainFinding, rewriteText } from "@/lib/ai";


const FindingSchema = z.object({
  id: z.string().max(60),
  category: z.enum(["seo", "content", "accessibility"]),
  severity: z.enum(["critical", "warning", "info"]),
  title: z.string().max(300),
  evidence: z.string().max(1200),
  why: z.string().max(600),
  fix: z.string().max(600),
});

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("explain"), finding: FindingSchema }),
  z.object({
    action: z.literal("rewrite"),
    field: z.enum(["title", "h1", "meta-description"]),
    original: z.string().max(2000),
    pageTitle: z.string().max(500).nullable().optional(),
  }),
  z.object({ action: z.literal("plan"), findings: z.array(FindingSchema).min(1).max(30) }),
]);

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "ai"));
  if (!rl.ok) {
    return NextResponse.json({ error: RATE_LIMITED_MESSAGE, code: "rate_limited" }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request.", code: "bad_request" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request.", code: "bad_request" }, { status: 400 });
  const b = parsed.data;
  try {
    if (b.action === "explain") {
      const r = await explainFinding(b.finding);
      return NextResponse.json({ ...r.data, model: r.model, aiGenerated: true });
    }
    if (b.action === "rewrite") {
      const r = await rewriteText(b.field, b.original, b.pageTitle ?? null);
      return NextResponse.json({ ...r.data, model: r.model, aiGenerated: true });
    }
    const r = await actionPlan(b.findings);
    return NextResponse.json({ ...r.data, model: r.model, aiGenerated: true });
  } catch (e) {
    if (e instanceof AiError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    return NextResponse.json({ error: "The AI service returned an error. Retry later.", code: "upstream_error" }, { status: 502 });
  }
}
