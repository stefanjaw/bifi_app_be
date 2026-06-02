import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type EmailTemplateDocument = mongoose.Document & {
  name?: string;
  description?: string;
  category?: string;
  designJson?: any;
  mjml?: string;
  html?: string;
  thumbnail?: string;
  active?: boolean;
};

const emailTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    designJson: { type: Schema.Types.Mixed, default: null },
    mjml: { type: String, default: "" },
    html: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  {
    collection: "emailtemplates",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

emailTemplateSchema.plugin(paginate);
emailTemplateSchema.plugin(autopopulate);

const emailTemplateModel = mongoose.model<
  EmailTemplateDocument,
  PaginateModel<EmailTemplateDocument>
>("EmailTemplate", emailTemplateSchema);

export { emailTemplateModel };
