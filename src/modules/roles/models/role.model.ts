import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { RoleDocument } from "@mongodb-types";

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    policies: {
      type: [Schema.Types.ObjectId],
      ref: "Policy",
      autopopulate: true,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toObject: { virtuals: true }, // Include virtuals in toObject output
    toJSON: { virtuals: true }, // Include virtuals in toJSON output
  }
);

roleSchema.plugin(paginate);
roleSchema.plugin(autopopulate);

const roleModel = mongoose.model<RoleDocument, PaginateModel<RoleDocument>>(
  "Role",
  roleSchema
);

export { roleModel };
