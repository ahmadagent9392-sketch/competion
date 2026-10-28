import dns from "node:dns";
import net from "node:net";
import { Agent, request } from "undici";
import { GuardError, isBlockedIp, validateUrl } from "./guard";

export const MAX_BYTES = 2 * 1024 * 1024;
export const MAX_REDIRECTS = 5;
export const TIMEOUT_MS = 10_000;

export interface FetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  /** Tests only: skip URL/IP guard so a local test server can be used. */
  unsafeAllowPrivate?: boolean;
}

export type FetchOutcome =
  | { ok: true; html: string; finalUrl: string; truncated: boolean }
  | { ok: false; reason: string };

function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  cb: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
) {
  dns.lookup(hostname, { ...options, all: true }, (err, addrs) => {
    if (err) return cb(err, "", 0);
    const list = addrs as dns.LookupAddress[];
    if (!list.length || list.some((a) => isBlockedIp(a.address))) {
      return cb(Object.assign(new Error("blocked address"), { code: "EBLOCKED" }), "", 0);
    }
    if (options.all) return cb(null, list);
    cb(null, list[0].address, list[0].family);
  });
}

const safeAgent = new Agent({ connect: { lookup: guardedLookup as never } });
const openAgent = new Agent();

export async function safeFetch(input: string, opts: FetchOptions = {}): Promise<FetchOutcome> {
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const maxBytes = opts.maxBytes ?? MAX_BYTES;
  const deadline = AbortSignal.timeout(timeoutMs);
  let current: URL;
  try {
    current = opts.unsafeAllowPrivate ? new URL(input) : validateUrl(input);
  } catch (e) {
    return { ok: false, reason: e instanceof GuardError ? e.message : "That is not a valid URL." };
  }

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!opts.unsafeAllowPrivate) {
        // Re-validate every hop; also catch IP-literal hosts before connecting.
        current = validateUrl(current.toString());
        if (net.isIP(current.hostname.replace(/^\[|\]$/g, "")) && isBlockedIp(current.hostname.replace(/^\[|\]$/g, "")))
          return { ok: false, reason: "This address is private or internal and cannot be scanned." };
      }
      const res = await request(current.toString(), {
        method: "GET",
        dispatcher: opts.unsafeAllowPrivate ? openAgent : safeAgent,
        signal: deadline,
        headers: { "user-agent": "SitePilotAI/0.1 (+audit bot)", accept: "text/html,application/xhtml+xml" },
      }); // undici.request never follows redirects: each hop is handled (and re-validated) above

      if (res.statusCode >= 300 && res.statusCode < 400) {
        const loc = res.headers.location;
        await res.body.dump().catch(() => undefined);
        if (!loc || Array.isArray(loc)) return { ok: false, reason: `Redirect (${res.statusCode}) without a usable Location header.` };
        if (hop === MAX_REDIRECTS) return { ok: false, reason: `Too many redirects (more than ${MAX_REDIRECTS}).` };
        try {
          current = new URL(loc, current);
        } catch {
          return { ok: false, reason: "Redirect to an invalid URL." };
        }
        continue;
      }

      if (res.statusCode >= 400) {
        await res.body.dump().catch(() => undefined);
        return { ok: false, reason: `The site responded with HTTP ${res.statusCode}.` };
      }

      const ctype = String(res.headers["content-type"] ?? "").toLowerCase();
      if (!/text\/html|application\/xhtml\+xml/.test(ctype)) {
        await res.body.dump().catch(() => undefined);
        return { ok: false, reason: `Not an HTML page (content-type: ${ctype.split(";")[0] || "unknown"}).` };
      }

      const chunks: Buffer[] = [];
      let size = 0;
      let truncated = false;
      for await (const chunk of res.body) {
        const buf = Buffer.from(chunk as Uint8Array);
        if (size + buf.length > maxBytes) {
          chunks.push(buf.subarray(0, maxBytes - size));
          size = maxBytes;
          truncated = true;
          res.body.destroy();
          break;
        }
        chunks.push(buf);
        size += buf.length;
      }
      return { ok: true, html: Buffer.concat(chunks).toString("utf8"), finalUrl: current.toString(), truncated };
    }
    return { ok: false, reason: `Too many redirects (more than ${MAX_REDIRECTS}).` };
  } catch (e) {
    return { ok: false, reason: describeError(e, deadline.aborted) };
  }
}

function describeError(e: unknown, timedOut: boolean): string {
  if (timedOut) return "The site took too long to respond (timeout).";
  if (e instanceof GuardError) return e.message;
  const code = (e as { code?: string; cause?: { code?: string } })?.code ?? (e as { cause?: { code?: string } })?.cause?.code;
  if (code === "EBLOCKED") return "This address is private or internal and cannot be scanned.";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "The domain could not be found.";
  if (code === "ECONNREFUSED") return "The site refused the connection.";
  if (code === "UND_ERR_CONNECT_TIMEOUT") return "The site took too long to respond (timeout).";
  return "The site could not be reached.";
}
