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
    purchasePayableAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: false,
      default: null,
      autopopulate: { select: "code name", maxDepth: 1 },
    },
    depreciationJournalId: {
      type: Schema.Types.ObjectId,
      ref: "Journal",
      required: false,
      default: null,
      autopopulate: { maxDepth: 1 },
    },
    discountGrantedAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: false,
      default: null,
      autopopulate: { select: "code name", maxDepth: 1 },
    },
    inventoryAccounts: {
      type: new Schema(
        {
          inventoryAccountId: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: false,
            default: null,
          },
          cogsAccountId: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: false,
            default: null,
          },
          adjustmentLossAccountId: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: false,
            default: null,
          },
          apPendingAccountId: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: false,
            default: null,
          },
          defaultCurrencyId: {
            type: Schema.Types.ObjectId,
            ref: "Currency",
            required: false,
            default: null,
          },
        },
        { _id: false },
      ),
      required: false,
      default: null,
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
