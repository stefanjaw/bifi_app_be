import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ContactDocument } from "@mongodb-types";

const contactSchema = new Schema(
  {
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
    type: {
      type: String,
      enum: ["individual", "company"],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

contactSchema.virtual("childIds", {
  ref: "Contact",
  localField: "_id",
  foreignField: "parentId",
  autopopulate: {
    select: "name lastName email phoneNumber type", // Fields to select from the child contacts
    maxDepth: 1,
  },
  match: { active: true },
});

contactSchema.plugin(paginate);
contactSchema.plugin(autopopulate);

const contactModel = mongoose.model<
  ContactDocument,
  PaginateModel<ContactDocument>
>("Contact", contactSchema);

export { contactModel };
