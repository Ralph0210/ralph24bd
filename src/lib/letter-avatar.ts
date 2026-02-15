/**
 * Letter avatar: first letter of name + color from first letter only.
 * Color is fixed once the first character is typed (doesn't change as user types more).
 * 30 colors so guests with different first letters rarely share the same color.
 */
const COLORS = [
  "#c41e3a", "#5c4033", "#8b7355", "#9e1830", "#6d4c3d",
  "#7a5c4a", "#a0654a", "#8b5a3c", "#6b5344", "#8b6f47",
  "#7d6e5c", "#9c7c5c", "#6f5b4a", "#8a6b4d", "#5e4a3a",
  "#b0354a", "#7c5a4a", "#946b52", "#a67c5a", "#6e5c4d",
  "#8b6342", "#9a6b4a", "#7a5440", "#8f6b55", "#6a5548",
  "#a55c3a", "#7d4a35", "#8b6b5a", "#9e7a5c", "#5a4538",
];

export function getLetterAvatarColor(name: string): string {
  const first = name.trim()[0];
  if (!first) return COLORS[0];
  const idx = first.toUpperCase().charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

export function getLetterAvatarLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}
