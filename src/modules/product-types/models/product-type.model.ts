import mongoose, { PaginateModel, Types } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import { ProductTypeDocument } from "../../../types/mongoose.gen";

const productTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  active: {
    type: Boolean,
    default: true,
  },
});

productTypeSchema.plugin(paginate);

const productTypeModel = mongoose.model<
  ProductTypeDocument,
  PaginateModel<ProductTypeDocument>
>("ProductType", productTypeSchema);

export { productTypeModel };
