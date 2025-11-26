"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trophy, Skull } from "lucide-react"

interface GameOverDialogProps {
  isOpen: boolean
  isWin: boolean
  score: number
  minesFound: number
  totalMines: number
  onPlayAgain: () => void
}

export function GameOverDialog({
  isOpen,
  isWin,
  score,
  minesFound,
  totalMines,
  onPlayAgain,
}: GameOverDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            {isWin ? (
              <Trophy className="h-6 w-6 text-yellow-500" />
            ) : (
              <Skull className="h-6 w-6 text-red-500" />
            )}
          </div>
          <DialogTitle className="text-center text-2xl">
            {isWin ? "Mission Accomplished!" : "Mission Failed"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isWin
              ? "You successfully located all the hidden mines!"
              : "You ran out of resources before finding all mines."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Mines Found</span>
            <span className="text-2xl font-bold">{minesFound} / {totalMines}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Score</span>
            <span className="text-2xl font-bold">{score}</span>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={onPlayAgain} className="w-full sm:w-auto">
            Play Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
