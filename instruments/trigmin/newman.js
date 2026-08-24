/* newman.js — Newman polynomials on the unit circle, reduced to the trigmin
   instrument. NEW CODE (cert-machine, 2026-08-24); the certifier it rides is
   lifted verbatim and is not touched.

   THE REDUCTION, which is the whole reason this file is short.

   A Newman polynomial is f(z) = sum_{a in A} z^a with A a finite set of
   non-negative integers (coefficients 0/1, n = |A| terms). On the unit circle

       |f(e^{i0})|^2 = sum_{a,b in A} e^{i(a-b)0}
                     = n + 2 * sum_{i<j} cos(d_ij * 0),      d_ij = a_j - a_i

   so the min modulus of a Newman polynomial is an INTEGER-COEFFICIENT COSINE
   POLYNOMIAL minimum — exactly what certify-min.js certifies. Two differences
   from the chowla case, and both are why this adapter exists rather than a
   direct call:

     1. The differences are a MULTISET, not a set. `cheb.polyForSet` refuses a
        duplicate member by design, so the assembly here carries multiplicities:
        P = sum_d m_d * T_d.
     2. The V. Markov derivative bounds certifyPoly needs must carry the same
        multiplicities: L2 = sum_d m_d * d^2(d^2-1)/3, and likewise L3.

   certify-min.js exports `certifyPoly(P, {L2, L3, tol})` — the polynomial-level
   engine — so the certifier core is used UNMODIFIED. That was checked, not
   assumed: `polyForSet` throws on duplicates, `certifyPoly` does not, and the
   47-check battery it ships with still passes beside this file.

   GCD REDUCTION. If every difference is divisible by g then P(y) is a
   polynomial in the reduced variable: cos(g*d'*0) = T_d'(cos(g*0)) and cos(g*0)
   sweeps [-1,1] as 0 does, so the minimum is unchanged and the degree drops by
   a factor g. This is done here rather than left to the caller because it also
   makes the score exactly invariant under dilation A -> kA, which is the scale
   transform the funnel's score battery probes.

   WHAT IS EXACT AND WHAT IS NOT. The polynomial certified here is |f|^2 ITSELF,
   not the cosine sum: G = n*T_0 + 2*sum_d m_d*T_d, assembled in BigInt so the
   constant term n and the doubling are exact. So min|f|^2 comes straight out of
   certifyPoly with no interval step of our own, and the only inexact operation
   in the whole file is the final outward sqrt for presentation. The first draft
   certified the cosine sum and then computed n + 2*[lo,hi] in interval
   arithmetic; that was sound but ~30x looser on the HJ 19-term witness
   (1.6e-14 wide against 5.2e-16), because two extra outward roundings landed on
   a quantity the certifier could have produced directly. The HIT decision is
   made on |f|^2 against bar^2, never on the sqrt. */
'use strict';

const C = require('./cheb.js');
const CM = require('./certify-min.js');
const IV = require('#instruments/interval/interval.js');
const Q = require('#instruments/interval/rational.js');

/* ---------------- the exponent set ---------------- */

/* Canonical form: 0 = a_0 < a_1 < ... < a_{n-1}, and gcd(A) = 1.
   Translation A -> A + c leaves every difference alone, so fixing a_0 = 0 costs
   nothing; the gcd is reported rather than forced, because a caller may want to
   certify a dilated set and see that it lands on the same number. */
function validateSet(A) {
  if (!Array.isArray(A) || A.length < 2) throw new Error('newman: A must be an array of at least 2 exponents');
  for (const a of A) if (!Number.isInteger(a) || a < 0) throw new Error('newman: exponents must be non-negative integers, got ' + a);
  for (let i = 1; i < A.length; i++) if (A[i] <= A[i - 1]) throw new Error('newman: A must be strictly increasing (it is a SET of exponents)');
  if (A[0] !== 0) throw new Error('newman: A must be translated so a_0 = 0');
  return A;
}

function gcd2(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }

/* The autocorrelation multiset: d -> how many pairs realise it. */
function differenceCounts(A) {
  const m = new Map();
  for (let i = 0; i < A.length; i++) {
    for (let j = i + 1; j < A.length; j++) {
      const d = A[j] - A[i];
      m.set(d, (m.get(d) || 0) + 1);
    }
  }
  return m;
}

function reduceByGcd(counts) {
  let g = 0;
  for (const d of counts.keys()) g = gcd2(g, d);
  if (g <= 1) return { counts, g: g || 1 };
  const out = new Map();
  for (const [d, m] of counts) out.set(d / g, m);
  return { counts: out, g };
}

/* ---------------- the weighted Chebyshev assembly ---------------- */

/* G = const*T_0 + scale * sum_d m_d * T_d, streaming the recurrence
   T_{k+1} = 2y T_k - T_{k-1} once up to max(d). Same shape as cheb.polyForSet,
   with the multiplicity that function exists to forbid. BigInt throughout —
   T_d coefficients grow like 2^d and a Number would be silently wrong by
   degree 54. With (const, scale) = (n, 2) this IS |f(e^{i0})|^2 as a polynomial
   in y = cos(0); with (0, 1) it is the bare cosine sum. */
function polyForCounts(counts, constTerm, scale) {
  if (!(counts instanceof Map) || counts.size === 0) throw new Error('newman: counts must be a non-empty Map');
  let maxD = 0;
  for (const [d, m] of counts) {
    if (!Number.isInteger(d) || d < 1) throw new Error('newman: differences must be positive integers, got ' + d);
    if (!Number.isInteger(m) || m < 1) throw new Error('newman: multiplicity must be a positive integer, got ' + m);
    if (d > maxD) maxD = d;
  }
  const k = BigInt(scale === undefined ? 1 : scale);
  const acc = new Array(maxD + 1).fill(0n);
  acc[0] += BigInt(constTerm === undefined ? 0 : constTerm);   /* c * T_0, exact */
  let prev = [1n], cur = [0n, 1n];                       /* T_0, T_1 */
  for (let d = 1; d <= maxD; d++) {
    const m = counts.get(d);
    if (m) { const mb = k * BigInt(m); for (let i = 0; i < cur.length; i++) acc[i] += mb * cur[i]; }
    const nxt = new Array(cur.length + 1).fill(0n);
    for (let i = 0; i < cur.length; i++) nxt[i + 1] = 2n * cur[i];
    for (let i = 0; i < prev.length; i++) nxt[i] -= prev[i];
    prev = cur; cur = nxt;
  }
  return C.trim(acc);
}

/* The SAME polynomial by a deliberately different route: chebT(d) built from
   scratch per difference and added. Used only by the recheck, where the point
   is that a bug in the streaming accumulation above must not be able to hide
   behind itself. Slower by design; the recheck runs once per admission. */
function polyForCountsIndependent(counts, constTerm, scale) {
  const k = BigInt(scale === undefined ? 1 : scale);
  let acc = [BigInt(constTerm === undefined ? 0 : constTerm)];
  for (const [d, m] of counts) {
    const t = C.chebT(d), mb = k * BigInt(m);
    if (t.length > acc.length) acc = acc.concat(new Array(t.length - acc.length).fill(0n));
    for (let i = 0; i < t.length; i++) acc[i] += mb * t[i];
  }
  return C.trim(acc);
}

/* V. Markov on [-1,1], weighted: |T_d''| <= d^2(d^2-1)/3 and
   |T_d'''| <= d^2(d^2-1)(d^2-4)/15. Both divisions are exact — d-1,d,d+1 are
   consecutive so 3 divides the first, and d-2..d+2 are five consecutive so 15
   divides the second — and both are computed per term, never after summing. */
function markovBounds(counts, scale) {
  const k = BigInt(scale === undefined ? 1 : scale);
  let l2 = 0n, l3 = 0n;
  for (const [d, m] of counts) {
    const db = BigInt(d), s = db * db, mb = k * BigInt(m);
    l2 += mb * (s * (s - 1n) / 3n);
    const t = s * (s - 1n) * (s - 4n);
    l3 += mb * (t < 0n ? 0n : t / 15n);
  }
  return { L2: Q.R(l2), L3: Q.R(l3) };   /* the constant term contributes nothing */
}

/* ---------------- the certificate ---------------- */

/* certifyNewman(A, {bar, tol, sabotage}) — bar is the modulus threshold a HIT
   must clear (default 1). Returns the enclosures and the decision; it does not
   decide what to do with them. */
function certifyNewman(A, opts) {
  const o = opts || {};
  const bar = o.bar === undefined ? 1 : o.bar;
  const t0 = Date.now();
  validateSet(A);
  const n = A.length;

  const raw = differenceCounts(A);
  const { counts, g } = reduceByGcd(raw);
  /* G = |f|^2 as an exact BigInt polynomial in y = cos(0) */
  const G = polyForCounts(counts, n, 2);
  const { L2, L3 } = markovBounds(counts, 2);

  const res = CM.certifyPoly(G, {
    n: null,                                   /* the chowla normalisation does not apply here */
    tol: o.tol === undefined ? 1e-12 : o.tol,
    L2, L3,
    sabotage: o.sabotage
  });

  /* the certifier's enclosure IS min|f|^2 — no interval step of ours */
  const modSq = res.minEnclosure;
  /* sound sqrt: Math.sqrt is correctly rounded, so one ulp outward each way
     encloses the true root. Presentation only — the decision is on modSq. */
  const modulus = modSq[0] < 0
    ? [0, IV.nextUp(Math.sqrt(Math.max(0, modSq[1])))]
    : [IV.nextDown(Math.sqrt(modSq[0])), IV.nextUp(Math.sqrt(modSq[1]))];

  return {
    A: A.slice(), n, gcd: g,
    degree: res.degree,
    distinctDifferences: counts.size,
    pairs: (n * (n - 1)) / 2,
    modSq, modulus,
    bar, barSq: bar * bar,
    above: modSq[0] > bar * bar,               /* THE decision, on the lower bound */
    argEnclosures: res.argEnclosures,
    method: 'autocorrelation -> weighted chebyshev -> ' + res.method,
    counts: res.counts,
    timings: { ...res.timings, totalMs: Date.now() - t0 }
  };
}

/* ---------------- float paths (screening and cross-checking only) ---------- */

/* min |f|^2 over a grid, computed DIRECTLY from the exponents — it never forms
   a difference, so it shares no code path with the certified route. Sampling
   can only sit ABOVE the true minimum, which is what makes it a sound prune and
   an unsound admission. */
function sampleModSqMin(A, K) {
  const k = K || 4096;
  let best = Infinity, at = 0;
  for (let j = 0; j <= k; j++) {
    const th = Math.PI * j / k;
    let re = 0, im = 0;
    for (const a of A) { re += Math.cos(a * th); im += Math.sin(a * th); }
    const v = re * re + im * im;
    if (v < best) { best = v; at = th; }
  }
  return { sampledMin: best, atTheta: at, K: k, h: Math.PI / k };
}

/* f(-1) = sum (-1)^a, an exact integer, and min|f| <= |f(-1)|. The cheapest
   possible upper bound on the min: no floats, no polynomial, O(n) integer adds.
   For n = 6 it alone kills 31.3% of the box (measured). */
function fAtMinusOne(A) { let s = 0; for (const a of A) s += (a % 2 === 0 ? 1 : -1); return s; }

/* The dense cross-check: does a fine sample of |f|^2 fall below the certified
   lower bound? A sampled value strictly below modSq[0] refutes the certificate
   outright, since the sample is an attainable value of the function. */
function crossCheckModSq(A, modSq, K) {
  const s = sampleModSqMin(A, K || 200000);
  const maxA = A[A.length - 1];
  /* |d/d0 |f|^2| <= 2*n*maxA is crude but sound; it bounds how far above the
     true min a grid sample may sit. */
  const slackAbove = 2 * A.length * maxA * s.h / 2;
  const fpad = 1e-11 * A.length * (1 + maxA);
  let violation = null;
  if (s.sampledMin < modSq[0] - fpad) violation = 'below-lo';
  else if (s.sampledMin > modSq[1] + slackAbove + fpad) violation = 'above-hi';
  return { ok: violation === null, violation, sampledMin: s.sampledMin, atTheta: s.atTheta, lo: modSq[0], hi: modSq[1], slackAbove, fpad, K: s.K };
}

/* ---------------- the independent recompute ---------------- */

/* recheckNewman — three checks, none of which reuses the path that produced the
   certificate. A certificate that survives all three has been re-derived, not
   re-read.

     (a) STRUCTURE. The difference multiset is rebuilt and its conservation
         identity checked: sum of multiplicities = n(n-1)/2. A wrong multiset is
         the one error that would make every downstream number self-consistent
         and wrong.
     (b) EXACT SPOT VALUE. P is reassembled by the independent route
         (chebT per difference) and evaluated EXACTLY, in rational arithmetic,
         at the midpoint of every candidate argmin enclosure. Each value must be
         >= the certified lower bound on min C, by exact comparison. If any is
         below, the certified lower bound is false at a point we can name.
     (c) DENSE FLOAT. |f|^2 sampled directly from the exponents at K=200000,
         forming no differences at all. A sample below the certified lower bound
         refutes it; this is the check that catches an enclosure narrowed to
         nothing, which (b) cannot see because a thin forgery agrees with itself
         at its own midpoint. */
function recheckNewman(A, cert, opts) {
  const o = opts || {};
  try {
    if (!cert || !Array.isArray(cert.A) || cert.A.length !== A.length) return false;
    for (let i = 0; i < A.length; i++) if (cert.A[i] !== A[i]) return false;

    /* (a) structure */
    const raw = differenceCounts(A);
    let total = 0;
    for (const m of raw.values()) total += m;
    if (total !== (A.length * (A.length - 1)) / 2) return false;
    if (cert.n !== A.length) return false;
    const { counts, g } = reduceByGcd(raw);
    if (cert.gcd !== g) return false;
    if (cert.distinctDifferences !== counts.size) return false;
    if (!Array.isArray(cert.modSq) || !(cert.modSq[0] <= cert.modSq[1])) return false;

    /* (b) exact spot values, independent assembly of |f|^2 itself */
    const Gind = polyForCountsIndependent(counts, A.length, 2);
    const lo = Q.fromDouble(cert.modSq[0]);
    let spotChecked = 0;
    for (const ae of (cert.argEnclosures || [])) {
      const ymid = Q.fromDouble((ae.y[0] + ae.y[1]) / 2);
      if (Q.cmp(ymid, Q.R(-1n)) < 0 || Q.cmp(ymid, Q.R(1n)) > 0) continue;
      const v = C.evalExact(Gind, ymid);
      if (Q.cmp(v, lo) < 0) return false;      /* a point strictly below the certified floor */
      spotChecked++;
    }
    if (spotChecked === 0) return false;       /* nothing was actually checked — C6, not a pass */

    /* (c) dense float, direct from the exponents */
    const cc = crossCheckModSq(A, cert.modSq, o.K || 200000);
    if (!cc.ok) return false;

    return true;
  } catch (e) {
    return false;                              /* a recheck that cannot run is not a pass */
  }
}

module.exports = {
  validateSet, differenceCounts, reduceByGcd,
  polyForCounts, polyForCountsIndependent, markovBounds,
  certifyNewman, recheckNewman,
  sampleModSqMin, crossCheckModSq, fAtMinusOne,
  C, CM, IV, Q
};
