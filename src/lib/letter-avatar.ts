/**
 * Letter avatar: first letter of name + deterministic color from name.
 */

const COLORS = [
  "#c41e3a", "#8b4513", "#2e7d32", "#1565c0", "#6a1b9a",
  "#c62828", "#ef6c00", "#f9a825", "#558b2f", "#00838f",
  "#7b1fa2", "#c2185b", "#e65100", "#ff8f00", "#33691e",
];

export function getLetterAvatarColor(name: string): string {
  if (!name.trim()) return COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % COLORS.length;
  return COLORS[idx];
}

export function getLetterAvatarLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}
