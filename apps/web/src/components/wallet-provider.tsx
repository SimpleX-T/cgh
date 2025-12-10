"use client";

import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import {
  injectedWallet,
  walletConnectWallet,
  metaMaskWallet,
  phantomWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  WagmiProvider,
  createConfig,
  http,
  useConnect,
  cookieStorage,
  createStorage,
} from "wagmi";
import { celo, celoAlfajores, celoSepolia } from "wagmi/chains";
import { getEthereum } from "@/lib/web3/ethereum";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { sdk } from "@farcaster/miniapp-sdk";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        phantomWallet,
        injectedWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "cgh",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  }
);

const allConnectors = [...connectors, farcasterMiniApp()];

const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores, celoSepolia],
  connectors: allConnectors,
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
    [celoSepolia.id]: http(),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

const queryClient = new QueryClient();

function WalletProviderInner({ children }: { children: React.ReactNode }) {
  const { connect, connectors } = useConnect();

  // ...

  useEffect(() => {
    // Check if the app is running inside MiniPay
    const ethereum = getEthereum();
    if (ethereum?.isMiniPay) {
      // Find the injected connector, which is what MiniPay uses
      const injectedConnector = connectors.find((c) => c.id === "injected");
      if (injectedConnector) {
        connect({ connector: injectedConnector });
      }
    }

    // Initialize Farcaster MiniApp SDK
    const initFarcaster = async () => {
      // Initialize the SDK to hide splash screen
      await sdk.actions.ready();
    };

    initFarcaster();
  }, [connect, connectors]);

  return <>{children}</>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletProviderInner>{children}</WalletProviderInner>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
