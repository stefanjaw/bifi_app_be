import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";

const assetConditionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

assetConditionSchema.plugin(paginate);

// Partial unique index: enforces unique names only among active records,
// allowing soft-deleted (active: false) records to share the same name.
assetConditionSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);

const assetConditionModel = mongoose.model<any, PaginateModel<any>>(
  "AssetCondition",
  assetConditionSchema,
);

export { assetConditionModel };
