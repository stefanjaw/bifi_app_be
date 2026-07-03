import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type SubscriberDocument = mongoose.Document & {
  email?: string;
  name?: string;
  listId?: any;
  contactId?: any;
  status?: string;
  tags?: string[];
  customFields?: any;
  subscribedAt?: Date;
  unsubscribedAt?: Date;
  bouncedAt?: Date;
  active?: boolean;
};

const subscriberSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, default: "" },
    listId: {
      type: Schema.Types.ObjectId,
      ref: "MailingList",
      required: true,
      autopopulate: { maxDepth: 1 },
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: false,
      autopopulate: { maxDepth: 1, select: "name lastName email phoneNumber" },
    },
    status: {
      type: String,
      enum: ["subscribed", "unsubscribed", "bounced", "complained"],
      default: "subscribed",
    },
    tags: { type: [String], default: [] },
    customFields: { type: Schema.Types.Mixed, default: {} },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, required: false },
    bouncedAt: { type: Date, required: false },
    active: { type: Boolean, default: true },
  },
  {
    collection: "subscribers",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

subscriberSchema.index({ email: 1, listId: 1 }, { unique: true });

subscriberSchema.plugin(paginate);
subscriberSchema.plugin(autopopulate);

const subscriberModel = mongoose.model<
  SubscriberDocument,
  PaginateModel<SubscriberDocument>
>("Subscriber", subscriberSchema);

export { subscriberModel };
