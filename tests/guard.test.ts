import { describe, expect, it } from "vitest";
import { GuardError, isBlockedIp, validateUrl } from "@/lib/guard";

describe("isBlockedIp", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255"])(
    "blocks %s", (ip) => expect(isBlockedIp(ip)).toBe(true));
  it.each(["::1", "::", "fc00::1", "fd12::1", "fe80::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:10.0.0.1", "64:ff9b::7f00:1"])(
    "blocks v6 %s", (ip) => expect(isBlockedIp(ip)).toBe(true));
  it.each(["93.184.216.34", "8.8.8.8", "172.32.0.1", "2606:4700:4700::1111"])("allows %s", (ip) => expect(isBlockedIp(ip)).toBe(false));
});

describe("validateUrl", () => {
  it("adds https to bare hosts", () => expect(validateUrl("example.com").protocol).toBe("https:"));
  it.each(["http://localhost", "http://foo.local", "http://db.internal", "http://intranet", "http://127.0.0.1", "http://[::1]/", "http://[::ffff:127.0.0.1]/", "http://169.254.169.254/latest"])(
    "rejects %s", (u) => expect(() => validateUrl(u)).toThrow(GuardError));
  it.each(["ftp://example.com", "file:///etc/passwd", "javascript:alert(1)"])("rejects scheme %s", (u) => expect(() => validateUrl(u)).toThrow(GuardError));
  it("rejects credentials and odd ports", () => {
    expect(() => validateUrl("https://user:pw@example.com")).toThrow(GuardError);
    expect(() => validateUrl("https://example.com:22")).toThrow(GuardError);
    expect(() => validateUrl("https://example.com:8443")).not.toThrow();
  });
  it("rejects empty and garbage", () => {
    expect(() => validateUrl("")).toThrow(GuardError);
    expect(() => validateUrl("http://")).toThrow(GuardError);
  });
});
