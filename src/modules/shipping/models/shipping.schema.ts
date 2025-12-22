import { Schema, Type } from "@google/genai";
import { ShippingStage, ShippingStatus } from "./shipping.model";
import { invoiceGenAISchema } from "./invoice.schema";

export const shippingGenAISchema: Schema = {
  type: Type.OBJECT,
  required: ["name", "origin", "destination", "status", "stage", "invoices"],
  properties: {
    name: { type: Type.STRING },
    origin: {
      type: Type.STRING,
      description: "Mongodb ID of Country model if exists",
    },
    destination: {
      type: Type.STRING,
      description: "Mongodb ID of Country model if exists",
    },
    status: { type: Type.STRING, enum: Object.values(ShippingStatus) },
    stage: { type: Type.STRING, enum: Object.values(ShippingStage) },
    invoices: {
      type: Type.ARRAY,
      items: invoiceGenAISchema,
    },
  },
};
