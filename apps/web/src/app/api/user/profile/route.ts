import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ walletAddress: address.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Heart Refill Logic
    if (user.heartsBalance < 5) {
      const now = new Date();
      const lastRefill = user.heartRefill.lastFreeRefillAt || user.updatedAt; // Fallback to update time if null
      const timeDiff = now.getTime() - new Date(lastRefill).getTime();
      const minutesPassed = Math.floor(timeDiff / (1000 * 60));

      if (minutesPassed >= 30) {
        const heartsToAdd = Math.floor(minutesPassed / 30);
        const newBalance = Math.min(user.heartsBalance + heartsToAdd, 5); // Refill up to 5

        if (newBalance > user.heartsBalance) {
            user.heartsBalance = newBalance;
            user.heartRefill.lastFreeRefillAt = now;
            // Calculate next refill time
            if (newBalance < 5) {
                user.heartRefill.nextFreeRefillAt = new Date(now.getTime() + 30 * 60 * 1000);
            } else {
                user.heartRefill.nextFreeRefillAt = null;
            }
            await user.save();
        }
      } else {
          // Update next refill time for frontend display
          user.heartRefill.nextFreeRefillAt = new Date(new Date(lastRefill).getTime() + 30 * 60 * 1000);
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
