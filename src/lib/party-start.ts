/**
 * Party starts Saturday Feb 15, 4pm Seattle time (America/Los_Angeles).
 * Override with NEXT_PUBLIC_PARTY_START_ISO for testing (e.g. "2026-02-15T16:00:00-08:00").
 */
const PARTY_START_ISO =
  process.env.NEXT_PUBLIC_PARTY_START_ISO || "2025-02-15T16:00:00-08:00";

export function getPartyStartDate(): Date {
  return new Date(PARTY_START_ISO);
}

export function isPartyStarted(): boolean {
  return Date.now() >= getPartyStartDate().getTime();
}

export type TimeUntil = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

export function getTimeUntilParty(): TimeUntil {
  const now = Date.now();
  const start = getPartyStartDate().getTime();
  let diff = Math.max(0, start - now);

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  diff -= days * 24 * 60 * 60 * 1000;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  diff -= hours * 60 * 60 * 1000;
  const minutes = Math.floor(diff / (60 * 1000));
  diff -= minutes * 60 * 1000;
  const seconds = Math.floor(diff / 1000);

  return { days, hours, minutes, seconds, totalMs: Math.max(0, start - now) };
}
