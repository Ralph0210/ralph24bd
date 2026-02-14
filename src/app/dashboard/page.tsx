"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Avatar } from "@/components/ui/Avatar"
import { Wine, Mail, Trophy, MessageCircle, ChevronRight } from "lucide-react"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"
import { PostCard, type PostWithMeta } from "@/components/PostCard"
import { PollCard, type PollWithMeta } from "@/components/PollCard"
import { getGuestId } from "@/lib/guest-id"
import { createClient } from "@/lib/supabase/client"

export default function DashboardHomePage() {
  const [guest, setGuest] = useState<{
    name: string
    avatar_url: string | null
    zodiac_sign: string | null
    envelope_picks_used: number
    drink_count: number
  } | null>(null)
  const [ralphDrinks, setRalphDrinks] = useState(0)
  const [myPrizes, setMyPrizes] = useState<
    { prize_label: string; prize_rarity: string | null }[]
  >([])
  const [partyPicks, setPartyPicks] = useState<
    { name: string; prize_label: string }[]
  >([])
  const [feedItems, setFeedItems] = useState<
    Array<
      | { type: "post"; id: string; created_at: string; data: PostWithMeta }
      | { type: "poll"; id: string; created_at: string; data: PollWithMeta }
    >
  >([])
  const [envelopesExpanded, setEnvelopesExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    const guestId = getGuestId()
    if (!guestId) return
    const supabase = createClient()
    Promise.all([
      supabase
        .from("guests")
        .select(
          "name, avatar_url, zodiac_sign, envelope_picks_used, drink_count",
        )
        .eq("guest_id", guestId)
        .single(),
      supabase
        .from("party_state")
        .select("ralph_drink_count")
        .limit(1)
        .single(),
      supabase
        .from("prize_picks")
        .select("guest_id, prize_label, prize_rarity")
        .order("picked_at", { ascending: false })
        .limit(50),
      supabase
        .from("posts")
        .select("id, guest_id, message, photo_urls, created_at")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("polls")
        .select("id, guest_id, question, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]).then(async ([g, r, p, postsRes, pollsRes]) => {
      if (g.error) console.error("[dashboard] guests fetch:", g.error)
      if (r.error) console.error("[dashboard] party_state fetch:", r.error)
      if (p.error) console.error("[dashboard] prize_picks fetch:", p.error)
      if (postsRes.error)
        console.error("[dashboard] posts fetch:", postsRes.error)
      if (pollsRes?.error)
        console.error("[dashboard] polls fetch:", pollsRes.error)
      if (g.data) setGuest(g.data as typeof guest)
      if (r.data)
        setRalphDrinks(
          (r.data as { ralph_drink_count: number }).ralph_drink_count,
        )
      const picks = (p.data || []) as {
        guest_id: string
        prize_label: string
        prize_rarity: string | null
      }[]
      if (picks.length > 0) {
        setMyPrizes(
          picks
            .filter((x) => x.guest_id === guestId)
            .map((x) => ({
              prize_label: x.prize_label,
              prize_rarity: x.prize_rarity,
            })),
        )
        const ids = [...new Set(picks.map((x) => x.guest_id))]
        const { data: guestsData } = await supabase
          .from("guests")
          .select("name, guest_id")
          .in("guest_id", ids)
        const names = (guestsData || []) as { name: string; guest_id: string }[]
        const map = Object.fromEntries(names.map((n) => [n.guest_id, n.name]))
        setPartyPicks(
          picks.map((x) => ({
            name: map[x.guest_id] || "Someone",
            prize_label: x.prize_label,
          })),
        )
      }
      const postsData = (postsRes.data || []) as {
        id: string
        guest_id: string
        message: string
        photo_urls: string[]
        created_at: string
      }[]
      let postsMeta: PostWithMeta[] = []
      if (postsData.length > 0) {
        const guestIds = [...new Set(postsData.map((x) => x.guest_id))]
        const [guestsRes, likesRes, commentsRes] = await Promise.all([
          supabase
            .from("guests")
            .select("guest_id, name, avatar_url")
            .in("guest_id", guestIds),
          supabase
            .from("post_likes")
            .select("post_id, guest_id")
            .in(
              "post_id",
              postsData.map((p) => p.id),
            ),
          supabase
            .from("post_comments")
            .select("id, post_id, guest_id, message, created_at")
            .in(
              "post_id",
              postsData.map((p) => p.id),
            )
            .order("created_at", { ascending: true }),
        ])
        const guestMap = Object.fromEntries(
          (
            (guestsRes.data || []) as {
              guest_id: string
              name: string
              avatar_url: string | null
            }[]
          ).map((n) => [n.guest_id, n]),
        )
        const likesList = (likesRes.data || []) as {
          post_id: string
          guest_id: string
        }[]
        const commentsList = (commentsRes.data || []) as {
          id: string
          post_id: string
          guest_id: string
          message: string
          created_at: string
        }[]
        const commenterIds = [...new Set(commentsList.map((c) => c.guest_id))]
        const { data: commenterData } = await supabase
          .from("guests")
          .select("guest_id, name, avatar_url")
          .in("guest_id", commenterIds)
        const commenterMap = Object.fromEntries(
          (
            (commenterData || []) as {
              guest_id: string
              name: string
              avatar_url: string | null
            }[]
          ).map((n) => [
            n.guest_id,
            { name: n.name, avatar_url: n.avatar_url },
          ]),
        )

        postsMeta = postsData.map((x) => {
          const postLikes = likesList.filter((l) => l.post_id === x.id)
          const postComments = commentsList
            .filter((c) => c.post_id === x.id)
            .map((c) => {
              const cm = commenterMap[c.guest_id]
              return {
                id: c.id,
                guest_name: cm?.name ?? "Someone",
                guest_avatar: cm?.avatar_url ?? null,
                message: c.message,
                created_at: c.created_at,
              }
            })
          return {
            ...x,
            guest_name: guestMap[x.guest_id]?.name ?? "Someone",
            guest_avatar: guestMap[x.guest_id]?.avatar_url ?? null,
            like_count: postLikes.length,
            liked_by_me: guestId
              ? postLikes.some((l) => l.guest_id === guestId)
              : false,
            comments: postComments,
          }
        })
      }

      const pollsData = (pollsRes?.data || []) as {
        id: string
        guest_id: string
        question: string
        created_at: string
      }[]
      let pollsMeta: PollWithMeta[] = []
      if (pollsData.length > 0) {
        const pollIds = pollsData.map((p) => p.id)
        const [optsRes, votesRes, pollGuestsRes] = await Promise.all([
          supabase
            .from("poll_options")
            .select("id, poll_id, label, sort_order")
            .in("poll_id", pollIds)
            .order("sort_order", { ascending: true }),
          supabase
            .from("poll_votes")
            .select("poll_id, option_id, guest_id")
            .in("poll_id", pollIds),
          supabase
            .from("guests")
            .select("guest_id, name, avatar_url")
            .in("guest_id", pollsData.map((p) => p.guest_id)),
        ])
        const optionsList = (optsRes.data || []) as {
          id: string
          poll_id: string
          label: string
          sort_order: number
        }[]
        const votesList = (votesRes.data || []) as {
          poll_id: string
          option_id: string
          guest_id: string
        }[]
        const pollGuestMap = Object.fromEntries(
          (
            (pollGuestsRes.data || []) as {
              guest_id: string
              name: string
              avatar_url: string | null
            }[]
          ).map((n) => [n.guest_id, n]),
        )
        const voteCountByOption = votesList.reduce(
          (acc, v) => {
            acc[v.option_id] = (acc[v.option_id] ?? 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )
        const myVoteByPoll = guestId
          ? Object.fromEntries(
              votesList
                .filter((v) => v.guest_id === guestId)
                .map((v) => [v.poll_id, v.option_id]),
            )
          : {}

        pollsMeta = pollsData.map((poll) => {
          const opts = optionsList
            .filter((o) => o.poll_id === poll.id)
            .map((o) => ({
              id: o.id,
              label: o.label,
              vote_count: voteCountByOption[o.id] ?? 0,
            }))
          const guestInfo = pollGuestMap[poll.guest_id]
          return {
            id: poll.id,
            question: poll.question,
            guest_id: poll.guest_id,
            guest_name: guestInfo?.name ?? "Someone",
            guest_avatar: guestInfo?.avatar_url ?? null,
            created_at: poll.created_at,
            options: opts,
            voted_option_id: myVoteByPoll[poll.id] ?? null,
          }
        })
      }

      const postItems = postsMeta.map((p) => ({
        type: "post" as const,
        id: p.id,
        created_at: p.created_at,
        data: p,
      }))
      const pollItems = pollsMeta.map((p) => ({
        type: "poll" as const,
        id: p.id,
        created_at: p.created_at,
        data: p,
      }))
      const merged = [...postItems, ...pollItems].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      setFeedItems(merged)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchData()
    const handler = () => fetchData()
    window.addEventListener("posts-created", handler)
    return () => window.removeEventListener("posts-created", handler)
  }, [fetchData])

  const canPickAgain = guest
    ? 1 + Math.floor((guest.drink_count || 0) / 5) >
      (guest.envelope_picks_used || 0)
    : false

  function rarityColor(rarity: string): string {
    const r = rarity.toLowerCase()
    if (r === "legendary") return "bg-amber-500/12 text-amber-700"
    if (r === "rare") return "bg-blue-500/12 text-blue-700"
    if (r === "epic") return "bg-purple-500/12 text-purple-700"
    return "bg-black/[0.06] text-[#5c4033]"
  }

  if (loading) {
    return (
      <div className="max-w-sm mx-auto space-y-8 py-4">
        <div className="h-9 w-48 rounded-[14px] bg-[#e8ddd0]/50 animate-skeleton" />
        <div className="h-24 rounded-[20px] bg-[#e8ddd0]/40 animate-skeleton" />
        <div className="h-24 rounded-[20px] bg-[#e8ddd0]/40 animate-skeleton" />
        <div className="h-32 rounded-[20px] bg-[#e8ddd0]/40 animate-skeleton" />
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto space-y-8 animate-page-enter">
      <div className="flex items-center gap-3 animate-fade-in-up">
        <Avatar src={guest?.avatar_url} name={guest?.name} size="md" />
        <div>
          <h1 className="text-title text-[#1a0f0a]">
            Hey {guest?.name || "there"}
          </h1>
          <p className="text-footnote text-[#8b7355]">Thx for coming!</p>
        </div>
      </div>

      <Card className="animate-fade-in-up animate-fade-in-up-delay-1 tap-scale">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#c41e3a]/10 flex items-center justify-center">
            <Wine className="size-5 text-[#c41e3a]" />
          </div>
          <p className="text-footnote text-[#8b7355]">Ralph&apos;s tally</p>
        </div>
        <AnimatedCounter
          value={ralphDrinks}
          className="h-12 text-title text-[#c41e3a]"
        />
      </Card>

      <Card className="animate-fade-in-up animate-fade-in-up-delay-2 tap-scale overflow-hidden">
        <button
          onClick={() => setEnvelopesExpanded(!envelopesExpanded)}
          className="w-full text-left transition-apple touch-manipulation -my-2 py-2"
        >
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#c41e3a]/10 flex items-center justify-center shrink-0">
                <Mail className="size-5 text-[#c41e3a]" />
              </div>
              <p className="text-footnote text-[#8b7355]">Envelopes opened</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#e8ddd0]/50 flex items-center justify-center shrink-0">
              <ChevronRight
                className={`size-5 text-[#8b7355] transition-transform duration-300 ${envelopesExpanded ? "rotate-90" : ""}`}
              />
            </div>
          </div>
          <AnimatedCounter
            value={guest?.envelope_picks_used ?? 0}
            className="h-12 text-title text-[#1a0f0a]"
          />
        </button>
        <div
          className={`expandable-section ${envelopesExpanded ? "expanded" : ""}`}
        >
          <div className="expandable-section-inner">
            <div className="mt-5 pt-5 border-t border-[#e8ddd0]/80 space-y-3">
              {myPrizes.length === 0 ? (
                <p className="text-[#8b7355] text-sm">No prizes yet</p>
              ) : (
                myPrizes.map((prize, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[#1a0f0a]">{prize.prize_label}</span>
                    {prize.prize_rarity && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded shrink-0 ${rarityColor(prize.prize_rarity)}`}
                      >
                        {prize.prize_rarity}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {canPickAgain && (
          <Link href="/checkin/envelope" className="block mt-3">
            <Button variant="secondary" size="sm" fullWidth>
              Pick another (5 drinks earned it!)
            </Button>
          </Link>
        )}
      </Card>

      <Card className="animate-fade-in-up animate-fade-in-up-delay-3 tap-scale">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Trophy className="size-5 text-amber-700" />
          </div>
          <p className="text-footnote text-[#8b7355]">Recent wins</p>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {partyPicks.length === 0 ? (
            <p className="text-[#8b7355] text-sm">No picks yet</p>
          ) : (
            partyPicks.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-callout animate-slide-in"
                style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
              >
                <span className="font-medium text-[#1a0f0a] truncate">
                  {m.name}
                </span>
                <span className="text-[#8b7355] shrink-0">→</span>
                <span className="text-[#5c4033] truncate">{m.prize_label}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#c41e3a]/10 flex items-center justify-center shrink-0">
            <MessageCircle className="size-5 text-[#c41e3a]" />
          </div>
          <p className="text-footnote text-[#8b7355] font-medium">Party feed</p>
        </div>
        {feedItems.length === 0 ? (
          <Card className="tap-scale">
            <p className="text-[#8b7355] text-body text-center py-8">
              No posts or polls yet — tap the edit button to share!
            </p>
          </Card>
        ) : (
          feedItems.map((item) =>
            item.type === "post" ? (
              <PostCard
                key={`post-${item.id}`}
                post={item.data}
                onLikeChange={fetchData}
                onCommentAdd={fetchData}
              />
            ) : (
              <PollCard
                key={`poll-${item.id}`}
                poll={item.data}
                onVote={fetchData}
              />
            ),
          )
        )}
      </div>
    </div>
  )
}
