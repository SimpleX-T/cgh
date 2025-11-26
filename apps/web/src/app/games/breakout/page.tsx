"use client";

import { useState, useEffect, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { GamePowerups, type PowerupType } from "@/components/game-powerups";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/use-user-profile";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_HEIGHT = 30;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 35;

// Mutable Constants (can be changed by powerups)
const DEFAULT_PADDLE_WIDTH = 100;

type Ball = { x: number; y: number; dx: number; dy: number };
type Brick = { x: number; y: number; status: number; color: string };

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

export default function Breakout() {
  const { consumeLife } = useUserProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);

  // Game State Refs
  const paddleXRef = useRef(CANVAS_WIDTH / 2 - DEFAULT_PADDLE_WIDTH / 2);
  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 30,
    dx: 4,
    dy: -4,
  });
  const bricksRef = useRef<Brick[]>([]);
  const animationRef = useRef<number>(0);

  // Powerup State Refs
  const paddleWidthRef = useRef(DEFAULT_PADDLE_WIDTH);
  const isPenetratingRef = useRef(false);
  const timeScaleRef = useRef(1);
  const showTrajectoryRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("breakout-highscore");
    if (saved) setHighScore(Number.parseInt(saved));
    initBricks();
    draw(); // Initial draw

    // Touch/Mouse handlers
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const relativeX = clientX - rect.left;
      const scaleX = CANVAS_WIDTH / rect.width;

      let newPaddleX = relativeX * scaleX - paddleWidthRef.current / 2;
      newPaddleX = Math.max(
        0,
        Math.min(CANVAS_WIDTH - paddleWidthRef.current, newPaddleX)
      );
      paddleXRef.current = newPaddleX;

      if (!isPlaying) {
        // Redraw if not playing so paddle moves
        draw();
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: false });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying]);

  const initBricks = () => {
    const bricks: Brick[] = [];
    const brickWidth =
      (CANVAS_WIDTH -
        2 * BRICK_OFFSET_LEFT -
        (BRICK_COLS - 1) * BRICK_PADDING) /
      BRICK_COLS;

    for (let c = 0; c < BRICK_COLS; c++) {
      for (let r = 0; r < BRICK_ROWS; r++) {
        const brickX = c * (brickWidth + BRICK_PADDING) + BRICK_OFFSET_LEFT;
        const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
        bricks.push({ x: brickX, y: brickY, status: 1, color: COLORS[r] });
      }
    }
    bricksRef.current = bricks;
  };

  const handlePowerup = (type: PowerupType) => {
    if (!isPlaying) {
      toast.error("Start the game first!");
      return;
    }

    switch (type) {
      case "xray":
        isPenetratingRef.current = true;
        toast.success("X-Ray: Ball smashes through bricks!");
        setTimeout(() => {
          isPenetratingRef.current = false;
          toast.info("X-Ray Expired");
        }, 5000);
        break;
      case "timefreeze":
        timeScaleRef.current = 0.5;
        toast.success("Time Freeze: Slow Ball!");
        setTimeout(() => {
          timeScaleRef.current = 1;
          toast.info("Time Freeze Expired");
        }, 10000);
        break;
      case "lucky":
        paddleWidthRef.current = DEFAULT_PADDLE_WIDTH * 1.5;
        toast.success("Lucky: Giant Paddle!");
        setTimeout(() => {
          paddleWidthRef.current = DEFAULT_PADDLE_WIDTH;
          toast.info("Lucky Expired");
        }, 10000);
        break;
      case "sonar":
        showTrajectoryRef.current = true;
        toast.success("Sonar: Trajectory Visible!");
        setTimeout(() => {
          showTrajectoryRef.current = false;
          toast.info("Sonar Expired");
        }, 10000);
        break;
    }
  };

  const update = () => {
    if (!canvasRef.current) return;

    // Move ball
    const ball = ballRef.current;
    const scale = timeScaleRef.current;

    ball.x += ball.dx * scale;
    ball.y += ball.dy * scale;

    // Wall collisions
    if (
      ball.x + ball.dx > CANVAS_WIDTH - BALL_RADIUS ||
      ball.x + ball.dx < BALL_RADIUS
    ) {
      ball.dx = -ball.dx;
    }
    if (ball.y + ball.dy < BALL_RADIUS) {
      ball.dy = -ball.dy;
    } else if (ball.y + ball.dy > CANVAS_HEIGHT - BALL_RADIUS) {
      if (
        ball.x > paddleXRef.current &&
        ball.x < paddleXRef.current + paddleWidthRef.current
      ) {
        ball.dy = -Math.abs(ball.dy); // Ensure it goes up
        // Add spin based on where it hit the paddle
        const hitPoint =
          ball.x - (paddleXRef.current + paddleWidthRef.current / 2);
        ball.dx = hitPoint * 0.15;
      } else {
        setLives((l) => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setIsPlaying(false);
            consumeLife(); // Consume heart on game over
            if (score > highScore) {
              setHighScore(score);
              localStorage.setItem("breakout-highscore", score.toString());
            }
          } else {
            resetBall();
          }
          return newLives;
        });
        return; // Stop this frame
      }
    }

    // Brick collisions
    const brickWidth =
      (CANVAS_WIDTH -
        2 * BRICK_OFFSET_LEFT -
        (BRICK_COLS - 1) * BRICK_PADDING) /
      BRICK_COLS;
    bricksRef.current.forEach((brick) => {
      if (brick.status === 1) {
        if (
          ball.x > brick.x &&
          ball.x < brick.x + brickWidth &&
          ball.y > brick.y &&
          ball.y < brick.y + BRICK_HEIGHT
        ) {
          if (!isPenetratingRef.current) {
            ball.dy = -ball.dy;
          }
          brick.status = 0;
          setScore((s) => s + 10);
        }
      }
    });

    if (bricksRef.current.every((b) => b.status === 0)) {
      setIsPlaying(false);
      toast.success("You Win!");
      // Win condition logic here
    }

    draw();
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(update);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ball
    ctx.beginPath();
    ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isPenetratingRef.current ? "#a855f7" : "#ffffff"; // Purple if penetrating
    ctx.fill();
    ctx.closePath();

    // Paddle
    ctx.beginPath();
    ctx.rect(
      paddleXRef.current,
      CANVAS_HEIGHT - PADDLE_HEIGHT,
      paddleWidthRef.current,
      PADDLE_HEIGHT
    );
    ctx.fillStyle = "#3b82f6";
    ctx.fill();
    ctx.closePath();

    // Bricks
    const brickWidth =
      (CANVAS_WIDTH -
        2 * BRICK_OFFSET_LEFT -
        (BRICK_COLS - 1) * BRICK_PADDING) /
      BRICK_COLS;
    bricksRef.current.forEach((brick) => {
      if (brick.status === 1) {
        ctx.beginPath();
        ctx.rect(brick.x, brick.y, brickWidth, BRICK_HEIGHT);
        ctx.fillStyle = brick.color;
        ctx.fill();
        ctx.closePath();
      }
    });

    // Sonar Trajectory
    if (showTrajectoryRef.current) {
      ctx.beginPath();
      ctx.moveTo(ballRef.current.x, ballRef.current.y);
      ctx.lineTo(
        ballRef.current.x + ballRef.current.dx * 20,
        ballRef.current.y + ballRef.current.dy * 20
      );
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.closePath();
    }
  };

  const resetBall = () => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 30,
      dx: 4,
      dy: -4,
    };
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    initBricks();
    resetBall();
    paddleWidthRef.current = DEFAULT_PADDLE_WIDTH;
    isPenetratingRef.current = false;
    timeScaleRef.current = 1;
    showTrajectoryRef.current = false;
    setIsPlaying(false);
    draw();
  };

  return (
    <GameWrapper
      title="Breakout"
      score={score}
      bestScore={highScore}
      onReset={resetGame}
      accentColor="text-yellow-500"
      stats={[{ label: "Lives", value: lives }]}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative rounded-lg overflow-hidden shadow-2xl border-4 border-slate-700 bg-slate-900">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full max-w-[800px] h-auto touch-none cursor-none"
          />

          {!isPlaying && lives > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <Button
                onClick={() => setIsPlaying(true)}
                size="lg"
                className="text-xl px-8 py-6"
              >
                <Play className="mr-2 h-6 w-6" /> Start Game
              </Button>
            </div>
          )}

          {lives <= 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <h2 className="text-4xl font-bold text-red-500 mb-4">
                Game Over
              </h2>
              <p className="text-2xl text-white mb-8">Score: {score}</p>
              <Button
                onClick={resetGame}
                size="lg"
                className="text-xl px-8 py-6"
              >
                <RotateCcw className="mr-2 h-6 w-6" /> Try Again
              </Button>
            </div>
          )}
        </div>

        <GamePowerups onUsePowerup={handlePowerup} disabled={!isPlaying} />

        <p className="text-sm text-muted-foreground">
          Move your mouse or drag to control the paddle
        </p>
      </div>
    </GameWrapper>
  );
}
