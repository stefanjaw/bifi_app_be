import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export interface contact {
  _id: string;
  name: string;
  lastName: string;
  phoneNumber?: string; // Optional field
  email: string;
  parentId?: string;
  active: boolean;
}

const contactSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: false, // Optional field
  },
  email: {
    type: String,
    required: true,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: "Contact",
    required: false,
    autopopulate: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

contactSchema.plugin(paginate);
contactSchema.plugin(autopopulate);

const contactModel = mongoose.model<contact, PaginateModel<contact>>(
  "Contact",
  contactSchema
);

export { contactModel };
