import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { walletAddress, username } = await req.json();

    if (!walletAddress || !username) {
      return NextResponse.json(
        { error: "Wallet address and username are required" },
        { status: 400 }
      );
    }

    const normalizedWallet = walletAddress.toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({
      walletAddress: normalizedWallet,
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Generate Avatar
    const avatar = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${normalizedWallet}`;

    // Create new user
    const newUser = await User.create({
      walletAddress: normalizedWallet,
      username,
      avatar,
      heartsBalance: 5,
      premiumGamesUnlocked: [],
      powerupBalances: {
        sonar: 0,
        xray: 0,
        timefreeze: 0,
        lucky: 0,
      },
      heartRefill: {
        lastFreeRefillAt: null,
        nextFreeRefillAt: null, // Will be set when hearts drop below 5
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
