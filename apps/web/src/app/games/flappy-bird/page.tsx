"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { Bird, Play, RotateCcw } from "lucide-react";
import { GamePowerups, type PowerupType } from "@/components/game-powerups";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/use-user-profile";

const GRAVITY = 0.6;
const JUMP_STRENGTH = -8;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 1500;
const GAP_SIZE = 150;

export default function FlappyBird() {
  const { consumeLife } = useUserProfile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameTime, setGameTime] = useState(0); // For animating background

  // Game State Refs (Mutable)
  const birdPosRef = useRef(250);
  const birdVelocityRef = useRef(0);
  const pipesRef = useRef<{ x: number; height: number; passed: boolean }[]>([]);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const scoreRef = useRef(0);

  // Powerup State Refs
  const isInvincibleRef = useRef(false);
  const timeScaleRef = useRef(1);
  const scoreMultiplierRef = useRef(1);

  // React State for rendering
  const [renderBirdPos, setRenderBirdPos] = useState(250);
  const [renderBirdVelocity, setRenderBirdVelocity] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("flappy-highscore");
    if (saved) setHighScore(Number.parseInt(saved));
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const resetGame = () => {
    setIsPlaying(false);
    setScore(0);
    scoreRef.current = 0;
    birdPosRef.current = 250;
    birdVelocityRef.current = 0;
    pipesRef.current = [];
    setGameTime(0);

    // Reset powerups
    isInvincibleRef.current = false;
    timeScaleRef.current = 1;
    scoreMultiplierRef.current = 1;

    setRenderBirdPos(250);
    setRenderBirdVelocity(0);
  };

  const startGame = () => {
    resetGame();
    setIsPlaying(true);
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const jump = useCallback(() => {
    if (!isPlaying) return;
    birdVelocityRef.current = JUMP_STRENGTH;
  }, [isPlaying]);

  const handlePowerup = (type: PowerupType) => {
    if (!isPlaying) {
      toast.error("Start the game first!");
      return;
    }

    switch (type) {
      case "xray":
        isInvincibleRef.current = true;
        toast.success("X-Ray Active: Invincible for 5s!");
        setTimeout(() => {
          isInvincibleRef.current = false;
          toast.info("X-Ray Expired");
        }, 5000);
        break;
      case "timefreeze":
        timeScaleRef.current = 0.5;
        toast.success("Time Freeze: Slow Motion for 10s!");
        setTimeout(() => {
          timeScaleRef.current = 1;
          toast.info("Time Freeze Expired");
        }, 10000);
        break;
      case "lucky":
        scoreMultiplierRef.current = 2;
        toast.success("Lucky: 2x Score for 10s!");
        setTimeout(() => {
          scoreMultiplierRef.current = 1;
          toast.info("Lucky Expired");
        }, 10000);
        break;
      case "sonar":
        toast.info("Sonar: Showing safe path (Not implemented visually yet)");
        break;
    }
  };

  const gameLoop = (time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Apply Time Scale
    const dt = Math.min(deltaTime, 50) * timeScaleRef.current;
    const scale = timeScaleRef.current;

    setGameTime((prev) => prev + 1 * scale);

    // Update Physics
    birdVelocityRef.current += GRAVITY * scale;
    birdPosRef.current += birdVelocityRef.current * scale;

    // Check collision with floor/ceiling
    if (birdPosRef.current > 480 || birdPosRef.current < 0) {
      if (!isInvincibleRef.current) {
        handleGameOver();
        return;
      } else {
        birdPosRef.current = Math.max(0, Math.min(480, birdPosRef.current));
        birdVelocityRef.current = 0;
      }
    }

    // Spawn Pipes
    if (time - spawnTimerRef.current > PIPE_SPAWN_RATE / scale) {
      spawnTimerRef.current = time;
      const height = Math.random() * (300 - 50) + 50;
      pipesRef.current.push({ x: 400, height, passed: false });
    }

    // Move Pipes & Collision Detection
    pipesRef.current.forEach((pipe) => {
      pipe.x -= PIPE_SPEED * scale;

      // Collision with pipes
      if (
        !isInvincibleRef.current &&
        pipe.x < 90 &&
        pipe.x > 10 && // Pipe horizontal range
        (birdPosRef.current < pipe.height ||
          birdPosRef.current > pipe.height + GAP_SIZE) // Bird vertical range
      ) {
        handleGameOver();
      }

      // Score counting
      if (pipe.x < 50 && !pipe.passed) {
        scoreRef.current += 1 * scoreMultiplierRef.current;
        setScore(scoreRef.current);
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
          localStorage.setItem("flappy-highscore", scoreRef.current.toString());
        }
        pipe.passed = true;
      }
    });

    // Remove off-screen pipes
    if (pipesRef.current.length > 0 && pipesRef.current[0].x < -60) {
      pipesRef.current.shift();
    }

    // Sync to State for Render
    setRenderBirdPos(birdPosRef.current);
    setRenderBirdVelocity(birdVelocityRef.current);

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const handleGameOver = () => {
    setIsPlaying(false);
    cancelAnimationFrame(requestRef.current);
    consumeLife();
  };

  // Add keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") jump();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

  return (
    <GameWrapper
      title="Flappy Clone"
      score={score}
      bestScore={highScore}
      onReset={resetGame}
      accentColor="text-sky-500"
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className="relative w-[400px] h-[500px] bg-sky-300 overflow-hidden border-4 border-slate-700 rounded-lg shadow-xl cursor-pointer touch-none select-none"
          onPointerDown={isPlaying ? jump : undefined}
        >
          {/* Moving Background Clouds */}
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{ backgroundPosition: `-${gameTime}px 0` }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute bg-white/40 rounded-full blur-md"
                style={{
                  width: 60 + i * 20,
                  height: 30 + i * 10,
                  left: ((gameTime * 0.5 + i * 150) % 500) - 100,
                  top: 50 + i * 40,
                }}
              />
            ))}
          </div>

          {/* Pipes */}
          {pipesRef.current.map((pipe, i) => (
            <div key={i}>
              {/* Top Pipe */}
              <div
                className="absolute w-[60px] bg-green-500 border-x-4 border-b-4 border-black"
                style={{ left: pipe.x, top: 0, height: pipe.height }}
              />
              {/* Bottom Pipe */}
              <div
                className="absolute w-[60px] bg-green-500 border-x-4 border-t-4 border-black"
                style={{ left: pipe.x, top: pipe.height + GAP_SIZE, bottom: 0 }}
              />
            </div>
          ))}

          {/* Bird */}
          <div
            className={`absolute w-10 h-10 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center transition-transform ${
              isInvincibleRef.current ? "opacity-50 animate-pulse" : ""
            }`}
            style={{
              left: 50,
              top: renderBirdPos,
              transform: `rotate(${Math.min(
                Math.max(renderBirdVelocity * 3, -25),
                90
              )}deg)`,
            }}
          >
            <Bird className="w-6 h-6 text-black" />
            <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full border border-black">
              <div className="absolute top-1 right-0.5 w-1 h-1 bg-black rounded-full" />
            </div>
            <div className="absolute -right-2 top-4 w-4 h-3 bg-orange-500 rounded-r-full border border-black" />
            <div className="absolute -left-2 top-4 w-4 h-2 bg-white rounded-full border border-black opacity-50" />
          </div>

          {/* Ground */}
          <div className="absolute bottom-0 w-full h-[20px] bg-[#ded895] border-t-4 border-amber-900 z-10" />

          {/* UI Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-20">
              <div className="text-center">
                {score > 0 && (
                  <p className="text-2xl font-bold text-white mb-4">
                    Score: {score}
                  </p>
                )}
                <Button
                  onClick={startGame}
                  size="lg"
                  className="text-xl px-8 py-6 bg-sky-500 hover:bg-sky-600"
                >
                  {score > 0 ? (
                    <RotateCcw className="mr-2" />
                  ) : (
                    <Play className="mr-2" />
                  )}
                  {score > 0 ? "Try Again" : "Start Game"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <GamePowerups onUsePowerup={handlePowerup} disabled={!isPlaying} />

        <p className="text-sm text-muted-foreground">
          Press Space or Tap to Jump
        </p>
      </div>
    </GameWrapper>
  );
}
