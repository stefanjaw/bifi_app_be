import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export enum AccountType {
  ASSET = "asset",
  LIABILITY = "liability",
  EQUITY = "equity",
  INCOME = "income",
  EXPENSE = "expense",
}

export interface AccountDocument extends mongoose.Document {
  companyId?: any;
  code: string;
  name: string;
  type: AccountType;
  parentAccountId?: any;
  currencyId?: any;
  active: boolean;
}

const accountSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: false,
      autopopulate: {
        select: "name",
        maxDepth: 1,
      },
    },
    code: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(AccountType),
      required: true,
    },
    parentAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: false,
      autopopulate: {
        select: "code name",
        maxDepth: 1,
      },
    },
    currencyId: {
      type: Schema.Types.ObjectId,
      ref: "Currency",
      required: false,
      autopopulate: {
        select: "name code symbol",
        maxDepth: 1,
      },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

accountSchema.plugin(paginate);
accountSchema.plugin(autopopulate);

export const accountModel = mongoose.model<AccountDocument, PaginateModel<AccountDocument>>(
  "Account",
  accountSchema
);
