import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBet extends Document {
  matchId: string;
  userId: string;
  walletAddress: string;
  predictedWinnerId: string;
  amount: number;
  status: "placed" | "won" | "lost" | "refunded";
  txHash: string;
  createdAt: Date;
}

const BetSchema: Schema = new Schema(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    walletAddress: { type: String, required: true },
    predictedWinnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["placed", "won", "lost", "refunded"],
      default: "placed",
    },
    txHash: { type: String, required: true },
  },
  { timestamps: true }
);

const Bet: Model<IBet> =
  mongoose.models.Bet || mongoose.model<IBet>("Bet", BetSchema);

export default Bet;
