"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getOrCreateGuestId } from "@/lib/guest-id";
import { getChineseZodiac } from "@/lib/chinese-zodiac";
import { createClient } from "@/lib/supabase/client";

export default function ZodiacPage() {
  const router = useRouter();
  const [birthYear, setBirthYear] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const zodiac = birthYear ? getChineseZodiac(parseInt(birthYear, 10)) : null;

  async function handleReveal() {
    if (!birthYear) {
      setRevealed(true);
      router.push("/checkin/envelope");
      return;
    }
    const year = parseInt(birthYear, 10);
    if (year < 1900 || year > 2100) return;
    setLoading(true);
    const guestId = getOrCreateGuestId();
    const supabase = createClient();
    const sign = getChineseZodiac(year);
    await supabase
      .from("guests")
      .update({
        birth_year: year,
        zodiac_sign: sign || null,
        updated_at: new Date().toISOString(),
      })
      .eq("guest_id", guestId);
    setLoading(false);
    setRevealed(true);
  }

  function handleContinue() {
    router.push("/checkin/envelope");
  }

  return (
    <div className="min-h-dvh bg-[#fef8f0] px-6 py-10">
      <div className="max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold text-[#1a0f0a] mb-6">
          Your zodiac
        </h1>
        {!revealed ? (
          <>
            <Card className="mb-6">
              <label className="block text-sm font-medium text-[#5c4033] mb-2">
                Birth year (optional)
              </label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="e.g. 2000"
                min={1900}
                max={2100}
                className="w-full h-12 px-4 rounded-xl border border-[#e8ddd0] bg-white text-[#1a0f0a] placeholder:text-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/30"
              />
            </Card>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleReveal}
              disabled={loading}
            >
              {birthYear ? "Reveal my sign" : "Skip"}
            </Button>
          </>
        ) : (
          <>
            <Card className="mb-6">
              {zodiac ? (
                <>
                  <p className="text-4xl mb-2">🐉</p>
                  <p className="text-2xl font-bold text-[#c41e3a]">
                    {zodiac}
                  </p>
                  <p className="text-sm text-[#5c4033] mt-2">
                    Year of the {zodiac}
                  </p>
                </>
              ) : (
                <p className="text-[#5c4033]">No zodiac — skipped</p>
              )}
            </Card>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleContinue}
            >
              Pick your red envelope
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
