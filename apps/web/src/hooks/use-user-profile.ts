"use client";

import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface UserProfile {
  username: string;
  avatar: string;
  totalSpentCELO: number;
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
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile", address],
    queryFn: async () => {
      if (!address) return null;
      const res = await fetch(`/api/user/profile?address=${address}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      return { user: data.user as UserProfile, rank: data.rank as number };
    },
    enabled: !!address,
    refetchInterval: 30000, // Poll every 30s
  });

  const consumeLifeMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("No address");
      const res = await fetch("/api/games/consume-life", {
        method: "POST",
        body: JSON.stringify({ walletAddress: address }),
      });
      if (!res.ok) throw new Error("Failed to consume life");
      return res.json();
    },
    onSuccess: (data) => {
      // Update cache immediately
      queryClient.setQueryData(
        ["userProfile", address],
        (old: { user: UserProfile; rank: number } | null) => {
          if (!old) return null;
          return {
            ...old,
            user: {
              ...old.user,
              heartsBalance: data.heartsBalance,
              heartRefill: {
                ...old.user.heartRefill,
                nextFreeRefillAt: data.nextFreeRefillAt,
              },
            },
          };
        }
      );
      // Also invalidate to be sure
      queryClient.invalidateQueries({ queryKey: ["userProfile", address] });
    },
  });

  return {
    profile: profile?.user ?? null,
    rank: profile?.rank ?? null,
    isLoading,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["userProfile", address] }),
    consumeLife: consumeLifeMutation.mutateAsync,
  };
}
