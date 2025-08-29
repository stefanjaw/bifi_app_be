import { Schema, Types } from "mongoose";

const fileSchema = new Schema({
  fileId: { type: Types.ObjectId, required: true },
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  fileMetadata: { type: Object, required: false },
});

export { fileSchema };
