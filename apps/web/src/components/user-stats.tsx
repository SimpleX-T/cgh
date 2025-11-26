"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Zap, Coins, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserProfile {
  heartsBalance: number;
  totalSpentCELO: number;
  premiumGamesUnlocked: string[];
  heartRefill: {
    nextFreeRefillAt: string | null;
  };
}

export function UserStats() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!address) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/user/profile?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    // Poll every minute for updates (e.g. heart refill)
    const interval = setInterval(fetchProfile, 60000);
    return () => clearInterval(interval);
  }, [address]);

  if (!address || !profile) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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

      {/* Add a Buy Hearts button or similar actions here if needed */}
    </div>
  );
}
