import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type EmailEventDocument = mongoose.Document & {
  campaignId?: any;
  subscriberId?: any;
  email?: string;
  type?: string;
  providerMessageId?: string;
  url?: string;
  meta?: any;
  active?: boolean;
};

const emailEventSchema = new Schema(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "EmailCampaign",
      required: false,
      autopopulate: { maxDepth: 1, select: "name subject" },
    },
    subscriberId: {
      type: Schema.Types.ObjectId,
      ref: "Subscriber",
      required: false,
      autopopulate: { maxDepth: 1, select: "email name" },
    },
    email: { type: String, default: "" },
    type: {
      type: String,
      enum: [
        "sent",
        "delivered",
        "open",
        "click",
        "bounce",
        "complaint",
        "unsubscribe",
        "failed",
      ],
      required: true,
    },
    providerMessageId: { type: String, default: "" },
    url: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    active: { type: Boolean, default: true },
  },
  {
    collection: "emailevents",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

emailEventSchema.plugin(paginate);
emailEventSchema.plugin(autopopulate);

const emailEventModel = mongoose.model<
  EmailEventDocument,
  PaginateModel<EmailEventDocument>
>("EmailEvent", emailEventSchema);

export { emailEventModel };
