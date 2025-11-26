import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Match from "@/models/Match";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { matchId, userId, txHash } = await req.json();

    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status !== "waiting") {
      return NextResponse.json(
        { error: "Match not available" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already player 1
    if (match.players[0].userId.toString() === userId) {
      return NextResponse.json(
        { error: "Cannot play against yourself" },
        { status: 400 }
      );
    }

    match.players.push({
      userId: user._id as any,
      walletAddress: user.walletAddress,
      status: "ready",
    });

    match.status = "active";
    match.startTime = new Date();
    // Store the join txHash? Maybe in a separate field or log, but for now we just proceed.

    await match.save();

    return NextResponse.json({ match }, { status: 200 });
  } catch (error) {
    console.error("Error joining match:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
