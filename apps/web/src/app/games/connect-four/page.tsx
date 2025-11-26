"use client";

import { useState, useEffect } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/use-user-profile";

type Player = "red" | "yellow" | null;
type Board = Player[][];
type Difficulty = "easy" | "medium" | "hard";

const ROWS = 6;
const COLS = 7;

export default function ConnectFour() {
  const { consumeLife } = useUserProfile();
  const [board, setBoard] = useState<Board>(() =>
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<"red" | "yellow">("red");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });

  useEffect(() => {
    const saved = localStorage.getItem("c4-scores");
    if (saved) setScores(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (currentPlayer === "yellow" && !winner && !isAIThinking) {
      setIsAIThinking(true);
      setTimeout(() => {
        makeAIMove();
        setIsAIThinking(false);
      }, 800);
    }
  }, [currentPlayer, winner]);

  const dropDisc = (col: number) => {
    if (winner || currentPlayer === "yellow" || isAIThinking) return;

    const row = getLowestEmptyRow(board, col);
    if (row === -1) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    const win = checkWinner(newBoard, row, col);
    if (win) {
      setWinner(currentPlayer);
      setWinningCells(win);
      updateScores(currentPlayer);
    } else if (newBoard.every((row) => row.every((cell) => cell !== null))) {
      setWinner("draw");
      updateScores("draw");
    } else {
      setCurrentPlayer("yellow");
    }
  };

  const makeAIMove = () => {
    const col = getBestMove(board, difficulty);
    if (col === -1) return;

    const row = getLowestEmptyRow(board, col);
    if (row === -1) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = "yellow";
    setBoard(newBoard);

    const win = checkWinner(newBoard, row, col);
    if (win) {
      setWinner("yellow");
      setWinningCells(win);
      updateScores("yellow");
      consumeLife();
    } else if (newBoard.every((row) => row.every((cell) => cell !== null))) {
      setWinner("draw");
      updateScores("draw");
    } else {
      setCurrentPlayer("red");
    }
  };

  const getLowestEmptyRow = (board: Board, col: number): number => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) return row;
    }
    return -1;
  };

  const checkWinner = (
    board: Board,
    row: number,
    col: number
  ): [number, number][] | null => {
    const player = board[row][col];
    if (!player) return null;

    const directions = [
      [
        [0, 1],
        [0, -1],
      ], // Horizontal
      [
        [1, 0],
        [-1, 0],
      ], // Vertical
      [
        [1, 1],
        [-1, -1],
      ], // Diagonal \
      [
        [1, -1],
        [-1, 1],
      ], // Diagonal /
    ];

    for (const [dir1, dir2] of directions) {
      const cells: [number, number][] = [[row, col]];

      for (const [dr, dc] of [dir1, dir2]) {
        let r = row + dr;
        let c = col + dc;
        while (
          r >= 0 &&
          r < ROWS &&
          c >= 0 &&
          c < COLS &&
          board[r][c] === player
        ) {
          cells.push([r, c]);
          r += dr;
          c += dc;
        }
      }

      if (cells.length >= 4) return cells;
    }

    return null;
  };

  const getBestMove = (board: Board, difficulty: Difficulty): number => {
    const availableCols = Array.from({ length: COLS }, (_, i) => i).filter(
      (col) => getLowestEmptyRow(board, col) !== -1
    );

    if (difficulty === "easy") {
      return availableCols[Math.floor(Math.random() * availableCols.length)];
    }

    // Check for winning move
    for (const col of availableCols) {
      const row = getLowestEmptyRow(board, col);
      const testBoard = board.map((r) => [...r]);
      testBoard[row][col] = "yellow";
      if (checkWinner(testBoard, row, col)) return col;
    }

    // Block player winning move
    for (const col of availableCols) {
      const row = getLowestEmptyRow(board, col);
      const testBoard = board.map((r) => [...r]);
      testBoard[row][col] = "red";
      if (checkWinner(testBoard, row, col)) return col;
    }

    if (difficulty === "medium") {
      return availableCols[Math.floor(Math.random() * availableCols.length)];
    }

    // Hard: Prefer center columns
    const centerCols = availableCols.filter((col) => col >= 2 && col <= 4);
    return centerCols.length > 0
      ? centerCols[Math.floor(Math.random() * centerCols.length)]
      : availableCols[Math.floor(Math.random() * availableCols.length)];
  };

  const updateScores = (result: Player | "draw") => {
    const newScores = { ...scores };
    if (result === "red") newScores.player++;
    else if (result === "yellow") newScores.ai++;
    else newScores.draws++;
    setScores(newScores);
    localStorage.setItem("c4-scores", JSON.stringify(newScores));
  };

  const resetGame = () => {
    setBoard(
      Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(null))
    );
    setCurrentPlayer("red");
    setWinner(null);
    setWinningCells([]);
    setIsAIThinking(false);
  };

  return (
    <GameWrapper
      title="Connect Four"
      onReset={resetGame}
      accentColor="text-amber-500"
      stats={[
        { label: "Wins", value: scores.player },
        { label: "Losses", value: scores.ai },
        { label: "Draws", value: scores.draws },
      ]}
    >
      <div className="flex flex-col items-center space-y-6 max-w-3xl mx-auto">
        {/* Difficulty Selector */}
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
            <Button
              key={diff}
              variant={difficulty === diff ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDifficulty(diff);
                resetGame();
              }}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </Button>
          ))}
        </div>

        {/* Game Board */}
        <div className="inline-block p-6 bg-card border-4 border-blue-600 rounded-xl shadow-2xl">
          <div
            className="grid gap-2"
            style={{ gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
          >
            {board.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
              >
                {row.map((cell, colIndex) => (
                  <button
                    key={colIndex}
                    onClick={() => dropDisc(colIndex)}
                    disabled={
                      !!winner || currentPlayer === "yellow" || isAIThinking
                    }
                    className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 transition-all",
                      "hover:scale-110 active:scale-95",
                      cell === null &&
                        "bg-background border-border hover:bg-accent cursor-pointer",
                      cell === "red" && "bg-red-500 border-red-600",
                      cell === "yellow" && "bg-yellow-400 border-yellow-500",
                      winningCells.some(
                        ([r, c]) => r === rowIndex && c === colIndex
                      ) && "ring-4 ring-green-500 scale-110"
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="text-center space-y-4">
          {winner ? (
            <>
              <p className="text-2xl font-bold">
                {winner === "draw"
                  ? "It's a Draw!"
                  : winner === "red"
                  ? "You Win!"
                  : "AI Wins!"}
              </p>
              <Button onClick={resetGame} size="lg">
                Play Again
              </Button>
            </>
          ) : (
            <p className="text-lg">
              {isAIThinking
                ? "AI is thinking..."
                : currentPlayer === "red"
                ? "Your Turn (Red)"
                : "AI Turn (Yellow)"}
            </p>
          )}
        </div>
      </div>
    </GameWrapper>
  );
}
