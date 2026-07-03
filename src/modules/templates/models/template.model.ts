import { TemplateDocument } from "@mongodb-types";
import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";

const templateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    codeOriginal: {
      type: String,
      required: false,
    },
    codeCustom: {
      type: String,
      required: false,
    },
    directory: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      enum: [
        "text/typescript",
        "application/typescript",
        "application/javascript",
        "text/javascript",
        "text/html",
        "text/css",
      ],
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

templateSchema.plugin(paginate);

const templateModel = mongoose.model<
  TemplateDocument,
  PaginateModel<TemplateDocument>
>("Template", templateSchema);

export { templateModel };
