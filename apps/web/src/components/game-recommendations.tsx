"use client"

import { useEffect, useState } from "react"
import { AnalyticsEngine } from "@/lib/analytics"
import { games } from "@/lib/games"
import { GameCard } from "@/components/game-card"
import { Sparkles } from "lucide-react"

interface GameRecommendationsProps {
  currentGameId?: string
  limit?: number
}

export function GameRecommendations({ currentGameId, limit = 4 }: GameRecommendationsProps) {
  const [recommendedIds, setRecommendedIds] = useState<string[]>([])

  useEffect(() => {
    const ids = AnalyticsEngine.getRecommendedGames(currentGameId)
    setRecommendedIds(ids.slice(0, limit))
  }, [currentGameId, limit])

  if (recommendedIds.length === 0) return null

  const recommendedGames = recommendedIds
    .map((id) => games.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => g !== undefined)

  if (recommendedGames.length === 0) return null

  return (
    <section className="py-12">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-purple-500 fill-purple-500" />
        <h2 className="text-2xl font-bold">Recommended for You</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendedGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}
