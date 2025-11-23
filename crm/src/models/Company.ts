import { Schema, model, Document } from 'mongoose';

export interface CompanyDocument extends Document {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  owner: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const CompanySchema = new Schema<CompanyDocument>(
  {
    name: { type: String, required: true },
    industry: String,
    website: String,
    phone: String,
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default model<CompanyDocument>('Company', CompanySchema);
