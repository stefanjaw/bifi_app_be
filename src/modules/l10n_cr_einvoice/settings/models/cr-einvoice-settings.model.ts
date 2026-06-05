import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { CrEinvoiceSettingsDocument } from "@mongodb-types";

export type { CrEinvoiceSettingsDocument };

const crEinvoiceSettingsSchema = new Schema(
  {
    proveedorSistemas: { type: String, required: false, default: "" },
    haciendaUsername: { type: String, required: false, default: "" },
    haciendaPassword: { type: String, required: false, default: "" },
    certificateBase64: { type: String, required: false, default: "" },
    certificatePassword: { type: String, required: false, default: "" },
    haciendaEnvironment: {
      type: String,
      enum: ["production", "sandbox"],
      required: false,
      default: "sandbox",
    },
    codigoEstablecimiento: { type: String, required: false, default: "001" },
    codigoPuntoVenta: { type: String, required: false, default: "00001" },
    feVersion: { type: String, required: false, default: "4.4" },
    emisorCompanyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: false,
      autopopulate: { maxDepth: 2 },
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

crEinvoiceSettingsSchema.plugin(paginate);
crEinvoiceSettingsSchema.plugin(autopopulate);

export const crEinvoiceSettingsModel = mongoose.model<
  CrEinvoiceSettingsDocument,
  PaginateModel<CrEinvoiceSettingsDocument>
>("CrEinvoiceSettings", crEinvoiceSettingsSchema);
