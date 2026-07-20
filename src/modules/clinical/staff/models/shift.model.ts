import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ShiftDocument } from "@mongodb-types";

/** Mongoose schema for shift records */
const shiftSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      autopopulate: { maxDepth: 1 },
    },
    time_start: {
      type: String,
      required: true,
    },
    time_end: {
      type: String,
      required: true,
    },
    date_start: {
      type: Date,
      required: true,
    },
    date_end: {
      type: Date,
    },
    type: {
      type: String,
      enum: ["Morning", "Evening", "Afternoon"],
      required: true,
    },
    weekdays: [
      {
        weekday: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        group_ids: [
          {
            type: Schema.Types.ObjectId,
            ref: "Group",
            autopopulate: { maxDepth: 1 },
          },
        ],
      },
    ],
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      autopopulate: { maxDepth: 1 },
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      autopopulate: { maxDepth: 1 },
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

shiftSchema.plugin(paginate);
shiftSchema.plugin(autopopulate);

/** Mongoose paginate model for Shift documents */
const shiftModel = mongoose.model<ShiftDocument, PaginateModel<ShiftDocument>>(
  "Shift",
  shiftSchema,
);

export { shiftModel };
