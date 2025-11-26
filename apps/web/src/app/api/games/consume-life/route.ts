import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.heartsBalance <= 0) {
      return NextResponse.json(
        { error: "No lives remaining" },
        { status: 403 }
      );
    }

    // Decrement hearts
    const oldBalance = user.heartsBalance;
    user.heartsBalance -= 1;

    // If balance dropped below max (5) and timer wasn't running (or just started), set/update refill
    // Actually, the logic in profile/route.ts handles the *calculation* of refill.
    // We just need to ensure `nextFreeRefillAt` is set if it wasn't.
    // If we drop from 5 to 4, we start the timer.
    if (oldBalance === 5 && user.heartsBalance < 5) {
      const now = new Date();
      user.heartRefill.lastFreeRefillAt = now;
      user.heartRefill.nextFreeRefillAt = new Date(
        now.getTime() + 30 * 60 * 1000
      ); // 30 mins
    } else if (user.heartsBalance < 5 && !user.heartRefill.nextFreeRefillAt) {
      // Should be covered by above, but safety check
      const now = new Date();
      user.heartRefill.lastFreeRefillAt = now;
      user.heartRefill.nextFreeRefillAt = new Date(
        now.getTime() + 30 * 60 * 1000
      );
    }

    await user.save();

    return NextResponse.json({
      success: true,
      heartsBalance: user.heartsBalance,
      nextFreeRefillAt: user.heartRefill.nextFreeRefillAt,
    });
  } catch (error) {
    console.error("Error consuming life:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
