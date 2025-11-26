"use client";

import { ConnectButton as RainbowKitConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { getEthereum } from "@/lib/web3/ethereum";

export function ConnectButton() {
  const [isMinipay, setIsMinipay] = useState(false);

  // ...

  useEffect(() => {
    const ethereum = getEthereum();
    // @ts-ignore
    if (ethereum?.isMiniPay) {
      setIsMinipay(true);
    }
  }, []);

  if (isMinipay) {
    return null;
  }

  return <RainbowKitConnectButton />;
}
