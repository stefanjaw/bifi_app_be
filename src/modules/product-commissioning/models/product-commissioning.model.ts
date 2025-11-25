import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ProductCommissioningDocument } from "@mongodb-types";
import { fileSchema } from "../../../system";

const productCommissioningSchema = new Schema(
  {
    outcome: {
      type: String,
      enum: ["fail", "pass"],
      required: true,
    },
    details: {
      type: String,
      required: false,
      trim: true,
    },
    attachments: {
      type: [fileSchema],
      required: false,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      autopopulate: {
        select:
          "productModel serialNumber acquiredDate acquiredPrice currentPrice condition locationId warrantyDate remarks",
        maxDepth: 1, // Limit depth to one level
      },
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productCommissioningSchema.plugin(paginate);
productCommissioningSchema.plugin(autopopulate);

const productCommissioningModel = mongoose.model<
  ProductCommissioningDocument,
  PaginateModel<ProductCommissioningDocument>
>("ProductCommissioning", productCommissioningSchema);

export { productCommissioningModel };
