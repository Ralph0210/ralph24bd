"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { getGuestId } from "@/lib/guest-id";
import { getZodiacEmoji } from "@/lib/chinese-zodiac";
import { createClient } from "@/lib/supabase/client";

type Guest = { name: string; avatar_url: string | null; zodiac_sign: string | null };

export default function FrensPage() {
  const [myZodiac, setMyZodiac] = useState<string | null>(null);
  const [zodiacBuddies, setZodiacBuddies] = useState<Guest[]>([]);
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guestId = getGuestId();
    if (!guestId) return;
    const supabase = createClient();
    supabase
      .from("guests")
      .select("name, avatar_url, zodiac_sign, guest_id")
      .not("zodiac_sign", "is", null)
      .then(({ data }) => {
        const guests = (data || []) as (Guest & { guest_id: string })[];
        const me = guests.find((g) => g.guest_id === guestId);
        if (me) {
          setMyZodiac(me.zodiac_sign);
          setZodiacBuddies(
            guests.filter((g) => g.zodiac_sign === me.zodiac_sign && g.guest_id !== guestId)
          );
        } else {
          supabase
            .from("guests")
            .select("zodiac_sign")
            .eq("guest_id", guestId)
            .single()
            .then(({ data: meData }) => {
              const m = meData as { zodiac_sign: string | null } | null;
              if (m) setMyZodiac(m.zodiac_sign);
            });
        }
        setAllGuests(guests);
        setLoading(false);
      });
  }, []);

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
        <p className="text-sm text-[#8b7355] mb-1">Your zodiac</p>
        <p className="text-xl font-bold text-[#c41e3a]">
          {myZodiac ? (
            <>
              <span className="text-2xl mr-2">{getZodiacEmoji(myZodiac)}</span>
              Year of the {myZodiac}
            </>
          ) : (
            "—"
          )}
        </p>
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
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="animate-fade-in-up animate-fade-in-up-delay-3 tap-scale">
        <p className="text-footnote text-[#8b7355] mb-2">Everyone&apos;s zodiac</p>
        <ul className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
          {allGuests.map((g, i) => (
            <li key={i} className="flex justify-between items-center text-callout gap-2 animate-slide-in" style={{ animationDelay: `${i * 0.035}s`, opacity: 0 }}>
              <div className="flex items-center gap-2 min-w-0">
                <Avatar src={g.avatar_url} name={g.name} size="sm" />
                <span className="font-medium text-[#1a0f0a] truncate">{g.name}</span>
              </div>
              <span className="text-[#5c4033]">
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
          ))}
        </ul>
      </Card>
    </div>
  );
}
