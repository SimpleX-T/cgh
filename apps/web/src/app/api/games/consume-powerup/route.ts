import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { walletAddress, powerupType } = await req.json();

    if (!walletAddress || !powerupType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentBalance =
      user.powerupBalances[powerupType as keyof typeof user.powerupBalances] ||
      0;

    if (currentBalance <= 0) {
      return NextResponse.json(
        { error: "Insufficient powerup balance" },
        { status: 400 }
      );
    }

    user.powerupBalances[powerupType as keyof typeof user.powerupBalances] =
      currentBalance - 1;

    user.markModified("powerupBalances");
    await user.save();

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Consume powerup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
