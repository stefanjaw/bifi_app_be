import { Schema, Type } from "@google/genai";
import { InvoiceStatus } from "./invoice.model";

export const invoiceSchema: Schema = {
  type: Type.OBJECT,
  required: ["pdf", "status"],
  properties: {
    status: {
      type: Type.STRING,
      enum: Object.values(InvoiceStatus),
    },
    pdf: {
      type: Type.OBJECT,
      required: ["extractedData"],
      properties: {
        extractedData: {
          type: Type.OBJECT,
          required: ["header", "lines"],
          properties: {
            header: {
              type: Type.OBJECT,
              required: [
                "invoiceNumber",
                "date",
                "countryId",
                "companyId",
                "total",
              ],
              properties: {
                invoiceNumber: { type: Type.STRING },
                date: {
                  type: Type.STRING,
                  description: "ISO date string",
                },
                countryId: {
                  type: Type.STRING,
                  description: "Country code ISO 3166-1 alpha-2",
                },
                companyId: {
                  type: Type.STRING,
                  description: "Company name of the invoice",
                },
                address: {
                  type: Type.STRING,
                },
                phone: {
                  type: Type.STRING,
                },
                email: {
                  type: Type.STRING,
                },
                total: {
                  type: Type.NUMBER,
                },
                currency: {
                  type: Type.STRING,
                  description: "ISO 4217 currency code",
                },
              },
            },

            lines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: [
                  "lineNumber",
                  "countryId",
                  "description",
                  "quantity",
                  "price",
                  "subtotal",
                  "customsClassification",
                ],
                properties: {
                  lineNumber: { type: Type.STRING },
                  countryId: {
                    type: Type.STRING,
                    description: "Country code ISO 3166-1 alpha-2",
                  },
                  currency: {
                    type: Type.STRING,
                    description: "ISO 4217 currency code",
                  },
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                  subtotal: { type: Type.NUMBER },
                  customsClassification: { type: Type.STRING },
                  hsCode: {
                    type: Type.STRING,
                    maxLength: "8",
                  },
                  customsChapter: {
                    type: Type.STRING,
                  },
                  customsHeading: {
                    type: Type.STRING,
                  },
                  customsSubheading: {
                    type: Type.STRING,
                  },
                  chapterDescription: {
                    type: Type.STRING,
                  },
                  headingDescription: {
                    type: Type.STRING,
                  },
                  subheadingDescription: {
                    type: Type.STRING,
                  },
                  recordNumber: {
                    type: Type.NUMBER,
                  },
                  tariff: {
                    type: Type.OBJECT,
                    required: ["chapter", "heading", "subheading"],
                    properties: {
                      code: {
                        type: Type.STRING,
                      },
                      chapter: {
                        type: Type.STRING,
                      },
                      heading: {
                        type: Type.STRING,
                      },
                      subheading: {
                        type: Type.STRING,
                      },
                      userDescription: {
                        type: Type.STRING,
                      },
                      description: {
                        type: Type.STRING,
                      },
                      rateOfDuty: {
                        type: Type.NUMBER,
                      },
                      unitOfMeasurement: {
                        type: Type.STRING,
                        description: "A unit of measurement",
                      },
                      tax: {
                        type: Type.STRING,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
