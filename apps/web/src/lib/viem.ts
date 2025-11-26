import { createPublicClient, http } from "viem";
import { celoSepolia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: celoSepolia,
  transport: http(),
});

// Wallet client should be obtained via hooks (useWalletClient) or created safely on client-side
// const [address] = await window.ethereum.request({
//   method: "eth_requestAccounts",
// });

// export const walletClient = createWalletClient({
//   chain: celoSepolia,
//   transport: custom(window.ethereum),
//   account: address,
// });
