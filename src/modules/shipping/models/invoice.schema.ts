import { Schema, Type } from "@google/genai";
import { InvoiceStatus } from "./invoice.model";

export const linesGenAISchema: Schema = {
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
      lineNumber: {
        type: Type.STRING,
      },
      countryId: {
        type: Type.STRING,
        description: "Mongodb ID of Country model",
      },
      currency: {
        anyOf: [
          {
            type: Type.STRING,
          },
          {
            type: Type.NULL,
          },
        ],
        description: "ISO 4217 currency code",
      },
      description: {
        type: Type.STRING,
      },
      quantity: {
        type: Type.NUMBER,
      },
      price: {
        type: Type.NUMBER,
      },
      subtotal: {
        type: Type.NUMBER,
      },
      customsClassification: {
        type: Type.STRING,
      },
      hsCode: {
        anyOf: [
          {
            type: Type.STRING,
          },
          {
            type: Type.NULL,
          },
        ],
        maxLength: "8",
        description:
          "The full HS code (up to 8 digits), composed of chapter, heading and subheading",
      },
      customsChapter: {
        anyOf: [
          {
            type: Type.STRING,
          },
          {
            type: Type.NULL,
          },
        ],
        description: "The chapter part of the HS code",
      },
      customsHeading: {
        anyOf: [
          {
            type: Type.STRING,
          },
          {
            type: Type.NULL,
          },
        ],
        description: "The heading part of the HS code",
      },
      customsSubheading: {
        anyOf: [
          {
            type: Type.STRING,
          },
          {
            type: Type.NULL,
          },
        ],
        description: "The subheading part of the HS code",
      },
      chapterDescription: {
        anyOf: [
          {
            type: Type.STRING,
          },
          {
            type: Type.NULL,
          },
        ],
      },
      headingDescription: {
        anyOf: [
          {
            type: Type.STRING,
          },
          {
            type: Type.NULL,
          },
        ],
      },
      subheadingDescription: {
        anyOf: [
          {
            type: Type.STRING,
          },
          {
            type: Type.NULL,
          },
        ],
      },
      recordNumber: {
        type: Type.NUMBER,
      },
      tariff: {
        anyOf: [
          {
            type: Type.OBJECT,
            required: ["chapter", "heading", "subheading"],
            properties: {
              code: {
                anyOf: [
                  {
                    type: Type.STRING,
                  },
                  {
                    type: Type.NULL,
                  },
                ],
                description:
                  "if existing, it must be a value of number having a lenght of 7 characters",
              },
              chapter: {
                type: Type.STRING,
                description: "Is the chapter part of the code",
              },
              heading: {
                type: Type.STRING,
                description: "Is the heading part of the code",
              },
              subheading: {
                type: Type.STRING,
                description: "Is the subheading part of the code",
              },
              userDescription: {
                anyOf: [
                  {
                    type: Type.STRING,
                  },
                  {
                    type: Type.NULL,
                  },
                ],
              },
              description: {
                anyOf: [
                  {
                    type: Type.STRING,
                  },
                  {
                    type: Type.NULL,
                  },
                ],
              },
              rateOfDuty: {
                anyOf: [
                  {
                    type: Type.STRING,
                  },
                  {
                    type: Type.NULL,
                  },
                ],
              },
              unitOfMeasurement: {
                anyOf: [
                  {
                    type: Type.STRING,
                  },
                  {
                    type: Type.NULL,
                  },
                ],
                description: "A unit of measurement",
              },
              quantity: {
                anyOf: [
                  {
                    type: Type.NUMBER,
                  },
                  {
                    type: Type.NULL,
                  },
                ],
                description: "Supplementary unit quantity from tariff",
              },
              tax: {
                anyOf: [
                  {
                    type: Type.STRING,
                  },
                  {
                    type: Type.NULL,
                  },
                ],
              },
            },
          },
          {
            type: Type.NULL,
          },
        ],
        description:
          "If no tariff is found or all properties are empty or null, this field will be null",
      },
    },
  },
};

export const invoiceGenAISchema: Schema = {
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
              required: ["invoiceNumber", "date", "countryId", "total"],
              properties: {
                invoiceNumber: {
                  type: Type.STRING,
                },
                date: {
                  type: Type.STRING,
                  description: "ISO date string",
                },
                countryId: {
                  type: Type.STRING,
                  description: "Mongodb ID of Country model if exists",
                },
                address: {
                  anyOf: [
                    {
                      type: Type.STRING,
                    },
                    {
                      type: Type.NULL,
                    },
                  ],
                },
                phone: {
                  anyOf: [
                    {
                      type: Type.STRING,
                    },
                    {
                      type: Type.NULL,
                    },
                  ],
                },
                email: {
                  anyOf: [
                    {
                      type: Type.STRING,
                    },
                    {
                      type: Type.NULL,
                    },
                  ],
                },
                total: {
                  type: Type.NUMBER,
                },
                currency: {
                  anyOf: [
                    {
                      type: Type.STRING,
                    },
                    {
                      type: Type.NULL,
                    },
                  ],
                  description: "ISO 4217 currency code",
                },
              },
            },
            lines: linesGenAISchema,
          },
        },
      },
    },
  },
};
