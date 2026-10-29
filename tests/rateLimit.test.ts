import { describe, expect, it } from "vitest";
import { clientKey, rateLimit } from "@/lib/rateLimit";

describe("rateLimit", () => {
  it("allows up to the limit, then blocks with a retry time", () => {
    const k = "t1";
    for (let i = 0; i < 3; i++) expect(rateLimit(k, 3, 60_000, 1_000 + i).ok).toBe(true);
    const r = rateLimit(k, 3, 60_000, 5_000);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBe(56); // oldest hit at t=1000 expires at 61000; now=5000
  });
  it("frees capacity after the window passes", () => {
    const k = "t2";
    for (let i = 0; i < 2; i++) rateLimit(k, 2, 60_000, 0);
    expect(rateLimit(k, 2, 60_000, 30_000).ok).toBe(false);
    expect(rateLimit(k, 2, 60_000, 61_000).ok).toBe(true);
  });
  it("keeps callers independent", () => {
    rateLimit("a", 1, 60_000, 0);
    expect(rateLimit("a", 1, 60_000, 1).ok).toBe(false);
    expect(rateLimit("b", 1, 60_000, 1).ok).toBe(true);
  });
});

describe("clientKey", () => {
  const req = (h: Record<string, string>) => new Request("http://x.test", { headers: h });
  it("uses the first x-forwarded-for entry", () => expect(clientKey(req({ "x-forwarded-for": "1.2.3.4, 9.9.9.9" }), "scan")).toBe("scan:1.2.3.4"));
  it("falls back to x-real-ip, then local", () => {
    expect(clientKey(req({ "x-real-ip": "5.6.7.8" }), "ai")).toBe("ai:5.6.7.8");
    expect(clientKey(req({}), "ai")).toBe("ai:local");
  });
});
