"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Search,
  Ghost,
  Clock,
  Clover,
  Loader2,
  Coins,
  Heart,
} from "lucide-react";
import { useAccount, useWalletClient } from "wagmi";
import { parseUnits } from "viem";
import { publicClient } from "@/lib/viem";
import { stableTokenABI } from "@celo/abis";
import { CURRENT_CUSD_ADDRESS, RECEIVER_ADDRESS } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POWERUPS = [
  {
    id: "heart",
    name: "Heart (Life)",
    description: "Refill a life instantly",
    price: 0.02,
    icon: Heart,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    id: "sonar",
    name: "Sonar",
    description: "Reveal a 3x3 area around your click",
    price: 0.03,
    icon: Search,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    id: "xray",
    name: "X-Ray",
    description: "See through walls for 5 seconds",
    price: 0.03,
    icon: Ghost,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    id: "timefreeze",
    name: "Time Freeze",
    description: "Stop the timer for 10 seconds",
    price: 0.05,
    icon: Clock,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    id: "lucky",
    name: "Lucky",
    description: "Increase drop rates for next game",
    price: 0.08,
    icon: Clover,
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
];

export function StoreModal({ isOpen, onClose }: StoreModalProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQuantity = (id: string) => quantities[id] || 1;

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  const handlePurchase = async (powerup: (typeof POWERUPS)[0]) => {
    if (!address || !walletClient) {
      toast.error("Please connect your wallet");
      return;
    }

    const quantity = getQuantity(powerup.id);
    const totalPrice = powerup.price * quantity;

    setPurchasingId(powerup.id);
    try {
      toast.loading(`Purchasing ${quantity}x ${powerup.name}...`, {
        id: "purchase-toast",
      });

      // 1. Send Payment
      const txHash = await walletClient.writeContract({
        address: CURRENT_CUSD_ADDRESS,
        abi: stableTokenABI,
        functionName: "transfer",
        args: [RECEIVER_ADDRESS, parseUnits(totalPrice.toFixed(2), 18)],
      });

      if (!txHash) throw new Error("Transaction cancelled");

      // Wait for receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.status !== "success") throw new Error("Transaction failed");

      // 2. Verify on Backend
      const endpoint =
        powerup.id === "heart"
          ? "/api/purchase/hearts"
          : "/api/purchase/powerup";

      const body =
        powerup.id === "heart"
          ? { txHash, walletAddress: address, quantity }
          : {
              txHash,
              walletAddress: address,
              powerupType: powerup.id,
              quantity,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      toast.success(`Successfully purchased ${quantity}x ${powerup.name}!`, {
        id: "purchase-toast",
      });
      // Reset quantity after purchase
      setQuantities((prev) => ({ ...prev, [powerup.id]: 1 }));
      onClose();
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || "Purchase failed", { id: "purchase-toast" });
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-primary/20 h-[450px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-500" />
            Powerup Store
          </DialogTitle>
          <DialogDescription>
            Enhance your gameplay with these powerful items.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 flex-1 overflow-y-auto pr-2">
          {POWERUPS.map((powerup) => {
            const quantity = getQuantity(powerup.id);
            const totalPrice = (powerup.price * quantity).toFixed(2);

            return (
              <div
                key={powerup.id}
                className="relative group flex flex-col p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 transition-all hover:border-primary/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2.5 rounded-lg", powerup.bg)}>
                    <powerup.icon className={cn("w-5 h-5", powerup.color)} />
                  </div>
                  <div className="px-2 py-1 rounded-full bg-background/50 border border-border/50 text-xs font-bold font-mono">
                    {powerup.price} cUSD
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-1">{powerup.name}</h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1">
                  {powerup.description}
                </p>

                <div className="flex items-center justify-between gap-3 mt-auto">
                  <div className="flex items-center gap-2 bg-background/50 rounded-lg p-1 border border-border/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md"
                      onClick={() => updateQuantity(powerup.id, -1)}
                      disabled={quantity <= 1 || !!purchasingId}
                    >
                      -
                    </Button>
                    <span className="text-sm font-mono w-4 text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md"
                      onClick={() => updateQuantity(powerup.id, 1)}
                      disabled={!!purchasingId}
                    >
                      +
                    </Button>
                  </div>

                  <Button
                    onClick={() => handlePurchase(powerup)}
                    disabled={!!purchasingId}
                    className="flex-1 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 h-9 text-xs"
                    variant="ghost"
                  >
                    {purchasingId === powerup.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      `Buy (${totalPrice})`
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
