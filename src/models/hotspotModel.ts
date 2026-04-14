import mongoose from "mongoose";
import { HOTSPOT_CATEGORIES } from "../lib/constants";

// Extracting slugs from your constants to use as enum values
const hotspotCategorySlugs = Object.values(HOTSPOT_CATEGORIES).map(
  (cat) => cat.slug,
);

const hotspotSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A hotspot must have a title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "A hotspot must have a description"],
    },
    category: {
      type: String,
      // Syncing with your frontend slugs: nightlife, lounge, dining, cafe, etc.
      enum: {
        values: [...hotspotCategorySlugs, "other"],
        message: "{VALUE} is not a supported hotspot category",
      },
      default: "other",
    },
    // Adding a 'status' field to support the Heat Levels we defined
    status: {
      type: String,
      enum: ["CHILL", "ACTIVE", "TRENDING", "HOT"],
      default: "CHILL",
    },
    image: {
      type: String,
      required: [true, "A hotspot must have a cover image"],
    },
    gallery: [String],
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: String,
      neighborhood: String,
      city: {
        type: String,
        default: "Port Harcourt",
      },
      state: {
        type: String,
        default: "Rivers State",
      },
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    bestTimeToVisit: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for proximity searches
hotspotSchema.index({ location: "2dsphere" });

const Hotspot =
  mongoose.models.Hotspot || mongoose.model("Hotspot", hotspotSchema);

export default Hotspot;
