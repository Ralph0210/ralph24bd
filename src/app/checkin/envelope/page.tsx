"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { getOrCreateGuestId } from "@/lib/guest-id"
import { createClient } from "@/lib/supabase/client"

type PrizeItem = {
  label: string
  microcopy: string | null
  rarity: string | null
}
type PrizeType = {
  label: string
  quantity: number
  microcopy?: string | null
  rarity?: string | null
}

// Placeholder prizes until config is provided
const PLACEHOLDER_PRIZES: PrizeType[] = [
  {
    label: "Good luck!",
    quantity: 10,
    microcopy: "May the new year bring you joy.",
    rarity: "Common",
  },
  {
    label: "Fortune cookie",
    quantity: 5,
    microcopy: "Your fortune awaits inside.",
    rarity: "Rare",
  },
  {
    label: "LNY blessing",
    quantity: 8,
    microcopy: "Wishing you prosperity!",
    rarity: "Common",
  },
  {
    label: "🍊 Orange luck",
    quantity: 12,
    microcopy: "Sour today, sweet tomorrow.",
    rarity: "Common",
  },
  {
    label: "Mystery prize",
    quantity: 3,
    microcopy: "Curiosity rewarded.",
    rarity: "Legendary",
  },
]

function buildPrizePool(types: PrizeType[]): PrizeItem[] {
  const pool: PrizeItem[] = []
  types.forEach(({ label, quantity, microcopy, rarity }) => {
    for (let i = 0; i < quantity; i++)
      pool.push({ label, microcopy: microcopy ?? null, rarity: rarity ?? null })
  })
  return pool
}

const RARITY_ORDER: Record<string, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
}

function rarityColor(rarity: string): string {
  const r = rarity.toLowerCase()
  if (r === "legendary")
    return "bg-amber-400/30 text-amber-800 border-amber-400/50"
  if (r === "rare") return "bg-blue-100 text-blue-800 border-blue-200"
  if (r === "epic") return "bg-purple-100 text-purple-800 border-purple-200"
  return "bg-[#e8ddd0] text-[#5c4033] border-[#d4c4b0]"
}

function rarityShineClass(rarity: string | null): string {
  if (!rarity) return "envelope-shine-common"
  const r = rarity.toLowerCase()
  if (r === "legendary") return "envelope-shine-legendary"
  if (r === "rare") return "envelope-shine-rare"
  if (r === "epic") return "envelope-shine-epic"
  return "envelope-shine-common"
}

function rarityBgClass(rarity: string | null): string {
  if (!rarity) return "bg-rarity-common"
  const r = rarity.toLowerCase()
  if (r === "legendary") return "bg-rarity-legendary"
  if (r === "rare") return "bg-rarity-rare"
  if (r === "epic") return "bg-rarity-epic"
  return "bg-rarity-common"
}

function fireFireworks(rarity: string | null) {
  const colors =
    rarity?.toLowerCase() === "legendary"
      ? ["#f59e0b", "#fbbf24", "#fef3c7", "#fcd34d"]
      : rarity?.toLowerCase() === "rare"
        ? ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]
        : rarity?.toLowerCase() === "epic"
          ? ["#9333ea", "#a855f7", "#c084fc", "#e9d5ff"]
          : ["#d4af37", "#f4e4a6", "#c41e3a", "#fef08a"]
  const baseCount = rarity?.toLowerCase() === "legendary" ? 200 : 120
  confetti({ particleCount: baseCount, spread: 100, origin: { y: 0.55 }, colors, startVelocity: 35 })
  confetti({ particleCount: baseCount, spread: 100, origin: { y: 0.5 }, colors, startVelocity: 40, scalar: 1.2 })
  setTimeout(() => {
    confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0.15 }, colors, startVelocity: 30 })
    confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 0.85 }, colors, startVelocity: 30 })
  }, 100)
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 45, spread: 55, origin: { x: 0.3, y: 0.8 }, colors })
    confetti({ particleCount: 60, angle: 135, spread: 55, origin: { x: 0.7, y: 0.8 }, colors })
  }, 250)
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 90, spread: 100, origin: { x: 0.5, y: 0.9 }, colors, startVelocity: 25 })
  }, 400)
}

const REVEALED_STORAGE_KEY = "ralph24_envelope_revealed"

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function EnvelopePage() {
  const router = useRouter()
  const [prizes, setPrizes] = useState<PrizeType[]>([])
  const [pool, setPool] = useState<PrizeItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [revealedPrize, setRevealedPrize] = useState<PrizeItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [winRatesExpanded, setWinRatesExpanded] = useState(false)
  const [showBackWarning, setShowBackWarning] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("revealed") === "1") {
      try {
        const stored = sessionStorage.getItem(REVEALED_STORAGE_KEY)
        if (stored) {
          const prize = JSON.parse(stored) as PrizeItem
          setRevealedPrize(prize)
        }
        setLoading(false)
      } catch {
        setLoading(false)
      }
    }
  }, [router])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("prize_types")
      .select("label, quantity, microcopy, rarity")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPrizes(
            data.map(
              (d: {
                label: string
                quantity: number
                microcopy?: string | null
                rarity?: string | null
              }) => ({
                label: d.label,
                quantity: d.quantity,
                microcopy: d.microcopy ?? null,
                rarity: d.rarity ?? null,
              }),
            ),
          )
        } else {
          setPrizes(PLACEHOLDER_PRIZES)
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (prizes.length === 0) return
    const p = buildPrizePool(prizes)
    setPool(shuffle(p))
  }, [prizes])

  useEffect(() => {
    if (!revealedPrize || typeof window === "undefined") return
    const revealUrl = "/checkin/envelope?revealed=1"
    window.history.pushState({ envelopeReveal: true }, "", revealUrl)
    const handlePopState = () => {
      window.history.pushState({ envelopeReveal: true }, "", revealUrl)
      setShowBackWarning(true)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [revealedPrize])

  useEffect(() => {
    if (!showBackWarning) return
    const id = setTimeout(() => setShowBackWarning(false), 3000)
    return () => clearTimeout(id)
  }, [showBackWarning])

  async function handlePick(index: number) {
    if (selectedIndex !== null) return
    setSelectedIndex(index)
    const prize = pool[index]
    setRevealedPrize(prize)
    fireFireworks(prize.rarity)

    sessionStorage.setItem(REVEALED_STORAGE_KEY, JSON.stringify(prize))

    const guestId = getOrCreateGuestId()
    const supabase = createClient()
    const { error: pickError } = await supabase.from("prize_picks").insert({
      guest_id: guestId,
      prize_label: prize.label,
      prize_microcopy: prize.microcopy,
      prize_rarity: prize.rarity,
    })
    if (pickError) {
      console.error("[prize_picks] insert failed:", pickError)
    }
    const { data: guest } = await supabase
      .from("guests")
      .select("envelope_picks_used")
      .eq("guest_id", guestId)
      .single()
    const used = (guest?.envelope_picks_used ?? 0) + 1
    const { error: guestError } = await supabase
      .from("guests")
      .update({
        envelope_picks_used: used,
        updated_at: new Date().toISOString(),
      })
      .eq("guest_id", guestId)
    if (guestError) {
      console.error("[guests] envelope_picks_used update failed:", guestError)
    }
  }

  function handleGoToDashboard() {
    sessionStorage.removeItem(REVEALED_STORAGE_KEY)
    router.replace("/dashboard")
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!scrollRef.current) return
    dragRef.current = {
      isDragging: false,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: scrollRef.current.scrollLeft,
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!scrollRef.current) return
    const dx = dragRef.current.startX - e.clientX
    const dy = dragRef.current.startY - e.clientY
    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
      dragRef.current.isDragging = true
    }
    scrollRef.current.scrollLeft = dragRef.current.startScrollLeft + dx
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragRef.current.isDragging) return
    const target = e.target as HTMLElement
    const envelope = target.closest("[data-envelope-index]")
    if (envelope) {
      const index = parseInt(
        envelope.getAttribute("data-envelope-index") ?? "-1",
        10,
      )
      if (index >= 0 && index < pool.length) handlePick(index)
    }
  }

  const winRates =
    prizes.length > 0
      ? prizes
          .map((p) => ({
            label: p.label,
            rarity: p.rarity,
            microcopy: p.microcopy ?? null,
            rate: Math.round((p.quantity / pool.length) * 100),
          }))
          .sort((a, b) => {
            const isGoodFortune = (label: string) =>
              label.toLowerCase().includes("good fortune")
            if (isGoodFortune(a.label) && !isGoodFortune(b.label)) return -1
            if (!isGoodFortune(a.label) && isGoodFortune(b.label)) return 1
            const orderA = a.rarity
              ? (RARITY_ORDER[a.rarity.toLowerCase()] ?? 99)
              : 99
            const orderB = b.rarity
              ? (RARITY_ORDER[b.rarity.toLowerCase()] ?? 99)
              : 99
            return orderA - orderB || a.label.localeCompare(b.label)
          })
      : []

  if (loading || pool.length === 0) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-[#5c4033]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh px-6 py-10 relative overflow-hidden">
      {showBackWarning &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed top-4 left-4 right-4 z-[9999] bg-[#1a0f0a] text-white text-sm text-center py-3 px-4 rounded-xl shadow-lg mx-4">
            Haha gotcha cheater! Use &quot;Back to party&quot; below to leave this page
          </div>,
          document.body,
        )}
      {revealedPrize &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9998] flex items-center justify-center p-6"
            aria-modal
            aria-labelledby="prize-modal-title"
            role="dialog"
          >
            <div
              className={`absolute inset-0 ${rarityBgClass(revealedPrize.rarity)} opacity-95`}
              aria-hidden
            />
            <div
              className={`absolute inset-0 pointer-events-none ${rarityShineClass(revealedPrize.rarity)} opacity-50`}
              style={{
                background: `radial-gradient(circle at 50% 30%, rgba(var(--shine-r), var(--shine-g), var(--shine-b), 0.12) 0%, transparent 55%)`,
              }}
              aria-hidden
            />
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
              <h2 id="prize-modal-title" className="text-2xl font-bold text-[#1a0f0a] mb-4 text-center">
                Your prize
              </h2>
              <div className="relative w-52 h-48 sm:w-56 sm:h-52 shrink-0 animate-envelope-reveal -mt-24">
                <div
                  className={`absolute inset-0 rounded-xl bg-[#c41e3a] border-2 border-[#9e1830] flex flex-col items-center justify-center overflow-hidden ${revealedPrize.rarity?.toLowerCase() !== "rare" ? rarityShineClass(revealedPrize.rarity) : "envelope-shine-common"}`}
                >
                  <span className="text-white font-bold text-4xl z-10">福</span>
                  <span className="text-white/90 font-medium text-sm z-10 mt-1">
                    Good Fortune
                  </span>
                </div>
              </div>
              <div className="w-full max-w-xs -mt-8 relative z-10 animate-card-pull-out">
                <Card className="text-center shadow-xl border-2 border-[#e8ddd0]">
                  {revealedPrize.rarity && (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mb-3 ${rarityColor(revealedPrize.rarity)}`}
                    >
                      {revealedPrize.rarity}
                    </span>
                  )}
                  <p className="text-lg text-[#5c4033] mb-2">You got</p>
                  <p className="text-2xl font-bold text-[#c41e3a]">
                    {revealedPrize.label}
                  </p>
                  {revealedPrize.microcopy && (
                    <p className="text-sm text-[#8b7355] mt-3">
                      {revealedPrize.microcopy}
                    </p>
                  )}
                  <p className="text-xs text-[#c41e3a] font-medium mt-4">
                    Show this to Ralph and claim your prize!
                  </p>
                </Card>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="mt-6"
                onClick={handleGoToDashboard}
              >
                Back to party
              </Button>
            </div>
          </div>,
          document.body,
        )}
      {/* Background layer - behind all content */}
      <div className="absolute inset-0 z-0" aria-hidden />
      {!revealedPrize && (
      <div className="max-w-sm mx-auto relative z-10">
        <h1 className="text-2xl font-bold text-[#1a0f0a] mb-6 text-center">
          Pick a red envelope
        </h1>

        <>
          <div
            ref={scrollRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 -mx-2 scrollbar-hide snap-x snap-mandatory touch-pan-x cursor-grab active:cursor-grabbing select-none [contain:layout_paint]"
          >
            {pool.map((_, i) => (
              <div
                key={i}
                data-envelope-index={i}
                role="button"
                tabIndex={0}
                onClick={() => handlePick(i)}
                onKeyDown={(e) => e.key === "Enter" && handlePick(i)}
                className="shrink-0 w-52 h-72 sm:w-60 sm:h-80 rounded-xl border-2 border-[#9e1830] flex flex-col items-center justify-center text-white font-bold snap-center active:scale-[0.98] transition-transform shadow-lg overflow-hidden relative bg-[#c41e3a] envelope-shine-common cursor-pointer"
                style={{ touchAction: "pan-x" }}
              >
                <span className="z-10 relative text-4xl">福</span>
                <span className="z-10 relative text-sm font-medium mt-1">
                  Good Fortune
                </span>
                <div
                  className="absolute inset-0 pointer-events-none animate-envelope-shine"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, rgba(212,175,55,0.5) 0%, transparent 50%),
                                  radial-gradient(circle at 70% 70%, rgba(212,175,55,0.4) 0%, transparent 40%),
                                  radial-gradient(circle at 50% 50%, rgba(212,175,55,0.3) 0%, transparent 60%)`,
                  }}
                />
              </div>
            ))}
          </div>
          {winRates.length > 0 && (
            <Card padding="sm" className="mt-6">
              <button
                onClick={() => setWinRatesExpanded(!winRatesExpanded)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-xs font-medium text-[#8b7355]">
                  Win rates
                </span>
                <span className="text-[#8b7355] text-sm">
                  {winRatesExpanded ? "▼" : "▶"}
                </span>
              </button>
              {winRatesExpanded && (
                <div className="space-y-3 mt-3 pt-3 border-t border-[#e8ddd0]">
                  {winRates.map((w) => (
                    <div key={w.label} className="space-y-1">
                      <div className="flex justify-between text-sm items-center gap-2">
                        <span className="text-[#1a0f0a] font-medium truncate">
                          {w.label}
                        </span>
                        {w.rarity && (
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded text-xs ${rarityColor(w.rarity)}`}
                          >
                            {w.rarity}
                          </span>
                        )}
                        <span className="font-medium shrink-0 text-[#c41e3a]">
                          {w.rate}%
                        </span>
                      </div>
                      {w.microcopy && (
                        <p className="text-xs text-[#8b7355] pl-0">
                          {w.microcopy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      </div>
      )}
    </div>
  )
}
