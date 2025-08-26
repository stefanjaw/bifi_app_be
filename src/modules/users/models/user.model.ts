import { UserDocument } from "@mongodb-types";
import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

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
    picture: {
      type: String,
      required: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    roles: {
      type: [mongoose.Types.ObjectId],
      ref: "Role",
      autopopulate: true,
      required: true,
    },
    // name: {
    //   type: String,
    //   required: true,
    // },
    // lastName: {
    //   type: String,
    //   required: true,
    // },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

userSchema.plugin(paginate);
userSchema.plugin(autopopulate);

const userModel = mongoose.model<UserDocument, PaginateModel<UserDocument>>(
  "User",
  userSchema
);

export { userModel };
