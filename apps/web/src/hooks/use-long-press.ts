import { useCallback, useRef, useState } from "react";

export function useLongPress(
  callback: () => void,
  ms: number = 100,
  initialDelay: number = 300
) {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (isPressing) return;
    setIsPressing(true);
    callback(); // Trigger immediately

    // Initial delay before repeating
    initialTimerRef.current = setTimeout(() => {
      timerRef.current = setInterval(callback, ms);
    }, initialDelay);
  }, [callback, ms, initialDelay, isPressing]);

  const stop = useCallback(() => {
    setIsPressing(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (initialTimerRef.current) clearTimeout(initialTimerRef.current);
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}
