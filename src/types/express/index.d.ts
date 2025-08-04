import { UserDocument } from "@mongodb-types";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      token?: string;
    }
  }
}
