# SitePilot AI

Audit like an engineer, explain like a consultant. Paste a public URL (or try the demo site) and get real, deterministic findings on SEO, content structure and accessibility, with evidence quoted from the HTML. Gemma 4 (Gemini API, server-side only) explains findings, rewrites titles/H1/meta descriptions and drafts a top-3 action plan. Nothing is ever applied to your site.

## Run
```
npm install
npm run dev          # http://localhost:3000
npm run check        # lint + typecheck + test + build
```

## Enable AI (optional — scans and reports work without it)
Create `.env.local` in the project root with either or both keys:
```
DEEPSEEK_API_KEY=your_deepseek_key      # used first when set (optional DEEPSEEK_MODEL, default deepseek-chat)
GEMINI_API_KEY=your_google_ai_key       # Gemma 4 via the Gemini API (optional GEMMA_MODEL, default gemma-4-26b-a4b-it)
AI_PROVIDER=gemma                       # optional: prefer Gemma over DeepSeek
```
If the first provider fails, the other is tried automatically. Restart the server after editing. `npm run ai:check` prints only OK/FAIL + a code. Keys are never sent to the browser, logged or put in reports. `.env.local` is git-ignored.

## Dashboard and sign-in
`/login` creates a **local profile** (just a name, kept in this browser). `/dashboard` shows your saved scan history: latest/average/best score, a score trend, category averages and your most frequent issues. This is not an account: there is no password and nothing is sent to a server.

## Honesty
Findings come only from the checks in `src/lib/checks.ts`. AI never creates findings. Scores reflect those checks only and do not predict search rankings. The demo is a fictional site audited by the same engine and labelled DEMO.
