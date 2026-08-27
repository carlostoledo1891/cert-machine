#!/usr/bin/env node
/* battery.js — the strassen instrument's gate.

   Calibration with the textbook answer: Strassen's 1969 rank-7 must verify,
   and the Kronecker composition must reproduce the rank-49 recursive
   4x4x4 and re-decide it from scratch. The flagship: AlphaTensor's rank-47
   4x4x4 verifies over F2 AND is refuted over Q — the improvement genuinely
   needs characteristic 2, a fact this battery decides rather than quotes.
   Red controls: one perturbed coefficient, a forged rank, a truncated
   factor set — each must be REFUTED; the exact-double fast path is
   cross-checked against a full BigInt audit. */
'use strict';

const T = require('#instruments/strassen/tensor.js');
const FAM = require('#families/strassen-audit.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* ---- calibration: the textbook answers ---- */
{
  const a = T.audit(T.strassen());
  ok(a.verdict === 'VERIFIED' && a.rank === 7 && a.layout === 'AC',
    'CALIBRATION: Strassen 1969 — 2x2 in 7 multiplications, all 64 equations hold exactly (layout ' + (a.layout || '-') + ')');
  const sq = T.compose(T.strassen(), T.strassen());
  const asq = T.audit(sq);
  ok(asq.verdict === 'VERIFIED' && asq.rank === 49,
    'the Kronecker composition Strassen⊗Strassen re-decides as a rank-49 4x4x4 (' + asq.equations + ' equations)');
  const nv = T.audit(T.naive(3, 3, 3));
  ok(nv.verdict === 'VERIFIED' && nv.rank === 27,
    'the naive rank-27 3x3x3 verifies — the definition is an algorithm too, just not a fast one');
}

/* ---- the exact-double fast path is honest: BigInt cross-check ---- */
{
  const s = T.strassen();
  const fast = T.audit(s), big = T.auditBig(s);
  ok(fast.verdict === 'VERIFIED' && big.verdict === 'VERIFIED' && fast.layout === big.layout,
    'exact-double summation agrees with a full BigInt audit (bound argument cross-checked)');
}

/* ---- RED: forgeries must be REFUTED ---- */
{
  const s = T.strassen();
  const forged = { ...s, W: s.W.map((row, i) => (i === 2 ? row.map((x, t) => (t === 4 ? x + 1 : x)) : row)) };
  const a = T.audit(forged);
  ok(a.verdict === 'REFUTED', 'RED: one W coefficient off by 1 is REFUTED (' + (a.why || '').slice(0, 48) + '…)');

  const rankLie = { ...s, rank: 6 };
  const b = T.audit(rankLie);
  ok(b.verdict === 'REFUTED' && /rank/.test(b.why), 'RED: a forged rank claim (6 for 7 columns) is REFUTED');

  const dropped = { dims: [2, 2, 2], U: s.U.map(r => r.slice(0, 6)), V: s.V.map(r => r.slice(0, 6)), W: s.W.map(r => r.slice(0, 6)) };
  const c = T.audit(dropped);
  ok(c.verdict === 'REFUTED', 'RED: dropping the 7th product breaks the identity — REFUTED, not "still close"');
}

/* ---- the flagship, decided both ways ---- */
{
  const f2 = (() => { for (let i = 0; ; i++) { const e = FAM.enumerate(i); if (!e) return null; if (e.id === 'alphatensor-f2-4x4x4') return e; } })();
  ok(!!f2, 'the AlphaTensor rank-47 4x4x4 (F2) enumerates from the pinned corpus');
  if (f2) {
    const over2 = T.audit(f2.claim);
    ok(over2.verdict === 'VERIFIED' && over2.rank === 47,
      'FLAGSHIP: 4x4 matrices in 47 multiplications VERIFIED over F2 — the first algorithm to beat Strassen-squared (49)');
    const overQ = T.audit({ ...f2.claim, ring: 'Q' });
    ok(overQ.verdict === 'REFUTED',
      'the same factors over Q are REFUTED — the speedup genuinely requires characteristic 2, decided not quoted');
    const c = FAM.certify(f2);
    ok(c.verdict === 'HIT' && /characteristic 2/.test(c.text) && c.extra.sourcePin,
      'the certificate says both facts and carries the source pin (' + (c.extra.sourcePin ? c.extra.sourcePin.sha256.slice(0, 8) + '…' : '-') + ')');
  }
}

/* ---- the Gaussian ring: AlphaEvolve's 48, decided ---- */
{
  const s7 = T.strassen();
  const lift = { dims: s7.dims, rank: 7, ring: 'Zi', scale: 1,
    U: s7.U.map(r => r.map(x => [x, 0])), V: s7.V.map(r => r.map(x => [x, 0])), W: s7.W.map(r => r.map(x => [x, 0])) };
  const lz = T.auditZi(lift);
  ok(lz.verdict === 'VERIFIED' && lz.layout === 'AC',
    'CALIBRATION: Strassen 1969 lifted to Z[i] (im = 0, scale 1) verifies with the same layout');

  const ae = (() => { for (let i = 0; ; i++) { const e = FAM.enumerate(i); if (!e) return null; if (e.id === 'alphaevolve-48-4x4x4') return e; } })();
  ok(!!ae, 'the AlphaEvolve rank-48 4x4x4 enumerates from the pinned notebook corpus');
  if (ae) {
    const az = T.auditZi(ae.claim);
    ok(az.verdict === 'VERIFIED' && az.rank === 48 && az.scale === 8,
      'FLAGSHIP 2: 4x4 in 48 multiplications VERIFIED over Z[i] — sum (2u)(2v)(2w) = 8*T, all ' + (az.equations || 0) + ' equations exact (layout ' + az.layout + ')');
    const big = T.auditZiBig(ae.claim);
    ok(big.verdict === 'VERIFIED' && big.layout === az.layout,
      'the exact-double Gaussian path agrees with a full BigInt audit');
    const forged = { ...ae.claim, W: ae.claim.W.map((row, i) => (i === 5 ? row.map((x, t) => (t === 7 ? [x[0] + 1, x[1]] : x)) : row)) };
    const rz = T.auditZi(forged);
    ok(rz.verdict === 'REFUTED', 'RED: one Gaussian component off by 1 is REFUTED (' + (rz.why || '').slice(0, 40) + '…)');
    const forgedIm = { ...ae.claim, W: ae.claim.W.map((row, i) => (i === 3 ? row.map((x, t) => (t === 2 ? [x[0], x[1] + 1] : x)) : row)) };
    ok(T.auditZi(forgedIm).verdict === 'REFUTED', 'RED: an imaginary component off by 1 is REFUTED — the im = 0 constraint is live');
    const c = FAM.certify(ae);
    ok(c.verdict === 'HIT' && c.extra.scale === 8 && c.extra.sourcePin,
      'the certificate states the doubled-scale identity and carries the notebook pin (' + (c.extra.sourcePin ? c.extra.sourcePin.sha256.slice(0, 8) + '…' : '-') + ')');
  }
}

/* ---- the family end-to-end ---- */
{
  let hits = 0, rejects = 0, refused = 0, laderman = false;
  for (let i = 0; ; i++) {
    const o = FAM.enumerate(i); if (!o) break;
    const v = FAM.value(o);
    ok(FAM.interesting(o, v), o.id + ': the float screen passes (sample residual ' + v + ')');
    const c = FAM.certify(o);
    if (c.verdict === 'HIT') hits++;
    else if (c.verdict === 'REJECT') rejects++;
    else refused++;
    if (o.id === 'alphatensor-q-3x3x3' && c.verdict === 'HIT' && c.extra.rank === 23) laderman = true;
  }
  ok(hits === 10 && rejects === 1 && refused === 0,
    'corpus decided: 10 fast algorithms HIT (AlphaEvolve 48 now among them), the naive rank-8 honestly REJECTED (' + hits + '/' + rejects + '/' + refused + ')');
  ok(laderman, 'the rank-23 3x3x3 verifies — Laderman\'s 1976 rank, here via AlphaTensor\'s factors');
}

console.log('');
console.log('strassen battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
