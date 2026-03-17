import { Schema, Type } from "@google/genai";

export const freightRecordGenAISchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      rate_type: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Rate type, mode, or shipping type (e.g. sea, air, ground)",
      },
      carrier: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Carrier, shipper, forwarder, or shipping line name",
      },
      service: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Service level or tier",
      },
      zone: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Shipping zone or region",
      },
      weight_min_lb: {
        anyOf: [{ type: Type.NUMBER }, { type: Type.NULL }],
        description: "Minimum weight in pounds",
      },
      weight_max_lb: {
        anyOf: [{ type: Type.NUMBER }, { type: Type.NULL }],
        description: "Maximum weight in pounds",
      },
      rate_usd: {
        anyOf: [{ type: Type.NUMBER }, { type: Type.NULL }],
        description: "Rate or charge amount in USD",
      },
      unit: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Unit of measure (e.g. per lb, per kg, flat)",
      },
      origin: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Origin location, port of loading",
      },
      destination: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Destination location, port of discharge",
      },
      effective_date: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Effective or valid-from date as ISO date string",
      },
      hs_code: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Harmonized System (HS) tariff code or customs classification code",
      },
      duty_rate_pct: {
        anyOf: [{ type: Type.NUMBER }, { type: Type.NULL }],
        description: "Customs duty or tariff rate expressed as a percentage (e.g. 22.5 means 22.5%)",
      },
      product_description: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Product or commodity description from the tariff schedule",
      },
      source_file: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "The filename this record was extracted from, taken from the === FILE: ... === label preceding the file data",
      },
    },
  },
};
