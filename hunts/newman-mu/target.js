/* target.js — the funnel adapter for the Newman min-modulus landscape.
   hunts/newman-mu · cert-machine · claimless until a gate says otherwise.

   THE OBJECT. A Newman polynomial is f(z) = sum_{a in A} z^a with A a set of
   non-negative integers (coefficients 0/1, n = |A| terms). Write
   M(A) = min_{|z|=1} |f(z)| and mu(n) = sup over n-term A of M(A). The
   instrument is instruments/trigmin/newman.js, which reduces |f|^2 on the
   circle to an integer-coefficient polynomial in cos(theta) and certifies its
   global minimum exactly.

   THE BAR, and why it is what it is. A HIT here is:

       an n-term Newman polynomial whose certified min modulus exceeds
       EVERYTHING ACHIEVABLE WITH FEWER TERMS.

   i.e. bar(n) = max{ certified M(A') : |A'| < n }, the monotone envelope of the
   known landscape. That is a real question — it asks whether mu is strictly
   increasing at n — and it has the property a funnel target needs: the three
   literature champions are all HITs under it, so the recall control has real
   planted hits rather than invented ones.

   THE ENVELOPE IS COMPUTED, NEVER TRANSCRIBED (C50). Each anchor below is a
   WITNESS EXPONENT SET from the literature or from the sin-mfg lab records; its
   value is re-derived by our own certifier at module load. Nothing here copies
   a number across a file boundary, so nothing here can go stale against the
   instrument that produced it.

   WHERE THE FRONTIER IS. Certified anchors exist at n = 3,4,5,6,7,8,9 and 19.
   For 10 <= n <= 18 the envelope sits at Boyd's 9-term 1.36237..., and NOTHING
   is certified at those n by anyone we have found. A HIT at n in [10,18] is
   therefore the first n-term Newman polynomial with fewer than 19 terms to beat
   the 9-term champion — and it is a step on the only interesting road here,
   which is the least n with mu(n) >= 2. Hare-Jankauskas reached it at n = 19
   (their degree-38 witness, certified in the lab records); anything smaller
   would improve a certified record. That event has its own TRIPWIRE below and
   is never called a result by this file.

   WHAT THIS FILE MAY NOT DO. It mints nothing, sends nothing, and names nothing
   "ours". The literature read that produced the anchors is in program.md and it
   is a starting point, not a clearance. */
'use strict';

const N = require('#instruments/trigmin/newman.js');

/* ---------------- the certified envelope ---------------- */

/* Witness sets, each with the source that put it in print or in a record.
   These are DATA — the numbers come from certifying them here. */
const ANCHORS = [
  { n: 3,  A: [0, 1, 3],                            src: 'Campbell-Ferguson-Forcade 1983, M(0,1,3); mu(3) proved' },
  { n: 4,  A: [0, 1, 2, 4],                         src: 'Goddard 1992, M(0,1,2,4); mu(4) proved' },
  { n: 5,  A: [0, 1, 2, 6, 9],                      src: 'Mercer 2019: M(0,1,2,6,9) = 1 exactly; mu(5) = 1 conjectured' },
  { n: 6,  A: [0, 6, 9, 10, 17, 24],                src: 'Goddard 1992 exhaustive grid (exponents <= 30); certified in sin-mfg mercer-program Rung 1, box maximum to exponent 55' },
  { n: 7,  A: [0, 3, 7, 8, 10, 16, 22],             src: 'sin-mfg mercer-program Rungs 5-7, certified box maximum at exponents <= 30' },
  { n: 8,  A: [0, 3, 9, 11, 13, 16, 17, 21],        src: 'sin-mfg mercer-program Rungs 5-7, certified box maximum at exponents <= 30' },
  { n: 9,  A: [0, 1, 2, 3, 4, 7, 8, 10, 12],        src: 'Boyd 1986 degree-12 champion, cited by Mercer 2019 as min >= 1.362' },
  { n: 19, A: [0, 4, 6, 7, 8, 10, 11, 12, 15, 16, 17, 22, 24, 25, 26, 29, 32, 35, 38],
                                                    src: 'Hare-Jankauskas arXiv:1910.13994 Eq. (2.1); certified in sin-mfg mercer-program Rung 4' },
];

/* value(n) = certified LOWER bound on M for that anchor — computed once. */
const ANCHOR_VALUE = new Map();
for (const a of ANCHORS) {
  const c = N.certifyNewman(a.A, { bar: 0 });
  ANCHOR_VALUE.set(a.n, c.modSq[0]);            /* min|f|^2, certified lower bound */
}

/* bar(n)^2 = the best certified min|f|^2 achievable with FEWER than n terms.
   Below the smallest anchor the envelope is 0 — nothing is achievable with two
   terms (f = 1 + z^a always vanishes somewhere), and 0 is the honest floor. */
function barSq(n) {
  let best = 0;
  for (const [k, v] of ANCHOR_VALUE) if (k < n && v > best) best = v;
  return best;
}

/* THE TRIPWIRE. min|f| >= 2 with fewer than 19 terms would improve a certified
   record. It is a FLAG, never a verdict: no literature gate has run on it, and
   this file has no authority to call anything a record. */
const TRIPWIRE_MODSQ = 4;
const TRIPWIRE_MAX_N = 18;

/* ---------------- candidate shape ---------------- */

/* A candidate is a GAP VECTOR g = [g_1..g_{n-1}], every g_i >= 1, and
   A = [0, g_1, g_1+g_2, ...]. Every integer vector with entries >= 1 is a valid
   strictly-increasing exponent set, so the enumerable box has NO invalid
   points — unlike enumerating exponents directly, where all but a 1/(n-1)!
   fraction of grid points are unsorted and thrown away.

   minItems 5 / maxItems 18 admits n in [6,19], which is what the five planted
   hits need. The shipped `evolve` and `enum` generators read minItems as a
   fixed length, so they search n = 6; reaching 10 <= n <= 18 needs an
   instance-local generator (the machine's README makes the interface, not the
   shipped files, the contract). Stated here so nobody reads a n=6 campaign as
   a search of the whole schema. */
const candidateSchema = {
  type: 'object',
  required: ['g'],
  properties: {
    g: { type: 'array', minItems: 5, maxItems: 18, items: { type: 'integer', minimum: 1, maximum: 64 } }
  }
};

/* The forced dumb baseline: gap vectors in [1,8]^5 — 32768 six-term Newman
   polynomials with every consecutive gap at most 8. Goddard's champion has gap
   vector [6,3,1,7,7], so the known n=6 optimum IS inside this box and a blind
   enumeration can find it. That is deliberate: a baseline that cannot reach the
   answer measures nothing. */
const enumSpec = { type: 'intGrid', name: 'g', ranges: [[1, 8], [1, 8], [1, 8], [1, 8], [1, 8]] };

function gapsToSet(g) {
  const A = [0];
  let s = 0;
  for (const x of g) { s += x; A.push(s); }
  return A;
}

/* Canonical form: translate to a_0 = 0 (gaps already do) and divide out the
   gcd. Dilation A -> kA leaves min|f| exactly invariant, so reducing here makes
   the score bit-for-bit invariant under the scale transform the funnel probes,
   rather than merely nearly so. */
function canonicalSet(g) {
  const A = gapsToSet(g);
  let d = 0;
  for (const a of A) { let x = a, y = d; while (y) { const t = x % y; x = y; y = t; } d = x; }
  return d > 1 ? A.map(a => a / d) : A;
}

/* ---------------- board identity ---------------- */

/* Reversal: A -> max(A) - A, read backwards, is the RECIPROCAL polynomial
   z^{max} * f(1/z). On the unit circle |z^{max}| = 1, so it has the same
   modulus everywhere and the same minimum — it is the SAME OBJECT wearing a
   different vector. The first campaign of this hunt boarded six entries that
   were three objects and their reversals, which is the permutation-duplicate
   defect the machine's canonical key exists to kill; the omission was ours, not
   the machine's. Key = the lexicographically smaller of the set and its
   reversal, after gcd reduction. */
function reverseSet(A) {
  const m = A[A.length - 1];
  return A.map(a => m - a).reverse();
}

function canonicalKey(c) {
  const A = canonicalSet(c.g);
  const R = reverseSet(A);
  let smaller = A;
  for (let i = 0; i < A.length; i++) {
    if (R[i] < A[i]) { smaller = R; break; }
    if (R[i] > A[i]) break;
  }
  return JSON.stringify(smaller);
}

/* One region per term count: the landscape is a table indexed by n, and a
   champion at n = 6 must never displace a champion at n = 12. */
function regionOf(c) { return 'n=' + canonicalSet(c.g).length; }

/* ---------------- score (steering only) ---------------- */

/* How far a sampled min|f|^2 sits above this term count's bar. Higher is
   better; negative means below the bar. Sampling can only sit ABOVE the true
   minimum, so this is an optimistic estimate and it admits nothing. */
function score(c) {
  const A = canonicalSet(c.g);
  const s = N.sampleModSqMin(A, 2048);
  return s.sampledMin - barSq(A.length);
}

/* ---------------- the screen cascade ---------------- */

/* Stage 1 — EXACT, no floats. |f(-1)|^2 = (sum (-1)^a)^2 is an integer, and
   min|f|^2 <= |f(-1)|^2 because -1 is on the circle. So a candidate whose
   |f(-1)|^2 does not clear the bar cannot possibly HIT, and the rejection is a
   proof, not an estimate. Measured on the enum box: this alone kills 31.3%. */
function screenParity(c) {
  const A = canonicalSet(c.g);
  const v = N.fAtMinusOne(A);
  const vSq = v * v;
  const b = barSq(A.length);
  if (vSq <= b) return { pass: false, why: 'exact: |f(-1)|^2 = ' + vSq + ' <= bar^2 = ' + b.toFixed(12) + ' at z = -1' };
  return { pass: true, why: '' };
}

/* Stage 2 — float grid. A sampled minimum at or below the bar means the TRUE
   minimum is at or below the bar (sampling can only overestimate it), so this
   prunes soundly. The headroom leaves a thin band above the bar to be certified
   rather than pruned, so near-misses come back as enclosures instead of
   silence, and float slop cannot turn a real hit into a rejection. */
const SCREEN_HEADROOM = 1e-9;
function screenGrid(c) {
  const A = canonicalSet(c.g);
  const b = barSq(A.length);
  const s = N.sampleModSqMin(A, 4096);
  if (s.sampledMin <= b - SCREEN_HEADROOM) {
    return { pass: false, why: 'sampled min|f|^2 = ' + s.sampledMin.toFixed(12) + ' <= bar^2 - headroom (' + b.toFixed(12) + ')' };
  }
  return { pass: true, why: '' };
}

const screens = [
  { name: 'exact-f(-1)', screen: screenParity },
  { name: 'grid-4096', screen: screenGrid }
];

/* ---------------- certify (the only authority) ---------------- */

function certify(c) {
  let A;
  try { A = canonicalSet(c.g); } catch (e) {
    return { verdict: 'REFUSED', why: 'candidate did not canonicalise: ' + e.message };
  }
  let r;
  try {
    r = N.certifyNewman(A, { bar: 0, tol: 1e-12 });
  } catch (e) {
    return { verdict: 'REFUSED', why: 'instrument threw: ' + e.message };
  }
  const b = barSq(A.length);

  /* The certificate carries no wall clock and no timing — records must be
     byte-identical across a kill-and-resume, and a millisecond field is the
     one field guaranteed not to be. */
  const certificate = {
    A: r.A,
    n: r.n,
    gcd: r.gcd,
    degree: r.degree,
    distinctDifferences: r.distinctDifferences,
    pairs: r.pairs,
    modSq: r.modSq,
    modulus: r.modulus,
    barSq: b,
    barSource: 'monotone envelope of certified anchors with fewer than ' + r.n + ' terms',
    above: r.modSq[0] > b,
    argEnclosures: r.argEnclosures,
    method: r.method,
    tripwire: r.modSq[0] >= TRIPWIRE_MODSQ && r.n <= TRIPWIRE_MAX_N
  };

  if (r.modSq[0] > b) return { verdict: 'HIT', certificate };
  return {
    verdict: 'REJECT',
    certificate,
    why: 'certified min|f|^2 in [' + r.modSq[0] + ', ' + r.modSq[1] + '] does not clear bar^2 = ' + b
  };
}

/* ---------------- the independent recompute ---------------- */

function recheckCertificate(c, cert) {
  try {
    const A = canonicalSet(c.g);
    if (!N.recheckNewman(A, cert)) return false;
    /* the bar and the verdict are re-derived here, not read from the record */
    const b = barSq(A.length);
    if (cert.barSq !== b) return false;
    if (cert.above !== (cert.modSq[0] > b)) return false;
    if (cert.tripwire !== (cert.modSq[0] >= TRIPWIRE_MODSQ && cert.n <= TRIPWIRE_MAX_N)) return false;
    return true;
  } catch (e) {
    return false;
  }
}

/* ---------------- controls ---------------- */

function setToGaps(A) {
  const g = [];
  for (let i = 1; i < A.length; i++) g.push(A[i] - A[i - 1]);
  return g;
}

/* Every planted hit is a champion from the literature or the lab records, and
   each clears the envelope of everything with fewer terms. They are the recall
   control: if any one of them stops certifying, the run refuses to start. */
const plantedHits = ANCHORS
  .filter(a => a.n >= 6)
  .map(a => ({ candidate: { g: setToGaps(a.A) } }));

/* f(z) = 1 + z + z^2 + z^3 + z^4 + z^5 = (z^6-1)/(z-1) vanishes at every
   primitive 6th root of unity, so M = 0 exactly — the lowest a Newman
   polynomial can go, and a clean floor for the score battery. */
const knownBad = { g: [1, 1, 1, 1, 1] };

/* The one scale move this problem has: A -> 2A leaves min|f| exactly invariant
   (f_{2A}(e^{i0}) = f_A(e^{2i0}) and 2*theta sweeps the circle). Because score
   canonicalises by gcd first, score(2A) === score(A) bit-for-bit — the score
   cannot be inflated by dilation, and the battery checks that it is not. */
function scaleInflate(c) {
  return { g: c.g.map(x => x * 2) };
}

module.exports = {
  candidateSchema, enumSpec,
  score, screens, certify, recheckCertificate,
  plantedHits, knownBad, scaleInflate,
  canonicalKey, regionOf, regionCap: 8,
  /* exported for the hunt battery, not part of the funnel contract */
  ANCHORS, ANCHOR_VALUE, barSq, canonicalSet, gapsToSet, setToGaps, reverseSet,
  TRIPWIRE_MODSQ, TRIPWIRE_MAX_N
};
