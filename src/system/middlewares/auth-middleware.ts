import { NextFunction, Request, Response } from "express";
import { runTransaction, UnauthorizedException } from "../libraries";
import { UserService } from "../../modules";
import { UserDocument } from "@mongodb-types";
import admin from "firebase-admin";

const ignoreEndpoints = ["/products"];

export function authMiddleware(userService: UserService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (ignoreEndpoints.some((x) => req.path.includes(x))) {
      console.log(req.path);
      next();
      return;
    }

    const token = req.headers.authorization;

    if (!token) {
      next(new UnauthorizedException("Unauthorized"));
      return;
    }

    const firebaseUser = await admin.auth().verifyIdToken(token);

    try {
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
                username: firebaseUser.name,
                email: firebaseUser.email,
                name: firebaseUser.name,
                lastName: firebaseUser.last_name || "",
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
    }
  };
}
