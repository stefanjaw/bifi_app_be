import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { fileSchema } from "../../../system";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    unit: {
      type: String,
      default: "",
    },
    unitOfMeasureId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryUom",
      required: false,
      autopopulate: {
        select: "name symbol categoryId crUnidadMedida",
        maxDepth: 1,
      },
    },
    productTypeId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryProductType",
      required: false,
      autopopulate: {
        select: "name",
        maxDepth: 1,
      },
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    defaultSaleTaxIds: {
      type: [Schema.Types.ObjectId],
      ref: "Tax",
      default: [],
    },
    defaultPurchaseTaxIds: {
      type: [Schema.Types.ObjectId],
      ref: "Tax",
      default: [],
    },
    codigoComercial: {
      type: String,
      required: false,
      default: "",
    },
    productKind: {
      type: String,
      enum: ["consumable", "service", "storable"],
      required: true,
      default: "storable",
    },
    barcode: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
    photo: {
      type: Schema.Types.ObjectId,
      required: false,
      default: null,
    },
    attachments: {
      type: [fileSchema],
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

productSchema.plugin(paginate);
productSchema.plugin(autopopulate);

import { InventoryProductDocument as ProductDocument } from "@mongodb-types";

export { ProductDocument };

const productModel = mongoose.model<
  ProductDocument,
  PaginateModel<ProductDocument>
>("InventoryProduct", productSchema);

export { productModel };
