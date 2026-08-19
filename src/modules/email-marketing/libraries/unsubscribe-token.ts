import crypto from "crypto";

/** HMAC secret for signing unsubscribe tokens. Required — no fallbacks. (H12) */
const SECRET = process.env.EMAIL_TOKEN_SECRET;

/** Tokens are valid for 30 days from issuance. */
const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  if (!SECRET) {
    throw new Error(
      "EMAIL_TOKEN_SECRET must be set in .env — refusing to sign tokens without it. (H12)",
    );
  }
  return base64url(
    crypto.createHmac("sha256", SECRET).update(payload).digest(),
  );
}

export interface UnsubscribePayload {
  subscriberId: string;
  campaignId?: string;
  /** Tenant database name — used by public routes to resolve the correct DB. (H11) */
  dbName?: string;
  /** Issued-at timestamp (ms since epoch). Tokens older than 30 days are rejected. (H12) */
  iat: number;
}

/**
 * Creates a signed, URL-safe unsubscribe token (payload.signature).
 * @param payload - The unsubscribe payload. `iat` is set automatically if not provided.
 * @returns The URL-safe token string in format "{payload}.{signature}".
 */
export function createUnsubscribeToken(
  payload: Omit<UnsubscribePayload, "iat"> & { iat?: number },
): string {
  const full: UnsubscribePayload = {
    ...payload,
    iat: payload.iat ?? Date.now(),
  };
  const json = JSON.stringify(full);
  const encoded = base64url(json);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

/**
 * Verifies an unsubscribe token and returns its payload, or null when invalid.
 * Rejects tokens that are tampered with or older than 30 days. (H12)
 * @param token - The URL-safe unsubscribe token string.
 * @returns The parsed UnsubscribePayload if valid, or null if tampered/expired.
 */
export function verifyUnsubscribeToken(
  token: string,
): UnsubscribePayload | null {
  if (!token || typeof token !== "string") return null;
  if (!SECRET) {
    // Refuse to operate without a secret — fail closed.
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const json = Buffer.from(
      encoded.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf-8");
    const payload = JSON.parse(json) as UnsubscribePayload;
    // Reject if iat is missing (old tokens) or token is expired. (H12)
    if (typeof payload.iat !== "number") return null;
    if (Date.now() - payload.iat > TOKEN_MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Signs an arbitrary string value using the same HMAC secret.
 * Used for click-tracking URL signing (H13) and tracking DB resolution (H11).
 * @param value - The string to sign.
 * @returns The HMAC-SHA256 signature as a base64url string.
 */
export function signValue(value: string): string {
  return sign(value);
}

/**
 * Verifies an HMAC signature against an arbitrary string value.
 * @param value - The original string.
 * @param sig - The signature to verify.
 * @returns True if the signature is valid.
 */
export function verifySignature(value: string, sig: string): boolean {
  if (!SECRET) return false;
  try {
    const expected = sign(value);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
