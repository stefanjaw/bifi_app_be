import { Schema, Type } from "@google/genai";
import { ShippingStage, ShippingStatus } from "./shipping.model";
import { invoiceSchema } from "./invoice.schema";

export const shippingSchema: Schema = {
  type: Type.OBJECT,
  required: ["name", "origin", "destination", "status", "stage", "invoices"],
  properties: {
    name: { type: Type.STRING },
    origin: {
      type: Type.STRING,
      description: "Country code ISO 3166-1 alpha-2",
    },
    destination: {
      type: Type.STRING,
      description: "Country code ISO 3166-1 alpha-2",
    },
    status: { type: Type.STRING, enum: Object.values(ShippingStatus) },
    stage: { type: Type.STRING, enum: Object.values(ShippingStage) },
    invoices: {
      type: Type.ARRAY,
      items: invoiceSchema,
    },
  },
};
