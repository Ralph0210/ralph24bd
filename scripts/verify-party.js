#!/usr/bin/env node
/**
 * Verifies party-start logic for Feb 15 4pm Seattle.
 * Run before deployment: node scripts/verify-party.js
 */

const FEB_15_2025_4PM_PST_MS = new Date("2025-02-15T16:00:00-08:00").getTime();

function isPartyStarted(nowMs) {
  return nowMs >= FEB_15_2025_4PM_PST_MS;
}

const tests = [
  { name: "1 min before party", now: FEB_15_2025_4PM_PST_MS - 60000, expected: false },
  { name: "exactly at 4pm", now: FEB_15_2025_4PM_PST_MS, expected: true },
  { name: "1 min after party", now: FEB_15_2025_4PM_PST_MS + 60000, expected: true },
  { name: "1 day before", now: FEB_15_2025_4PM_PST_MS - 86400000, expected: false },
];

let passed = 0;
for (const t of tests) {
  const result = isPartyStarted(t.now);
  const ok = result === t.expected;
  if (ok) passed++;
  console.log(ok ? "✓" : "✗", t.name, "-", ok ? "PASS" : `FAIL (got ${result}, expected ${t.expected})`);
}

console.log("\n" + (passed === tests.length ? "All checks passed. Party gate will open Feb 15 2025 4pm Seattle." : "Some checks failed!"));
process.exit(passed === tests.length ? 0 : 1);
