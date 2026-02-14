"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

type Message = { name: string; message_to_ralph: string | null };

export default function AdminPage() {
  const [ralphDrinks, setRalphDrinks] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("party_state").select("ralph_drink_count").limit(1).single(),
      supabase.from("guests").select("name, message_to_ralph").order("created_at", { ascending: false }),
    ]).then(([r, m]) => {
      if (r.data) setRalphDrinks((r.data as { ralph_drink_count: number }).ralph_drink_count);
      setMessages((m.data || []) as Message[]);
      setLoading(false);
    });
  }, []);

  async function addRalphDrink() {
    setSaving(true);
    const supabase = createClient();
    const { data: existing } = await supabase.from("party_state").select("id, ralph_drink_count").limit(1).single();
    if (existing) {
      const current = (existing as { ralph_drink_count: number }).ralph_drink_count;
      await supabase
        .from("party_state")
        .update({ ralph_drink_count: current + 1, updated_at: new Date().toISOString() })
        .eq("id", (existing as { id: string }).id);
      setRalphDrinks(current + 1);
    } else {
      await supabase.from("party_state").insert({ ralph_drink_count: 1 });
      setRalphDrinks(1);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-[#5c4033]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-6 py-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[#1a0f0a] mb-2">
        Host mode
      </h1>
      <p className="text-[#8b7355] text-sm mb-6">
        /admin — hidden URL
      </p>

      <Card className="mb-6">
        <p className="text-sm text-[#8b7355] mb-1">Ralph&apos;s drink tally</p>
        <p className="text-4xl font-bold text-[#c41e3a]">{ralphDrinks}</p>
        <Button
          variant="primary"
          size="md"
          className="mt-3"
          onClick={addRalphDrink}
          disabled={saving}
        >
          + Add drink
        </Button>
      </Card>

      <Card>
        <p className="text-sm text-[#8b7355] mb-3">Messages to Ralph</p>
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <li className="text-[#8b7355] text-sm">No messages yet</li>
          ) : (
            messages.map((m, i) => (
              <li key={i} className="border-b border-[#e8ddd0] pb-3 last:border-0">
                <p className="font-medium text-[#1a0f0a]">{m.name}</p>
                <p className="text-[#5c4033] text-sm mt-1">
                  {m.message_to_ralph || "—"}
                </p>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
