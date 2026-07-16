import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ProgressNoteDocument } from "@mongodb-types";

/** Mongoose schema for progress note records */
const progressNoteSchema = new Schema(
  {
    careContinuumId: {
      type: Schema.Types.ObjectId,
      ref: "CareContinuum",
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
    contentTitle: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
    },
    notes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Note",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
    readBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          autopopulate: {
            select: "username email",
            maxDepth: 1,
          },
        },
        status: {
          type: String,
          enum: ["read", "unread", "updated"],
        },
      },
    ],
    byName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "note",
    },
    progressNoteType: {
      type: String,
      default: "medical",
    },
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

progressNoteSchema.plugin(paginate);
progressNoteSchema.plugin(autopopulate);

/** Mongoose paginate model for ProgressNote documents */
const progressNoteModel = mongoose.model<
  ProgressNoteDocument,
  PaginateModel<ProgressNoteDocument>
>("ProgressNote", progressNoteSchema);

export { progressNoteModel };
