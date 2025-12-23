import { Schema, Type } from "@google/genai";
import { InvoiceStatus } from "./invoice.model";

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
            },
          },
        },
      },
    },
  },
};
