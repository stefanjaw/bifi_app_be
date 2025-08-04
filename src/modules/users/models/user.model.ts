import { UserDocument } from "@mongodb-types";
import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";

const userSchema = new Schema(
  {
    authId: {
      type: String,
      required: true,
      isUnique: true,
    },
    provider: {
      type: String,
      enum: ["google.com", "password"],
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

userSchema.plugin(paginate);

const userModel = mongoose.model<UserDocument, PaginateModel<UserDocument>>(
  "User",
  userSchema
);

export { userModel };
