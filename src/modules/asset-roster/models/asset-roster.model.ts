import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { AssetRosterDocument } from "@mongodb-types";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import { fileSchema } from "../../../system";

dayjs.extend(isBetween);

const notesModel = new Schema({
  remark: {
    type: String,
    required: false,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    autopopulate: {
      select: "username name email contactId",
      maxDepth: 1,
    },
    required: true,
  },
  performDate: {
    type: Date,
    required: true,
  },
});

const locationAssignmentSchema = new Schema({
  locationId: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    autopopulate: {
      select: "name code address active",
      maxDepth: 1,
    },
    required: true,
  },
  assignedQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
});

const softwareConfigurationSchema = new Schema({
  regulatoryClassification: {
    type: String,
    enum: ["os-middleware", "simd", "samd"],
    required: false,
  },
  version: {
    type: String,
    required: false,
  },
  parentAssetId: {
    type: Schema.Types.ObjectId,
    ref: "AssetRoster",
    required: false,
  },
  udiDi: {
    type: String,
    required: false,
  },
  fdaMdrClass: {
    type: String,
    enum: ["class-i", "class-ii", "class-iii"],
    required: false,
  },
  licenseType: {
    type: String,
    enum: ["perpetual", "subscription-saas"],
    required: false,
  },
  licenseKey: {
    type: String,
    required: false,
  },
  preventAutoUpdate: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const assetRosterSchema = new Schema(
  {
    deviceType: {
      type: String,
      enum: ["serialized", "non-serialized", "software"],
      required: true,
      default: "serialized",
    },
    assetTypeIds: {
      type: [Schema.Types.ObjectId],
      ref: "AssetType",
      autopopulate: true,
      required: true,
    },
    vendorIds: {
      type: [Schema.Types.ObjectId],
      ref: "Contact",
      required: false,
      autopopulate: {
        select: "name lastName email",
        maxDepth: 1,
      },
      default: [],
    },
    makeIds: {
      type: [Schema.Types.ObjectId],
      ref: "Contact",
      required: true,
      autopopulate: {
        select: "name lastName email",
        maxDepth: 1,
      },
    },
    productModel: {
      type: String,
      required: false,
    },
    serialNumber: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    quantity: {
      type: Number,
      required: false,
      default: 1,
    },
    locationAssignments: {
      type: [locationAssignmentSchema],
      required: false,
      default: [],
    },
    softwareConfiguration: {
      type: softwareConfigurationSchema,
      required: false,
    },
    condition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      required: false,
      default: "excellent",
    },
    maintenanceWindowIds: {
      type: [Schema.Types.ObjectId],
      ref: "MaintenanceWindow",
      autopopulate: true,
      default: [],
    },
    photo: {
      type: Schema.Types.ObjectId,
      autopopulate: false,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      autopopulate: {
        select: "name code address active",
        maxDepth: 1,
      },
      required: false,
    },
    warrantyDate: {
      type: Date,
      required: false,
    },
    remarks: {
      type: [notesModel],
      default: [],
    },
    status: {
      type: String,
      enum: [
        "active",
        "awaiting-commissioning",
        "under-service",
        "decommissioned",
        "in-pm",
      ],
      default: "awaiting-commissioning",
    },
    minMaintenanceDate: {
      type: Date,
    },
    maintenanceDate: {
      type: Date,
    },
    maxMaintenanceDate: {
      type: Date,
    },
    attachments: {
      type: [fileSchema],
      required: false,
    },
    acquiredDate: {
      type: Date,
      required: true,
    },
    acquiredPrice: {
      type: Number,
      required: false,
      default: 0,
    },
    currentPrice: {
      type: Number,
      required: false,
      default: 0,
    },
    yearsOfUse: {
      type: Number,
      required: false,
      default: 0,
    },
    depreciationCalculator: {
      type: Number,
      required: false,
      default: 0,
    },
    depreciationValue: {
      type: Number,
      required: false,
      default: 0,
    },
    totalCostOfOwnership: {
      type: Number,
      required: false,
      default: 0,
    },
    commissionedDate: {
      type: Date,
      required: false,
    },
    estimatedEconomicLifeYears: {
      type: Number,
      required: false,
      default: 0,
    },
    salvageValue: {
      type: Number,
      required: false,
      default: 0,
    },
    depreciationMethod: {
      type: String,
      enum: ['straight-line', 'accelerated-declining-balance'],
      required: false,
      default: 'straight-line',
    },
    accelerationFactor: {
      type: Number,
      required: false,
      default: 200,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

assetRosterSchema.virtual("assetCommission", {
  ref: "AssetCommissioning",
  justOne: true,
  localField: "_id",
  foreignField: "assetRosterId",
  autopopulate: {
    select: "outcome details attachments active",
    maxDepth: 1,
  },
  options: { sort: { date: 1 } },
  match: { active: true },
});

assetRosterSchema.virtual("assetMaintenances", {
  ref: "AssetMaintenance",
  localField: "_id",
  foreignField: "assetRosterId",
  autopopulate: {
    select: "name description attachments active type dateStart dateEnd",
    maxDepth: 1,
  },
  options: { sort: { dateStart: -1 } },
});

assetRosterSchema.plugin(paginate);
assetRosterSchema.plugin(autopopulate);

const assetRosterModel = mongoose.model<
  AssetRosterDocument,
  PaginateModel<AssetRosterDocument>
>("AssetRoster", assetRosterSchema);

export { assetRosterModel };
