import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { AccountingSettingsDocument } from "@mongodb-types";

export { AccountingSettingsDocument };

const accountingSettingsSchema = new Schema(
  {
    invoiceSequence: {
      type: Schema.Types.ObjectId,
      ref: "Sequence",
      required: false,
      default: null,
      autopopulate: { maxDepth: 1 },
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
  },
);

accountingSettingsSchema.plugin(paginate);
accountingSettingsSchema.plugin(autopopulate);

const accountingSettingsModel = mongoose.model<
  AccountingSettingsDocument,
  PaginateModel<AccountingSettingsDocument>
>("AccountingSettings", accountingSettingsSchema);

export { accountingSettingsModel };
