"use client";

import { useEffect, useState } from "react";
import { getTimeUntilParty, type TimeUntil } from "@/lib/party-start";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function CountdownDisplay({ t }: { t: TimeUntil }) {
  return (
    <div className="flex gap-2 sm:gap-4 justify-center">
      <div className="flex flex-col items-center min-w-16">
        <span className="font-display text-3xl sm:text-4xl font-bold tabular-nums text-[#1a0f0a]">
          {pad(t.days)}
        </span>
        <span className="text-caption text-[#8b7355] mt-0.5">days</span>
      </div>
      <div className="flex flex-col items-center min-w-16">
        <span className="font-display text-3xl sm:text-4xl font-bold tabular-nums text-[#1a0f0a]">
          {pad(t.hours)}
        </span>
        <span className="text-caption text-[#8b7355] mt-0.5">hrs</span>
      </div>
      <div className="flex flex-col items-center min-w-16">
        <span className="font-display text-3xl sm:text-4xl font-bold tabular-nums text-[#1a0f0a]">
          {pad(t.minutes)}
        </span>
        <span className="text-caption text-[#8b7355] mt-0.5">min</span>
      </div>
      <div className="flex flex-col items-center min-w-16">
        <span className="font-display text-3xl sm:text-4xl font-bold tabular-nums text-[#c41e3a]">
          {pad(t.seconds)}
        </span>
        <span className="text-caption text-[#8b7355] mt-0.5">sec</span>
      </div>
    </div>
  );
}

export function Countdown() {
  const [time, setTime] = useState(getTimeUntilParty);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeUntilParty), 1000);
    return () => clearInterval(id);
  }, []);

  return <CountdownDisplay t={time} />;
}
