import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { CompanyDocument } from "../../../types/mongoose.gen";

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

const companyModel = mongoose.model<
  CompanyDocument,
  PaginateModel<CompanyDocument>
>("Company", companySchema);

export { companyModel };
