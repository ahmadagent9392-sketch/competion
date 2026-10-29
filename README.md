<div align="center">

# ◆ SitePilot AI

**Audit like an engineer. Explain like a consultant.**

A website audit and improvement workspace for small businesses, agencies and developers.
Real, deterministic checks on a page's HTML, explained and improved by AI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)
![AI](https://img.shields.io/badge/AI-DeepSeek%20%2B%20Gemma%204-0d9488)

</div>

---

## What it does

Paste a public website URL (or try the built-in demo site). SitePilot AI fetches the page on the server, runs **ten deterministic checks** on its HTML across SEO, content structure and accessibility, and shows:

- a **score** with the exact rules behind it,
- **findings** with severity, **evidence quoted from the real HTML**, why it matters and how to fix it,
- **AI help**: plain-English explanations, rewrites of weak titles / H1s / meta descriptions, and a prioritised top-3 action plan,
- a **side-by-side** *Original | Suggested* comparison you can copy or accept,
- a **dashboard** of your scan history, and a downloadable **JSON report**.

> **The one rule:** AI never creates findings. Only the check functions in [`src/lib/checks.ts`](src/lib/checks.ts) do. AI explains, rewrites and plans. Nothing is ever applied to any website, and nothing AI-generated is executed.

## Features

| | |
|---|---|
| **Real audit engine** | 10 pure functions on the page's HTML. Same HTML in, same findings out. |
| **Transparent scoring** | Three category scores start at 100; each failing check subtracts a fixed penalty once. Rules are published in the app on the *Checks* page. |
| **Honest scan status** | Every scan is `complete`, `partial`, `failed` or `demo`, always with a visible reason. |
| **Two AI providers** | **DeepSeek** (first choice) with automatic fallback to **Gemma 4** via the Gemini API, or the reverse. The app is fully usable with no AI key. |
| **Dashboard** | Latest / average / best score, score trend chart, *What to fix next* with approximate point gains, per-site comparison, history export. |
| **Light and dark themes** | A toggle on every page; your choice is remembered with no flash on load. |
| **Hardened fetcher** | SSRF protection, size / time / redirect limits, safe handling of non-HTML and malformed pages. |
| **Responsive** | Laptop and phone layouts. |

> SitePilot AI does **not** predict search rankings. Scores reflect these ten checks only.

## The ten checks

| Check | Category | Severity | Fails when |
|---|---|---|---|
| `title-missing` | SEO | critical | no non-empty `<title>` |
| `title-length` | SEO | info | title shorter than 30 or longer than 60 characters |
| `meta-desc-missing` | SEO | warning | no `<meta name="description">` with content |
| `meta-desc-length` | SEO | info | description shorter than 70 or longer than 160 characters |
| `h1-missing` | Content | critical | no `<h1>` |
| `h1-multiple` | Content | warning | more than one `<h1>` |
| `img-alt-missing` | Accessibility | critical | an `<img>` has no `alt` attribute (`alt=""` is fine) |
| `html-lang-missing` | Accessibility | warning | `<html>` has no `lang` |
| `viewport-missing` | SEO | warning | no `<meta name="viewport">` |
| `canonical-missing` | SEO | warning | no `<link rel="canonical">` |

**Scoring:** each category starts at 100. Each failing check subtracts once: critical −20, warning −10, info −3 (never below 0). The overall score is the rounded mean of the three categories. Partial scans are marked *provisional*; failed scans get no score.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · [cheerio](https://cheerio.js.org) (HTML parsing) · [zod](https://zod.dev) (validation) · [undici](https://undici.nodejs.org) (HTTP with a guarded DNS lookup) · [Vitest](https://vitest.dev) (tests). No UI library, no database.

## Getting started

**Requirements:** Node.js 20.19 or newer.

```bash
git clone https://github.com/ahmadagent9392-sketch/competion.git
cd competion
npm install
npm run dev          # http://localhost:3000
```

The app works immediately: scanning, findings, scoring, the dashboard and reports need **no API key**. Add a key only to enable the AI features.

### Enable AI

Create `.env.local` in the project root. Set either key, or both:

```bash
DEEPSEEK_API_KEY=your_deepseek_key   # DeepSeek is used first when this is set
GEMINI_API_KEY=your_google_ai_key    # Gemma 4 via the Gemini API (fallback, or first with AI_PROVIDER=gemma)
```

Restart the server after editing. Check the connection with `npm run ai:check`. It prints only `OK` / `FAIL` plus a short code for each provider and never prints a key.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DEEPSEEK_API_KEY` | — | Enables DeepSeek (sent as a `Bearer` header, server-side only) |
| `DEEPSEEK_MODEL` | `deepseek-chat` | DeepSeek model id |
| `GEMINI_API_KEY` | — | Enables Gemma 4 through the Gemini API (sent in the `x-goog-api-key` header, never in a URL) |
| `GEMMA_MODEL` | `gemma-4-26b-a4b-it` | Alternative: `gemma-4-31b-it` |
| `AI_PROVIDER` | — | Set to `gemma` to prefer Gemma over DeepSeek |
| `SCAN_TIMEOUT_MS` | `25000` | Total time budget per scan (5000 to 60000) |
| `RATE_LIMIT_PER_MIN` | `20` | Requests per minute per client, per API endpoint |

If the preferred AI provider fails (rate limit, no balance, outage), the other is tried automatically. If neither is configured, AI buttons are disabled with setup instructions and everything else keeps working.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Vitest (102 tests) |
| `npm run check` | Lint + typecheck + tests + build |
| `npm run ai:check` | Live check of the configured AI providers (`OK` / `FAIL` only) |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fahmadagent9392-sketch%2Fcompetion&env=DEEPSEEK_API_KEY,GEMINI_API_KEY&envDescription=Optional%3A%20set%20one%20or%20both%20to%20enable%20AI%20features&project-name=sitepilot-ai)

1. Import the repository in Vercel. Next.js is detected automatically.
2. Under **Settings → Environment Variables** add `DEEPSEEK_API_KEY` and/or `GEMINI_API_KEY`. Both are optional.
3. Deploy.

Notes for a public deployment:

- [`vercel.json`](vercel.json) raises the API function limit to 60 s so slow scans and AI calls can finish.
- **Protect your key.** The AI endpoints spend your quota. A built-in per-client rate limit (20 requests/min by default) slows abuse, but it is best-effort: on serverless hosts each instance keeps its own counters. For a high-traffic public site, add a shared limiter (for example Vercel WAF rules or Upstash).
- Some websites block requests from cloud datacentre IPs, so a scan that works locally may be refused when hosted.
- Your **name and scan history are stored in each visitor's own browser** (localStorage), so there is nothing to migrate and no database to provision.

## How it works

```
Browser ──► POST /api/scan ──► validate URL ──► guarded fetch ──► cheerio ──► 10 pure checks ──► score + findings
   │                                                                                         (no AI involved)
   └──────► POST /api/ai   ──► zod-validate input ──► DeepSeek ⇄ Gemma 4 ──► zod-validate output ──► plain text in UI
```

### Scan statuses

| Status | Meaning |
|---|---|
| `complete` | Page fetched and analysed in full |
| `partial` | The page exceeded 2 MB, or the download timed out part-way; the part received was analysed and the score is marked provisional |
| `failed` | URL blocked, unreachable, timed out, or not HTML. The reason is always shown and there is no score |
| `demo` | A fictional built-in site ("Brightside Bakery"), audited by the same real engine and clearly labelled |

### API

| Endpoint | Body | Returns |
|---|---|---|
| `POST /api/scan` | `{ "url": "https://example.com" }` or `{ "demo": true }` | `{ url, status, reason, scannedAt, scores, findings[], meta }` |
| `POST /api/ai` | `{ "action": "explain", "finding": {…} }` · `{ "action": "rewrite", "field": "title" \| "h1" \| "meta-description", "original", "pageTitle" }` · `{ "action": "plan", "findings": […] }` | `{ …result, model, aiGenerated: true }` |
| `GET /api/ai/status` | — | `{ configured, provider, model }` (never a key) |

AI errors use fixed messages and codes: `missing_key` (503, no network call made), `upstream_auth`, `upstream_rate_limited` (429), `upstream_timeout`, `upstream_error`, `malformed_response`, plus `rate_limited` (429) from the built-in limiter. None ever contain a key, headers or a provider response body.

## Security

The server fetches URLs that users supply, so the fetcher is built to refuse to become a way into internal networks.

**Fetching (SSRF protection)**

- Only `http` / `https`, on ports 80, 443, 8080 and 8443; no credentials in URLs.
- Blocks `localhost`, `*.local`, `*.internal` and single-label hostnames.
- Blocks private, loopback, link-local, CGNAT, multicast and reserved IPv4 and IPv6 ranges, including IPv4-mapped IPv6 and unusual spellings (`2130706433`, `0x7f.0.0.1`, `127.1`).
- **DNS is checked at connect time**, so a public-looking name that resolves to a private address (for example `localtest.me`) is refused.
- Redirects are followed manually (max 5) and **every hop is re-validated**.
- 25 s total timeout (configurable), 2 MB body cap, HTML content types only.

**AI safety**

- Page text sent to the model is wrapped in `<page_data>` tags and declared untrusted data.
- The model is asked for one JSON object. It is parsed and validated with zod; JSON mode is not relied on.
- AI output is rendered as **plain text only** (no `dangerouslySetInnerHTML` anywhere), never executed, and never applied to any site. *Accept* only records a suggestion in your report.

**Secrets**

- API keys live only in server environment variables, are never sent to the browser and never appear in logs, errors or reports.
- `.env*` files are git-ignored.

## Testing

`npm test` runs **102 tests** across six files, focused where it matters:

- **URL guard and fetcher** — private IPv4/IPv6 ranges, odd IP spellings, ports, credentials, redirect loops, timeout, oversize bodies, non-HTML responses, and partial pages on a mid-download timeout (against a local test server).
- **Checks and scoring** — every check, malformed HTML, score arithmetic, and a test that keeps the published rules table in sync with the real checks.
- **AI layer (mocked)** — success, fenced JSON, invalid JSON, schema mismatch, 401, 429, timeout, 5xx retry, missing key (no network call), DeepSeek and Gemma request shapes, provider fallback, the length-retry for rewrites, and that keys never appear in output.
- **Dashboard statistics** and the **rate limiter**.

Beyond the automated suite, the app was exercised end to end in a browser (demo, real and blocked scans; explain, rewrite, copy, accept, action plan; JSON report; sign-in; theme switching) and against a battery of SSRF bypass attempts.

## Project structure

```
src/
  app/
    page.tsx                  Landing page
    app/page.tsx              Workspace (scan, findings, AI panels)
    dashboard/page.tsx        Scan history dashboard
    login/page.tsx            Local profile sign-in
    how-it-works/ checks/ security/   Information pages
    api/scan/route.ts         POST /api/scan
    api/ai/route.ts           POST /api/ai
    api/ai/status/route.ts    GET /api/ai/status
  components/                 Site nav/footer, theme toggle
  lib/
    guard.ts                  URL and IP validation (SSRF rules)
    fetcher.ts                Guarded fetch: redirects, timeout, size cap
    checks.ts                 The 10 checks and scoring
    ai.ts                     DeepSeek + Gemma, prompts, zod schemas, typed errors
    stats.ts                  Dashboard statistics (pure)
    store.ts                  Local profile, history and theme (localStorage)
    rateLimit.ts              Per-client rate limiter
  fixtures/demo-site.html     The fictional demo site
tests/                        Vitest suites
scripts/ai-check.mjs          Live provider check
```

## Limitations

- **One page per scan.** There is no crawling.
- **Ten checks.** A clean result means these ten checks passed, not that a site is perfect.
- **The "login" is a local profile**, not an account: a name stored in your browser, with no password and nothing sent to a server. Do not treat it as security.
- **History is per browser** (up to 50 scans) and is not synced across devices.
- **AI suggestions need review.** They are drafts; quality varies, and rewrite lengths are checked against recommended ranges with a visible warning when missed.
- **Slow networks** can produce `partial` scans, shown honestly with the reason.
- **Scores do not predict rankings.**

## Roadmap ideas

A target score with progress tracking · printable report · side-by-side comparison of two scans · AI visual review of an uploaded screenshot (clearly labelled as opinion, not an audit check) · more checks (Open Graph tags, link text) · a shared rate limiter for large public deployments.
