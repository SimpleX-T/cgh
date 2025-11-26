import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMatch extends Document {
  gameType: "connect-four" | "2048-duel";
  players: {
    userId: string;
    walletAddress: string;
    status: "ready" | "playing" | "forfeit";
    score?: number;
  }[];
  stakeAmount: number;
  startTime: Date;
  endTime?: Date;
  status: "waiting" | "active" | "completed" | "cancelled";
  winnerId?: string;
  gameState: any; // Flexible for different games
  onChainMatchId: number;
  txHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema: Schema = new Schema(
  {
    gameType: {
      type: String,
      enum: ["connect-four", "2048-duel"],
      required: true,
    },
    players: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        walletAddress: { type: String, required: true },
        status: {
          type: String,
          enum: ["ready", "playing", "forfeit"],
          default: "ready",
        },
        score: { type: Number },
      },
    ],
    stakeAmount: { type: Number, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "cancelled"],
      default: "waiting",
    },
    winnerId: { type: Schema.Types.ObjectId, ref: "User" },
    gameState: { type: Schema.Types.Mixed, default: {} },
    onChainMatchId: { type: Number },
    txHash: { type: String },
  },
  { timestamps: true }
);

const Match: Model<IMatch> =
  mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema);

export default Match;
