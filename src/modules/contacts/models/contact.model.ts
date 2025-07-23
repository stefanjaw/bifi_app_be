import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ContactDocument } from "@mongodb-types";

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
    required: false,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: "Contact",
    required: false,
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
});

contactSchema.plugin(paginate);
contactSchema.plugin(autopopulate);

const contactModel = mongoose.model<
  ContactDocument,
  PaginateModel<ContactDocument>
>("Contact", contactSchema);

export { contactModel };
