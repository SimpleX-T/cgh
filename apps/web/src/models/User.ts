import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  walletAddress: string;
  username: string;
  avatar: string;
  heartsBalance: number;
  premiumGamesUnlocked: string[];
  powerupBalances: {
    sonar: number;
    xray: number;
    timefreeze: number;
    lucky: number;
  };
  totalSpentCELO: number;
  heartRefill: {
    lastFreeRefillAt: Date | null;
    nextFreeRefillAt: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    username: { type: String, required: true },
    avatar: { type: String, required: true },
    heartsBalance: { type: Number, default: 5, min: 0, max: 10 },
    premiumGamesUnlocked: { type: [String], default: [] },
    powerupBalances: {
      sonar: { type: Number, default: 0 },
      xray: { type: Number, default: 0 },
      timefreeze: { type: Number, default: 0 },
      lucky: { type: Number, default: 0 },
    },
    totalSpentCELO: { type: Number, default: 0 },
    heartRefill: {
      lastFreeRefillAt: { type: Date, default: null },
      nextFreeRefillAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
