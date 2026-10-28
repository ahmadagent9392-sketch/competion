import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { safeFetch } from "@/lib/fetcher";

let server: http.Server;
let base = "";

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const u = req.url ?? "/";
    if (u === "/ok") { res.setHeader("content-type", "text/html"); res.end("<html><title>hi</title></html>"); }
    else if (u === "/json") { res.setHeader("content-type", "application/json"); res.end("{}"); }
    else if (u === "/big") { res.setHeader("content-type", "text/html"); res.end("x".repeat(5000)); }
    else if (u === "/slow") { setTimeout(() => res.end("late"), 3000); }
    else if (u === "/loop") { res.statusCode = 302; res.setHeader("location", "/loop"); res.end(); }
    else if (u === "/r") { res.statusCode = 302; res.setHeader("location", "/ok"); res.end(); }
    else if (u === "/stall") { res.setHeader("content-type", "text/html"); res.write("<html><head><title>Partial page</title></head><body><h1>Hi</h1>"); /* never ends */ }
    else if (u === "/404") { res.statusCode = 404; res.end(); }
    else { res.statusCode = 500; res.end(); }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => { server.closeAllConnections?.(); server.close(); });

const T = { unsafeAllowPrivate: true };

describe("safeFetch (guard ON: SSRF)", () => {
  it.each(["http://localhost", "http://127.0.0.1", "http://[::1]", "http://169.254.169.254/", "http://10.0.0.1", "ftp://example.com"])(
    "blocks %s", async (u) => {
      const r = await safeFetch(u);
      expect(r.ok).toBe(false);
    });
  it("blocks a hostname that resolves to a private address (DNS check at connect)", async () => {
    // 127.0.0.1.nip.io resolves to 127.0.0.1 -> must be refused by the connect-time lookup (or fail to resolve offline).
    const r = await safeFetch("http://127.0.0.1.nip.io:8080/");
    expect(r.ok).toBe(false);
  });
});

describe("safeFetch (local test server, guard off)", () => {
  it("fetches html", async () => {
    const r = await safeFetch(`${base}/ok`, T);
    expect(r.ok && r.html).toContain("<title>hi</title>");
  });
  it("follows a redirect", async () => {
    const r = await safeFetch(`${base}/r`, T);
    expect(r.ok && r.finalUrl.endsWith("/ok")).toBe(true);
  });
  it("stops redirect loops", async () => {
    const r = await safeFetch(`${base}/loop`, T);
    expect(!r.ok && r.reason).toMatch(/redirect/i);
  });
  it("rejects non-HTML", async () => {
    const r = await safeFetch(`${base}/json`, T);
    expect(!r.ok && r.reason).toMatch(/Not an HTML/);
  });
  it("truncates oversize bodies (partial)", async () => {
    const r = await safeFetch(`${base}/big`, { ...T, maxBytes: 1000 });
    expect(r.ok && r.truncated).toBe(true);
    expect(r.ok && r.html.length).toBe(1000);
  });
  it("times out", async () => {
    const r = await safeFetch(`${base}/slow`, { ...T, timeoutMs: 300 });
    expect(!r.ok && r.reason).toMatch(/too long|timeout/i);
  });
  it("keeps the partial page when the timeout hits mid-download (partial, not failed)", async () => {
    const r = await safeFetch(`${base}/stall`, { ...T, timeoutMs: 400 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.truncated).toBe(true);
      expect(r.html).toContain("<title>Partial page</title>");
      expect(r.note).toMatch(/timed out after/);
    }
  });
  it("reports HTTP errors", async () => {
    const r = await safeFetch(`${base}/404`, T);
    expect(!r.ok && r.reason).toMatch(/404/);
  });
});
