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
      required: function (this: ContactDocument) {
        return this.type === "individual";
      },
    },
    phoneNumber: {
      type: String,
      required: false, // Optional field
      // unique: true,
    },
    email: {
      type: String,
      required: false,
      // unique: true,
    },
    website: {
      type: String,
      // required: function (this: ContactDocument) {
      //   return this.type === "company";
      // },
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
    countryId: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      required: false,
      autopopulate: {
        select: "name code", // Fields to select from the country
        maxDepth: 1,
      },
    },
    state: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    zipCode: {
      type: String,
      required: false,
    },
    streetAddress: {
      type: String,
      required: false,
    },
    streetAddress2: {
      type: String,
      required: false,
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
  },
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

//Similar toString in java
contactSchema.virtual("fullName").get(function (this: ContactDocument) {
  return `${this.name} ${this.lastName}`;
});

contactSchema.virtual("displayName").get(function (this: ContactDocument) {
  if (this.parentId?._id) {
    return `${this.parentId.name}, ${this.name} ${this.lastName}`;
  }
  return `${this.name} ${this.lastName}`;
});

contactSchema.virtual("fullAddress").get(function (this: ContactDocument) {
  const parts = [
    this.streetAddress,
    this.streetAddress2,
    this.city,
    this.state,
    this.zipCode,
    this.countryId?.name,
  ].filter((v) => v && v.toString().trim() !== "");

  return parts.length > 0 ? parts.join(", ") : "No address";
});
contactSchema.plugin(paginate);
contactSchema.plugin(autopopulate);

const contactModel = mongoose.model<
  ContactDocument,
  PaginateModel<ContactDocument>
>("Contact", contactSchema);

export { contactModel };
