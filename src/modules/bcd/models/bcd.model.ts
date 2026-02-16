import mongoose, { PaginateModel, Schema } from "mongoose";
import {
  BCDStatusTypeEnum,
  EBCDTypeEnum,
  ValuationMethodTypeEnum,
} from "./bcd-enums";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDDocument } from "@mongodb-types";
import { fileSchema } from "../../../system";

// this file values and structure the BCD mongoose model
const supplierSchema = new Schema({
  contactId: {
    type: Schema.Types.ObjectId,
    ref: "Contact",
    required: true,
    autopopulate: {
      maxDepth: 2,
    },
  },
});

const importerSchema = new Schema({
  contactId: {
    type: Schema.Types.ObjectId,
    ref: "Contact",
    required: true,
    autopopulate: {
      maxDepth: 2,
    },
  },
});

const transportSchema = new Schema({
  aircraftOrVessel: {
    type: Schema.Types.ObjectId,
    ref: "BCDTransportOption",
    autopopulate: true,
    required: true,
  },
  flightOrVoyage: {
    type: String,
    required: true,
  },
  port: {
    type: Schema.Types.ObjectId,
    ref: "BCDPort",
    autopopulate: true,
    required: true,
  },
  arrivalDate: {
    type: Date,
    required: true,
  },
});

//Charge
const chargeSchema = new Schema({
  code: {
    type: Schema.Types.ObjectId,
    ref: "BCDChargeCode",
    autopopulate: true,
    required: false,
    validate: {
      validator: function (this: any, value: any) {
        // Check if this charge is part of a record
        // 'this' refers to the charge document
        // We need to check if the parent path contains 'records'
        const isInRecord =
          this.$__.parent?.()?.constructor?.modelName.toLowerCase() ===
          "bcdrecord";

        if (isInRecord && !value) return false; // Code is required when in a record
        return true; // Not in a record or code exists
      },
      message: "Charge code is required when the charge is part of a record",
    },
  },
  percentage: {
    type: Number,
    required: false,
  },
  amount: {
    type: Number,
    required: true,
  },
});

//Declarant
const declarantSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  companyId: {
    // !!!: likely a code, not a mongoid or ref
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  capacity: {
    type: String,
    required: true,
  },
  traderReference: {
    type: String,
    required: true,
  },
});

const taxEntrySchema = new Schema({
  type: {
    type: Schema.Types.ObjectId,
    ref: "BCDTaxType",
    autopopulate: true,
    required: true,
  },
  taxId: {
    type: Schema.Types.ObjectId,
    ref: "BCDTaxId",
    autopopulate: true,
    required: true,
  },
  valueForTax: {
    type: Number,
    required: true,
  },
  ratePercentage: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

//Additional info
const additionalInformationSchema = new Schema({
  //tipe is enum of strings
  type: {
    type: Schema.Types.ObjectId,
    ref: "BCDAdditionalInformationType",
    autopopulate: true,
    required: false,
  },
  value: {
    type: String,
    required: true,
  },
});

const bcdRecordSchema = new Schema({
  number: {
    type: Number,
    required: true,
  },
  cpc: {
    type: Schema.Types.ObjectId,
    ref: "BCDCpc",
    autopopulate: true,
    required: true,
  },
  origin: {
    type: Schema.Types.ObjectId,
    ref: "Country",
    required: true,
    autopopulate: true,
  },
  tariff: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  quantityTwo: {
    type: Number,
    required: false,
  },
  supplementaryCode: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  linesSubtotal: {
    type: Number,
    required: true,
  },
  exchangeRate: {
    type: Number,
    required: true,
  },
  bdaValue: {
    type: Number,
    required: true,
  },
  totalDue: {
    type: Number,
    required: true,
  },
  charges: {
    type: [chargeSchema],
    required: false,
  },
  tax: {
    type: [taxEntrySchema],
    required: false,
  },
  additionalInformation: {
    type: [additionalInformationSchema],
    required: false,
  },
});

//Ogd
const ogdschema = new Schema({
  paymentCode: {
    type: String,
    required: true,
  },
  costCode: {
    type: String,
    required: false,
  },
  objectCode: {
    type: String,
    required: false,
  },
  subsidiaryCode: {
    type: String,
    required: false,
  },
  explanation: {
    type: String,
    required: true,
  },
});

const ebcdSchema = new Schema({
  file: {
    type: fileSchema,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(EBCDTypeEnum),
    required: true,
  },
});

const bcdSchema = new Schema(
  {
    shippingId: {
      type: Schema.Types.ObjectId,
      ref: "Shipping",
      required: true,
      autopopulate: {
        maxDepth: 1,
      },
    },
    status: {
      type: String,
      enum: Object.values(BCDStatusTypeEnum),
      default: BCDStatusTypeEnum.DRAFT,
    },
    //type
    type: {
      type: Schema.Types.ObjectId,
      ref: "BCDType",
      autopopulate: true,
      required: true,
    },
    supplier: {
      type: supplierSchema,
      required: true,
    },
    importer: {
      type: importerSchema,
      required: true,
    },
    transport: {
      type: transportSchema,
      required: true,
    },
    manifest: {
      type: String,
      required: true,
    },
    masterBOLAWB: {
      type: String,
      required: true,
    },
    directShipmentCountry: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      required: true,
      autopopulate: true,
    },
    originalShipmentCountry: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      required: true,
      autopopulate: true,
    },
    warehouseId: {
      type: String,
      required: true,
    },
    charges: {
      type: [chargeSchema],
      required: true,
    },
    containerIds: {
      type: [String],
      required: true,
    },
    houseBOLAWBs: {
      type: [String],
    },
    valuationMethod: {
      type: String,
      enum: Object.values(ValuationMethodTypeEnum),
      required: true,
    },
    packagesCount: {
      type: Number,
      required: true,
    },
    invoiceAmount: {
      type: Number,
      required: true,
    },
    payableAmount: {
      type: Number,
      required: true,
    },
    additionalInformation: {
      type: [additionalInformationSchema],
      required: false,
    },
    ogd: {
      type: ogdschema,
      required: true,
    },
    paymentAccounts: {
      type: [String],
      required: false,
    },
    declarant: {
      type: declarantSchema,
      required: true,
    },
    records: {
      type: [bcdRecordSchema],
      required: true,
    },
    // * goverment documents associated with this BCD
    ebcds: {
      type: [ebcdSchema],
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

bcdSchema.plugin(paginate);
bcdSchema.plugin(autopopulate);

const bcdModel = mongoose.model<BCDDocument, PaginateModel<BCDDocument>>(
  "BCD",
  bcdSchema,
);
export { bcdModel };
