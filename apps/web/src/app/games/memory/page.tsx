"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GamePowerups, type PowerupType } from "@/components/game-powerups";
import { toast } from "sonner";
import {
  Brain,
  Zap,
  Star,
  Heart,
  Cloud,
  Sun,
  Moon,
  Music,
  Anchor,
  Coffee,
  Smile,
  Ghost,
} from "lucide-react";

const ICONS = [
  Brain,
  Zap,
  Star,
  Heart,
  Cloud,
  Sun,
  Moon,
  Music,
  Anchor,
  Coffee,
  Smile,
  Ghost,
];

export default function MemoryGame() {
  const [cards, setCards] = useState<
    { id: number; IconComponent: any; isFlipped: boolean; isMatched: boolean }[]
  >([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Powerup Refs
  const isTimeFrozenRef = useRef(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startNewGame();
    return () => {
      if (processingTimeoutRef.current)
        clearTimeout(processingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isGameOver && matches < 8) {
      // 8 pairs for 16 cards
      const timer = setInterval(() => {
        if (!isTimeFrozenRef.current) {
          setTime((t) => t + 1);
        }
      }, 1000);
      return () => clearInterval(timer);
    } else if (matches === 8 && !isGameOver) {
      setIsGameOver(true);
    }
  }, [isGameOver, matches]);

  const startNewGame = () => {
    // Select 8 icons
    const selectedIcons = [...ICONS]
      .sort(() => 0.5 - Math.random())
      .slice(0, 8);
    // Create pairs
    const pairIcons = [...selectedIcons, ...selectedIcons].sort(
      () => 0.5 - Math.random()
    );
    const newCards = pairIcons.map((Icon, index) => ({
      id: index,
      IconComponent: Icon,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(newCards);
    setFlippedCards([]);
    setMatches(0);
    setMoves(0);
    setTime(0);
    setIsGameOver(false);
    setIsProcessing(false);
    isTimeFrozenRef.current = false;
  };

  const handleCardClick = (id: number) => {
    if (
      isGameOver ||
      isProcessing ||
      flippedCards.includes(id) ||
      cards[id].isMatched
    )
      return;

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      setMoves((m) => m + 1);

      const [first, second] = newFlipped;
      if (cards[first].IconComponent === cards[second].IconComponent) {
        // Match
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        setCards(newCards);
        setMatches((m) => m + 1);
        setFlippedCards([]);
        setIsProcessing(false);
        toast.success("Match found!");
      } else {
        // No match
        processingTimeoutRef.current = setTimeout(() => {
          newCards[first].isFlipped = false;
          newCards[second].isFlipped = false;
          setCards(newCards);
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  const handlePowerup = (type: PowerupType) => {
    if (isGameOver) {
      toast.error("Game is over!");
      return;
    }

    const unrevealed = cards.filter((c) => !c.isMatched && !c.isFlipped);
    if (unrevealed.length === 0) return;

    const revealTemporarily = (count: number, duration: number) => {
      if (isProcessing) return;
      setIsProcessing(true);

      const toReveal = [...unrevealed]
        .sort(() => 0.5 - Math.random())
        .slice(0, count);
      const newCards = [...cards];
      toReveal.forEach((c) => (newCards[c.id].isFlipped = true));
      setCards(newCards);

      setTimeout(() => {
        toReveal.forEach((c) => {
          if (!newCards[c.id].isMatched) newCards[c.id].isFlipped = false;
        });
        setCards([...newCards]);
        setIsProcessing(false);
      }, duration);
    };

    switch (type) {
      case "xray": // Reveal 2 cards
        revealTemporarily(2, 2000);
        toast.success("X-Ray: Revealed 2 cards for 2s!");
        break;
      case "sonar": // Reveal 4 cards
        revealTemporarily(4, 3000);
        toast.success("Sonar: Revealed 4 cards for 3s!");
        break;
      case "lucky": // Match a pair
        // Find a pair among unrevealed
        // Group by icon
        const groups: Record<string, number[]> = {};
        unrevealed.forEach((c) => {
          const key =
            c.IconComponent.displayName || c.IconComponent.name || "unknown";
          if (!groups[key]) groups[key] = [];
          groups[key].push(c.id);
        });

        const pairKey = Object.keys(groups).find((k) => groups[k].length >= 2);
        if (pairKey) {
          const [id1, id2] = groups[pairKey];
          const newCards = [...cards];
          newCards[id1].isFlipped = true;
          newCards[id1].isMatched = true;
          newCards[id2].isFlipped = true;
          newCards[id2].isMatched = true;
          setCards(newCards);
          setMatches((m) => m + 1);
          toast.success("Lucky: Auto-matched a pair!");
        } else {
          toast.info("No pairs left to match automatically!");
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
    <GameWrapper
      title="Memory"
      onReset={startNewGame}
      accentColor="text-pink-500"
      stats={[
        { label: "Moves", value: moves },
        { label: "Matches", value: `${matches}/8` },
        {
          label: "Time",
          value: `${Math.floor(time / 60)}:${(time % 60)
            .toString()
            .padStart(2, "0")}`,
        },
      ]}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card) => {
            const Icon = card.IconComponent;
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300 transform perspective-1000",
                  card.isFlipped || card.isMatched
                    ? "bg-white rotate-y-180"
                    : "bg-pink-500 hover:bg-pink-600"
                )}
              >
                {(card.isFlipped || card.isMatched) && (
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500" />
                )}
              </div>
            );
          })}
        </div>

        <GamePowerups onUsePowerup={handlePowerup} disabled={isGameOver} />

        {isGameOver && (
          <div className="text-center space-y-4 p-6 border rounded-lg bg-card mt-4">
            <p className="text-2xl font-bold text-pink-500">Memory Master!</p>
            <Button onClick={startNewGame} size="lg">
              Play Again
            </Button>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
