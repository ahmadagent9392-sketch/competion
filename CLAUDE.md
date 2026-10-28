# SitePilot AI — "Audit like an engineer, explain like a consultant"
Single source of truth. Build phase by phase below. Budget: 60 min core (hard stop 90 min). Start: 12:33.

## After /clear
Run `date`, `git log --oneline`, read the phase ticks below, continue at the first unticked phase. No chat memory needed.

## Product (one page)
User enters a public URL or clicks "Try demo". Server fetches the page, runs deterministic checks, shows score + findings
(severity, evidence quoted from HTML, why, fix). Gemma 4 explains a finding, rewrites title/H1/meta description,
writes a top-3 action plan. User sees Original | Suggested side by side, Copy or Accept. Download JSON report.
Non-goals: applying changes to sites, auth, DB, crawling >1 page, ranking prediction.

## Hard rules
- AI never creates findings. Only pure functions in `src/lib/checks.ts` do. AI explains, rewrites, plans.
- Nothing applied to any site, nothing AI-generated executed. Never fabricate results, stats or testimonials.
- All scanned/AI text rendered as plain text. `dangerouslySetInnerHTML` forbidden.
- Fetching + AI only in route handlers. Key only from `process.env.GEMINI_API_KEY`. Never in client, logs, report.
- Never read/print/commit `.env*`. `.claude/settings.json` denies Read on `.env*`. `.gitignore` has `.env*` (allow `.env.example`).
- Page text sent to AI goes inside `<page_data>` tags, declared untrusted data in the system prompt.
- AI errors use fixed messages; never include key, headers or response bodies.
- Stack: Next.js App Router + TS + Tailwind, cheerio, zod, undici, vitest. No UI lib or DB.
- "Login" is a LOCAL PROFILE only (name in localStorage, `src/lib/store.ts`): no password, no server, not a security boundary. Scan history lives in the same place. Never describe it as authentication.
- AI providers (`src/lib/ai.ts`): DeepSeek first if `DEEPSEEK_API_KEY` is set (OpenAI-style, `Bearer` header), else/fallback Gemma via `GEMINI_API_KEY`. `AI_PROVIDER=gemma` flips the order. Same prompts, same zod validation, same fixed errors.

## Files (keep it small)
`src/lib/types.ts` · `guard.ts` (URL + IP rules) · `fetcher.ts` · `checks.ts` (checks + score) · `ai.ts` (Gemma + prompts + zod)
`src/fixtures/demo-site.html` · `src/app/api/scan/route.ts` · `src/app/api/ai/route.ts` (action: explain|rewrite|plan) ·
`src/app/api/ai/status/route.ts` · `src/app/page.tsx` (landing) · `src/app/app/page.tsx` (workspace) · `tests/*.test.ts`

## Specs
**Scanner**: http/https only; ports 80/443/8080/8443; no URL credentials. Block localhost, *.local, *.internal,
single-label hosts, IPv4/IPv6 private, loopback, link-local, CGNAT 100.64/10, multicast, 0.0.0.0/8, IPv4-mapped IPv6.
DNS checked at connect via undici Agent `connect.lookup` (stops DNS rebinding). Redirects manual, max 5, each hop
re-validated. Timeout 25 s (SCAN_TIMEOUT_MS), a mid-download timeout keeps the partial page (status partial). Body cap 2 MB → status partial. Non-HTML content-type → failed.
Status: complete | partial | failed | demo, always with a reason string shown in UI.
**Checks** (category/severity): title-missing seo/critical · title-length (30–60) seo/info · meta-desc-missing seo/warning ·
meta-desc-length (70–160) seo/info · h1-missing content/critical · h1-multiple content/warning ·
img-alt-missing a11y/critical (alt="" ok) · html-lang-missing a11y/warning · viewport-missing seo/warning ·
canonical-missing seo/warning. Finding = {id, category, severity, title, evidence, why, fix}. Malformed HTML must not throw.
**Score**: seo, content, a11y start 100; per failing check critical −20, warning −10, info −3; floor 0; overall = rounded mean.
Partial = "provisional"; failed = no score. UI text: "Scores reflect these checks only; they do not predict rankings."
**Demo**: fictional "Brightside Bakery" HTML with deliberate issues, same engine, badge "DEMO — fictional site".
**AI (Gemma 4 via Gemini API)**: verify shape at https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api first.
POST `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent`, header `x-goog-api-key`
(never in URL). Body `{contents:[{role:'user',parts:[{text}]}], generationConfig:{temperature:0.4,maxOutputTokens:800}}`
(put system text in the user turn if systemInstruction is rejected). Model env `GEMMA_MODEL`, default `gemma-4-26b-a4b-it`.
No JSON mode: ask for one JSON object, strip ``` fences, take first `{...}`, zod-validate. Timeout 25 s, 1 retry on 5xx/network.
Codes: missing_key (503, no fetch), upstream_auth, upstream_rate_limited, upstream_timeout, upstream_error, malformed_response.
`GET /api/ai/status` → `{configured, model}` only. No key → app still fully works; UI shows "Add GEMINI_API_KEY to
.env.local and restart". AI output labelled "AI suggestion — review before use".
**UI**: light landing (hero, Start, Try demo). Dark workspace: scan bar, status badge + reason, score ring + 3 bars,
findings grouped by severity (expand evidence in monospace, fix, "Improve with AI"), Original | Suggested panel
(char count, Copy, Accept, Retry), "Generate action plan", accepted changes list, Download JSON. States: loading,
empty, error, partial, failed, missing key. Teal brand, CSS vars, works at 1440 and 390 px. No dead buttons.
**Report JSON**: schemaVersion, generatedAt, disclaimers, url, status, reason, scores, findings (no raw HTML),
acceptedChanges, actionPlan {aiGenerated:true, model}. No secrets.

## Phases (tick here; commit `P#: summary` after each; then print elapsed/remaining, evidence, next)
- [x] P1 Setup (5): `create-next-app` (TS, Tailwind, App Router, src/), deps, vitest, `.gitignore`, `.env.example`, git init,
      script `check` = lint + tsc --noEmit + vitest run + build. Gate: `npm run check` green.
- [x] P2 Engine (15) [80 tests pass; demo, real, blocked scans verified live]: types, guard, fetcher, checks+score, demo fixture, `/api/scan`. Tests: guard (private/v6/mapped/
      ports/creds), fetcher (redirect to private, timeout, oversize, non-HTML via local test server), checks, score.
      Gate: tests pass; curl demo → findings; curl http://localhost → failed + reason.
- [x] P3 AI (10) [mocked tests pass; live Gemma call verified]: `ai.ts`, `/api/ai`, `/api/ai/status`. Mocked-fetch tests: success, fenced JSON, invalid JSON,
      401, 429, timeout, missing key makes no fetch, key never in output. Gate: tests pass; live call only if key set
      (else say "live AI check not run").
- [x] P4 UI (20) [build passes; pages return 200]: landing + workspace, all states, suggest panel, action plan, accepted list, JSON download.
      Gate: build passes; manual demo scan in browser/curl.
- [ ] P5 Final (10): `npm run build && npm start`; demo scan, real scan (https://example.com), blocked (http://localhost),
      one AI suggestion; `git grep -n AIza` empty. Report remaining time + extras, then wait.

## Cut order if late
Drop first: responsive polish → action plan → explain action → canonical/viewport checks. Never drop: SSRF guard,
honest statuses, demo, JSON report, no-key fallback.

## Extras (only if time, ranked)
1. Screenshot upload → Gemma 4 image review, labelled "AI opinion, not an audit check". 2. Second demo site.
3. Rate limit on /api routes. 4. More checks (OG tags, link text). 5. Copy-as-Markdown report.

## Workflow
- `date` at start and after each phase. Over a time box → cut per list above and say so.
- Fails twice → stop, give one exact next action. Base every claim on real command output.
- Commit messages end with: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
