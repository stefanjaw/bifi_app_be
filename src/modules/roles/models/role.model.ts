import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { RoleDocument } from "@mongodb-types";

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    policies: {
      type: [
        {
          policyId: {
            type: Schema.Types.ObjectId,
            ref: "Policy",
            autopopulate: true,
            required: true,
          },
          actions: [
            {
              type: String,
              enum: ["create", "read", "update", "delete"],
              required: true,
            },
          ],
        },
      ],
      required: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toObject: { virtuals: true }, // Include virtuals in toObject output
    toJSON: { virtuals: true }, // Include virtuals in toJSON output
    timestamps: true,
  },
);

roleSchema.plugin(paginate);
roleSchema.plugin(autopopulate);

const roleModel = mongoose.model<RoleDocument, PaginateModel<RoleDocument>>(
  "Role",
  roleSchema,
);

export { roleModel };
