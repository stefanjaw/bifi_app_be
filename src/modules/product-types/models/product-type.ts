import mongoose, { PaginateModel, Types } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";

export interface productType {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  active: boolean;
}

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
  productType,
  PaginateModel<productType>
>("ProductType", productTypeSchema);

export { productTypeModel };
