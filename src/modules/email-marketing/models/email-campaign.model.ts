import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type CampaignStats = {
  recipients?: number;
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  bounced?: number;
  complained?: number;
  unsubscribed?: number;
  failed?: number;
};

export type EmailCampaignDocument = mongoose.Document & {
  name?: string;
  subject?: string;
  previewText?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  templateId?: any;
  designJson?: any;
  mjml?: string;
  html?: string;
  listIds?: any[];
  status?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  stats?: CampaignStats;
  active?: boolean;
};

const statsSchema = new Schema(
  {
    recipients: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    complained: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  { _id: false }
);

const emailCampaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    previewText: { type: String, default: "" },
    fromName: { type: String, default: "" },
    fromEmail: { type: String, default: "" },
    replyTo: { type: String, default: "" },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "EmailTemplate",
      required: false,
      autopopulate: { maxDepth: 1, select: "name category" },
    },
    designJson: { type: Schema.Types.Mixed, default: null },
    mjml: { type: String, default: "" },
    html: { type: String, default: "" },
    listIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "MailingList",
        autopopulate: { maxDepth: 1 },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "sent", "failed", "cancelled"],
      default: "draft",
    },
    scheduledAt: { type: Date, required: false },
    sentAt: { type: Date, required: false },
    stats: { type: statsSchema, default: () => ({}) },
    active: { type: Boolean, default: true },
  },
  {
    collection: "emailcampaigns",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

emailCampaignSchema.plugin(paginate);
emailCampaignSchema.plugin(autopopulate);

const emailCampaignModel = mongoose.model<
  EmailCampaignDocument,
  PaginateModel<EmailCampaignDocument>
>("EmailCampaign", emailCampaignSchema);

export { emailCampaignModel };
