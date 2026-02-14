import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPartyStartDate,
  getTimeUntilParty,
  isPartyStarted,
} from "./party-start";

const FEB_15_2025_4PM_PST = new Date("2025-02-15T16:00:00-08:00").getTime();

describe("party-start", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns correct party start date for Feb 15 2025 4pm Seattle", () => {
    const d = getPartyStartDate();
    expect(d.getTime()).toBe(FEB_15_2025_4PM_PST);
    expect(d.getHours()).toBe(16); // 4pm
  });

  it("isPartyStarted returns false just before 4pm Feb 15 2025", () => {
    vi.setSystemTime(FEB_15_2025_4PM_PST - 60000); // 1 min before
    expect(isPartyStarted()).toBe(false);
  });

  it("isPartyStarted returns false 1 day before party", () => {
    vi.setSystemTime(FEB_15_2025_4PM_PST - 24 * 60 * 60 * 1000);
    expect(isPartyStarted()).toBe(false);
  });

  it("isPartyStarted returns true exactly at 4pm Feb 15 2025", () => {
    vi.setSystemTime(FEB_15_2025_4PM_PST);
    expect(isPartyStarted()).toBe(true);
  });

  it("isPartyStarted returns true 1 min after 4pm Feb 15 2025", () => {
    vi.setSystemTime(FEB_15_2025_4PM_PST + 60000);
    expect(isPartyStarted()).toBe(true);
  });

  it("getTimeUntilParty returns zeros when party has started", () => {
    vi.setSystemTime(FEB_15_2025_4PM_PST + 60000);
    const t = getTimeUntilParty();
    expect(t.days).toBe(0);
    expect(t.hours).toBe(0);
    expect(t.minutes).toBe(0);
    expect(t.seconds).toBe(0);
    expect(t.totalMs).toBe(0);
  });

  it("getTimeUntilParty returns positive values 1 hour before party", () => {
    vi.setSystemTime(FEB_15_2025_4PM_PST - 60 * 60 * 1000);
    const t = getTimeUntilParty();
    expect(t.hours).toBe(1);
    expect(t.minutes).toBe(0);
    expect(t.totalMs).toBeGreaterThan(0);
  });

  it("getTimeUntilParty returns ~1 day 24h before party", () => {
    vi.setSystemTime(FEB_15_2025_4PM_PST - 24 * 60 * 60 * 1000);
    const t = getTimeUntilParty();
    expect(t.days).toBe(1);
    expect(t.totalMs).toBeCloseTo(24 * 60 * 60 * 1000, -2);
  });
});
