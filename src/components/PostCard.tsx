"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Heart, MessageCircle, Send } from "lucide-react";
import { getGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";

export type PostWithMeta = {
  id: string;
  message: string;
  photo_urls: string[];
  guest_id: string;
  guest_name: string;
  guest_avatar: string | null;
  created_at: string;
  like_count?: number;
  liked_by_me?: boolean;
  comments?: { id: string; guest_name: string; guest_avatar: string | null; message: string; created_at: string }[];
};

interface PostCardProps {
  post: PostWithMeta;
  onLikeChange?: () => void;
  onCommentAdd?: () => void;
  overrideGuestId?: string | null;
  /** Hide like and comment when true (e.g. before check-in) */
  readOnly?: boolean;
}

export function PostCard({ post, onLikeChange, onCommentAdd, overrideGuestId, readOnly }: PostCardProps) {
  const guestId = overrideGuestId !== undefined ? overrideGuestId : getGuestId();
  const [liked, setLiked] = useState(post.liked_by_me ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [comments, setComments] = useState(post.comments ?? []);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const photos = post.photo_urls ?? [];

  function handleScroll() {
    const el = carouselRef.current;
    if (!el || photos.length <= 1) return;
    const scrollLeft = el.scrollLeft;
    const width = el.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setActivePhotoIndex(Math.min(index, photos.length - 1));
  }

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [photos.length]);

  async function toggleLike() {
    if (!guestId) return;
    const supabase = createClient();
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("guest_id", guestId);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, guest_id: guestId });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
    onLikeChange?.();
  }

  async function submitComment() {
    const trimmed = commentText.trim();
    if (!trimmed || !guestId) return;
    setCommenting(true);
    const supabase = createClient();
    const { data } = await supabase.from("guests").select("name, avatar_url").eq("guest_id", guestId).single();
    const g = data as { name: string; avatar_url: string | null } | null;
    const guestName = g?.name ?? "Host";
    const guestAvatar = g?.avatar_url ?? null;
    const { data: inserted } = await supabase
      .from("post_comments")
      .insert({ post_id: post.id, guest_id: guestId, message: trimmed })
      .select("id, message, created_at")
      .single();
    if (inserted) {
      setComments((prev) => [
        ...prev,
        { id: (inserted as { id: string }).id, guest_name: guestName, guest_avatar: guestAvatar, message: trimmed, created_at: (inserted as { created_at: string }).created_at },
      ]);
      setCommentText("");
      onCommentAdd?.();
    }
    setCommenting(false);
  }

  const timeStr = new Date(post.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <Card className="overflow-hidden" padding="none">
      <div className="p-4 pb-0">
        <div className="flex gap-3 mb-3">
          <Avatar src={post.guest_avatar} name={post.guest_name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#1a0f0a] text-[15px]">{post.guest_name}</p>
            <p className="text-caption text-[#8b7355]">{timeStr}</p>
          </div>
        </div>
        <p className="text-body text-[#1a0f0a] whitespace-pre-wrap wrap-break-word mb-3">{post.message}</p>
      </div>

      {photos.length > 0 && (
        <div className="relative">
          <div
            ref={carouselRef}
            className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory flex scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {photos.map((url, i) => (
              <div
                key={i}
                className="w-full min-w-full aspect-[4/3] snap-start shrink-0 bg-[#e8ddd0]/20"
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === activePhotoIndex ? "w-4 bg-white/90" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!readOnly && (
        <div className="flex items-center gap-6 px-4 py-3 border-t border-[#e8ddd0]/60">
          <button
            type="button"
            onClick={toggleLike}
            className={`flex items-center gap-2 -ml-2 px-2 py-1.5 rounded-xl active:scale-95 transition-all ${
              liked ? "text-[#c41e3a]" : "text-[#8b7355]"
            }`}
          >
            <Heart className={`size-5 ${liked ? "fill-current" : ""}`} />
            <span className="text-footnote font-medium">
              {likeCount > 0 ? likeCount : "Like"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 -ml-2 px-2 py-1.5 rounded-xl active:scale-95 transition-all ${
              showComments ? "text-[#c41e3a]" : "text-[#8b7355]"
            }`}
          >
            <MessageCircle className="size-5" />
            <span className="text-footnote font-medium">
              {comments.length > 0 ? comments.length : "Comment"}
            </span>
          </button>
        </div>
      )}

      {!readOnly && showComments && (
        <div className="px-4 pb-4 pt-0 border-t border-[#e8ddd0]/40">
          <div className="space-y-3 mt-3 max-h-40 overflow-y-auto scrollbar-hide">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 items-start">
                <Avatar src={c.guest_avatar} name={c.guest_name} size="xs" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-footnote font-semibold text-[#1a0f0a]">{c.guest_name}</p>
                  <p className="text-footnote text-[#5c4033] wrap-break-word">{c.message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Add a comment..."
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-[#e8ddd0] bg-white/80 text-[#1a0f0a] placeholder:text-[#8b7355] text-footnote focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/25"
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={commenting || !commentText.trim()}
              className="p-2.5 rounded-xl bg-[#c41e3a] text-white disabled:opacity-50 active:scale-95 transition-transform"
            >
              <Send className="size-5" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
