import { existsSync, readdirSync } from "fs";
import * as nodePath from "path";

export function resolveChromiumPath(): string {
  try {
    const chromium = require("@sparticuz/chromium");
    if (chromium.executablePath && existsSync(chromium.executablePath)) {
      return chromium.executablePath;
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

/** Resolved once at module load */
export const CHROMIUM_EXECUTABLE = resolveChromiumPath();
console.log("Launching puppeteer with executable path:", CHROMIUM_EXECUTABLE);

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
