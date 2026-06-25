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
    confirmed: {
      type: Boolean,
      default: false,
    },
    roles: {
      type: [mongoose.Types.ObjectId],
      ref: "Role",
      autopopulate: false,
      required: true,
    },
    contactId: {
      type: mongoose.Types.ObjectId,
      ref: "Contact",
      autopopulate: {
        select: "name lastName email type active",
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

// Case-insensitive unique index on email so the same address can never spawn
// duplicate accounts (collation strength 2 = case-insensitive comparison).
userSchema.index(
  { email: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    name: "email_unique_ci",
  }
);

userSchema.plugin(paginate);
userSchema.plugin(autopopulate);

const userModel = mongoose.model<UserDocument, PaginateModel<UserDocument>>(
  "User",
  userSchema
);

export { userModel };
