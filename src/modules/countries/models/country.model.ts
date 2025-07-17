import { CountryDocument } from "@mongodb-types";
import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";

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

const countryModel = mongoose.model<
  CountryDocument,
  PaginateModel<CountryDocument>
>("Country", countrySchema);

export { countryModel };
