import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGameStats extends Document {
  userId: mongoose.Types.ObjectId;
  gameId: string;
  highScore: number;
  totalPlayed: number; // count of sessions
  totalPlayTime: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const GameStatsSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gameId: { type: String, required: true },
    highScore: { type: Number, default: 0 },
    totalPlayed: { type: Number, default: 0 },
    totalPlayTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for efficient querying of user stats for a game
GameStatsSchema.index({ userId: 1, gameId: 1 }, { unique: true });
// Index for leaderboards
GameStatsSchema.index({ gameId: 1, highScore: -1 });

const GameStats: Model<IGameStats> =
  mongoose.models.GameStats ||
  mongoose.model<IGameStats>("GameStats", GameStatsSchema);

export default GameStats;
