import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { SalesTargetDocument } from "@mongodb-types";

const salesTargetSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    salesperson: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email",
        maxDepth: 1,
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

salesTargetSchema.plugin(autopopulate);
salesTargetSchema.plugin(paginate);

const salesTargetModel = mongoose.model<
  SalesTargetDocument,
  PaginateModel<SalesTargetDocument>
>("SalesTarget", salesTargetSchema);

export { salesTargetModel };
