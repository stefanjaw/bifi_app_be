import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export enum TaxType {
  SALES = "sales",
  PURCHASE = "purchase",
}

export interface TaxDocument extends mongoose.Document {
  name: string;
  taxType: TaxType;
  percentage: number;
  accountId: any;
  active: boolean;
}

const taxSchema = new Schema(
  {
    name: { type: String, required: true },
    taxType: {
      type: String,
      enum: Object.values(TaxType),
      required: true,
    },
    percentage: { type: Number, required: true, min: 0 },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      autopopulate: {
        select: "code name",
        maxDepth: 1,
      },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

taxSchema.plugin(paginate);
taxSchema.plugin(autopopulate);

export const taxModel = mongoose.model<TaxDocument, PaginateModel<TaxDocument>>(
  "Tax",
  taxSchema
);
