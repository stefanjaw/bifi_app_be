import crypto from "crypto";

const SECRET =
  process.env.EMAIL_TOKEN_SECRET ||
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  "bifi-email-marketing-default-secret";

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return base64url(
    crypto.createHmac("sha256", SECRET).update(payload).digest(),
  );
}

export interface UnsubscribePayload {
  subscriberId: string;
  campaignId?: string;
}

/**
 * Creates a signed, URL-safe unsubscribe token (payload.signature).
 * @param payload - The unsubscribe payload containing subscriberId and optional campaignId.
 * @returns The URL-safe token string in format "{payload}.{signature}".
 */
export function createUnsubscribeToken(payload: UnsubscribePayload): string {
  const json = JSON.stringify(payload);
  const encoded = base64url(json);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

/**
 * Verifies an unsubscribe token and returns its payload, or null when invalid.
 * @param token - The URL-safe unsubscribe token string.
 * @returns The parsed UnsubscribePayload if valid, or null if tampered/expired.
 */
export function verifyUnsubscribeToken(
  token: string,
): UnsubscribePayload | null {
  if (!token || typeof token !== "string") return null;
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
    return JSON.parse(json) as UnsubscribePayload;
  } catch {
    return null;
  }
}
