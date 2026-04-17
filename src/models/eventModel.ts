import mongoose, { Schema, Document } from "mongoose";
import {
  EventCategory,
  KivoType,
  EVENT_TYPES,
  EVENT_CATEGORIES,
} from "../lib/constants";

interface ITicketTier {
  name: string;
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

  // Format Update
  eventFormat: "physical" | "online" | "hybrid";
  isOnline: boolean;

  isPublic: boolean;
  allowAnonymous: boolean;

  location?: {
    type: "Point";
    coordinates: [number, number];
    address: string;
    neighborhood: string;
  };

  image: string;
  organizer: mongoose.Types.ObjectId;
  organizerType: "individual" | "business";

  isFree: boolean;
  ticketingType: "none" | "internal" | "external";
  ticketTiers: ITicketTier[];
  totalCapacity?: number;

  // Links
  joinLink?: string;
  meetingLink?: string; // Specific for Online/Hybrid
  externalTicketLink?: string;

  attendees: number;
  participantImages: string[];
  ageRestriction?: string;
  refundPolicy: "none" | "flexible" | "24h";
  tags: string[];
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
    // FORMAT LOGIC
    eventFormat: {
      type: String,
      enum: ["physical", "online", "hybrid"],
      default: "physical",
    },
    isOnline: {
      type: Boolean,
      default: false,
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
    isPublic: { type: Boolean, default: true },
    allowAnonymous: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        // Remove the default: "Point" here!
        // Only set it if you have coordinates.
        required: function () {
          return this.eventFormat !== "online";
        },
      },
      coordinates: {
        type: [Number],
        required: function () {
          return this.eventFormat !== "online";
        },
      },
      address: String,
      neighborhood: String,
    },

    image: {
      type: String,
      default: "https://picsum.photos/seed/kivo/1200/800",
    },
    isFree: { type: Boolean, default: true },
    ticketingType: {
      type: String,
      enum: ["none", "internal", "external"],
      default: "none",
    },
    ticketTiers: [ticketTierSchema],

    // LINK LOGIC
    joinLink: { type: String, trim: true }, // CTA for free events
    meetingLink: { type: String, trim: true }, // The actual Zoom/Meet URL
    externalTicketLink: { type: String, trim: true },

    totalCapacity: { type: Number, default: null },
    attendees: { type: Number, default: 0 },
    participantImages: [{ type: String }],
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizerType: {
      type: String,
      enum: ["individual", "business"],
      default: "individual",
    },
    ageRestriction: { type: String, default: "All Ages" },
    refundPolicy: {
      type: String,
      enum: ["none", "flexible", "24h"],
      default: "none",
    },
    tags: [{ type: String }],
    isCancelled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for Price
eventSchema.virtual("startingPrice").get(function () {
  if (this.isFree || !this.ticketTiers || this.ticketTiers.length === 0)
    return 0;
  return Math.min(...this.ticketTiers.map((tier) => tier.price));
});

// Auto-calculate capacity
eventSchema.pre("save", function () {
  if (this.ticketingType === "internal" && this.ticketTiers?.length > 0) {
    this.totalCapacity = this.ticketTiers.reduce(
      (acc, tier) => acc + (tier.capacity || 0),
      0,
    );
  }
});

// In your Event Model
eventSchema.virtual("priceLabel").get(function () {
  if (
    this.ticketingType === "none" ||
    !this.ticketTiers ||
    this.ticketTiers.length === 0
  ) {
    return "Free";
  }

  const prices = this.ticketTiers.map((t) => t.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === 0 && max === 0) return "Free";
  if (min === 0 && max > 0) return `Free - ₦${max.toLocaleString()}`;
  if (min === max) return `₦${min.toLocaleString()}`;
  return `₦${min.toLocaleString()} - ₦${max.toLocaleString()}`;
});

// Keep indexes but allow sparse for location
eventSchema.index({ location: "2dsphere" }, { sparse: true });
eventSchema.index({ "location.neighborhood": 1 }, { sparse: true });

export const Event =
  mongoose.models.Event || mongoose.model<IEvent>("Event", eventSchema);
