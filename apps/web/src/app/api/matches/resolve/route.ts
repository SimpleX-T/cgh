import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Match from "@/models/Match";
import User from "@/models/User";
import { getEthereum } from "@/lib/web3/ethereum";
// import { ethers } from "ethers"; // We would use this for real admin wallet interaction

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { matchId, winnerId } = await req.json();

    const match = await Match.findById(matchId);
    if (!match)
      return NextResponse.json({ error: "Match not found" }, { status: 404 });

    // In a real scenario, this endpoint should be protected (Admin only) or called internally by the game server.
    // For this MVP, we trust the client call (VERY INSECURE - DO NOT USE IN PRODUCTION).
    // Ideally, the 'move' endpoint triggers this internally when a win is detected.

    // Check if already resolved
    if (match.status === "completed" && match.winnerId) {
      return NextResponse.json(
        { message: "Match already resolved" },
        { status: 200 }
      );
    }

    match.status = "completed";
    match.winnerId = winnerId;
    await match.save();

    // Mock Smart Contract Call (Admin Wallet)
    // const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    // const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    // const contract = new ethers.Contract(GAME_ESCROW_ADDRESS, GAME_ESCROW_ABI, wallet);
    // await contract.resolveMatch(match.onChainMatchId, winnerAddress);

    return NextResponse.json({ match }, { status: 200 });
  } catch (error) {
    console.error("Error resolving match:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
