import { ApiKeyDocument, UserDocument } from "@mongodb-types";
import { ClientSession, PaginateModel } from "mongoose";
import { PaginateResult } from "mongoose";
import crypto from "crypto";
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

/** scrypt derived-key length in bytes. */
const HASH_KEY_LENGTH = 64;

/** scrypt salt length in bytes. */
const SALT_BYTES = 16;

/** TTL for the in-memory verification cache, in milliseconds. (1.10) */
const CACHE_TTL_MS = 60_000;

/**
 * In-memory cache of successful verifications keyed by a fast SHA-256 of the
 * FULL raw key: `keyHash -> { user, expiresAt }`. Keying by the full key (rather
 * than the non-secret prefix) guarantees a modified suffix produces a cache miss
 * and falls through to full scrypt verification, so a forged key can never pass
 * via a warm prefix-only cache hit. Avoids a DB lookup + scrypt derivation on
 * every request for hot keys. Entries expire after {@link CACHE_TTL_MS}.
 * Trade-off: RBAC/role changes take effect within the TTL.
 */
const verifyCache = new Map<
  string,
  { user: UserDocument; expiresAt: number }
>();

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
    session?: ClientSession,
  ): Promise<{ doc: ApiKeyDocument; rawKey: string }> {
    const rawKey = `${KEY_PREFIX}${crypto
      .randomBytes(KEY_ENTROPY_BYTES)
      .toString("base64url")}`;
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
        expiresAt,
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

    // Warm cache hit within TTL — keyed by the FULL key hash, so a modified suffix
    // produces a miss and falls through to full scrypt verification below. Serves
    // without a DB lookup or scrypt derivation for verified repeat requests.
    const cached = verifyCache.get(keyHash);
    if (cached) {
      if (cached.expiresAt > Date.now()) return cached.user;
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
      verifyCache.set(keyHash, { user, expiresAt: Date.now() + CACHE_TTL_MS });
      verifyCachePrefix.set(prefix, keyHash);
    }
    return (user as UserDocument | null) ?? null;
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
