/* tail.js — what an UNDETERMINED degree costs, and the one place that decides it.

   The Erdős #290 bracket is assembled from densities δ(f_d). Where the Galois
   group is known, δ is an exact rational and the degree contributes a point.
   Where it is not known, the degree contributes an INTERVAL, and the width of
   the whole bracket is nothing but the sum of those intervals.

   Until now that interval was hard-wired to [0, 1] — the honest statement that
   nothing at all is known. This file makes it a PARAMETER, because three quite
   different mathematical ideas are all, mechanically, the same move: replace
   [0,1] with something narrower and justified.

     (a) a global bound       "δ lies in [A,B] for every large even d"
     (b) a family bound       the same, restricted to a residue class of d
     (c) the full assumption  δ is the hyperoctahedral value, to within the
                              index-2 allowance — the tail collapses

   THE POINT IS NOT THE ARITHMETIC, IT IS THE PRICING. Because the bracket is
   exact and monotone, a constraint can be evaluated BEFORE anyone proves it:
   state the lemma, and the machine returns how many digits it would buy. That
   turns "which theorem should I chase?" from taste into a measurement, and it
   is the reason this file exists as its own module rather than as a flag.

   WHAT δ ACTUALLY IS, so the constraints below are not folklore. Under
   Gal(f_{2l}) ≅ S_l^+ the kernel gives

       δ_hyp(l) = 1 − Σ_{i=0}^{l} (−1)^i / (2^i i!)

   whose sum is a truncation of e^{−1/2}. So δ_hyp(l) → 1 − e^{−1/2} =
   0.3934693… and it gets there FAST: the partial sums of e^{−1/2} alternate,
   so the error after l terms is under 1/(2^{l+1}(l+1)!), which is below 1e-11
   by l = 10. The index-2 subgroup sits 1/(2^l l!) below that.

   That number is why (a) is worth so much. The true δ is near 0.3935 and we
   are charging it the full unit. A lemma pinning δ to a window of width 0.1
   does not shave the tail — it cuts it TENFOLD, everywhere, at once, with no
   computation at all.

   MIT. Part of cert-machine. */
'use strict';

/* ---- the limit 1 − e^{−1/2}, as an exact rational enclosure ---------------
   Σ_{i=0}^{n} (−1)^i/(2^i i!) is an alternating series with decreasing terms,
   so consecutive partial sums bracket the limit and the error is bounded by
   the first omitted term. Nothing here is a float. */
function limitEnclosure(Q, n) {
  const R = Q.R, add = Q.add, sub = Q.sub, ONE = Q.R(1n, 1n);
  let s = Q.R(0n, 1n), fact = 1n;
  for (let i = 0; i <= n; i++) {
    if (i > 0) fact *= BigInt(i);
    const t = R(1n, (2n ** BigInt(i)) * fact);
    s = (i % 2 === 0) ? add(s, t) : sub(s, t);
  }
  let f2 = fact * BigInt(n + 1);
  const err = R(1n, (2n ** BigInt(n + 1)) * f2);       /* first omitted term */
  /* δ = 1 − Σ, so the enclosure flips */
  return { lo: sub(ONE, add(s, err)), hi: sub(ONE, sub(s, err)) };
}

/* ---- the constraint registry ---------------------------------------------
   A constraint answers ONE question: for every degree past the pinned horizon
   that we have not computed, what interval may δ be assumed to lie in?
   `bounds()` returns exact rationals {A, B} valid for ALL such degrees. Any
   constraint other than `full` is a CLAIM and carries the lemma that would
   have to be proved, in `needs`. */
function constraints(Q) {
  const R = Q.R, ZERO = R(0n, 1n), ONE = R(1n, 1n);
  const LIM = limitEnclosure(Q, 40);
  const clamp01 = (x) => (Q.cmp(x, ZERO) < 0 ? ZERO : Q.cmp(x, ONE) > 0 ? ONE : x);
  const frac = (num, den) => R(BigInt(num), BigInt(den));

  return {
    full: {
      id: 'full',
      label: 'δ ∈ [0,1]  (nothing assumed)',
      needs: 'nothing — this is the honest cost of ignorance and the status quo',
      bounds: () => ({ A: ZERO, B: ONE })
    },

    /* (a) a global two-sided window around the hyperoctahedral limit */
    window: (numer, denom) => ({
      id: 'window:' + numer + '/' + denom,
      label: 'δ within ±' + (numer / (2 * denom)) + ' of 1−e^(−1/2)',
      needs: 'a lemma bounding δ(f_d) to a window of width ' + (numer / denom)
        + ' about 1−e^(−1/2) ≈ 0.3935, for every large even d',
      bounds: () => {
        const half = R(BigInt(numer), BigInt(2 * denom));
        return { A: clamp01(Q.sub(LIM.lo, half)), B: clamp01(Q.add(LIM.hi, half)) };
      }
    }),

    /* (a′) the weaker, one-sided version: a floor under δ */
    floor: (numer, denom) => ({
      id: 'floor:' + numer + '/' + denom,
      label: 'δ ≥ ' + (numer / denom),
      needs: 'a lemma proving δ(f_d) ≥ ' + numer + '/' + denom + ' for every large even d',
      bounds: () => ({ A: frac(numer, denom), B: ONE })
    }),

    /* (a″) a one-sided ceiling — often easier than a floor, since a derangement
       count is bounded below by classical results on transitive groups */
    ceiling: (numer, denom) => ({
      id: 'ceiling:' + numer + '/' + denom,
      label: 'δ ≤ ' + (numer / denom),
      needs: 'a lemma proving δ(f_d) ≤ ' + numer + '/' + denom + ' for every large even d',
      bounds: () => ({ A: ZERO, B: frac(numer, denom) })
    }),

    /* (c) the assumption already carried by the conditional expansion */
    hyperoct: {
      id: 'hyperoct',
      label: 'δ = the hyperoctahedral value (the standing assumption)',
      needs: 'the theorem that Gal(f_d) is S_l^+ or its index-2 subgroup for every even d',
      bounds: (L) => {
        /* both candidates lie within 1/(2^{L} L!) of the limit for l > L, and
           the index-2 group sits below by at most the same quantity */
        let fact = 1n; for (let i = 2; i <= L + 1; i++) fact *= BigInt(i);
        const slack = R(1n, (2n ** BigInt(L + 1)) * fact);
        return { A: clamp01(Q.sub(LIM.lo, slack)), B: clamp01(Q.add(LIM.hi, slack)) };
      }
    },

    limit: LIM
  };
}

/* ---- the bracket, assembled once ------------------------------------------
   Extracted from tools/build-report-erdos290.js so the report and the pricing
   tool cannot drift. The extraction is not taken on trust: that builder's
   calibration gate re-assembles the cited horizon and refuses unless it
   reproduces the published record to every displayed digit, so a faithless
   extraction fails the build rather than shipping. */
function makeBracket({ Q, K, L2, EXACT, EXC, W }) {
  const add = Q.add, sub = Q.sub, mul = Q.mul, ZERO = Q.R(0n, 1n), ONE = Q.R(1n, 1n);
  return function bracket(maxPinned, C) {
    const con = C || { bounds: () => ({ A: ZERO, B: ONE }) };
    const { A, B } = con.bounds(maxPinned);
    let lo = add(L2.lo, ZERO), hi = add(L2.hi, ZERO);
    for (let l = 1; l <= 30; l++) {
      if (EXC.has(l)) continue;
      const d = mul(K.deltaHyperoct(l), W(l));
      lo = add(lo, d); hi = add(hi, d);
    }
    let partial = ZERO;
    for (let l = 1; l <= maxPinned; l++) partial = add(partial, W(l));
    /* the weight of everything past the horizon, itself an interval because
       log 2 is: charge its LOWER end at A and its UPPER end at B */
    const tailLo = sub(sub(ONE, L2.hi), partial);
    const tailHi = sub(sub(ONE, L2.lo), partial);
    lo = add(lo, mul(A, tailLo));
    hi = add(hi, mul(B, tailHi));
    const pinnable = [4, 12, 24];
    for (let l = 31; l <= maxPinned; l++) pinnable.push(l);
    for (const l of pinnable) {
      const w = W(l);
      if (EXACT.has(l)) { const d = mul(EXACT.get(l), w); lo = add(lo, d); hi = add(hi, d); }
      else { lo = add(lo, mul(A, w)); hi = add(hi, mul(B, w)); }
    }
    return { lo, hi };
  };
}


/* ---- the inputs the bracket needs, loaded once ----------------------------
   ln 2 as an exact enclosure, the weights, and every δ this repository has
   pinned — the kernel's own table, the lifted tail-deltas, and the campaign
   extension in certs/, applied in that order so a later record wins. Both
   consumers (the report and the lemma-value tool) load through here, so
   neither can be looking at a different set of pinned degrees than the other. */
function loadInputs(ROOT, LEG) {
  const fs = require('fs'), path = require('path');
  const Q = require(path.join(LEG, 'rational.js'));
  const K = require(path.join(LEG, 'kernel.js'));
  const R = Q.R, add = Q.add, mul = Q.mul, ZERO = R(0n, 1n);
  const W = (l) => R(1n, BigInt(2 * l) * BigInt(2 * l + 1));
  const EXC = new Set([4, 12, 24]);
  const L2 = (() => {
    let s = ZERO;
    for (let k = 0; k < 40; k++) { const m = 2 * k + 1; s = add(s, R(2n, BigInt(m) * 3n ** BigInt(m))); }
    const m = 81;
    return { lo: s, hi: add(s, mul(R(2n, BigInt(m) * 3n ** BigInt(m)), R(9n, 8n))) };
  })();
  const EXACT = new Map(K.EXACT_DELTAS);
  for (const [l, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(LEG, 'tail-deltas.json'), 'utf8')).deltas))
    EXACT.set(Number(l), R(BigInt(v.n), BigInt(v.d)));
  const extPath = path.join(ROOT, 'certs', 'erdos290-tail-ext.json');
  const EXT = fs.existsSync(extPath) ? JSON.parse(fs.readFileSync(extPath, 'utf8')) : { deltas: {}, open: [] };
  for (const [l, v] of Object.entries(EXT.deltas)) EXACT.set(Number(l), R(BigInt(v.n), BigInt(v.d)));
  const extLs = Object.keys(EXT.deltas).map(Number).sort((a, b) => a - b);
  const Lmax = extLs.length ? extLs[extLs.length - 1] : 60;
  return { Q, K, R, W, EXC, L2, EXACT, EXT, extLs, Lmax };
}


module.exports = { constraints, limitEnclosure, makeBracket, loadInputs };
