import mongoose, { Schema, Document } from "mongoose";
import { TICKET_STATUS, TicketStatus } from "../lib/constants.js";

export interface ITicket extends Document {
  event: mongoose.Types.ObjectId;
  owner?: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  tierName: string;
  pricePaid: number;

  buyerInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };

  ticketCode: string;
  qrCodeData: string;
  status: TicketStatus;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: false },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    tierName: { type: String, required: true },
    pricePaid: { type: Number, required: true },

    buyerInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
    },

    ticketCode: { type: String, required: true, unique: true },
    qrCodeData: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.keys(TICKET_STATUS),
      default: "valid",
    },
    checkedInAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
ticketSchema.index({ owner: 1 });
ticketSchema.index({ "buyerInfo.email": 1 });

export const Ticket =
  mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", ticketSchema);
