"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getOrCreateGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";

// Placeholder prizes until config is provided
const PLACEHOLDER_PRIZES = [
  { label: "Good luck!", quantity: 10 },
  { label: "Fortune cookie", quantity: 5 },
  { label: "LNY blessing", quantity: 8 },
  { label: "🍊 Orange luck", quantity: 12 },
  { label: "Mystery prize", quantity: 3 },
];

function buildPrizePool(
  types: { label: string; quantity: number }[]
): string[] {
  const pool: string[] = [];
  types.forEach(({ label, quantity }) => {
    for (let i = 0; i < quantity; i++) pool.push(label);
  });
  return pool;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function EnvelopePage() {
  const router = useRouter();
  const [prizes, setPrizes] = useState<{ label: string; quantity: number }[]>(
    []
  );
  const [pool, setPool] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealedPrize, setRevealedPrize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("prize_types")
      .select("label, quantity")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPrizes(
            data.map((d: { label: string; quantity: number }) => ({
              label: d.label,
              quantity: d.quantity,
            }))
          );
        } else {
          setPrizes(PLACEHOLDER_PRIZES);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (prizes.length === 0) return;
    const p = buildPrizePool(prizes);
    setPool(shuffle(p));
  }, [prizes]);

  async function handlePick(index: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    const prize = pool[index];
    setRevealedPrize(prize);

    const guestId = getOrCreateGuestId();
    const supabase = createClient();
    supabase.from("prize_picks").insert({
      guest_id: guestId,
      prize_label: prize,
    });
    const { data: guest } = await supabase
      .from("guests")
      .select("envelope_picks_used")
      .eq("guest_id", guestId)
      .single();
    const used = (guest?.envelope_picks_used ?? 0) + 1;
    await supabase
      .from("guests")
      .update({
        envelope_picks_used: used,
        updated_at: new Date().toISOString(),
      })
      .eq("guest_id", guestId);
  }

  function handleGoToDashboard() {
    router.replace("/dashboard");
  }

  const winRates =
    prizes.length > 0
      ? prizes.map((p) => ({
          label: p.label,
          rate:
            Math.round(
              (p.quantity / pool.length) * 100
            ),
        }))
      : [];

  if (loading || pool.length === 0) {
    return (
      <div className="min-h-dvh bg-[#fef8f0] flex items-center justify-center">
        <p className="text-[#5c4033]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#fef8f0] px-6 py-10">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-[#1a0f0a] mb-6 text-center">
          Pick a red envelope
        </h1>

        {revealedPrize ? (
          <div className="space-y-6">
            <Card className="text-center">
              <p className="text-lg text-[#5c4033] mb-2">You got</p>
              <p className="text-2xl font-bold text-[#c41e3a]">
                {revealedPrize}
              </p>
            </Card>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleGoToDashboard}
            >
              Back to party
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 scrollbar-hide snap-x snap-mandatory">
              {pool.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePick(i)}
                  className="flex-shrink-0 w-24 h-32 rounded-lg bg-[#c41e3a] border-2 border-[#9e1830] flex items-center justify-center text-white font-bold text-sm snap-center hover:scale-105 transition-transform"
                >
                  紅包
                </button>
              ))}
            </div>
            {winRates.length > 0 && (
              <Card padding="sm" className="mt-6">
                <p className="text-xs font-medium text-[#8b7355] mb-2">
                  Win rates
                </p>
                <div className="space-y-1">
                  {winRates.map((w) => (
                    <div
                      key={w.label}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-[#5c4033]">{w.label}</span>
                      <span className="font-medium">{w.rate}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
