"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getGuestId } from "@/lib/guest-id";
import { isPartyStarted } from "@/lib/party-start";
import { createClient } from "@/lib/supabase/client";
import { HomeIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { Wine, PenSquare } from "lucide-react";
import { CreateContentSheet } from "@/components/CreateContentSheet";

const TABS = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/dashboard/drinks", label: "Drinks", Icon: Wine },
  { href: "/dashboard/frens", label: "Frens", Icon: UserGroupIcon },
] as const;

const CONVERSATION_STARTERS_BASE = [
  "How do you know Ralph?",
  "What are you drinking tonight?",
  "Excited for the cake cutting?",
  "Any good Lunar New Year traditions you're doing?",
  "Seen anyone else here before?",
  "What would you wish for in your red envelope?",
  "Best birthday party you've been to?",
];

function getConversationStarters(myZodiac: string | null): string[] {
  const first = myZodiac
    ? `What's your zodiac sign? I'm Year of the ${myZodiac}!`
    : "What's your zodiac sign?";
  return [first, ...CONVERSATION_STARTERS_BASE];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [guestId, setGuestId] = useState<string | null>(null);
  const [myZodiac, setMyZodiac] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string>("");
  const [guestAvatar, setGuestAvatar] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [postSheetOpen, setPostSheetOpen] = useState(false);

  useEffect(() => {
    if (!isPartyStarted()) router.replace("/");
  }, [router]);

  useEffect(() => {
    setGuestId(getGuestId());
  }, []);

  useEffect(() => {
    if (!guestId) return;
    const supabase = createClient();
    supabase
      .from("guests")
      .select("zodiac_sign, name, avatar_url")
      .eq("guest_id", guestId)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as { zodiac_sign: string | null; name: string; avatar_url: string | null };
          setMyZodiac(d.zodiac_sign);
          setGuestName(d.name ?? "");
          setGuestAvatar(d.avatar_url);
        }
      });
  }, [guestId]);

  if (!guestId) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 animate-page-enter">
        <p className="text-[#5c4033]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col pb-20">
      <main className="flex-1 px-5 py-8 animate-page-enter">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 min-h-[64px] py-2 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-white/80 backdrop-blur-xl border-t border-[#e8ddd0]/60 flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[60px] py-2 px-4 rounded-2xl transition-colors duration-300 active:scale-95 touch-manipulation ${
                isActive ? "text-[#c41e3a] font-medium" : "text-[#8b7355] hover:text-[#c41e3a]"
              }`}
            >
              {isActive && (
                <span
                  className="absolute inset-0 rounded-2xl bg-[#c41e3a]/10 -z-10 nav-pill-active"
                  aria-hidden
                />
              )}
              <tab.Icon className="size-6" />
              <span className="text-xs">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FAB + bottom sheet: Help for introverts - on all tabs */}
      {sheetOpen && (
        <button
          type="button"
          onClick={() => setSheetOpen(false)}
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] animate-sheet-backdrop-in"
          aria-label="Close"
        />
      )}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white/92 backdrop-blur-2xl shadow-[0_-4px_32px_rgba(0,0,0,0.08)] flex flex-col max-h-[70dvh] transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          sheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        aria-hidden={!sheetOpen}
      >
        <div className="shrink-0 pt-3 pb-2 flex justify-center">
          <div className="w-9 h-1 rounded-full bg-black/12" aria-hidden />
        </div>
        <div className="shrink-0 px-6 pb-4">
          <p className="text-footnote text-[#8b7355] tracking-wide">For introverts</p>
          <h2 className="text-title text-[#1a0f0a] mt-0.5">Conversation starters</h2>
        </div>
        <ul className="flex-1 overflow-y-auto px-5 pb-8 space-y-1 scrollbar-hide">
          {getConversationStarters(myZodiac).map((starter, i) => (
            <li
              key={i}
              className="py-3.5 px-4 rounded-2xl text-body text-[#1a0f0a] bg-black/2"
            >
              {starter}
            </li>
          ))}
        </ul>
      </div>
      {/* Left FAB: Conversation starters */}
      <button
        type="button"
        onClick={() => setSheetOpen(!sheetOpen)}
        className="fixed left-5 bottom-24 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#c41e3a] text-white shadow-[0_4px_20px_rgba(196,30,58,0.35)] active:scale-[0.94] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] touch-manipulation"
        aria-expanded={sheetOpen}
        aria-label={sheetOpen ? "Close" : "Conversation starters"}
      >
        <span className="text-lg font-medium">{sheetOpen ? "×" : "?"}</span>
      </button>
      {/* Right FAB: Create post */}
      <button
        type="button"
        onClick={() => setPostSheetOpen(true)}
        className="fixed right-5 bottom-24 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#c41e3a] text-white shadow-[0_4px_20px_rgba(196,30,58,0.35)] active:scale-[0.94] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] touch-manipulation"
        aria-label="Create post"
      >
        <PenSquare className="size-6" />
      </button>
      <CreateContentSheet
        open={postSheetOpen}
        onClose={() => setPostSheetOpen(false)}
        guestName={guestName}
        guestAvatar={guestAvatar}
      />
    </div>
  );
}
