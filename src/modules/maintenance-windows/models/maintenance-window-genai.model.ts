import { Schema, Type } from "@google/genai";

export const universalDocumentGenAISchema: Schema = {
  type: Type.OBJECT,
  required: [
    "documentType",
    "title",
    "summary",
    "language",
    "extractedData",
    "confidence",
  ],
  properties: {
    documentType: {
      type: Type.STRING,
      description:
        "Detected document category. Examples: invoice, contract, maintenance report, certificate, shipping document, medical report, unknown.",
    },

    title: {
      type: Type.STRING,
      description:
        "Main heading or best possible inferred title of the document",
    },

    summary: {
      type: Type.STRING,
      description:
        "Clear structured explanation of what the document is about",
    },

    language: {
      type: Type.STRING,
      description:
        "Detected language of the document (ISO code if possible)",
    },

    referenceNumbers: {
      type: Type.ARRAY,
      description:
        "Important reference identifiers found in the document",
      items: {
        type: Type.STRING,
      },
    },

    entities: {
      type: Type.ARRAY,
      description:
        "People, companies, organizations, locations or relevant names found",
      items: {
        type: Type.OBJECT,
        required: ["name", "type"],
        properties: {
          name: { type: Type.STRING },
          type: {
            type: Type.STRING,
            description:
              "Type of entity (person, company, organization, country, address, etc.)",
          },
        },
      },
    },

    dates: {
      type: Type.ARRAY,
      description: "All relevant dates found in the document",
      items: {
        type: Type.STRING,
      },
    },

    amounts: {
      type: Type.ARRAY,
      description: "All monetary values found",
      items: {
        type: Type.OBJECT,
        required: ["value"],
        properties: {
          value: { type: Type.NUMBER },
          currency: { type: Type.STRING },
        },
      },
    },

    extractedData: {
      type: Type.ARRAY,
      description:
        "Flexible key-value extracted information from the document",
      items: {
        type: Type.OBJECT,
        required: ["key", "value"],
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING },
        },
      },
    },

    confidence: {
      type: Type.NUMBER,
      description:
        "AI confidence score between 0 and 1 about extraction accuracy",
    },
  },
};
