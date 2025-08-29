import { NextFunction, Request, Response } from "express";
import { runTransaction, UnauthorizedException } from "../libraries";
import { UserService } from "../../modules";
import { UserDocument } from "@mongodb-types";
import admin from "firebase-admin";
import { FirebaseAppError } from "firebase-admin/app";

const ignoreEndpoints: string[] = [];

export function authMiddleware(userService: UserService) {
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

      const user = await runTransaction<UserDocument>(
        undefined,
        async (newSession) => {
          let user: UserDocument;

          user = (
            await userService.get(
              { authId: firebaseUser.uid },
              undefined,
              undefined,
              undefined,
              newSession
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
              newSession
            );

          return user;
        }
      );

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      next(error);
      // if (error instanceof FirebaseAppError) {
      //   switch (error.code) {
      //     case "auth/id-token-expired":
      //     case "auth/id-token-revoked":
      //       next(new UnauthorizedException("Token expired or revoked"));
      //       return;
      //     case "auth/invalid-id-token":
      //       next(new UnauthorizedException("Invalid token"));
      //       return;
      //     default:
      //       break;
      //   }
      //   // Handle Firebase authentication errors
      //   console.error("Firebase authentication error:", error);
      // }
      // next(new UnauthorizedException("Unauthorized"));
    }
  };
}
