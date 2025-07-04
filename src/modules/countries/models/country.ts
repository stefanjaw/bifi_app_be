import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";

export interface country {
  _id: string;
  name: string;
  active: boolean;
}

const countrySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

countrySchema.plugin(paginate);

const countryModel = mongoose.model<country, PaginateModel<country>>(
  "Country",
  countrySchema
);

export { countryModel };
