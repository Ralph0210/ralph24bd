"use client";

import { useState, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { getOrCreateGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";
import {
    compressImage,
    getImagePreviewUrl,
    isHeic,
  } from "@/lib/compress-image";
import { X, ImagePlus, PenSquare, BarChart3, Plus } from "lucide-react";

const MAX_PHOTOS = 4;
const MIN_POLL_OPTIONS = 2;
const MAX_POLL_OPTIONS = 6;

type Mode = "choice" | "post" | "poll";

interface CreateContentSheetProps {
  open: boolean;
  onClose: () => void;
  guestName?: string;
  guestAvatar?: string | null;
  overrideGuestId?: string | null;
}

export function CreateContentSheet({
  open,
  onClose,
  guestName = "",
  guestAvatar,
  overrideGuestId,
}: CreateContentSheetProps) {
  const [mode, setMode] = useState<Mode>("choice");
  const [message, setMessage] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setMode("choice");
    setMessage("");
    setPhotoFiles([]);
    photoPreviews.forEach((p) => URL.revokeObjectURL(p));
    setPhotoPreviews([]);
    setQuestion("");
    setOptions(["", ""]);
    setError("");
  }

  function goBack() {
    if (mode === "post" || mode === "poll") {
      setMode("choice");
      setError("");
    } else {
      reset();
      onClose();
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const valid = files.filter(
      (f) => f.type.startsWith("image/") || isHeic(f),
    );
    const toAdd = valid.slice(0, MAX_PHOTOS - photoFiles.length);
    if (toAdd.length === 0) {
      setError("Please choose an image (JPEG, PNG, WebP, or HEIC)");
      return;
    }
    setError("");
    setPhotoFiles((prev) => [...prev, ...toAdd].slice(0, MAX_PHOTOS));
    try {
      const newPreviews = await Promise.all(toAdd.map((f) => getImagePreviewUrl(f)));
      setPhotoPreviews((prev) => [...prev, ...newPreviews].slice(0, MAX_PHOTOS));
    } catch {
      setError("Could not preview some images");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(i: number) {
    setPhotoFiles((prev) => prev.filter((_, j) => j !== i));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, j) => j !== i);
    });
  }

  function addOption() {
    if (options.length >= MAX_POLL_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(i: number) {
    if (options.length <= MIN_POLL_OPTIONS) return;
    setOptions((prev) => prev.filter((_, j) => j !== i));
  }

  function updateOption(i: number, v: string) {
    setOptions((prev) => prev.map((o, j) => (j === i ? v : o)));
  }

  async function handlePostSubmit() {
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Share something with the party!");
      return;
    }
    setLoading(true);
    setError("");
    const guestId = overrideGuestId ?? getOrCreateGuestId();
    if (!guestId) {
      setError("Session expired");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const photoUrls: string[] = [];

    try {
      for (let i = 0; i < photoFiles.length; i++) {
        const blob = await compressImage(photoFiles[i]);
        const path = `post-${guestId}-${Date.now()}-${i}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("posts")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from("posts").getPublicUrl(path);
        photoUrls.push(data.publicUrl);
      }

      await supabase.from("posts").insert({
        guest_id: guestId,
        message: trimmed,
        photo_urls: photoUrls,
      });

      window.dispatchEvent(new CustomEvent("posts-created"));
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handlePollSubmit() {
    const q = question.trim();
    const opts = options.filter((o) => o.trim()).map((o) => o.trim());
    if (!q) {
      setError("Add a question!");
      return;
    }
    if (opts.length < MIN_POLL_OPTIONS) {
      setError(`Add at least ${MIN_POLL_OPTIONS} options`);
      return;
    }
    setLoading(true);
    setError("");
    const guestId = overrideGuestId ?? getOrCreateGuestId();
    if (!guestId) {
      setError("Session expired");
      setLoading(false);
      return;
    }
    const supabase = createClient();

    try {
      const { data: poll, error: pollErr } = await supabase
        .from("polls")
        .insert({ guest_id: guestId, question: q })
        .select("id")
        .single();
      if (pollErr) throw pollErr;

      await supabase.from("poll_options").insert(
        opts.map((label, i) => ({
          poll_id: (poll as { id: string }).id,
          label,
          sort_order: i,
        })),
      );

      window.dispatchEvent(new CustomEvent("posts-created"));
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        onClick={goBack}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-sheet-backdrop-in"
        aria-label="Close"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] bg-[#fef8f0] flex flex-col max-h-[80dvh] animate-slide-up-sheet"
        style={{
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
        }}
      >
        <div className="shrink-0 pt-4 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-black/15" aria-hidden />
        </div>

        <div className="shrink-0 px-5 pb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="py-3 px-4 -ml-2 min-h-[44px] text-[#c41e3a] text-[15px] font-semibold active:opacity-70 touch-manipulation"
          >
            {mode === "choice" ? "Cancel" : "Back"}
          </button>
          <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-[#1a0f0a] -tracking-[0.4px]">
            {mode === "choice" && "Create"}
            {mode === "post" && "New Post"}
            {mode === "poll" && "New Poll"}
          </h2>
          {mode === "post" && (
            <button
              type="button"
              onClick={handlePostSubmit}
              disabled={loading || !message.trim()}
              className="py-3 px-5 -mr-2 min-h-[44px] rounded-xl text-[#c41e3a] text-[15px] font-semibold disabled:opacity-40 active:opacity-70 touch-manipulation"
            >
              {loading ? "Posting…" : "Post"}
            </button>
          )}
          {mode === "poll" && (
            <button
              type="button"
              onClick={handlePollSubmit}
              disabled={loading}
              className="py-3 px-5 -mr-2 min-h-[44px] rounded-xl text-[#c41e3a] text-[15px] font-semibold disabled:opacity-40 active:opacity-70 touch-manipulation"
            >
              {loading ? "Creating…" : "Create"}
            </button>
          )}
          {mode === "choice" && <div className="w-16" />}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 min-h-0">
          {mode === "choice" && (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode("post")}
                className="flex flex-col items-center gap-3 py-8 px-4 rounded-2xl bg-white/70 border border-[#e8ddd0]/80 active:bg-[#e8ddd0]/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#c41e3a]/10 flex items-center justify-center">
                  <PenSquare className="size-7 text-[#c41e3a]" />
                </div>
                <span className="text-[15px] font-semibold text-[#1a0f0a]">Post</span>
                <span className="text-footnote text-[#8b7355] text-center">Share a message or photos</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("poll")}
                className="flex flex-col items-center gap-3 py-8 px-4 rounded-2xl bg-white/70 border border-[#e8ddd0]/80 active:bg-[#e8ddd0]/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/20 flex items-center justify-center">
                  <BarChart3 className="size-7 text-[#b8962e]" />
                </div>
                <span className="text-[15px] font-semibold text-[#1a0f0a]">Poll</span>
                <span className="text-footnote text-[#8b7355] text-center">Ask the party a question</span>
              </button>
            </div>
          )}

          {mode === "post" && (
            <>
              <div className="flex gap-4">
                <Avatar src={guestAvatar} name={guestName} size="lg" />
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[15px] font-semibold text-[#1a0f0a] mb-1">{guestName || "Guest"}</p>
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="What's happening at the party? 🎉"
                    rows={5}
                    className="w-full py-3 px-0 bg-transparent text-[17px] text-[#1a0f0a] placeholder:text-[#8b7355]/80 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {photoPreviews.length > 0 && (
                <div className="mt-5">
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    {photoPreviews.map((url, i) => (
                      <div key={i} className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-[#e8ddd0]/30 ring-1 ring-black/5">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center active:scale-90 transition-transform shadow-lg"
                        >
                          <X className="size-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                    {photoPreviews.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-[#e8ddd0] flex flex-col items-center justify-center gap-1 text-[#8b7355] active:bg-[#e8ddd0]/20 transition-colors"
                      >
                        <ImagePlus className="size-7" strokeWidth={1.5} />
                        <span className="text-[11px] font-medium">Add</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {photoPreviews.length === 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 w-full py-4 px-5 rounded-2xl bg-white/70 border border-[#e8ddd0]/80 flex items-center justify-center gap-3 text-[#8b7355] active:bg-[#e8ddd0]/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#e8ddd0]/50 flex items-center justify-center">
                    <ImagePlus className="size-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-[15px] font-medium">Add photos</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
            </>
          )}

          {mode === "poll" && (
            <div className="space-y-5">
              <div>
                <label className="block text-footnote font-medium text-[#5c4033] mb-2">Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. Should Ralph take a shot?"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8ddd0] bg-white text-[#1a0f0a] placeholder:text-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/25"
                />
              </div>
              <div>
                <label className="block text-footnote font-medium text-[#5c4033] mb-2">Options</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-4 py-3 rounded-xl border border-[#e8ddd0] bg-white text-[#1a0f0a] placeholder:text-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/25"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        disabled={options.length <= MIN_POLL_OPTIONS}
                        className="p-3 rounded-xl text-[#8b7355] hover:bg-black/5 disabled:opacity-30"
                      >
                        <X className="size-5" />
                      </button>
                    </div>
                  ))}
                  {options.length < MAX_POLL_OPTIONS && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#e8ddd0] flex items-center justify-center gap-2 text-[#8b7355] active:bg-[#e8ddd0]/20 transition-colors"
                    >
                      <Plus className="size-5" />
                      Add option
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-[#c41e3a] text-footnote font-medium">{error}</p>}
        </div>
      </div>
    </>
  );
}
