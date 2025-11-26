"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { ChevronDown, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";

const TETROMINOS = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "bg-cyan-500",
  },
  J: {
    shape: [
      [2, 0, 0],
      [2, 2, 2],
      [0, 0, 0],
    ],
    color: "bg-blue-500",
  },
  L: {
    shape: [
      [0, 0, 3],
      [3, 3, 3],
      [0, 0, 0],
    ],
    color: "bg-orange-500",
  },
  O: {
    shape: [
      [4, 4],
      [4, 4],
    ],
    color: "bg-yellow-500",
  },
  S: {
    shape: [
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0],
    ],
    color: "bg-green-500",
  },
  T: {
    shape: [
      [0, 6, 0],
      [6, 6, 6],
      [0, 0, 0],
    ],
    color: "bg-purple-500",
  },
  Z: {
    shape: [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ],
    color: "bg-red-500",
  },
};

const ROWS = 20;
const COLS = 10;

export default function Tetris() {
  const { consumeLife } = useUserProfile();
  // Fix: Use Array.from to create independent rows
  const [grid, setGrid] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  );
  const [activePiece, setActivePiece] = useState<any>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const createPiece = () => {
    const keys = Object.keys(TETROMINOS);
    const type = keys[Math.floor(Math.random() * keys.length)];
    const piece = TETROMINOS[type as keyof typeof TETROMINOS];
    return {
      shape: piece.shape,
      color: piece.color,
      type,
    };
  };

  const checkCollision = (
    pieceGrid: number[][],
    pos: { x: number; y: number },
    board: number[][]
  ) => {
    for (let y = 0; y < pieceGrid.length; y++) {
      for (let x = 0; x < pieceGrid[y].length; x++) {
        if (pieceGrid[y][x] !== 0) {
          const boardY = y + pos.y;
          const boardX = x + pos.x;

          if (
            boardY >= ROWS ||
            boardX < 0 ||
            boardX >= COLS ||
            (boardY >= 0 && board[boardY][boardX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const spawnPiece = (currentGrid = grid) => {
    const piece = createPiece();
    setActivePiece(piece);
    setPosition({
      x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2),
      y: 0,
    });

    if (
      checkCollision(
        piece.shape,
        {
          x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2),
          y: 0,
        },
        currentGrid
      )
    ) {
      setGameOver(true);
      consumeLife();
    }
  };

  const startGame = () => {
    // Fix: Ensure new grid has independent rows
    const newGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setPaused(false);
    spawnPiece(newGrid);
  };

  // ... (checkCollision remains same)

  const mergePiece = () => {
    const newGrid = grid.map((row) => [...row]);
    activePiece.shape.forEach((row: number[], y: number) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          if (y + position.y >= 0 && y + position.y < ROWS) {
            newGrid[y + position.y][x + position.x] = value;
          }
        }
      });
    });

    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (newGrid[y].every((cell) => cell !== 0)) {
        newGrid.splice(y, 1);
        newGrid.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++;
      }
    }

    if (linesCleared > 0) {
      setScore((s) => s + linesCleared * 100 * linesCleared);
    }

    setGrid(newGrid);
    spawnPiece(newGrid);
  };

  const move = useCallback(
    (dx: number, dy: number) => {
      if (gameOver || paused || !activePiece) return;

      const newPos = { x: position.x + dx, y: position.y + dy };
      if (!checkCollision(activePiece.shape, newPos, grid)) {
        setPosition(newPos);
      } else if (dy > 0) {
        mergePiece();
      }
    },
    [activePiece, grid, gameOver, paused, position]
  );

  const rotate = useCallback(() => {
    if (gameOver || paused || !activePiece) return;

    const rotated = activePiece.shape[0].map((_: any, i: number) =>
      activePiece.shape.map((row: any) => row[i]).reverse()
    );

    if (!checkCollision(rotated, position, grid)) {
      setActivePiece({ ...activePiece, shape: rotated });
    }
  }, [activePiece, grid, gameOver, paused, position]);

  useEffect(() => {
    if (!gameOver && !paused) {
      gameLoopRef.current = setInterval(() => {
        move(0, 1);
      }, 1000 - Math.min(score / 5, 800));
    }
    return () => clearInterval(gameLoopRef.current as NodeJS.Timeout);
  }, [move, gameOver, paused, score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || paused) return;
      if (e.key === "ArrowLeft") move(-1, 0);
      if (e.key === "ArrowRight") move(1, 0);
      if (e.key === "ArrowDown") move(0, 1);
      if (e.key === "ArrowUp") rotate();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move, rotate, gameOver, paused]);

  const getColor = (val: number) => {
    const colors = [
      "",
      "bg-cyan-500",
      "bg-blue-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-red-500",
    ];
    return colors[val] || "bg-transparent";
  };

  const renderGrid = () => {
    const displayGrid = grid.map((row) => [...row]);
    if (activePiece && !gameOver) {
      activePiece.shape.forEach((row: number[], y: number) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const py = y + position.y;
            const px = x + position.x;
            if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
              displayGrid[py][px] = value;
            }
          }
        });
      });
    }
    return displayGrid;
  };

  return (
    <GameWrapper
      title="Tetris"
      score={score}
      onReset={startGame}
      accentColor="text-purple-500"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative bg-slate-900 p-2 rounded-lg border-4 border-slate-700">
          <div className="grid grid-cols-10 gap-px bg-slate-800">
            {renderGrid().map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={`w-6 h-6 sm:w-8 sm:h-8 ${
                    cell ? getColor(cell) : "bg-slate-900/50"
                  }`}
                />
              ))
            )}
          </div>

          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Game Over
                </h2>
                <Button onClick={startGame}>Play Again</Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] sm:hidden">
          <div />
          <Button
            size="icon"
            variant="outline"
            className="h-14 w-14 rounded-full bg-transparent"
            onClick={rotate}
          >
            <RotateCw />
          </Button>
          <div />
          <Button
            size="icon"
            variant="outline"
            className="h-14 w-14 rounded-full bg-transparent"
            onClick={() => move(-1, 0)}
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-14 w-14 rounded-full bg-transparent"
            onClick={() => move(0, 1)}
          >
            <ChevronDown />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-14 w-14 rounded-full bg-transparent"
            onClick={() => move(1, 0)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </GameWrapper>
  );
}
