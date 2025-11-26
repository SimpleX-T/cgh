"use client"

import { GameWrapper } from "@/components/game-wrapper"
import { Button } from "@/components/ui/button"

export default function Solitaire() {
  return (
    <GameWrapper title="Solitaire" accentColor="text-emerald-500">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          We're working on bringing you a premium Solitaire experience. Check back later!
        </p>
        <Button variant="outline" asChild>
          <a href="/">Back to Games</a>
        </Button>
      </div>
    </GameWrapper>
  )
}
