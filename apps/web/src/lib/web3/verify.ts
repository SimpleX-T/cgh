import { formatEther, parseAbiItem, decodeEventLog } from "viem";
import { publicClient } from "./client";
import { RECEIVER_ADDRESS, TOKEN_ADDRESSES } from "../constants";

export async function verifyTransaction(
  txHash: string,
  expectedAmount: number,
  senderAddress?: string
): Promise<{ success: boolean; error?: string; from?: string }> {
  try {
    // 1. Get transaction receipt to check status
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (receipt.status !== "success") {
      return { success: false, error: "Transaction failed on-chain" };
    }

    // 2. Check for Transfer event logs
    // We need to find the Transfer event emitted by the cUSD contract
    // Event signature: Transfer(address indexed from, address indexed to, uint256 value)

    const transferEventAbi = parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    );

    let foundTransfer = false;
    let transferValue = 0;
    let transferFrom = "";
    let transferTo = "";

    for (const log of receipt.logs) {
      // Check if log is from cUSD contract
      if (log.address.toLowerCase() !== TOKEN_ADDRESSES.cUSD.toLowerCase()) {
        continue;
      }

      try {
        const decodedLog = decodeEventLog({
          abi: [transferEventAbi],
          data: log.data,
          topics: log.topics,
        });

        if (decodedLog.eventName === "Transfer") {
          transferFrom = decodedLog.args.from;
          transferTo = decodedLog.args.to;
          transferValue = Number(formatEther(decodedLog.args.value));

          // Check if this transfer is to our treasury
          if (transferTo.toLowerCase() === RECEIVER_ADDRESS.toLowerCase()) {
            foundTransfer = true;
            break; // Found the relevant transfer
          }
        }
      } catch (e) {
        // Not a transfer event or decode failed, continue
        continue;
      }
    }

    if (!foundTransfer) {
      return {
        success: false,
        error: "No valid cUSD transfer to treasury found in transaction",
      };
    }

    // Check sender if provided
    if (
      senderAddress &&
      transferFrom.toLowerCase() !== senderAddress.toLowerCase()
    ) {
      return { success: false, error: "Transaction sender mismatch" };
    }

    // Check amount
    // Allow small margin for float comparison if needed, but cUSD has 18 decimals
    if (transferValue < expectedAmount) {
      return {
        success: false,
        error: `Insufficient amount: sent ${transferValue}, expected ${expectedAmount}`,
      };
    }

    return { success: true, from: transferFrom };
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return { success: false, error: error.message || "Verification error" };
  }
}
