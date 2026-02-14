"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { getOrCreateGuestId } from "@/lib/guest-id"
import { createClient } from "@/lib/supabase/client"

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    const guestId = getOrCreateGuestId()
    if (!guestId) return
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
  }, [router])

  async function handleCheckIn() {
    const guestId = getOrCreateGuestId()
    router.push("/checkin/name")
  }

  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span
          className="absolute top-[18%] left-[10%] text-2xl text-[#c41e3a] opacity-25 landing-float"
          style={{ animationDelay: "0s" }}
        >
          福
        </span>
        <span
          className="absolute top-[25%] right-[12%] text-xl opacity-25 landing-float"
          style={{ animationDelay: "0.8s" }}
        >
          🎊
        </span>
        <span
          className="absolute bottom-[35%] left-[15%] text-xl opacity-25 landing-float"
          style={{ animationDelay: "1.6s" }}
        >
          🧧
        </span>
        <span
          className="absolute bottom-[30%] right-[8%] text-2xl text-[#c41e3a] opacity-25 landing-float"
          style={{ animationDelay: "2.4s" }}
        >
          福
        </span>
        <span className="absolute top-[40%] left-[8%] text-lg opacity-20 landing-twinkle">
          ✦
        </span>
        <span
          className="absolute top-[55%] right-[15%] text-lg opacity-20 landing-twinkle"
          style={{ animationDelay: "0.5s" }}
        >
          ✦
        </span>
        <span
          className="absolute bottom-[20%] right-[25%] text-lg opacity-20 landing-twinkle"
          style={{ animationDelay: "1s" }}
        >
          ✦
        </span>
        <span
          className="absolute bottom-[45%] left-[20%] text-lg opacity-20 landing-twinkle"
          style={{ animationDelay: "1.5s" }}
        >
          ✦
        </span>
      </div>

      <div className="text-center max-w-sm relative z-10">
        <h1 className="text-3xl font-bold text-[#1a0f0a] mb-2">
          Ralph&apos;s 24th
        </h1>
        <p className="text-lg text-[#5c4033] mb-2">Birthday + Lunar New Year</p>

        <p className="text-[#5c4033] mb-6">
          Check in to get your free red envelope 紅包!
        </p>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleCheckIn}
          className="shadow-lg"
        >
          Check In
        </Button>
      </div>
    </div>
  )
}
