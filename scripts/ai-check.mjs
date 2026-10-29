// Live provider check. Prints only provider name + OK/FAIL + a short code. Never prints keys, headers or response bodies.
// Usage: npm run ai:check   (loads .env.local)
const gemmaKey = process.env.GEMINI_API_KEY?.trim();
const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();

async function probe(name, url, init) {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30000) });
    console.log(`${res.ok ? "OK  " : "FAIL"} ${name}${res.ok ? "" : ` http_${res.status}`}`);
    return res.ok;
  } catch {
    console.log(`FAIL ${name} unreachable`);
    return false;
  }
}

const results = [];
if (deepseekKey) {
  results.push(
    await probe("deepseek", "https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${deepseekKey}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat",
        messages: [{ role: "user", content: 'Reply with the word "pong".' }],
        max_tokens: 10,
      }),
    }),
  );
}
if (gemmaKey) {
  const model = process.env.GEMMA_MODEL?.trim() || "gemma-4-26b-a4b-it";
  results.push(
    await probe("gemma", `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": gemmaKey },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: 'Reply with the word "pong".' }] }], generationConfig: { maxOutputTokens: 20 } }),
    }),
  );
}
if (!results.length) {
  console.log("FAIL missing_key (set DEEPSEEK_API_KEY and/or GEMINI_API_KEY in .env.local)");
  process.exit(1);
}
process.exit(results.some(Boolean) ? 0 : 1);
