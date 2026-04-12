import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// 1. Define the Interface for User Document
export interface IUser extends Document {
  name: string;
  email: string;
  image: string; // Made this non-optional since we'll provide a default
  password?: string;
  role: "user" | "organizer" | "admin";
  interests: string[];
  location: {
    city: string;
    neighborhood?: string;
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
    // ADDED: User Image field
    image: {
      type: String,
      default: function (this: IUser) {
        // Generates a consistent, unique avatar based on the user's name
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
    location: {
      city: { type: String, default: "Port Harcourt" },
      neighborhood: String,
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
 * PASSWORD HASHING MIDDLEWARE
 */
userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;

  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

/**
 * INSTANCE METHOD
 */
userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// 3. Export the Model
export const User = mongoose.model<IUser>("User", userSchema);
