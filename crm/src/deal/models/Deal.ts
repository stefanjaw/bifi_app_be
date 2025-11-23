// src/models/Deal.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IDeal extends Document {
  title: string;
  amount: number;
  currency: string;
  stage:
    | 'prospecting'
    | 'qualification'
    | 'proposal'
    | 'negotiation'
    | 'closed-won'
    | 'closed-lost';
  probability: number; // 0–100
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  contact: Types.ObjectId;     // Primary contact
  company: Types.ObjectId;     // Associated company
  owner?: Types.ObjectId;      // User who owns the deal
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    stage: {
      type: String,
      enum: [
        'prospecting',
        'qualification',
        'proposal',
        'negotiation',
        'closed-won',
        'closed-lost',
      ],
      default: 'prospecting',
    },
    probability: { type: Number, min: 0, max: 100, default: 10 },
    expectedCloseDate: Date,
    actualCloseDate: Date,
    contact: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    description: String,
    notes: String,
  },
  { timestamps: true }
);

// Auto-update actualCloseDate when stage becomes closed-won/lost
DealSchema.pre('save', function (next) {
  if (this.isModified('stage')) {
    if (this.stage === 'closed-won' || this.stage === 'closed-lost') {
      if (!this.actualCloseDate) this.actualCloseDate = new Date();
    }
  }
  next();
});

export default model<IDeal>('Deal', DealSchema);