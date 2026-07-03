import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const branchOfficeSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      autopopulate: {
        select: "name",
        maxDepth: 1,
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    branchCode: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    countryId: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      required: false,
      autopopulate: {
        select: "name code",
        maxDepth: 1,
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

branchOfficeSchema.plugin(paginate);
branchOfficeSchema.plugin(autopopulate);

export type BranchOfficeDocument = mongoose.Document & {
  companyId: any;
  name: string;
  branchCode: string;
  address: string;
  phone: string;
  email: string;
  countryId: any;
  active: boolean;
  isDefault: boolean;
};

const branchOfficeModel = mongoose.model<
  BranchOfficeDocument,
  PaginateModel<BranchOfficeDocument>
>("BranchOffice", branchOfficeSchema);

export { branchOfficeModel };
