import { NextFunction, Request, Response } from "express";
import { UnauthorizedException, UserStore } from "../libraries";
import { UserService } from "../../modules";
import admin from "firebase-admin";
import { FirebaseAppError } from "firebase-admin/app";

const ignoreEndpoints: string[] = [];

export function authenticateMiddleware(userService: UserService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (ignoreEndpoints.some((x) => req.path.includes(x))) {
      next();
      return;
    }

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
          undefined
        )
      )?.[0];

      if (!user)
        user = await userService.create(
          {
            authId: firebaseUser.uid,
            provider: firebaseUser.firebase.sign_in_provider,
            username: firebaseUser.name || firebaseUser.email,
            email: firebaseUser.email,
            picture: firebaseUser.picture,
          },
          undefined
        );

      // Set the user and token in the UserStore
      UserStore.getInstance().user = user;
      UserStore.getInstance().token = token;

      next();
    } catch (error) {
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
