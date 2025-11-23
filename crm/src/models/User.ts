import { Schema, model, Document } from 'mongoose';

export interface UserDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'sales';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'sales'], default: 'sales' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default model<UserDocument>('User', UserSchema);
