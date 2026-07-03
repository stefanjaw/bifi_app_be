import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export interface MedioPagoDocument extends mongoose.Document {
  code: string;
  description: string;
  active: boolean;
}

const medioPagoSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

medioPagoSchema.plugin(paginate);
medioPagoSchema.plugin(autopopulate);

export const medioPagoModel = mongoose.model<
  MedioPagoDocument,
  PaginateModel<MedioPagoDocument>
>("CrMedioPago", medioPagoSchema);
