"use client"

import { GameWrapper } from "@/components/game-wrapper"
import { MineHunterBoard } from "@/components/mine-hunter/board"

export default function MineHunterPage() {
  return (
    <GameWrapper
      // id="mine-hunter"
      title="Mine Hunter"
      // description="Find the hidden mines using the heat map before time runs out!"
    >
      <MineHunterBoard />
    </GameWrapper>
  )
}
