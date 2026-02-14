"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { getGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";

export type PollWithMeta = {
  id: string;
  question: string;
  guest_id: string;
  guest_name: string;
  guest_avatar: string | null;
  created_at: string;
  options: { id: string; label: string; vote_count: number }[];
  voted_option_id?: string | null;
};

interface PollCardProps {
  poll: PollWithMeta;
  onVote?: () => void;
  overrideGuestId?: string | null;
}

export function PollCard({ poll, onVote, overrideGuestId }: PollCardProps) {
  const defaultGuestId = getGuestId();
  const guestId = overrideGuestId ?? defaultGuestId;
  const [votedOptionId, setVotedOptionId] = useState<string | null>(
    poll.voted_option_id ?? null,
  );
  const [optionCounts, setOptionCounts] = useState(
    () => new Map(poll.options.map((o) => [o.id, o.vote_count])),
  );
  const totalVotes = [...optionCounts.values()].reduce((a, b) => a + b, 0);

  async function vote(optionId: string) {
    if (!guestId || votedOptionId === optionId) return;
    const supabase = createClient();
    if (!poll.options.some((o) => o.id === optionId)) return;

    const { error } = await supabase
      .from("poll_votes")
      .upsert(
        {
          poll_id: poll.id,
          option_id: optionId,
          guest_id: guestId,
        },
        { onConflict: "poll_id,guest_id" },
      );
    if (error) return;

    setOptionCounts((prev) => {
      const next = new Map(prev);
      if (votedOptionId) {
        next.set(votedOptionId, Math.max(0, (next.get(votedOptionId) ?? 0) - 1));
      }
      next.set(optionId, (next.get(optionId) ?? 0) + 1);
      return next;
    });
    setVotedOptionId(optionId);
    onVote?.();
  }

  const timeStr = new Date(poll.created_at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card className="overflow-hidden" padding="none">
      <div className="p-4">
        <div className="flex gap-3 mb-3">
          <Avatar src={poll.guest_avatar} name={poll.guest_name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#1a0f0a] text-[15px]">
              {poll.guest_name}
            </p>
            <p className="text-caption text-[#8b7355]">{timeStr}</p>
          </div>
        </div>
        <p className="text-body text-[#1a0f0a] font-medium mb-4">
          {poll.question}
        </p>
        <div className="space-y-2">
          {poll.options.map((opt) => {
            const count = optionCounts.get(opt.id) ?? 0;
            const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
            const isVoted = votedOptionId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => vote(opt.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  isVoted
                    ? "border-[#c41e3a] bg-[#c41e3a]/5"
                    : "border-[#e8ddd0] hover:border-[#c41e3a]/40"
                } active:scale-[0.99]`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[#1a0f0a] font-medium">{opt.label}</span>
                  {votedOptionId && (
                    <span className="text-footnote text-[#8b7355]">
                      {totalVotes > 0 ? Math.round(pct) : 0}% • {count} vote
                      {count !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {votedOptionId && totalVotes > 0 && (
                  <div className="mt-2 h-1.5 rounded-full bg-[#e8ddd0]/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#c41e3a] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
