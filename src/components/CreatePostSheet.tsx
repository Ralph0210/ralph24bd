"use client";

import { useState, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { getOrCreateGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";
import { compressImage, getImagePreviewUrl } from "@/lib/compress-image";
import { X, ImagePlus } from "lucide-react";

const MAX_PHOTOS = 4;

interface CreatePostSheetProps {
  open: boolean;
  onClose: () => void;
  guestName?: string;
  guestAvatar?: string | null;
}

export function CreatePostSheet({
  open,
  onClose,
  guestName = "",
  guestAvatar,
}: CreatePostSheetProps) {
  const [message, setMessage] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const valid = files.filter((f) => f.type.startsWith("image/") || f.name.match(/\.(heic|heif)$/i));
    const toAdd = valid.slice(0, MAX_PHOTOS - photoFiles.length);
    if (toAdd.length === 0) return;

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

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Share something with the party!");
      return;
    }
    setLoading(true);
    setError("");
    const guestId = getOrCreateGuestId();
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

      const { error: insertErr } = await supabase.from("posts").insert({
        guest_id: guestId,
        message: trimmed,
        photo_urls: photoUrls,
      });
      if (insertErr) throw insertErr;

      window.dispatchEvent(new CustomEvent("posts-created"));
      setMessage("");
      setPhotoFiles([]);
      photoPreviews.forEach((p) => URL.revokeObjectURL(p));
      setPhotoPreviews([]);
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
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-sheet-backdrop-in"
        aria-label="Close"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] bg-[#fef8f0] flex flex-col max-h-[85dvh] animate-slide-up-sheet"
        style={{
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
        }}
      >
        {/* Handle - iOS style */}
        <div className="shrink-0 pt-4 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-black/15" aria-hidden />
        </div>

        {/* Header */}
        <div className="shrink-0 px-5 pb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-1 -ml-1 text-[#c41e3a] text-footnote font-semibold active:opacity-70"
          >
            Cancel
          </button>
          <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-[#1a0f0a] -tracking-[0.4px]">
            New Post
          </h2>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
            className="py-2 px-1 -mr-1 text-[#c41e3a] text-footnote font-semibold disabled:opacity-40 active:opacity-70"
          >
            {loading ? "Posting…" : "Post"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
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
                rows={4}
                className="w-full py-3 px-0 bg-transparent text-[17px] text-[#1a0f0a] placeholder:text-[#8b7355]/80 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Photo strip - iOS style horizontal */}
          {photoPreviews.length > 0 && (
            <div className="mt-5">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {photoPreviews.map((url, i) => (
                  <div
                    key={i}
                    className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-[#e8ddd0]/30 ring-1 ring-black/5"
                  >
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

          {error && (
            <p className="mt-4 text-[#c41e3a] text-footnote font-medium">{error}</p>
          )}
        </div>
      </div>
    </>
  );
}
