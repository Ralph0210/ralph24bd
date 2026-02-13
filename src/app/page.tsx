"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getOrCreateGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const guestId = getOrCreateGuestId();
    if (!guestId) return;
    const supabase = createClient();
    supabase
      .from("guests")
      .select("envelope_picks_used")
      .eq("guest_id", guestId)
      .single()
      .then(({ data }) => {
        if (data) {
          const used = (data as { envelope_picks_used: number }).envelope_picks_used ?? 0;
          router.replace(used > 0 ? "/dashboard" : "/checkin/envelope");
        }
      });
  }, [router]);

  async function handleCheckIn() {
    const guestId = getOrCreateGuestId();
    router.push("/checkin/name");
  }

  return (
    <div className="min-h-dvh bg-[#fef8f0] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-3xl font-bold text-[#1a0f0a] mb-2">
          Ralph&apos;s 24th
        </h1>
        <p className="text-lg text-[#5c4033] mb-8">
          Birthday + Lunar New Year
        </p>
        <p className="text-[#5c4033] mb-6">
          Check in to get your free red envelope 紅包!
        </p>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleCheckIn}
          className="shadow-lg"
        >
          Check In
        </Button>
      </div>
    </div>
  );
}
