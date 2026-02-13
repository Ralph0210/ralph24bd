"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";

export default function DashboardHomePage() {
  const [guest, setGuest] = useState<{
    name: string;
    zodiac_sign: string | null;
    envelope_picks_used: number;
    drink_count: number;
  } | null>(null);
  const [ralphDrinks, setRalphDrinks] = useState(0);
  const [prizeMsgs, setPrizeMsgs] = useState<{ name: string; prize_label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guestId = getGuestId();
    if (!guestId) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("guests").select("name, zodiac_sign, envelope_picks_used, drink_count").eq("guest_id", guestId).single(),
      supabase.from("party_state").select("ralph_drink_count").limit(1).single(),
      supabase.from("prize_picks").select("guest_id, prize_label").order("picked_at", { ascending: false }).limit(20),
    ]).then(async ([g, r, p]) => {
      if (g.data) setGuest(g.data as typeof guest);
      if (r.data) setRalphDrinks((r.data as { ralph_drink_count: number }).ralph_drink_count);
      const picks = (p.data || []) as { guest_id: string; prize_label: string }[];
      if (picks.length > 0) {
        const ids = [...new Set(picks.map((x) => x.guest_id))];
        const { data: guestsData } = await supabase.from("guests").select("name, guest_id").in("guest_id", ids);
        const names = (guestsData || []) as { name: string; guest_id: string }[];
        const map = Object.fromEntries(names.map((n) => [n.guest_id, n.name]));
        setPrizeMsgs(picks.map((x) => ({ name: map[x.guest_id] || "Someone", prize_label: x.prize_label })));
      }
      setLoading(false);
    });
  }, []);

  const canPickAgain = guest ? 1 + Math.floor((guest.drink_count || 0) / 10) > (guest.envelope_picks_used || 0) : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[#5c4033]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1a0f0a]">
        Hey {guest?.name || "there"}
      </h1>

      <Card>
        <p className="text-sm text-[#8b7355] mb-1">Ralph&apos;s drinks</p>
        <p className="text-3xl font-bold text-[#c41e3a]">{ralphDrinks}</p>
      </Card>

      <Card>
        <p className="text-sm text-[#8b7355] mb-1">Your envelopes opened</p>
        <p className="text-2xl font-bold">{guest?.envelope_picks_used ?? 0}</p>
        {canPickAgain && (
          <Link href="/checkin/envelope" className="block mt-3">
            <Button variant="secondary" size="sm" fullWidth>
              Pick another (10 drinks earned it!)
            </Button>
          </Link>
        )}
      </Card>

      <Card>
        <p className="text-sm text-[#8b7355] mb-2">Prize messages</p>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {prizeMsgs.length === 0 ? (
            <p className="text-[#8b7355] text-sm">No picks yet</p>
          ) : (
            prizeMsgs.map((m, i) => (
              <p key={i} className="text-sm">
                <span className="font-medium text-[#1a0f0a]">{m.name}</span>
                {" → "}
                <span className="text-[#5c4033]">{m.prize_label}</span>
              </p>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
