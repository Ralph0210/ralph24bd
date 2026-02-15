"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";
import { compressImage, getImagePreviewUrl } from "@/lib/compress-image";
import { X } from "lucide-react";

interface EditProfileSheetProps {
  open: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatar: string | null;
  onSaved: () => void;
}

export function EditProfileSheet({
  open,
  onClose,
  currentName,
  currentAvatar,
  onSaved,
}: EditProfileSheetProps) {
  const [name, setName] = useState(currentName);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setError("");
    }
  }, [open, currentName]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.name.match(/\.(heic|heif)$/i)) return;
    setPhotoFile(file);
    setError("");
    try {
      const url = await getImagePreviewUrl(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(url);
    } catch {
      setError("Could not preview this image");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearPhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name");
      return;
    }
    const guestId = getGuestId();
    if (!guestId) return;

    setLoading(true);
    setError("");
    const supabase = createClient();

    let avatarUrl: string | null = currentAvatar;
    if (photoFile) {
      try {
        const blob = await compressImage(photoFile);
        const path = `${guestId}-${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (uploadErr) {
          setError(uploadErr.message || "Failed to upload photo");
          setLoading(false);
          return;
        }
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process photo");
        setLoading(false);
        return;
      }
    }

    const { error: err } = await supabase
      .from("guests")
      .update({
        name: trimmed,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("guest_id", guestId);

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-sheet-backdrop-in"
        aria-label="Close"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white shadow-[0_-4px_32px_rgba(0,0,0,0.08)] flex flex-col max-h-[85dvh] animate-slide-up-sheet"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="shrink-0 pt-3 pb-2 flex justify-between items-center px-5">
          <h2 className="text-title text-[#1a0f0a]">Edit profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 rounded-full text-[#8b7355] hover:bg-[#e8ddd0]/50 active:scale-95"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative shrink-0">
              <Avatar
                src={photoPreview ?? currentAvatar}
                name={name}
                size="lg"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={handlePhotoChange}
                className="absolute inset-0 opacity-0 cursor-pointer rounded-full w-full min-w-0"
                aria-label="Upload profile photo"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-footnote text-[#8b7355] mb-1">Profile photo</p>
              <p className="text-caption text-[#5c4033]">
                {photoFile ? (
                  <>
                    {photoFile.name}{" "}
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="text-[#c41e3a] hover:underline"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  "Tap avatar to change"
                )}
              </p>
            </div>
          </div>
          <label className="block text-footnote font-medium text-[#5c4033] mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Your name"
            className={`w-full h-12 px-4 rounded-[14px] border bg-white text-[#1a0f0a] placeholder:text-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/25 mb-4 ${error ? "border-[#c41e3a]" : "border-[#e8ddd0]"}`}
          />
          {error && (
            <p className="text-[#c41e3a] text-caption mb-4">{error}</p>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </>
  );
}
