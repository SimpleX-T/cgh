"use client";

import { useState, useEffect, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Car, Trophy, Flag } from "lucide-react";
import Image from "next/image";
import { useUserProfile } from "@/hooks/use-user-profile";

const ROAD_WIDTH = 300;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 70;
const OBSTACLE_SPEED_BASE = 5;

type Obstacle = { x: number; y: number; type: "car"; image: string };

export default function F1Racing() {
  const { consumeLife } = useUserProfile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  // UI state for smooth rendering, but logic uses refs
  const [tick, setTick] = useState(0); // Force render state
  const [playerX, setPlayerX] = useState(ROAD_WIDTH / 2 - CAR_WIDTH / 2);
  const [playerY, setPlayerY] = useState(500); // Added vertical position
  const [speedDisplay, setSpeedDisplay] = useState(0);

  // Game State Refs (Mutable, instant access in loop)
  const gameState = useRef({
    speed: 0,
    distance: 0,
    score: 0,
    isPlaying: false,
    playerX: ROAD_WIDTH / 2 - CAR_WIDTH / 2,
    playerY: 500,
  });

  // Input State for continuous movement
  const inputState = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const gameLoopRef = useRef<number>(0);
  const roadOffsetRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("f1-highscore");
    if (saved) setHighScore(Number.parseInt(saved));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") inputState.current.left = true;
      if (e.key === "ArrowRight") inputState.current.right = true;
      if (e.key === "ArrowUp") inputState.current.up = true;
      if (e.key === "ArrowDown") inputState.current.down = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") inputState.current.left = false;
      if (e.key === "ArrowRight") inputState.current.right = false;
      if (e.key === "ArrowUp") inputState.current.up = false;
      if (e.key === "ArrowDown") inputState.current.down = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setSpeedDisplay(OBSTACLE_SPEED_BASE);

    // Reset Game State
    gameState.current = {
      speed: OBSTACLE_SPEED_BASE,
      distance: 0,
      score: 0,
      isPlaying: true,
      playerX: ROAD_WIDTH / 2 - CAR_WIDTH / 2,
      playerY: 500,
    };

    // Reset Input State
    inputState.current = { left: false, right: false, up: false, down: false };

    setPlayerX(gameState.current.playerX);
    setPlayerY(gameState.current.playerY);

    obstaclesRef.current = [];
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    if (!gameState.current.isPlaying) return;

    // 1. Handle Input & Movement
    const moveSpeed = 5; // Pixels per frame
    if (inputState.current.left)
      gameState.current.playerX = Math.max(
        0,
        gameState.current.playerX - moveSpeed
      );
    if (inputState.current.right)
      gameState.current.playerX = Math.min(
        ROAD_WIDTH - CAR_WIDTH,
        gameState.current.playerX + moveSpeed
      );
    if (inputState.current.up)
      gameState.current.playerY = Math.max(
        300,
        gameState.current.playerY - moveSpeed
      );
    if (inputState.current.down)
      gameState.current.playerY = Math.min(
        530,
        gameState.current.playerY + moveSpeed
      );

    // Sync Player Position to UI (throttled by tick, but good enough for 60fps)
    setPlayerX(gameState.current.playerX);
    setPlayerY(gameState.current.playerY);

    // 2. Update Game State
    gameState.current.distance += 1;
    roadOffsetRef.current =
      (roadOffsetRef.current + gameState.current.speed) % 50;

    // 3. Spawn Obstacles (Dynamic Difficulty)
    // Base chance 1%, increases by 0.1% every 500 distance units
    const spawnChance = 0.01 + gameState.current.distance / 50000;

    if (Math.random() < spawnChance) {
      const randomCar = `/opponent_car${Math.floor(Math.random() * 3) + 1}.png`;
      obstaclesRef.current.push({
        x: Math.random() * (ROAD_WIDTH - CAR_WIDTH),
        y: -100,
        type: "car", // Only cars now
        image: randomCar,
      });
    }

    // 4. Move Obstacles
    obstaclesRef.current.forEach((obs) => (obs.y += gameState.current.speed));

    // 5. Collision Detection
    const collision = obstaclesRef.current.some(
      (obs) =>
        obs.y + CAR_HEIGHT > gameState.current.playerY + 10 &&
        obs.y < gameState.current.playerY + CAR_HEIGHT - 10 &&
        obs.x < gameState.current.playerX + CAR_WIDTH - 5 &&
        obs.x + CAR_WIDTH > gameState.current.playerX + 5
    );

    if (collision) {
      handleGameOver();
      return;
    }

    // 6. Remove passed obstacles & Score
    const passedCount = obstaclesRef.current.filter(
      (obs) => obs.y > 600
    ).length;
    if (passedCount > 0) {
      gameState.current.score += passedCount * 100;
      setScore(gameState.current.score);

      obstaclesRef.current = obstaclesRef.current.filter((obs) => obs.y <= 600);

      // Increase speed gradually
      gameState.current.speed = Math.min(25, gameState.current.speed + 0.05);
      setSpeedDisplay(gameState.current.speed);
    }

    // Force Re-render
    setTick((t) => t + 1);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const handleGameOver = () => {
    gameState.current.isPlaying = false;
    setIsPlaying(false);
    cancelAnimationFrame(gameLoopRef.current);
    consumeLife();
    if (gameState.current.score > highScore) {
      setHighScore(gameState.current.score);
      localStorage.setItem("f1-highscore", gameState.current.score.toString());
    }
  };

  // Helper for mobile controls
  const setInput = (key: keyof typeof inputState.current, value: boolean) => {
    inputState.current[key] = value;
  };

  return (
    <GameWrapper
      title="F1 Racing"
      score={score}
      bestScore={highScore}
      onReset={startGame}
      accentColor="text-red-500"
      stats={[
        { label: "Speed", value: `${Math.round(speedDisplay * 20)} km/h` },
      ]}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-[340px] h-[600px] overflow-hidden bg-stone-800 border-x-8 border-red-600 rounded-lg shadow-2xl">
          {/* Road Markings */}
          <div
            className="absolute left-1/2 w-4 h-[1200px] -translate-x-1/2 bg-dashed border-l-2 border-r-2 border-white/50"
            style={{ top: -600 + roadOffsetRef.current }}
          />

          {/* Obstacles */}
          {obstaclesRef.current.map((obs, i) => (
            <div
              key={i}
              className="absolute w-10 h-16 transition-transform"
              style={{ left: obs.x, top: obs.y }}
            >
              <Image
                src={obs.image}
                alt="opponent"
                width={40}
                height={70}
                className="w-full h-full object-contain"
              />
            </div>
          ))}

          {/* Player Car */}
          <div
            className="absolute transition-all duration-75"
            style={{ left: playerX, top: playerY }}
          >
            <Image
              src="/car.png"
              alt="car"
              width={300}
              height={300}
              className="w-18 h-16 object-contain"
            />
          </div>

          {/* Start Screen */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <Trophy className="w-16 h-16 text-yellow-500 mb-4 animate-bounce" />
              <h2 className="text-3xl font-bold text-white mb-2">
                Ready to Race?
              </h2>
              <p className="text-white/80 mb-8">
                Avoid traffic! Speed increases over time.
              </p>
              <Button
                onClick={startGame}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-xl px-10 py-6"
              >
                <Flag className="mr-2" /> Start Engine
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="grid grid-cols-3 gap-2 sm:hidden select-none touch-none">
          <div />
          <Button
            size="lg"
            className="h-16 text-2xl active:bg-red-700"
            onPointerDown={() => setInput("up", true)}
            onPointerUp={() => setInput("up", false)}
            onPointerLeave={() => setInput("up", false)}
          >
            ↑
          </Button>
          <div />

          <Button
            size="lg"
            className="h-16 text-2xl active:bg-red-700"
            onPointerDown={() => setInput("left", true)}
            onPointerUp={() => setInput("left", false)}
            onPointerLeave={() => setInput("left", false)}
          >
            ←
          </Button>
          <Button
            size="lg"
            className="h-16 text-2xl active:bg-red-700"
            onPointerDown={() => setInput("down", true)}
            onPointerUp={() => setInput("down", false)}
            onPointerLeave={() => setInput("down", false)}
          >
            ↓
          </Button>
          <Button
            size="lg"
            className="h-16 text-2xl active:bg-red-700"
            onPointerDown={() => setInput("right", true)}
            onPointerUp={() => setInput("right", false)}
            onPointerLeave={() => setInput("right", false)}
          >
            →
          </Button>
        </div>
      </div>
    </GameWrapper>
  );
}
