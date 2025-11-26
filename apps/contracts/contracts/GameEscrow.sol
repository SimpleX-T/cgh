// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GameEscrow is Ownable, ReentrancyGuard {
    IERC20 public cUSD;

    struct Match {
        address player1;
        address player2;
        uint256 stakeAmount;
        address winner;
        bool isResolved;
        bool isCancelled;
        uint256 totalPool; // Total stake from players
    }

    struct Bet {
        address better;
        address predictedWinner;
        uint256 amount;
        bool claimed;
    }

    // matchId => Match
    mapping(uint256 => Match) public matches;
    // matchId => Bet[]
    mapping(uint256 => Bet[]) public matchBets;
    // matchId => total bets on player1
    mapping(uint256 => uint256) public totalBetsOnPlayer1;
    // matchId => total bets on player2
    mapping(uint256 => uint256) public totalBetsOnPlayer2;

    event MatchCreated(uint256 indexed matchId, address indexed player1, uint256 stakeAmount);
    event MatchJoined(uint256 indexed matchId, address indexed player2);
    event BetPlaced(uint256 indexed matchId, address indexed better, address predictedWinner, uint256 amount);
    event MatchResolved(uint256 indexed matchId, address indexed winner);
    event WinningsClaimed(uint256 indexed matchId, address indexed claimer, uint256 amount);
    event MatchCancelled(uint256 indexed matchId);

    constructor(address _cUSDAddress) Ownable(msg.sender) {
        cUSD = IERC20(_cUSDAddress);
    }

    function createMatch(uint256 matchId, uint256 stakeAmount) external {
        require(matches[matchId].player1 == address(0), "Match already exists");

        require(cUSD.transferFrom(msg.sender, address(this), stakeAmount), "Transfer failed");

        matches[matchId] = Match({
            player1: msg.sender,
            player2: address(0),
            stakeAmount: stakeAmount,
            winner: address(0),
            isResolved: false,
            isCancelled: false,
            totalPool: stakeAmount
        });

        emit MatchCreated(matchId, msg.sender, stakeAmount);
    }

    function joinMatch(uint256 matchId) external {
        Match storage game = matches[matchId];
        require(game.player1 != address(0), "Match does not exist");
        require(game.player2 == address(0), "Match full");
        require(msg.sender != game.player1, "Cannot play against self");
        require(!game.isCancelled, "Match cancelled");

        require(cUSD.transferFrom(msg.sender, address(this), game.stakeAmount), "Transfer failed");

        game.player2 = msg.sender;
        game.totalPool += game.stakeAmount;

        emit MatchJoined(matchId, msg.sender);
    }

    function placeBet(uint256 matchId, address predictedWinner, uint256 amount) external {
        Match storage game = matches[matchId];
        require(game.player1 != address(0), "Match does not exist");
        require(!game.isResolved, "Match already resolved");
        require(!game.isCancelled, "Match cancelled");
        require(predictedWinner == game.player1 || predictedWinner == game.player2, "Invalid predicted winner");
        require(amount > 0, "Bet amount must be > 0");

        require(cUSD.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        matchBets[matchId].push(Bet({
            better: msg.sender,
            predictedWinner: predictedWinner,
            amount: amount,
            claimed: false
        }));

        if (predictedWinner == game.player1) {
            totalBetsOnPlayer1[matchId] += amount;
        } else {
            totalBetsOnPlayer2[matchId] += amount;
        }

        emit BetPlaced(matchId, msg.sender, predictedWinner, amount);
    }

    function resolveMatch(uint256 matchId, address winner) external onlyOwner {
        Match storage game = matches[matchId];
        require(!game.isResolved, "Already resolved");
        require(!game.isCancelled, "Match cancelled");
        require(winner == game.player1 || winner == game.player2, "Invalid winner");

        game.winner = winner;
        game.isResolved = true;

        emit MatchResolved(matchId, winner);
    }

    function claimWinnings(uint256 matchId) external nonReentrant {
        Match storage game = matches[matchId];
        require(game.isResolved, "Match not resolved");

        uint256 payout = 0;

        // 1. Player Payout
        if (msg.sender == game.winner) {
            // Winner gets the entire pool (minus any fees if we wanted to add them)
            // For now, winner takes all stakes.
            // Check if already claimed? We need a way to track player claims too.
            // Actually, let's just transfer immediately for players?
            // No, pull payment is better.
            // Let's use a mapping for claims to be safe.
        }

        // Refactoring for simpler claim logic:
        // We iterate bets? No, that's gas heavy.
        // Users claim individually.

        // Check if user is the winner player
        if (msg.sender == game.winner && game.totalPool > 0) {
             payout += game.totalPool;
             game.totalPool = 0; // Prevent double claim
        }

        // Check bets
        Bet[] storage bets = matchBets[matchId];
        for (uint256 i = 0; i < bets.length; i++) {
            if (bets[i].better == msg.sender && !bets[i].claimed) {
                if (bets[i].predictedWinner == game.winner) {
                    // Calculate share
                    // Total pot for this side = totalBetsOnWinner
                    // Share = (MyBet / TotalBetsOnWinner) * TotalLosingBets
                    // Plus return original bet?
                    // Standard betting: You get your stake back + profit.
                    // Profit comes from the losing side.

                    uint256 totalWinningBets = (game.winner == game.player1) ? totalBetsOnPlayer1[matchId] : totalBetsOnPlayer2[matchId];
                    uint256 totalLosingBets = (game.winner == game.player1) ? totalBetsOnPlayer2[matchId] : totalBetsOnPlayer1[matchId];

                    if (totalWinningBets > 0) {
                        uint256 profit = (bets[i].amount * totalLosingBets) / totalWinningBets;
                        payout += bets[i].amount + profit;
                    } else {
                        // Should not happen if we are here
                        payout += bets[i].amount;
                    }
                }
                bets[i].claimed = true;
            }
        }

        require(payout > 0, "No winnings to claim");
        require(cUSD.transfer(msg.sender, payout), "Transfer failed");

        emit WinningsClaimed(matchId, msg.sender, payout);
    }

    // Admin can cancel match if something goes wrong (e.g. timeout)
    function cancelMatch(uint256 matchId) external onlyOwner {
        Match storage game = matches[matchId];
        require(!game.isResolved, "Already resolved");
        require(!game.isCancelled, "Already cancelled");

        game.isCancelled = true;
        emit MatchCancelled(matchId);
    }

    // Users withdraw their funds if match is cancelled
    function withdrawRefund(uint256 matchId) external nonReentrant {
        Match storage game = matches[matchId];
        require(game.isCancelled, "Match not cancelled");

        uint256 refund = 0;

        // Refund Player
        if (msg.sender == game.player1 && game.totalPool >= game.stakeAmount) {
             refund += game.stakeAmount;
             game.totalPool -= game.stakeAmount; // Deduct to prevent double claim
        }
        if (msg.sender == game.player2 && game.totalPool >= game.stakeAmount) {
             refund += game.stakeAmount;
             game.totalPool -= game.stakeAmount;
        }

        // Refund Bets
        Bet[] storage bets = matchBets[matchId];
        for (uint256 i = 0; i < bets.length; i++) {
            if (bets[i].better == msg.sender && !bets[i].claimed) {
                refund += bets[i].amount;
                bets[i].claimed = true;
            }
        }

        require(refund > 0, "No refund available");
        require(cUSD.transfer(msg.sender, refund), "Transfer failed");
    }
}
