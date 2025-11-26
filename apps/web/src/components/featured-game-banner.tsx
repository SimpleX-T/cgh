"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Crosshair, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { useAccount, useWalletClient } from "wagmi";
import { useUserProfile } from "@/hooks/use-user-profile";
import { publicClient } from "@/lib/viem";
import { RECEIVER_ADDRESS, TOKEN_ADDRESSES } from "@/lib/constants";
import { stableTokenABI } from "@celo/abis";
import { parseUnits } from "viem";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export function FeaturedGameBanner() {
  const [minesFound, setMinesFound] = useState(12453);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { profile, refetch } = useUserProfile();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const isUnlocked = profile?.premiumGamesUnlocked?.includes("mine-hunter");

  const handleUnlock = async () => {
    if (!walletClient || !address) {
      toast.error("Wallet not connected");
      return;
    }

    setIsPurchasing(true);
    try {
      toast("Started Payment...");

      const txHash = await walletClient.writeContract({
        address: TOKEN_ADDRESSES.cUSD,
        abi: stableTokenABI,
        functionName: "transfer",
        args: [RECEIVER_ADDRESS, parseUnits("0.1", 18)],
      });

      if (!txHash) throw new Error("Payment failed or cancelled");

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.status !== "success") throw new Error("Transaction failed");

      const res = await fetch("/api/purchase/premium-game", {
        method: "POST",
        body: JSON.stringify({
          txHash: txHash,
          walletAddress: address,
          gameId: "mine-hunter",
        }),
      });

      if (res.ok) {
        toast.success("Game Unlocked!");
        refetch();
      } else {
        const data = await res.json();
        throw new Error("Purchase verification failed: " + data.error);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(`Payment failed: ${error.message}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Simulate live ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setMinesFound((prev) => prev + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-[400px] md:min-h-[300px] md:h-[320px] rounded-xl overflow-hidden mb-12 group flex flex-col justify-center">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-cyan-500 to-pink-500 animate-gradient-xy bg-[length:400%_400%]" />

      {/* Overlay Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-70 mix-blend-overlay" />
      <div className="absolute inset-0 bg-black/20" />

      {/* Content Container */}
      <div className="relative h-full container mx-auto px-6 py-8 md:py-0 flex flex-col justify-center z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-6">
          {/* Left Side: Title & Info */}
          <div className="space-y-4 max-w-2xl w-full">
            <Badge className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold border-none px-3 py-1 mb-2">
              FEATURED GAME
            </Badge>

            <h1
              className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              MINE HUNTER
            </h1>

            <p className="text-lg md:text-xl text-white/90 font-medium max-w-lg drop-shadow-md">
              Find the mines before time runs out! Experience the inverse
              minesweeper challenge.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
              {isUnlocked ? (
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-purple-600 hover:bg-white/90 font-bold text-lg px-8 h-12 rounded-full shadow-xl transition-transform hover:scale-105"
                  asChild
                >
                  <Link href="/games/mine-hunter">
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    PLAY NOW
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleUnlock}
                  disabled={isPurchasing}
                  className="w-full sm:w-auto bg-yellow-500 text-black hover:bg-yellow-400 font-bold text-lg px-8 h-12 rounded-full shadow-xl transition-transform hover:scale-105"
                >
                  {isPurchasing ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-5 w-5" />
                  )}
                  UNLOCK (0.10 cUSD)
                </Button>
              )}

              <div className="hidden md:flex items-center gap-2 text-white/80 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="font-mono font-bold text-yellow-400">
                  {minesFound.toLocaleString()}
                </span>
                <span className="text-sm">mines found today</span>
              </div>
            </div>
          </div>

          {/* Right Side: Preview / Visuals (Desktop only) */}
          <div className="hidden md:block relative flex-shrink-0">
            <div className="relative w-64 h-64">
              {/* Decorative Elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-white/30 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-4 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center"
              >
                <Crosshair className="w-24 h-24 text-white/50" />
              </motion.div>

              {/* Floating Badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-4 -right-4 bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl"
              >
                <Clock className="w-6 h-6 text-cyan-400 mb-1" />
                <div className="text-xs text-white font-mono">TIME ATTACK</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -bottom-4 -left-4 bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-500 to-orange-500 mb-1" />
                <div className="text-xs text-white font-mono">HEAT MAP</div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Glowing Border Effect */}
      <div className="absolute inset-0 border-2 border-white/20 rounded-xl z-20 pointer-events-none" />
    </div>
  );
}
