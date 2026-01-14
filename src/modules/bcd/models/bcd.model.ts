import mongoose, { PaginateModel, Schema } from "mongoose";
import { BCDType, ValuationMethod } from "./bcd-data.model";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDDocument } from "@mongodb-types";

// this file values and structure the BCD mongoose model
const supplierSchema = new Schema({
  contactId: {
    type: Schema.Types.ObjectId,
    ref: "Contact",
    required: true,
  },
});

const importerSchema = new Schema({
  contactId: {
    type: Schema.Types.ObjectId,
    ref: "Contact",
    required: true,
  },
});

const transportSchema = new Schema({
  type: {
    type: String,
    enum: ["AIRLINE", "VESSEL"],
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
  id: {
    type: Schema.Types.ObjectId,
    ref: "Charge",
    required: true,
  },
  percentage: {
    type: Number,
    min: 0,
  },
  amount: {
    type: Number,
    min: 0,
  },
});

//Declarant
const declarantSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
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

//Additional info
const AdditionalInformationSchema = new Schema({
  //tipe is enum of strings
  type: {
    type: String,
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
    min: 0,
    required: true,
  },
  cpc: {
    type: String,
    required: true,
  },
  origin: {
    type: String,
    required: true,
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
    min: 0,
    required: true,
  },
  quantityTwo: {
    type: Number,
    min: 0,
    default: null,
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
  additionalInformation: {
    type: [AdditionalInformationSchema],
    required: true,
  },
});
//Ogd
const Ogdschema = new Schema({
  paymentCode: {
    type: String,
  },
  cost: {
    type: Number,
    min: 0,
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

const bcdSchema = new Schema({
  //type
  type: {
    type: String,
    enum: Object.values(BCDType),
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
    type: String,
    required: true,
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
    type: Object.values(ValuationMethod),
    required: true,
  },
  packagesCount: {
    type: Number,
    min: 0,
    required: true,
  },
  additionalInformation: {
    type: AdditionalInformationSchema,
    required: true,
  },
  ogd: {
    type: Ogdschema,
    required: true,
  },
  paymentAccounts: {
    type: [String],
    required: true,
  },
  declarant: {
    type: declarantSchema,
    required: true,
  },
  records: {
    type: [bcdRecordSchema],
    required: true,
  },
});

bcdSchema.plugin(paginate);
bcdSchema.plugin(autopopulate);

const bcdModel = mongoose.model<BCDDocument, PaginateModel<BCDDocument>>(
  "BCD",
  bcdSchema
);
export { bcdModel };
