"use client";

import { useEffect, useState, useRef } from "react";

const ANIMATION_MS = 520;

interface AnimatedCounterProps {
  value: number;
  className?: string;
  /** Optional delay before clearing prev (for rapid updates) */
  duration?: number;
}

export function AnimatedCounter({
  value,
  className = "",
  duration = ANIMATION_MS,
}: AnimatedCounterProps) {
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== displayValue) {
      setPrevValue(displayValue);
      setDisplayValue(value);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setPrevValue(null);
        timeoutRef.current = null;
      }, duration);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const isTransitioning = prevValue !== null;

  return (
    <div className={`relative h-12 overflow-hidden ${className}`}>
      {prevValue !== null && (
        <span
          className="absolute inset-0 flex items-center justify-center animate-drink-counter-out"
          aria-hidden
        >
          {prevValue}
        </span>
      )}
      <span
        className={`absolute inset-0 flex items-center justify-center ${
          isTransitioning ? "animate-drink-counter-in" : ""
        }`}
      >
        {displayValue}
      </span>
    </div>
  );
}
