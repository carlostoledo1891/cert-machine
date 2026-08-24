/* radii.js — the radii-polynomial driver, and the Krawczyk operator.

   Two standard contraction arguments, packaged so that the SIDE CONDITIONS
   cannot be skipped. Neither is new mathematics; both are easy to apply
   slightly wrong in ways that produce a confident wrong answer.

   ---- radiiPolynomial(Y0, Z1, Z2) ----

   For T(x) = x − A F(x) with

       ||T(x̄) − x̄|| <= Y0,     ||DT(x)|| <= Z1 + Z2 r  on B_r(x̄),

   the map sends B_r(x̄) into itself whenever

       p(r) = ½ Z2 r² − (1 − Z1) r + Y0  <  0,

   and it is a CONTRACTION there only if additionally

       kappa = Z1 + Z2 r  <  1,

   in which case it has a unique fixed point — a zero of F. [STANDARD:
   Banach fixed point; the radii-polynomial formulation is the van den
   Berg–Lessard framework.]

   THOSE ARE TWO CONDITIONS AND THIS COMMENT USED TO CLAIM THEY WERE ONE.
   Until 2026-07-30 the paragraph above read "the map is a contraction of
   B_r(x̄) into itself whenever p(r) < 0", and the code checked only p(r) < 0
   — so the file documented the defect as a theorem and then implemented the
   documentation faithfully. p(r) < 0 does NOT imply kappa < 1; they part
   company at the vertex of p, where kappa = 1 exactly. See the guard below
   for the witness and the measured incidence. Corrected here rather than
   silently, because a wrong sentence in the file every consumer reads is how
   the wrong code got written.

   The trap this function closes: the smaller ROOT of p is not a valid radius.
   There p(r) = 0, the contraction is not strict, and nothing is proved. The
   float root is only a starting point; the returned radius is enlarged until
   p(r) < 0 is verified IN INTERVAL ARITHMETIC. This mattered — an earlier
   version of this code reported the root itself and its own consistency check
   caught it.

   ---- krawczyk(F, DF, x0, A) ----

   If K(X) = x0 − A F(x0) + (I − A DF(X))(X − x0) satisfies K(X) ⊂ int(X),
   then F has a unique zero in X. [STANDARD: Krawczyk / Moore.] Strict
   interior containment is the whole content: K(X) ⊆ X is not enough for
   uniqueness, and the check here is strict.

   MIT licensed. Part of eqcert. */
'use strict';

const I = require('./interval.js');
const { iv, add, sub, mul, ONE, ZERO, mag, interior } = I;

/* Y0, Z1, Z2 may be numbers or intervals; the upper bound of each is used. */
const up = v => (typeof v === 'number' ? v : v[1]);

function radiiPolynomial(Y0in, Z1in, Z2in, opts) {
  opts = opts || {};
  const Y0 = up(Y0in), Z1 = up(Z1in), Z2 = up(Z2in);
  const base = { Y0, Z1, Z2 };

  if (!(Z1 < 1)) {
    return Object.assign({ ok: false, why: 'Z1 >= 1 — the approximate inverse is not one; no contraction at any radius' }, base);
  }
  if (!(Z2 > 0)) {
    /* linear problem: p is affine, negative for r > Y0/(1−Z1) */
    const r = I.nextUp(Y0 / (1 - Z1) * 1.5 + Number.MIN_VALUE);
    return Object.assign({ ok: r > 0, r, rMin: Y0 / (1 - Z1), rMax: Infinity, linear: true }, base);
  }
  const disc = (1 - Z1) * (1 - Z1) - 2 * Z2 * Y0;
  if (!(disc > 0)) {
    return Object.assign({ ok: false, why: 'discriminant <= 0 — the defect is too large for the contraction to close', disc }, base);
  }
  const sq = Math.sqrt(disc);
  /* CANCELLATION. The textbook form ((1−Z1) − sqrt(disc))/Z2 for the SMALLER
     root loses all its significant digits exactly when 2·Z2·Y0 << (1−Z1)² —
     that is, when the defect is tiny, which is the case this driver is used in
     almost every time. The stable form is 2·Y0/((1−Z1) + sqrt(disc)), the
     standard trick for the root nearer zero. The battery caught this: a regime
     with Y0 = 1e−20 returned garbage and then failed to verify, which is the
     right failure but for the wrong reason. */
  const rMin = I.nextUp(2 * Y0 / ((1 - Z1) + sq));
  const rMax = I.nextDown(((1 - Z1) + sq) / Z2);

  /* p(r) evaluated rigorously */
  const IY = iv(Y0), IZ1 = iv(Z1), IZ2 = iv(Z2);
  const pAt = rr => {
    const R = iv(rr);
    return add(sub(mul(mul(iv(0.5), IZ2), mul(R, R)), mul(sub(ONE, IZ1), R)), IY);
  };
  /* the root itself has p(r) = 0; walk up until the ENCLOSURE is negative */
  let r = rMin, ok = false;
  for (let t = 0; t < 400; t++) {
    if (r > rMax) break;
    if (pAt(r)[1] < 0) { ok = true; break; }
    r = I.nextUp(r * 1.05 + Number.MIN_VALUE);
  }
  if (!ok) {
    return Object.assign({ ok: false, why: 'no radius verified p(r) < 0 in interval arithmetic', rMin, rMax, disc }, base);
  }

  /* ---- THE CONTRACTION FACTOR, and p(r) < 0 DOES NOT IMPLY IT ----
     Added 2026-07-30, ported UP from research/mfg-cap/kernel/validate.js, which
     had this guard (since 2026-07-29) while this file — the owner every other
     consumer requires — did not. That asymmetry is the whole argument for §5.1:
     the copy was right and the source was wrong, and no gate could see it
     because there is no fingerprint for the radii polynomial.

     p(r) < 0 buys the SELF-MAP property: T maps B_r(x̄) into itself. Contraction
     is a DIFFERENT condition — sup_{B_r} ||DT|| <= Z1 + Z2 r < 1 — and it does
     not follow. Where they part company is the vertex of p at r = (1−Z1)/Z2, at
     which Z1 + Z2 r = 1 exactly. The walk-up above starts at the smaller root
     (below the vertex, where kappa < 1) but multiplies by 1.05 per step, so in
     the near-tangency regime — the roots pinched together, the enclosure of p
     straddling zero for several steps — ONE step can carry r past the vertex
     while still landing below rMax, where p(r) < 0 verifies happily.

     Then T is a self-map of the ball but not a contraction on it: existence
     survives (Brouwer), UNIQUENESS DOES NOT. Returning ok there advertises a
     unique zero in B_r that the argument has not established, which is a false
     certificate of exactly the kind this library exists to refuse.

     WITNESS, and it is the red control in tests/test-eqcert.js (R8):
       Y0 = 4.895599500000001e-13, Z1 = 0.01, Z2 = 1e12
       vertex = 9.9e-13,  returned r = 1.006628123722553e-12 > vertex,
       rMax = 1.021306548835664e-12,  so p(r) < 0 holds,  kappa = 1.0166 >= 1.
     Measured incidence before the fix: 84 of 2520 deliberately near-tangency
     triples returned ok with kappa >= 1. In the regime the shipped certifiers
     actually run (Y0 ~ 3.5e-15, Z1 ~ 0.53, Z2 ~ 23.7) the discriminant is ~12
     orders from tangency, so this was a LOADED TRAP, not a live wound: no
     certificate in ledger/ is affected. It is fixed because the next instance
     need not be so far from the edge.

     kappa is increasing in r, so no larger radius helps — refuse, do not retry. */
  const kappa = add(iv(Z1), mul(iv(Z2), iv(r)));
  if (!(kappa[1] < 1)) {
    return Object.assign({
      ok: false, r, rMin, rMax, disc, kappa: kappa[1],
      why: 'contraction factor Z1 + Z2*r >= 1 at the smallest radius closing p(r) < 0 — ' +
           'T is a self-map of the ball but NOT a contraction on it, so existence may hold ' +
           'but local UNIQUENESS does not follow (kappa is increasing in r, so no larger ' +
           'radius helps)'
    }, base);
  }
  return Object.assign({ ok: true, r, rMin, rMax, disc, pAtR: pAt(r)[1], kappa: kappa[1] }, base);
}

/* ---- Krawczyk enclosure for a finite-dimensional system ----
   F  : (X:interval[]) -> interval[]        the map whose zero is sought
   DF : (X:interval[]) -> interval[][]      its Jacobian over a box
   x0 : number[]                            the numerical candidate
   A  : number[][]                          approximate inverse of DF(x0)
   opts: {rad0, maxRounds, growth, radCap}                                  */
function krawczyk(F, DF, x0, A, opts) {
  opts = opts || {};
  const n = x0.length;
  const maxRounds = opts.maxRounds || 24;
  const Xp = x0.map(v => iv(v));
  const F0 = F(Xp);

  /* d = A F(x0) */
  const d = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = ZERO;
    for (let j = 0; j < n; j++) s = add(s, mul(iv(A[i][j]), F0[j]));
    d[i] = s;
  }
  let rad = new Array(n);
  for (let i = 0; i < n; i++) rad[i] = (opts.rad0 || 0) || (2 * mag(d[i]) + 1e-13 * Math.max(1, Math.abs(x0[i])));

  for (let round = 0; round < maxRounds; round++) {
    const X = x0.map((v, i) => iv(I.nextDown(v - rad[i]), I.nextUp(v + rad[i])));
    const J = DF(X);
    const K = new Array(n);
    let ok = true, maxRad = 0;
    for (let i = 0; i < n; i++) {
      let acc = sub(iv(x0[i]), d[i]);
      for (let j = 0; j < n; j++) {
        let s = ZERO;
        for (let k = 0; k < n; k++) {
          const jk = J[k][j];
          if (jk[0] === 0 && jk[1] === 0) continue;
          s = add(s, mul(iv(A[i][k]), jk));
        }
        let m = [-s[1], -s[0]];
        if (i === j) m = add(ONE, m);
        if (m[0] === 0 && m[1] === 0) continue;
        acc = add(acc, mul(m, sub(X[j], iv(x0[j]))));
      }
      K[i] = acc;
      if (!interior(acc, X[i])) ok = false;
      maxRad = Math.max(maxRad, (acc[1] - acc[0]) / 2);
    }
    if (ok) return { ok: true, box: X, image: K, maxRad, rounds: round + 1 };
    for (let i = 0; i < n; i++) {
      const need = Math.max(Math.abs(K[i][0] - x0[i]), Math.abs(K[i][1] - x0[i]));
      rad[i] = Math.max(rad[i] * (opts.growth || 2), need * 1.1 + 1e-15);
    }
    if (opts.radCap && Math.max.apply(null, rad) > opts.radCap)
      return { ok: false, why: 'no contraction below the radius cap' };
  }
  return { ok: false, why: 'no contraction within the round limit' };
}

module.exports = { radiiPolynomial, krawczyk };
