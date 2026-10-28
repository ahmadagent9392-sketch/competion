// Prints only OK/FAIL + code. Never prints the key, headers or response bodies.
const key = process.env.GEMINI_API_KEY?.trim();
if (!key) {
  console.log("FAIL missing_key");
  process.exit(1);
}
const model = process.env.GEMMA_MODEL?.trim() || "gemma-4-26b-a4b-it";
try {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: 'Reply with the word "pong".' }] }], generationConfig: { maxOutputTokens: 20 } }),
    signal: AbortSignal.timeout(25000),
  });
  if (res.ok) console.log("OK");
  else console.log(`FAIL http_${res.status}`);
  process.exit(res.ok ? 0 : 1);
} catch {
  console.log("FAIL unreachable");
  process.exit(1);
}
