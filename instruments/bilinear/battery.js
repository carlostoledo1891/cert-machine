#!/usr/bin/env node
/* battery.js — the bilinear instrument's gate.

   Three things have to hold before anything this instrument says is worth
   printing on a page, and they are different in kind:

     THE TENSOR IS RIGHT.  The certifier rebuilds each target by literal
       polynomial arithmetic; the search builds the same target from an index
       formula. Neither is checked by the other at runtime, so they are
       checked HERE, entry by entry, for every family and every size the
       front uses. Two independent derivations asserted equal is the only
       reason the duplication is allowed to exist.
     THE AUDIT IS RIGHT.  Cross-checked against instruments/strassen on the
       case the two share — Strassen's rank 7 over F2 — and against the
       published optimum for the cyclic convolution C7.
     THE SEARCH IS NOT SILENTLY STALLING.  A calibration ladder of PUBLISHED
       ranks the free walk must still reach. This is the gate that caught the
       plus transition being missing: without it the walk matched the
       literature at P2..P4 and then sat above it from P5 on, which looks
       exactly like success if nobody checks the top of the ladder.

   Red controls throughout: a perturbed coefficient, a forged rank, a
   non-bit coefficient, a scheme audited against the wrong target, and a
   ring the instrument does not decide — each must be refused, by name. */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const B = require('./tensor.js');
const S = require(path.join(ROOT, 'instruments', 'strassen', 'tensor.js'));
const G = require(path.join(ROOT, 'machine', 'generate', 'targets.js'));
const F = require(path.join(ROOT, 'machine', 'generate', 'f2scheme.js'));
const WALK = require(path.join(ROOT, 'machine', 'generate', 'proposers', 'flip.js'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* ---- 1. the two derivations of every target agree ------------------------ */
{
  const specs = ['<2,2,2>', '<3,3,3>', '<2,3,4>', 'P2', 'P5', 'P8', 'T6', 'T8', 'T11', 'C7', 'C8', 'C10'];
  let agree = 0, mismatch = null;
  for (const spec of specs) {
    const byArithmetic = B.target(spec);
    const byFormula = G.parse(spec);
    const built = new Uint8Array(byFormula.na * byFormula.nb * byFormula.nc);
    for (const [a, b, c] of byFormula.triples) built[(a * byFormula.nb + b) * byFormula.nc + c] ^= 1;
    const sameDims = byArithmetic.na === byFormula.na && byArithmetic.nb === byFormula.nb
      && byArithmetic.nc === byFormula.nc;
    const sameOnes = sameDims && built.every((v, i) => v === byArithmetic.T[i]);
    if (sameOnes) agree++; else if (!mismatch) mismatch = spec;
  }
  ok(agree === specs.length,
    'CROSS-DERIVATION: the certifier\'s polynomial arithmetic and the search\'s index formula build the '
    + 'same tensor for all ' + specs.length + ' targets' + (mismatch ? ' — MISMATCH at ' + mismatch : ''));
}

/* ---- 2. calibration against the other instrument ------------------------- */
{
  const s = S.strassen();
  const f2 = (M) => M.map(r => r.map(x => ((x % 2) + 2) % 2));
  /* THE C-INDEX LAYOUT IS A PUBLISHING CONVENTION, and the two instruments
     make opposite choices: instruments/strassen tries both and RECORDS which
     one holds (it reports AC, c = i*p+k); this instrument pins the tensor in
     the target's name and uses CA, c = k*n+i. So the shared case is compared
     with the layout matched explicitly rather than by letting either
     instrument shop for a convention that makes the claim pass. */
  const W = f2(s.W), Wca = [W[0], W[2], W[1], W[3]];
  const a = B.audit({ id: 'strassen-f2', target: '<2,2,2>', ring: 'F2', rank: 7, U: f2(s.U), V: f2(s.V), W: Wca });
  const b = S.audit(s);
  ok(a.verdict === 'VERIFIED' && a.rank === 7 && b.verdict === 'VERIFIED' && b.rank === 7,
    'CALIBRATION: Strassen 1969 verifies through BOTH instruments — bilinear over F2 (' + a.equations
    + ' equations, CA layout) and strassen over Q (layout ' + b.layout + ')');

  ok(B.audit({ id: 'strassen-f2-wrong-layout', target: '<2,2,2>', ring: 'F2', rank: 7,
    U: f2(s.U), V: f2(s.V), W }).verdict === 'REFUTED',
    'RED: the same scheme in the OTHER C layout is REFUTED — the target name pins the tensor, it is not negotiable');
}

/* ---- 3. the definition is an algorithm too -------------------------------- */
{
  const rows = [['<3,3,3>', 27], ['P2', 4], ['P6', 36], ['T8', 36], ['C7', 49], ['C10', 100]];
  let good = 0;
  for (const [spec, rank] of rows) {
    const a = B.audit(B.naiveClaim(spec));
    if (a.verdict === 'VERIFIED' && a.rank === rank) good++;
  }
  ok(good === rows.length,
    'the naive algorithm for every family verifies at the expected rank (' + good + '/' + rows.length + ')');
}

/* ---- 4. over F2 the negacyclic product IS the cyclic product -------------- */
{
  let same = 0;
  for (const n of [7, 8, 9, 10]) {
    const c = B.target('C' + n), g = B.target('C' + n + '-');
    if (c.nc === g.nc && c.T.every((v, i) => v === g.T[i])) same++;
  }
  ok(same === 4,
    'over F2, X^n + 1 = X^n - 1, so C_n^- and C_n are the SAME tensor for n = 7..10 — there is no separate '
    + 'negacyclic search over F2, and the instrument says so rather than inventing one');
}

/* ---- 5. RED: forgeries and malformed claims are refused, by name ---------- */
{
  const c = B.naiveClaim('T6');
  const bump = JSON.parse(JSON.stringify(c));
  bump.W[0][0] ^= 1;
  const a = B.audit(bump);
  ok(a.verdict === 'REFUTED' && a.failures > 0,
    'RED: one W coefficient flipped is REFUTED (' + (a.why || '').slice(0, 56) + '…)');

  ok(B.audit({ ...c, rank: c.rank - 1 }).verdict === 'REFUSED',
    'RED: a forged rank is REFUSED — the factor matrices no longer have that many columns');

  const trunc = JSON.parse(JSON.stringify(c));
  trunc.U = trunc.U.slice(0, 2);
  ok(B.audit(trunc).verdict === 'REFUSED',
    'RED: a truncated factor set is REFUSED, not scored on what survives');

  const nonbit = JSON.parse(JSON.stringify(c));
  nonbit.W[0][0] = 2;
  ok(B.audit(nonbit).verdict === 'REFUSED',
    'RED: a coefficient that is not a bit is REFUSED — a claim about F2 has to be about F2');

  ok(B.audit({ ...c, ring: 'Q' }).verdict === 'REFUSED',
    'RED: a claim over Q is REFUSED — this instrument decides F2 and does not pretend otherwise');

  ok(B.audit({ ...c, target: 'Z6' }).verdict === 'REFUSED',
    'RED: an unrecognised target is REFUSED rather than guessed at');

  /* the sharpest one: a CORRECT scheme, audited against a different tensor */
  const c7 = B.naiveClaim('C7');
  const wrong = B.audit({ ...c7, target: 'T7' });
  ok(wrong.verdict === 'REFUTED',
    'RED: a correct C7 scheme audited as T7 is REFUTED — the certifier rebuilds the tensor and does not '
    + 'take the claimant\'s word for which one it is');
}

/* ---- 6. the search is not silently stalling ------------------------------
   Published ranks the free walk must still reach, from the naive algorithm,
   at a fixed seed and a fixed budget — so this is a deterministic gate, not
   a coin flip. Sources: Chen & Kauers, "Flip Graphs for Polynomial
   Multiplication" (arXiv:2502.06264), Table for K = Z2, full product; and
   for C7, Wagh & Morgera's rank 13, which Wang (arXiv:2603.07280) shows is
   OPTIMAL by proving a matching lower bound of 13.

   If a change to the moves or the walk makes any of these unreachable, the
   search has regressed and every number it produces is suspect. */
{
  const ladder = [
    ['P2', 3, 'Karatsuba'],
    ['P3', 6, 'Chen-Kauers Z2 table'],
    ['P4', 9, 'Chen-Kauers Z2 table'],
    ['C7', 13, 'Wagh-Morgera, proved OPTIMAL by Wang'],
  ];
  for (const [spec, published, source] of ladder) {
    const t = G.parse(spec);
    let best = null, bestRank = Infinity;
    for (let seed = 1; seed <= 6 && bestRank > published; seed++) {
      const r = WALK.walk({ target: t, seed, steps: 120000, start: best, slack: 2 });
      if (r.bestRank < bestRank) { bestRank = r.bestRank; best = r.best; } else best = null;
    }
    const a = B.audit(F.toClaim(best, t, spec));
    ok(bestRank <= published && a.verdict === 'VERIFIED',
      'LADDER ' + spec.padEnd(3) + ' the free walk reaches rank ' + bestRank + ' ≤ ' + published
      + ' (' + source + ') and it CERTIFIES');
  }
}

console.log('bilinear battery: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
