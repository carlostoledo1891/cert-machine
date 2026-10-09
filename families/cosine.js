/* cosine.js — Chowla's cosine problem.

   For a finite set A of distinct positive integers, f_A(x) = sum cos(a x) and
   the merit is c = -min_x f_A(x) / sqrt(|A|). Constructions with c = 1 have been
   known since the 1960s; nothing is known at c <= 1/20. SMALL c is the prize,
   which makes this the opposite search direction from newman-minmod and a real
   test that the engine is not hard-wired to one shape.

   Certified by the same instrument: min of an integer cosine polynomial. The
   verdict is verdict.decide(cEnclosure, 1, 'lt'): CERTIFIED iff the enclosure's
   upper end is below 1, REFUTED iff its lower end is at or above 1, REFUSED when
   it straddles. Until 2026-10-09 the straddle was called REJECT with the
   refutations. */
'use strict';
const N = require('#instruments/trigmin/newman.js');
const CM = require('#instruments/trigmin/certify-min.js');
const V = require('#instruments/verdict.js');

const MINN = 6, MAXN = 20, MAXGAP = 10;
const BAR = 1.0;   /* c strictly below 1 is the interesting side */

function objAt(i) {
  const span = MAXN - MINN + 1;
  const n = MINN + (i % span);
  let x = Math.floor(i / span);
  const A = []; let cur = 1;
  for (let k = 0; k < n; k++) { A.push(cur); cur += 1 + (x % MAXGAP); x = Math.floor(x / MAXGAP); }
  return A;
}
function sampleC(A) {
  let best = Infinity;
  for (let j = 0; j <= 2048; j++) {
    const th = Math.PI * j / 2048;
    let s = 0; for (const a of A) s += Math.cos(a * th);
    if (s < best) best = s;
  }
  return -best / Math.sqrt(A.length);
}

module.exports = {
  name: 'chowla-cosine',
  statement: 'a finite integer set whose certified Chowla merit c = -min f_A / sqrt|A| falls below 1',
  enumerate: (i) => objAt(i),
  value: (A) => sampleC(A),
  interesting: (A, c) => c < BAR + 1e-9,
  key: (A) => JSON.stringify(A),
  certify(A) {
    const r = CM.certify(A, { tol: 1e-12 });
    const cLo = r.cNormalized ? r.cNormalized[0] : null;
    const cHi = r.cNormalized ? r.cNormalized[1] : null;
    if (cHi === null || cLo === null) return { verdict: V.REFUSED, why: 'no normalised merit returned' };
    const d = V.decide([cLo, cHi], BAR, 'lt');
    const set = '[' + A.join(',') + ']';
    return {
      verdict: d.verdict,
      why: d.why,
      enclosure: [cLo, cHi],
      text: d.verdict === V.CERTIFIED
        ? 'certified Chowla merit c <= ' + cHi + ' for the ' + A.length + '-element set ' + set
        : d.verdict === V.REFUTED
          ? 'certified Chowla merit c >= ' + cLo + ' for the ' + A.length + '-element set ' + set + ' — not below 1'
          : 'Chowla merit c in [' + cLo + ', ' + cHi + '] for the ' + A.length + '-element set ' + set + ' straddles 1 — undecided',
      extra: { n: A.length, A, degree: r.degree, cEnclosure: [cLo, cHi] }
    };
  }
};
