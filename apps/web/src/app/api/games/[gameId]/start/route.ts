import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import GameSession from "@/models/GameSession";
import { games } from "@/lib/games";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    await dbConnect();
    const { walletAddress } = await req.json();
    const { gameId } = await params;

    if (!walletAddress || !gameId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if game exists
    const game = games.find((g) => g.id === gameId);
    if (!game) {
      return NextResponse.json({ error: "Invalid game" }, { status: 404 });
    }

    // Check hearts
    if (user.heartsBalance <= 0) {
      return NextResponse.json(
        { error: "No hearts remaining" },
        { status: 403 }
      );
    }

    // Check Premium
    // Assuming premium games are defined in `games` list or hardcoded.
    // Prompt says: Tetris, F1-Racing, Breakout, Solitaire, Connect-Four are premium.
    const premiumGames = [
      "tetris",
      "f1-racing",
      "breakout",
      "solitaire",
      "connect-four",
    ];
    if (
      premiumGames.includes(gameId) &&
      !user.premiumGamesUnlocked.includes(gameId)
    ) {
      return NextResponse.json(
        { error: "Premium game locked" },
        { status: 403 }
      );
    }

    // Create Session
    const session = await GameSession.create({
      userId: user._id,
      gameId,
      status: "active",
    });

    return NextResponse.json({ success: true, sessionId: session._id });
  } catch (error) {
    console.error("Game start error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
