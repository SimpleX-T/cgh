"use client";

import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Zap, Coins } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  username: string;
  avatar: string;
  heartsBalance: number;
  totalSpentCELO: number;
  premiumGamesUnlocked: string[];
  heartRefill: {
    nextFreeRefillAt: string | null;
  };
}

import { useUserProfile } from "@/hooks/use-user-profile";

export function UserStats() {
  const { address } = useAccount();
  const { profile, rank, isLoading } = useUserProfile();

  if (!address || !profile) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* User Info Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profile</CardTitle>
          <div className="h-12 w-12 rounded-full overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatar}
              alt="Avatar"
              width={100}
              height={100}
              className="object-cover w-full h-full"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold truncate">{profile.username}</div>
          <Link
            href="/leaderboard"
            prefetch
            className="text-xs text-muted-foreground text-primary hover:underline"
          >
            Rank: {rank ? `#${rank}` : "Unranked"}
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hearts</CardTitle>
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{profile.heartsBalance}/5</div>
          <p className="text-xs text-muted-foreground">
            {profile.heartsBalance < 5 && profile.heartRefill.nextFreeRefillAt
              ? `Next refill: ${new Date(
                  profile.heartRefill.nextFreeRefillAt
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Max capacity"}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <Coins className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {profile.totalSpentCELO.toFixed(2)} cUSD
          </div>
          <p className="text-xs text-muted-foreground">Lifetime contribution</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Premium Games</CardTitle>
          <Zap className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {profile.premiumGamesUnlocked.length}
          </div>
          <p className="text-xs text-muted-foreground">Unlocked forever</p>
        </CardContent>
      </Card>
    </div>
  );
}
