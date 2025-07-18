import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { MaintenanceWindowDocument } from "@mongodb-types";
import { ManipulateType } from "dayjs";

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

maintenanceWindowSchema.methods.parseRecurrencyForDayjs = function () {
  const recurrency = this.recurrency;
  let unit: ManipulateType;
  let count: number = 1;

  if (recurrency === "daily") {
    unit = "day";
  } else if (recurrency === "weekly") {
    unit = "week";
  } else if (recurrency === "monthly") {
    unit = "month";
  } else if (recurrency === "quarterly") {
    unit = "month";
    count = 3;
  } else if (recurrency === "semi-anually") {
    unit = "month";
    count = 6;
  } else {
    unit = "year";
  }

  return { unit, count };
};

const maintenanceWindowModel = mongoose.model<
  MaintenanceWindowDocument,
  PaginateModel<MaintenanceWindowDocument>
>("MaintenanceWindow", maintenanceWindowSchema);

export { maintenanceWindowModel };
