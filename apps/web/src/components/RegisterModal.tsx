"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "wagmi";

export function RegisterModal() {
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkRegistration = async () => {
      if (!address) return;

      // Check if user exists in our DB (we can use a separate check endpoint or just try to fetch profile)
      // For now, let's assume we need a dedicated "check-user" or just try to register/login.
      // But we don't want to prompt if already registered.
      // We can add a simple GET /api/user/check?address=... endpoint or use the profile endpoint.
      // Let's assume we use the profile endpoint (which I haven't created yet, but I planned it).
      // I'll create /api/user/profile/route.ts later.
      // For now, I'll implement the check here assuming the endpoint exists or I'll create it.

      try {
        const res = await fetch(`/api/user/profile?address=${address}`);
        if (res.status === 404) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Error checking registration:", error);
      }
    };

    if (address) {
      checkRegistration();
    }
  }, [address]);

  const handleRegister = async () => {
    if (!address || !username) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, username }),
      });

      if (res.ok) {
        setIsOpen(false);
        // Trigger a refresh of user data or context if needed
        window.location.reload(); // Simple reload to fetch fresh data
      } else {
        const data = await res.json();
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to GameHub!</DialogTitle>
          <DialogDescription>
            Please choose a username to create your account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleRegister} disabled={isLoading || !username}>
            {isLoading ? "Creating..." : "Create Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
