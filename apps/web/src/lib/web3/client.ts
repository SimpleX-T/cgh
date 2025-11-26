import { createPublicClient, http, createWalletClient, custom } from "viem";
import { celo, celoSepolia } from "viem/chains";

const network =
  process.env.NEXT_PUBLIC_CELO_NETWORK === "mainnet" ? celo : celoSepolia;
const rpcUrl =
  process.env.NEXT_PUBLIC_CELO_NETWORK === "mainnet" //https://forno.celo-sepolia.celo-testnet.org
    ? "https://forno.celo.org"
    : process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
      "https://forno.celo-sepolia.celo-testnet.org";

export const publicClient = createPublicClient({
  chain: network,
  transport: http(rpcUrl, {
    timeout: 60_000,
  }),
});

export const PLATFORM_WALLET_ADDRESS = process.env
  .NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS as `0x${string}`;

import { getEthereum } from "./ethereum";

export const walletClient =
  typeof window !== "undefined" && getEthereum()
    ? createWalletClient({
        chain: network,
        transport: custom(getEthereum()),
      })
    : null;
