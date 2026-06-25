import { existsSync, readdirSync } from "fs";
import * as nodePath from "path";

let _resolvedPath: string | null = null;

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

  throw new Error("Chromium not found. Install via Nix or set CHROMIUM_PATH.");
}

/** Lazy-resolved Chromium path — cached after first call */
export async function getChromiumExecutablePath(): Promise<string> {
  if (_resolvedPath) return _resolvedPath;
  _resolvedPath = await resolveChromiumPath();
  console.log(`Resolved Chromium path: ${_resolvedPath}`);
  return _resolvedPath;
}

/**
 * Default Puppeteer launch arguments.
 * Merges `@sparticuz/chromium` args (if available) with sandbox flags.
 */
export function getLaunchArgs(): string[] {
  const base = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
  ];

  try {
    const chromium = require("@sparticuz/chromium");
    return [...chromium.args, ...base];
  } catch {
    return base;
  }
}
