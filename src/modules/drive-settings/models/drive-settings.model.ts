import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type DriveSettingsDocument = mongoose.Document & {
  serviceAccountKey?: string;
};

const driveSettingsSchema = new Schema(
  {
    serviceAccountKey: {
      type: String,
      required: false,
    },
  },
  {
    collection: "drivesettings",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

driveSettingsSchema.plugin(paginate);
driveSettingsSchema.plugin(autopopulate);

const driveSettingsModel = mongoose.model<
  DriveSettingsDocument,
  PaginateModel<DriveSettingsDocument>
>("DriveSettings", driveSettingsSchema);

export { driveSettingsModel };
