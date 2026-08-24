/* newman.js — 0/1 polynomials, minimum modulus on the unit circle.

   f(z) = sum_{a in A} z^a.  M(A) = min_{|z|=1} |f(z)|.
   |f|^2 = n + 2*sum_{i<j} cos((a_j-a_i)theta) is an integer-coefficient cosine
   polynomial, so instruments/trigmin certifies it exactly.

   A HIT: an n-term set whose certified M exceeds everything achievable with
   fewer terms (the envelope in instruments/trigmin/envelope.js). */
'use strict';
const N = require('#instruments/trigmin/newman.js');
const E = require('#instruments/trigmin/envelope.js');

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
  statement: 'an n-term Newman polynomial whose certified min|f| on |z|=1 exceeds every value achievable with fewer terms',
  enumerate: (i) => setOf(objAt(i)),
  value: (A) => N.sampleModSqMin(A, 512).sampledMin,
  interesting: (A, v) => v > E.barSq(A.length) - 1e-9,
  key: (A) => { const R = reverse(A); const s = JSON.stringify(A), r = JSON.stringify(R); return s < r ? s : r; },
  certify(A) {
    const c = N.certifyNewman(A, { bar: 0 });
    const bar = E.barSq(A.length);
    return {
      verdict: c.modSq[0] > bar ? 'HIT' : 'REJECT',
      enclosure: c.modulus,
      text: 'min|f| >= ' + c.modulus[0] + ' for the ' + c.n + '-term set [' + c.A.join(',') + '], exceeding ' + Math.sqrt(bar),
      extra: { n: c.n, A: c.A, degree: c.degree, modSq: c.modSq, barSq: bar }
    };
  }
};
