import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export enum TaxType {
  SALES = "sales",
  PURCHASE = "purchase",
}

export enum CrCodigoImpuesto {
  IVA = "01",
  SELECTIVO_CONSUMO = "02",
  UNICO_COMBUSTIBLES = "03",
  ESPECIFICO_BEBIDAS_ALCOHOLICAS = "04",
  ESPECIFICO_BEBIDAS_ENVASADAS = "05",
  PRODUCTOS_TABACO = "06",
  IVA_CALCULO_ESPECIAL = "07",
  IVA_BIENES_USADOS = "08",
  ESPECIFICO_CEMENTO = "12",
  OTROS = "99",
}

export enum CrCodigoTarifa {
  NO_SUJETO = "01",
  REDUCIDA_1 = "02",
  REDUCIDA_2 = "03",
  REDUCIDA_4 = "04",
  TRANSITORIO_0 = "05",
  TRANSITORIO_4 = "06",
  TRANSITORIO_8 = "07",
  GENERAL_13 = "08",
  REDUCIDA_2_LEY9635 = "09",
  EXENTO = "10",
  NO_SUJETO_ART9BIS = "11",
  REDUCIDA_1_CANASTA = "13",
}

export interface TaxDocument extends mongoose.Document {
  name: string;
  taxType: TaxType;
  percentage: number;
  accountId: any;
  active: boolean;
  crCodigo?: string;
  crCodigoTarifa?: string;
  crTarifa?: number;
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
    crCodigo: {
      type: String,
      enum: Object.values(CrCodigoImpuesto),
      required: false,
    },
    crCodigoTarifa: {
      type: String,
      enum: Object.values(CrCodigoTarifa),
      required: false,
    },
    crTarifa: { type: Number, required: false },
  },
  { timestamps: true }
);

taxSchema.plugin(paginate);
taxSchema.plugin(autopopulate);

export const taxModel = mongoose.model<TaxDocument, PaginateModel<TaxDocument>>(
  "Tax",
  taxSchema
);
