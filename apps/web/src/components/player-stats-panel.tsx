"use client"

import { useEffect, useState } from "react"
import { AnalyticsEngine, type PlayerStats } from "@/lib/analytics"
import { Card } from "@/components/ui/card"
import { Trophy, Target, Clock, TrendingUp } from "lucide-react"
import { games } from "@/lib/games"
import { motion } from "motion/react"

export function PlayerStatsPanel() {
  const [stats, setStats] = useState<PlayerStats | null>(null)

  useEffect(() => {
    setStats(AnalyticsEngine.getPlayerStats())
  }, [])

  if (!stats || stats.totalGamesPlayed === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50">
        <p className="text-muted-foreground text-center">Start playing to see your stats!</p>
      </Card>
    )
  }

  const topGames = Object.entries(stats.gameStats)
    .sort(([, a], [, b]) => b.timesPlayed - a.timesPlayed)
    .slice(0, 3)
    .map(([gameId, gameStats]) => {
      const game = games.find((g) => g.id === gameId)
      return { game, stats: gameStats }
    })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Trophy className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Total Games</h3>
          </div>
          <p className="text-3xl font-bold">{stats.totalGamesPlayed}</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Clock className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Play Time</h3>
          </div>
          <p className="text-3xl font-bold">{AnalyticsEngine.formatPlayTime(stats.totalPlayTime)}</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Favorite</h3>
          </div>
          <p className="text-xl font-bold truncate">
            {stats.favoriteGames.length > 0
              ? games.find((g) => g.id === stats.favoriteGames[0])?.title || "None"
              : "None"}
          </p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Best Streak</h3>
          </div>
          <p className="text-3xl font-bold">
            {Math.max(...Object.values(stats.gameStats).map((s) => s.bestStreak), 0)}
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
