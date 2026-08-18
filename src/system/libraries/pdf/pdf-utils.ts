import { existsSync, readdirSync } from "fs";
import * as nodePath from "path";
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
