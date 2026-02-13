"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getOrCreateGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";

export default function DrinksPage() {
  const router = useRouter();
  const [drinkCount, setDrinkCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const guestId = getOrCreateGuestId();
    const supabase = createClient();
    supabase
      .from("guests")
      .select("drink_count")
      .eq("guest_id", guestId)
      .single()
      .then(({ data }) => {
        if (data) setDrinkCount((data as { drink_count: number }).drink_count ?? 0);
        setLoading(false);
      });
  }, []);

  async function addDrink() {
    setSaving(true);
    const guestId = getOrCreateGuestId();
    const supabase = createClient();
    const newCount = drinkCount + 1;
    await supabase
      .from("guests")
      .update({
        drink_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq("guest_id", guestId);
    setDrinkCount(newCount);
    setSaving(false);
  }

  const nextPickAt = 10 - (drinkCount % 10);
  const hasEarnedPick = drinkCount > 0 && drinkCount % 10 === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[#5c4033]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1a0f0a]">
        My drinks
      </h1>

      <Card className="text-center">
        <p className="text-6xl font-bold text-[#c41e3a]">{drinkCount}</p>
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

      <Card padding="sm">
        <p className="text-sm text-[#5c4033]">
          {hasEarnedPick ? (
            <>
              🎉 You earned another red envelope pick!{" "}
              <a href="/checkin/envelope" className="text-[#c41e3a] font-medium underline">
                Pick now
              </a>
            </>
          ) : (
            <>
              {nextPickAt} more drink{nextPickAt !== 1 ? "s" : ""} until another envelope pick
            </>
          )}
        </p>
      </Card>

      <button
        onClick={() => router.back()}
        className="text-[#8b7355] text-sm"
      >
        ← Back
      </button>
    </div>
  );
}
