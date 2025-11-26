import { createWalletClient, custom, parseEther } from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { PLATFORM_WALLET_ADDRESS } from "./client";

const network =
  process.env.NEXT_PUBLIC_CELO_NETWORK === "mainnet" ? celo : celoAlfajores;

declare global {
  interface Window {
    ethereum?: any;
  }
}

import { getEthereum } from "./ethereum";

export const getWalletClient = () => {
  const ethereum = getEthereum();
  if (ethereum) {
    return createWalletClient({
      chain: network,
      transport: custom(ethereum),
    });
  }
  return null;
};

export const connectWallet = async () => {
  const client = getWalletClient();
  if (!client)
    throw new Error(
      "No crypto wallet found. Please open in MiniPay or install a wallet."
    );

  const [address] = await client.requestAddresses();
  return address;
};

export const isMiniPay = () => {
  const ethereum = getEthereum();
  return ethereum?.isMiniPay === true;
};

export const sendPayment = async (amountCELO: string) => {
  const client = getWalletClient();
  if (!client) throw new Error("No crypto wallet found");

  const [address] = await client.requestAddresses();

  const hash = await client.sendTransaction({
    account: address,
    to: PLATFORM_WALLET_ADDRESS,
    value: parseEther(amountCELO),
    chain: network,
  });

  return hash;
};
