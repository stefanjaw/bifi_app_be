import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { MaintenanceWindowDocument } from "../../../types/mongoose.gen";

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
  MaintenanceWindowDocument,
  PaginateModel<MaintenanceWindowDocument>
>("MaintenanceWindow", maintenanceWindowSchema);

export { maintenanceWindowModel };
