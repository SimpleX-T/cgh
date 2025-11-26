import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Match from "@/models/Match";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { userId, gameType, stakeAmount, txHash, onChainMatchId } =
      await req.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const match = await Match.create({
      gameType,
      players: [
        {
          userId: user._id as any,
          walletAddress: user.walletAddress,
          status: "ready",
        },
      ],
      stakeAmount,
      onChainMatchId,
      txHash,
      status: "waiting",
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
