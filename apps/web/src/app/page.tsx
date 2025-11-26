"use client";

import { games, type Game } from "@/lib/games";
import { GameCard } from "@/components/game-card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GameRecommendations } from "@/components/game-recommendations";
import { FeaturedGameBanner } from "@/components/featured-game-banner";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AnalyticsEngine } from "@/lib/analytics";

// import { UserStats } from "@/components/user-stats";

export default function Home() {
  const { address } = useAccount();
  const [recommendations, setRecommendations] = useState<Game[]>([]);
  const [unlockedGames, setUnlockedGames] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (address) {
        try {
          const res = await fetch(`/api/user/profile?address=${address}`);
          if (res.ok) {
            const data = await res.json();
            setUnlockedGames(data.user.premiumGamesUnlocked || []);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        setUnlockedGames([]);
      }
    };
    fetchProfile();
  }, [address]);

  useEffect(() => {
    const recommendedIds = AnalyticsEngine.getRecommendedGames();
    const recommendedGames = recommendedIds
      .map((id) => games.find((g) => g.id === id))
      .filter((g): g is Game => !!g);
    setRecommendations(recommendedGames);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <SiteHeader />

      <main className="flex-1">
        <section className="container px-4 mx-auto pb-12 pt-8">
          {/* <UserStats /> */}
        </section>

        {/* Games Grid */}
        <section id="games" className="container px-4 mx-auto pb-24">
          <FeaturedGameBanner />

          <GameRecommendations limit={4} />
          <div className="flex items-center gap-3 mb-10">
            <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl font-bold">All Games</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isUnlocked={
                  game.tier === "free" || unlockedGames.includes(game.id)
                }
                onUnlock={(gameId) =>
                  setUnlockedGames((prev) => [...prev, gameId])
                }
              />
            ))}
          </div>
        </section>
      </main>

      <div className="container px-4 mx-auto pb-24">
        <p className="text-center text-lg font-bold">
          More games coming soon... 🚀
        </p>
      </div>
    </div>
  );
}
