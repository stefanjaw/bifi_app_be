import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ProductDocument } from "@mongodb-types";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import { fileSchema } from "../../../system";

dayjs.extend(isBetween);

const productSchema = new Schema(
  {
    productTypeIds: {
      type: [Schema.Types.ObjectId],
      ref: "ProductType",
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
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "active",
        "awaiting-comissioning",
        "under-service",
        "decomissioned",
        "in-pm",
      ],
      default: "awaiting-comissioning",
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
    // ================
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toObject: { virtuals: true }, // Include virtuals in toObject output
    toJSON: { virtuals: true }, // Include virtuals in toJSON output
  }
);

productSchema.virtual("productComission", {
  ref: "ProductComissioning",
  justOne: true,
  localField: "_id",
  foreignField: "productId",
  autopopulate: {
    select: "outcome details attachments active",
    maxDepth: 1, // Limit depth to one level
  },
  options: { sort: { date: 1 } },
  match: { active: true }, // Only populate active commissions
});

// TODO: can I have only one maintenance per product at a time?
productSchema.virtual("productMaintenances", {
  ref: "ProductMaintenance",
  localField: "_id",
  foreignField: "productId",
  autopopulate: {
    select: "name description attachments active type date",
    maxDepth: 1, // Limit depth to one level
  },
  options: { sort: { date: -1 } },
  match: { active: true }, // Only populate active maintenances
});

productSchema.plugin(paginate);
productSchema.plugin(autopopulate);

const productModel = mongoose.model<
  ProductDocument,
  PaginateModel<ProductDocument>
>("Product", productSchema);

export { productModel };
