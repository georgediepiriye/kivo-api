import mongoose, { Schema, Document } from "mongoose";
import {
  EventCategory,
  KivoType,
  EVENT_TYPES,
  EVENT_CATEGORIES,
} from "../lib/constants";

export interface IEvent extends Document {
  title: string;
  description: string;
  category: EventCategory;
  startDate: Date;
  endDate: Date;
  type: KivoType;
  status: "casual" | "verified" | "featured";

  // Privacy & Visibility
  isPublic: boolean; // true = anyone can find it, false = invite/link only
  allowAnonymous: boolean; // true = guest/anon users can view details, false = login required

  location: {
    type: "Point";
    coordinates: [number, number];
    address: string;
    neighborhood: string;
  };
  image: string;
  organizer: mongoose.Types.ObjectId;
  organizerType: "individual" | "business";
  price?: number;
  isFree: boolean;
  attendees: number;
  participantImages: string[];
  capacity?: number;
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
      default: true, // Most events should be discoverable by default
    },
    allowAnonymous: {
      type: Boolean,
      default: true, // Allows "Scout AI" or guest users to see it without logging in
    },
    startDate: {
      type: Date,
      required: [true, "Please specify when the event starts"],
    },
    endDate: {
      type: Date,
      required: [true, "Please specify when the event ends"],
      validate: {
        // We use 'any' or 'this: any' here because Mongoose handles
        // the 'this' context at runtime, and the internal Mongoose
        // types are often deeper than our custom IEvent interface.
        validator: function (this: any, value: Date): boolean {
          // Access the startDate from the document instance
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
      default:
        "https://picsum.photos/seed/6369aaa2-5bbb-49e0-9743-3f43b5096a4c/1200/800",
    },
    isFree: { type: Boolean, default: true },
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
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    capacity: {
      type: Number,
      default: null,
    },
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

// Indexes
eventSchema.index({ location: "2dsphere" });
eventSchema.index({ type: 1, category: 1, date: 1 });
// Added index for visibility filtering
eventSchema.index({ isPublic: 1, allowAnonymous: 1 });

export const Event = mongoose.model<IEvent>("Event", eventSchema);
