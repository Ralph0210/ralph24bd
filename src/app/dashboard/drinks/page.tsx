"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { getOrCreateGuestId } from "@/lib/guest-id"
import { createClient } from "@/lib/supabase/client"

const COUNTER_ANIMATION_MS = 520

export default function DrinksPage() {
  const router = useRouter()
  const [drinkCount, setDrinkCount] = useState(0)
  const [prevCount, setPrevCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const clearPrevRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const guestId = getOrCreateGuestId()
    const supabase = createClient()
    supabase
      .from("guests")
      .select("drink_count")
      .eq("guest_id", guestId)
      .single()
      .then(({ data }) => {
        if (data)
          setDrinkCount((data as { drink_count: number }).drink_count ?? 0)
        setLoading(false)
      })
  }, [])

  useEffect(() => () => {
    if (clearPrevRef.current) clearTimeout(clearPrevRef.current)
  }, [])

  async function addDrink() {
    setSaving(true)
    const guestId = getOrCreateGuestId()
    const supabase = createClient()
    const oldCount = drinkCount
    const newCount = oldCount + 1
    await supabase
      .from("guests")
      .update({
        drink_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq("guest_id", guestId)
    setPrevCount(oldCount)
    setDrinkCount(newCount)
    setSaving(false)
    if (clearPrevRef.current) clearTimeout(clearPrevRef.current)
    clearPrevRef.current = setTimeout(() => {
      setPrevCount(null)
      clearPrevRef.current = null
    }, COUNTER_ANIMATION_MS)
    if (newCount > 0 && newCount % 5 === 0) {
      setTimeout(() => router.replace("/checkin/envelope"), 600)
    }
  }

  const nextPickAt = 5 - (drinkCount % 5)

  if (loading) {
    return (
      <div className="max-w-sm mx-auto space-y-8 py-4">
        <div className="h-9 w-40 rounded-[14px] bg-[#e8ddd0]/50 animate-skeleton" />
        <div className="h-32 rounded-[20px] bg-[#e8ddd0]/40 animate-skeleton" />
        <div className="h-20 rounded-[20px] bg-[#e8ddd0]/40 animate-skeleton" />
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto space-y-8 animate-page-enter">
      <h1 className="text-title text-[#1a0f0a] animate-fade-in-up">My drinks</h1>

      <Card className="text-center tap-scale animate-fade-in-up animate-fade-in-up-delay-1">
        <div className="relative h-16 overflow-hidden">
          {prevCount !== null && (
            <span
              className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-[#c41e3a] animate-drink-counter-out"
              aria-hidden
            >
              {prevCount}
            </span>
          )}
          <span
            className={`absolute inset-0 flex items-center justify-center text-6xl font-bold text-[#c41e3a] ${
              prevCount !== null ? "animate-drink-counter-in" : ""
            }`}
          >
            {drinkCount}
          </span>
        </div>
        <p className="text-[#5c4033] mt-1">drinks</p>
      </Card>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={addDrink}
        disabled={saving}
      >
        + Add drink
      </Button>

      <Card padding="sm" className="animate-fade-in-up animate-fade-in-up-delay-2 tap-scale">
        <p className="text-footnote text-[#5c4033]">
          {nextPickAt === 5 ? (
            <>Every 5 drinks you get an envelope pick</>
          ) : (
            <>
              {nextPickAt} more drink{nextPickAt !== 1 ? "s" : ""} until another
              envelope pick
            </>
          )}
        </p>
      </Card>
    </div>
  )
}
