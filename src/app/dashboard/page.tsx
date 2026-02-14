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
  const [myPrizes, setMyPrizes] = useState<{ prize_label: string; prize_rarity: string | null }[]>([]);
  const [partyPicks, setPartyPicks] = useState<{ name: string; prize_label: string }[]>([]);
  const [envelopesExpanded, setEnvelopesExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guestId = getGuestId();
    if (!guestId) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("guests").select("name, zodiac_sign, envelope_picks_used, drink_count").eq("guest_id", guestId).single(),
      supabase.from("party_state").select("ralph_drink_count").limit(1).single(),
      supabase.from("prize_picks").select("guest_id, prize_label, prize_rarity").order("picked_at", { ascending: false }).limit(50),
    ]).then(async ([g, r, p]) => {
      if (g.error) console.error("[dashboard] guests fetch:", g.error);
      if (r.error) console.error("[dashboard] party_state fetch:", r.error);
      if (p.error) console.error("[dashboard] prize_picks fetch:", p.error);
      if (g.data) setGuest(g.data as typeof guest);
      if (r.data) setRalphDrinks((r.data as { ralph_drink_count: number }).ralph_drink_count);
      const picks = (p.data || []) as { guest_id: string; prize_label: string; prize_rarity: string | null }[];
      if (picks.length > 0) {
        setMyPrizes(picks.filter((x) => x.guest_id === guestId).map((x) => ({ prize_label: x.prize_label, prize_rarity: x.prize_rarity })));
        const ids = [...new Set(picks.map((x) => x.guest_id))];
        const { data: guestsData } = await supabase.from("guests").select("name, guest_id").in("guest_id", ids);
        const names = (guestsData || []) as { name: string; guest_id: string }[];
        const map = Object.fromEntries(names.map((n) => [n.guest_id, n.name]));
        setPartyPicks(picks.map((x) => ({ name: map[x.guest_id] || "Someone", prize_label: x.prize_label })));
      }
      setLoading(false);
    });
  }, []);

  const canPickAgain = guest ? 1 + Math.floor((guest.drink_count || 0) / 5) > (guest.envelope_picks_used || 0) : false;

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
        <button
          onClick={() => setEnvelopesExpanded(!envelopesExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <p className="text-sm text-[#8b7355] mb-1">Your envelopes opened</p>
            <p className="text-2xl font-bold">{guest?.envelope_picks_used ?? 0}</p>
          </div>
          <span className="text-[#8b7355]">{envelopesExpanded ? "▼" : "▶"}</span>
        </button>
        {envelopesExpanded && (
          <div className="mt-4 pt-4 border-t border-[#e8ddd0] space-y-2">
            {myPrizes.length === 0 ? (
              <p className="text-[#8b7355] text-sm">No prizes yet</p>
            ) : (
              myPrizes.map((prize, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[#1a0f0a]">{prize.prize_label}</span>
                  {prize.prize_rarity && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#e8ddd0] text-[#5c4033]">
                      {prize.prize_rarity}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        {canPickAgain && (
          <Link href="/checkin/envelope" className="block mt-3">
            <Button variant="secondary" size="sm" fullWidth>
              Pick another (5 drinks earned it!)
            </Button>
          </Link>
        )}
      </Card>

      <Card>
        <p className="text-sm text-[#8b7355] mb-2">Recent wins at the party</p>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {partyPicks.length === 0 ? (
            <p className="text-[#8b7355] text-sm">No picks yet</p>
          ) : (
            partyPicks.map((m, i) => (
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
