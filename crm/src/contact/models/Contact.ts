// src/models/Contact.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IContact extends Document {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  company?: Types.ObjectId; // Reference to Company
  owner?: Types.ObjectId;   // User who owns this contact (optional)
  leadSource?: string;
  lifecycleStage?: 'lead' | 'opportunity' | 'customer' | 'evangelist';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: String,
  mobile: String,
  jobTitle: String,
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  leadSource: {
    type: String,
    enum: ['website', 'referral', 'cold call', 'social media', 'event', 'other'],
    default: 'other'
  },
  lifecycleStage: {
    type: String,
    enum: ['lead', 'opportunity', 'customer', 'evangelist'],
    default: 'lead'
  },
  notes: String,
}, { timestamps: true });

// Virtual: full name
ContactSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export default model<IContact>('Contact', ContactSchema);