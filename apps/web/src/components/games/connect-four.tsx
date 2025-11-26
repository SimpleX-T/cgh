"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROWS = 6;
const COLS = 7;

interface ConnectFourProps {
  onMove: (col: number) => void;
  board: number[][]; // 0 = empty, 1 = player1, 2 = player2
  currentPlayer: number; // 1 or 2
  myPlayerId: number; // 1 or 2, or 0 if spectator
  winner: number | null;
}

export default function ConnectFour({
  onMove,
  board,
  currentPlayer,
  myPlayerId,
  winner,
}: ConnectFourProps) {
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const handleColumnClick = (col: number) => {
    if (winner || currentPlayer !== myPlayerId) return;
    onMove(col);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-blue-600 p-4 rounded-lg shadow-xl">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: COLS }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="flex flex-col gap-2 cursor-pointer"
              onMouseEnter={() => setHoverCol(colIndex)}
              onMouseLeave={() => setHoverCol(null)}
              onClick={() => handleColumnClick(colIndex)}
            >
              {/* Hover Indicator */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full transition-opacity mb-2",
                  hoverCol === colIndex &&
                    !winner &&
                    currentPlayer === myPlayerId
                    ? myPlayerId === 1
                      ? "bg-red-500/50"
                      : "bg-yellow-500/50"
                    : "opacity-0"
                )}
              />

              {Array.from({ length: ROWS }).map((_, rowIndex) => {
                const cellValue = board[rowIndex][colIndex];
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      "w-12 h-12 rounded-full border-4 border-blue-700 shadow-inner",
                      cellValue === 0 && "bg-white",
                      cellValue === 1 && "bg-red-500",
                      cellValue === 2 && "bg-yellow-500"
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {winner ? (
        <div className="text-2xl font-bold animate-bounce">
          {winner === myPlayerId ? "You Won! 🎉" : `Player ${winner} Won!`}
        </div>
      ) : (
        <div className="text-xl font-semibold">
          {currentPlayer === myPlayerId
            ? "Your Turn"
            : `Waiting for Player ${currentPlayer}...`}
        </div>
      )}
    </div>
  );
}
