import Link from "next/link";
import type { Game } from "@/lib/games";
import { cn } from "@/lib/utils";
import { Play, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { payForItem } from "@/lib/pay-for-item";
import { RECEIVER_ADDRESS, TOKEN_ADDRESSES } from "@/lib/constants";
import { toast } from "sonner";
import { encodeFunctionData, parseUnits } from "viem";
import { stableTokenABI } from "@celo/abis";
import { publicClient } from "@/lib/viem";

interface GameCardProps {
  game: Game;
  isUnlocked?: boolean;
  onUnlock?: (gameId: string) => void;
}

export function GameCard({ game, isUnlocked = true, onUnlock }: GameCardProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const Icon =
    typeof game.icon === "string" ? (
      <Image
        src={game.icon}
        alt={game.title}
        width={24}
        height={24}
        className="w-14 h-14 object-contain"
      />
    ) : (
      <game.icon />
    );

  const isPremium = game.tier === "premium";
  const locked = isPremium && !isUnlocked;

  const handleUnlock = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toast("Started Payment...");

    // Check your cUSD balance first
    const balance = await publicClient.readContract({
      address: TOKEN_ADDRESSES.cUSD,
      abi: stableTokenABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });
    console.log("cUSD balance:", balance, address);

    // if (!address) {
    //   connect()
    //   return
    // }

    setIsPurchasing(true);
    try {
      // 1. Pay 0.10 cUSD

      if (!walletClient || !address) {
        toast.error("Wallet not connected");
        return;
      }

      const txHash = await walletClient.writeContract({
        address: TOKEN_ADDRESSES.cUSD,
        abi: stableTokenABI,
        functionName: "transfer",
        args: [RECEIVER_ADDRESS, parseUnits("0.1", 18)],
      });

      if (!txHash) {
        throw new Error("Payment failed or cancelled");
      }

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      console.log(receipt);

      // 2. Register purchase on backend
      // Now send to backend with the confirmed hash
      const res = await fetch("/api/purchase/premium-game", {
        method: "POST",
        body: JSON.stringify({
          txHash: txHash, // Use txHash, not receipt
          walletAddress: address,
          gameId: game.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (onUnlock) onUnlock(game.id);
      } else {
        throw new Error("Purchase verification failed: " + data.error);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(`Payment failed: ${error.message}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  const CardContent = (
    <div
      className={cn(
        "relative flex flex-col h-full overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:scale-[1.01]",
        "bg-card/40 backdrop-blur-xl border border-white/5 hover:border-primary/50",
        game.accent,
        locked && "opacity-90 grayscale-[0.3]"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "p-3 rounded-xl bg-background/50 backdrop-blur-sm transition-colors group-hover:bg-background shadow-inner",
            game.color
          )}
        >
          {Icon}
        </div>
        {game.status === "beta" && (
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/20">
            Beta
          </span>
        )}
        {isPremium && (
          <span
            className={cn(
              "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ml-auto",
              locked
                ? "bg-red-500/20 text-red-500 border-red-500/20"
                : "bg-green-500/20 text-green-500 border-green-500/20"
            )}
          >
            {locked ? "Premium" : "Unlocked"}
          </span>
        )}
      </div>

      <div className="space-y-2 flex-1">
        <h3
          className="text-xl font-bold tracking-wide text-white"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          {game.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
          {game.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center space-x-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]",
              locked ? "bg-red-500" : "bg-green-500"
            )}
          />
          <span>{locked ? "Locked" : "AI Enabled"}</span>
        </div>

        {locked ? (
          <Button
            size="sm"
            onClick={handleUnlock}
            disabled={isPurchasing}
            className="rounded-full px-4 text-xs font-bold bg-yellow-500 text-black transition-all duration-300 backdrop-blur-md z-50"
          >
            {isPurchasing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-1">
                <Lock size={14} /> <span>0.10 cUSD</span>
              </div>
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            className="rounded-full px-4 text-xs font-bold bg-white/10 hover:bg-primary hover:text-primary-foreground group-hover:text-black transition-all duration-300 backdrop-blur-md group-hover:bg-white"
          >
            <Play size={28} />
          </Button>
        )}
      </div>

      {/* Decorative background gradient */}
      {/* <div
        className={cn(
          "absolute -right-10 -bottom-10 w-40 h-40 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-3xl",
          game.color.replace("text-", "bg-")
        )}
      /> */}
    </div>
  );

  if (locked) {
    return <div className="group cursor-pointer">{CardContent}</div>;
  }

  return (
    <Link href={game.route} className="group">
      {CardContent}
    </Link>
  );
}
