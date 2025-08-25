import { Schema, Types } from "mongoose";

const fileSchema = new Schema({
  fileId: { type: Types.ObjectId, required: true },
  name: { type: String, required: true },
  mimeType: String,
  size: Number,
});

export { fileSchema };
