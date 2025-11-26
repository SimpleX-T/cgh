"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string;
  score: number | string;
  isCurrency?: boolean;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameId, setGameId] = useState("global");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?gameId=${gameId}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries || []);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [gameId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Leaderboard
        </h1>

        <Tabs
          defaultValue="global"
          className="w-full max-w-3xl mx-auto"
          onValueChange={setGameId}
        >
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-8 h-auto gap-2">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="tetris">Tetris</TabsTrigger>
            <TabsTrigger value="snake">Snake</TabsTrigger>
            <TabsTrigger value="2048">2048</TabsTrigger>
            <TabsTrigger value="f1-racing">F1</TabsTrigger>
            <TabsTrigger value="breakout">Breakout</TabsTrigger>
          </TabsList>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle>
                {gameId === "global" ? "Top Spenders" : "Top Players"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No records found.
                </div>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="font-mono text-xl font-bold text-muted-foreground w-8">
                          #{index + 1}
                        </div>
                        <Avatar>
                          <AvatarImage src={entry.avatar} />
                          <AvatarFallback>{entry.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="font-semibold">{entry.username}</div>
                      </div>
                      <div className="font-mono font-bold text-primary">
                        {entry.score}
                        {entry.isCurrency && " cUSD"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}
