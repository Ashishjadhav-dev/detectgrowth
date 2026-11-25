import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP } from "node:net";
import type { WebsiteAudit } from "@/types/leads";

const privateNetworks = new BlockList();
for (const [address, cidr] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 3],
] as const) privateNetworks.addSubnet(address, cidr, "ipv4");

const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
for (const [address, cidr] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]] as const) {
  privateNetworks.addSubnet(address, cidr, "ipv6");
}

export class AuditTargetError extends Error {}

const maxBytes = 320 * 1024;

async function publicAddress(url: URL, signal: AbortSignal) {
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port) {
    throw new AuditTargetError("Enter a public HTTP or HTTPS website on its default port.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  const ip = isIP(host);
  if (!ip && (!host.includes(".") || /(?:^|\.)(localhost|local|internal|test|invalid|example|onion|arpa)$/i.test(host))) {
    throw new AuditTargetError("Enter a public website address.");
  }

  const addresses = ip ? [{ address: host, family: ip }] : await new Promise<Awaited<ReturnType<typeof resolveAll>>>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.throwIfAborted();
    signal.addEventListener("abort", abort, { once: true });
    resolveAll(host).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
  if (!addresses.length || addresses.some(({ address, family }) => family === 4
    ? privateNetworks.check(address, "ipv4")
    : !globalV6.check(address, "ipv6") || privateNetworks.check(address, "ipv6"))) {
    throw new AuditTargetError("The site must resolve to a public network address.");
  }
  return { host, ip, address: addresses.find((entry) => entry.family === 4)?.address ?? addresses[0].address };
}

const resolveAll = (host: string) => lookup(host, { all: true });

async function readPage(url: URL, signal: AbortSignal) {
  const { host, ip, address } = await publicAddress(url, signal);
  const protocol = url.protocol === "https:" ? https : http;
  return new Promise<{ headers: http.IncomingHttpHeaders; status: number; html: string }>((resolve, reject) => {
    // Connect to the verified address directly, retaining the original host for TLS and HTTP.
    const request = protocol.request({
      hostname: address, path: url.pathname + url.search, method: "GET", agent: false,
      servername: ip ? undefined : host, signal,
      headers: { Host: url.host, "User-Agent": "DetectGrowth/1.0 (website audit)", Accept: "text/html", "Accept-Encoding": "identity" },
    }, (response) => {
      const { headers, statusCode: status = 502 } = response;
      const complete = (html: string) => resolve({ headers, status, html });
      response.on("error", reject);
      if (status >= 300 && status < 400 || !/\b(?:text\/html|application\/xhtml\+xml)\b/i.test(headers["content-type"] ?? "") || headers["content-encoding"] && headers["content-encoding"] !== "identity") {
        complete("");
        response.destroy();
        return;
      }
      let length = 0;
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => {
        const remaining = maxBytes - length;
        chunks.push(chunk.subarray(0, remaining));
        length += Math.min(remaining, chunk.length);
        // Partial HTML cannot establish the absence of a tag.
        if (chunk.length > remaining) {
          complete("");
          response.destroy();
        }
      });
      response.on("end", () => complete(Buffer.concat(chunks).toString("utf8")));
    });
    request.on("error", reject);
    request.end();
  });
}

function metadataHas(html: string, field: string) {
  return (html.match(/<meta\b[^>]*>/gi) ?? []).some((tag) => {
    const name = tag.match(/\sname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    return (name?.[1] ?? name?.[2] ?? name?.[3])?.toLowerCase() === field;
  });
}

export async function inspectWebsite(target: URL): Promise<WebsiteAudit> {
  const signal = AbortSignal.timeout(8500);
  let url = target;
  for (let redirects = 0; redirects <= 4; redirects++) {
    const { headers, html, status } = await readPage(url, signal);
    if ([301, 302, 303, 307, 308].includes(status) && headers.location) {
      url = new URL(headers.location, url);
      continue;
    }
    const inspected = Boolean(html) && status >= 200 && status < 300;
    const head = html.split(/<\/head\s*>/i, 1)[0].replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
    const mobileReady = inspected ? metadataHas(head, "viewport") : null;
    const title = inspected ? (head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim().slice(0, 300) : "";
    const secure = url.protocol === "https:";
    const lastModified = headers["last-modified"] ?? null;
    return {
      checkedAt: new Date().toISOString(), status, title, secure, mobileReady, lastModified,
      changeSignals: [
        `Homepage returned HTTP ${status}`,
        secure ? "Final connection used HTTPS" : "Final connection used HTTP",
        ...(inspected ? [
          mobileReady ? "Mobile viewport declaration found" : "Mobile viewport declaration missing",
          metadataHas(head, "description") ? "Search description tag found" : "Search description tag missing",
        ] : ["Page metadata was unavailable for inspection"]),
      ],
    };
  }
  throw new Error("Too many redirects");
}
