import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CUSD_ALFAJORES = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

const GameEscrowModule = buildModule("GameEscrowModule", (m) => {
  const cUSDAddress = m.getParameter("cUSDAddress", CUSD_ALFAJORES);

  const gameEscrow = m.contract("GameEscrow", [cUSDAddress]);

  return { gameEscrow };
});

export default GameEscrowModule;
