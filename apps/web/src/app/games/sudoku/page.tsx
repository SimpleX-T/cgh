"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eraser, RotateCcw } from "lucide-react";
import { GamePowerups, type PowerupType } from "@/components/game-powerups";
import { useUserProfile } from "@/hooks/use-user-profile";
import { toast } from "sonner";

const BLANK = 0;

export default function Sudoku() {
  const { consumeLife } = useUserProfile();
  const [board, setBoard] = useState<number[][]>([]);
  const [initialBoard, setInitialBoard] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );
  const [mistakes, setMistakes] = useState(0);
  const [time, setTime] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy"
  );

  // Powerup Refs
  const isTimeFrozenRef = useRef(false);

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  useEffect(() => {
    if (!isGameOver && !isWon) {
      const timer = setInterval(() => {
        if (!isTimeFrozenRef.current) {
          setTime((t) => t + 1);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isGameOver, isWon]);

  const startNewGame = () => {
    // Generate a valid Sudoku board
    const solved = generateSolvedBoard();
    const puzzle = removeNumbers(solved, difficulty);

    setSolution(solved);
    setInitialBoard(puzzle.map((row) => [...row]));
    setBoard(puzzle.map((row) => [...row]));
    setMistakes(0);
    setTime(0);
    setIsGameOver(false);
    setIsWon(false);
    setSelectedCell(null);
    isTimeFrozenRef.current = false;
  };

  const generateSolvedBoard = () => {
    const board = Array(9)
      .fill(0)
      .map(() => Array(9).fill(0));
    solveSudoku(board);
    return board;
  };

  const solveSudoku = (board: number[][]) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === BLANK) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (solveSudoku(board)) return true;
              board[row][col] = BLANK;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  const isValid = (
    board: number[][],
    row: number,
    col: number,
    num: number
  ) => {
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num) return false;
      if (board[i][col] === num) return false;
      if (
        board[3 * Math.floor(row / 3) + Math.floor(i / 3)][
          3 * Math.floor(col / 3) + (i % 3)
        ] === num
      )
        return false;
    }
    return true;
  };

  const removeNumbers = (
    solved: number[][],
    diff: "easy" | "medium" | "hard"
  ) => {
    const board = solved.map((row) => [...row]);
    const attempts = diff === "easy" ? 30 : diff === "medium" ? 45 : 55;
    for (let i = 0; i < attempts; i++) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      board[r][c] = BLANK;
    }
    return board;
  };

  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || isWon) return;
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isGameOver || isWon) return;
    const [r, c] = selectedCell;

    // Cannot edit initial cells
    if (initialBoard[r][c] !== BLANK) return;

    // Check correctness
    if (num === solution[r][c]) {
      const newBoard = board.map((row) => [...row]);
      newBoard[r][c] = num;
      setBoard(newBoard);

      // Check win
      if (checkWin(newBoard)) {
        setIsWon(true);
        toast.success("Sudoku Solved!");
      }
    } else {
      setMistakes((m) => {
        const newM = m + 1;
        if (newM >= 3) {
          setIsGameOver(true);
          consumeLife();
          toast.error("Game Over! Too many mistakes.");
        } else {
          toast.error("Incorrect!");
        }
        return newM;
      });
    }
  };

  const checkWin = (currentBoard: number[][]) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] === BLANK) return false;
      }
    }
    return true;
  };

  const handlePowerup = (type: PowerupType) => {
    if (isGameOver || isWon) {
      toast.error("Game is over!");
      return;
    }

    const newBoard = board.map((row) => [...row]);
    let revealedCount = 0;

    const revealRandom = (count: number) => {
      let revealed = 0;
      let attempts = 0;
      while (revealed < count && attempts < 100) {
        const r = Math.floor(Math.random() * 9);
        const c = Math.floor(Math.random() * 9);
        if (newBoard[r][c] === BLANK) {
          newBoard[r][c] = solution[r][c];
          revealed++;
        }
        attempts++;
      }
      return revealed;
    };

    switch (type) {
      case "xray": // Reveal 1
        revealedCount = revealRandom(1);
        if (revealedCount > 0) {
          setBoard(newBoard);
          if (checkWin(newBoard)) setIsWon(true);
          toast.success("X-Ray: Revealed 1 cell!");
        } else {
          toast.info("Board is full!");
        }
        break;
      case "sonar": // Reveal 3
        revealedCount = revealRandom(3);
        if (revealedCount > 0) {
          setBoard(newBoard);
          if (checkWin(newBoard)) setIsWon(true);
          toast.success(`Sonar: Revealed ${revealedCount} cells!`);
        } else {
          toast.info("Board is full!");
        }
        break;
      case "lucky": // Reveal 5
        revealedCount = revealRandom(5);
        if (revealedCount > 0) {
          setBoard(newBoard);
          if (checkWin(newBoard)) setIsWon(true);
          toast.success(`Lucky: Revealed ${revealedCount} cells!`);
        } else {
          toast.info("Board is full!");
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
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || isWon) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        handleNumberInput(num);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        // Optional: Handle clearing if we allowed it, but currently we only allow correct inputs or mistake tracking
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, isGameOver, isWon, board]);

  return (
    <GameWrapper
      title="Sudoku"
      onReset={startNewGame}
      accentColor="text-blue-500"
      stats={[
        { label: "Mistakes", value: `${mistakes}/3` },
        {
          label: "Time",
          value: `${Math.floor(time / 60)}:${(time % 60)
            .toString()
            .padStart(2, "0")}`,
        },
      ]}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2 mb-4">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <Button
              key={d}
              variant={difficulty === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-9 gap-[1px] bg-slate-400 border-2 border-slate-800 p-[2px]">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isInitial = initialBoard[r][c] !== BLANK;
              const isSelected =
                selectedCell?.[0] === r && selectedCell?.[1] === c;
              const isRelated =
                selectedCell &&
                (selectedCell[0] === r || selectedCell[1] === c); // Highlight row/col

              // Add border for 3x3 grids
              const borderRight =
                (c + 1) % 3 === 0 && c !== 8
                  ? "border-r-2 border-r-slate-800"
                  : "";
              const borderBottom =
                (r + 1) % 3 === 0 && r !== 8
                  ? "border-b-2 border-b-slate-800"
                  : "";

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors",
                    "bg-white hover:bg-blue-50",
                    isInitial ? "text-slate-900" : "text-blue-600",
                    isSelected ? "bg-blue-200" : isRelated ? "bg-blue-50" : "",
                    borderRight,
                    borderBottom
                  )}
                >
                  {cell !== BLANK ? cell : ""}
                </div>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-9 gap-2 w-full max-w-md">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-10 sm:h-12 text-lg font-bold"
              onClick={() => handleNumberInput(num)}
              disabled={isGameOver || isWon}
            >
              {num}
            </Button>
          ))}
        </div>

        <GamePowerups
          onUsePowerup={handlePowerup}
          disabled={isGameOver || isWon}
        />

        {(isGameOver || isWon) && (
          <div className="text-center space-y-4 p-6 border rounded-lg bg-card mt-4">
            <p className="text-2xl font-bold">
              {isWon ? "You Won!" : "Game Over!"}
            </p>
            <Button onClick={startNewGame} size="lg">
              Play Again
            </Button>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
