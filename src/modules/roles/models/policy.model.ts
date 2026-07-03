import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { PolicyDocument } from "@mongodb-types";

const policySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["view", "menu", "model"],
      required: true,
      default: "model",
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
    timestamps: true,
  },
);

policySchema.plugin(paginate);
policySchema.plugin(autopopulate);

const policyModel = mongoose.model<
  PolicyDocument,
  PaginateModel<PolicyDocument>
>("Policy", policySchema);

export { policyModel };
