"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getOrCreateGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";

export default function NameAndMessagePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const guestId = getOrCreateGuestId();
    if (!guestId) return;
    const supabase = createClient();
    supabase
      .from("guests")
      .select("envelope_picks_used")
      .eq("guest_id", guestId)
      .single()
      .then(({ data }) => {
        if (data && ((data as { envelope_picks_used: number }).envelope_picks_used ?? 0) > 0) {
          router.replace("/dashboard");
        }
      });
  }, [router]);

  async function handleSeal() {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    setError("");
    const guestId = getOrCreateGuestId();
    const supabase = createClient();
    const { error: err } = await supabase.from("guests").upsert(
      {
        guest_id: guestId,
        name: name.trim(),
        message_to_ralph: message.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guest_id" }
    );
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/checkin/zodiac");
  }

  return (
    <div className="min-h-dvh px-6 py-10">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-[#1a0f0a] mb-6">
          Welcome!
        </h1>
        <Card className="mb-6">
          <label className="block text-sm font-medium text-[#5c4033] mb-2">
            Name (required)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full h-12 px-4 rounded-xl border border-[#e8ddd0] bg-white text-[#1a0f0a] placeholder:text-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/30 mb-4"
          />
          <label className="block text-sm font-medium text-[#5c4033] mb-2">
            Message to Ralph
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Wish, first impression, roast Ralph..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[#e8ddd0] bg-white text-[#1a0f0a] placeholder:text-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/30 resize-none"
          />
          <p className="text-xs text-[#8b7355] mt-2">
            Your message may be read aloud before cake cutting
          </p>
        </Card>
        {error && (
          <p className="text-[#c41e3a] text-sm mb-4">{error}</p>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSeal}
          disabled={loading}
        >
          Seal my message
        </Button>
      </div>
    </div>
  );
}
