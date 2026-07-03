import { AssetTypeDocument } from "@mongodb-types";
import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";

const assetTypeSchema = new Schema(
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

assetTypeSchema.plugin(paginate);

const assetTypeModel = mongoose.model<
  AssetTypeDocument,
  PaginateModel<AssetTypeDocument>
>("AssetType", assetTypeSchema);

export { assetTypeModel };
