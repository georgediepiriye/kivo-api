import mongoose, { Schema, Document } from "mongoose";
import {
  EventCategory,
  KivoType,
  EVENT_TYPES,
  EVENT_CATEGORIES,
} from "../lib/constants";

// Define the Ticket Tier structure
interface ITicketTier {
  name: string; // e.g., "Early Bird", "VIP", "Table for 4"
  price: number;
  capacity: number;
  sold: number;
  description?: string;
}

export interface IEvent extends Document {
  title: string;
  description: string;
  category: EventCategory;
  startDate: Date;
  endDate: Date;
  type: KivoType;
  status: "casual" | "verified" | "featured";

  // Privacy & Visibility
  isPublic: boolean;
  allowAnonymous: boolean;

  location: {
    type: "Point";
    coordinates: [number, number];
    address: string;
    neighborhood: string;
  };
  image: string;
  organizer: mongoose.Types.ObjectId;
  organizerType: "individual" | "business";

  // Ticketing & Inventory
  isFree: boolean;
  ticketTiers: ITicketTier[];
  totalCapacity?: number; // Aggregate of all tiers or a hard limit

  // Engagement & Stats
  attendees: number;
  participantImages: string[];

  // Rules & Admin
  ageRestriction?: string; // e.g., "18+", "All Ages"
  refundPolicy: "none" | "flexible" | "24h";
  tags: string[];
  externalTicketLink?: string; // If hosted elsewhere
  isCancelled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ticketTierSchema = new Schema<ITicketTier>({
  name: { type: String, required: true },
  price: { type: Number, default: 0, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  sold: { type: Number, default: 0 },
  description: String,
});

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    type: {
      type: String,
      enum: Object.keys(EVENT_TYPES),
      default: "activity",
    },
    status: {
      type: String,
      enum: ["casual", "verified", "featured"],
      default: "casual",
    },
    category: {
      type: String,
      enum: Object.keys(EVENT_CATEGORIES),
      required: [true, "Please select a category"],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowAnonymous: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: [true, "Please specify when the event starts"],
    },
    endDate: {
      type: Date,
      required: [true, "Please specify when the event ends"],
      validate: {
        validator: function (this: any, value: Date): boolean {
          return value > this.startDate;
        },
        message: "End date must be after the start date",
      },
    },
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        required: [true, "Coordinates are required for the map"],
      },
      address: String,
      neighborhood: {
        type: String,
        required: [true, "Neighborhood is required for local discovery"],
      },
    },
    image: {
      type: String,
      default: "https://picsum.photos/seed/kivo/1200/800",
    },
    isFree: { type: Boolean, default: true },

    // The "World-Class" Ticketing Update
    ticketTiers: [ticketTierSchema],

    totalCapacity: {
      type: Number,
      default: null,
    },
    attendees: { type: Number, default: 0 },
    participantImages: [{ type: String }],
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Every activity/showcase must have a host"],
    },
    organizerType: {
      type: String,
      enum: ["individual", "business"],
      default: "individual",
    },

    // Additional Global Metadata
    ageRestriction: { type: String, default: "All Ages" },
    refundPolicy: {
      type: String,
      enum: ["none", "flexible", "24h"],
      default: "none",
    },
    tags: [{ type: String }],
    externalTicketLink: String,
    isCancelled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for getting the starting price
eventSchema.virtual("startingPrice").get(function () {
  if (this.isFree || !this.ticketTiers || this.ticketTiers.length === 0)
    return 0;
  return Math.min(...this.ticketTiers.map((tier) => tier.price));
});

// Indexes
eventSchema.index({ location: "2dsphere" });
eventSchema.index({ type: 1, category: 1, startDate: 1 });
eventSchema.index({ isPublic: 1, allowAnonymous: 1 });
eventSchema.index({ tags: 1 }); // Great for Scout AI searches

export const Event =
  mongoose.models.Event || mongoose.model<IEvent>("Event", eventSchema);
