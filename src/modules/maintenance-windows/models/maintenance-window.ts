import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export interface maintenanceWindow {
  _id: string;
  name: string;
  daysBefore: number;
  daysAfter: number;
  recurrency:
    | "daily"
    | "weekly"
    | "monthly"
    | "quarterly"
    | "semi-anually"
    | "annually";
  active: boolean;
}

const maintenanceWindowSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  daysBefore: {
    type: Number,
    required: true,
  },
  daysAfter: {
    type: Number,
    required: true,
  },
  recurrency: {
    type: String,
    enum: [
      "daily",
      "weekly",
      "monthly",
      "quarterly",
      "semi-anually",
      "annually",
    ],
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

maintenanceWindowSchema.plugin(paginate);
maintenanceWindowSchema.plugin(autopopulate);

const maintenanceWindowModel = mongoose.model<
  maintenanceWindow,
  PaginateModel<maintenanceWindow>
>("MaintenanceWindow", maintenanceWindowSchema);

export { maintenanceWindowModel };
