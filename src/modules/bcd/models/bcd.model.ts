import mongoose, { PaginateModel, Schema } from "mongoose";
import {
  AdditionalInformationTypeEnum,
  BCDStatusTypeEnum,
  BCDTypeEnum,
  ChargeCodeTypeEnum,
  EBCDTypeEnum,
  TaxIdTypeEnum,
  TaxTypeEnum,
  TransportMethodTypeEnum,
  ValuationMethodTypeEnum,
} from "./bcd.types";
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
  type: {
    type: String,
    enum: Object.values(TransportMethodTypeEnum),
    required: true,
  },
  aircraftOrVessel: {
    type: String,
    required: true,
  },
  flightOrVoyage: {
    type: String,
    required: true,
  },
  port: {
    type: String,
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
    type: String,
    enum: Object.values(ChargeCodeTypeEnum),
    required: true,
  },
  percentage: {
    type: Number,
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
    type: String,
    enum: Object.values(TaxTypeEnum),
    required: true,
  },
  taxId: {
    type: String,
    enum: Object.values(TaxIdTypeEnum),
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
    type: String,
    enum: Object.values(AdditionalInformationTypeEnum),
    required: true,
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
    type: String,
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
    min: 0,
  },
  exchangeRate: {
    type: Number,
    min: 0,
  },
  charges: {
    type: [chargeSchema],
    required: true,
  },
  tax: {
    type: [taxEntrySchema],
  },
  additionalInformation: {
    type: [additionalInformationSchema],
  },
});
//Ogd
const ogdschema = new Schema({
  paymentCode: {
    type: String,
  },
  costCode: {
    type: String,
    required: true,
  },
  objectCode: {
    type: String,
    required: true,
  },
  subsidiaryCode: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
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
      type: String,
      enum: Object.values(BCDTypeEnum),
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
      length: 4,
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
      min: 0,
      required: true,
    },
    additionalInformation: {
      type: [additionalInformationSchema],
      required: true,
    },
    ogd: {
      type: ogdschema,
      required: true,
    },
    paymentAccounts: {
      type: [String],
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
