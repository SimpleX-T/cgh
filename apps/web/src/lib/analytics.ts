export interface GameSession {
  gameId: string
  duration: number // seconds
  result: "win" | "loss" | "draw" | "complete"
  score?: number
  difficulty?: string
  timestamp: number
  mistakes?: number
}

export interface PlayerStats {
  totalGamesPlayed: number
  totalPlayTime: number // seconds
  favoriteGames: string[]
  gameStats: {
    [gameId: string]: {
      timesPlayed: number
      wins: number
      losses: number
      draws: number
      averageScore: number
      bestScore: number
      totalPlayTime: number
      currentStreak: number
      bestStreak: number
      skillRating: number // ELO-like rating
    }
  }
  lastPlayed: {
    gameId: string
    timestamp: number
  } | null
}

export class AnalyticsEngine {
  private static STORAGE_KEY = "game-hub-analytics"
  private static SKILL_RATINGS_KEY = "game-hub-skill-ratings"

  static getPlayerStats(): PlayerStats {
    if (typeof window === "undefined") {
      return this.getDefaultStats()
    }

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return this.getDefaultStats()

    try {
      return JSON.parse(stored)
    } catch {
      return this.getDefaultStats()
    }
  }

  private static getDefaultStats(): PlayerStats {
    return {
      totalGamesPlayed: 0,
      totalPlayTime: 0,
      favoriteGames: [],
      gameStats: {},
      lastPlayed: null,
    }
  }

  static recordGameSession(session: GameSession): void {
    if (typeof window === "undefined") return

    const stats = this.getPlayerStats()

    // Initialize game stats if not exists
    if (!stats.gameStats[session.gameId]) {
      stats.gameStats[session.gameId] = {
        timesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        averageScore: 0,
        bestScore: 0,
        totalPlayTime: 0,
        currentStreak: 0,
        bestStreak: 0,
        skillRating: 1000, // Starting ELO
      }
    }

    const gameStats = stats.gameStats[session.gameId]

    // Update stats
    gameStats.timesPlayed++
    gameStats.totalPlayTime += session.duration
    stats.totalGamesPlayed++
    stats.totalPlayTime += session.duration

    // Update results
    if (session.result === "win") {
      gameStats.wins++
      gameStats.currentStreak++
      gameStats.bestStreak = Math.max(gameStats.bestStreak, gameStats.currentStreak)
      gameStats.skillRating += this.calculateRatingChange(gameStats.skillRating, "win", session.difficulty)
    } else if (session.result === "loss") {
      gameStats.losses++
      gameStats.currentStreak = 0
      gameStats.skillRating += this.calculateRatingChange(gameStats.skillRating, "loss", session.difficulty)
    } else if (session.result === "draw") {
      gameStats.draws++
    }

    // Update score
    if (session.score !== undefined) {
      gameStats.bestScore = Math.max(gameStats.bestScore, session.score)
      gameStats.averageScore =
        (gameStats.averageScore * (gameStats.timesPlayed - 1) + session.score) / gameStats.timesPlayed
    }

    // Update last played
    stats.lastPlayed = {
      gameId: session.gameId,
      timestamp: session.timestamp,
    }

    // Update favorite games (top 3 by play time)
    stats.favoriteGames = Object.entries(stats.gameStats)
      .sort(([, a], [, b]) => b.totalPlayTime - a.totalPlayTime)
      .slice(0, 3)
      .map(([gameId]) => gameId)

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats))
  }

  private static calculateRatingChange(currentRating: number, result: "win" | "loss", difficulty?: string): number {
    const K = 32 // ELO K-factor
    const difficultyMultiplier = {
      easy: 0.5,
      medium: 1.0,
      hard: 1.5,
      expert: 2.0,
    }

    const multiplier = difficulty ? difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1.0 : 1.0
    const expectedScore = 0.5 // Assume equal skill
    const actualScore = result === "win" ? 1 : 0

    return Math.round(K * multiplier * (actualScore - expectedScore))
  }

  static getRecommendedDifficulty(gameId: string): "easy" | "medium" | "hard" {
    const stats = this.getPlayerStats()
    const gameStats = stats.gameStats[gameId]

    if (!gameStats || gameStats.timesPlayed < 3) return "medium"

    const winRate = gameStats.wins / (gameStats.wins + gameStats.losses || 1)
    const skillRating = gameStats.skillRating

    // Adaptive difficulty based on win rate and skill rating
    if (winRate > 0.7 || skillRating > 1200) return "hard"
    if (winRate < 0.3 || skillRating < 800) return "easy"
    return "medium"
  }

  static getRecommendedGames(currentGameId?: string): string[] {
    const stats = this.getPlayerStats()

    // Collaborative filtering based on play patterns
    const playedGames = Object.keys(stats.gameStats)
    if (playedGames.length === 0) {
      // Default recommendations for new players
      return ["tic-tac-toe", "snake", "2048"]
    }

    // Recommend games from same categories
    const favoriteCategories = this.getFavoriteCategories(stats)

    // Filter out current game and return top recommendations
    return playedGames
      .filter((id) => id !== currentGameId)
      .sort((a, b) => {
        const aStats = stats.gameStats[a]
        const bStats = stats.gameStats[b]
        // Sort by total play time
        return bStats.totalPlayTime - aStats.totalPlayTime
      })
      .slice(0, 4)
  }

  private static getFavoriteCategories(stats: PlayerStats): string[] {
    // This would ideally use the games.ts data to map gameId to category
    // For now, return a simple list
    return ["logic", "puzzle"]
  }

  static getSkillLevel(gameId: string): "beginner" | "intermediate" | "advanced" | "expert" {
    const stats = this.getPlayerStats()
    const gameStats = stats.gameStats[gameId]

    if (!gameStats || gameStats.timesPlayed < 5) return "beginner"

    const rating = gameStats.skillRating
    if (rating >= 1400) return "expert"
    if (rating >= 1200) return "advanced"
    if (rating >= 1000) return "intermediate"
    return "beginner"
  }

  static formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m`
    return `${seconds}s`
  }
}
