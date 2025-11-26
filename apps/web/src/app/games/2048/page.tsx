"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { GamePowerups, type PowerupType } from "@/components/game-powerups";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useSaveScore } from "@/hooks/use-save-score";
import { toast } from "sonner";

const GRID_SIZE = 4;

export default function Game2048() {
  const { consumeLife } = useUserProfile();
  const { mutate: saveScore } = useSaveScore();
  const [board, setBoard] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // Undo State
  const historyRef = useRef<{ board: number[][]; score: number }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("2048-highscore");
    if (saved) setHighScore(Number.parseInt(saved));
    initGame();
  }, []);

  const initGame = () => {
    const newBoard = Array(GRID_SIZE)
      .fill(0)
      .map(() => Array(GRID_SIZE).fill(0));
    addNewTile(newBoard);
    addNewTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setWon(false);
    historyRef.current = [];
  };

  const addNewTile = (currentBoard: number[][]) => {
    const emptyCells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentBoard[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } =
        emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const move = useCallback(
    (direction: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
      if (gameOver) return;

      // Save history before move
      historyRef.current.push({
        board: board.map((row: number[]) => [...row]),
        score,
      });
      if (historyRef.current.length > 5) historyRef.current.shift(); // Keep last 5 moves

      let moved = false;
      const newBoard = board.map((row: number[]) => [...row]);
      let newScore = score;

      const rotateRight = (matrix: number[][]) =>
        matrix[0].map((val, index) =>
          matrix.map((row) => row[index]).reverse()
        );
      const rotateLeft = (matrix: number[][]) =>
        matrix[0].map((val, index) =>
          matrix.map((row) => row[row.length - 1 - index])
        );

      const slide = (row: number[]) => {
        const filtered = row.filter((val) => val !== 0);
        const missing = GRID_SIZE - filtered.length;
        const zeros = Array(missing).fill(0);
        return filtered.concat(zeros);
      };

      const combine = (row: number[]) => {
        for (let i = 0; i < GRID_SIZE - 1; i++) {
          if (row[i] !== 0 && row[i] === row[i + 1]) {
            row[i] *= 2;
            row[i + 1] = 0;
            newScore += row[i];
            moved = true;
          }
        }
        return row;
      };

      const operate = (row: number[]) => {
        const slid = slide(row);
        const combined = combine(slid);
        const final = slide(combined);
        if (JSON.stringify(row) !== JSON.stringify(final)) moved = true;
        return final;
      };

      if (direction === "LEFT") {
        for (let i = 0; i < GRID_SIZE; i++) newBoard[i] = operate(newBoard[i]);
      } else if (direction === "RIGHT") {
        for (let i = 0; i < GRID_SIZE; i++) {
          newBoard[i] = newBoard[i].reverse();
          newBoard[i] = operate(newBoard[i]);
          newBoard[i] = newBoard[i].reverse();
        }
      } else if (direction === "UP") {
        // UP: Rotate Left, Operate, Rotate Right
        let temp = rotateLeft(newBoard);
        for (let i = 0; i < GRID_SIZE; i++) temp[i] = operate(temp[i]);
        const res = rotateRight(temp);
        for (let r = 0; r < GRID_SIZE; r++) newBoard[r] = res[r];
      } else if (direction === "DOWN") {
        // DOWN: Rotate Right, Operate, Rotate Left
        let temp = rotateRight(newBoard);
        for (let i = 0; i < GRID_SIZE; i++) temp[i] = operate(temp[i]);
        const res = rotateLeft(temp);
        for (let r = 0; r < GRID_SIZE; r++) newBoard[r] = res[r];
      }

      if (moved) {
        addNewTile(newBoard);
        setBoard(newBoard);
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem("2048-highscore", newScore.toString());
        }
        if (checkWin(newBoard) && !won) setWon(true);
        if (checkGameOver(newBoard)) {
          setGameOver(true);
          consumeLife();
          saveScore({ gameId: "2048", score: newScore });
        }
      } else {
        // Pop history if move didn't happen
        historyRef.current.pop();
      }
    },
    [board, score, highScore, gameOver, won]
  );

  const checkWin = (currentBoard: number[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentBoard[r][c] === 2048) return true;
      }
    }
    return false;
  };

  const checkGameOver = (currentBoard: number[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentBoard[r][c] === 0) return false;
        if (c < GRID_SIZE - 1 && currentBoard[r][c] === currentBoard[r][c + 1])
          return false;
        if (r < GRID_SIZE - 1 && currentBoard[r][c] === currentBoard[r + 1][c])
          return false;
      }
    }
    return true;
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") move("UP");
      else if (e.key === "ArrowDown") move("DOWN");
      else if (e.key === "ArrowLeft") move("LEFT");
      else if (e.key === "ArrowRight") move("RIGHT");
    },
    [move]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handlers = useSwipeable({
    onSwipedLeft: () => move("LEFT"),
    onSwipedRight: () => move("RIGHT"),
    onSwipedUp: () => move("UP"),
    onSwipedDown: () => move("DOWN"),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const getTileColor = (value: number) => {
    const colors: Record<number, string> = {
      2: "bg-gray-200 text-gray-800",
      4: "bg-gray-300 text-gray-800",
      8: "bg-orange-200 text-white",
      16: "bg-orange-400 text-white",
      32: "bg-orange-500 text-white",
      64: "bg-orange-600 text-white",
      128: "bg-yellow-200 text-white",
      256: "bg-yellow-300 text-white",
      512: "bg-yellow-400 text-white",
      1024: "bg-yellow-500 text-white",
      2048: "bg-yellow-600 text-white",
    };
    return colors[value] || "bg-gray-900 text-white";
  };

  const handlePowerup = (type: PowerupType) => {
    if (gameOver) {
      toast.error("Game Over! Restart to use powerups.");
      return;
    }

    const newBoard = board.map((row) => [...row]);
    let changed = false;

    switch (type) {
      case "timefreeze": // Undo
        if (historyRef.current.length > 0) {
          const lastState = historyRef.current.pop();
          if (lastState) {
            setBoard(lastState.board);
            setScore(lastState.score);
            toast.success("Time Freeze: Undo successful!");
          }
        } else {
          toast.info("No moves to undo!");
        }
        break;
      case "xray": // Remove low tiles (2s and 4s)
        let removedCount = 0;
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (newBoard[r][c] === 2 || newBoard[r][c] === 4) {
              newBoard[r][c] = 0;
              removedCount++;
            }
          }
        }
        if (removedCount > 0) {
          setBoard(newBoard);
          toast.success(`X-Ray: Removed ${removedCount} low tiles!`);
        } else {
          toast.info("No low tiles (2 or 4) to remove!");
        }
        break;
      case "lucky": // Upgrade random tile
      case "sonar": // Map Sonar to Upgrade too for now
        const tiles = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (newBoard[r][c] > 0 && newBoard[r][c] < 2048) {
              tiles.push({ r, c });
            }
          }
        }
        if (tiles.length > 0) {
          const tile = tiles[Math.floor(Math.random() * tiles.length)];
          newBoard[tile.r][tile.c] *= 2;
          setBoard(newBoard);
          setScore((s) => s + newBoard[tile.r][tile.c]);
          toast.success(
            `Lucky: Upgraded a tile to ${newBoard[tile.r][tile.c]}!`
          );
        } else {
          toast.info("No tiles to upgrade!");
        }
        break;
    }
  };

  return (
    <GameWrapper
      title="2048"
      score={score}
      bestScore={highScore}
      onReset={initGame}
      accentColor="text-yellow-500"
    >
      <div className="flex flex-col items-center gap-6" {...handlers}>
        <div className="relative bg-gray-800 p-4 rounded-lg shadow-xl">
          <div className="grid grid-cols-4 gap-4">
            {board.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-2xl font-bold rounded-md transition-all duration-100",
                    cell === 0 ? "bg-gray-700" : getTileColor(cell)
                  )}
                >
                  {cell !== 0 && cell}
                </div>
              ))
            )}
          </div>

          {(gameOver || won) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
              <h2 className="text-4xl font-bold text-white mb-4">
                {won ? "You Win!" : "Game Over"}
              </h2>
              <Button onClick={initGame} size="lg">
                <RotateCcw className="mr-2 h-6 w-6" /> Play Again
              </Button>
            </div>
          )}
        </div>

        <GamePowerups onUsePowerup={handlePowerup} disabled={gameOver} />

        <div className="grid grid-cols-3 gap-4 w-full max-w-[300px] sm:hidden">
          <div />
          <Button
            variant="outline"
            size="icon"
            onClick={() => move("UP")}
            className="h-16 w-16 rounded-full"
          >
            <ArrowUp size={24} />
          </Button>
          <div />
          <Button
            variant="outline"
            size="icon"
            onClick={() => move("LEFT")}
            className="h-16 w-16 rounded-full"
          >
            <ArrowLeft size={24} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => move("DOWN")}
            className="h-16 w-16 rounded-full"
          >
            <ArrowDown size={24} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => move("RIGHT")}
            className="h-16 w-16 rounded-full"
          >
            <ArrowRight size={24} />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Use Arrow keys or Swipe to move tiles
        </p>
      </div>
    </GameWrapper>
  );
}
