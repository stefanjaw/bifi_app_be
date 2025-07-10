import mongoose, { PaginateModel, Types } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { country } from "../../countries/models/country.model";

export interface company {
  _id: Types.ObjectId;
  name: string;
  countryId: country;
  address: string;
  active: boolean;
}

const companySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  countryId: {
    type: Schema.Types.ObjectId,
    ref: "Country",
    required: true,
    autopopulate: true,
  },
  address: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

companySchema.plugin(paginate);
companySchema.plugin(autopopulate);

const companyModel = mongoose.model<company, PaginateModel<company>>(
  "Company",
  companySchema
);

export { companyModel };
