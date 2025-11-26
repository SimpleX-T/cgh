"use client";

import Link from "next/link";
import {
  Heart,
  Clock,
  Search,
  Ghost,
  Clover,
  Plus,
  Trophy,
} from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StoreModal } from "@/components/store-modal";
import Image from "next/image";
import { isMiniPay } from "@/lib/web3/wallet";
import { useUserProfile } from "@/hooks/use-user-profile";

export function SiteHeader() {
  const { address } = useAccount();
  const { profile } = useUserProfile();
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isMiniPayUser, setIsMiniPayUser] = useState(false);

  useEffect(() => {
    setIsMiniPayUser(isMiniPay());
  }, [address]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="mr-6 flex items-center space-x-2 group">
          <div className="relative w-14 h-14 transition-transform group-hover:scale-110">
            <Image
              src="/CELO.png"
              alt="Celo Game Hub"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link
            href="/leaderboard"
            className="text-sm font-medium hover:text-primary transition-colors mr-2"
          >
            <Trophy className="w-4 h-4 mr-2 md:hidden" />
            <span className="hidden md:block">Leaderboard</span>
          </Link>
          {profile && (
            <div className="flex items-center space-x-4 mr-4">
              {/* Hearts */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-1 bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      <span className="font-bold text-sm">
                        {profile.heartsBalance}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hearts Balance</p>
                    {profile.heartsBalance < 5 &&
                      profile.heartRefill.nextFreeRefillAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Refill in:{" "}
                          {new Date(
                            profile.heartRefill.nextFreeRefillAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Powerups - Click to Open Store */}
              <button
                onClick={() => setIsStoreOpen(true)}
                className="flex items-center space-x-2 bg-secondary/30 px-3 py-1.5 rounded-full border border-border/30 hover:bg-secondary/50 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-1">
                        <Search className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-medium">
                          {profile.powerupBalances.sonar}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Sonar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="w-[1px] h-3 bg-border/50" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-1">
                        <Ghost className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-medium">
                          {profile.powerupBalances.xray}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>X-Ray</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="w-[1px] h-3 bg-border/50" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="hidden sm:flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-medium">
                          {profile.powerupBalances.timefreeze}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Time Freeze</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="hidden sm:block w-[1px] h-3 bg-border/50" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="hidden sm:flex items-center space-x-1">
                        <Clover className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-medium">
                          {profile.powerupBalances.lucky}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Lucky</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="w-[1px] h-3 bg-border/50" />

                <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          )}

          {!isMiniPayUser && (
            <ConnectButton
              showBalance={false}
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
              chainStatus={"none"}
            />
          )}
        </div>
      </div>

      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
    </header>
  );
}
