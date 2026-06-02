import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type EmailSettingsDocument = mongoose.Document & {
  provider?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  resendApiKey?: string;
  mailgunApiKey?: string;
  mailgunDomain?: string;
  mailgunRegion?: string;
  sesAccessKeyId?: string;
  sesSecretAccessKey?: string;
  sesRegion?: string;
  sendgridApiKey?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  footerText?: string;
  unsubscribeText?: string;
  testMode?: boolean;
  testRecipient?: string;
  publicBaseUrl?: string;
};

const emailSettingsSchema = new Schema(
  {
    provider: {
      type: String,
      enum: ["resend", "mailgun", "ses", "sendgrid"],
      required: false,
      default: "resend",
    },
    fromName: { type: String, required: false, default: "" },
    fromEmail: { type: String, required: false, default: "" },
    replyTo: { type: String, required: false, default: "" },
    resendApiKey: { type: String, required: false },
    mailgunApiKey: { type: String, required: false },
    mailgunDomain: { type: String, required: false },
    mailgunRegion: {
      type: String,
      enum: ["us", "eu"],
      required: false,
      default: "us",
    },
    sesAccessKeyId: { type: String, required: false },
    sesSecretAccessKey: { type: String, required: false },
    sesRegion: { type: String, required: false, default: "us-east-1" },
    sendgridApiKey: { type: String, required: false },
    trackOpens: { type: Boolean, required: false, default: true },
    trackClicks: { type: Boolean, required: false, default: true },
    footerText: { type: String, required: false, default: "" },
    unsubscribeText: {
      type: String,
      required: false,
      default: "Unsubscribe",
    },
    testMode: { type: Boolean, required: false, default: false },
    testRecipient: { type: String, required: false, default: "" },
    publicBaseUrl: { type: String, required: false, default: "" },
  },
  {
    collection: "emailsettings",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

emailSettingsSchema.plugin(paginate);
emailSettingsSchema.plugin(autopopulate);

const emailSettingsModel = mongoose.model<
  EmailSettingsDocument,
  PaginateModel<EmailSettingsDocument>
>("EmailSettings", emailSettingsSchema);

export { emailSettingsModel };
