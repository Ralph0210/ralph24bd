"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LandingEnvelope } from "@/components/LandingEnvelope";
import { getOrCreateGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";

export function PartyStartedContent({
  onConfigError,
}: {
  onConfigError: (msg: string) => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const guestId = getOrCreateGuestId();
    if (!guestId) return;
    try {
      const supabase = createClient();
      supabase
        .from("guests")
        .select("envelope_picks_used")
        .eq("guest_id", guestId)
        .single()
        .then(({ data }) => {
          if (data) {
            const used =
              (data as { envelope_picks_used: number }).envelope_picks_used ?? 0;
            router.replace(used > 0 ? "/dashboard" : "/checkin/envelope");
          }
        });
    } catch {
      onConfigError("Supabase not configured.");
    }
  }, [router, onConfigError]);

  const handleCheckIn = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#c41e3a", "#d4af37", "#fef8f0"],
    });
    getOrCreateGuestId();
    router.push("/checkin/name");
  }, [router]);

  return (
    <>
      <button
        type="button"
        onClick={handleCheckIn}
        className="mb-6 animate-envelope-bounce animate-envelope-glow cursor-pointer touch-manipulation active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-[#c41e3a]/25 rounded-2xl"
        aria-label="Check in to get your red envelope"
      >
        <LandingEnvelope className="drop-shadow-xl" />
      </button>

      <p className="text-caption text-[#8b7355]/90 mb-6 animate-fade-in-up animate-fade-in-up-delay-1">
        Your red envelope awaits
      </p>

      <div className="w-full animate-fade-in-up animate-fade-in-up-delay-2">
        <div className="rounded-[24px] bg-white/65 backdrop-blur-xl border border-white/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <h1 className="font-display text-[1.75rem] font-bold text-[#1a0f0a] text-center mb-2 tracking-tight">
            Ralph&apos;s 24th
          </h1>
          <p className="font-display text-headline text-[#c41e3a] text-center mb-4">
            Birthday + Lunar New Year
          </p>
          <p className="text-body text-[#5c4033] text-center mb-6">
            Check in to claim your free red envelope and join the party!
          </p>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCheckIn}
            className="shadow-[0_4px_20px_rgba(196,30,58,0.3)]"
          >
            Check In
          </Button>
        </div>
      </div>
    </>
  );
}
