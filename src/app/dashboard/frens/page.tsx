"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getGuestId } from "@/lib/guest-id";
import { getZodiacEmoji } from "@/lib/chinese-zodiac";
import { createClient } from "@/lib/supabase/client";

type Guest = { name: string; zodiac_sign: string | null };

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
      .select("name, zodiac_sign, guest_id")
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[#5c4033]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1a0f0a]">Frens</h1>

      <Card>
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
        <Card>
          <p className="text-sm text-[#8b7355] mb-2">
            Zodiac buddies ({getZodiacEmoji(myZodiac)} {myZodiac})
          </p>
          <ul className="space-y-1">
            {zodiacBuddies.map((b, i) => (
              <li key={i} className="font-medium">
                {b.name}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <p className="text-sm text-[#8b7355] mb-2">Everyone&apos;s zodiac</p>
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {allGuests.map((g, i) => (
            <li key={i} className="flex justify-between items-center text-sm gap-2">
              <span className="font-medium text-[#1a0f0a]">{g.name}</span>
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
