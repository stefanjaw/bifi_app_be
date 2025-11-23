// src/models/Company.ts
import { Schema, model, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  annualRevenue?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true },
  industry: String,
  website: String,
  phone: String,
  annualRevenue: Number,
}, { timestamps: true });

export default model<ICompany>('Company', CompanySchema);