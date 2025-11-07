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
      // unique: true,
    },
    email: {
      type: String,
      required: true,
      // unique: true,
    },
    // is the picture brought from firebase
    picture: {
      type: String,
      required: false,
    },
    // is the picture uploaded by the user
    uploadedPictureId: {
      type: mongoose.Types.ObjectId,
      autopopulate: false,
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
    contactId: {
      type: mongoose.Types.ObjectId,
      ref: "Contact",
      autopopulate: {
        maxDepth: 1,
      },
      required: false,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

userSchema.plugin(paginate);
userSchema.plugin(autopopulate);

const userModel = mongoose.model<UserDocument, PaginateModel<UserDocument>>(
  "User",
  userSchema
);

export { userModel };
