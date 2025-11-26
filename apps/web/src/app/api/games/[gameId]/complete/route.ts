import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import GameSession from "@/models/GameSession";
import GameStats from "@/models/GameStats";
import Leaderboard from "@/models/Leaderboard";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    await dbConnect();
    const { walletAddress, sessionId, score, timeSpent = 0 } = await req.json();
    const { gameId } = await params;

    if (!walletAddress || !gameId || score === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update Session
    if (sessionId) {
      await GameSession.findByIdAndUpdate(sessionId, {
        endTime: new Date(),
        score,
        status: "completed",
      });
    }

    // Update Stats
    let stats = await GameStats.findOne({ userId: user._id, gameId });
    if (!stats) {
      stats = new GameStats({ userId: user._id, gameId });
    }

    stats.totalPlayed += 1;
    stats.totalPlayTime += timeSpent; // Assuming seconds
    if (score > stats.highScore) {
      stats.highScore = score;
    }
    await stats.save();

    // Update Leaderboard (Simple: Top 100 per game)
    // We can upsert into the Leaderboard model entry
    // Or simpler: Just let the GET /leaderboard query GameStats.
    // Since we have a Leaderboard model, let's maintain it for fast read.

    let leaderboard = await Leaderboard.findOne({ gameId });
    if (!leaderboard) {
      leaderboard = new Leaderboard({ gameId, entries: [] });
    }

    // Check if user is already in entries
    const existingEntryIndex = leaderboard.entries.findIndex(
      (e) => e.userId.toString() === user._id.toString()
    );

    if (existingEntryIndex > -1) {
      // Update if score is higher
      if (score > leaderboard.entries[existingEntryIndex].score) {
        leaderboard.entries[existingEntryIndex].score = score;
        leaderboard.entries[existingEntryIndex].date = new Date();
      }
    } else {
      // Add new entry
      leaderboard.entries.push({
        userId: user._id as any,
        username: user.username,
        avatar: user.avatar,
        score,
        date: new Date(),
      });
    }

    // Sort and limit
    leaderboard.entries.sort((a, b) => b.score - a.score);
    if (leaderboard.entries.length > 100) {
      leaderboard.entries = leaderboard.entries.slice(0, 100);
    }

    await leaderboard.save();

    return NextResponse.json({
      success: true,
      newHighScore: score === stats.highScore,
    });
  } catch (error) {
    console.error("Game complete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
