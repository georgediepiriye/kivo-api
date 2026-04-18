import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// 1. Updated Interface
export interface IUser extends Document {
  name: string;
  email: string;
  image: string;
  password?: string;
  role: "user" | "organizer" | "admin";
  interests: string[];
  // Updated to match Event's GeoJSON structure
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
    neighborhood?: string;
    city?: string;
  };
  active: boolean;
  correctPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
}

// 2. Define the Schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please tell us your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
      default: function (this: IUser) {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.name || "Kivo")}`;
      },
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 5,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "organizer", "admin"],
      default: "user",
    },
    interests: [{ type: String }],

    // UPDATED: Location GeoJSON (matching Event logic)
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        default: [7.0085, 4.8156], // Default to Port Harcourt [long, lat]
      },
      address: String,
      neighborhood: String,
      city: { type: String, default: "Port Harcourt" },
    },

    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * INDEXES
 * This is crucial for performance and geo-queries
 */
userSchema.index({ location: "2dsphere" });

/**
 * PASSWORD HASHING MIDDLEWARE
 */
userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
