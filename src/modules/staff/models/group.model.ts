import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { GroupDocument } from "@mongodb-types";

/** Mongoose schema for staff group records */
const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    staff_ids: [
      {
        staff_id: {
          type: Schema.Types.ObjectId,
          ref: "Staff",
          required: true,
          autopopulate: { maxDepth: 1 },
        },
        role: {
          type: String,
          enum: ["Supervisor", "Nurse", "Caregiver", "Charge Nurse"],
          required: true,
        },
      },
    ],
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

groupSchema.plugin(paginate);
groupSchema.plugin(autopopulate);

/** Mongoose paginate model for Group documents */
const groupModel = mongoose.model<GroupDocument, PaginateModel<GroupDocument>>(
  "Group",
  groupSchema,
);

export { groupModel };
