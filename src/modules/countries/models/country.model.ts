import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import { CountryDocument } from "../../../types/mongoose.gen";

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
