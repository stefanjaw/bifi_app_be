import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ReportingDocument } from "@mongodb-types";

export const reportingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    template: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

reportingSchema.plugin(paginate);
reportingSchema.plugin(autopopulate);

const reportingModel = mongoose.model<
  ReportingDocument,
  PaginateModel<ReportingDocument>
>("Reporting", reportingSchema);

export { reportingModel };
