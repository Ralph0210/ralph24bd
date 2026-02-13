// Chinese zodiac by birth year (lunar calendar simplified - using year only)
// 12-year cycle: Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig
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

export function getChineseZodiac(birthYear: number): ZodiacSign | null {
  if (!birthYear || birthYear < 1900 || birthYear > 2100) return null;
  // 1900 is year of the Rat
  const index = (birthYear - 1900) % 12;
  return ZODIAC_SIGNS[index];
}
