import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { fileSchema } from "../../../../system";
import { CareContinuumDocument } from "@mongodb-types";

const careContinuumHistorySchema = new Schema(
  { description: { type: String, default: "" } },
  { _id: false },
);
const careContinuumAllergySchema = new Schema(
  {
    medicalAllergyId: {
      type: Schema.Types.ObjectId,
      ref: "MedicalAllergy",
      autopopulate: { select: "name acronym", maxDepth: 1 },
    },
    note: { type: String, default: "" },
    severity: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true },
);
const careContinuumImmunizationSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryProduct",
      autopopulate: { select: "name", maxDepth: 1 },
    },
    dateGiven: { type: Date },
    lotCode: { type: String, default: "" },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      autopopulate: { select: "name lastName", maxDepth: 1 },
    },
    totalDoses: { type: Number, default: 0 },
    dosesGiven: { type: Number, default: 0 },
    note: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true },
);
const careContinuumMedicationSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryProduct",
      autopopulate: { select: "name", maxDepth: 1 },
    },
    uomId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryUom",
      autopopulate: { select: "name", maxDepth: 1 },
    },
    strength: { type: String, default: "" },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "ProductRoute",
      autopopulate: { select: "name", maxDepth: 1 },
    },
    frequencyId: {
      type: Schema.Types.ObjectId,
      ref: "ProductFrequency",
      autopopulate: { select: "name", maxDepth: 1 },
    },
    duration: { type: Number, default: 0 },
    durationUnit: { type: String, default: "" },
    startDate: { type: Date },
    quantity: { type: Number, default: 0 },
    note: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true },
);
const careContinuumPrecautionSchema = new Schema(
  {
    medicalPrecautionId: {
      type: Schema.Types.ObjectId,
      ref: "MedicalPrecaution",
      autopopulate: { select: "name", maxDepth: 1 },
    },
    note: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true },
);
const careContinuumHealthCareProxySchema = new Schema(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      autopopulate: { select: "name lastName email phoneNumber", maxDepth: 1 },
    },
    relationShip: { type: String, default: "" },
  },
  { _id: false },
);
const careContinuumExternalProviderSchema = new Schema(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      autopopulate: { select: "name lastName email phoneNumber", maxDepth: 1 },
    },
    providerType: { type: String, default: "" },
  },
  { _id: true, timestamps: true },
);
const careContinuumAdvanceDirectiveSchema = new Schema(
  {
    fileId: { type: fileSchema, required: false },
    types: [{ type: String }],
    outdated: { type: Boolean, default: false },
    information: { type: String, default: "" },
  },
  { _id: true, timestamps: true },
);

/** Mongoose schema for care continuum records */
const careContinuumSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      autopopulate: { select: "dob contactId language active", maxDepth: 1 },
    },
    typeOfEvent: {
      type: String,
      enum: ["Transfer", "Care Update", "Discharge", "Admission"],
      required: true,
    },
    careContinuumLevelId: {
      type: Schema.Types.ObjectId,
      ref: "CareContinuumLevel",
      autopopulate: { select: "name value", maxDepth: 1 },
    },
    state: {
      type: String,
      enum: ["Draft", "Active", "Discharge"],
      default: "Draft",
    },
    transferPoint: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      autopopulate: { select: "name lastName organizationName", maxDepth: 1 },
    },
    assignedCaregiver: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      autopopulate: { select: "name lastName email", maxDepth: 1 },
    },
    assignedNurse: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      autopopulate: { select: "name lastName email", maxDepth: 1 },
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      autopopulate: { select: "name category", maxDepth: 1 },
    },
    bedId: {
      type: Schema.Types.ObjectId,
      ref: "Bed",
      autopopulate: { select: "name type state", maxDepth: 1 },
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      autopopulate: { select: "name code", maxDepth: 1 },
    },
    insuranceCarrier: { type: String, required: true },
    planNumber: { type: String, default: "" },
    groupNumber: { type: String, default: "" },
    policyNumber: { type: String, required: true },
    memberId: { type: String, default: "" },
    effectiveDate: { type: Date },
    endDate: { type: Date, required: true },
    genderAtBirth: {
      type: Schema.Types.ObjectId,
      ref: "Gender",
      autopopulate: { select: "name", maxDepth: 1 },
    },
    genderAtPresent: {
      type: Schema.Types.ObjectId,
      ref: "Gender",
      autopopulate: { select: "name", maxDepth: 1 },
    },
    race: {
      type: Schema.Types.ObjectId,
      ref: "CareContinuumRace",
      autopopulate: { select: "name", maxDepth: 1 },
    },
    height: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    advanceDirectives: {
      type: [careContinuumAdvanceDirectiveSchema],
      default: [],
    },
    socialHistory: { type: [careContinuumHistorySchema], default: [] },
    familyHistory: { type: [careContinuumHistorySchema], default: [] },
    medicalHistory: { type: [careContinuumHistorySchema], default: [] },
    surgicalHistory: { type: [careContinuumHistorySchema], default: [] },
    medications: { type: [careContinuumMedicationSchema], default: [] },
    allergies: { type: [careContinuumAllergySchema], default: [] },
    immunizations: { type: [careContinuumImmunizationSchema], default: [] },
    precautions: { type: [careContinuumPrecautionSchema], default: [] },
    healthCareProxy: { type: careContinuumHealthCareProxySchema },
    externalProviders: {
      type: [careContinuumExternalProviderSchema],
      default: [],
    },
    extraFields: { type: Map, of: Schema.Types.Mixed, default: new Map() },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { select: "username email", maxDepth: 1 },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { select: "username email", maxDepth: 1 },
    },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

careContinuumSchema.plugin(paginate);
careContinuumSchema.plugin(autopopulate);

/** Mongoose model for care continuum records */
const careContinuumModel = mongoose.model<
  CareContinuumDocument,
  PaginateModel<CareContinuumDocument>
>("CareContinuum", careContinuumSchema);
export { careContinuumModel };
export { CareContinuumDocument };
