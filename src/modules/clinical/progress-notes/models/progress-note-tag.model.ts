import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { PatientProgressNoteTagDocument } from "@mongodb-types";

/** Mongoose schema for progress-note-tag records */
const progressNoteTagSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["adverse", "incident"],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

progressNoteTagSchema.plugin(paginate);
progressNoteTagSchema.plugin(autopopulate);

/** Mongoose paginate model for PatientProgressNoteTag documents */
const progressNoteTagModel = mongoose.model<
  PatientProgressNoteTagDocument,
  PaginateModel<PatientProgressNoteTagDocument>
>("PatientProgressNoteTag", progressNoteTagSchema);

export { progressNoteTagModel };
