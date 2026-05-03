import mongoose, { Schema, Model } from "mongoose";

// Interface for User document
export interface IUser {
  name: string;
  email: string;
  password?: string;
  image?: string;
  provider: "credentials" | "google" | "github";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema for Users.
 *
 * Defines the core user entity including authentication details and profile information.
 */
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Don't return password by default
    image: { type: String },
    provider: { type: String, default: "credentials" },
  },
  { timestamps: true },
);

const User: Model<IUser> =
  mongoose.models?.User || mongoose.model<IUser>("User", UserSchema);

export default User;
