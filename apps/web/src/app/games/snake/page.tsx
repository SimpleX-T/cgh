"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useSaveScore } from "@/hooks/use-save-score";

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const MIN_SPEED = 50;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

export default function Snake() {
  const { consumeLife } = useUserProfile();
  const { mutate: saveScore } = useSaveScore();
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const directionRef = useRef<Direction>("RIGHT");

  useEffect(() => {
    const saved = localStorage.getItem("snake-highscore");
    if (saved) setHighScore(Number.parseInt(saved));
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      stopGameLoop();
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  useEffect(() => {
    if (!isGameOver && !isPaused) {
      startGameLoop();
    } else {
      stopGameLoop();
    }
    return stopGameLoop;
  }, [snake, isGameOver, isPaused]);

  const startGameLoop = () => {
    stopGameLoop();
    const speed = Math.max(
      MIN_SPEED,
      INITIAL_SPEED - Math.floor(score / 5) * 5
    );
    gameLoopRef.current = setInterval(moveSnake, speed);
  };

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
  };

  const generateFood = (currentSnake: Position[]): Position => {
    let newFood: Position;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  };

  const moveSnake = () => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case "UP":
          newHead.y -= 1;
          break;
        case "DOWN":
          newHead.y += 1;
          break;
        case "LEFT":
          newHead.x -= 1;
          break;
        case "RIGHT":
          newHead.x += 1;
          break;
      }

      // Check collisions
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE ||
        prevSnake.some(
          (segment) => segment.x === newHead.x && segment.y === newHead.y
        )
      ) {
        setIsGameOver(true);
        consumeLife();
        saveScore({ gameId: "snake", score });
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem("snake-highscore", score.toString());
        }
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 1);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        if (directionRef.current !== "DOWN") changeDirection("UP");
        break;
      case "ArrowDown":
        if (directionRef.current !== "UP") changeDirection("DOWN");
        break;
      case "ArrowLeft":
        if (directionRef.current !== "RIGHT") changeDirection("LEFT");
        break;
      case "ArrowRight":
        if (directionRef.current !== "LEFT") changeDirection("RIGHT");
        break;
      case " ":
        setIsPaused((p) => !p);
        break;
    }
  }, []);

  const changeDirection = (newDir: Direction) => {
    directionRef.current = newDir;
    setDirection(newDir);
  };

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
  };

  return (
    <GameWrapper
      title="Snake"
      score={score}
      bestScore={highScore}
      onReset={resetGame}
      accentColor="text-green-500"
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className="relative bg-black/50 border-2 border-green-500/30 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.2)]"
          style={{
            width: "min(80vw, 400px)",
            height: "min(80vw, 400px)",
          }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(20,1fr)] opacity-10 pointer-events-none">
            {Array.from({ length: 400 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-green-500/20" />
            ))}
          </div>

          {/* Food */}
          <div
            className="absolute bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse"
            style={{
              left: `${(food.x / GRID_SIZE) * 100}%`,
              top: `${(food.y / GRID_SIZE) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
            }}
          />

          {/* Snake */}
          {snake.map((segment, i) => (
            <div
              key={`${segment.x}-${segment.y}-${i}`}
              className={cn(
                "absolute transition-all duration-100",
                i === 0 ? "bg-green-400 z-10" : "bg-green-600 z-0",
                i === 0 && "rounded-sm",
                i > 0 && "rounded-sm opacity-80"
              )}
              style={{
                left: `${(segment.x / GRID_SIZE) * 100}%`,
                top: `${(segment.y / GRID_SIZE) * 100}%`,
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
              }}
            />
          ))}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm z-20">
              <h2 className="text-3xl font-bold text-red-500 mb-2">
                Game Over
              </h2>
              <p className="text-xl mb-6">Score: {score}</p>
              <Button
                onClick={resetGame}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                Play Again
              </Button>
            </div>
          )}

          {/* Pause Overlay */}
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-20">
              <h2 className="text-3xl font-bold text-white tracking-widest">
                PAUSED
              </h2>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="grid grid-cols-3 gap-2 w-48 sm:hidden">
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 bg-transparent"
            onPointerDown={() =>
              directionRef.current !== "DOWN" && changeDirection("UP")
            }
          >
            <ArrowUp />
          </Button>
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 bg-transparent"
            onPointerDown={() =>
              directionRef.current !== "RIGHT" && changeDirection("LEFT")
            }
          >
            <ArrowLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 bg-transparent"
            onPointerDown={() => changeDirection("DOWN")} // Center button can pause/resume or just act as down
            onClick={() => setIsPaused((p) => !p)}
          >
            <div className="w-4 h-4 rounded-sm bg-current" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 bg-transparent"
            onPointerDown={() =>
              directionRef.current !== "LEFT" && changeDirection("RIGHT")
            }
          >
            <ArrowRight />
          </Button>
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 bg-transparent"
            onPointerDown={() =>
              directionRef.current !== "UP" && changeDirection("DOWN")
            }
          >
            <ArrowDown />
          </Button>
          <div />
        </div>

        <p className="text-sm text-muted-foreground hidden sm:block">
          Use arrow keys to move • Space to pause
        </p>
      </div>
    </GameWrapper>
  );
}
