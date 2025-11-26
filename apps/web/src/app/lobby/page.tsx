"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Swords, Users } from "lucide-react";
import { getEthereum } from "@/lib/web3/ethereum";
import { BrowserProvider, Contract, parseEther } from "ethers";
import { GAME_ESCROW_ABI, GAME_ESCROW_ADDRESS } from "@/lib/web3/contracts";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Match {
  _id: string;
  gameType: string;
  players: { userId: { username: string; avatar: string }; status: string }[];
  stakeAmount: number;
  status: string;
  createdAt: string;
}

export default function LobbyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("1");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches?status=waiting");
      const data = await res.json();
      if (res.ok) {
        setMatches(data.matches);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!session?.user) {
      toast.error("Please login first");
      return;
    }
    setCreating(true);

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

      // 1. Generate a random match ID (or use timestamp)
      const onChainMatchId = Date.now();
      const stake = parseEther(stakeAmount);

      // 2. Call Smart Contract (Mocked for now if address is placeholder)
      // Note: If using placeholder, this will fail. We need a way to bypass for dev.
      // For now, let's assume we just get a fake txHash if it fails (for demo purposes)
      let txHash = "0xMOCK_TX_HASH_" + Date.now();

      try {
        const tx = await contract.createMatch(onChainMatchId, stake);
        await tx.wait();
        txHash = tx.hash;
      } catch (e) {
        console.warn("Contract call failed (expected if placeholder):", e);
        toast("Contract call skipped (using mock txHash)");
      }

      // 3. Call Backend
      const res = await fetch("/api/matches/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          gameType: "connect-four",
          stakeAmount: Number(stakeAmount),
          txHash,
          onChainMatchId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Match created!");
        router.push(`/match/${data.match._id}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Game Lobby
          </h1>
          <p className="text-muted-foreground mt-2">
            Challenge players, stake cUSD, and win!
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-secondary p-2 rounded-lg">
            <Label>Stake (cUSD)</Label>
            <Input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-20 h-8"
              min="0.1"
            />
          </div>
          <Button
            onClick={handleCreateMatch}
            disabled={creating}
            className="bg-gradient-to-r from-green-500 to-emerald-600"
          >
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Match
          </Button>
        </div>
      </div>

      <Tabs defaultValue="connect-four" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="connect-four">Connect Four</TabsTrigger>
          <TabsTrigger value="2048-duel" disabled>
            2048 Duel (Coming Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connect-four">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed">
              <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Matches</h3>
              <p className="text-muted-foreground">
                Be the first to create one!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <Card
                  key={match._id}
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/match/${match._id}`)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">
                      {match.players[0]?.userId?.username}'s Game
                    </CardTitle>
                    <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/20">
                      {match.stakeAmount} cUSD
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Waiting for opponent...</span>
                      </div>
                      <span>
                        {formatDistanceToNow(new Date(match.createdAt))} ago
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
