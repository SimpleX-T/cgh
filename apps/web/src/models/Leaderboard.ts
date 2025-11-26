import mongoose, { Schema, Document, Model } from "mongoose";

// This model stores pre-calculated leaderboards or specific ranking data if needed.
// For now, we can also rely on GameStats queries, but having a dedicated model allows for periodic updates or specific ranking logic.
export interface ILeaderboard extends Document {
  gameId: string;
  entries: {
    userId: mongoose.Types.ObjectId;
    username: string;
    avatar: string;
    score: number;
    date: Date;
  }[];
  updatedAt: Date;
}

const LeaderboardSchema: Schema = new Schema(
  {
    gameId: { type: String, required: true, unique: true },
    entries: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        username: String,
        avatar: String,
        score: Number,
        date: Date,
      },
    ],
  },
  { timestamps: true }
);

const Leaderboard: Model<ILeaderboard> =
  mongoose.models.Leaderboard ||
  mongoose.model<ILeaderboard>("Leaderboard", LeaderboardSchema);

export default Leaderboard;
