import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import dayjs from "dayjs";
import { ProductComissioningDocument, ProductDocument } from "@mongodb-types";

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
      required: true,
      // depth must be of one level
      autopopulate: {
        select: "name lastName email", // Fields to select from the parent contact
        maxDepth: 1, // Limit depth to one level
      },
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
      required: true,
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      required: true,
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
      required: true,
    },
    warrantyDate: {
      type: Date,
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
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
  match: { active: true }, // Only populate active commissions
});

productSchema.virtual("status").get(function (this: ProductDocument) {
  let status: "active" | "awaiting-comissioning" | "under-service";

  const productComission = this
    .productComission as ProductComissioningDocument | null;

  // TODO: LOGIC TO DETERMINE IF PRODUCT IS UNDER SERVICE
  if (!productComission) status = "awaiting-comissioning";
  else if (productComission.outcome === "pass") status = "active";
  else status = "awaiting-comissioning";

  return status;
});

productSchema.virtual("pmDue").get(function (this: ProductDocument) {
  let pmDue: "pm-not-set" | "in-pm" | "pm-due" | "pm-overdue";
  const window = this.maintenanceWindowIds[0];
  const acquiredDate = dayjs(this.acquiredDate);

  // TODO: LOGIC TO DETERMINE PM DUE
  if (!window) pmDue = "pm-not-set";
  else pmDue = "pm-due";

  return pmDue;
});

productSchema.plugin(paginate);
productSchema.plugin(autopopulate);

const productModel = mongoose.model<
  ProductDocument,
  PaginateModel<ProductDocument>
>("Product", productSchema);

export { productModel };
