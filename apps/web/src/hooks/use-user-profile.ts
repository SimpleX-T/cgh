"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";

export interface UserProfile {
  heartsBalance: number;
  powerupBalances: {
    sonar: number;
    xray: number;
    timefreeze: number;
    lucky: number;
  };
  heartRefill: {
    nextFreeRefillAt: string | null;
  };
  premiumGamesUnlocked: string[];
}

export function useUserProfile() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/profile?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchProfile();
    const interval = setInterval(fetchProfile, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchProfile]);

  const consumeLife = async () => {
    if (!address) return false;
    try {
      const res = await fetch("/api/games/consume-life", {
        method: "POST",
        body: JSON.stringify({ walletAddress: address }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                heartsBalance: data.heartsBalance,
                heartRefill: {
                  ...prev.heartRefill,
                  nextFreeRefillAt: data.nextFreeRefillAt,
                },
              }
            : null
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error consuming life:", error);
      return false;
    }
  };

  return { profile, isLoading, refetch: fetchProfile, consumeLife };
}
