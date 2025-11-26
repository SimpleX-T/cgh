import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Bet from "@/models/Bet";
import Match from "@/models/Match";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { matchId, userId, predictedWinnerId, amount, txHash } =
      await req.json();

    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const predictedWinner = await User.findById(predictedWinnerId);
    if (!predictedWinner) {
      return NextResponse.json(
        { error: "Predicted winner not found" },
        { status: 404 }
      );
    }

    const bet = await Bet.create({
      matchId: match._id as any,
      userId: user._id as any,
      walletAddress: user.walletAddress,
      predictedWinnerId: predictedWinner._id as any,
      amount,
      txHash,
      status: "placed",
    });

    return NextResponse.json({ bet }, { status: 201 });
  } catch (error) {
    console.error("Error placing bet:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
