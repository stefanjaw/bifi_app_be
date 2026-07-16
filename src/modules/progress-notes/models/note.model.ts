import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { NoteDocument } from "@mongodb-types";

/** Mongoose schema for note records */
const noteSchema = new Schema(
  {
    careContinuumId: {
      type: Schema.Types.ObjectId,
      ref: "CareContinuum",
      required: true,
      autopopulate: {
        maxDepth: 1,
      },
    },
    progressNoteId: {
      type: Schema.Types.ObjectId,
      ref: "ProgressNote",
      required: true,
      autopopulate: {
        maxDepth: 1,
      },
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      autopopulate: {
        maxDepth: 1,
      },
    },
    date: {
      type: Date,
    },
    contentBody: {
      type: String,
      required: true,
    },
    byName: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      enum: ["Read", "Unread"],
      required: true,
    },
    type: {
      type: String,
      default: "note",
    },
    progressNoteTagIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "PatientProgressNoteTag",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email",
        maxDepth: 1,
      },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email",
        maxDepth: 1,
      },
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

noteSchema.plugin(paginate);
noteSchema.plugin(autopopulate);

/** Mongoose paginate model for Note documents */
const noteModel = mongoose.model<NoteDocument, PaginateModel<NoteDocument>>(
  "Note",
  noteSchema,
);

export { noteModel };
