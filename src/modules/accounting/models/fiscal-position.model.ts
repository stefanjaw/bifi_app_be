import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export interface FiscalPositionDocument extends mongoose.Document {
  name: string;
  active: boolean;
  taxMappings: { fromTaxId: any; toTaxId: any }[];
  accountMappings: { fromAccountId: any; toAccountId: any }[];
}

const taxMappingSchema = new Schema(
  {
    fromTaxId: { type: Schema.Types.ObjectId, ref: "Tax", required: true },
    toTaxId: { type: Schema.Types.ObjectId, ref: "Tax", required: true },
  },
  { _id: false }
);

const accountMappingSchema = new Schema(
  {
    fromAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    toAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  { _id: false }
);

const fiscalPositionSchema = new Schema(
  {
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
    taxMappings: { type: [taxMappingSchema], default: [] },
    accountMappings: { type: [accountMappingSchema], default: [] },
  },
  { timestamps: true }
);

fiscalPositionSchema.plugin(paginate);
fiscalPositionSchema.plugin(autopopulate);

export const fiscalPositionModel = mongoose.model<
  FiscalPositionDocument,
  PaginateModel<FiscalPositionDocument>
>("FiscalPosition", fiscalPositionSchema);
