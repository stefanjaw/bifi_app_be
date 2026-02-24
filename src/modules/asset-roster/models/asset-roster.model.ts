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

const assetRosterSchema = new Schema(
  {
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
      // depth must be of one level
      autopopulate: {
        select: "name lastName email", // Fields to select from the parent contact
        maxDepth: 1, // Limit depth to one level
      },
      default: [],
    },
    makeIds: {
      type: [Schema.Types.ObjectId],
      ref: "Contact",
      required: true,
      // depth must be of one level
      autopopulate: {
        select: "name lastName email", // Fields to select from the parent contact
        maxDepth: 1, // Limit depth to one level
      },
    },
    productModel: {
      type: String,
      required: true,
    },
    serialNumber: {
      type: String,
      required: true,
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
        select: "name code address active", // Fields to select from the room
        maxDepth: 1, // Limit depth to one level
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
    // for maintenance
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
    // Financial ================
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
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toObject: { virtuals: true }, // Include virtuals in toObject output
    toJSON: { virtuals: true }, // Include virtuals in toJSON output
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
    maxDepth: 1, // Limit depth to one level
  },
  options: { sort: { date: 1 } },
  match: { active: true }, // Only populate active commissions
});

// TODO: can I have only one maintenance per asset roster at a time?
assetRosterSchema.virtual("assetMaintenances", {
  ref: "AssetMaintenance",
  localField: "_id",
  foreignField: "assetRosterId",
  autopopulate: {
    select: "name description attachments active type dateStart dateEnd",
    maxDepth: 1, // Limit depth to one level
  },
  options: { sort: { date: -1 } },
  match: { active: true }, // Only populate active maintenances
});

assetRosterSchema.plugin(paginate);
assetRosterSchema.plugin(autopopulate);

const assetRosterModel = mongoose.model<
  AssetRosterDocument,
  PaginateModel<AssetRosterDocument>
>("AssetRoster", assetRosterSchema);

export { assetRosterModel };
