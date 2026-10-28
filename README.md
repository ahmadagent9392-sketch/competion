# SitePilot AI

Audit like an engineer, explain like a consultant. Paste a public URL (or try the demo site) and get real, deterministic findings on SEO, content structure and accessibility, with evidence quoted from the HTML. Gemma 4 (Gemini API, server-side only) explains findings, rewrites titles/H1/meta descriptions and drafts a top-3 action plan. Nothing is ever applied to your site.

## Run
```
npm install
npm run dev          # http://localhost:3000
npm run check        # lint + typecheck + test + build
```

## Enable AI (optional — scans and reports work without it)
Create `.env.local` in the project root:
```
GEMINI_API_KEY=your_key_from_google_ai_studio
GEMMA_MODEL=gemma-4-26b-a4b-it   # optional; alt: gemma-4-31b-it
```
Restart the server. `npm run ai:check` prints only OK/FAIL + a code. The key is never sent to the browser, logged or put in reports. `.env.local` is git-ignored.

## Honesty
Findings come only from the checks in `src/lib/checks.ts`. AI never creates findings. Scores reflect those checks only and do not predict search rankings. The demo is a fictional site audited by the same engine and labelled DEMO.
