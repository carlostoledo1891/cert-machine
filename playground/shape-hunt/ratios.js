/* ratios.js — the numerology control, run honestly so it fails honestly.

   The question people actually ask of a picture like this is whether the parts
   are "perfectly sized": whether some ratio in it is the golden ratio, or root
   two, or pi. It is the purest form of the failure mode this whole page is
   about, so it belongs here — as a demonstration, with the same search run
   beside it on numbers that mean nothing.

   AND ONE THING CAN BE SETTLED WITHOUT ANY SEARCH AT ALL. Every distance here
   is a whole number on a 0-100 grid, so every ratio of two of them is RATIONAL.
   The golden ratio is irrational; so are root two, root three, pi and e.
   Therefore no ratio in this data equals any of them — not approximately, not
   as a matter of measurement, but never, in any set, from any model, and the
   same is true of any data of this kind that will ever be collected on a grid.
   The only thing a hunt can return is a near-miss, and the size of a near-miss
   is a fact about how thickly rationals with small denominators lie near the
   target. It is not a fact about the data.

   SO THE NULL FOR A CONSTANT IS OTHER TARGETS. With m distances there are about
   m^2 ratios spread over a range; the closest of them to ANY chosen number is
   small by pigeonhole. The test is therefore: how does phi's near-miss rank
   against a thousand arbitrary targets drawn from the same range? If it sits at
   the middle of that pile, phi is not special here, and saying so is the finding.
*/
'use strict';

const TARGETS = [
  { name: 'φ (golden ratio)', v: (1 + Math.sqrt(5)) / 2, irrational: true },
  { name: '√2', v: Math.SQRT2, irrational: true },
  { name: '√3', v: Math.sqrt(3), irrational: true },
  { name: '√5', v: Math.sqrt(5), irrational: true },
  { name: 'π', v: Math.PI, irrational: true },
  { name: 'e', v: Math.E, irrational: true },
  { name: '2^(1/3)', v: Math.cbrt(2), irrational: true },
  { name: '3/2', v: 1.5, irrational: false },
];

/* every ratio above 1 that the distances can form */
function ratios(D) {
  const n = D.length, d = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (D[i][j] > 0) d.push(D[i][j]);
  const out = [];
  for (let a = 0; a < d.length; a++) for (let b = 0; b < d.length; b++) {
    if (a === b) continue;
    const r = d[a] / d[b];
    if (r > 1 && r <= 6) out.push({ r, num: d[a], den: d[b] });
  }
  out.sort((x, y) => x.r - y.r);
  return out;
}
/* the nearest ratio to a target, and the local spacing that made it inevitable */
function nearest(rs, t) {
  let best = null, at = -1;
  for (let i = 0; i < rs.length; i++) {
    const e = Math.abs(rs[i].r / t - 1);
    if (!best || e < best.err) { best = { err: e, r: rs[i].r, num: rs[i].num, den: rs[i].den }; at = i; }
  }
  if (!best) return null;
  const lo = at > 0 ? rs[at - 1].r : null, hi = at < rs.length - 1 ? rs[at + 1].r : null;
  const gap = lo !== null && hi !== null ? (hi - lo) / 2 : null;
  best.localGap = gap === null ? null : gap / t;             /* spacing, relative */
  return best;
}

function hunt(D, nullTargets = 1000, seed = 20260904) {
  const rs = ratios(D);
  if (!rs.length) return null;
  const found = TARGETS.map((t) => ({ name: t.name, target: t.v, irrational: t.irrational, ...nearest(rs, t.v) }));
  /* the matched null: arbitrary targets, log-uniform across the same range, so
     they meet the same density of ratios that phi meets */
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const lo = Math.log(rs[0].r), hi = Math.log(rs[rs.length - 1].r);
  const errs = [];
  for (let k = 0; k < nullTargets; k++) {
    const t = Math.exp(lo + (hi - lo) * rnd());
    errs.push(nearest(rs, t).err);
  }
  errs.sort((a, b) => a - b);
  const pct = (e) => errs.filter((x) => x < e).length / errs.length;
  for (const f of found) f.percentile = pct(f.err);
  return { count: rs.length, min: rs[0].r, max: rs[rs.length - 1].r, found, nullTargets, nullMedian: errs[Math.floor(errs.length / 2)] };
}

module.exports = { TARGETS, ratios, nearest, hunt };
