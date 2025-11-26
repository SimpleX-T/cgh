"use client";

import { useState, useEffect } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useUserProfile } from "@/hooks/use-user-profile";

const COLORS = [
  { id: 0, color: "bg-red-500", active: "bg-red-400", sound: "C4" },
  { id: 1, color: "bg-blue-500", active: "bg-blue-400", sound: "E4" },
  { id: 2, color: "bg-green-500", active: "bg-green-400", sound: "G4" },
  { id: 3, color: "bg-yellow-500", active: "bg-yellow-400", sound: "B4" },
];

export default function SimonSays() {
  const { consumeLife } = useUserProfile();
  const [sequence, setSequence] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(false);
  const [playerStep, setPlayerStep] = useState(0);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("simon-best");
    if (saved) setBestScore(Number.parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem("simon-best", score.toString());
    }
  }, [score, bestScore]);

  const startGame = () => {
    setSequence([]);
    setScore(0);
    setGameOver(false);
    setPlaying(true);
    setTimeout(() => addToSequence([]), 500);
  };

  const addToSequence = (currentSeq: number[]) => {
    const nextColor = Math.floor(Math.random() * 4);
    const newSeq = [...currentSeq, nextColor];
    setSequence(newSeq);
    playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    setPlayerTurn(false);
    for (let i = 0; i < seq.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setActiveButton(seq[i]);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setActiveButton(null);
    }
    setPlayerTurn(true);
    setPlayerStep(0);
  };

  const handleColorClick = (id: number) => {
    if (!playerTurn || !playing) return;

    setActiveButton(id);
    setTimeout(() => setActiveButton(null), 300);

    if (id === sequence[playerStep]) {
      if (playerStep === sequence.length - 1) {
        setScore((s) => s + 1);
        setPlayerTurn(false);
        setTimeout(() => addToSequence(sequence), 1000);
      } else {
        setPlayerStep((s) => s + 1);
      }
    } else {
      setGameOver(true);
      setPlaying(false);
      setPlayerTurn(false);
      consumeLife();
    }
  };

  return (
    <GameWrapper
      title="Simon Says"
      score={score}
      bestScore={bestScore}
      onReset={startGame}
      accentColor="text-indigo-500"
    >
      <div className="flex flex-col items-center justify-center gap-8 p-8 border border-white">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 my-12 border border-white">
          <div className="grid grid-cols-2 gap-4 w-full h-full rotate-45">
            {COLORS.map((btn) => (
              <motion.div
                key={btn.id}
                className={`rounded-2xl cursor-pointer shadow-xl border-4 border-transparent ${
                  activeButton === btn.id
                    ? "brightness-150 scale-105 border-white/50"
                    : "brightness-100"
                } ${btn.color}`}
                onClick={() => handleColorClick(btn.id)}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: activeButton === btn.id ? 1.05 : 1 }}
              />
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-background rounded-full p-4 shadow-xl z-10 pointer-events-auto">
              {!playing && !gameOver && (
                <Button
                  size="lg"
                  className="rounded-full w-20 h-20"
                  onClick={startGame}
                >
                  Play
                </Button>
              )}
              {gameOver && (
                <div className="text-center">
                  <p className="text-destructive font-bold mb-2">Game Over</p>
                  <Button size="sm" onClick={startGame}>
                    Retry
                  </Button>
                </div>
              )}
              {playing && !gameOver && (
                <div className="text-center font-bold text-xl">{score}</div>
              )}
            </div>
          </div>
        </div>

        <p className="text-muted-foreground text-center">
          {playing
            ? playerTurn
              ? "Your turn!"
              : "Watch the sequence..."
            : "Watch the pattern and repeat it."}
        </p>
      </div>
    </GameWrapper>
  );
}
