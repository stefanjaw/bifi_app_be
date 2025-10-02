import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { CompanyDocument } from "@mongodb-types";

const companySchema = new Schema(
  {
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
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      // depth must be of one level
      autopopulate: {
        select: "name lastName email", // Fields to select from the parent contact
        maxDepth: 1, // Limit depth to one level
      },
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
