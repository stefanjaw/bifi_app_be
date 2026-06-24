import { NextFunction, Request, Response } from "express";
import { UnauthorizedException, userStorage } from "../libraries";
import { ConnectionManager } from "../libraries/base-module/connection-manager";
import { UserService } from "../../modules";
import { userModel } from "../../modules/users/models/user.model";
import admin from "firebase-admin";
import { FirebaseAppError } from "firebase-admin/app";

const ignoreEndpoints: { endpoint: string; method: string }[] = [
  { endpoint: "/templates", method: "GET" },
  { endpoint: "/health-check", method: "GET" },
  { endpoint: "/report-bug", method: "POST" },
];

/**
 * Middleware to authenticate requests using a Firebase Authentication token.
 * If the token is invalid, expired, or revoked, it will throw an UnauthorizedException.
 * If the user associated with the token is not found, it will create a new user with the provided information.
 * If the user is found but not active, it will throw an UnauthorizedException.
 * @param {UserService} userService - The UserService instance to use for authentication.
 * @returns {(req: Request, res: Response, next: NextFunction) => Promise<void>}
 */
export function authenticateMiddleware(userService: UserService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Set the user and token in the UserStore
    const storage = userStorage.getStore();

    if (
      ignoreEndpoints.some(
        (x) => req.path.includes(x.endpoint) && req.method === x.method,
      )
    ) {
      next();
      return;
    }

    // TODO: this is momentary
    const dbNameHeader: string = req.headers["dbname"] as string;

    if (dbNameHeader && storage) {
      storage.dbName = dbNameHeader;
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

      if (!user && firebaseUser.email) {
        user = (await rebindExistingByEmail(firebaseUser.email))!;
      }

      if (!user) {
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
            firebaseUser.email
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
