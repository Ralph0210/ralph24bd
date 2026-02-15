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
  if (r === "legendary") return "bg-amber-500/12 text-amber-700"
  if (r === "rare") return "bg-blue-500/12 text-blue-700"
  if (r === "epic") return "bg-purple-500/12 text-purple-700"
  return "bg-black/[0.06] text-[#5c4033]"
}

function rarityBadgeApple(rarity: string): string {
  const r = rarity.toLowerCase()
  if (r === "legendary") return "bg-amber-500/15 text-amber-800"
  if (r === "rare") return "bg-blue-500/15 text-blue-800"
  if (r === "epic") return "bg-purple-500/15 text-purple-800"
  return "bg-black/[0.08] text-[#5c4033]"
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
      ? ["#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7", "#fde047", "#facc15"]
      : rarity?.toLowerCase() === "rare"
        ? ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]
        : rarity?.toLowerCase() === "epic"
          ? ["#7c3aed", "#9333ea", "#a855f7", "#c084fc", "#e9d5ff"]
          : ["#c41e3a", "#b91c1c", "#d4af37", "#fbbf24", "#f4e4a6", "#fef08a"]
  const baseCount = rarity?.toLowerCase() === "legendary" ? 320 : 220
  const scalar = rarity?.toLowerCase() === "legendary" ? 1.6 : 1.4

  confetti({
    particleCount: baseCount,
    spread: 120,
    origin: { y: 0.5 },
    colors,
    startVelocity: 42,
    scalar,
    drift: 0.7,
    ticks: 300,
  })
  confetti({
    particleCount: Math.floor(baseCount * 0.85),
    spread: 110,
    origin: { y: 0.45, x: 0.5 },
    colors,
    startVelocity: 48,
    scalar: scalar * 1.05,
    drift: 0.6,
    ticks: 280,
  })
  setTimeout(() => {
    confetti({
      particleCount: 120,
      angle: 65,
      spread: 70,
      origin: { x: 0.15, y: 0.55 },
      colors,
      startVelocity: 36,
      scalar,
      ticks: 260,
    })
    confetti({
      particleCount: 120,
      angle: 115,
      spread: 70,
      origin: { x: 0.85, y: 0.55 },
      colors,
      startVelocity: 36,
      scalar,
      ticks: 260,
    })
  }, 80)
  setTimeout(() => {
    confetti({
      particleCount: 100,
      angle: 90,
      spread: 100,
      origin: { x: 0.5, y: 0.88 },
      colors,
      startVelocity: 32,
      scalar,
      ticks: 250,
    })
  }, 200)
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

  useEffect(() => {
    if (!revealedPrize) return
    const id = setTimeout(() => fireFireworks(revealedPrize.rarity), 1500)
    return () => clearTimeout(id)
  }, [revealedPrize])

  async function handlePick(index: number) {
    if (selectedIndex !== null) return
    setSelectedIndex(index)
    const prize = pool[index]
    setRevealedPrize(prize)

    sessionStorage.setItem(REVEALED_STORAGE_KEY, JSON.stringify(prize))

    const guestId = getOrCreateGuestId()
    const supabase = createClient()
    await supabase.from("guests").upsert(
      {
        guest_id: guestId,
        name: "Guest",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guest_id", ignoreDuplicates: true },
    )
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
      <div className="min-h-dvh px-6 py-10 max-w-sm mx-auto space-y-6">
        <div className="h-9 w-40 rounded-[14px] bg-[#e8ddd0]/50 animate-skeleton" />
        <div className="h-64 rounded-[20px] bg-[#e8ddd0]/40 animate-skeleton" />
        <div className="h-16 rounded-[14px] bg-[#e8ddd0]/40 animate-skeleton w-3/4" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh px-6 py-10 relative overflow-hidden animate-page-enter">
      {showBackWarning &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed top-4 left-4 right-4 z-[9999] bg-[#1a0f0a] text-white text-sm text-center py-3 px-4 rounded-xl shadow-lg mx-4">
            Haha gotcha cheater! Use &quot;Back to party&quot; below to leave
            this page
          </div>,
          document.body,
        )}
      {revealedPrize &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9998] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden scrollbar-hide"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            aria-modal
            aria-label="Prize revealed"
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
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center flex-1 min-h-0 overflow-visible">
              {/* Top spacer - larger to push prize card toward vertical center */}
              <div className="flex-[2] min-h-[8vh] shrink-0" aria-hidden />
              {/* Prize card - emerges from envelope after it opens */}
              <div className="w-full aspect-[52/72] max-w-xs mx-auto relative z-10 animate-card-pull-out mb-3 flex-shrink-0 overflow-visible rounded-[20px]">
                <div className="prize-card-apple h-full flex flex-col justify-center p-5 sm:p-6 text-center relative overflow-hidden">
                  {/* Arrival shine - subtle sweep when card lands */}
                  <div
                    className="absolute inset-0 animate-prize-arrival-shine z-[1] rounded-[20px]"
                    aria-hidden
                  />
                  {revealedPrize.rarity && (
                    <span
                      className={`inline-block px-3 py-1.5 rounded-[10px] text-[11px] font-semibold tracking-[0.02em] uppercase mb-4 animate-prize-stagger-2 w-fit mx-auto ${rarityBadgeApple(revealedPrize.rarity)}`}
                    >
                      {revealedPrize.rarity}
                    </span>
                  )}
                  <p className="text-subhead text-[#8b7355] mb-2 animate-prize-stagger-2 tracking-[-0.01em]">
                    You got
                  </p>
                  <p className="text-headline sm:text-title font-bold text-[#c41e3a] mb-3 animate-prize-stagger-3 tracking-[-0.02em] leading-tight">
                    {revealedPrize.label}
                  </p>
                  {revealedPrize.microcopy && (
                    <p className="text-footnote text-[#5c4033] leading-relaxed animate-prize-stagger-4">
                      {revealedPrize.microcopy}
                    </p>
                  )}
                  <p className="text-footnote text-[#c41e3a] font-medium mt-4 mb-5 animate-prize-stagger-4">
                    Show this to Ralph and claim your prize!
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="animate-prize-stagger-4 min-h-[52px] shrink-0 rounded-[14px] font-semibold"
                    onClick={handleGoToDashboard}
                  >
                    Back to party
                  </Button>
                </div>
              </div>

              {/* Envelope: rectangle (static) + triangle on top grows downward */}
              <div className="relative w-full aspect-[52/72] max-w-xs mx-auto shrink-0 animate-envelope-arrive z-10 -mt-20 overflow-hidden">
                {/* Rectangle body - fixed size & position, never changes */}
                <div
                  className={`absolute left-0 right-0 top-[20%] bottom-0 rounded-b-[6px] bg-[#c41e3a] border-2 border-t-0 border-[#9e1830] flex flex-col items-center justify-center ${revealedPrize.rarity?.toLowerCase() !== "rare" ? rarityShineClass(revealedPrize.rarity) : "envelope-shine-common"}`}
                >
                  {/* Fold line where flap meets body - appears when open */}
                  <div
                    className="absolute left-0 right-0 top-0 h-px bg-[#9e1830]/40 z-[5] animate-envelope-flap-line pointer-events-none"
                    aria-hidden
                  />
                  <span className="text-white font-bold text-3xl sm:text-4xl z-10">
                    福
                  </span>
                  <span className="text-white/90 font-medium text-xs sm:text-sm z-10 mt-0.5">
                    Good Fortune
                  </span>
                </div>
                {/* Triangle flap - SVG path with smooth bezier curve at tip */}
                <svg
                  className={`absolute left-0 right-0 top-0 h-[20%] w-full animate-envelope-flap-grow`}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M 0 100 L 42 8 Q 50 0 58 8 L 100 100 Z"
                    fill="#c41e3a"
                  />
                </svg>
              </div>
              {/* Bottom spacer - balances layout */}
              <div className="flex-1 min-h-[8vh] shrink-0" aria-hidden />
            </div>
          </div>,
          document.body,
        )}
      {/* Background layer - behind all content */}
      <div className="absolute inset-0 z-0" aria-hidden />
      {!revealedPrize && (
        <div className="max-w-sm mx-auto relative z-10">
          <h1 className="text-title text-[#1a0f0a] mb-6 text-center animate-fade-in-up">
            Pick a red envelope
          </h1>
          <p className="text-subhead text-[#8b7355] text-center mb-4 animate-fade-in-up animate-fade-in-up-delay-1">
            Swipe to browse · tap to pick
          </p>

          <>
            <div
              ref={scrollRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 -mx-2 scrollbar-hide snap-x snap-mandatory touch-pan-x cursor-grab active:cursor-grabbing select-none [contain:layout_paint] animate-fade-in-up animate-fade-in-up-delay-2"
            >
              {pool.map((_, i) => (
                <div
                  key={i}
                  data-envelope-index={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => handlePick(i)}
                  onKeyDown={(e) => e.key === "Enter" && handlePick(i)}
                  className="shrink-0 w-52 h-80 sm:w-60 sm:h-96 rounded-xl border-2 border-[#9e1830] flex flex-col items-center justify-center text-white font-bold snap-center active:scale-[0.96] transition-[transform] duration-150 ease-out shadow-lg overflow-hidden relative bg-[#c41e3a] envelope-shine-common cursor-pointer touch-manipulation"
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
                  className="w-full flex items-center justify-between text-left touch-manipulation min-h-[44px] -my-1 py-1"
                >
                  <span className="text-footnote font-medium text-[#8b7355]">
                    Win rates
                  </span>
                  <span
                    className={`text-[#8b7355] transition-transform duration-300 ${winRatesExpanded ? "rotate-90" : ""}`}
                  >
                    ▶
                  </span>
                </button>
                <div
                  className={`expandable-section ${winRatesExpanded ? "expanded" : ""}`}
                >
                  <div className="expandable-section-inner">
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
                  </div>
                </div>
              </Card>
            )}
          </>
        </div>
      )}
    </div>
  )
}
