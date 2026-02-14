"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { LandingEnvelope } from "@/components/LandingEnvelope"
import { Countdown } from "@/components/Countdown"
import { getOrCreateGuestId } from "@/lib/guest-id"
import { createClient } from "@/lib/supabase/client"
import { isPartyStarted } from "@/lib/party-start"
import confetti from "canvas-confetti"

export default function LandingPage() {
  const router = useRouter()
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPartyStarted()) return
    const guestId = getOrCreateGuestId()
    if (!guestId) return
    try {
      const supabase = createClient()
      supabase
        .from("guests")
        .select("envelope_picks_used")
        .eq("guest_id", guestId)
        .single()
        .then(({ data }) => {
          if (data) {
            const used =
              (data as { envelope_picks_used: number }).envelope_picks_used ?? 0
            router.replace(used > 0 ? "/dashboard" : "/checkin/envelope")
          }
        })
    } catch {
      queueMicrotask(() => setConfigError("Supabase not configured."))
    }
  }, [router])

  function fireConfetti() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#c41e3a", "#d4af37", "#fef8f0"],
    })
  }

  function handleCheckIn() {
    fireConfetti()
    getOrCreateGuestId()
    router.push("/checkin/name")
  }

  const partyStarted = isPartyStarted()

  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center px-6 overflow-hidden animate-page-enter">
      {/* Layered background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-80 h-80 rounded-full bg-[#d4af37]/15 blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-72 h-72 rounded-full bg-[#c41e3a]/12 blur-[70px]" />
      </div>

      {/* Floating decorative coins */}
      <div
        className="absolute top-[12%] left-[8%] w-8 h-8 rounded-full bg-[#d4af37]/40 border-2 border-[#d4af37]/60 landing-float"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute top-[15%] right-[5%] w-6 h-6 rounded-full bg-[#d4af37]/35 border-2 border-[#d4af37]/50 landing-float"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        className="absolute bottom-[25%] left-[5%] w-7 h-7 rounded-full bg-[#d4af37]/30 border-2 border-[#d4af37]/50 landing-float"
        style={{ animationDelay: "1.8s" }}
      />
      <div
        className="absolute bottom-[30%] right-[10%] w-8 h-8 rounded-full bg-[#d4af37]/35 border-2 border-[#d4af37]/55 landing-float"
        style={{ animationDelay: "0.3s" }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {configError && (
          <p className="text-footnote text-[#c41e3a] mb-6 p-4 bg-red-50/80 rounded-[14px] border border-[#c41e3a]/20 animate-fade-in-up">
            {configError} In Vercel: Project Settings → Environment Variables →
            add <code className="text-caption">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="text-caption">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        )}

        {/* Date badge */}
        <div className="mb-6 animate-fade-in-up px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#e8ddd0]/80 shadow-sm">
          <span className="text-caption font-semibold text-[#5c4033] tracking-wide">
            Feb 15 · 生日快樂
          </span>
        </div>

        {partyStarted ? (
          <>
            {/* Hero envelope - tappable */}
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

            {/* Glass card CTA */}
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
        ) : (
          /* Countdown before party */
          <div className="w-full animate-fade-in-up animate-fade-in-up-delay-2">
            <div className="rounded-[24px] bg-white/65 backdrop-blur-xl border border-white/80 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <h1 className="font-display text-[1.75rem] font-bold text-[#1a0f0a] text-center mb-2 tracking-tight">
                Ralph&apos;s 24th
              </h1>
              <p className="font-display text-headline text-[#c41e3a] text-center mb-2">
                Birthday + Lunar New Year
              </p>
              <p className="text-body text-[#5c4033] text-center mb-6">
                Party starts Feb 15, 4pm Seattle time
              </p>
              <Countdown />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
