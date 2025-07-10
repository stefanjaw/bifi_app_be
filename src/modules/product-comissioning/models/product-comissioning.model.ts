import mongoose, { PaginateModel, Types } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export interface productComissioning {
  _id: Types.ObjectId;
  outcome: "fail" | "pass";
  details?: string;
  attachments: Types.ObjectId[];
  active: boolean;
}

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
    type: [Schema.Types.ObjectId],
    autopopulate: false,
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
  productComissioning,
  PaginateModel<productComissioning>
>("ProductComissioning", productComissioningSchema);

export { productComissioningModel };
