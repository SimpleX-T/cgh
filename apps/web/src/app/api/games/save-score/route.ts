import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { walletAddress, gameId, score } = await req.json();

    if (!walletAddress || !gameId || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Initialize maps if they don't exist (for old users)
    if (!user.highScores) user.highScores = new Map();
    if (!user.playCounts) user.playCounts = new Map();

    // Update High Score
    const currentHighScore = user.highScores.get(gameId) || 0;
    if (score > currentHighScore) {
      user.highScores.set(gameId, score);
    }

    // Increment Play Count
    const currentPlayCount = user.playCounts.get(gameId) || 0;
    user.playCounts.set(gameId, currentPlayCount + 1);

    await user.save();

    return NextResponse.json({
      success: true,
      highScore: user.highScores.get(gameId),
      playCount: user.playCounts.get(gameId),
    });
  } catch (error) {
    console.error("Error saving score:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
