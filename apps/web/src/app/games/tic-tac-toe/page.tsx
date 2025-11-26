"use client";

import { useState, useEffect } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { XIcon, Circle } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";

type Player = "X" | "O" | null;
type Board = Player[];
type Difficulty = "easy" | "medium" | "hard";

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Columns
  [0, 4, 8],
  [2, 4, 6], // Diagonals
];

export default function TicTacToe() {
  const { consumeLife } = useUserProfile();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });

  useEffect(() => {
    const saved = localStorage.getItem("ttt-scores");
    if (saved) setScores(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(() => makeAIMove(), 500);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner]);

  useEffect(() => {
    checkWinner();
  }, [board]);

  const checkWinner = () => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinner(board[a]);
        setWinningLine(combo);
        updateScores(board[a] as Player);
        if (board[a] === "O") consumeLife();
        return;
      }
    }
    if (board.every((cell) => cell !== null)) {
      setWinner("draw");
      updateScores("draw");
    }
  };

  const updateScores = (result: Player | "draw") => {
    const newScores = { ...scores };
    if (result === "X") newScores.player++;
    else if (result === "O") newScores.ai++;
    else newScores.draws++;
    setScores(newScores);
    localStorage.setItem("ttt-scores", JSON.stringify(newScores));
  };

  const makeMove = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;
    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsPlayerTurn(false);
  };

  const makeAIMove = () => {
    const newBoard = [...board];
    const move = getBestMove(newBoard, difficulty);
    if (move !== -1) {
      newBoard[move] = "O";
      setBoard(newBoard);
    }
    setIsPlayerTurn(true);
  };

  const getBestMove = (board: Board, difficulty: Difficulty): number => {
    const emptyCells = board
      .map((cell, idx) => (cell === null ? idx : null))
      .filter((x) => x !== null) as number[];

    if (difficulty === "easy") {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    if (difficulty === "medium") {
      // Check for winning move
      for (const cell of emptyCells) {
        const testBoard = [...board];
        testBoard[cell] = "O";
        if (checkWinnerForBoard(testBoard) === "O") return cell;
      }
      // Block player winning move
      for (const cell of emptyCells) {
        const testBoard = [...board];
        testBoard[cell] = "X";
        if (checkWinnerForBoard(testBoard) === "X") return cell;
      }
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // Hard: Minimax algorithm
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestMove = -1;

    for (const cell of emptyCells) {
      const testBoard = [...board];
      testBoard[cell] = "O";
      const score = minimax(testBoard, 0, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = cell;
      }
    }

    return bestMove;
  };

  const minimax = (
    board: Board,
    depth: number,
    isMaximizing: boolean
  ): number => {
    const result = checkWinnerForBoard(board);
    if (result === "O") return 10 - depth;
    if (result === "X") return depth - 10;
    if (board.every((cell) => cell !== null)) return 0;

    if (isMaximizing) {
      let bestScore = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = "O";
          const score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Number.POSITIVE_INFINITY;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = "X";
          const score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const checkWinnerForBoard = (board: Board): Player | null => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setWinningLine([]);
  };

  return (
    <GameWrapper
      title="Tic-Tac-Toe"
      onReset={resetGame}
      accentColor="text-cyan-500"
      stats={[
        { label: "Wins", value: scores.player },
        { label: "Losses", value: scores.ai },
        { label: "Draws", value: scores.draws },
      ]}
    >
      <div className="flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto">
        {/* Difficulty Selector */}
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
            <Button
              key={diff}
              variant={difficulty === diff ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDifficulty(diff);
                resetGame();
              }}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </Button>
          ))}
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md aspect-square">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => makeMove(index)}
              disabled={!!cell || !!winner || !isPlayerTurn}
              className={cn(
                "aspect-square rounded-xl border-2 flex items-center justify-center transition-all",
                "hover:bg-accent hover:scale-105 active:scale-95 disabled:hover:scale-100",
                "bg-card border-border",
                winningLine.includes(index) &&
                  "bg-green-500/20 border-green-500",
                !cell && !winner && isPlayerTurn && "cursor-pointer"
              )}
            >
              {cell === "X" && (
                <XIcon className="w-12 h-12 text-cyan-500" strokeWidth={3} />
              )}
              {cell === "O" && (
                <Circle className="w-12 h-12 text-pink-500" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>

        {/* Game Status */}
        <div className="text-center space-y-2">
          {winner ? (
            <div className="space-y-4">
              <p className="text-2xl font-bold">
                {winner === "draw"
                  ? "It's a Draw!"
                  : winner === "X"
                  ? "You Win!"
                  : "AI Wins!"}
              </p>
              <Button onClick={resetGame} size="lg">
                Play Again
              </Button>
            </div>
          ) : (
            <p className="text-lg text-muted-foreground">
              {isPlayerTurn ? "Your Turn (X)" : "AI Thinking... (O)"}
            </p>
          )}
        </div>
      </div>
    </GameWrapper>
  );
}
