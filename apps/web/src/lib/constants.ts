import { parseAbi } from "viem";

export const TOKEN_ADDRESSES: Record<
  string,
  { testnet: `0x${string}`; mainnet: `0x${string}` }
> = {
  // cUSD: "0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80",
  cUSD: {
    testnet: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b",
    mainnet: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  },
  USDC: {
    testnet: "0x",
    mainnet: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  },
  USDT: {
    testnet: "0x",
    mainnet: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
  },
};

export const RECEIVER_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_RECEIVER_ADDRESS as `0x${string}`) ||
  "0xce76b1efab180c551ac07b38809e9e1033bfaff1"; // Replace with your wallet address

export const USE_TESTNET = process.env.NEXT_PUBLIC_CELO_NETWORK !== "mainnet";

// Celo Mainnet cUSD
export const MAINNET_CUSD_ADDRESS = TOKEN_ADDRESSES.cUSD.mainnet;
// Sepolia Testnet cUSD
export const TESTNET_CUSD_ADDRESS = TOKEN_ADDRESSES.cUSD.testnet;

export const CURRENT_CUSD_ADDRESS = USE_TESTNET
  ? TESTNET_CUSD_ADDRESS
  : MAINNET_CUSD_ADDRESS;

// ABIs
export const STABLE_TOKEN_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferWithComment(address to, uint256 value, string comment) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
