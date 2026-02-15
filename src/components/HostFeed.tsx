"use client";

import { useCallback, useEffect, useState } from "react";
import { PostCard, type PostWithMeta } from "@/components/PostCard";
import { PollCard, type PollWithMeta } from "@/components/PollCard";
import { getGuestId, getAdminGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";

type FeedItem =
  | { type: "post"; id: string; created_at: string; data: PostWithMeta }
  | { type: "poll"; id: string; created_at: string; data: PollWithMeta };

export function HostFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);

  const fetchHostFeed = useCallback(() => {
    const supabase = createClient();
    const adminGuestId = getAdminGuestId();
    const guestId = getGuestId();

    Promise.all([
      supabase
        .from("posts")
        .select("id, guest_id, message, photo_urls, created_at")
        .eq("guest_id", adminGuestId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("polls")
        .select("id, guest_id, question, created_at")
        .eq("guest_id", adminGuestId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]).then(async ([postsRes, pollsRes]) => {
      const postsData = (postsRes.data || []) as {
        id: string;
        guest_id: string;
        message: string;
        photo_urls: string[];
        created_at: string;
      }[];
      const pollsData = (pollsRes.data || []) as {
        id: string;
        guest_id: string;
        question: string;
        created_at: string;
      }[];

      let postsMeta: PostWithMeta[] = [];
      if (postsData.length > 0) {
        const [guestsRes, likesRes, commentsRes] = await Promise.all([
          supabase.from("guests").select("guest_id, name, avatar_url").eq("guest_id", adminGuestId),
          supabase.from("post_likes").select("post_id, guest_id").in("post_id", postsData.map((p) => p.id)),
          supabase.from("post_comments").select("id, post_id, guest_id, message, created_at").in("post_id", postsData.map((p) => p.id)).order("created_at", { ascending: true }),
        ]);
        const guestMap = Object.fromEntries(((guestsRes.data || []) as { guest_id: string; name: string; avatar_url: string | null }[]).map((n) => [n.guest_id, n]));
        const likesList = (likesRes.data || []) as { post_id: string; guest_id: string }[];
        const commentsList = (commentsRes.data || []) as { id: string; post_id: string; guest_id: string; message: string; created_at: string }[];
        const commenterIds = [...new Set(commentsList.map((c) => c.guest_id))];
        const { data: commenterData } = commenterIds.length > 0
          ? await supabase.from("guests").select("guest_id, name, avatar_url").in("guest_id", commenterIds)
          : { data: [] };
        const commenterMap = Object.fromEntries(((commenterData || []) as { guest_id: string; name: string; avatar_url: string | null }[]).map((n) => [n.guest_id, { name: n.name, avatar_url: n.avatar_url }]));

        postsMeta = postsData.map((x) => ({
          ...x,
          guest_name: guestMap[x.guest_id]?.name ?? "Host",
          guest_avatar: guestMap[x.guest_id]?.avatar_url ?? null,
          like_count: likesList.filter((l) => l.post_id === x.id).length,
          liked_by_me: guestId ? likesList.some((l) => l.post_id === x.id && l.guest_id === guestId) : false,
          comments: commentsList.filter((c) => c.post_id === x.id).map((c) => {
            const cm = commenterMap[c.guest_id];
            return { id: c.id, guest_name: cm?.name ?? "Someone", guest_avatar: cm?.avatar_url ?? null, message: c.message, created_at: c.created_at };
          }),
        }));
      }

      let pollsMeta: PollWithMeta[] = [];
      if (pollsData.length > 0) {
        const [optsRes, votesRes, pollGuestsRes] = await Promise.all([
          supabase.from("poll_options").select("id, poll_id, label, sort_order").in("poll_id", pollsData.map((p) => p.id)).order("sort_order", { ascending: true }),
          supabase.from("poll_votes").select("poll_id, option_id, guest_id").in("poll_id", pollsData.map((p) => p.id)),
          supabase.from("guests").select("guest_id, name, avatar_url").eq("guest_id", adminGuestId),
        ]);
        const optionsList = (optsRes.data || []) as { id: string; poll_id: string; label: string; sort_order: number }[];
        const votesList = (votesRes.data || []) as { poll_id: string; option_id: string; guest_id: string }[];
        const pollGuestMap = Object.fromEntries(((pollGuestsRes.data || []) as { guest_id: string; name: string; avatar_url: string | null }[]).map((n) => [n.guest_id, n]));
        const voteCountByOption = votesList.reduce((acc, v) => { acc[v.option_id] = (acc[v.option_id] ?? 0) + 1; return acc; }, {} as Record<string, number>);
        const myVoteByPoll = guestId ? Object.fromEntries(votesList.filter((v) => v.guest_id === guestId).map((v) => [v.poll_id, v.option_id])) : {};

        pollsMeta = pollsData.map((poll) => ({
          id: poll.id,
          question: poll.question,
          guest_id: poll.guest_id,
          guest_name: pollGuestMap[poll.guest_id]?.name ?? "Host",
          guest_avatar: pollGuestMap[poll.guest_id]?.avatar_url ?? null,
          created_at: poll.created_at,
          options: optionsList.filter((o) => o.poll_id === poll.id).map((o) => ({ id: o.id, label: o.label, vote_count: voteCountByOption[o.id] ?? 0 })),
          voted_option_id: myVoteByPoll[poll.id] ?? null,
        }));
      }

      const postItems = postsMeta.map((p) => ({ type: "post" as const, id: p.id, created_at: p.created_at, data: p }));
      const pollItems = pollsMeta.map((p) => ({ type: "poll" as const, id: p.id, created_at: p.created_at, data: p }));
      setItems([...postItems, ...pollItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    });
  }, []);

  useEffect(() => {
    const guestId = getGuestId();
    if (!guestId) {
      fetchHostFeed();
      return;
    }
    const supabase = createClient();
    supabase
      .from("guests")
      .select("name")
      .eq("guest_id", guestId)
      .single()
      .then(({ data }) => {
        setCheckedIn(!!(data as { name?: string } | null)?.name);
      });
    fetchHostFeed();
  }, [fetchHostFeed]);

  if (items.length === 0) return null;

  return (
    <div className="w-full mt-8 space-y-4 animate-fade-in-up">
      <p className="text-footnote text-[#8b7355] font-medium">From the host</p>
      {items.map((item) =>
        item.type === "post" ? (
          <PostCard key={`post-${item.id}`} post={item.data} onLikeChange={fetchHostFeed} onCommentAdd={fetchHostFeed} readOnly={!checkedIn} />
        ) : (
          <PollCard key={`poll-${item.id}`} poll={item.data} onVote={fetchHostFeed} readOnly={!checkedIn} />
        )
      )}
    </div>
  );
}
