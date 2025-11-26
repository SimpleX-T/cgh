import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Match from "@/models/Match";
import User from "@/models/User";

const ROWS = 6;
const COLS = 7;

function checkWin(board: number[][], player: number): boolean {
  // Check horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (
        board[r][c] === player &&
        board[r][c + 1] === player &&
        board[r][c + 2] === player &&
        board[r][c + 3] === player
      )
        return true;
    }
  }
  // Check vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      if (
        board[r][c] === player &&
        board[r + 1][c] === player &&
        board[r + 2][c] === player &&
        board[r + 3][c] === player
      )
        return true;
    }
  }
  // Check diagonal /
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (
        board[r][c] === player &&
        board[r - 1][c + 1] === player &&
        board[r - 2][c + 2] === player &&
        board[r - 3][c + 3] === player
      )
        return true;
    }
  }
  // Check diagonal \
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (
        board[r][c] === player &&
        board[r + 1][c + 1] === player &&
        board[r + 2][c + 2] === player &&
        board[r + 3][c + 3] === player
      )
        return true;
    }
  }
  return false;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const matchId = params.id;

  try {
    const { userId, column } = await req.json();

    const match = await Match.findById(matchId);
    if (!match)
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (match.status !== "active")
      return NextResponse.json({ error: "Match not active" }, { status: 400 });

    // Initialize game state if empty
    if (!match.gameState || !match.gameState.board) {
      match.gameState = {
        board: Array(ROWS)
          .fill(null)
          .map(() => Array(COLS).fill(0)),
        currentPlayer: 1,
      };
    }

    const { board, currentPlayer } = match.gameState;

    // Validate player turn
    const playerIndex = match.players.findIndex(
      (p) => p.userId.toString() === userId
    );
    if (playerIndex === -1)
      return NextResponse.json({ error: "Not a player" }, { status: 403 });

    const playerNum = playerIndex + 1; // 1 or 2
    if (playerNum !== currentPlayer)
      return NextResponse.json({ error: "Not your turn" }, { status: 400 });

    // Validate move
    if (column < 0 || column >= COLS)
      return NextResponse.json({ error: "Invalid column" }, { status: 400 });

    // Find lowest empty row in column
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][column] === 0) {
        row = r;
        break;
      }
    }

    if (row === -1)
      return NextResponse.json({ error: "Column full" }, { status: 400 });

    // Update board
    board[row][column] = playerNum;

    // Check win
    if (checkWin(board, playerNum)) {
      match.status = "completed";
      match.winnerId = match.players[playerIndex].userId;
      // Trigger resolution logic (e.g. call smart contract resolve endpoint internally or via separate worker)
      // For now, we just mark it completed in DB.
    } else {
      // Switch turn
      match.gameState.currentPlayer = playerNum === 1 ? 2 : 1;
    }

    // Important: Mark gameState as modified because it's a Mixed type
    match.markModified("gameState");
    await match.save();

    return NextResponse.json({ match }, { status: 200 });
  } catch (error) {
    console.error("Error making move:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
