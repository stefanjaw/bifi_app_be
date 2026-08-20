import { NextFunction, Request, Response } from "express";
import { UnauthorizedException, userStorage } from "../libraries";
import { ConnectionManager } from "../libraries/base-module/connection-manager";
import type { UserService, ApiKeyService } from "../../modules";
import { userModel } from "../../modules/users/models/user.model";
import admin from "firebase-admin";
import { FirebaseAppError } from "firebase-admin/app";

const ignoreEndpoints: { endpoint: string; method: string }[] = [
  { endpoint: "/api/templates", method: "GET" },
  { endpoint: "/api/health-check", method: "GET" },
  { endpoint: "/api/report-bug", method: "POST" },
  { endpoint: "/api/translations/scope", method: "GET" },
];

/**
 * Endpoints that must NOT be reached via an API key. These are self-scoped /
 * account-management routes where an external key would create a confusion vector;
 * they always require a Firebase Bearer token. When an `X-Api-Key` is presented
 * for one of these, the middleware falls through to the Firebase path, which fails
 * if no Bearer token is supplied (HTTP 401).
 */
const SENSITIVE_ENDPOINTS = new Set([
  "/api/api-keys",
  "/api/users/me",
  "/api/users/profile",
]);

/**
 * Parses the TENANT_DB_NAMES env var (comma-separated) into a Set for O(1) lookup.
 * Returns null when the variable is unset or empty — callers should treat this as
 * "allowlist disabled, header rejected fail-closed" when in production, or
 * "no allowlist configured, accept any" when in non-production (for dev convenience).
 */
function getAllowedDbNames(): Set<string> | null {
  const raw = process.env.TENANT_DB_NAMES;
  if (!raw || !raw.trim()) return null;
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * Middleware to authenticate requests using a Firebase Authentication token.
 * If the token is invalid, expired, or revoked, it will throw an UnauthorizedException.
 * If the user associated with the token is not found, it will create a new user with the provided information.
 * If the user is found but not active, it will throw an UnauthorizedException.
 * @param userService - The UserService instance to use for Firebase-token authentication.
 * @param apiKeyService - The ApiKeyService instance to use for `X-Api-Key` authentication.
 * @returns {(req: Request, res: Response, next: NextFunction) => Promise<void>}
 */
export function authenticateMiddleware(
  userService: UserService,
  apiKeyService: ApiKeyService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Set the user and token in the UserStore
    const storage = userStorage.getStore();

    if (
      ignoreEndpoints.some(
        (x) => req.path === x.endpoint && req.method === x.method,
      )
    ) {
      next();
      return;
    }

    // TODO: this is momentary — the upstream proxy should strip client-supplied
    // `dbname` headers and inject the tenant binding server-side. Until then,
    // validate the header against an allowlist (TENANT_DB_NAMES env var) so an
    // arbitrary value cannot silently instantiate a new database handle.
    const dbNameHeader: string = req.headers["dbname"] as string;

    if (dbNameHeader && storage) {
      const allowed = getAllowedDbNames();
      if (allowed !== null && !allowed.has(dbNameHeader)) {
        next(new UnauthorizedException("Unauthorized"));
        return;
      }
      // When allowlist is null (unset/empty), accept the header as before so
      // existing dev workflows keep working. Document that production must set
      // TENANT_DB_NAMES to fail-closed on unknown tenants.
      storage.dbName = dbNameHeader;
    }

    // API-key auth path — external clients (Postman, scripts, agents) authenticate
    // with an `X-Api-Key: bak_live_...` header instead of a Firebase ID token.
    // The dbname header above is shared, so tenant routing already applies here.
    // Sensitive endpoints are excluded: they require the Firebase Bearer path.
    const apiKey = req.headers["x-api-key"] as string | undefined;
    if (
      apiKey &&
      apiKey.startsWith("bak_live_") &&
      !SENSITIVE_ENDPOINTS.has(req.path)
    ) {
      try {
        // verifyKey already loads the owning user with roles+policies populated,
        // so the entire authorizeMiddleware RBAC system works unchanged.
        const keyUser = await apiKeyService.verifyKey(apiKey);
        if (!keyUser) {
          next(new UnauthorizedException("Invalid API key"));
          return;
        }

        if (storage) {
          storage.user = keyUser;
          storage.token = apiKey;
          storage.locale = keyUser.language || "en";
        }

        next();
        return;
      } catch (error) {
        console.error("API key authentication error:", error);
        next(new UnauthorizedException("Unauthorized"));
        return;
      }
    }

    // Get the token from the request headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new UnauthorizedException("Unauthorized"));
      return;
    }

    const token = authHeader.split(" ")[1];

    try {
      // Can produce an error if the token is invalid or expired
      const firebaseUser = await admin.auth().verifyIdToken(token);

      let user = (
        await userService.get(
          { authId: firebaseUser.uid },
          undefined,
          undefined,
          undefined,
          undefined,
        )
      )?.[0];

      // The user's Firebase uid (authId) was not found. Before creating a new
      // account, check whether one already exists for this email — if so, the
      // uid simply changed (re-created Firebase identity), so re-point that
      // account's authId instead of spawning a duplicate. The email match is
      // case-insensitive to align with the unique email index, otherwise a
      // casing difference would miss the existing account and the create below
      // would hit the unique-index duplicate-key error.
      // Bind the user model to the request's tenant DB (chosen via the `dbname`
      // header / userStorage) so the rebind find+update hit the SAME database
      // that userService.get/create use. Raw userModel would target the default
      // connection and could miss the existing account (or mutate the wrong DB).
      const boundUserModel = new ConnectionManager().bindModelToDb(userModel);

      const rebindExistingByEmail = async (email: string) => {
        const existing = await boundUserModel
          .findOne({ email })
          .collation({ locale: "en", strength: 2 });

        if (!existing) return undefined;

        await boundUserModel.updateOne(
          { _id: existing._id },
          { $set: { authId: firebaseUser.uid } },
        );

        return (
          await userService.get(
            { authId: firebaseUser.uid },
            undefined,
            undefined,
            undefined,
            undefined,
          )
        )?.[0];
      };

      if (!user && firebaseUser.email && firebaseUser.email_verified === true) {
        user = (await rebindExistingByEmail(firebaseUser.email))!;
      }

      if (!user) {
        // Auto-provisioning gate: by default, refuse unknown uids so an open
        // Firebase signup cannot silently mint an application account. Set
        // AUTO_PROVISION_EMAIL_DOMAINS (comma-separated) to allow self-provision
        // for specific email domains (e.g. "yourcompany.com").
        const allowedDomainsRaw =
          process.env.AUTO_PROVISION_EMAIL_DOMAINS || "";
        const allowedDomains = new Set(
          allowedDomainsRaw
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean),
        );
        const emailDomain = (firebaseUser.email || "")
          .split("@")[1]
          ?.toLowerCase();
        const mayAutoProvision =
          allowedDomains.size > 0 &&
          emailDomain !== undefined &&
          allowedDomains.has(emailDomain);

        if (!mayAutoProvision) {
          next(
            new UnauthorizedException(
              "Unauthorized — account not provisioned. Contact an administrator.",
            ),
          );
          return;
        }

        const [fName, lName] = (firebaseUser.name || " ").split(" ");

        try {
          user = await userService.create(
            {
              authId: firebaseUser.uid,
              provider: firebaseUser.firebase.sign_in_provider,
              username: firebaseUser.email || "Email not provided",
              email: firebaseUser.email || "Email not provided",
              picture: firebaseUser.picture,
              contactInformation: {
                email: firebaseUser.email || "Email not provided",
                phoneNumber: firebaseUser.phone_number || "Phone not provided",
                active: true,
                name: fName || "Name not provided",
                lastName: lName || "last name not provided",
                type: "individual",
              },
            },
            undefined,
          );
        } catch (createError) {
          // A case-different / concurrently-created account already owns this
          // email under the case-insensitive unique index — rebind it rather
          // than failing the login.
          if (
            (createError as { code?: number })?.code === 11000 &&
            firebaseUser.email &&
            firebaseUser.email_verified === true
          ) {
            user = (await rebindExistingByEmail(firebaseUser.email))!;
          }
          if (!user) throw createError;
        }
      }

      // Populate roles+policies for permission checks — only needed here (/me)
      // and in getById (user edit form). Plain get() no longer does this so that
      // user dropdowns don't over-fetch role data for every user.
      if (user) {
        await boundUserModel.populate(user, {
          path: "roles",
          populate: { path: "policies.policyId" },
        });

        // if user is found but not active, throw an error
        if (!user.active) {
          next(
            new UnauthorizedException(
              "Error authenticating, account is disabled",
            ),
          );
          return;
        }
      }

      if (storage) {
        storage.user = user;
        storage.token = token;
        storage.locale = user?.language || "en";
      }

      next();
    } catch (error) {
      console.error("Authentication error:", error);

      if (error instanceof FirebaseAppError) {
        switch (error.code) {
          case "auth/id-token-expired":
          case "auth/id-token-revoked":
            next(new UnauthorizedException("Token expired or revoked"));
            return;
          case "auth/invalid-id-token":
            next(new UnauthorizedException("Invalid token"));
            return;
          default:
            break;
        }
        // Handle Firebase authentication errors
        console.error("Firebase authentication error:", error);
      }
      next(new UnauthorizedException("Unauthorized"));
    }
  };
}
