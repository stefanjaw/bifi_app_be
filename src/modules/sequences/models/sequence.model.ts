import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type SequenceDocument = mongoose.Document & {
  name: string;
  prefix: string;
  suffix?: string;
  number: number;
  step: number;
  size: number;
  nogap: boolean;
  active: boolean;
  description?: string;
};

const sequenceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    prefix: {
      type: String,
      required: true,
      unique: true,
    },
    suffix: {
      type: String,
      required: false,
    },
    number: {
      type: Number,
      required: true,
      default: 1,
    },
    step: {
      type: Number,
      required: true,
      default: 1,
    },
    size: {
      type: Number,
      required: true,
      default: 6,
    },
    nogap: {
      type: Boolean,
      required: true,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

sequenceSchema.plugin(paginate);
sequenceSchema.plugin(autopopulate);

const sequenceModel = mongoose.model<SequenceDocument, PaginateModel<SequenceDocument>>(
  "Sequence",
  sequenceSchema
);

export { sequenceModel };
