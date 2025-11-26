import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  RotateCcw,
  SettingsIcon,
  HelpCircle,
  Heart,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/use-user-profile";
import { StoreModal } from "@/components/store-modal";

interface GameWrapperProps {
  children: ReactNode;
  title: string;
  score?: number;
  bestScore?: number;
  onReset?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  accentColor?: string;
  stats?: { label: string; value: string | number }[];
}

export function GameWrapper({
  children,
  title,
  score,
  bestScore,
  onReset,
  onSettings,
  onHelp,
  accentColor = "text-primary",
  stats = [],
}: GameWrapperProps) {
  const router = useRouter();
  const { profile } = useUserProfile();
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  const hasLives = profile ? profile.heartsBalance > 0 : true; // Default to true while loading

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Game Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="hover:bg-accent"
            >
              <Home className="w-5 h-5" />
            </Button>
            <h1 className={cn("text-xl font-bold", accentColor)}>{title}</h1>
          </div>

          <div className="flex items-center space-x-2">
            {profile && (
              <div className="flex items-center space-x-1 bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50 mr-2">
                <Heart
                  className={cn(
                    "w-4 h-4",
                    profile.heartsBalance > 0
                      ? "text-red-500 fill-red-500"
                      : "text-muted-foreground"
                  )}
                />
                <span className="font-bold text-sm">
                  {profile.heartsBalance}
                </span>
              </div>
            )}

            {onHelp && (
              <Button variant="ghost" size="icon" onClick={onHelp}>
                <HelpCircle className="w-5 h-5" />
              </Button>
            )}
            {onSettings && (
              <Button variant="ghost" size="icon" onClick={onSettings}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
            )}
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="gap-2 bg-transparent"
                disabled={!hasLives}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">New Game</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {(score !== undefined || bestScore !== undefined || stats.length > 0) && (
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {score !== undefined && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Score</p>
                  <p className="text-lg font-bold">{score}</p>
                </div>
              )}
              {bestScore !== undefined && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Best</p>
                  <p className="text-lg font-bold text-yellow-500">
                    {bestScore}
                  </p>
                </div>
              )}
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Content */}
      <main className="flex-1 container mx-auto px-4 py-8 relative">
        {children}

        {/* Out of Lives Overlay */}
        {!hasLives && (
          <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card border p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-10 h-10 text-red-500" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Out of Lives!</h2>
                <p className="text-muted-foreground">
                  You need hearts to play. Wait for a refill or buy more in the
                  store.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={() => setIsStoreOpen(true)}
                  className="w-full gap-2"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  Buy Lives
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>

              {profile?.heartRefill.nextFreeRefillAt && (
                <p className="text-xs text-muted-foreground">
                  Next free refill:{" "}
                  {new Date(
                    profile.heartRefill.nextFreeRefillAt
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
    </div>
  );
}
