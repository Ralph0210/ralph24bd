"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Avatar } from "@/components/ui/Avatar"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"
import { PostCard, type PostWithMeta } from "@/components/PostCard"
import { PollCard, type PollWithMeta } from "@/components/PollCard"
import { createClient } from "@/lib/supabase/client"
import { getAdminGuestId } from "@/lib/guest-id"
import { compressImage, getImagePreviewUrl } from "@/lib/compress-image"
import { CreateContentSheet } from "@/components/CreateContentSheet"
import { PenSquare } from "lucide-react"

type Message = { name: string; message_to_ralph: string | null }

type CheckedInGuest = {
  name: string
  avatar_url: string | null
  zodiac_sign: string | null
  participation: string | null
  created_at: string
}

export default function AdminPage() {
  const [ralphDrinks, setRalphDrinks] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [checkedInGuests, setCheckedInGuests] = useState<CheckedInGuest[]>([])
  const [feedItems, setFeedItems] = useState<
    Array<
      | { type: "post"; id: string; created_at: string; data: PostWithMeta }
      | { type: "poll"; id: string; created_at: string; data: PollWithMeta }
    >
  >([])
  const [hostName, setHostName] = useState("Host")
  const [hostAvatar, setHostAvatar] = useState<string | null>(null)
  const [hostBirthYear, setHostBirthYear] = useState("")
  const [hostPhotoFile, setHostPhotoFile] = useState<File | null>(null)
  const [hostPhotoPreview, setHostPhotoPreview] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profileSaved, setProfileSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [postSheetOpen, setPostSheetOpen] = useState(false)
  const adminGuestId = getAdminGuestId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function fetchData() {
    const supabase = createClient()
    Promise.all([
      supabase
        .from("party_state")
        .select("ralph_drink_count")
        .limit(1)
        .single(),
      supabase
        .from("guests")
        .select("name, message_to_ralph")
        .order("created_at", { ascending: false }),
      supabase
        .from("guests")
        .select("name, avatar_url, zodiac_sign, participation, created_at")
        .neq("guest_id", adminGuestId)
        .not("name", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("posts")
        .select("id, guest_id, message, photo_urls, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("polls")
        .select("id, guest_id, question, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]).then(async ([r, m, guestsRes, pRes, pollsRes]) => {
      if (r.data)
        setRalphDrinks(
          (r.data as { ralph_drink_count: number }).ralph_drink_count,
        )
      setMessages((m.data || []) as Message[])
      setCheckedInGuests((guestsRes.data || []) as CheckedInGuest[])

      const postsData = ((pRes as { data?: unknown[] }).data || []) as {
        id: string
        guest_id: string
        message: string
        photo_urls: string[]
        created_at: string
      }[]
      if (postsData.length > 0) {
        const guestIds = [...new Set(postsData.map((x) => x.guest_id))]
        const postIds = postsData.map((p) => p.id)
        const [guestsRes, likesRes, commentsRes] = await Promise.all([
          supabase
            .from("guests")
            .select("guest_id, name, avatar_url")
            .in("guest_id", guestIds),
          Promise.resolve(
            supabase
              .from("post_likes")
              .select("post_id, guest_id")
              .in("post_id", postIds),
          ).catch(() => ({
            data: [] as { post_id: string; guest_id: string }[],
          })),
          Promise.resolve(
            supabase
              .from("post_comments")
              .select("id, post_id, guest_id, message, created_at")
              .in("post_id", postIds)
              .order("created_at", { ascending: true }),
          ).catch(() => ({
            data: [] as {
              id: string
              post_id: string
              guest_id: string
              message: string
              created_at: string
            }[],
          })),
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
        const likesList = ((likesRes as { data?: unknown[] }).data || []) as {
          post_id: string
          guest_id: string
        }[]
        const commentsList = ((commentsRes as { data?: unknown[] }).data ||
          []) as {
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

        const postsMeta = postsData.map((x) => ({
          ...x,
          guest_name: guestMap[x.guest_id]?.name ?? "Someone",
          guest_avatar: guestMap[x.guest_id]?.avatar_url ?? null,
          like_count: likesList.filter((l) => l.post_id === x.id).length,
          liked_by_me: likesList.some(
            (l) => l.post_id === x.id && l.guest_id === adminGuestId,
          ),
          comments: commentsList
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
            }),
        }))

        const pollsData = ((pollsRes as { data?: unknown[] })?.data || []) as {
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
              .in(
                "guest_id",
                pollsData.map((p) => p.guest_id),
              ),
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
          const myVoteByPoll = Object.fromEntries(
            votesList
              .filter((v) => v.guest_id === adminGuestId)
              .map((v) => [v.poll_id, v.option_id]),
          )

          pollsMeta = pollsData.map((poll) => ({
            id: poll.id,
            question: poll.question,
            guest_id: poll.guest_id,
            guest_name: pollGuestMap[poll.guest_id]?.name ?? "Someone",
            guest_avatar: pollGuestMap[poll.guest_id]?.avatar_url ?? null,
            created_at: poll.created_at,
            options: optionsList
              .filter((o) => o.poll_id === poll.id)
              .map((o) => ({
                id: o.id,
                label: o.label,
                vote_count: voteCountByOption[o.id] ?? 0,
              })),
            voted_option_id: myVoteByPoll[poll.id] ?? null,
          }))
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
        setFeedItems(
          [...postItems, ...pollItems].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          ),
        )
      } else {
        const pollsData = ((pollsRes as { data?: unknown[] })?.data || []) as {
          id: string
          guest_id: string
          question: string
          created_at: string
        }[]
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
              .in(
                "guest_id",
                pollsData.map((p) => p.guest_id),
              ),
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
          const myVoteByPoll = Object.fromEntries(
            votesList
              .filter((v) => v.guest_id === adminGuestId)
              .map((v) => [v.poll_id, v.option_id]),
          )
          const pollsMeta = pollsData.map((poll) => ({
            id: poll.id,
            question: poll.question,
            guest_id: poll.guest_id,
            guest_name: pollGuestMap[poll.guest_id]?.name ?? "Someone",
            guest_avatar: pollGuestMap[poll.guest_id]?.avatar_url ?? null,
            created_at: poll.created_at,
            options: optionsList
              .filter((o) => o.poll_id === poll.id)
              .map((o) => ({
                id: o.id,
                label: o.label,
                vote_count: voteCountByOption[o.id] ?? 0,
              })),
            voted_option_id: myVoteByPoll[poll.id] ?? null,
          }))
          const pollItems = pollsMeta.map((p) => ({
            type: "poll" as const,
            id: p.id,
            created_at: p.created_at,
            data: p,
          }))
          setFeedItems(
            pollItems.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            ),
          )
        } else {
          setFeedItems([])
        }
      }

      setLoading(false)
    })
  }

  useEffect(() => {
    async function initHost() {
      const supabase = createClient()
      const { data } = await supabase
        .from("guests")
        .select("name, avatar_url, birth_year")
        .eq("guest_id", adminGuestId)
        .single()
      if (data) {
        const d = data as {
          name: string
          avatar_url: string | null
          birth_year: number | null
        }
        setHostName(d.name || "Host")
        setHostAvatar(d.avatar_url ?? null)
        setHostBirthYear(d.birth_year != null ? String(d.birth_year) : "")
      }
      fetchData()
    }
    initHost()
  }, [adminGuestId])

  async function handleHostPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/") && !file.name.match(/\.(heic|heif)$/i))
      return
    setProfileError("")
    setProfileSaved(false)
    setHostPhotoFile(file)
    try {
      const url = await getImagePreviewUrl(file)
      if (hostPhotoPreview) URL.revokeObjectURL(hostPhotoPreview)
      setHostPhotoPreview(url)
    } catch {
      setProfileError("Could not preview this image")
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function clearHostPhoto() {
    if (hostPhotoPreview) URL.revokeObjectURL(hostPhotoPreview)
    setHostPhotoFile(null)
    setHostPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function saveHostProfile() {
    const name = hostName.trim() || "Host"
    setProfileSaving(true)
    setProfileError("")
    const supabase = createClient()
    let avatarUrl = hostPhotoFile ? null : hostAvatar

    if (hostPhotoFile) {
      try {
        const blob = await compressImage(hostPhotoFile)
        const path = `${adminGuestId}-${Date.now()}.jpg`
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true })
        if (uploadErr) {
          setProfileError(uploadErr.message || "Failed to upload photo")
          setProfileSaving(false)
          return
        }
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path)
        avatarUrl = urlData.publicUrl
      } catch (err) {
        setProfileError(
          err instanceof Error ? err.message : "Failed to process photo",
        )
        setProfileSaving(false)
        return
      }
    }

    const res = await fetch("/api/admin/save-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        avatar_url: avatarUrl ?? hostAvatar,
        birth_year: hostBirthYear.trim() ? parseInt(hostBirthYear, 10) : null,
      }),
    })
    const json = (await res.json().catch(() => ({}))) as {
      error?: string
      data?: { name: string; avatar_url: string | null }
    }

    if (!res.ok) {
      setProfileError(json.error || "Failed to save profile")
      setProfileSaving(false)
      return
    }

    if (json.data) {
      const d = json.data as {
        name: string
        avatar_url: string | null
        birth_year?: number | null
      }
      setHostName(d.name || "Host")
      setHostAvatar(d.avatar_url ?? null)
      if (d.birth_year != null) setHostBirthYear(String(d.birth_year))
    } else {
      setHostAvatar(avatarUrl ?? hostAvatar)
    }
    setHostPhotoFile(null)
    if (hostPhotoPreview) URL.revokeObjectURL(hostPhotoPreview)
    setHostPhotoPreview(null)
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
    fetchData()
  }

  async function addRalphDrink() {
    setSaving(true)
    const supabase = createClient()
    const { data: existing } = await supabase
      .from("party_state")
      .select("id, ralph_drink_count")
      .limit(1)
      .single()
    if (existing) {
      const current = (existing as { ralph_drink_count: number })
        .ralph_drink_count
      await supabase
        .from("party_state")
        .update({
          ralph_drink_count: current + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (existing as { id: string }).id)
      setRalphDrinks(current + 1)
    } else {
      await supabase.from("party_state").insert({ ralph_drink_count: 1 })
      setRalphDrinks(1)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
        <div className="h-9 w-40 rounded-[14px] bg-[#e8ddd0]/50 animate-skeleton" />
        <div className="h-24 rounded-[20px] bg-[#e8ddd0]/40 animate-skeleton" />
        <div className="h-48 rounded-[20px] bg-[#e8ddd0]/40 animate-skeleton" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh px-6 py-10 max-w-lg mx-auto">
      <h1 className="text-title text-[#1a0f0a] mb-2 animate-fade-in-up">
        Host mode
      </h1>
      <p className="text-subhead text-[#8b7355] mb-6 animate-fade-in-up animate-fade-in-up-delay-1">
        /admin — hidden URL
      </p>

      <Card className="mb-6 animate-fade-in-up animate-fade-in-up-delay-2 tap-scale">
        <p className="text-footnote text-[#8b7355] mb-3">
          Your profile (shown when you comment)
        </p>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar
              src={hostPhotoPreview ?? hostAvatar}
              name={hostName}
              size="lg"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={handleHostPhotoChange}
              className="absolute inset-0 opacity-0 cursor-pointer rounded-full w-full min-w-0"
              aria-label="Upload profile photo"
            />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={hostName}
              onChange={(e) => {
                setHostName(e.target.value)
                if (profileError) setProfileError("")
                if (profileSaved) setProfileSaved(false)
              }}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-xl border border-[#e8ddd0] bg-white text-[#1a0f0a] placeholder:text-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/25"
            />
            <input
              type="number"
              value={hostBirthYear}
              onChange={(e) => {
                setHostBirthYear(e.target.value)
                if (profileError) setProfileError("")
                if (profileSaved) setProfileSaved(false)
              }}
              placeholder="Birth year (for zodiac on Frens)"
              min={1900}
              max={2100}
              className="mt-2 w-full px-4 py-2.5 rounded-xl border border-[#e8ddd0] bg-white text-[#1a0f0a] placeholder:text-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/25"
            />
            {hostPhotoPreview && (
              <button
                type="button"
                onClick={clearHostPhoto}
                className="mt-2 text-sm text-[#c41e3a] hover:underline"
              >
                Remove photo
              </button>
            )}
            {profileError && (
              <p className="mt-2 text-sm text-[#c41e3a]">{profileError}</p>
            )}
            {profileSaved && (
              <p className="mt-2 text-sm text-green-600 font-medium">Saved!</p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                saveHostProfile()
              }}
              disabled={profileSaving || !hostName.trim()}
            >
              {profileSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mb-6 animate-fade-in-up animate-fade-in-up-delay-4 tap-scale">
        <p className="text-footnote text-[#8b7355] mb-1">
          Ralph&apos;s drink tally
        </p>
        <AnimatedCounter
          value={ralphDrinks}
          className="h-14 text-3xl font-bold text-[#c41e3a]"
        />
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

      <Card className="mb-6 animate-fade-in-up animate-fade-in-up-delay-5 tap-scale">
        <p className="text-footnote text-[#8b7355] mb-3">
          Checked-in guests ({checkedInGuests.length})
        </p>
        <ul className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
          {checkedInGuests.length === 0 ? (
            <li className="text-[#8b7355] text-sm">
              No guests have checked in yet
            </li>
          ) : (
            checkedInGuests.map((g, i) => (
              <li
                key={i}
                className="flex items-center gap-3 py-2 border-b border-[#e8ddd0]/60 last:border-0"
              >
                <Avatar src={g.avatar_url} name={g.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#1a0f0a] truncate">
                    {g.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {g.zodiac_sign && (
                      <span className="text-caption text-[#5c4033]">
                        {g.zodiac_sign}
                      </span>
                    )}
                    <span
                      className={`text-caption px-2 py-0.5 rounded-full ${(g.participation || "in_person") === "remote" ? "bg-blue-500/15 text-blue-700" : "bg-[#c41e3a]/10 text-[#c41e3a]"}`}
                    >
                      {(g.participation || "in_person") === "remote"
                        ? "Remote"
                        : "In person"}
                    </span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card className="mb-6 animate-fade-in-up animate-fade-in-up-delay-5 tap-scale">
        <p className="text-footnote text-[#8b7355] mb-3">Messages to Ralph</p>
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <li className="text-[#8b7355] text-sm">No messages yet</li>
          ) : (
            messages.map((m, i) => (
              <li
                key={i}
                className="border-b border-[#e8ddd0] pb-3 last:border-0"
              >
                <p className="font-medium text-[#1a0f0a]">{m.name}</p>
                <p className="text-[#5c4033] text-sm mt-1">
                  {m.message_to_ralph || "—"}
                </p>
              </li>
            ))
          )}
        </ul>
      </Card>

      <div className="pb-24">
        <div className="space-y-4 animate-fade-in-up animate-fade-in-up-delay-6">
          <p className="text-footnote text-[#8b7355] font-medium">Party feed</p>
          {feedItems.length === 0 ? (
            <Card className="tap-scale">
              <p className="text-[#8b7355] text-body text-center py-8">
                No posts or polls yet
              </p>
            </Card>
          ) : (
            feedItems.map((item) =>
              item.type === "post" ? (
                <PostCard
                  key={`post-${item.id}`}
                  post={item.data}
                  overrideGuestId={adminGuestId}
                  onLikeChange={fetchData}
                  onCommentAdd={fetchData}
                />
              ) : (
                <PollCard
                  key={`poll-${item.id}`}
                  poll={item.data}
                  overrideGuestId={adminGuestId}
                  onVote={fetchData}
                />
              ),
            )
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPostSheetOpen(true)}
        className="fixed right-6 bottom-8 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#c41e3a] text-white shadow-[0_4px_20px_rgba(196,30,58,0.35)] active:scale-[0.94] transition-transform touch-manipulation"
        aria-label="Create post or poll"
      >
        <PenSquare className="size-6" />
      </button>
      <CreateContentSheet
        open={postSheetOpen}
        onClose={() => {
          setPostSheetOpen(false)
          fetchData()
        }}
        guestName={hostName}
        guestAvatar={hostAvatar}
        overrideGuestId={adminGuestId}
      />
    </div>
  )
}
