import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { verifyTransaction } from "@/lib/web3/verify";

const HEART_PRICE = parseFloat(process.env.HEART_PRICE || "0.02");

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { txHash, walletAddress, quantity = 1 } = await req.json();

    if (!txHash || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const totalCost = HEART_PRICE * quantity;

    // 1. Check for duplicate transaction
    const existingPayment = await Payment.findOne({ txHash });
    if (existingPayment) {
      return NextResponse.json(
        { error: "Transaction already processed" },
        { status: 409 }
      );
    }

    // 2. Verify Transaction on Blockchain
    const verification = await verifyTransaction(
      txHash,
      totalCost,
      walletAddress
    );

    if (!verification.success) {
      // Log failure
      return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    // 3. Update User
    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.heartsBalance = Math.min(user.heartsBalance + quantity, 10); // Max 10 hearts
    user.totalSpentCELO = (user.totalSpentCELO || 0) + totalCost;

    // If purchasing fills up hearts, clear refill timer
    if (user.heartsBalance >= 5) {
      user.heartRefill.nextFreeRefillAt = null;
    }

    await user.save();

    await Payment.create({
      txHash,
      walletAddress,
      userId: user._id,
      type: "hearts",
      amount: totalCost,
      currency: "cUSD",
      status: "verified",
      quantity,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Heart purchase error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
