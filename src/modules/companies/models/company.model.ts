import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { CompanyDocument } from "@mongodb-types";

const companySchema = new Schema(
  {
    type: {
      type: String,
      enum: ["company", "branch-office"],
      required: true,
      default: "company",
    },
    name: {
      type: String,
      required: true,
    },
    countryId: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      required: false,
      autopopulate: true,
    },
    address: {
      type: String,
      required: false,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: false,
      autopopulate: {
        select: "name lastName email vat phoneNumber crVatType crEconomicActivityCodes commercialName state city crDistrito streetAddress",
        maxDepth: 1,
      },
    },
    defaultCurrencyId: {
      type: Schema.Types.ObjectId,
      ref: "Currency",
      required: false,
      autopopulate: {
        select: "name code symbol",
        maxDepth: 1,
      },
    },
    parentCompany: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: false,
      autopopulate: {
        select: "name",
        maxDepth: 1,
      },
    },
    branchCode: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

companySchema.plugin(paginate);
companySchema.plugin(autopopulate);

const companyModel = mongoose.model<
  CompanyDocument,
  PaginateModel<CompanyDocument>
>("Company", companySchema);

export { companyModel };
