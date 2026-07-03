import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type MailingListDocument = mongoose.Document & {
  name?: string;
  description?: string;
  subscriberCount?: number;
  active?: boolean;
};

const mailingListSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subscriberCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  {
    collection: "mailinglists",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

mailingListSchema.plugin(paginate);
mailingListSchema.plugin(autopopulate);

const mailingListModel = mongoose.model<
  MailingListDocument,
  PaginateModel<MailingListDocument>
>("MailingList", mailingListSchema);

export { mailingListModel };
