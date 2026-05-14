import mongoose, { Schema } from "mongoose";

export interface IDiscount {
  _id?: mongoose.Types.ObjectId;
  code: string;
  discountPercentage: number;
  usageLimit?: number; // Total times this can be used (e.g., first 50 people)
  usedCount: number;
  expiryDate?: Date; // Stores both Date and Time (ISO format)
  isActive: boolean;
  applicableTickets: string[];
}

export const discountSchema = new Schema<IDiscount>({
  code: { type: String, required: true, uppercase: true, trim: true },
  discountPercentage: { type: Number, required: true, min: 1, max: 100 },
  usageLimit: { type: Number, default: null }, // Null means unlimited
  usedCount: { type: Number, default: 0 },
  expiryDate: { type: Date, default: null }, // Stores YYYY-MM-DDTHH:mm:ss
  isActive: { type: Boolean, default: true },
  applicableTickets: { type: [String], default: [] },
});

export const Discount =
  mongoose.models.Discount ||
  mongoose.model<IDiscount>("Discount", discountSchema);
