"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getGuestId, getAdminGuestId } from "@/lib/guest-id";
import { getChineseZodiac, getZodiacEmoji } from "@/lib/chinese-zodiac";
import { createClient } from "@/lib/supabase/client";

type Guest = {
  name: string;
  avatar_url: string | null;
  zodiac_sign: string | null;
  participation: string | null;
};

export default function FrensPage() {
  const [myZodiac, setMyZodiac] = useState<string | null>(null);
  const [zodiacBuddies, setZodiacBuddies] = useState<Guest[]>([]);
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [birthYear, setBirthYear] = useState("");
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState("");

  const fetchData = useCallback(() => {
    const guestId = getGuestId();
    if (!guestId) return;
    const supabase = createClient();
    const adminGuestId = getAdminGuestId();
    Promise.all([
      supabase
        .from("guests")
        .select("name, avatar_url, zodiac_sign, guest_id, participation")
        .neq("guest_id", adminGuestId)
        .not("name", "is", null)
        .order("created_at", { ascending: false }),
      supabase.from("guests").select("name, avatar_url, zodiac_sign, guest_id, participation").eq("guest_id", adminGuestId).single(),
    ]).then(([guestsRes, hostRes]) => {
      const guests = ((guestsRes.data || []) as (Guest & { guest_id: string })[]);
      const host = hostRes.data as (Guest & { guest_id: string }) | null;
      const me = guests.find((g) => g.guest_id === guestId);
      if (me) {
        setMyZodiac(me.zodiac_sign);
        setZodiacBuddies(
          guests.filter((g) => g.zodiac_sign && g.zodiac_sign === me.zodiac_sign && g.guest_id !== guestId)
        );
      } else {
        setMyZodiac(null);
        setZodiacBuddies([]);
      }
      const withHost = host && host.name ? [host, ...guests] : guests;
      setAllGuests(withHost);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRevealZodiac() {
    setRevealError("");
    const year = parseInt(birthYear, 10);
    if (Number.isNaN(year) || year < 1900 || year > 2100) {
      setRevealError("Enter a valid birth year (1900–2100)");
      return;
    }
    const guestId = getGuestId();
    if (!guestId) return;
    setRevealLoading(true);
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
    setRevealLoading(false);
    setBirthYear("");
    fetchData();
  }

  if (loading) {
    return (
      <div className="max-w-sm mx-auto space-y-6 py-4">
        <div className="h-9 w-32 rounded-[14px] bg-[#e8ddd0]/50 animate-skeleton" />
        <div className="h-24 rounded-[20px] bg-[#e8ddd0]/40 animate-skeleton" />
        <div className="h-32 rounded-[20px] bg-[#e8ddd0]/40 animate-skeleton" />
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-6 animate-page-enter">
      <h1 className="text-title text-[#1a0f0a] animate-fade-in-up">Frens</h1>

      <Card className="animate-fade-in-up animate-fade-in-up-delay-1 tap-scale">
        <p className="text-sm text-[#8b7355] mb-2">Your zodiac</p>
        {myZodiac ? (
          <p className="text-xl font-bold text-[#c41e3a]">
            <span className="text-2xl mr-2">{getZodiacEmoji(myZodiac)}</span>
            Year of the {myZodiac}
          </p>
        ) : (
          <div>
            <p className="text-body text-[#5c4033] mb-3">
              Enter your birth year to reveal your sign
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(e.target.value);
                  setRevealError("");
                }}
                placeholder="e.g. 2000"
                min={1900}
                max={2100}
                className={`flex-1 min-w-0 h-11 px-4 rounded-[14px] border bg-white/80 text-[#1a0f0a] placeholder:text-[#8b7355] text-body focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/25 focus:border-[#c41e3a]/40 ${revealError ? "border-[#c41e3a]" : "border-[#e8ddd0]"}`}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleRevealZodiac}
                disabled={revealLoading || !birthYear.trim()}
              >
                {revealLoading ? "…" : "Reveal"}
              </Button>
            </div>
            {revealError && (
              <p className="text-[#c41e3a] text-caption mt-2">{revealError}</p>
            )}
          </div>
        )}
      </Card>

      {myZodiac && zodiacBuddies.length > 0 && (
        <Card className="animate-fade-in-up animate-fade-in-up-delay-2 tap-scale">
          <p className="text-sm text-[#8b7355] mb-2">
            Zodiac buddies ({getZodiacEmoji(myZodiac)} {myZodiac})
          </p>
          <ul className="space-y-2">
            {zodiacBuddies.map((b, i) => (
              <li key={i} className="flex items-center gap-2">
                <Avatar src={b.avatar_url} name={b.name} size="sm" />
                <span className="font-medium">{b.name}</span>
                <span className={`text-caption px-2 py-0.5 rounded-full shrink-0 ${(b.participation || "in_person") === "remote" ? "bg-blue-500/15 text-blue-700" : "bg-[#c41e3a]/10 text-[#c41e3a]"}`}>
                  {(b.participation || "in_person") === "remote" ? "Remote" : "In person"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="animate-fade-in-up animate-fade-in-up-delay-3 tap-scale">
        <p className="text-footnote text-[#8b7355] mb-2">Everyone&apos;s zodiac</p>
        <ul className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
          {allGuests.map((g, i) => {
            const isHost = (g as Guest & { guest_id?: string }).guest_id === getAdminGuestId();
            return (
            <li key={i} className="flex justify-between items-center text-callout gap-2 animate-slide-in" style={{ animationDelay: `${i * 0.035}s`, opacity: 0 }}>
              <div className="flex items-center gap-2 min-w-0">
                <Avatar src={g.avatar_url} name={g.name} size="sm" />
                <span className="font-medium text-[#1a0f0a] truncate">{g.name}</span>
                <span className={`text-caption px-2 py-0.5 rounded-full shrink-0 ${isHost ? "bg-[#d4af37]/20 text-[#b8962e]" : (g.participation || "in_person") === "remote" ? "bg-blue-500/15 text-blue-700" : "bg-[#c41e3a]/10 text-[#c41e3a]"}`}>
                  {isHost ? "Host" : (g.participation || "in_person") === "remote" ? "Remote" : "In person"}
                </span>
              </div>
              <span className="text-[#5c4033] shrink-0">
                {g.zodiac_sign ? (
                  <>
                    <span className="text-base">{getZodiacEmoji(g.zodiac_sign)}</span>{" "}
                    {g.zodiac_sign}
                  </>
                ) : (
                  "—"
                )}
              </span>
            </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
