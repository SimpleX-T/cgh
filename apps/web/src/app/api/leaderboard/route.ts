import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Leaderboard from "@/models/Leaderboard";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId");

    if (!gameId || gameId === "global") {
      // Global Leaderboard (Top Spenders or Hearts?)
      // Let's do Top Spenders for now as a global metric
      const topUsers = await User.find({})
        .sort({ totalSpentCELO: -1 })
        .limit(50)
        .select("username avatar totalSpentCELO");

      const entries = topUsers.map((u) => ({
        userId: u._id,
        username: u.username,
        avatar: u.avatar,
        score: u.totalSpentCELO, // Display spent amount as score
      }));

      return NextResponse.json({ entries });
    } else {
      // Game Specific Leaderboard
      const leaderboard = await Leaderboard.findOne({ gameId });
      if (!leaderboard) {
        return NextResponse.json({ entries: [] });
      }
      return NextResponse.json({ entries: leaderboard.entries });
    }
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
