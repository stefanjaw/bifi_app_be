import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
export type AiSettingsDocument = mongoose.Document & {
  aiProvider?: string;
  apiKey?: string;
  model?: string;
  embeddingModel?: string;
  maxTokenLimit?: number;
  promptVersions?: Array<{
    _id?: string;
    name?: string;
    prompt?: string;
    version?: number;
  }>;
};

const promptVersionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { _id: true },
);

const aiSettingsSchema = new Schema(
  {
    aiProvider: {
      type: String,
      required: false,
      default: "google-gems",
    },
    apiKey: {
      type: String,
      required: false,
    },
    model: {
      type: String,
      required: false,
      default: "gemini-2.5-flash",
    },
    embeddingModel: {
      type: String,
      required: false,
      default: "text-embedding-004",
    },
    maxTokenLimit: {
      type: Number,
      required: false,
      default: 10000,
    },
    promptVersions: {
      type: [promptVersionSchema],
      required: false,
      default: [],
    },
  },
  {
    collection: "aisettings",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

aiSettingsSchema.plugin(paginate);
aiSettingsSchema.plugin(autopopulate);

const aiSettingsModel = mongoose.model<
  AiSettingsDocument,
  PaginateModel<AiSettingsDocument>
>("AiSettings", aiSettingsSchema);

export { aiSettingsModel };
