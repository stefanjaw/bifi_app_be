import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type NotificationEventSettingsDocument = mongoose.Document & {
  events: Array<{ type: string; enabled: boolean; recipients: string[] }>;
};

const eventSchema = new Schema(
  {
    type: { type: String, required: true },
    enabled: { type: Boolean, required: true, default: true },
    recipients: { type: [String], required: false, default: [] },
  },
  { _id: false },
);

const notificationSettingsSchema = new Schema(
  {
    events: { type: [eventSchema], required: false, default: [] },
  },
  {
    collection: "notificationeventsettings",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

notificationSettingsSchema.plugin(paginate);
notificationSettingsSchema.plugin(autopopulate);

const notificationSettingsModel = mongoose.model<
  NotificationEventSettingsDocument,
  PaginateModel<NotificationEventSettingsDocument>
>("NotificationEventSettings", notificationSettingsSchema);

export { notificationSettingsModel };
