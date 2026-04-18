import mongoose from "mongoose";
import { HOTSPOT_CATEGORIES } from "../lib/constants.js";

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
      enum: {
        values: [...hotspotCategorySlugs, "other"],
        message: "{VALUE} is not a supported hotspot category",
      },
      default: "other",
    },
    status: {
      type: String,
      enum: ["CHILL", "ACTIVE", "TRENDING", "HOT"],
      default: "CHILL",
    },
    // Main display image (Cover)
    image: {
      type: String,
      required: [true, "A hotspot must have a cover image"],
    },
    // Array of strings for additional photos
    gallery: {
      type: [String],
      validate: {
        validator: function (val: string | any[]) {
          return val.length <= 5; // Limits gallery to 5 images to maintain performance
        },
        message: "Gallery cannot exceed 5 images",
      },
    },
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

/**
 * VIRTUAL: Full Gallery
 * This combines the cover image and the gallery images into one array
 * so your frontend can easily map through all available photos.
 */
hotspotSchema.virtual("allPhotos").get(function () {
  return [this.image, ...(this.gallery || [])];
});

const Hotspot =
  mongoose.models.Hotspot || mongoose.model("Hotspot", hotspotSchema);

export default Hotspot;
