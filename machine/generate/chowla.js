/* chowla.js — Chowla's cosine problem as a generation target.

   For a finite set A of distinct positive integers, f_A(x) = sum_{a in A}
   cos(a x). The merit is

       c(A) = -min_x f_A(x) / sqrt(|A|)

   and SMALL c is the prize. Constructions with c = 1 have been known since the
   1960s; nothing is known at c <= 1/20. That gap is the open problem.

   WHY THIS IS THE TARGET THE GENERATION SPEC WAS WRITTEN FOR. The polynomial
   front graded proposals by an integer rank — exact, but coarse: a scheme is
   23 or it is 24, and everything between is invisible. Here the fitness is a
   certified ENCLOSURE of a real number. The verdict is a proof and the WIDTH
   is a gradient, which is precisely the claim SPEC-GENERATION.md §3 makes and
   the first target that actually exercises it.

   THE SPLIT, unchanged from the engine: screen in float, certify exactly.
   `sampleC` is fast and may lie; `certifyC` is the authority and rides
   instruments/trigmin, whose Sturm + interval-Newton core is battery-held and
   is not touched here. A float screen that overestimates the minimum makes a
   set look BETTER than it is, so every record is certified before it is
   recorded and the float number never reaches a ledger.

   n IS FIXED PER RUN, DELIBERATELY. c at small n says nothing about the open
   problem, which asks for c bounded as n -> infinity; comparing the best c at
   n = 6 with the best at n = 30 measures nothing. So a campaign fixes n and
   competes against the best classical set at THAT n.

   MIT. Part of cert-machine. */
'use strict';

const CM = require('#instruments/trigmin/certify-min.js');

/* ---- the float screen ----------------------------------------------------
   f_A has degree max(A) as a polynomial in cos x, so it can wiggle that many
   times on [0, pi]; sampling below ~4 points per wiggle can step over the dip
   entirely. The sample count is therefore tied to max(A), never fixed. */
function sampleC(A, mult) {
  const maxA = A[A.length - 1];
  const N = Math.max(2048, (mult || 8) * maxA);
  let best = Infinity;
  for (let j = 0; j <= N; j++) {
    const th = Math.PI * j / N;
    let s = 0;
    for (let i = 0; i < A.length; i++) s += Math.cos(A[i] * th);
    if (s < best) best = s;
  }
  return -best / Math.sqrt(A.length);
}

/* ---- the authority -------------------------------------------------------
   Returns the certified enclosure [lo, hi] of c, or null if the instrument
   refuses. `hi` is the number a record may quote: c(A) <= hi, proved.

   THE DEGREE WALL IS REFUSED, NOT ENDURED. The Sturm chain works on a
   BigInt polynomial of degree max(A) whose coefficients grow like 2^max(A),
   so cost climbs steeply and the instrument's measured working range stops
   around degree 400. Past that it does not fail — it simply takes longer than
   anyone will wait, which is the worst behaviour a certifier can have,
   because a campaign then looks alive while doing nothing. So the wall is
   checked BEFORE the work starts and a set beyond it is refused by name.
   (Found the honest way: Mian-Chowla at n = 30 reaches past 1000 and hung
   this file's own first smoke test.) */
const DEGREE_WALL = 400;

function certifyC(A, opts) {
  const maxA = A[A.length - 1];
  if (maxA > ((opts && opts.wall) || DEGREE_WALL)) {
    return { refused: 'max(A) = ' + maxA + ' is past the degree wall of '
      + ((opts && opts.wall) || DEGREE_WALL) + '; the certifier would not finish' };
  }
  const r = CM.certify(A, Object.assign({ tol: 1e-12 }, opts || {}));
  if (!r || !r.cNormalized) return null;
  return { lo: r.cNormalized[0], hi: r.cNormalized[1], degree: r.degree, min: r.min };
}

/* ---- the classical sets, generated here rather than transcribed -----------
   These are the incumbents a search has to beat. They are REBUILT from their
   definitions and certified by the same instrument, so nothing about them is
   taken on anyone's word — and it means this file needs no lifted table. */

/** quadratic residues mod an odd prime p: (p-1)/2 elements */
function quadraticResidues(p) {
  const s = new Set();
  for (let i = 1; i < p; i++) s.add((i * i) % p);
  return [...s].sort((a, b) => a - b);
}

/** the first n positive integers — the Dirichlet kernel, and a bad set */
const interval = (n) => Array.from({ length: n }, (_, i) => i + 1);

/** Mian-Chowla: greedily extend keeping all pairwise sums distinct (a Sidon set) */
function mianChowla(n) {
  const A = [1], sums = new Set([2]);
  let cand = 2;
  while (A.length < n) {
    const add = A.map((a) => a + cand).concat([2 * cand]);
    if (!add.some((s) => sums.has(s))) { A.push(cand); add.forEach((s) => sums.add(s)); }
    cand++;
  }
  return A;
}

/** every prime p with (p-1)/2 == n, so the QR set has exactly n elements */
function primesForQR(n) {
  const p = 2 * n + 1;
  const isP = (m) => { if (m < 2) return false; for (let d = 2; d * d <= m; d++) if (m % d === 0) return false; return true; };
  return isP(p) ? [p] : [];
}

/** the classical incumbents available at exactly n elements */
function classical(n, wall) {
  const W = wall || DEGREE_WALL;
  const out = [{ name: '{1..n}', A: interval(n) }, { name: 'Mian-Chowla', A: mianChowla(n) }];
  for (const p of primesForQR(n)) out.push({ name: 'QR mod ' + p, A: quadraticResidues(p) });
  /* a classical set past the wall is dropped from the comparison and SAID to
     be dropped by the caller — never silently, or the baseline quietly gets
     easier as n grows */
  return out.map((s) => Object.assign(s, { pastWall: s.A[s.A.length - 1] > W }));
}

/* ---- the moves a proposer applies ----------------------------------------
   A neighbour keeps |A| = n and keeps the set a set of distinct positive
   integers bounded by maxA. Nothing here evaluates anything; the proposer
   decides which neighbour to take. */
function neighbour(A, maxA, rand) {
  const B = A.slice();
  const i = Math.floor(rand() * B.length);
  const v = 1 + Math.floor(rand() * maxA);
  if (B.includes(v)) return null;                 /* would collapse the set */
  B[i] = v;
  B.sort((a, b) => a - b);
  return B;
}

const key = (A) => A.join(',');

module.exports = { DEGREE_WALL, sampleC, certifyC, classical, quadraticResidues, interval, mianChowla, neighbour, key };
