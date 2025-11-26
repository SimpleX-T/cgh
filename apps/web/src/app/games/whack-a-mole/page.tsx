"use client";

import { useState, useEffect, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Hammer } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";

const GAME_DURATION = 30;
const MOLE_STAY_TIME_MIN = 400;
const MOLE_STAY_TIME_MAX = 1000;
const POPUP_INTERVAL_MIN = 500;
const POPUP_INTERVAL_MAX = 1500;

export default function WhackAMole() {
  const { consumeLife } = useUserProfile();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMoles, setActiveMoles] = useState<boolean[]>(
    Array(9).fill(false)
  );
  const [hitMoles, setHitMoles] = useState<boolean[]>(Array(9).fill(false)); // For hit animation

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("whack-highscore");
    if (saved) setHighScore(Number.parseInt(saved));
    return () => stopGame();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) stopGame();
  }, [timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsPlaying(true);
    setActiveMoles(Array(9).fill(false));
    setHitMoles(Array(9).fill(false));

    // Timer
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    // Mole Spawning Loop
    const spawnMole = () => {
      if (!isPlaying && timeLeft <= 0) return;

      const holeIdx = Math.floor(Math.random() * 9);
      setActiveMoles((prev) => {
        const newMoles = [...prev];
        newMoles[holeIdx] = true;
        return newMoles;
      });

      // Hide mole after random time
      setTimeout(() => {
        setActiveMoles((prev) => {
          const newMoles = [...prev];
          newMoles[holeIdx] = false;
          return newMoles;
        });
      }, Math.random() * (MOLE_STAY_TIME_MAX - MOLE_STAY_TIME_MIN) + MOLE_STAY_TIME_MIN);

      // Schedule next spawn
      const nextSpawnTime =
        Math.random() * (POPUP_INTERVAL_MAX - POPUP_INTERVAL_MIN) +
        POPUP_INTERVAL_MIN;
      // Reduce interval as time goes on to increase difficulty
      const speedFactor = Math.max(0.4, timeLeft / GAME_DURATION);

      gameLoopRef.current = setTimeout(spawnMole, nextSpawnTime * speedFactor);
    };

    spawnMole();
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);

    // Consume life if time ran out (Game Over)
    if (timeLeft <= 0) {
      consumeLife();
    }

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("whack-highscore", score.toString());
    }
  };

  const whack = (index: number) => {
    if (!isPlaying || !activeMoles[index] || hitMoles[index]) return;

    setScore((s) => s + 1);

    // Show hit animation
    setHitMoles((prev) => {
      const newHits = [...prev];
      newHits[index] = true;
      return newHits;
    });

    // Hide mole immediately
    setTimeout(() => {
      setActiveMoles((prev) => {
        const newMoles = [...prev];
        newMoles[index] = false;
        return newMoles;
      });
      setHitMoles((prev) => {
        const newHits = [...prev];
        newHits[index] = false;
        return newHits;
      });
    }, 200);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
  };

  return (
    <GameWrapper
      title="Whack-a-Mole"
      score={score}
      bestScore={highScore}
      onReset={() => {
        stopGame();
        setTimeLeft(GAME_DURATION);
      }}
      accentColor="text-orange-700"
      stats={[{ label: "Time", value: timeLeft }]}
    >
      <div className="flex flex-col items-center gap-8 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-4 p-6 bg-amber-900/20 rounded-xl border-4 border-amber-800">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="relative w-24 h-24 sm:w-32 sm:h-32 overflow-hidden"
            >
              {/* Hole */}
              <div className="absolute bottom-0 w-full h-12 bg-black/40 rounded-full blur-sm" />
              <div className="absolute bottom-2 w-full h-8 bg-stone-900 rounded-full border-b-4 border-stone-800" />

              {/* Mole */}
              <div
                className={cn(
                  "absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-24 bg-amber-700 rounded-t-full transition-transform duration-100 cursor-pointer shadow-inner",
                  activeMoles[i] ? "translate-y-2" : "translate-y-28",
                  hitMoles[i] && "scale-95 bg-red-500 brightness-110"
                )}
                onPointerDown={() => whack(i)}
              >
                {/* Face */}
                <div className="absolute top-6 left-4 w-3 h-3 bg-black rounded-full" />
                <div className="absolute top-6 right-4 w-3 h-3 bg-black rounded-full" />
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-6 h-4 bg-pink-300 rounded-full opacity-80" />

                {hitMoles[i] && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl font-bold text-yellow-400 animate-bounce">
                    BONK!
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isPlaying && (
          <div className="text-center space-y-4">
            {timeLeft === 0 && (
              <p className="text-2xl font-bold text-amber-500">Time's Up!</p>
            )}
            <Button
              onClick={startGame}
              size="lg"
              className="w-48 h-16 text-xl bg-orange-600 hover:bg-orange-700"
            >
              <Hammer className="mr-2 h-6 w-6" />{" "}
              {timeLeft === 0 ? "Play Again" : "Start Game"}
            </Button>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
