import { existsSync, readdirSync } from "fs";
import * as nodePath from "path";
import type { Page } from "puppeteer";
import { InternalServerException } from "../exceptions/service-exception";

let _resolvedPath: string | null = null;

/**
 * Resolves the Chromium executable path for Puppeteer.
 * Checks (in order): @sparticuz/chromium, PUPPETEER_EXECUTABLE_PATH env, CHROMIUM_PATH env, PATH lookup.
 * @returns The resolved filesystem path to the Chromium executable.
 */
export async function resolveChromiumPath(): Promise<string> {
  try {
    const chromium = require("@sparticuz/chromium");
    const path = await chromium.executablePath();
    if (path && existsSync(path)) {
      return path;
    }
  } catch {}

  if (
    process.env.PUPPETEER_EXECUTABLE_PATH &&
    existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)
  ) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }

  for (const dir of (process.env.PATH || "").split(":")) {
    const p = nodePath.join(dir, "chromium");
    if (existsSync(p)) return p;
  }

  try {
    const entries = readdirSync("/nix/store");
    const found = entries.find((e) => /-chromium-/.test(e));
    if (found) return `/nix/store/${found}/bin/chromium`;
  } catch {}

  throw new InternalServerException(
    "Chromium not found. Install via Nix or set CHROMIUM_PATH.",
  );
}

/** Lazy-resolved Chromium path — cached after first call */
export async function getChromiumExecutablePath(): Promise<string> {
  if (_resolvedPath) return _resolvedPath;
  _resolvedPath = await resolveChromiumPath();
  return _resolvedPath;
}

/**
 * Default Puppeteer launch arguments.
 * Merges `@sparticuz/chromium` args (if available) with sandbox-safe flags.
 * `--no-sandbox` is intentionally NOT included — the container must be run
 * with the kernel capabilities Chrome needs (`--cap-add=SYS_ADMIN` or a
 * seccomp profile) rather than disabling the sandbox. See C8.
 */
export function getLaunchArgs(): string[] {
  const base = [
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
  ];

  try {
    const chromium = require("@sparticuz/chromium");
    // @sparticuz/chromium args already exclude --no-sandbox for Lambda environments.
    // For containerized deployments, add SYS_ADMIN capability or a seccomp profile.
    return [...chromium.args, ...base];
  } catch {
    return base;
  }
}

/**
 * Checks whether a hostname belongs to a private/internal IP range.
 * Used by {@link blockPrivateNetworkRequests} to prevent SSRF from
 * user-authored content rendered in Chrome (C8).
 * @param hostname - The hostname to check.
 * @returns True if the hostname is private, loopback, link-local, or cloud metadata.
 */
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "0.0.0.0"
  )
    return true;

  // RFC 1918 + link-local + cloud metadata
  if (
    h.startsWith("10.") ||
    h.startsWith("192.168.") ||
    h === "169.254.169.254" || // AWS/GCP metadata
    h === "metadata.google.internal" || // GCP metadata
    h.endsWith(".internal") ||
    h.endsWith(".local")
  )
    return true;

  // 172.16.0.0/12
  if (h.startsWith("172.")) {
    const second = parseInt(h.split(".")[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

/**
 * Intercepts all network requests on a Puppeteer page and blocks any
 * targeting private, loopback, link-local, or cloud-metadata hostnames.
 * Prevents SSRF when rendering user-authored HTML in Chrome (C8).
 *
 * Must be called after `browser.newPage()` and before `page.setContent()`.
 * @param page - The Puppeteer page to protect.
 */
export async function blockPrivateNetworkRequests(
  page: Page,
): Promise<void> {
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    try {
      const url = new URL(req.url());
      if (isPrivateHost(url.hostname)) {
        req.abort("blockedbyclient").catch(() => {});
      } else {
        req.continue().catch(() => {});
      }
    } catch {
      // Invalid URL — abort as a safety measure
      req.abort("blockedbyclient").catch(() => {});
    }
  });
}
