import mongoose, { Schema, Document } from "mongoose";

export interface ITicket extends Document {
  event: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  tierName: string; // e.g., "VIP", "Early Bird"
  pricePaid: number;
  ticketCode: string; // Unique human-readable code (e.g., KIVO-ABC-123)
  qrCodeData: string; // The payload for the QR code
  status: "valid" | "used" | "refunded" | "transferred";
  checkedInAt?: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tierName: String,
    pricePaid: Number,
    ticketCode: { type: String, unique: true },
    qrCodeData: { type: String, unique: true },
    status: {
      type: String,
      enum: ["valid", "used", "refunded", "transferred"],
      default: "valid",
    },
    checkedInAt: Date,
  },
  { timestamps: true },
);

export const Ticket =
  mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", ticketSchema);
