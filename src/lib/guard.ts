import net from "node:net";

export const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

export class GuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuardError";
  }
}

function v4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, p) => (acc << 8) + Number(p), 0) >>> 0;
}

const V4_BLOCKS: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function inV4Block(ip: string): boolean {
  const n = v4ToInt(ip);
  return V4_BLOCKS.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (v4ToInt(base) & mask);
  });
}

/** Expand an IPv6 address into 8 hextets (numbers). */
function expandV6(ip: string): number[] | null {
  let addr = ip.split("%")[0];
  // Embedded dotted IPv4 tail, e.g. ::ffff:127.0.0.1
  const v4tail = addr.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4tail) {
    if (!net.isIPv4(v4tail[1])) return null;
    const n = v4ToInt(v4tail[1]);
    addr = addr.slice(0, -v4tail[1].length) + ((n >>> 16).toString(16) + ":" + (n & 0xffff).toString(16));
  }
  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 && missing !== 0) return null;
  if (missing < 0) return null;
  const parts = [...head, ...Array(missing).fill("0"), ...tail].map((h) => parseInt(h, 16));
  return parts.some((p) => Number.isNaN(p)) ? null : parts;
}

export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return inV4Block(ip);
  if (!net.isIPv6(ip)) return true; // unknown format: block
  const h = expandV6(ip);
  if (!h) return true;
  const allZeroPrefix = h.slice(0, 5).every((x) => x === 0);
  // ::ffff:a.b.c.d (mapped) and ::a.b.c.d (compatible) -> check the IPv4
  if (allZeroPrefix && (h[5] === 0xffff || h[5] === 0)) {
    if (h[5] === 0 && h[6] === 0 && h[7] <= 1) return true; // :: and ::1
    const v4 = `${h[6] >> 8}.${h[6] & 255}.${h[7] >> 8}.${h[7] & 255}`;
    return inV4Block(v4);
  }
  // NAT64 64:ff9b::/96 -> check embedded IPv4
  if (h[0] === 0x64 && h[1] === 0xff9b && h.slice(2, 6).every((x) => x === 0)) {
    return inV4Block(`${h[6] >> 8}.${h[6] & 255}.${h[7] >> 8}.${h[7] & 255}`);
  }
  if ((h[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((h[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((h[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local
  if ((h[0] & 0xff00) === 0xff00) return true; // multicast
  if (h[0] === 0x2001 && h[1] === 0x0db8) return true; // documentation
  if (h[0] === 0x2002) return true; // 6to4 can embed private v4
  return false;
}

/** Validate a user-supplied URL. Throws GuardError with a user-safe message. */
export function validateUrl(input: string): URL {
  const raw = (input ?? "").trim();
  if (!raw) throw new GuardError("Enter a website URL.");
  if (raw.length > 2048) throw new GuardError("URL is too long.");
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new GuardError("That is not a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new GuardError("Only http and https URLs are allowed.");
  if (url.username || url.password) throw new GuardError("URLs with credentials are not allowed.");
  if (!ALLOWED_PORTS.has(url.port)) throw new GuardError("Only ports 80, 443, 8080 and 8443 are allowed.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host) throw new GuardError("That is not a valid URL.");
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new GuardError("This address is private or internal and cannot be scanned.");
    return url;
  }
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    host.endsWith(".home.arpa") ||
    !host.includes(".")
  )
    throw new GuardError("Local and internal hostnames cannot be scanned.");
  return url;
}
