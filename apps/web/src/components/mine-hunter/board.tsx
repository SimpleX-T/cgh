"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Cell } from "./cell";
import { GameOverDialog } from "./game-over-dialog";
import { Radar, Timer, Zap } from "lucide-react";
import { toast } from "sonner";
import { GamePowerups, type PowerupType } from "@/components/game-powerups";
import { useUserProfile } from "@/hooks/use-user-profile";

// Game Constants
const GRID_SIZE = 8;
const TOTAL_MINES = 5;
const MAX_CLICKS = 25;
const TIME_LIMIT = 60; // seconds

interface Point {
  x: number;
  y: number;
}

export function MineHunterBoard() {
  const { consumeLife } = useUserProfile();
  // Game State
  const [mines, setMines] = useState<Point[]>([]);
  const [revealed, setRevealed] = useState<boolean[][]>([]);
  const [clicksLeft, setClicksLeft] = useState(MAX_CLICKS);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [minesFound, setMinesFound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Powerup Refs
  const isTimeFrozenRef = useRef(false);

  // Initialize Game
  const initGame = useCallback(() => {
    // Reset State
    setClicksLeft(MAX_CLICKS);
    setTimeLeft(TIME_LIMIT);
    setMinesFound(0);
    setIsPlaying(true);
    setGameOver(false);
    setGameWon(false);
    isTimeFrozenRef.current = false;

    // Create Grid
    const newRevealed = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(false));
    setRevealed(newRevealed);

    // Place Mines
    const newMines: Point[] = [];
    while (newMines.length < TOTAL_MINES) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (!newMines.some((m) => m.x === x && m.y === y)) {
        newMines.push({ x, y });
      }
    }
    setMines(newMines);
  }, []);

  // Start game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer Logic
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const timer = setInterval(() => {
      if (!isTimeFrozenRef.current) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame(false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, gameOver]);

  // End Game Logic
  const endGame = (win: boolean) => {
    setIsPlaying(false);
    setGameOver(true);
    setGameWon(win);
    if (!win) consumeLife();

    // Reveal all mines
    const newRevealed = [...revealed];
    mines.forEach((mine) => {
      newRevealed[mine.y][mine.x] = true;
    });
    setRevealed(newRevealed);
  };

  // Calculate Distance to Nearest Mine
  const getDistanceToNearestMine = (x: number, y: number): number => {
    let minDistance = Infinity;
    mines.forEach((mine) => {
      const distance = Math.sqrt(
        Math.pow(x - mine.x, 2) + Math.pow(y - mine.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
      }
    });
    return minDistance;
  };

  // Handle Cell Click
  const handleCellClick = (x: number, y: number) => {
    if (gameOver || revealed[y][x]) return;

    const newRevealed = [...revealed];
    newRevealed[y][x] = true;
    setRevealed(newRevealed);

    // Check if mine found
    const isMine = mines.some((m) => m.x === x && m.y === y);

    if (isMine) {
      const newMinesFound = minesFound + 1;
      setMinesFound(newMinesFound);
      toast.success("Mine Found!", { position: "top-center" });

      if (newMinesFound === TOTAL_MINES) {
        endGame(true);
        return;
      }
    } else {
      // Decrement clicks only if not a mine (optional design choice, sticking to spec)
      const newClicks = clicksLeft - 1;
      setClicksLeft(newClicks);

      if (newClicks <= 0) {
        endGame(false);
        return;
      }
    }
  };

  const handlePowerup = (type: PowerupType) => {
    if (!isPlaying || gameOver) {
      toast.error("Start the game first!");
      return;
    }

    switch (type) {
      case "xray":
      case "lucky":
        // Reveal 1 unrevealed mine
        const hiddenMines = mines.filter((m) => !revealed[m.y][m.x]);
        if (hiddenMines.length > 0) {
          const mine =
            hiddenMines[Math.floor(Math.random() * hiddenMines.length)];
          handleCellClick(mine.x, mine.y);
          toast.success(
            `${type === "xray" ? "X-Ray" : "Lucky"}: Mine Revealed!`
          );
        } else {
          toast.info("No hidden mines left!");
        }
        break;
      case "sonar":
        // Reveal 3 random safe spots (without cost)
        let revealedCount = 0;
        const newRevealed = [...revealed];
        for (let i = 0; i < 3; i++) {
          let x: number;
          let y: number;
          let attempts = 0;
          do {
            x = Math.floor(Math.random() * GRID_SIZE);
            y = Math.floor(Math.random() * GRID_SIZE);
            attempts++;
          } while (
            (newRevealed[y][x] || mines.some((m) => m.x === x && m.y === y)) &&
            attempts < 50
          );

          if (
            !newRevealed[y][x] &&
            !mines.some((m) => m.x === x && m.y === y)
          ) {
            newRevealed[y][x] = true;
            revealedCount++;
          }
        }
        if (revealedCount > 0) {
          setRevealed(newRevealed);
          toast.success(`Sonar: ${revealedCount} safe spots revealed!`);
        } else {
          toast.info("Could not find safe spots to reveal");
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

  return (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto w-full">
      {/* HUD */}
      <div className="w-full grid grid-cols-3 gap-4 bg-secondary/30 p-4 rounded-xl backdrop-blur-sm border border-border/50">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Radar className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Mines</span>
          </div>
          <span className="text-2xl font-mono font-bold text-primary">
            {minesFound}/{TOTAL_MINES}
          </span>
        </div>

        <div className="flex flex-col items-center border-x border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Timer className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Time</span>
          </div>
          <span
            className={`text-2xl font-mono font-bold ${
              timeLeft < 10 ? "text-red-500 animate-pulse" : ""
            }`}
          >
            {timeLeft}s
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Clicks</span>
          </div>
          <span
            className={`text-2xl font-mono font-bold ${
              clicksLeft < 5 ? "text-orange-500" : ""
            }`}
          >
            {clicksLeft}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>Progress</span>
          <span>{Math.round((minesFound / TOTAL_MINES) * 100)}%</span>
        </div>
        <Progress value={(minesFound / TOTAL_MINES) * 100} className="h-2" />
      </div>

      {/* Game Grid */}
      <div
        className="grid gap-2 w-full aspect-square bg-secondary/20 p-4 rounded-xl border border-gray-500/50 shadow-inner"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {revealed.map((row, y) =>
          row.map((isRevealed, x) => {
            const isMine = mines.some((m) => m.x === x && m.y === y);
            const distance =
              isRevealed && !isMine ? getDistanceToNearestMine(x, y) : null;

            return (
              <Cell
                key={`${x}-${y}`}
                x={x}
                y={y}
                isRevealed={isRevealed}
                isMine={isMine}
                distance={distance}
                onClick={() => handleCellClick(x, y)}
                disabled={gameOver}
              />
            );
          })
        )}
      </div>

      <GamePowerups
        onUsePowerup={handlePowerup}
        disabled={!isPlaying || gameOver}
      />

      {/* Game Over Dialog */}
      <GameOverDialog
        isOpen={gameOver}
        isWin={gameWon}
        score={minesFound * 100 + clicksLeft * 10 + timeLeft}
        minesFound={minesFound}
        totalMines={TOTAL_MINES}
        onPlayAgain={initGame}
      />
    </div>
  );
}
