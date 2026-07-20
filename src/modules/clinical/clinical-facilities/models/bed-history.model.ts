import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BedHistoryDocument } from "@mongodb-types";

const bedHistorySchema = new Schema(
  {
    action: { type: String, required: true },
    description: { type: String, default: "" },
    bedId: {
      type: Schema.Types.ObjectId,
      ref: "Bed",
      required: true,
      autopopulate: { select: "name type state stateCode roomId", maxDepth: 1 },
    },
    effective: { type: Boolean, required: true },
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
  { timestamps: true },
);

bedHistorySchema.plugin(paginate);
bedHistorySchema.plugin(autopopulate);

const bedHistoryModel = mongoose.model<
  BedHistoryDocument,
  PaginateModel<BedHistoryDocument>
>("BedHistory", bedHistorySchema);
export { bedHistoryModel };
export { BedHistoryDocument };
