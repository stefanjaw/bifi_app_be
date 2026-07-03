import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export interface CondicionVentaDocument extends mongoose.Document {
  code: string;
  description: string;
  active: boolean;
}

const condicionVentaSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

condicionVentaSchema.plugin(paginate);
condicionVentaSchema.plugin(autopopulate);

export const condicionVentaModel = mongoose.model<
  CondicionVentaDocument,
  PaginateModel<CondicionVentaDocument>
>("CrCondicionVenta", condicionVentaSchema);
