"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Radar } from "lucide-react";

interface CellProps {
  x: number;
  y: number;
  isRevealed: boolean;
  isMine: boolean;
  distance: number | null;
  onClick: () => void;
  disabled: boolean;
}

export function Cell({
  x,
  y,
  isRevealed,
  isMine,
  distance,
  onClick,
  disabled,
}: CellProps) {
  // Determine color based on distance (Heat Map)
  const getHeatColor = (dist: number) => {
    if (dist === 0) return "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"; // Mine found!
    if (dist <= 1.5) return "bg-orange-500"; // Very Hot
    if (dist <= 2.5) return "bg-yellow-500"; // Hot
    if (dist <= 3.5) return "bg-green-500"; // Warm
    if (dist <= 5) return "bg-cyan-500"; // Cold
    return "bg-blue-500"; // Freezing
  };

  return (
    <motion.button
      whileHover={!isRevealed && !disabled ? { scale: 1.05 } : {}}
      whileTap={!isRevealed && !disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={isRevealed || disabled}
      className={cn(
        "w-full aspect-square rounded-lg flex items-center justify-center text-xl border border-gray-500/50 font-bold transition-colors duration-300",
        !isRevealed && "bg-secondary hover:bg-secondary/80 cursor-pointer",
        isRevealed && isMine && "bg-red-500 text-white",
        isRevealed && !isMine && getHeatColor(distance || 10) + " text-white",
        disabled && !isRevealed && "opacity-50 cursor-not-allowed"
      )}
    >
      {isRevealed && isMine && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Radar className="w-6 h-6 animate-pulse" />
        </motion.div>
      )}
      {isRevealed && !isMine && distance !== null && (
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Optional: Show distance number for debugging or easy mode */}
          {/* {Math.round(distance * 10) / 10} */}
        </motion.span>
      )}
    </motion.button>
  );
}
