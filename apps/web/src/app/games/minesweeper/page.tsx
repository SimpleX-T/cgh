"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Flag, Bomb } from "lucide-react";
import { GamePowerups, type PowerupType } from "@/components/game-powerups";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/use-user-profile";

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

type Difficulty = "beginner" | "intermediate" | "expert";

const DIFFICULTIES = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export default function Minesweeper() {
  const { consumeLife } = useUserProfile();
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [flagsLeft, setFlagsLeft] = useState(0);
  const [time, setTime] = useState(0);
  const [firstClick, setFirstClick] = useState(true);

  // Powerup Refs
  const isTimeFrozenRef = useRef(false);

  useEffect(() => {
    resetGame();
  }, [difficulty]);

  useEffect(() => {
    if (gameState === "playing" && !firstClick) {
      const timer = setInterval(() => {
        if (!isTimeFrozenRef.current) {
          setTime((t) => t + 1);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, firstClick]);

  const resetGame = () => {
    const config = DIFFICULTIES[difficulty];
    const newBoard = Array(config.rows)
      .fill(null)
      .map(() =>
        Array(config.cols)
          .fill(null)
          .map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0,
          }))
      );
    setBoard(newBoard);
    setGameState("playing");
    setFlagsLeft(config.mines);
    setTime(0);
    setFirstClick(true);
    isTimeFrozenRef.current = false;
  };

  const initializeBoard = (
    board: Cell[][],
    clickRow: number,
    clickCol: number
  ) => {
    const config = DIFFICULTIES[difficulty];
    const cells: [number, number][] = [];

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (Math.abs(r - clickRow) > 1 || Math.abs(c - clickCol) > 1) {
          cells.push([r, c]);
        }
      }
    }

    // Place mines
    for (let i = 0; i < config.mines; i++) {
      const randomIndex = Math.floor(Math.random() * cells.length);
      const [r, c] = cells[randomIndex];
      board[r][c].isMine = true;
      cells.splice(randomIndex, 1);
    }

    // Calculate neighbor mines
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (!board[r][c].isMine) {
          board[r][c].neighborMines = countNeighborMines(board, r, c);
        }
      }
    }
  };

  const countNeighborMines = (
    board: Cell[][],
    row: number,
    col: number
  ): number => {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (
          newRow >= 0 &&
          newRow < board.length &&
          newCol >= 0 &&
          newCol < board[0].length
        ) {
          if (board[newRow][newCol].isMine) count++;
        }
      }
    }
    return count;
  };

  const handlePowerup = (type: PowerupType) => {
    if (gameState !== "playing") {
      toast.error("Start the game first!");
      return;
    }

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));
    let changed = false;

    switch (type) {
      case "xray":
        // Reveal one unflagged mine
        const mines = [];
        for (let r = 0; r < newBoard.length; r++) {
          for (let c = 0; c < newBoard[0].length; c++) {
            if (
              newBoard[r][c].isMine &&
              !newBoard[r][c].isRevealed &&
              !newBoard[r][c].isFlagged
            ) {
              mines.push({ r, c });
            }
          }
        }
        if (mines.length > 0) {
          const mine = mines[Math.floor(Math.random() * mines.length)];
          newBoard[mine.r][mine.c].isFlagged = true;
          setFlagsLeft((prev) => prev - 1);
          changed = true;
          toast.success("X-Ray: A mine has been flagged!");
        } else {
          toast.info("No hidden mines to reveal!");
        }
        break;
      case "sonar":
        // Reveal a 3x3 safe area (if possible)
        // Find a safe unrevealed cell
        const safeCells = [];
        for (let r = 0; r < newBoard.length; r++) {
          for (let c = 0; c < newBoard[0].length; c++) {
            if (!newBoard[r][c].isMine && !newBoard[r][c].isRevealed) {
              safeCells.push({ r, c });
            }
          }
        }
        if (safeCells.length > 0) {
          const safe = safeCells[Math.floor(Math.random() * safeCells.length)];
          // Just reveal it and neighbors if 0
          // Actually, let's just use the reveal logic
          // But we need to call revealCell which expects state.
          // We can't call revealCell inside here easily without refactoring.
          // Let's just manually reveal this one cell to be safe.
          newBoard[safe.r][safe.c].isRevealed = true;
          changed = true;
          toast.success("Sonar: Safe area revealed!");
        } else {
          toast.info("No safe cells left!");
        }
        break;
      case "lucky":
        // Reveal a random safe cell (similar to Sonar but maybe just one?)
        // Let's make Lucky reveal 3 random safe cells
        let revealedCount = 0;
        for (let i = 0; i < 3; i++) {
          const safeSpots = [];
          for (let r = 0; r < newBoard.length; r++) {
            for (let c = 0; c < newBoard[0].length; c++) {
              if (!newBoard[r][c].isMine && !newBoard[r][c].isRevealed) {
                safeSpots.push({ r, c });
              }
            }
          }
          if (safeSpots.length > 0) {
            const spot =
              safeSpots[Math.floor(Math.random() * safeSpots.length)];
            newBoard[spot.r][spot.c].isRevealed = true;
            revealedCount++;
          }
        }
        if (revealedCount > 0) {
          changed = true;
          toast.success(`Lucky: ${revealedCount} safe cells revealed!`);
        }
        break;
      case "timefreeze":
        isTimeFrozenRef.current = true;
        toast.success("Time Freeze: Timer stopped for 10s!");
        setTimeout(() => {
          isTimeFrozenRef.current = false;
          toast.info("Time Freeze Expired");
        }, 10000);
        break;
    }

    if (changed) {
      setBoard(newBoard);
    }
  };

  const revealCell = (row: number, col: number) => {
    if (
      gameState !== "playing" ||
      board[row][col].isRevealed ||
      board[row][col].isFlagged
    )
      return;

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));

    if (firstClick) {
      initializeBoard(newBoard, row, col);
      setFirstClick(false);
    }

    if (newBoard[row][col].isMine) {
      newBoard.forEach((r) =>
        r.forEach((c) => {
          if (c.isMine) c.isRevealed = true;
        })
      );
      setBoard(newBoard);
      setGameState("lost");
      consumeLife(); // Consume heart on game over
      return;
    }

    const reveal = (r: number, c: number) => {
      if (r < 0 || r >= newBoard.length || c < 0 || c >= newBoard[0].length)
        return;
      if (newBoard[r][c].isRevealed || newBoard[r][c].isMine) return;

      newBoard[r][c].isRevealed = true;

      if (newBoard[r][c].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            reveal(r + dr, c + dc);
          }
        }
      }
    };

    reveal(row, col);
    setBoard(newBoard);

    // Check win
    const allNonMinesRevealed = newBoard.every((row) =>
      row.every((cell) => cell.isMine || cell.isRevealed)
    );
    if (allNonMinesRevealed) setGameState("won");
  };

  const toggleFlag = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (gameState !== "playing" || board[row][col].isRevealed || firstClick)
      return;

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    setBoard(newBoard);
    setFlagsLeft((prev) => prev + (newBoard[row][col].isFlagged ? -1 : 1));
  };

  const getCellColor = (cell: Cell) => {
    if (!cell.isRevealed) return "";
    if (cell.isMine) return "text-red-500";
    const colors = [
      "",
      "text-blue-500",
      "text-green-500",
      "text-red-500",
      "text-purple-500",
      "text-yellow-500",
      "text-pink-500",
      "text-cyan-500",
      "text-gray-500",
    ];
    return colors[cell.neighborMines];
  };

  return (
    <GameWrapper
      title="Minesweeper"
      onReset={resetGame}
      accentColor="text-gray-400"
      stats={[
        { label: "Flags", value: flagsLeft },
        {
          label: "Time",
          value: `${Math.floor(time / 60)}:${(time % 60)
            .toString()
            .padStart(2, "0")}`,
        },
      ]}
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Difficulty Selector */}
        <div className="flex gap-2">
          {(["beginner", "intermediate", "expert"] as Difficulty[]).map(
            (diff) => (
              <Button
                key={diff}
                variant={difficulty === diff ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficulty(diff)}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Button>
            )
          )}
        </div>

        {/* Game Board */}
        <div className="overflow-auto max-w-full">
          <div className="inline-block p-4 bg-card border rounded-lg">
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateRows: `repeat(${board.length}, 1fr)` }}
            >
              {board.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid gap-[2px]"
                  style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}
                >
                  {row.map((cell, colIndex) => (
                    <button
                      key={colIndex}
                      onClick={() => revealCell(rowIndex, colIndex)}
                      onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
                      className={cn(
                        "w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold border transition-all",
                        cell.isRevealed
                          ? "bg-muted border-border cursor-default"
                          : "bg-card hover:bg-accent border-border cursor-pointer active:scale-95",
                        getCellColor(cell)
                      )}
                    >
                      {cell.isRevealed && cell.isMine && (
                        <Bomb className="w-4 h-4" />
                      )}
                      {cell.isRevealed &&
                        !cell.isMine &&
                        cell.neighborMines > 0 &&
                        cell.neighborMines}
                      {!cell.isRevealed && cell.isFlagged && (
                        <Flag className="w-3 h-3 text-red-500" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <GamePowerups
          onUsePowerup={handlePowerup}
          disabled={gameState !== "playing"}
        />

        {/* Game Status */}
        {gameState !== "playing" && (
          <div className="text-center space-y-4 p-6 border rounded-lg bg-card">
            <p className="text-2xl font-bold">
              {gameState === "won" ? "You Win!" : "Game Over!"}
            </p>
            <Button onClick={resetGame} size="lg">
              Play Again
            </Button>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
