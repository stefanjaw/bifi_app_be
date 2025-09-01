import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ActivityHistoryDocument } from "@mongodb-types";

const activityHistorySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: false,
    },
    performDate: {
      type: Date,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    modelId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "model",
      autopopulate: {
        depth: 1,
      },
    },
    metadata: {
      type: Object,
      required: false,
      default: null,
    },
    //   userId: {
    //     type: Schema.Types.ObjectId,
    //     ref: "User",
    //     required: true,
    //     autopopulate: true,
    //   },
  },
  {
    toObject: { virtuals: true }, // Include virtuals in toObject output
    toJSON: { virtuals: true }, // Include virtuals in toJSON output
  }
);

// activityHistorySchema.post("find" as any, async function (docs, next) {
//   if (!docs || !Array.isArray(docs)) return next();

//   for (let doc of docs) {
//     await doc.populate("modelId").execPopulate();
//   }

//   next();
// });

activityHistorySchema.plugin(paginate);
activityHistorySchema.plugin(autopopulate);

const activityHistoryModel = mongoose.model<
  ActivityHistoryDocument,
  PaginateModel<ActivityHistoryDocument>
>("ActivityHistory", activityHistorySchema);

export { activityHistoryModel };
