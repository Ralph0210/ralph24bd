"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Countdown } from "@/components/Countdown"
import { isPartyStarted } from "@/lib/party-start"

const PartyStartedContent = dynamic(
  () => import("@/components/PartyStartedContent").then((m) => ({ default: m.PartyStartedContent })),
  { ssr: false }
)

const HostFeed = dynamic(
  () => import("@/components/HostFeed").then((m) => ({ default: m.HostFeed })),
  { ssr: false, loading: () => <div className="w-full mt-8 h-24 rounded-2xl bg-white/40 animate-pulse" /> }
)

export default function LandingPage() {
  const [configError, setConfigError] = useState<string | null>(null)
  const partyStarted = isPartyStarted()

  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center px-6 overflow-x-hidden overflow-y-auto animate-page-enter">
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

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center py-8">
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
            Birthday 2/10 · Party Feb 15
          </span>
        </div>

        {partyStarted ? (
          <PartyStartedContent onConfigError={setConfigError} />
        ) : (
          /* Countdown before party */
          <>
            <div className="w-full animate-fade-in-up animate-fade-in-up-delay-2">
              <div className="rounded-[24px] bg-white/65 backdrop-blur-xl border border-white/80 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <h1 className="font-display text-[1.75rem] font-bold text-[#1a0f0a] text-center mb-2 tracking-tight">
                  Ralph&apos;s 24th
                </h1>
                <p className="font-display text-headline text-[#c41e3a] text-center mb-2">
                  Birthday + Lunar New Year
                </p>
                <p className="text-body text-[#5c4033] text-center mb-6">
                  Celebrating Ralph&apos;s 24th — party Feb 15, 4pm Seattle time{" "}
                  <a
                    href="https://maps.app.goo.gl/yq2kqCcvfmSmorpr9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#c41e3a] font-medium underline"
                  >
                    Augusta Apartments 7F
                  </a>
                </p>
                <Countdown />
                <p className="text-footnote text-[#5c4033] text-center mt-6 pt-6 border-t border-[#e8ddd0]/60">
                  Joining remotely? When the party starts, check in to claim
                  your free red envelope prize.
                </p>
              </div>
            </div>
            <HostFeed />
          </>
        )}
      </div>
    </div>
  )
}
