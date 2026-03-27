import { NextFunction, Request, Response } from "express";
import { UnauthorizedException, userStorage } from "../libraries";
import { UserService } from "../../modules";
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

      // if user is found but not active, throw an error
      if (user && !user.active) {
        next(
          new UnauthorizedException(
            "Error authenticating, account is disabled",
          ),
        );
        return;
      }

      if (!user) {
        const [fName, lName] = (firebaseUser.name || " ").split(" ");

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
