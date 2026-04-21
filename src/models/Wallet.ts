import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  organizer: mongoose.Types.ObjectId;
  balance: number; // Cleared funds available for withdrawal
  pendingBalance: number; // Funds held in escrow until event completion
  totalEarnings: number; // Lifetime earnings (useful for analytics)
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    totalEarnings: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "NGN" },
  },
  { timestamps: true },
);

export const Wallet =
  mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", walletSchema);
