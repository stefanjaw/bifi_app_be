import { Schema, Type } from "@google/genai";

export const catalogRecordGenAISchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      product_name: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Product name or description",
      },
      part_number: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Part number, SKU, or item code",
      },
      supplier: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "Vendor, supplier, manufacturer, or brand name",
      },
      unit_price: {
        anyOf: [{ type: Type.NUMBER }, { type: Type.NULL }],
        description: "Unit price or cost amount",
      },
      currency: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "ISO 4217 currency code (e.g. USD, EUR)",
      },
      price_break_qty: {
        anyOf: [{ type: Type.NUMBER }, { type: Type.NULL }],
        description: "Minimum order quantity or price-break quantity",
      },
      source_file: {
        anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
        description: "The filename this record was extracted from, taken from the === FILE: ... === label preceding the file data",
      },
    },
  },
};
