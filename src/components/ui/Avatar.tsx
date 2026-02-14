"use client";

import { getLetterAvatarColor, getLetterAvatarLetter } from "@/lib/letter-avatar";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = { xs: "h-6 w-6 text-xs", sm: "h-10 w-10 text-sm", md: "h-14 w-14 text-lg", lg: "h-20 w-20 text-xl" };

export function Avatar({ src, name = "", size = "md", className = "" }: AvatarProps) {
  const letter = getLetterAvatarLetter(name);
  const color = getLetterAvatarColor(name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full overflow-hidden ${sizes[size]} ${className}`}
      style={!src ? { backgroundColor: color, color: "white", fontWeight: 600 } : undefined}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{letter}</span>
      )}
    </div>
  );
}
