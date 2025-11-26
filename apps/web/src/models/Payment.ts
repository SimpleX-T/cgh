import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  txHash: string;
  walletAddress: string;
  userId: mongoose.Types.ObjectId;
  type: "premium_game" | "hearts" | "powerup" | "extra_time";
  amount: number;
  currency: string;
  itemId?: string; // gameId or specific item identifier
  quantity?: number;
  status: "pending" | "verified" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    txHash: { type: String, required: true, unique: true },
    walletAddress: { type: String, required: true, lowercase: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["premium_game", "hearts", "powerup", "extra_time"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "cUSD" },
    itemId: { type: String },
    quantity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
