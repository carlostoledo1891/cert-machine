/* gen-terms.js — an instance-local generator that varies the TERM COUNT.

   Why this file exists. The shipped `enum`, `evolve` and `searcher` generators
   read `minItems` from the candidate schema as a FIXED vector length, so on
   this hunt they all search n = 6 and nothing else. The frontier is
   10 <= n <= 18 — where no certified value exists and where an 18-term
   polynomial of degree 45+ sits outside the degree-<=40 exhaustion
   Hare-Jankauskas performed. Reaching it needs a generator that changes the
   length, and the machine's README makes the INTERFACE the contract, not the
   shipped files.

   It runs inside the write-fence: a bare vm context with no require, no fs, no
   process, no network. Its only output is its return value. It therefore cannot
   import the target's anchors and restates them below; `battery.js` asserts the
   two lists agree, so a drift between them is caught by a check rather than by
   somebody remembering.

   ---------------------------------------------------------------------------
   V2, 2026-08-24, rewritten after its first campaign measured it failing.

   Campaign `terms-frontier-1`: 3000 candidates, 152 certified HITs, **0 new
   board admissions**, and every HIT was one of THREE n=6 gap vectors already on
   the board. The mechanism, from the records: the board held only n=6 objects,
   so the leaderboard-driven moves orbited n=6; `extend` produced n=7 **1390
   times and no other term count ever**, because nothing at n=7 clears
   bar(7)=1.0653, so no n=7 champion was ever boarded, so extend could never
   reach n=8. **A ratchet with no pawl.** Frontier coverage was ~55 candidates
   per term count from the seed move alone, and the best score reached at
   n >= 10 was about -1.75 (sampled min|f|^2 ~ 0.1 against a bar of 1.856).

   Two fixes, both forced by that record:

     1. ANCHORS AS PRIORS. The known champions seed the mutation moves directly,
        so the generator no longer depends on the board to have a high-n object
        before it can make one. They are NEVER emitted unchanged — every anchor
        move mutates — so the board can only ever gain objects this search
        actually varied, and no literature polynomial can arrive on the board
        wearing our seed.
     2. SHRINK. Remove a term from an anchor or a champion. Applied to
        Hare-Jankauskas' 19-term witness this is the hunt's question stated as a
        move: can 18 terms do what 19 does? Nothing in v1 could ask it.

   Steering is a recorded experimental input: every candidate carries the move
   and its source in its hypothesis line, and the harness sha changes with this
   file, so v1 and v2 records can never be pooled by accident. */
'use strict';

var MIN_GAPS = 5;      /* n = 6  */
var MAX_GAPS = 17;     /* n = 18 — the tripwire ceiling; n = 19 is HJ's, already certified */
var MAX_GAP = 12;

/* Literature/lab champions as EXPONENT SETS (the form they are published in).
   battery.js asserts this list equals target.js's ANCHORS. */
var ANCHOR_SETS = [
  [0, 6, 9, 10, 17, 24],                                  /* n=6  Goddard 1992 */
  [0, 3, 7, 8, 10, 16, 22],                               /* n=7  sin-mfg box max */
  [0, 3, 9, 11, 13, 16, 17, 21],                          /* n=8  sin-mfg box max */
  [0, 1, 2, 3, 4, 7, 8, 10, 12],                          /* n=9  Boyd 1986 */
  [0, 4, 6, 7, 8, 10, 11, 12, 15, 16, 17, 22, 24, 25, 26, 29, 32, 35, 38]  /* n=19 HJ */
];

function toGaps(A) {
  var g = [];
  for (var i = 1; i < A.length; i++) g.push(A[i] - A[i - 1]);
  return g;
}

function clampGap(x) { return x < 1 ? 1 : (x > MAX_GAP ? MAX_GAP : x); }

/* Gap vectors longer than the ceiling are not discarded — they are SHRUNK into
   range, which is the move we want anyway on the 19-term witness. */
function fit(g, rng) {
  var v = g.slice();
  while (v.length > MAX_GAPS) v = dropOne(v, rng);
  while (v.length < MIN_GAPS) v.splice(Math.floor(rng() * (v.length + 1)), 0, 1 + Math.floor(rng() * MAX_GAP));
  for (var i = 0; i < v.length; i++) v[i] = clampGap(v[i]);
  return v;
}

/* Removing exponent a_k merges gaps g_k and g_{k+1} — the set loses a term and
   keeps its span. */
function dropOne(g, rng) {
  var v = g.slice();
  if (v.length <= 1) return v;
  var k = Math.floor(rng() * (v.length - 1));
  var merged = clampGap(v[k] + v[k + 1]);
  v.splice(k, 2, merged);
  return v;
}

function randGaps(len, rng) {
  var v = new Array(len);
  for (var i = 0; i < len; i++) v[i] = 1 + Math.floor(rng() * MAX_GAP);
  return v;
}

/* Every known champion reads as a near-arithmetic run with a few outliers —
   Boyd's {0,1,2,3,4,7,8,10,12} and HJ's Eq. (2.1) both do. Seeding from that
   shape is a steering decision and is named as one in the hypothesis. */
function structuredGaps(len, rng) {
  var base = 1 + Math.floor(rng() * 3);
  var v = new Array(len);
  for (var i = 0; i < len; i++) v[i] = base;
  var kicks = 1 + Math.floor(rng() * 3);
  for (var k = 0; k < kicks; k++) v[Math.floor(rng() * len)] = clampGap(base + 1 + Math.floor(rng() * (MAX_GAP - base)));
  return v;
}

/* Move a gap and GUARANTEE it moved. Clamping at the boundary was silently a
   no-op — gap 1 stepped down became 0 became 1 again — so ~1.5% of proposals
   came back as an unmutated anchor. `battery.js` RED (f) caught that on its
   first run, which is the whole reason that check exists: an anchor arriving on
   the board wearing our seed is indistinguishable from a find. Reflect off the
   boundary instead of clamping onto it. */
function bumpGap(x, rng) {
  var d = 1 + Math.floor(rng() * 3);
  var v = rng() < 0.5 ? x + d : x - d;
  if (v > MAX_GAP || v < 1) v = (v > MAX_GAP) ? x - d : x + d;   /* reflect */
  if (v > MAX_GAP) v = MAX_GAP;
  if (v < 1) v = 1;
  if (v === x) v = (x < MAX_GAP) ? x + 1 : x - 1;                /* last resort */
  return v;
}

function perturb(g, rng, howMany) {
  var v = g.slice();
  var reps = howMany || 1;
  for (var r = 0; r < reps; r++) {
    var i = Math.floor(rng() * v.length);
    v[i] = bumpGap(v[i], rng);
  }
  return v;
}

function sameVec(a, b) {
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/* The backstop for the whole file: two cancelling perturbations on one index
   can still reconstruct the source, so nothing leaves this generator that
   equals an anchor. Cheap, total, and checked. */
function notAnAnchor(g, anchors, rng) {
  for (var t = 0; t < 8; t++) {
    var clash = false;
    for (var i = 0; i < anchors.length; i++) if (sameVec(g, anchors[i])) { clash = true; break; }
    if (!clash) return g;
    g = perturb(g, rng, 1);
  }
  return g;
}

function extend(g, rng) {
  var v = g.slice();
  if (v.length >= MAX_GAPS) return v;
  v.splice(Math.floor(rng() * (v.length + 1)), 0, 1 + Math.floor(rng() * MAX_GAP));
  return v;
}

module.exports = {
  name: 'terms',

  init: function (ctx) {
    var anchors = [];
    for (var i = 0; i < ANCHOR_SETS.length; i++) anchors.push(toGaps(ANCHOR_SETS[i]));
    return { draws: 0, anchors: anchors };
  },

  next: function (state, rng) {
    var lb = state.leaderboard || [];
    var anchors = state.anchors;
    var draws = state.draws || 0;
    var g, hypothesis;

    var roll = rng();

    if (roll < 0.30) {
      /* SHRINK an anchor — the record question as a move. On HJ's 19-term
         witness this asks directly whether 18 terms can do what 19 does. */
      var ai = Math.floor(rng() * anchors.length);
      var src = anchors[ai];
      var n0 = src.length + 1;
      var v = dropOne(src, rng);
      var drops = 1 + Math.floor(rng() * 2);
      for (var d = 1; d < drops; d++) v = dropOne(v, rng);
      if (rng() < 0.7) v = perturb(v, rng, 1);
      g = fit(v, rng);
      hypothesis = 'shrink the ' + n0 + '-term anchor to ' + (g.length + 1) + ' terms (drop ' + drops + ', then perturb) — can fewer terms hold the bar';
    } else if (roll < 0.50) {
      /* MUTATE an anchor at its own term count. */
      var bi = Math.floor(rng() * anchors.length);
      g = fit(perturb(anchors[bi], rng, 1 + Math.floor(rng() * 2)), rng);
      hypothesis = 'perturb the ' + (anchors[bi].length + 1) + '-term anchor at ' + (g.length + 1) + ' terms — local search around a known champion';
    } else if (roll < 0.62) {
      /* EXTEND an anchor. */
      var ci = Math.floor(rng() * anchors.length);
      g = fit(extend(anchors[ci], rng), rng);
      hypothesis = 'extend the ' + (anchors[ci].length + 1) + '-term anchor to ' + (g.length + 1) + ' terms';
    } else if (lb.length > 0 && roll < 0.80) {
      /* WORK THE BOARD — extend or perturb something this search found. */
      var s2 = lb[Math.floor(rng() * lb.length)];
      var b2 = (s2 && s2.candidate && s2.candidate.g) ? s2.candidate.g.slice() : randGaps(MIN_GAPS, rng);
      if (rng() < 0.5) {
        g = fit(extend(b2, rng), rng);
        hypothesis = 'extend a boarded champion to ' + (g.length + 1) + ' terms';
      } else {
        g = fit(perturb(b2, rng, 1), rng);
        hypothesis = 'perturb a boarded champion at ' + (g.length + 1) + ' terms';
      }
    } else {
      /* SEED fresh, biased toward the frontier band 10 <= n <= 18. */
      var lo = rng() < 0.75 ? 9 : MIN_GAPS;          /* 9 gaps = 10 terms */
      var len = lo + Math.floor(rng() * (MAX_GAPS - lo + 1));
      if (rng() < 0.6) {
        g = structuredGaps(len, rng);
        hypothesis = 'seed ' + (len + 1) + ' terms from the near-arithmetic-with-outliers family every known champion belongs to';
      } else {
        g = randGaps(len, rng);
        hypothesis = 'seed ' + (len + 1) + ' terms uniformly — the control against the structured seed';
      }
    }

    g = notAnAnchor(g, anchors, rng);

    return {
      candidate: { g: g },
      state: { draws: draws + 1, anchors: anchors },
      hypothesis: hypothesis
    };
  }
};
