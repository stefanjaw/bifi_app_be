import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type NotificationDocument = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body: string;
  link: string;
  module: string;
  read: boolean;
  seen: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    module: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
    seen: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

notificationSchema.plugin(paginate);
notificationSchema.plugin(autopopulate);

export const notificationModel = mongoose.model<
  NotificationDocument,
  PaginateModel<NotificationDocument>
>("Notification", notificationSchema);
