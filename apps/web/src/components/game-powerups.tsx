"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Search, Ghost, Clock, Clover, Plus, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StoreModal } from "@/components/store-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type PowerupType = "sonar" | "xray" | "timefreeze" | "lucky";

interface GamePowerupsProps {
  onUsePowerup: (type: PowerupType) => void;
  disabled?: boolean;
  className?: string;
}

const POWERUP_CONFIG: Record<
  PowerupType,
  { icon: any; label: string; color: string; bg: string }
> = {
  sonar: {
    icon: Search,
    label: "Sonar",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  xray: {
    icon: Ghost,
    label: "X-Ray",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  timefreeze: {
    icon: Clock,
    label: "Time Freeze",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  lucky: {
    icon: Clover,
    label: "Lucky",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
};

export function GamePowerups({
  onUsePowerup,
  disabled = false,
  className,
}: GamePowerupsProps) {
  const { address } = useAccount();
  const [balances, setBalances] = useState<Record<PowerupType, number>>({
    sonar: 0,
    xray: 0,
    timefreeze: 0,
    lucky: 0,
  });
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [consuming, setConsuming] = useState<PowerupType | null>(null);

  const fetchBalances = async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/user/profile?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setBalances(data.user.powerupBalances);
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  useEffect(() => {
    fetchBalances();
    // Poll for updates (e.g. after store purchase)
    const interval = setInterval(fetchBalances, 5000);
    return () => clearInterval(interval);
  }, [address]);

  const handleUse = async (type: PowerupType) => {
    if (balances[type] <= 0) {
      setIsStoreOpen(true);
      return;
    }

    if (disabled || consuming) return;

    setConsuming(type);
    try {
      // Optimistic update
      setBalances((prev) => ({ ...prev, [type]: prev[type] - 1 }));
      onUsePowerup(type); // Trigger game effect immediately

      // Sync with backend
      await fetch("/api/games/consume-powerup", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: address,
          powerupType: type,
        }),
      });
    } catch (error) {
      console.error("Error consuming powerup:", error);
      toast.error("Failed to use powerup");
      // Revert optimistic update
      fetchBalances();
    } finally {
      setConsuming(null);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-xl bg-background/80 backdrop-blur-md border border-border/50 shadow-lg",
          className
        )}
      >
        {(Object.keys(POWERUP_CONFIG) as PowerupType[]).map((type) => {
          const config = POWERUP_CONFIG[type];
          const count = balances[type] || 0;
          const isConsuming = consuming === type;

          return (
            <TooltipProvider key={type}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "relative w-10 h-10 rounded-lg hover:bg-accent transition-all",
                      config.bg,
                      count === 0 && "opacity-50 grayscale"
                    )}
                    onClick={() => handleUse(type)}
                    disabled={disabled || (count === 0 && disabled)} // Allow clicking if count is 0 to open store, unless game is strictly disabled? Actually, usually we want to allow buying even if paused? Let's allow it.
                  >
                    {isConsuming ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <config.icon className={cn("w-5 h-5", config.color)} />
                    )}

                    {/* Count Badge */}
                    <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-background border border-border rounded-full text-[10px] font-bold shadow-sm">
                      {count > 0 ? count : <Plus className="w-2 h-2" />}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold">{config.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {count > 0 ? "Click to use" : "Click to buy"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      <StoreModal
        isOpen={isStoreOpen}
        onClose={() => {
          setIsStoreOpen(false);
          fetchBalances(); // Refresh after closing store
        }}
      />
    </>
  );
}
