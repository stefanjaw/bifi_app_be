import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ProductComissioningDocument } from "@mongodb-types";
import { fileSchema } from "../../../system";

const productComissioningSchema = new Schema({
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
});

productComissioningSchema.plugin(paginate);
productComissioningSchema.plugin(autopopulate);

const productComissioningModel = mongoose.model<
  ProductComissioningDocument,
  PaginateModel<ProductComissioningDocument>
>("ProductComissioning", productComissioningSchema);

export { productComissioningModel };
