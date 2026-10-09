/* newman.js — 0/1 polynomials, minimum modulus on the unit circle.

   f(z) = sum_{a in A} z^a.  M(A) = min_{|z|=1} |f(z)|.
   |f|^2 = n + 2*sum_{i<j} cos((a_j-a_i)theta) is an integer-coefficient cosine
   polynomial, so instruments/trigmin certifies it exactly.

   CERTIFIED: an n-term set whose certified |f|² ENCLOSURE lies wholly above the
   recorded envelope — the certified enclosures of the best sets with fewer terms
   that instruments/trigmin/envelope.js holds (literature anchors and adopted box
   maxima, each re-certified at load). The statement is about the RECORDED envelope,
   not about every set with fewer terms: the envelope is a finite list.

   THE COMPARISON (2026-10-09). Until this date a HIT was `candidate.modSq[0] > bar`
   with bar the champion's LOWER end — which does not prove the candidate exceeds
   the champion — and everything else was REJECT, straddles included. The bar is now
   the champion enclosure and the predicate is verdict.decide(modSq, bar, 'gt'):
   CERTIFIED iff candidate.lo > bar.hi, REFUTED iff candidate.hi <= bar.lo, REFUSED
   between. The four hits on record had gaps of 0.02 to 0.36 against widths ~5e-16,
   so none moved; the predicate and the sentence did. */
'use strict';
const N = require('#instruments/trigmin/newman.js');
const E = require('#instruments/trigmin/envelope.js');
const V = require('#instruments/verdict.js');

const MAXGAP = 12;
const MINN = 6, MAXN = 18;

/* index -> gap vector, mixed-radix over term counts. Deterministic. */
function objAt(i) {
  const span = MAXN - MINN + 1;
  const n = MINN + (i % span);
  let x = Math.floor(i / span);
  const g = [];
  for (let k = 0; k < n - 1; k++) { g.push(1 + (x % MAXGAP)); x = Math.floor(x / MAXGAP); }
  return g;
}
function setOf(g) { const A = [0]; let s = 0; for (const x of g) { s += x; A.push(s); }
  let d = 0; for (const a of A) { let p = a, q = d; while (q) { const r = p % q; p = q; q = r; } d = p; }
  return d > 1 ? A.map(a => a / d) : A; }
function reverse(A) { const m = A[A.length - 1]; return A.map(a => m - a).reverse(); }

module.exports = {
  name: 'newman-minmod',
  statement: 'an n-term Newman polynomial whose certified min|f|² on |z|=1 lies wholly above the recorded envelope of the best sets with fewer terms (instruments/trigmin/envelope.js: literature anchors and adopted box maxima, re-certified at load)',
  enumerate: (i) => setOf(objAt(i)),
  value: (A) => N.sampleModSqMin(A, 512).sampledMin,
  interesting: (A, v) => v > E.barSq(A.length) - 1e-9,          /* the float screen: prune only */
  key: (A) => { const R = reverse(A); const s = JSON.stringify(A), r = JSON.stringify(R); return s < r ? s : r; },
  certify(A) {
    const c = N.certifyNewman(A, { bar: 0 });
    const bar = E.barSqInterval(A.length);
    const d = V.decide(c.modSq, bar, 'gt');
    const set = '[' + c.A.join(',') + ']';
    return {
      verdict: d.verdict,
      why: d.why,
      enclosure: c.modulus,
      text: d.verdict === V.CERTIFIED
        ? 'min|f| >= ' + c.modulus[0] + ' for the ' + c.n + '-term set ' + set + ', exceeding the recorded envelope (|f|² above ' + bar[1] + ')'
        : d.verdict === V.REFUTED
          ? 'min|f|² <= ' + c.modSq[1] + ' for the ' + c.n + '-term set ' + set + ' does not exceed the recorded envelope (|f|² at least ' + bar[0] + ' with fewer terms)'
          : 'min|f|² in [' + c.modSq[0] + ', ' + c.modSq[1] + '] for the ' + c.n + '-term set ' + set + ' straddles the recorded envelope [' + bar[0] + ', ' + bar[1] + '] — undecided',
      extra: { n: c.n, A: c.A, degree: c.degree, modSq: c.modSq, barSq: bar }
    };
  }
};
