"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GamePowerups, type PowerupType } from "@/components/game-powerups";
import { toast } from "sonner";

// Word List
const WORDS = [
  "REACT",
  "NEXTJS",
  "TYPESCRIPT",
  "TAILWIND",
  "VERCEL",
  "COMPONENT",
  "HOOK",
  "STATE",
  "EFFECT",
  "CONTEXT",
  "ROUTER",
  "SERVER",
  "CLIENT",
  "API",
  "DATABASE",
];

const GRID_SIZE = 12;

export default function WordSearch() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<
    { r: number; c: number }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [time, setTime] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Powerup Refs
  const isTimeFrozenRef = useRef(false);
  // Store word locations for powerups
  const wordLocationsRef = useRef<Record<string, { r: number; c: number }[]>>(
    {}
  );

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    if (!isGameOver && foundWords.length < words.length) {
      const timer = setInterval(() => {
        if (!isTimeFrozenRef.current) {
          setTime((t) => t + 1);
        }
      }, 1000);
      return () => clearInterval(timer);
    } else if (foundWords.length === words.length && words.length > 0) {
      setIsGameOver(true);
    }
  }, [isGameOver, foundWords, words]);

  const startNewGame = () => {
    const selectedWords = [...WORDS]
      .sort(() => 0.5 - Math.random())
      .slice(0, 8);
    setWords(selectedWords);
    setFoundWords([]);
    setSelectedCells([]);
    setTime(0);
    setIsGameOver(false);
    isTimeFrozenRef.current = false;

    // Generate Grid
    const newGrid = Array(GRID_SIZE)
      .fill("")
      .map(() => Array(GRID_SIZE).fill(""));
    const locations: Record<string, { r: number; c: number }[]> = {};

    selectedWords.forEach((word) => {
      let placed = false;
      while (!placed) {
        const direction = Math.floor(Math.random() * 2); // 0: horizontal, 1: vertical
        const r = Math.floor(
          Math.random() * (GRID_SIZE - (direction === 1 ? word.length : 0))
        );
        const c = Math.floor(
          Math.random() * (GRID_SIZE - (direction === 0 ? word.length : 0))
        );

        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const cell =
            newGrid[r + (direction === 1 ? i : 0)][
              c + (direction === 0 ? i : 0)
            ];
          if (cell !== "" && cell !== word[i]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          locations[word] = [];
          for (let i = 0; i < word.length; i++) {
            newGrid[r + (direction === 1 ? i : 0)][
              c + (direction === 0 ? i : 0)
            ] = word[i];
            locations[word].push({
              r: r + (direction === 1 ? i : 0),
              c: c + (direction === 0 ? i : 0),
            });
          }
          placed = true;
        }
      }
    });

    // Fill empty cells
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] === "") {
          newGrid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    setGrid(newGrid);
    wordLocationsRef.current = locations;
  };

  const handleMouseDown = (r: number, c: number) => {
    if (isGameOver) return;
    setIsDragging(true);
    setSelectedCells([{ r, c }]);
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (!isDragging || isGameOver) return;
    // Simple line check logic (horizontal or vertical only for simplicity in this implementation)
    // Actually, let's support diagonal too if possible, but for now just append if valid line
    const start = selectedCells[0];
    if (!start) return;

    // Check if same row, col, or diagonal
    const dr = r - start.r;
    const dc = c - start.c;

    // Valid if slope is 0, Infinity, or 1/-1
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
      // Re-calculate path from start to current
      const path = [];
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      const stepR = dr === 0 ? 0 : dr / steps;
      const stepC = dc === 0 ? 0 : dc / steps;

      for (let i = 0; i <= steps; i++) {
        path.push({ r: start.r + i * stepR, c: start.c + i * stepC });
      }
      setSelectedCells(path);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (selectedCells.length === 0) return;

    const selectedWord = selectedCells
      .map((cell) => grid[cell.r][cell.c])
      .join("");
    const reversedWord = selectedWord.split("").reverse().join("");

    if (words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
      setFoundWords([...foundWords, selectedWord]);
      toast.success(`Found ${selectedWord}!`);
    } else if (
      words.includes(reversedWord) &&
      !foundWords.includes(reversedWord)
    ) {
      setFoundWords([...foundWords, reversedWord]);
      toast.success(`Found ${reversedWord}!`);
    }

    setSelectedCells([]);
  };

  const handlePowerup = (type: PowerupType) => {
    if (isGameOver) {
      toast.error("Game is over!");
      return;
    }

    const remainingWords = words.filter((w) => !foundWords.includes(w));
    if (remainingWords.length === 0) return;

    const revealWords = (count: number) => {
      const toReveal = remainingWords.slice(0, count);
      setFoundWords((prev) => [...prev, ...toReveal]);
      return toReveal.length;
    };

    switch (type) {
      case "xray": // Find 1 word
        if (revealWords(1) > 0) toast.success("X-Ray: Found 1 word!");
        break;
      case "sonar": // Find 3 words
        if (revealWords(3) > 0) toast.success("Sonar: Found 3 words!");
        break;
      case "lucky": // Find 5 words
        if (revealWords(5) > 0) toast.success("Lucky: Found 5 words!");
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

  // Helper to check if a cell is part of a found word
  const isFound = (r: number, c: number) => {
    for (const word of foundWords) {
      const locs = wordLocationsRef.current[word];
      if (locs?.some((l) => l.r === r && l.c === c)) return true;
    }
    return false;
  };

  // Helper to check if a cell is selected
  const isSelected = (r: number, c: number) => {
    return selectedCells.some((cell) => cell.r === r && cell.c === c);
  };

  return (
    <GameWrapper
      title="Word Search"
      onReset={startNewGame}
      accentColor="text-green-500"
      stats={[
        { label: "Found", value: `${foundWords.length}/${words.length}` },
        {
          label: "Time",
          value: `${Math.floor(time / 60)}:${(time % 60)
            .toString()
            .padStart(2, "0")}`,
        },
      ]}
    >
      <div
        className="flex flex-col items-center gap-6"
        onMouseUp={handleMouseUp}
      >
        <div
          className="grid gap-[2px] bg-gray-300 p-2 rounded-lg select-none touch-none"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => (
              <div
                key={`${r}-${c}`}
                onMouseDown={() => handleMouseDown(r, c)}
                onMouseEnter={() => handleMouseEnter(r, c)}
                className={cn(
                  "w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-base font-bold rounded-sm cursor-pointer transition-colors",
                  isFound(r, c)
                    ? "bg-green-500 text-white"
                    : isSelected(r, c)
                    ? "bg-green-200 text-green-900"
                    : "bg-white text-gray-800 hover:bg-gray-100"
                )}
              >
                {letter}
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {words.map((word) => (
            <div
              key={word}
              className={cn(
                "px-2 py-1 rounded text-xs sm:text-sm font-medium border",
                foundWords.includes(word)
                  ? "bg-green-100 text-green-700 border-green-200 line-through"
                  : "bg-white text-gray-600 border-gray-200"
              )}
            >
              {word}
            </div>
          ))}
        </div>

        <GamePowerups onUsePowerup={handlePowerup} disabled={isGameOver} />

        {isGameOver && (
          <div className="text-center space-y-4 p-6 border rounded-lg bg-card mt-4">
            <p className="text-2xl font-bold text-green-600">
              All Words Found!
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
