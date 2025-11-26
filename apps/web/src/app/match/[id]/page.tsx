"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Trophy,
  User as UserIcon,
  Wallet,
  Swords,
} from "lucide-react";
import { getEthereum } from "@/lib/web3/ethereum";
import { BrowserProvider, Contract, parseEther } from "ethers";
import { GAME_ESCROW_ABI, GAME_ESCROW_ADDRESS } from "@/lib/web3/contracts";
import ConnectFour from "@/components/games/connect-four";
import { toast } from "sonner";

interface Match {
  _id: string;
  gameType: string;
  players: {
    userId: { _id: string; username: string; avatar: string };
    status: string;
  }[];
  stakeAmount: number;
  status: string;
  onChainMatchId: number;
  winnerId?: string;
  gameState: {
    board: number[][]; // 6x7 grid
    currentPlayer: number; // 1 or 2
  };
}

export default function MatchRoomPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [betting, setBetting] = useState(false);

  // Poll for match updates
  useEffect(() => {
    if (id) fetchMatch();
    const interval = setInterval(() => {
      if (id) fetchMatch();
    }, 2000); // Poll every 2s for game state
    return () => clearInterval(interval);
  }, [id]);

  const fetchMatch = async () => {
    try {
      const res = await fetch(`/api/matches`);
      const data = await res.json();
      if (res.ok) {
        const found = data.matches.find((m: any) => m._id === id);
        if (found) setMatch(found);
      }
    } catch (error) {
      console.error("Error fetching match:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!session?.user || !match) return;
    setJoining(true);

    try {
      const ethereum = getEthereum();
      if (!ethereum) throw new Error("No wallet found");

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(
        GAME_ESCROW_ADDRESS,
        GAME_ESCROW_ABI,
        signer
      );

      // Mock contract call
      let txHash = "0xMOCK_TX_HASH_" + Date.now();
      try {
        const tx = await contract.joinMatch(match.onChainMatchId);
        await tx.wait();
        txHash = tx.hash;
      } catch (e) {
        console.warn("Contract call failed (expected):", e);
        toast.error("Contract call failed (expected)");
      }

      const res = await fetch("/api/matches/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match._id,
          userId: session.user.id,
          txHash,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Joined match!");
        fetchMatch();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setJoining(false);
    }
  };

  const handleMove = async (col: number) => {
    if (!match || !session?.user) return;

    // Optimistic update? Maybe too risky without validation.
    // Let's just call API.
    try {
      const res = await fetch(`/api/matches/${match._id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          column: col,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error);
      } else {
        fetchMatch(); // Refresh immediately
      }
    } catch (error) {
      console.error("Error making move:", error);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!match) return <div className="text-center py-20">Match not found</div>;

  const isPlayer = match.players.some(
    (p) => p.userId._id === session?.user?.id
  );
  const myPlayerIndex = match.players.findIndex(
    (p) => p.userId._id === session?.user?.id
  );
  const myPlayerId = myPlayerIndex !== -1 ? myPlayerIndex + 1 : 0; // 1 or 2, or 0 (spectator)

  const opponent = match.players[1];

  // Default empty board if not present
  const board = match.gameState?.board || Array(6).fill(Array(7).fill(0));
  const currentPlayer = match.gameState?.currentPlayer || 1;
  const winner = match.winnerId
    ? match.winnerId === match.players[0].userId._id
      ? 1
      : 2
    : null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game Board Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="min-h-[600px] flex items-center justify-center bg-secondary/10 border-2 border-dashed p-8">
            {match.status === "waiting" ? (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Waiting for Opponent
                </h2>
                <p className="text-muted-foreground mb-6">
                  Stake: {match.stakeAmount} cUSD
                </p>
                {!isPlayer && (
                  <Button
                    size="lg"
                    onClick={handleJoinMatch}
                    disabled={joining}
                    className="bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    {joining ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      <Swords className="mr-2" />
                    )}
                    Join & Pay {match.stakeAmount} cUSD
                  </Button>
                )}
                {isPlayer && (
                  <p className="text-sm text-muted-foreground mt-4">
                    You are the host. Waiting for a challenger...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center w-full">
                <div className="mb-6 flex justify-between items-center px-8">
                  <div
                    className={`text-lg font-bold ${
                      currentPlayer === 1
                        ? "text-red-500 scale-110"
                        : "text-muted-foreground"
                    } transition-all`}
                  >
                    Player 1
                  </div>
                  <div className="text-2xl font-black text-primary">VS</div>
                  <div
                    className={`text-lg font-bold ${
                      currentPlayer === 2
                        ? "text-yellow-500 scale-110"
                        : "text-muted-foreground"
                    } transition-all`}
                  >
                    Player 2
                  </div>
                </div>

                <ConnectFour
                  board={board}
                  onMove={handleMove}
                  currentPlayer={currentPlayer}
                  myPlayerId={myPlayerId}
                  winner={winner}
                />

                {winner && winner === myPlayerId && (
                  <div className="mt-8 animate-pulse">
                    <Button
                      size="lg"
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl px-8 py-6 shadow-xl"
                      onClick={() =>
                        toast(
                          "Claiming on-chain winnings is disabled in this demo."
                        )
                      }
                    >
                      <Wallet className="mr-2 h-6 w-6" />
                      Claim Winnings
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: Players & Betting */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold shadow-lg">
                    P1
                  </div>
                  <div>
                    <p className="font-bold">
                      {match.players[0].userId.username}
                    </p>
                    <p className="text-xs text-muted-foreground">Host</p>
                  </div>
                </div>
                {match.winnerId === match.players[0].userId._id && (
                  <Trophy className="text-yellow-500 animate-bounce" />
                )}
              </div>

              {opponent ? (
                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold shadow-lg">
                      P2
                    </div>
                    <div>
                      <p className="font-bold">{opponent.userId.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Challenger
                      </p>
                    </div>
                  </div>
                  {match.winnerId === opponent.userId._id && (
                    <Trophy className="text-yellow-500 animate-bounce" />
                  )}
                </div>
              ) : (
                <div className="p-3 border border-dashed rounded-lg text-center text-muted-foreground">
                  Waiting for player...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Betting Panel (Only for Spectators) */}
          {!isPlayer && match.status !== "waiting" && (
            <Card>
              <CardHeader>
                <CardTitle>Prediction Market</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Place a bet on who will win this match!
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full border-red-500/50 hover:bg-red-500/10"
                  >
                    Bet P1
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-yellow-500/50 hover:bg-yellow-500/10"
                  >
                    Bet P2
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
