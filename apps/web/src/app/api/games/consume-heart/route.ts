import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.heartsBalance > 0) {
      user.heartsBalance -= 1;

      // If balance drops below 5 (and was >= 5 or just dropped), ensure refill timer is set
      if (user.heartsBalance < 5 && !user.heartRefill.nextFreeRefillAt) {
        const now = new Date();
        user.heartRefill.lastFreeRefillAt = now;
        user.heartRefill.nextFreeRefillAt = new Date(
          now.getTime() + 30 * 60 * 1000
        );
      }

      await user.save();
    }

    return NextResponse.json({
      success: true,
      heartsBalance: user.heartsBalance,
      nextRefill: user.heartRefill.nextFreeRefillAt,
    });
  } catch (error) {
    console.error("Consume heart error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
