import { maintenanceWindow } from "./../../maintenance-windows/models/maintenance-window";
import mongoose, { PaginateModel, Types } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { productType } from "../../product-types/models/product-type";
import { contact } from "../../contacts/models/contact";
import { room } from "../../facilities/models/room";

export interface product {
  _id: Types.ObjectId;
  productTypeIds: productType[];
  vendorIds: contact[];
  productModel: string;
  serialNumber: string;
  acquiredDate: Date;
  acquiredPrice: number;
  currentPrice: number;
  condition: "excellent" | "good" | "fair" | "poor";
  maintenanceWindowIds: maintenanceWindow[];
  photo?: string;
  locationId: room;
  warrantyDate: Date;
  remarks?: string;
  active: boolean;
}

const productSchema = new Schema({
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
    type: String,
    default: "",
  },
  locationId: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    autopopulate: true,
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
});

productSchema.plugin(paginate);
productSchema.plugin(autopopulate);

const productModel = mongoose.model<product, PaginateModel<product>>(
  "Product",
  productSchema
);

export { productModel };
