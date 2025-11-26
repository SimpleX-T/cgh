import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGameSession extends Document {
  userId: mongoose.Types.ObjectId;
  gameId: string;
  startTime: Date;
  endTime?: Date;
  score?: number;
  status: "active" | "completed" | "abandoned";
  createdAt: Date;
  updatedAt: Date;
}

const GameSessionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gameId: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    score: { type: Number },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
  },
  { timestamps: true }
);

const GameSession: Model<IGameSession> =
  mongoose.models.GameSession ||
  mongoose.model<IGameSession>("GameSession", GameSessionSchema);

export default GameSession;
