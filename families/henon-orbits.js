/* henon-orbits.js — certified existence AND uniqueness of periodic orbits of
   the Hénon map.

   WHY THIS FAMILY IS DIFFERENT FROM THE OTHERS. Everything the engine has
   produced so far is a VALUE — a number with an enclosure. A value can collide
   with a curated database, which is why auditing OEIS constants had no yield:
   anything with a simple closed form already has it recorded. Krawczyk produces
   a different kind of output:

       there EXISTS a solution in this explicit box, and it is UNIQUE there.

   That is a theorem about a dynamical system, not a number, and no database can
   already contain it.

   THE OBJECT. The Hénon map H(x,y) = (1 - a x^2 + y, b x) reduces to the second
   order recurrence x_{n+1} = 1 - a x_n^2 + b x_{n-1}. A period-p orbit is a
   cyclic solution of the p equations

       F_n(x) = 1 - a x_n^2 + b x_{n-1} - x_{n+1} = 0,   indices mod p

   with Jacobian dF_n/dx_n = -2 a x_n, dF_n/dx_{n-1} = b, dF_n/dx_{n+1} = -1.
   Sparse, well-conditioned away from bifurcations, and exactly the shape the
   Krawczyk operator wants.

   THE METHOD, and the division of labour that makes it sound. Float Newton
   FINDS a candidate orbit; it proves nothing and is allowed to be wrong in any
   way at all. The Krawczyk operator then either certifies — K(X) strictly
   inside X, giving existence and uniqueness in X by Moore's theorem — or does
   not, and a candidate that does not certify is simply not a result. The
   instrument enforces STRICT interior containment: K(X) subset-or-equal X is
   not enough for uniqueness and is not accepted.

   A HIT is one certified orbit. Orbits are deduplicated by cyclic shift, since
   a period-p orbit presents itself as p different starting points, and by the
   period of its true minimal cycle, so a period-2 orbit is not counted again as
   a period-4 one. */
'use strict';

const path = require('path');
const IV = require('#instruments/interval/interval.js');
const { krawczyk } = require('#instruments/interval/radii.js');

/* ---- the parameter grid ----------------------------------------------------
   b = 0.3 is the classical Hénon value; a sweeps the interval containing the
   period-doubling cascade and the classical attractor at a = 1.4. Periods 1..8:
   beyond that the orbit count grows fast and the float Newton needs better
   starts than a coarse sweep provides, which would report absence where there
   is only a bad initial guess — a distinction the engine must never blur. */
const A_VALUES = [];
for (let i = 0; i <= 40; i++) A_VALUES.push(Number((0.6 + i * 0.02).toFixed(4)));
const B_VALUES = [0.3];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const STARTS = 12;                      /* distinct float starts per (a,b,p) */

function decode(i) {
  let x = i;
  const s = x % STARTS; x = Math.floor(x / STARTS);
  const p = PERIODS[x % PERIODS.length]; x = Math.floor(x / PERIODS.length);
  const b = B_VALUES[x % B_VALUES.length]; x = Math.floor(x / B_VALUES.length);
  if (x >= A_VALUES.length) return null;
  return { a: A_VALUES[x], b, p, s };
}

/* ---- float layer: find a candidate. Proves nothing. ---- */

function residual(v, a, b) {
  const p = v.length, r = new Array(p);
  for (let n = 0; n < p; n++) {
    const prev = v[(n - 1 + p) % p], next = v[(n + 1) % p];
    r[n] = 1 - a * v[n] * v[n] + b * prev - next;
  }
  return r;
}

function jac(v, a, b) {
  const p = v.length;
  const J = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let n = 0; n < p; n++) {
    J[n][n] += -2 * a * v[n];
    J[n][(n - 1 + p) % p] += b;
    J[n][(n + 1) % p] += -1;
  }
  return J;
}

/* Gauss-Jordan with partial pivoting. Only ever used to build the PRECONDITIONER
   A, so its accuracy affects how tight the certified box is and never whether
   the certificate is valid: a bad A makes Krawczyk fail, not lie. */
function inverse(M) {
  const n = M.length;
  const A = M.map((row, i) => row.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    if (Math.abs(A[piv][c]) < 1e-14) return null;
    if (piv !== c) { const t = A[piv]; A[piv] = A[c]; A[c] = t; }
    const d = A[c][c];
    for (let j = 0; j < 2 * n; j++) A[c][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c];
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[c][j];
    }
  }
  return A.map(row => row.slice(n));
}

function newton(v0, a, b, iters) {
  let v = v0.slice();
  for (let k = 0; k < (iters || 60); k++) {
    const r = residual(v, a, b);
    const Ji = inverse(jac(v, a, b));
    if (!Ji) return null;
    const step = new Array(v.length).fill(0);
    for (let i = 0; i < v.length; i++) for (let j = 0; j < v.length; j++) step[i] += Ji[i][j] * r[j];
    let mx = 0;
    for (let i = 0; i < v.length; i++) { v[i] -= step[i]; mx = Math.max(mx, Math.abs(step[i])); }
    if (!v.every(Number.isFinite)) return null;
    if (mx < 1e-14) break;
  }
  return v;
}

/* deterministic starts: a low-discrepancy sweep of the plausible orbit range */
function startVector(p, s) {
  const v = new Array(p);
  const g = 0.6180339887498949;                      /* golden-ratio sequence */
  for (let n = 0; n < p; n++) v[n] = -1.6 + 3.2 * (((s + 1) * g * (n + 1)) % 1);
  return v;
}

/* ---- canonical identity: cyclic shift, and minimal period ---- */
function minimalPeriod(v, tol) {
  const p = v.length;
  for (let d = 1; d < p; d++) {
    if (p % d) continue;
    let same = true;
    for (let n = 0; n < p && same; n++) if (Math.abs(v[n] - v[(n + d) % p]) > tol) same = false;
    if (same) return d;
  }
  return p;
}
function canonicalCycle(v) {
  const p = v.length;
  let best = null;
  for (let sft = 0; sft < p; sft++) {
    const r = [];
    for (let n = 0; n < p; n++) r.push(v[(n + sft) % p]);
    const key = r.map(x => x.toFixed(9)).join(',');
    if (best === null || key < best) best = key;
  }
  return best;
}

module.exports = {
  name: 'henon-orbits',
  statement: 'a parameter pair (a,b) and an explicit box in which the Hénon map provably has a periodic orbit of period p, and exactly one',
  enumerate(i) {
    const d = decode(i);
    if (!d) return null;
    const v = newton(startVector(d.p, d.s), d.a, d.b, 80);
    return v ? { ...d, v } : { ...d, v: null };
  },
  /* the float residual — small means Newton converged, nothing more */
  value(o) {
    if (!o.v) return Infinity;
    const r = residual(o.v, o.a, o.b);
    return Math.max.apply(null, r.map(Math.abs));
  },
  interesting(o, res) {
    if (!o.v || !isFinite(res) || res > 1e-11) return false;
    if (o.v.some(x => Math.abs(x) > 4)) return false;              /* escaped */
    return minimalPeriod(o.v, 1e-7) === o.p;                        /* not a lower-period orbit in disguise */
  },
  key: (o) => o.a + '|' + o.b + '|' + o.p + '|' + canonicalCycle(o.v),
  certify(o) {
    const { a, b, p, v } = o;
    const A = inverse(jac(v, a, b));
    if (!A) return { verdict: 'REFUSED', why: 'singular Jacobian at the candidate — preconditioner unavailable' };

    const F = (X) => {
      const out = new Array(p);
      for (let n = 0; n < p; n++) {
        const xn = X[n], prev = X[(n - 1 + p) % p], next = X[(n + 1) % p];
        /* 1 - a*xn^2 + b*prev - next, every operation outward-rounded */
        let t = IV.sub(IV.iv(1), IV.mul(IV.iv(a), IV.sqr(xn)));
        t = IV.add(t, IV.mul(IV.iv(b), prev));
        out[n] = IV.sub(t, next);
      }
      return out;
    };
    const DF = (X) => {
      const J = Array.from({ length: p }, () => Array.from({ length: p }, () => IV.iv(0)));
      for (let n = 0; n < p; n++) {
        J[n][n] = IV.add(J[n][n], IV.mul(IV.iv(-2 * a), X[n]));
        const pm = (n - 1 + p) % p, np = (n + 1) % p;
        J[n][pm] = IV.add(J[n][pm], IV.iv(b));
        J[n][np] = IV.add(J[n][np], IV.iv(-1));
      }
      return J;
    };

    let k;
    try { k = krawczyk(F, DF, v, A, { maxRounds: 30 }); }
    catch (e) { return { verdict: 'REFUSED', why: 'krawczyk threw: ' + e.message }; }

    if (!k || !k.ok) {
      return { verdict: 'REJECT', enclosure: [0, 0],
        text: 'no contraction at a=' + a + ', p=' + p + ' — candidate not certified (absence of proof, not proof of absence)' };
    }

    const lo = Math.min.apply(null, k.box.map(x => x[0]));
    const hi = Math.max.apply(null, k.box.map(x => x[1]));
    return {
      verdict: 'HIT',
      enclosure: [lo, hi],
      text: 'the Hénon map with a=' + a + ', b=' + b + ' has a period-' + p
        + ' orbit in an explicit box of radius ' + k.maxRad.toExponential(3)
        + ', and exactly one there (Krawczyk, strict interior containment)',
      extra: {
        a, b, p, maxRad: k.maxRad, rounds: k.rounds,
        box: k.box.map(x => [x[0], x[1]]),
        orbit: v.slice(),
        uniqueness: 'unique in the stated box; K(X) strictly inside X'
      }
    };
  }
};
