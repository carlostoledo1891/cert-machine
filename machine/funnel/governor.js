/* governor.js — the funnel's budget authority.
   ENGINE TOOLING — research/_engine/funnel · ships nowhere · mints nothing.

   Doctrine (adopted from brain/AUTORESEARCH_AUDIT_2026-08-20.md item 6: their
   loop had no stopping rule; ours does, in code):

   1. DECADES — candidates are budgeted per decade (10^2, 10^3, ...). At each
      decade boundary the runner prints hit statistics, and the run STOPS at
      the largest pre-authorized decade. Authorizing the next decade is a
      config decision made BEFORE the run, never a mid-run impulse.
   2. WALL CLOCK — a hard elapsed-time cap, independent of candidate count.
   3. EQUAL-BUDGET CAP — maxCandidates pins a control run to exactly the
      budget of the run it controls for.
   4. DUMB-BASELINE RULE — any non-enum generator REQUIRES an equal-budget
      enum control run in the same session; both appear in the session
      summary. requiresBaseline() is the predicate; funnel.js enforces it with
      no opt-out flag.
   5. BINGO HALT, dryness form (Phase 3, 2026-08-20 — adapted from Graffiti's
      1991 stop rule; theirs was coverage-based, "stop when every model has a
      tight accepted conjecture", ours is the search-board analog): with
      bingoDry set, the run stops once that many consecutive candidates have
      added NOTHING to the board — the campaign has gone dry, and continuing
      is spend without information. Off (null) by default; a control run
      inherits the same setting. */
'use strict';

function makeGovernor(cfg) {
  const c = cfg || {};
  let decades = Array.isArray(c.decades) && c.decades.length ? c.decades.slice() : [2];
  decades = [...new Set(decades.map(Number))].sort((a, b) => a - b);
  for (const d of decades) {
    if (!Number.isInteger(d) || d < 2 || d > 9) throw new Error('governor: decades must be integers in [2,9], got ' + d);
  }
  const maxDecade = decades[decades.length - 1];
  const cap = Math.pow(10, maxDecade);
  const wallClockMs = c.wallClockMs === undefined ? 10 * 60 * 1000 : c.wallClockMs;
  const maxCandidates = c.maxCandidates || null;
  const bingoDry = c.bingoDry || null;
  if (bingoDry !== null && (!Number.isInteger(bingoDry) || bingoDry < 1)) {
    throw new Error('governor: bingoDry must be a positive integer (consecutive no-admission candidates), got ' + bingoDry);
  }

  return {
    decades,
    cap,
    /* stop decision, checked before every candidate. sinceAdmit = candidates
       since the last NEW board admission (0 at start of run). */
    check(ordinal, elapsedMs, sinceAdmit) {
      if (maxCandidates !== null && ordinal >= maxCandidates) {
        return { stop: true, reason: 'candidate budget reached (' + maxCandidates + ')' };
      }
      if (ordinal >= cap) {
        return { stop: true, reason: 'decade cap 10^' + maxDecade + ' reached; the next decade was not pre-authorized' };
      }
      if (elapsedMs > wallClockMs) {
        return { stop: true, reason: 'wall-clock cap (' + wallClockMs + ' ms) reached' };
      }
      if (bingoDry !== null && ordinal > 0 && sinceAdmit >= bingoDry) {
        return { stop: true, reason: 'bingo (dry): no new board admission in the last ' + bingoDry + ' candidates' };
      }
      return { stop: false };
    },
    /* returns d when ordinal sits exactly on an authorized decade boundary
       below the cap (the runner prints hit statistics there) */
    atBoundary(ordinal) {
      for (const d of decades) {
        if (d < maxDecade && ordinal === Math.pow(10, d)) return d;
      }
      return null;
    },
    requiresBaseline(generatorName) {
      return generatorName !== 'enum';
    }
  };
}

module.exports = { makeGovernor };
