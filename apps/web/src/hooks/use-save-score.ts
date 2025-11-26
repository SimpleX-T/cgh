import { useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { toast } from "sonner";

export function useSaveScore() {
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({
      gameId,
      score,
    }: {
      gameId: string;
      score: number;
    }) => {
      if (!address) return;

      const res = await fetch("/api/games/save-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          gameId,
          score,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save score");
      }

      return res.json();
    },
    onSuccess: (data) => {
      if (data?.highScore) {
        // Optional: Toast if new high score
        // toast.success(`New High Score: ${data.highScore}!`);
      }
    },
    onError: (error) => {
      console.error("Error saving score:", error);
    },
  });
}
