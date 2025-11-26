import {
  createWalletClient,
  custom,
  encodeFunctionData,
  parseUnits,
} from "viem";
import { celo } from "viem/chains";
import { stableTokenABI } from "@celo/abis";
import { publicClient } from "./viem";

// Wallet client creation moved inside function to avoid SSR issues

import { getEthereum } from "./web3/ethereum";

// ...

export async function payForItem(
  senderAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  amount: number,
  tokenDecimals: number,
  receiverAddress: `0x${string}`
) {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error("No crypto wallet found");
  }

  const walletClient = createWalletClient({
    chain: celo,
    transport: custom(ethereum),
  });

  const hash = await walletClient.sendTransaction({
    account: senderAddress as `0x${string}` | null, // Sender, not receiver!
    to: tokenAddress,
    data: encodeFunctionData({
      abi: stableTokenABI,
      functionName: "transfer",
      args: [receiverAddress, parseUnits(`${Number(amount)}`, tokenDecimals)],
    }),
  });

  const transaction = await publicClient.waitForTransactionReceipt({ hash });
  return transaction.status === "success";
}
