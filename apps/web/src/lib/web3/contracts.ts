export const GAME_ESCROW_ADDRESS = "0x1234567890123456789012345678901234567890"; // Placeholder

export const GAME_ESCROW_ABI = [
  "function createMatch(uint256 matchId, uint256 stakeAmount) external",
  "function joinMatch(uint256 matchId) external",
  "function placeBet(uint256 matchId, address predictedWinner, uint256 amount) external",
  "function resolveMatch(uint256 matchId, address winner) external",
  "function claimWinnings(uint256 matchId) external",
  "function cancelMatch(uint256 matchId) external",
  "function withdrawRefund(uint256 matchId) external",
  "event MatchCreated(uint256 indexed matchId, address indexed player1, uint256 stakeAmount)",
  "event MatchJoined(uint256 indexed matchId, address indexed player2)",
  "event BetPlaced(uint256 indexed matchId, address indexed better, address predictedWinner, uint256 amount)",
  "event MatchResolved(uint256 indexed matchId, address indexed winner)",
  "event WinningsClaimed(uint256 indexed matchId, address indexed claimer, uint256 amount)",
];
