// Chinese zodiac by birth year
// 12-year cycle: Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig
// Note: Lunar year starts at Chinese New Year (Jan/Feb). We use Gregorian year for simplicity.
// Per China Highlights: 1900=Rat, 1901=Ox, 1902=Tiger... 2024=Dragon, 2025=Snake
const ZODIAC_SIGNS = [
  "Rat",
  "Ox",
  "Tiger",
  "Rabbit",
  "Dragon",
  "Snake",
  "Horse",
  "Goat",
  "Monkey",
  "Rooster",
  "Dog",
  "Pig",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

// Brief personality traits per sign (sourced from Britannica, Almanac, Chinese zodiac traditions)
const ZODIAC_DESCRIPTION: Record<ZodiacSign, string> = {
  Rat: "Quick-witted, adaptable, and resourceful — natural problem-solvers who charm everyone they meet.",
  Ox: "Steadfast, reliable, and hard-working — strong and protective with a quiet determination.",
  Tiger: "Bold, charismatic, and courageous — natural leaders with a warm heart and fierce spirit.",
  Rabbit: "Gentle, compassionate, and sincere — peace-loving souls who value family and friendship.",
  Dragon: "Energetic, charismatic, and confident — born leaders with a magnetic presence.",
  Snake: "Wise, intuitive, and charming — analytical minds who trust their gut and excel at strategy.",
  Horse: "Free-spirited, brave, and loyal — independent souls who cherish adventure and companionship.",
  Goat: "Creative, gentle, and artistic — kind-hearted with a love for beauty and harmony.",
  Monkey: "Clever, playful, and inventive — quick thinkers who bring wit and fun to any gathering.",
  Rooster: "Honest, confident, and observant — organized perfectionists with a sharp, straightforward style.",
  Dog: "Loyal, honest, and protective — devoted friends who stand by those they care about.",
  Pig: "Generous, easygoing, and good-natured — they enjoy life’s pleasures and give freely to others.",
};

// Unicode emoji for each zodiac animal (per standard Chinese zodiac representation)
const ZODIAC_EMOJI: Record<ZodiacSign, string> = {
  Rat: "🐀",
  Ox: "🐂",
  Tiger: "🐅",
  Rabbit: "🐇",
  Dragon: "🐉",
  Snake: "🐍",
  Horse: "🐎",
  Goat: "🐐",
  Monkey: "🐒",
  Rooster: "🐓",
  Dog: "🐕",
  Pig: "🐖",
};

export function getChineseZodiac(birthYear: number): ZodiacSign | null {
  if (!birthYear || birthYear < 1900 || birthYear > 2100) return null;
  // 1900 is year of the Rat (lunar)
  const index = (birthYear - 1900) % 12;
  return ZODIAC_SIGNS[index];
}

/** Returns the emoji for a zodiac sign, or empty string if unknown */
export function getZodiacEmoji(sign: string | null): string {
  if (!sign) return "";
  const s = sign as ZodiacSign;
  return ZODIAC_EMOJI[s] ?? "";
}

/** Returns a brief description of a zodiac sign, or empty string if unknown */
export function getZodiacDescription(sign: string | null): string {
  if (!sign) return "";
  const s = sign as ZodiacSign;
  return ZODIAC_DESCRIPTION[s] ?? "";
}
