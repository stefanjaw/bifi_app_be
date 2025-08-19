import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { PolicyDocument } from "@mongodb-types";

const policySchema = new Schema(
  {
    resource: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "read", "update", "delete"],
      required: true,
    },
    conditions: {
      type: [
        {
          key: {
            type: String,
            required: true,
          },
          operator: {
            type: String,
            enum: ["==", "!=", ">", "<", "in"],
            required: true,
          },
          value: {
            type: Schema.Types.Mixed, // Allows any type, including literals or user references
            required: true,
          },
        },
      ],
      default: [],
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

policySchema.plugin(paginate);
policySchema.plugin(autopopulate);

const policyModel = mongoose.model<
  PolicyDocument,
  PaginateModel<PolicyDocument>
>("Policy", policySchema);

export { policyModel };
