import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/models/User";
import Payment from "@/models/Payment";
import { verifyTransaction } from "@/lib/web3/verify";

// Pricing mapping
const POWERUP_PRICES: Record<string, number> = {
  sonar: 0.03,
  xray: 0.03,
  timefreeze: 0.05,
  lucky: 0.08,
  extra_time: 0.05,
};

export async function POST(req: Request) {
  try {
    await dbConnect();
    const {
      txHash,
      walletAddress,
      powerupType,
      quantity = 1,
    } = await req.json();

    if (!txHash || !walletAddress || !powerupType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const pricePerUnit = POWERUP_PRICES[powerupType];
    if (!pricePerUnit) {
      return NextResponse.json(
        { error: "Invalid powerup type" },
        { status: 400 }
      );
    }

    const totalCost = pricePerUnit * quantity;

    // 1. Check duplicate
    if (await Payment.findOne({ txHash })) {
      return NextResponse.json(
        { error: "Transaction already processed" },
        { status: 409 }
      );
    }

    // 2. Verify
    const verification = await verifyTransaction(
      txHash,
      totalCost,
      walletAddress
    );
    if (!verification.success) {
      return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    // 3. Update User
    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.powerupBalances) {
      user.powerupBalances = { sonar: 0, xray: 0, timefreeze: 0, lucky: 0 };
    }

    // Increment specific powerup
    // Note: extra_time might not be stored in powerupBalances if it's consumed immediately or stored elsewhere.
    // For now, assuming it's stored in powerupBalances or we need to handle it.
    // The User model has sonar, xray, timefreeze, lucky. It does NOT have extra_time.
    // If extra_time is immediate, we might not need to store it, or we need to add it to User model.
    // User model: powerupBalances: { sonar, xray, timefreeze, lucky }
    // "timefreeze" might be what they mean by extra time? No, "timefreeze" and "extra time" are listed separately in prompt.
    // Prompt: "Powerups: sonar, xray, timefreeze, lucky... extra time (30 secs = 0.05 celo)"
    // I should probably add extra_time to User model or assume it's consumed immediately?
    // The prompt says "buy powerups like extra time".
    // I will assume for now we store it if I add it to User model, or I need to add it.
    // Let's check User model again.

    // User model has: sonar, xray, timefreeze, lucky.
    // I will map 'extra_time' to 'timefreeze' if they are the same, OR I need to add 'extra_time' to User model.
    // "timefreeze" usually stops time. "extra time" adds time. They are likely different.
    // I will add 'extra_time' to User model to be safe, or just handle it here.
    // For now, I'll just comment that I need to update User model if I want to store it.
    // Wait, I can't update User model right now in this tool call.
    // I'll just proceed with updating the route and assume I'll update User model next.

    const paymentType = powerupType === 'extra_time' ? 'extra_time' : 'powerup';

    if (powerupType !== 'extra_time') {
        const currentBalance =
        user.powerupBalances[powerupType as keyof typeof user.powerupBalances] ||
        0;
        user.powerupBalances[powerupType as keyof typeof user.powerupBalances] =
        currentBalance + quantity;
        user.markModified("powerupBalances");
    } else {
        // Handle extra_time logic?
        // If it's a consumable that is used immediately in game, maybe we don't store it?
        // But usually you buy it and use it.
        // I'll add it to User model in next step.
    }

    user.totalSpentCELO = (user.totalSpentCELO || 0) + totalCost;
    await user.save();

    await Payment.create({
      txHash,
      walletAddress,
      userId: user._id,
      type: paymentType,
      amount: totalCost,
      currency: "cUSD",
      status: "verified",
      itemId: powerupType,
      quantity,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Powerup purchase error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
