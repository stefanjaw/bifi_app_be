import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ContactLabelDocument } from "@mongodb-types";

/** Mongoose schema for contact label records */
const contactLabelSchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

contactLabelSchema.plugin(paginate);
contactLabelSchema.plugin(autopopulate);

/** Mongoose paginate model for ContactLabel */
const contactLabelModel = mongoose.model<
  ContactLabelDocument,
  PaginateModel<ContactLabelDocument>
>("ContactLabel", contactLabelSchema);
export { contactLabelModel };
export { ContactLabelDocument };
