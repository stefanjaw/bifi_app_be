import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BedDocument } from "@mongodb-types";

const bedSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    type: { type: String, required: true },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      autopopulate: { select: "name code facilityId active", maxDepth: 1 },
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: false,
      autopopulate: { select: "dob contactId language active", maxDepth: 1 },
    },
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: false,
      autopopulate: { select: "name lastName email phoneNumber", maxDepth: 1 },
    },
    stateCode: {
      type: String,
      enum: ["taken", "reserved", "empty"],
      default: "empty",
    },
    state: {
      type: String,
      enum: ["Taken", "Reserved", "Empty"],
      default: "Empty",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { select: "username email contactId", maxDepth: 1 },
      required: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { select: "username email contactId", maxDepth: 1 },
      required: false,
    },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

bedSchema.plugin(paginate);
bedSchema.plugin(autopopulate);

const bedModel = mongoose.model<BedDocument, PaginateModel<BedDocument>>(
  "Bed",
  bedSchema,
);
export { bedModel };
export { BedDocument };
