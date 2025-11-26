import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Leaderboard from "@/models/Leaderboard";
import GameStats from "@/models/GameStats";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    await dbConnect();
    const { gameId } = await params;

    // Try fetching from cached Leaderboard model
    const leaderboard = await Leaderboard.findOne({ gameId });

    if (leaderboard && leaderboard.entries.length > 0) {
      return NextResponse.json({ entries: leaderboard.entries });
    }

    // Fallback: Aggregate from GameStats if Leaderboard is empty (e.g. first run or migration)
    const topStats = await GameStats.find({ gameId })
      .sort({ highScore: -1 })
      .limit(50)
      .populate("userId", "username avatar");

    const entries = topStats.map((stat) => {
      const user = stat.userId as any;
      return {
        userId: user._id,
        username: user.username || "Unknown",
        avatar: user.avatar,
        score: stat.highScore,
        date: stat.updatedAt,
      };
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
