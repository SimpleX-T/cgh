import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId");

    let users;
    let entries;

    if (!gameId || gameId === "global") {
      // Global Leaderboard: Top Spenders
      users = await User.find({ totalSpentCELO: { $gt: 0 } })
        .sort({ totalSpentCELO: -1 })
        .limit(50)
        .select("username avatar totalSpentCELO");

      entries = users.map((user) => ({
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        score: user.totalSpentCELO.toFixed(2), // Display as string for currency
        isCurrency: true,
      }));
    } else {
      // Game Leaderboard: Top Scorers
      // We need to query based on the map field `highScores.<gameId>`
      // Mongoose allows querying map fields using dot notation
      const queryKey = `highScores.${gameId}`;

      users = await User.find({ [queryKey]: { $exists: true } })
        .sort({ [queryKey]: -1 })
        .limit(50)
        .select(`username avatar ${queryKey}`);

      entries = users.map((user) => ({
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        score: user.highScores.get(gameId),
        isCurrency: false,
      }));
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
