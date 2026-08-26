import { ApiKeyDocument, UserDocument } from "@mongodb-types";
import { ClientSession, PaginateModel } from "mongoose";
import { PaginateResult } from "mongoose";
import crypto from "crypto";
import dayjs from "dayjs";
import {
  BaseService,
  paginationOptions,
  orderByQuery,
  runTransaction,
  userStorage,
  ValidationException,
} from "../../../system";
import { apiKeyModel } from "../models/api-key.model";
import { userModel } from "../../users/models/user.model";

/**
 * Static prefix for all API keys. Used to route `X-Api-Key` header values to
 * this validation path and to bucket keys by type (like Stripe's sk_live_).
 */
const KEY_PREFIX = "bak_live_";

/**
 * Length of the non-secret prefix we persist and use for O(1) lookups.
 * The prefix is the `bak_live_` prefix plus the first 8 characters of entropy:
 * e.g. "bak_live_aB3xK9pQ" -> length 17.
 */
const KEY_PREFIX_LENGTH = KEY_PREFIX.length + 8;

/**
 * Pepper mixed into the scrypt input so a leaked raw key + DB hash cannot be
 * trivially replayed if the secret is not also compromised. Required — no
 * fallback (H12-style fail-closed behaviour).
 */
const PEPPER = process.env.API_KEY_HASH_PEPPER;

/** Number of random bytes of entropy in each raw key. */
const KEY_ENTROPY_BYTES = 32;

/**
 * Length of the base64url-encoded entropy string in each raw key. 32 bytes always
 * encode to exactly 43 base64url chars (no padding). It sits at positions 9-51 of
 * the key, so positions are deterministic for stamp extraction. (6.2)
 */
const ENTROPY_STRING_LENGTH = 43;

/** scrypt derived-key length in bytes. */
const HASH_KEY_LENGTH = 64;

/** scrypt salt length in bytes. */
const SALT_BYTES = 16;

/** Default lifetime of a key when no expiry is supplied (days). (4.1) */
const DEFAULT_EXPIRY_DAYS = 30;

/** Separator between the key entropy and the embedded expiry stamp. (6.1) */
const STAMP_SEPARATOR = "_";

/** Length of the expiry stamp suffix (`YYYYMMDDHHmm` or `NEVEREXPIRES`). (6.1) */
const STAMP_LENGTH = 12;

/** Stamp used for keys that never expire (not a parseable date). (6.1) */
export const NEVER_EXPIRE_STAMP = "NEVEREXPIRES";

/** TTL for the in-memory verification cache, in milliseconds. (1.10) */
const CACHE_TTL_MS = 60_000;

/**
 * In-memory cache of successful verifications keyed by a fast SHA-256 of the
 * FULL raw key: `keyHash -> { user, cacheExpiresAt, keyExpiresAt }`. Keying by
 * the full key (rather than the non-secret prefix) guarantees a modified suffix
 * produces a cache miss and falls through to full scrypt verification, so a
 * forged key can never pass via a warm prefix-only cache hit. Avoids a DB lookup
 * + scrypt derivation on every request for hot keys. `cacheExpiresAt` is when the
 * cache entry itself expires; `keyExpiresAt` is the key's REAL expiry (from the
 * DB doc) so an expired key is never served from a warm cache. Trade-off: RBAC /
 * role changes take effect within the cache TTL.
 */
interface VerifyCacheEntry {
  user: UserDocument;
  cacheExpiresAt: number;
  keyExpiresAt?: number;
}

const verifyCache = new Map<string, VerifyCacheEntry>();

/**
 * Secondary index `prefix -> keyHash` used to evict exactly one key's cached
 * verification on revoke. Since the cache is keyed by the full-key hash (which we
 * cannot recompute from the deleted record), this prefix index lets `delete()` drop
 * only the revoked key's entry without clearing every other cached key.
 */
const verifyCachePrefix = new Map<string, string>();

/**
 * Derives a fast, secret-free key fingerprint used to look up cached verifications.
 * A SHA-256 of the raw key uniquely binds the FULL key (so a wrong suffix misses)
 * without storing the raw key itself in memory.
 * @param rawKey - The full raw API key.
 * @returns The hex SHA-256 digest used as the cache key.
 */
function keyCacheHash(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Service managing API keys. Key material is generated once, hashed with
 * scrypt + a global pepper, and only the hash + a non-secret prefix are stored
 * (irretrievable model). All CRUD operations are self-scoped to the currently
 * authenticated user via {@link userStorage}.
 */
export class ApiKeyService extends BaseService<ApiKeyDocument> {
  constructor() {
    super({ model: apiKeyModel } as {
      model: PaginateModel<ApiKeyDocument>;
    });
  }

  /**
   * Returns the non-secret, stable prefix for a raw API key. The prefix is the
   * fixed `bak_live_` tag plus the first 8 chars of the key entropy, and is the
   * only part of the key persisted in plaintext (used for lookup and display).
   * @param rawKey - The full raw API key.
   * @returns The persisted prefix, e.g. "bak_live_aB3xK9pQ".
   */
  static getPrefix(rawKey: string): string {
    return rawKey.slice(0, KEY_PREFIX_LENGTH);
  }

  /**
   * Builds a fresh raw API key with the expiry embedded as a fixed-length suffix.
   * Format: `bak_live_<43-char-entropy>` + `_` + a 12-char stamp, where the stamp
   * is `YYYYMMDDHHmm` (expiring) or `NEVEREXPIRES` (never expires). The returned
   * key is 65 chars: entropy at positions 9-51, separator at 52, stamp at 53-64.
   * @param effectiveExpiry - The resolved expiry Date, or `undefined` for a never-expiring key.
   * @returns The full raw API key including the expiry stamp suffix.
   */
  static buildRawKey(effectiveExpiry?: Date): string {
    const entropy = crypto.randomBytes(KEY_ENTROPY_BYTES).toString("base64url");
    const stamp = effectiveExpiry
      ? dayjs(effectiveExpiry).format("YYYYMMDDHHmm")
      : NEVER_EXPIRE_STAMP;
    return `${KEY_PREFIX}${entropy}${STAMP_SEPARATOR}${stamp}`;
  }

  /**
   * Extracts the embedded expiry stamp from a raw key. The stamp is located by
   * FIXED POSITION (the 12 chars starting at index 53 in a stamped key), never by
   * splitting on `_` — that character is a valid base64url entropy char, so it
   * would be ambiguous. A stamped key is 65 chars; an old-format / unstamped key
   * (52 chars) or any other length returns null.
   * @param rawKey - The full raw API key.
   * @returns The 12-char stamp (`YYYYMMDDHHmm` or `NEVEREXPIRES`), or null when the key has no stamp.
   */
  static getExpiryStamp(rawKey: string): string | null {
    const tagLen = KEY_PREFIX.length; // "bak_live_" = 9
    const stampedLen =
      tagLen + ENTROPY_STRING_LENGTH + STAMP_SEPARATOR.length + STAMP_LENGTH; // 65
    if (rawKey.length >= stampedLen) {
      // Stamp starts right after the separator (tag + entropy + separator).
      return rawKey.slice(
        tagLen + ENTROPY_STRING_LENGTH + STAMP_SEPARATOR.length,
        stampedLen,
      );
    }
    return null;
  }

  /**
   * Generates a new raw API key, stores only its hash + prefix, and returns the
   * raw key exactly once (irretrievable model).
   * @param userId - The owner user id.
   * @param name - A human-friendly label for the key.
   * @param expiresAt - Optional expiry date after which the key is rejected.
   * @param session - Optional client session for the transaction.
   * @returns The persisted document plus the one-time `rawKey`.
   * @throws {Error} When `API_KEY_HASH_PEPPER` is not configured.
   */
  async generateKey(
    userId: string,
    name: string,
    expiresAt?: Date,
    expires?: boolean,
    session?: ClientSession,
  ): Promise<{ doc: ApiKeyDocument; rawKey: string }> {
    // Expiry resolution:
    //  - `expires === false` → key NEVER expires (persist no expiresAt).
    //  - otherwise → if an explicit `expiresAt` was provided, use it; else default
    //    to expiring 30 days from now (server-side single source of truth). (4.1)
    const effectiveExpiry =
      expires === false
        ? undefined
        : expiresAt ?? dayjs().add(DEFAULT_EXPIRY_DAYS, "day").toDate();

    // Raw key embeds the expiry stamp: `bak_live_<entropy>_YYYYMMDDHHmm`
    // (or `_NEVEREXPIRES` when the key never expires). The full key (including the
    // stamp) is what gets hashed, so the stamp is cryptographically bound. (6.1)
    const rawKey = ApiKeyService.buildRawKey(effectiveExpiry);
    const salt = crypto.randomBytes(SALT_BYTES).toString("hex");

    // Store as hex (not a raw Buffer) so verifyKey can re-derive and compare
    // with Buffer.from(doc.hashedKey, "hex"). Persisting the raw Buffer would,
    // via the schema's String cast, store the UTF-8 rendering of the binary
    // scrypt output, which is not hex and breaks the constant-time comparison.
    const hashedKey = this._hash(rawKey, salt).toString("hex");

    const doc = await this.create(
      {
        userId,
        name,
        prefix: ApiKeyService.getPrefix(rawKey),
        hashedKey,
        salt,
        expiresAt: effectiveExpiry,
        active: true,
      },
      session,
    );

    return { doc, rawKey };
  }

  /**
   * Verifies a raw API key by looking it up through its prefix, re-deriving the
   * scrypt hash, and comparing constant-time. On success loads and returns the
   * owning user (with roles + policies populated) so the caller can seed the
   * auth context; otherwise returns null.
   * @param rawKey - The submitted raw API key from the `X-Api-Key` header.
   * @returns The verified owner {@link UserDocument} (roles populated), or null when invalid/expired/inactive.
   * @throws {Error} When `API_KEY_HASH_PEPPER` is not configured.
   */
  async verifyKey(rawKey: string): Promise<UserDocument | null> {
    if (!rawKey || typeof rawKey !== "string") return null;
    if (!rawKey.startsWith(KEY_PREFIX)) return null;
    const prefix = ApiKeyService.getPrefix(rawKey);
    const keyHash = keyCacheHash(rawKey);

    // Pre-validate the embedded expiry stamp BEFORE cache/DB/scrypt. The stamp is
    // hash-bound (it is part of what gets hashed), so a forged/past date cannot
    // pass — tampering breaks the hash and the full verify below rejects it. This
    // is a fast-path optimization that rejects clearly-expired keys without a DB
    // lookup or scrypt derivation. `NEVEREXPIRES`/invalid stamps are skipped and
    // fall through (the DB remains the authority). (6.3)
    const stamp = ApiKeyService.getExpiryStamp(rawKey);
    if (stamp) {
      const stampDate = dayjs(stamp, "YYYYMMDDHHmm");
      if (stampDate.isValid() && stampDate.isBefore(dayjs())) return null;
    }

    // Warm cache hit within TTL — keyed by the FULL key hash, so a modified suffix
    // produces a miss and falls through to full scrypt verification below. Serves
    // without a DB lookup or scrypt derivation for verified repeat requests, but
    // ONLY if the key has not actually expired (keyExpiresAt is the key's real
    // expiry from the DB, not the cache's own TTL). (4.2)
    const cached = verifyCache.get(keyHash);
    if (cached) {
      const now = Date.now();
      const notExpired =
        cached.keyExpiresAt === undefined || cached.keyExpiresAt > now;
      if (cached.cacheExpiresAt > now && notExpired) return cached.user;
      verifyCache.delete(keyHash);
      verifyCachePrefix.delete(prefix);
    }

    const model = this.connectionManager.bindModelToDb(this.model);
    const doc = await model.findOne({ prefix });

    if (!doc || doc.active === false) return null;
    if (doc.expiresAt && doc.expiresAt.getTime() < Date.now()) return null;

    const candidate = this._hash(rawKey, doc.salt);
    const stored = Buffer.from(doc.hashedKey, "hex");
    if (
      candidate.length !== stored.length ||
      !crypto.timingSafeEqual(candidate, stored)
    ) {
      return null;
    }

    // Fire-and-forget last-used stamp; never blocks or fails the request.
    model
      .updateOne({ _id: doc._id }, { $set: { lastUsedAt: new Date() } })
      .exec()
      .catch(() => undefined);

    // Load the owner on the request's tenant DB and populate roles + policies so
    // authorizeMiddleware can evaluate RBAC without further queries. done via the
    // raw model (not UserService) to keep this module's dependency graph free of
    // firebase/contact imports and avoid a system ↔ modules circular dependency.
    const boundUserModel = this.connectionManager.bindModelToDb(userModel);
    const user = await boundUserModel.findById(doc.userId);
    if (user) {
      await boundUserModel.populate(user, {
        path: "roles",
        populate: { path: "policies.policyId" },
      });
    }

    if (user) {
      verifyCache.set(keyHash, {
        user,
        cacheExpiresAt: Date.now() + CACHE_TTL_MS,
        keyExpiresAt: doc.expiresAt?.getTime(),
      });
      verifyCachePrefix.set(prefix, keyHash);
    }
    return (user as UserDocument | null) ?? null;
  }

  /**
   * Renews (rotates) an API key: mints a brand-new raw key on the SAME document,
   * resets its expiry to now + 30 days, and invalidates the old secret immediately.
   * Self-scoped — a user can only renew their own keys. The new raw key is
   * stamped (Phase 6) and returned exactly once.
   * @param id - The API key record id to renew.
   * @param userId - The owner user id (from the authenticated context).
   * @param session - Optional client session for the transaction.
   * @returns The renewed document plus the one-time `rawKey`.
   * @throws {ValidationException} When the key is not found or not owned by the user.
   */
  async renewKey(
    id: string,
    userId: string,
    session?: ClientSession,
  ): Promise<{ doc: ApiKeyDocument; rawKey: string }> {
    return await runTransaction<{ doc: ApiKeyDocument; rawKey: string }>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        const existing = await model
          .findOne({ _id: id, userId })
          .session(newSession);

        if (!existing)
          throw new ValidationException(
            "API key not found or does not belong to the current user",
          );

        const oldPrefix = existing.prefix;
        const newExpiry = dayjs().add(DEFAULT_EXPIRY_DAYS, "day").toDate();
        const rawKey = ApiKeyService.buildRawKey(newExpiry);
        const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
        const hashedKey = this._hash(rawKey, salt).toString("hex");

        const doc = await model
          .findByIdAndUpdate(
            existing._id,
            {
              prefix: ApiKeyService.getPrefix(rawKey),
              hashedKey,
              salt,
              expiresAt: newExpiry,
              active: true,
            },
            { new: true, session: newSession },
          )
          .session(newSession);

        if (!doc) throw new ValidationException("Failed to renew API key");

        // Old secret stops working immediately: its prefix no longer matches the
        // rotated doc, and any cached verification for it must be evicted too.
        const cacheKeyHash = verifyCachePrefix.get(oldPrefix);
        if (cacheKeyHash) verifyCache.delete(cacheKeyHash);
        verifyCachePrefix.delete(oldPrefix);

        return { doc, rawKey };
      },
    );
  }

  /**
   * Override to self-scope reads to the authenticated user: a user may only
   * fetch their own API keys.
   * @param searchParams - Search/filter params.
   * @param paginationOptions - Pagination options.
   * @param orderBy - Order-by query.
   * @param count - Count-only flag.
   * @param session - Optional client session.
   * @returns The user-scoped records or count.
   */
  override async get(
    searchParams: Record<string, any>,
    paginationOptions: undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined,
  ): Promise<ApiKeyDocument[]>;
  override async get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions & { paginate: true },
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined,
  ): Promise<PaginateResult<ApiKeyDocument>>;
  override async get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions | undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined = undefined,
  ): Promise<PaginateResult<ApiKeyDocument> | ApiKeyDocument[]> {
    const userId = userStorage.getStore()?.user?._id;
    if (!userId) throw new ValidationException("Authenticated user not found");

    const scopedParams: Record<string, any> = {
      ...searchParams,
      userId,
    };

    return super.get(
      scopedParams,
      paginationOptions as any,
      orderBy,
      count,
      session,
    );
  }

  /**
   * Override to self-scope a single read: the requested key must belong to the
   * authenticated user.
   * @param id - The API key record id.
   * @param session - Optional client session.
   * @returns The owned document, or undefined if not found / not owned.
   */
  override async getById(
    id: string,
    session: ClientSession | undefined,
  ): Promise<ApiKeyDocument | undefined> {
    return await runTransaction<ApiKeyDocument | undefined>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);
        const userId = userStorage.getStore()?.user?._id;
        const doc = await model
          .findOne({ _id: id, userId })
          .session(newSession);
        return (doc as ApiKeyDocument | null) ?? undefined;
      },
    );
  }

  /**
   * Override to enforce self-scoped revoke (hard-delete): a user may only
   * remove their own keys. Since only a hash is stored, a revoked hash has no
   * value, so the record is physically deleted.
   * @param _id - The API key record id to revoke.
   * @param session - Optional client session.
   * @returns True when the key was removed.
   * @throws {ValidationException} When the key is not found or not owned by the user.
   */
  override async delete(
    _id: string,
    session: ClientSession | undefined,
  ): Promise<boolean> {
    return await runTransaction<boolean>(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);
      const userId = userStorage.getStore()?.user?._id;

      const record = await model
        .findOneAndDelete({ _id, userId })
        .session(newSession);

      if (!record)
        throw new ValidationException(
          "API key not found or does not belong to the current user",
        );

      // A revoked key must stop working immediately, without evicting every other
      // cached key. Locate this key's entry via the prefix index and drop only it.
      const keyHash = verifyCachePrefix.get(record.prefix);
      if (keyHash) verifyCache.delete(keyHash);
      verifyCachePrefix.delete(record.prefix);

      return true;
    });
  }

  /**
   * Derives the stored hash for a raw key using scrypt with the given salt and
   * the global pepper.
   * @param rawKey - The full raw API key.
   * @param salt - The stored per-key salt (hex string).
   * @returns The scrypt key as a Buffer (used for storage as hex and for verification).
   */
  private _hash(rawKey: string, salt: string): Buffer {
    if (!PEPPER) {
      throw new Error(
        "API_KEY_HASH_PEPPER must be set in .env — refusing to sign API keys without it.",
      );
    }
    return crypto.scryptSync(rawKey + PEPPER, salt, HASH_KEY_LENGTH);
  }
}
