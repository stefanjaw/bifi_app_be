import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export interface CrEinvoiceSettingsDocument extends mongoose.Document {
  proveedorSistemas?: string;
  haciendaUsername?: string;
  haciendaPassword?: string;
  certificateBase64?: string;
  economicActivityCode?: string;
  haciendaEnvironment?: "production" | "sandbox";
  codigoEstablecimiento?: string;
  codigoPuntoVenta?: string;
  emisorCedula?: string;
  emisorNombre?: string;
  emisorCorreo?: string;
}

const crEinvoiceSettingsSchema = new Schema(
  {
    proveedorSistemas: { type: String, required: false, default: "" },
    haciendaUsername: { type: String, required: false, default: "" },
    haciendaPassword: { type: String, required: false, default: "" },
    certificateBase64: { type: String, required: false, default: "" },
    economicActivityCode: { type: String, required: false, default: "" },
    haciendaEnvironment: {
      type: String,
      enum: ["production", "sandbox"],
      required: false,
      default: "sandbox",
    },
    codigoEstablecimiento: { type: String, required: false, default: "001" },
    codigoPuntoVenta: { type: String, required: false, default: "00001" },
    emisorCedula: { type: String, required: false, default: "" },
    emisorNombre: { type: String, required: false, default: "" },
    emisorCorreo: { type: String, required: false, default: "" },
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
