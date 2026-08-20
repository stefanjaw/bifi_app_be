import { ApiKeyDocument } from "@mongodb-types";
import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const apiKeySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Non-secret, stable key prefix used for O(1) lookup and display (e.g. "bak_live_aB3xK9pQ")
    prefix: {
      type: String,
      required: true,
    },
    // One-way scrypt hash of the raw key + pepper. The raw key is never stored.
    hashedKey: {
      type: String,
      required: true,
    },
    // Salt used to compute hashedKey, stored alongside so the hash can be re-verified.
    salt: {
      type: String,
      required: true,
    },
    lastUsedAt: {
      type: Date,
      required: false,
    },
    expiresAt: {
      type: Date,
      required: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

// Unique index on the non-secret prefix so keys can be located without scanning the collection.
apiKeySchema.index({ prefix: 1 }, { unique: true });

apiKeySchema.plugin(paginate);
apiKeySchema.plugin(autopopulate);

const apiKeyModel = mongoose.model<
  ApiKeyDocument,
  PaginateModel<ApiKeyDocument>
>("ApiKey", apiKeySchema);

export { apiKeyModel };
