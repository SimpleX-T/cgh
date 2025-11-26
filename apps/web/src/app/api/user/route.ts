import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");

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
      return NextResponse.json({ user: null }, { status: 404 });
    }

    // --- Heart Refill Logic ---
    const now = new Date();
    let needsSave = false;

    // Only refill if below 5 (free tier limit)
    if (user.heartsBalance < 5) {
      // If no next refill time set, set it now
      if (!user.heartRefill.nextFreeRefillAt) {
        user.heartRefill.lastFreeRefillAt = now;
        user.heartRefill.nextFreeRefillAt = new Date(
          now.getTime() + 30 * 60 * 1000
        ); // 30 minutes
        needsSave = true;
      } else if (now >= user.heartRefill.nextFreeRefillAt) {
        // Calculate how many intervals passed
        const timeDiff =
          now.getTime() - user.heartRefill.nextFreeRefillAt.getTime();
        // 1 refill already happened at nextFreeRefillAt
        let refills = 1 + Math.floor(timeDiff / (30 * 60 * 1000));

        // Cap refills to reach 5
        const missingHearts = 5 - user.heartsBalance;
        const actualRefills = Math.min(refills, missingHearts);

        user.heartsBalance += actualRefills;

        // Update timestamps
        user.heartRefill.lastFreeRefillAt = new Date(); // Approximately now

        if (user.heartsBalance < 5) {
          // If still below 5, set next refill 30m from now (or align with intervals if stricter)
          // Simple approach: 30m from now
          user.heartRefill.nextFreeRefillAt = new Date(
            now.getTime() + 30 * 60 * 1000
          );
        } else {
          // Full, clear next refill
          user.heartRefill.nextFreeRefillAt = null;
        }
        needsSave = true;
      }
    } else if (user.heartsBalance >= 5 && user.heartRefill.nextFreeRefillAt) {
      // If balance is >= 5 (maybe purchased), clear refill timer
      user.heartRefill.nextFreeRefillAt = null;
      needsSave = true;
    }

    if (needsSave) {
      await user.save();
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
