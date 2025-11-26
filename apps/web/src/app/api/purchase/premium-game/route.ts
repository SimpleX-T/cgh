import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { createPublicClient, http, decodeEventLog, parseUnits } from "viem";
import { celoSepolia } from "viem/chains"; // or celo for mainnet
import { stableTokenABI } from "@celo/abis";
import { RECEIVER_ADDRESS } from "@/lib/constants";

const PREMIUM_GAME_PRICE = parseFloat(process.env.PREMIUM_GAME_PRICE || "0.1");

const publicClient = createPublicClient({
  chain: celoSepolia, // Change to celo for mainnet
  transport: http("https://forno.celo-sepolia.celo-testnet.org", {
    timeout: 60_000,
  }),
});

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { txHash, walletAddress, gameId } = await req.json();

    if (!txHash || !walletAddress || !gameId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Check for duplicate transaction
    const existingPayment = await Payment.findOne({ txHash });
    if (existingPayment) {
      return NextResponse.json(
        { error: "Transaction already processed" },
        { status: 409 }
      );
    }

    // 2. Verify Transaction on Blockchain
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    if (receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction failed on blockchain" },
        { status: 400 }
      );
    }

    // 3. Find and verify the Transfer event
    let transferFound = false;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: stableTokenABI,
          data: log.data,
          topics: log.topics,
        });
        console.log("Decoded event:", decoded.eventName, decoded.args);
        if (
          decoded.eventName === "Transfer" &&
          decoded.args.to.toLowerCase() === RECEIVER_ADDRESS.toLowerCase() &&
          decoded.args.value >= parseUnits(PREMIUM_GAME_PRICE.toString(), 18)
        ) {
          transferFound = true;
          break;
        }
      } catch {
        // Not a Transfer event or wrong format, continue
        continue;
      }
    }

    if (!transferFound) {
      await Payment.create({
        txHash,
        walletAddress,
        userId: (await User.findOne({ walletAddress }))?._id,
        type: "premium_game",
        amount: 0,
        status: "failed",
        itemId: gameId,
      });
      return NextResponse.json(
        { error: "No valid cUSD transfer to treasury found in transaction" },
        { status: 400 }
      );
    }

    // 4. Update User and Create Payment Record
    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already unlocked
    if (user.premiumGamesUnlocked.includes(gameId)) {
      return NextResponse.json(
        { message: "Game already unlocked" },
        { status: 200 }
      );
    }

    user.premiumGamesUnlocked.push(gameId);
    user.totalSpentCELO = (user.totalSpentCELO || 0) + PREMIUM_GAME_PRICE;
    await user.save();

    await Payment.create({
      txHash,
      walletAddress,
      userId: user._id,
      type: "premium_game",
      amount: PREMIUM_GAME_PRICE,
      currency: "cUSD",
      status: "verified",
      itemId: gameId,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Premium purchase error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/db";
// import User from "@/models/User";
// import Payment from "@/models/Payment";
// import { verifyTransaction } from "@/lib/web3/verify";

// const PREMIUM_GAME_PRICE = parseFloat(process.env.PREMIUM_GAME_PRICE || "0.1");

// export async function POST(req: Request) {
//   try {
//     await dbConnect();
//     const { txHash, walletAddress, gameId } = await req.json();

//     if (!txHash || !walletAddress || !gameId) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // 1. Check for duplicate transaction
//     const existingPayment = await Payment.findOne({ txHash });
//     if (existingPayment) {
//       return NextResponse.json(
//         { error: "Transaction already processed" },
//         { status: 409 }
//       );
//     }

//     // 2. Verify Transaction on Blockchain
//     const verification = await verifyTransaction(
//       txHash,
//       PREMIUM_GAME_PRICE,
//       walletAddress
//     );

//     if (!verification.success) {
//       await Payment.create({
//         txHash,
//         walletAddress,
//         userId: (await User.findOne({ walletAddress }))?._id, // Try to find user to link failure
//         type: "premium_game",
//         amount: 0, // Unknown actual amount if verification failed/didn't complete
//         status: "failed",
//         itemId: gameId,
//       });
//       return NextResponse.json({ error: verification.error }, { status: 400 });
//     }

//     // 3. Update User and Create Payment Record
//     const user = await User.findOne({
//       walletAddress: walletAddress.toLowerCase(),
//     });
//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     // Check if already unlocked
//     if (user.premiumGamesUnlocked.includes(gameId)) {
//       return NextResponse.json(
//         { message: "Game already unlocked" },
//         { status: 200 }
//       );
//     }

//     user.premiumGamesUnlocked.push(gameId);
//     user.totalSpentCELO = (user.totalSpentCELO || 0) + PREMIUM_GAME_PRICE;
//     await user.save();

//     await Payment.create({
//       txHash,
//       walletAddress,
//       userId: user._id,
//       type: "premium_game",
//       amount: PREMIUM_GAME_PRICE,
//       currency: "cUSD",
//       status: "verified",
//       itemId: gameId,
//     });

//     return NextResponse.json({ success: true, user });
//   } catch (error: any) {
//     console.error("Premium purchase error:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
