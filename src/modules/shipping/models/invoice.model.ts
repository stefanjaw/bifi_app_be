import autopopulate from "mongoose-autopopulate";
import { Schema } from "mongoose";
import { fileSchema } from "../../../system";

export enum InvoiceStatus {
  PROCESSING_PDF = "PROCESSING_PDF",
  ERROR_JSON = "ERROR_JSON",
  DATA_PROCESSED = "DATA_PROCESSED",
  COMPLETE = "COMPLETE",
}

export enum CommentStatus {
  DRAFT = "DRAFT",
  CANCELLED = "CANCELLED",
  DONE = "DONE",
}

const tariffSchema = new Schema({
  code: {
    type: String,
    default: null,
  },
  chapter: {
    type: String,
    required: true,
  },
  heading: {
    type: String,
    required: true,
  },
  subheading: {
    type: String,
    required: true,
  },
  userDescription: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  rateOfDuty: {
    type: Number,
    default: null,
  },
  unitOfMeasurement: {
    type: String,
    default: null,
  },
  tax: {
    type: Number,
    default: null,
  },
});

const lineSchema = new Schema({
  lineNumber: {
    type: String,
    required: true,
  },
  countryId: {
    type: Schema.Types.ObjectId,
    ref: "Country",
    autopopulate: true,
    required: true,
  },
  currency: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  customsClassification: {
    type: String,
    required: true,
  },
  hsCode: {
    type: String,
    default: null,
    maxlength: 8,
  },
  customsChapter: {
    type: String,
    default: null,
  },
  customsHeading: {
    type: String,
    default: null,
  },
  customsSubheading: {
    type: String,
    default: null,
  },
  chapterDescription: {
    type: String,
    default: null,
  },
  headingDescription: {
    type: String,
    default: null,
  },
  subheadingDescription: {
    type: String,
    default: null,
  },
  recordNumber: {
    type: Number,
    default: null,
  },
  tariff: {
    type: tariffSchema,
    default: null,
  },
});

const invoiceExtractedDataSchema = new Schema(
  {
    header: {
      invoiceNumber: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      countryId: {
        type: Schema.Types.ObjectId,
        ref: "Country",
        autopopulate: true,
        required: true,
      },
      companyId: {
        type: Schema.Types.ObjectId,
        ref: "Company",
        autopopulate: {
          maxDepth: 2,
        },
        required: true,
      },
      address: {
        type: String,
        default: null,
      },
      phone: {
        type: String,
        default: null,
      },
      email: {
        type: String,
        required: false,
      },
      total: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: null,
      },
    },
    lines: {
      type: [lineSchema],
      required: true,
    },
  },
  { timestamps: true }
);

export const invoiceSchema = new Schema({
  comments: [
    {
      description: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        autopopulate: {
          select: "username email contactId",
          maxDepth: 1,
        },
        required: true,
      },
      active: {
        type: Boolean,
        default: true,
      },
      status: {
        type: String,
        enum: Object.values(CommentStatus),
        default: "DRAFT",
      },
    },
  ],
  pdf: new Schema(
    {
      extractedData: invoiceExtractedDataSchema,
      file: fileSchema,
    },
    {
      _id: false, // Deshabilidar _id para este objeto
    }
  ),
  status: {
    type: String,
    enum: Object.values(InvoiceStatus),
    required: true,
  },
});

lineSchema.plugin(autopopulate);
invoiceExtractedDataSchema.plugin(autopopulate);
invoiceSchema.plugin(autopopulate);
