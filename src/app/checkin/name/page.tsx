"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { getOrCreateGuestId } from "@/lib/guest-id";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";

export default function NameAndMessagePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [participation, setParticipation] = useState<"in_person" | "remote">("in_person");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image (JPEG, PNG, or WebP)");
      return;
    }
    setPhotoFile(file);
    setError("");
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSeal() {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    setError("");
    const guestId = getOrCreateGuestId();
    const supabase = createClient();

    let avatarUrl: string | null = null;
    if (photoFile) {
      try {
        const blob = await compressImage(photoFile);
        const ext = "jpg";
        const path = `${guestId}-${Date.now()}.${ext}`;
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

    const { error: err } = await supabase.from("guests").upsert(
      {
        guest_id: guestId,
        name: name.trim(),
        message_to_ralph: message.trim() || null,
        avatar_url: avatarUrl,
        participation,
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
    <div className="min-h-dvh px-8 py-12 animate-page-enter">
      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-title text-[#1a0f0a] mb-2 animate-fade-in-up">
          Welcome!
        </h1>
        <p className="text-subhead text-[#8b7355] mb-6 animate-fade-in-up animate-fade-in-up-delay-1">Introduce yourself to the party</p>
        <Card className={`mb-6 animate-fade-in-up animate-fade-in-up-delay-2 tap-scale ${error ? "animate-shake" : ""}`}>
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <Avatar
                src={photoPreview}
                name={name}
                size="lg"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="absolute inset-0 opacity-0 cursor-pointer rounded-full"
                aria-label="Upload profile photo"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-footnote font-medium text-[#5c4033] mb-1">Profile photo (optional)</p>
              <p className="text-caption text-[#8b7355]">
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
                  "Tap avatar to upload. We'll use your initial if you skip."
                )}
              </p>
            </div>
          </div>
          <label className="block text-footnote font-medium text-[#5c4033] mb-2">
            In person or remote?
          </label>
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => setParticipation("in_person")}
              className={`flex-1 py-3 px-4 rounded-[14px] border text-footnote font-medium transition-colors ${
                participation === "in_person"
                  ? "border-[#c41e3a] bg-[#c41e3a]/10 text-[#c41e3a]"
                  : "border-[#e8ddd0] bg-white/80 text-[#8b7355] hover:border-[#c41e3a]/40"
              }`}
            >
              In person
            </button>
            <button
              type="button"
              onClick={() => setParticipation("remote")}
              className={`flex-1 py-3 px-4 rounded-[14px] border text-footnote font-medium transition-colors ${
                participation === "remote"
                  ? "border-[#c41e3a] bg-[#c41e3a]/10 text-[#c41e3a]"
                  : "border-[#e8ddd0] bg-white/80 text-[#8b7355] hover:border-[#c41e3a]/40"
              }`}
            >
              Remote
            </button>
          </div>
          <label className="block text-footnote font-medium text-[#5c4033] mb-2">
            Name (required)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="Your name"
            className={`w-full h-12 min-h-[44px] px-4 rounded-[14px] border bg-white/80 text-[#1a0f0a] placeholder:text-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/25 focus:border-[#c41e3a]/40 transition-apple mb-5 ${error ? "border-[#c41e3a]" : "border-[#e8ddd0]"}`}
          />
          <label className="block text-footnote font-medium text-[#5c4033] mb-2">
            Message to Ralph
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Wish, first impression, roast Ralph..."
            rows={4}
            className="w-full px-4 py-3 rounded-[14px] border border-[#e8ddd0] bg-white/80 text-[#1a0f0a] placeholder:text-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/25 focus:border-[#c41e3a]/40 transition-apple resize-none"
          />
          <p className="text-caption text-[#8b7355] mt-2">
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
