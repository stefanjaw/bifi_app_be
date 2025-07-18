import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import isBetween from "dayjs/plugin/isBetween";
import dayjs, { Dayjs } from "dayjs";
import {
  ProductComissioningDocument,
  ProductDocument,
  ProductMaintenanceDocument,
} from "@mongodb-types";

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
    status: {
      type: String,
      enum: [
        "active",
        "awaiting-comissioning",
        "under-service",
        "decomissioned",
      ],
      default: "awaiting-comissioning",
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

// TODO: can I have only one maintenance per product at a time?
productSchema.virtual("productMaintenance", {
  ref: "ProductMaintenance",
  localField: "_id",
  foreignField: "productId",
  autopopulate: {
    select: "outcome details attachments active",
    maxDepth: 1, // Limit depth to one level
  },
  options: { sort: { date: -1 } },
});

// This is based on the last comission and maintenance
// productSchema.virtual("status").get(function (this: ProductDocument) {
//   let status: "active" | "awaiting-comissioning" | "under-service";

//   const productComission = this
//     .productComission as ProductComissioningDocument | null;
//   const productMaintenance = (
//     this.productMaintenance as ProductMaintenanceDocument[]
//   )?.find((maintenance) => maintenance.active);

//   // get status, if there is a maintenance, status is under-service
//   // if there is a comission, status is active
//   // else status is awaiting-comissioning
//   if (productMaintenance) status = "under-service";
//   else if (productComission && productComission.outcome === "pass")
//     status = "active";
//   else status = "awaiting-comissioning";

//   return status;
// });

// This is based on previous maintenance, if no previous maintenance, based on acquired date
// productSchema.virtual("pmDue").get(function (this: ProductDocument) {
//   // get maintenance window
//   const window = this.maintenanceWindowIds
//     ? this.maintenanceWindowIds[0]
//     : null;
//   let pmDue: "pm-not-set" | "in-pm" | "pm-due" | "pm-overdue" = "pm-not-set";

//   // if no window, return
//   if (!window) return pmDue;

//   // get last maintenance
//   const lastMaintenance = this.productMaintenance
//     ? this.productMaintenance[0]
//     : null;

//   // set last date to last maintenance or acquired date
//   let lastDate: Dayjs;
//   if (lastMaintenance) lastDate = dayjs(lastMaintenance.date);
//   else lastDate = dayjs(this.acquiredDate);

//   // get date variables to check DUE, the exact date, the prior date, and the later date which are offsets
//   const nextWindowDate = dayjs(lastDate).add(
//     window.parseRecurrencyForDayjs().count,
//     window.parseRecurrencyForDayjs().unit
//   );
//   const priorDate = dayjs(nextWindowDate).subtract(window.daysBefore, "day");
//   const laterDate = dayjs(nextWindowDate).add(window.daysAfter, "day");

//   if (dayjs().isBetween(priorDate, laterDate)) {
//     pmDue = "in-pm";
//   } else if (dayjs().isBefore(priorDate)) {
//     pmDue = "pm-due";
//   } else if (dayjs().isAfter(laterDate)) {
//     pmDue = "pm-overdue";
//   }

//   return pmDue;
// });

productSchema.plugin(paginate);
productSchema.plugin(autopopulate);

const productModel = mongoose.model<
  ProductDocument,
  PaginateModel<ProductDocument>
>("Product", productSchema);

export { productModel };
