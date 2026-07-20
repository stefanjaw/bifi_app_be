import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { RecurrentTaskDocument } from "@mongodb-types";

const recurrentTaskSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: false },
    deltaTime: { type: Number, default: 5 },
    type: { type: String, required: true },
    repetitionTimes: { type: Number, default: 100 },
    repetitionLapse: { type: Number, default: 1 },
    repetitionSequence: {
      type: String,
      enum: [
        "annually",
        "monthly",
        "weekly",
        "daily",
        "firstInMonth",
        "secondInMonth",
        "thirdInMonth",
        "fourthInMonth",
      ],
      default: "daily",
    },
    repetitionDays: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      default: [],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: false,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

recurrentTaskSchema.plugin(paginate);
recurrentTaskSchema.plugin(autopopulate);

const recurrentTaskModel = mongoose.model<
  RecurrentTaskDocument,
  PaginateModel<RecurrentTaskDocument>
>("RecurrentTask", recurrentTaskSchema);
export { recurrentTaskModel };
export { RecurrentTaskDocument };
