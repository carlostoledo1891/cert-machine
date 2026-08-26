/* verify.js — independent re-verification (Lane B) of the numerical-inequality side of
   arXiv:2607.17748, F. Wikström, "Moment duality and an improved lower bound for
   Korenblum's constant" (source: src/eprint/korenblum_04263.tex,
   sha256 2dd0681440289bda8907e133d53c6d08d1c032fdeae0510a9a3726a6693c2c7c).

   CLAIM CHECKED. With c = 4263/10000, s = c^2, R = 99/100, and the 8-atom + Lebesgue
   measure of the paper's Table 1, the criterion of Lemma 3.1 reduces (paper eqs (11)-(13))
   to the two families
       A_k = sum_j w_j t_j^k - R^{k+1}/(k+1)                >= 0   (k >= 0)
       B_k = int_R^1 t^k / G_c(sqrt t) dt + R^{k+1}/(k+1)
             - sum_j w_j beta_c(sqrt t_j) t_j^k             >= 0   (k >= 1)
   where G_c, beta_c = 1 - 1/G_c come from Wang's annular product K_c (paper eq (1)).
   We certify BOTH families with our own arithmetic, fully independent of Arb:

     - exact BigInt rationals for every structural identity and the two analytic tails;
     - outward-rounded double intervals (core/interval/interval.js) for the k-sweeps;
     - a fixed-point BigInt interval layer (quantum 10^-32, floor/ceil directed rounding)
       for the chain K^2 -> 1-K^2 -> G -> 1/G, where 1-K^2 ~ 5e-10 makes doubles
       catastrophically cancel;
     - K_c(sqrt t)^2 = 4 (t+c)^2/t * P(t)^2 is a RATIONAL function of t (sqrt t enters
       only squared), so no transcendental is ever needed; the only non-rational op is
       integer sqrt of a BigInt (floor/ceil exact).

   INFINITE-PRODUCT TAILS (re-derived here, they agree with paper eqs (14)-(15)):
   with L <= t, truncation after N factors,
     |log K^2 - log K_N^2| <= eps  = 2(1+3c+2c^2+(c^3+c^2)/L) c^{2N}/(1-c^2)
       (paper states the bound for log K, i.e. half of this; we use our own derivation:
        omitted numerator terms sum_{n>N} [t c^{2n-1} + c^{2n+1}/(tL->/L) + 2c^{2n}] and
        denominator terms [c^{2n-2}(<=/c^2 scale) + c^{2n}/L + 2c^{2n-1}], |log(1+x)|<=x
        for x>=0 and log(1/(1+x)) >= -x; geometric sums give the stated constant), and
     |d/dt log K^2 - d/dt log K_N^2| <= epsD = 2(1+c+(c^2+c^3)/L^2) c^{2N}/(1-c^2)
       (bounds 1/(1+tc^m) <= 1 and 1/(t(t+c^m)) <= 1/L^2).
   With N = 28, c^{56} ~ 1.8e-21, both are ~1e-20: negligible but carried rigorously.

   MONOTONICITY (replaces the paper's eq (16)-(17) computation, same logic):
   the quadrature (paper eq (18)) needs inf 1/G on each subinterval at its RIGHT endpoint,
   i.e. K^2 increasing. We prove phi'(t) = d/dt log K^2(t) > 0 on [R, 0.99999] by adaptive
   bisection with double-interval arithmetic on the algebraically PAIRED form
     phi'(t) = (t-c)/(t(t+c))
             + 2 sum_{n>=1} [ c^{2n}(1-c) / ((t+c^{2n})(t+c^{2n+1}))
                            - c^{2n-2}(1-c) / ((1+t c^{2n-1})(1+t c^{2n-2})) ]  -+ epsD,
   which is exactly equal (partial fractions verified by an in-code self-test) to the
   term-by-term derivative of log[4(t+c)^2/t * prod F_n(t)^2] and has far smaller
   interval-dependency width than the raw form.

   QUADRATURE. Same subdivision as the paper: [R,0.999] in 30000, [0.999,0.9999] in 5000,
   [0.9999,0.99999] in 500 equal pieces (all endpoints exact decimals); on each piece
   int t^k/G dt >= invG_lo(right endpt) * (u_{j+1}^{k+1}-u_j^{k+1})/(k+1); the positive
   remainder over [0.99999,1] is discarded (as in the paper — this discard silently uses
   G > 0 there, i.e. K_c < 1 near 1, which is part of Wang's framework: NOT re-checked).

   TAILS OF THE k-FAMILIES (paper's arguments, re-verified exactly here):
     A, k >= 2184:  w_8 (k+1) >= 2185 w_8 > R  (exact BigInt)  => A_k > 0.
     B, k >= 1300:  base case at k = 1300 with our quadrature restricted to
                    [a,b] = [0.9980001, 0.999] (grid points), then induction: LHS ratio
                    a > 0.99 = max_j t_j >= RHS ratio (exact BigInt comparisons).

   NOT CHECKED (out of scope, listed also in VERDICT.md): Lemma 3.1 itself (the duality
   argument), Wang's Proposition 2.1 and the formula (1) for K_c/G_c, K_c < 1 on the
   discarded sliver (0.99999,1), the beta_c(c)=1 endpoint convention, and the literature
   value 0.3554 being the previous record.

   Runtime target < 120 s. Node >= 16. Usage: node verify.js */
'use strict';

const t0wall = Date.now();
const path = require('path');
/* WHERE THE TOOLKIT IS, and why this is not `path.join(__dirname, '..', '..', '..')`.
   This verifier ships, and it runs from two trees whose depths have not always agreed. It counted
   `..` three times, which was right in exactly one of them; on 2026-08-08 the pages moved to their
   routes and it became right in the other one instead; on 2026-08-21 the two converged. That is
   the whole argument — THE DEPTH KEPT CHANGING AND THE MARKER NEVER DID. A depth is a fact about a
   layout; a MARKER is a fact about the toolkit. Find the root by looking for
   core/interval/interval.js above this file, and the verifier survives any move of either tree.
   Bounded, and it names the failure rather than throwing a module-resolution stack trace at a
   reader who just downloaded a certificate pack.
   THIS COMMENT DELIBERATELY NAMES NO CURRENT LOCATION (2026-08-21). The file is sha-pinned by its
   claim record, so a layout fact written HERE costs a re-verification every time the tree moves —
   and this block had already gone stale twice, the second time incoherently, still contrasting two
   depths after they became the same. C51 and C52 are the same lesson seen from two ends. */
const fs = require('fs');
function eqcertSrc(from) {
  let d = from;
  for (let i = 0; i < 8; i++) {
    const cand = path.join(d, 'core', 'interval');
    if (fs.existsSync(path.join(cand, 'interval.js'))) return cand;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  throw new Error('verify.js: eqcert/src was not found above ' + from +
    ' — this verifier needs the interval toolkit it was published beside.');
}
const EQSRC = eqcertSrc(__dirname);
const IV = require(path.join(EQSRC, 'interval.js'));
const { nextUp, nextDown, iv, add, sub, mul, div } = IV;

/* ---------------- exact rational layer (BigInt) ---------------- */
function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; }
class Rat {
  constructor(p, q = 1n) { if (q < 0n) { p = -p; q = -q; } const g = gcd(p, q) || 1n; this.p = p / g; this.q = q / g; }
  add(o) { return new Rat(this.p * o.q + o.p * this.q, this.q * o.q); }
  sub(o) { return new Rat(this.p * o.q - o.p * this.q, this.q * o.q); }
  mul(o) { return new Rat(this.p * o.p, this.q * o.q); }
  div(o) { return new Rat(this.p * o.q, this.q * o.p); }
  cmp(o) { const d = this.p * o.q - o.p * this.q; return d < 0n ? -1 : d > 0n ? 1 : 0; }
  eq(o) { return this.cmp(o) === 0; } gt(o) { return this.cmp(o) > 0; } ge(o) { return this.cmp(o) >= 0; }
  isPos() { return this.p > 0n; }
  toString() { return `${this.p}/${this.q}`; }
}
function ratFromDecimal(s) {            /* exact terminating decimal -> Rat */
  const m = s.match(/^(\d+)\.(\d+)$/); if (!m) throw new Error('bad decimal ' + s);
  return new Rat(BigInt(m[1] + m[2]), 10n ** BigInt(m[2].length));
}
/* Rat -> outward double interval. Number(BigInt) and double division are correctly
   rounded (<= 1/2 ulp each), so two outward steps per side enclose rigorously. */
function ratToIv(r) {
  const v = Number(r.p) / Number(r.q);
  return [nextDown(nextDown(v)), nextUp(nextUp(v))];
}

/* ---------------- fixed-point BigInt interval layer ----------------
   value x is enclosed by [lo,hi] meaning lo/S <= x <= hi/S, S = 10^32.
   All operands in this program are >= 0; ops check nothing they don't need. */
const FXD = 32n, S = 10n ** FXD;
const ceilDiv = (n, d) => (n + d - 1n) / d;                       /* n,d > 0 */
const fx = (lo, hi) => ({ lo, hi });
const FX1 = fx(S, S), FX2 = fx(2n * S, 2n * S);
const fxFromRat = r => fx((r.p * S) / r.q, ceilDiv(r.p * S, r.q)); /* r >= 0 */
const fxAdd = (a, b) => fx(a.lo + b.lo, a.hi + b.hi);
const fxSub = (a, b) => fx(a.lo - b.hi, a.hi - b.lo);
const fxMul = (a, b) => fx((a.lo * b.lo) / S, ceilDiv(a.hi * b.hi, S));   /* a,b >= 0 */
const fxDiv = (a, b) => fx((a.lo * S) / b.hi, ceilDiv(a.hi * S, b.lo));   /* a>=0, b>0 */
function isqrt(n) {                     /* floor sqrt of BigInt n >= 0 */
  if (n < 2n) return n;
  let x = 1n << (BigInt(n.toString(2).length + 1) >> 1n);
  for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; }
}
const fxSqrt = a => fx(isqrt(a.lo * S), isqrt(a.hi * S) + 1n);    /* a >= 0 */
function fxToNumLo(a) {                 /* double <= a.lo/S ; 1e-15 rel pad >> 2*2^-53 */
  const v = Number(a.lo) / 1e32; return nextDown(v - Math.abs(v) * 1e-15);
}
function fxToNumHi(a) {
  const v = Number(a.hi) / 1e32; return nextUp(v + Math.abs(v) * 1e-15);
}

/* ---------------- problem data (exact, from the paper) ---------------- */
const N = 28;                                        /* product truncation, as in paper */
const cR = new Rat(4263n, 10000n);
const sR = cR.mul(cR);                               /* 0.18173169 */
const RR = new Rat(99n, 100n);
const T_STR = ['0.1817316900000000', '0.5786106116843371', '0.8163605367760075',
  '0.9200761835179418', '0.9633238309788337', '0.9813028389745606',
  '0.9881242650409469', '0.9900000000000000'];
const W_STR = ['0.3924240372921149', '0.3349420206616465', '0.1555309603886983',
  '0.0649137961077427', '0.0271186307684793', '0.0109963471767101',
  '0.0036210554863853', '0.0004531521182229'];
const KMAX_A = 2183, KTAIL_A = 2184, KMAX_B = 1299, KTAIL_B = 1300;
const PAPER_BETA_HI = [null, null, 0.989685929536115, 0.995533783756722, 0.998127951092143,
  0.999157174953505, 0.999573932287887, 0.999730257446456, 0.999773067105237];

const tRat = T_STR.map(ratFromDecimal), wRat = W_STR.map(ratFromDecimal);

/* rational powers of c up to c^(2N+1), exact */
const cPowRat = [new Rat(1n)];
for (let m = 1; m <= 2 * N + 1; m++) cPowRat.push(cPowRat[m - 1].mul(cR));

/* truncation tails (re-derived; see header). L = R. */
const one = new Rat(1n), two = new Rat(2n);
const oneMinusC2 = one.sub(cPowRat[2]);
const epsValRat = two.mul(one.add(cR.mul(new Rat(3n))).add(cPowRat[2].mul(two))
  .add(cPowRat[2].add(cPowRat[3]).div(RR))).mul(cPowRat[2 * N]).div(oneMinusC2);
const epsDerRat = two.mul(one.add(cR).add(cPowRat[2].add(cPowRat[3]).div(RR.mul(RR))))
  .mul(cPowRat[2 * N]).div(oneMinusC2);
const epsDer = ratToIv(epsDerRat)[1];                /* double upper bound */
/* fixed-point tail multiplier for K^2: [ (1-eps)^... ] — K^2 in [K_N^2 e^-eps, K_N^2 e^eps]
   with e^-eps >= 1-eps and e^eps <= 1+2eps (valid for eps <= 1/2; eps ~ 1e-20). */
if (epsValRat.gt(new Rat(1n, 2n))) throw new Error('eps too large for linearization');
const tailFx = fx(fxFromRat(one.sub(epsValRat)).lo, fxFromRat(one.add(epsValRat.mul(two))).hi);

/* fixed-point powers of c (thin outward) */
const cPowFx = cPowRat.map(fxFromRat);
/* per-n constant (1+c^{2n})^2/(1+c^{2n-1})^2, precomputed in fx */
const constFacFx = [];
for (let n = 1; n <= N; n++) {
  const num = fxFromRat(one.add(cPowRat[2 * n]).mul(one.add(cPowRat[2 * n])));
  const den = fxFromRat(one.add(cPowRat[2 * n - 1]).mul(one.add(cPowRat[2 * n - 1])));
  constFacFx.push(fxDiv(num, den));
}

/* ---------------- K^2, G, 1/G at an exact rational point (fixed point) ------------- */
/* K^2(t) = 4 (t+c)^2 / t * prod_{n=1..N} F_n(t)^2 * tail,  t given as Rat (thin). */
function invG_fx(tR_) {
  const T = fxFromRat(tR_);
  const cFx = fxFromRat(cR);
  const tPlusC = fxAdd(T, cFx);
  let K2 = fxDiv(fxMul(fx(4n * tPlusC.lo, 4n * tPlusC.hi), tPlusC), T); /* 4(t+c)^2/t */
  let P = FX1;
  for (let n = 1; n <= N; n++) {
    const numer = fxMul(fxAdd(FX1, fxMul(T, cPowFx[2 * n - 1])),
                        fxAdd(FX1, fxDiv(cPowFx[2 * n + 1], T)));
    const denom = fxMul(fxAdd(FX1, fxMul(T, cPowFx[2 * n - 2])),
                        fxAdd(FX1, fxDiv(cPowFx[2 * n], T)));
    P = fxMul(P, fxMul(constFacFx[n - 1], fxDiv(numer, denom)));
  }
  K2 = fxMul(K2, fxMul(P, P));
  K2 = fxMul(K2, tailFx);
  const D = fxSub(FX1, K2);                          /* 1 - K^2 */
  if (D.lo <= 0n) throw new Error('cannot certify K^2 < 1 at t = ' + tR_.toString());
  if (K2.lo <= 0n) throw new Error('K^2 lower bound not positive');
  const Q = fxDiv(fxAdd(FX1, fxMul(fx(3n * S, 3n * S), K2)), D); /* (1+3K^2)/(1-K^2) */
  const invG = fxDiv(FX2, fxAdd(FX1, fxSqrt(Q)));    /* 2/(1+sqrt(Q)) */
  return { lo: fxToNumLo(invG), hi: fxToNumHi(invG) };
}

/* ---------------- phi'(t) enclosure over a double interval T ---------------- */
const cIv = ratToIv(cR), oneMinusCIv = ratToIv(one.sub(cR));
const cPowIv = cPowRat.map(ratToIv);
function phiPrime(T) {
  /* (t-c)/(t(t+c)) */
  let acc = div(sub(T, cIv), mul(T, add(T, cIv)));
  let s2 = iv(0, 0);
  for (let n = 1; n <= N; n++) {
    const pos = div(mul(cPowIv[2 * n], oneMinusCIv),
                    mul(add(T, cPowIv[2 * n]), add(T, cPowIv[2 * n + 1])));
    const neg = div(mul(cPowIv[2 * n - 2], oneMinusCIv),
                    mul(add(iv(1, 1), mul(T, cPowIv[2 * n - 1])),
                        add(iv(1, 1), mul(T, cPowIv[2 * n - 2]))));
    s2 = add(s2, sub(pos, neg));
  }
  acc = add(acc, add(s2, s2));                       /* + 2*sum */
  return add(acc, iv(-epsDer, epsDer));              /* truncation tail */
}
/* prove phi' > 0 on [lo,hi] by adaptive bisection; returns leaf count */
function proveIncreasing(lo, hi, depth = 0) {
  if (depth > 40) throw new Error(`monotonicity NOT certified on [${lo},${hi}]`);
  const p = phiPrime([lo, hi]);
  if (p[0] > 0) return 1;
  const mid = lo + (hi - lo) / 2;
  if (!(mid > lo && mid < hi)) throw new Error('bisection bottomed out at ' + lo);
  return proveIncreasing(lo, mid, depth + 1) + proveIncreasing(mid, hi, depth + 1);
}

/* self-test: paired phi' formula === raw term-by-term derivative (floats, 1e-12) */
(function selfTest() {
  const c = 0.4263;
  for (const t of [0.991, 0.9955, 0.9991, 0.99995]) {
    let raw = 2 / (t + c) - 1 / t, cp = 1;
    for (let n = 1; n <= N; n++) {
      const c1 = cp * c, c2 = c1 * c, c3 = c2 * c;   /* c^{2n-2},c^{2n-1},c^{2n},c^{2n+1} */
      raw += 2 * (c1 / (1 + t * c1) - cp / (1 + t * cp) + c2 / (t * (t + c2)) - c3 / (t * (t + c3)));
      cp = c2;
    }
    let paired = (t - c) / (t * (t + c)); cp = 1;
    for (let n = 1; n <= N; n++) {
      const c1 = cp * c, c2 = c1 * c, c3 = c2 * c;
      paired += 2 * (c2 * (1 - c) / ((t + c2) * (t + c3)) - cp * (1 - c) / ((1 + t * c1) * (1 + t * cp)));
      cp = c2;
    }
    /* raw form cancels O(0.1) terms -> ~1e-16 absolute float noise; compare absolutely */
    if (Math.abs(raw - paired) > 1e-13)
      throw new Error(`phi' pairing self-test FAILED at t=${t}: ${raw} vs ${paired}`);
  }
})();

/* ---------------- exact structural checks ---------------- */
function exactChecks(c_, tArr, wArr, label) {
  const errs = [];
  const s_ = c_.mul(c_);
  let mass = new Rat(0n);
  for (const w of wArr) { if (!w.isPos()) errs.push('weight <= 0'); mass = mass.add(w); }
  if (!mass.eq(RR)) errs.push(`sum w_j = ${mass} != R`);
  if (!tArr[0].eq(s_)) errs.push('t_1 != c^2');
  if (!tArr[7].eq(RR)) errs.push('t_8 != R');
  for (const t of tArr) { if (t.cmp(s_) < 0 || t.cmp(one) >= 0) errs.push(`atom ${t} outside [c^2,1)`); }
  /* total mass with Lebesgue part = R + (1-R) = 1 — probability measure */
  if (!mass.add(one.sub(RR)).eq(one)) errs.push('total mass != 1');
  /* A-family tail k >= 2184: w_8 * 2185 > R, and max t_j = R so atoms only help */
  if (!wArr[7].mul(new Rat(2185n)).gt(RR)) errs.push('A-tail: 2185 w_8 <= R');
  for (const t of tArr) { if (t.gt(RR)) errs.push('atom above R breaks A/B tail ratios'); }
  if (errs.length && label) console.log(`  [${label}] exact-check failures: ${errs.join('; ')}`);
  return errs;
}

/* ---------------- A-family sweep (double intervals) ---------------- */
function runA(tArr, wArr) {
  const tLoA = [], tHiA = [], wLoA = [], wHiA = [];
  for (let j = 0; j < 8; j++) {
    const tI = ratToIv(tArr[j]), wI = ratToIv(wArr[j]);
    tLoA.push(tI[0]); tHiA.push(tI[1]); wLoA.push(wI[0]); wHiA.push(wI[1]);
  }
  const RIv = ratToIv(RR);
  const pLo = new Float64Array(8).fill(1), pHi = new Float64Array(8).fill(1);
  let RpLo = RIv[0], RpHi = RIv[1];
  let minRel = Infinity, minK = -1, fail = null, a23 = null;
  for (let k = 1; k <= KMAX_A; k++) {
    let SLo = 0, SHi = 0;
    for (let j = 0; j < 8; j++) {
      let pl = pLo[j] * tLoA[j]; pLo[j] = pl > 0 ? nextDown(pl) : 0;
      pHi[j] = nextUp(pHi[j] * tHiA[j]);
      SLo = nextDown(SLo + (pLo[j] > 0 ? nextDown(wLoA[j] * pLo[j]) : 0));
      SHi = nextUp(SHi + nextUp(wHiA[j] * pHi[j]));
    }
    RpLo = nextDown(RpLo * RIv[0]); RpHi = nextUp(RpHi * RIv[1]);   /* R^{k+1} */
    const rtLo = nextDown(RpLo / (k + 1)), rtHi = nextUp(RpHi / (k + 1));
    const ALo = nextDown(SLo - rtHi), AHi = nextUp(SHi - rtLo);
    const rel = ALo / rtHi;
    if (rel < minRel) { minRel = rel; minK = k; }
    if (k === 23) a23 = { ALo, rel };
    if (ALo <= 0 && !fail) fail = { k, ALo, AHi };
  }
  return { fail, minRel, minK, a23 };
}

/* ---------------- quadrature grid (exact decimal boundaries) ---------------- */
function buildGrid() {
  const bounds = [];                                  /* Rat boundaries */
  for (let i = 0; i <= 30000; i++) bounds.push(new Rat(9900000n + 3n * BigInt(i), 10000000n));
  for (let i = 1; i <= 5000; i++) bounds.push(new Rat(99900000n + 18n * BigInt(i), 100000000n));
  for (let i = 1; i <= 500; i++) bounds.push(new Rat(99990000n + 18n * BigInt(i), 100000000n));
  return bounds;                                      /* 35501 boundaries, R .. 0.99999 */
}

/* ---------------- B-family sweep ---------------- */
function runB(tArr, wArr, betaHi, uLo, uHi, invGlo, kFrom, kTo) {
  const M = invGlo.length;                            /* subintervals */
  const pLo = new Float64Array(M + 1), pHi = new Float64Array(M + 1);
  for (let m = 0; m <= M; m++) { pLo[m] = uLo[m]; pHi[m] = uHi[m]; }   /* u^1 */
  const RIv = ratToIv(RR);
  let RpLo = RIv[0], RpHi = RIv[1];
  const atLo = [], atHi = [], wbHi = [];
  for (let j = 0; j < 8; j++) {
    const tI = ratToIv(tArr[j]), wI = ratToIv(wArr[j]);
    atLo.push(tI[0]); atHi.push(tI[1]);
    wbHi.push(nextUp(wI[1] * betaHi[j]));             /* w_hi * beta_hi */
  }
  const apHi = new Float64Array(8).fill(1);
  let minRel = Infinity, minK = -1, fail = null, b522 = null;
  for (let k = kFrom; k <= kTo; k++) {
    /* powers: boundaries u^{k+1}, R^{k+1}, atoms t^k */
    for (let m = 0; m <= M; m++) {
      const pl = pLo[m] * uLo[m]; pLo[m] = pl > 0 ? nextDown(pl) : 0;
      pHi[m] = nextUp(pHi[m] * uHi[m]);
    }
    RpLo = nextDown(RpLo * RIv[0]); RpHi = nextUp(RpHi * RIv[1]);
    let SHi = 0;
    for (let j = 0; j < 8; j++) {
      apHi[j] = nextUp(apHi[j] * atHi[j]);
      SHi = nextUp(SHi + nextUp(wbHi[j] * apHi[j]));
    }
    /* I_k lower: sum_j invGlo_j (u_{j+1}^{k+1} - u_j^{k+1}) / (k+1) */
    let acc = 0;
    for (let m = 0; m < M; m++) {
      const d = nextDown(pLo[m + 1] - pHi[m]);
      if (d > 0) acc = nextDown(acc + nextDown(invGlo[m] * d));
    }
    const ILo = nextDown(acc / (k + 1));
    const rtLo = nextDown(RpLo / (k + 1)), rtHi = nextUp(RpHi / (k + 1));
    const BLo = nextDown(nextDown(ILo + rtLo) - SHi);
    const rel = BLo / rtHi;
    if (rel < minRel) { minRel = rel; minK = k; }
    if (k === 522) b522 = { BLo, rel };
    if (BLo <= 0 && !fail) { fail = { k, BLo }; break; }
  }
  return { fail, minRel, minK, b522, pLo, pHi };
}

/* ==================== main ==================== */
console.log('Lane B verifier — Korenblum c2 >= 0.4263 (arXiv:2607.17748), independent of Arb');
console.log(`N = ${N} product factors; eps_val <= ${ratToIv(epsValRat)[1].toExponential(3)}, eps_der <= ${epsDer.toExponential(3)}`);

let failures = 0;
const say = (ok, msg) => { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures++; };

/* --- 0. exact structural layer --- */
console.log('\n[0] Exact rational structure (BigInt):');
const errs0 = exactChecks(cR, tRat, wRat, null);
say(errs0.length === 0, 'measure structure: sum w = R, t1 = c^2, t8 = R, support in [c^2,1), mass 1, weights > 0' + (errs0.length ? ' -> ' + errs0.join('; ') : ''));
say(wRat[7].mul(new Rat(2185n)).gt(RR), `A-tail (k >= 2184): 2185 w_8 = ${wRat[7].mul(new Rat(2185n)).p}/${wRat[7].mul(new Rat(2185n)).q} > R exactly`);
say(wRat[7].mul(new Rat(2185n)).eq(ratFromDecimal('0.9901373783170365')), 'paper\'s stated value 2185 w_8 = 0.9901373783170365 exact');

/* --- 1. A-family --- */
console.log('\n[1] A-family, k = 1..2183 (outward double intervals):');
let tA = Date.now();
const A = runA(tRat, wRat);
say(!A.fail, `A_k > 0 for all k in 1..${KMAX_A}` + (A.fail ? ` — FIRST FAILURE k=${A.fail.k}, A_lo=${A.fail.ALo}` : ''));
say(A.minK === 23, `smallest relative margin at k = ${A.minK} (paper: k = 23)`);
say(A.a23 && A.a23.ALo > 2.17e-7, `A_23 >= ${A.a23.ALo.toExponential(10)} (paper: > 2.1754156722e-7); rel margin ${A.a23.rel.toExponential(6)} (paper: > 6.6452117503e-6)`);
console.log(`  (${Date.now() - tA} ms)`);

/* --- 2. monotonicity of K^2 on [R, 0.99999] --- */
console.log('\n[2] K^2 strictly increasing on [R, 0.99999] (phi\' > 0, adaptive bisection):');
let tM = Date.now();
let leaves = 0;
try {
  leaves = proveIncreasing(nextDown(0.99), nextUp(0.99999));
  say(true, `phi' > 0 certified on [0.99, 0.99999] with ${leaves} leaf intervals`);
} catch (e) { say(false, 'monotonicity: ' + e.message); }
console.log(`  (${Date.now() - tM} ms)`);

/* --- 3. fixed-point 1/G at quadrature boundaries and atoms --- */
console.log('\n[3] 1/G_c(sqrt t) enclosures (fixed-point BigInt, quantum 1e-32):');
let tG = Date.now();
const bounds = buildGrid();
const M = bounds.length - 1;
const uLo = new Float64Array(M + 1), uHi = new Float64Array(M + 1);
for (let m = 0; m <= M; m++) { const e = ratToIv(bounds[m]); uLo[m] = e[0]; uHi[m] = e[1]; }
const invGloB = new Float64Array(M + 1), invGhiB = new Float64Array(M + 1);
for (let m = 0; m <= M; m++) {
  const g = invG_fx(bounds[m]);
  invGloB[m] = g.lo; invGhiB[m] = g.hi;
}
/* per-subinterval certified lower bound of 1/G (monotone decreasing => right endpoint) */
const invGlo = new Float64Array(M);
for (let m = 0; m < M; m++) invGlo[m] = Math.max(0, invGloB[m + 1]);
say(invGloB.every(x => x > 0 && x < 1), 'all 35501 boundary values satisfy 0 < 1/G < 1 (so 0 < beta < 1 on grid)');
/* paper's spot value: 1/G > 0.0000225 on [0.998, 0.999] */
const i998 = bounds.findIndex(b => b.cmp(ratFromDecimal('0.9980001')) >= 0);
let minInv = Infinity;
for (let m = i998; m <= 30000; m++) minInv = Math.min(minInv, invGloB[m]);
say(minInv > 0.0000225, `min 1/G on [0.9980001, 0.999] grid = ${minInv.toExponential(6)} > 2.25e-5 (paper's bound)`);
console.log(`  (${Date.now() - tG} ms for ${M + 1} fixed-point evaluations)`);

/* --- 4. beta upper bounds at the atoms --- */
console.log('\n[4] beta_c(sqrt t_j) upper bounds at the atoms (fixed point):');
const betaHi = new Array(8);
betaHi[0] = 1;                                        /* beta_c(c) = 1, paper convention */
let betaOk = true;
for (let j = 1; j < 8; j++) {
  const g = invG_fx(tRat[j]);
  betaHi[j] = nextUp(1 - g.lo);
  const ok = betaHi[j] <= PAPER_BETA_HI[j + 1] + 1e-12 && betaHi[j] < 1;
  if (!ok) betaOk = false;
  console.log(`    beta(sqrt t_${j + 1}) <= ${betaHi[j].toFixed(15)}   (paper: < ${PAPER_BETA_HI[j + 1]})`);
}
say(betaOk, 'our beta upper bounds are < 1 and consistent with (not weaker than) the paper\'s');

/* --- 5. B-family, k = 1..1299 --- */
console.log('\n[5] B-family, k = 1..1299 (quadrature 30000+5000+500, right-endpoint rule):');
let tB = Date.now();
const B = runB(tRat, wRat, betaHi, uLo, uHi, invGlo, 1, KMAX_B);
say(!B.fail, `B_k > 0 for all k in 1..${KMAX_B}` + (B.fail ? ` — FIRST FAILURE k=${B.fail.k}, B_lo=${B.fail.BLo}` : ''));
say(B.minK === 522, `smallest relative margin at k = ${B.minK} (paper: k = 522)`);
if (B.b522) say(B.b522.BLo > 0, `B_522 >= ${B.b522.BLo.toExponential(10)} (paper: > 6.0035333797e-11); rel margin ${B.b522.rel.toExponential(6)} (paper: > 6.0214605308e-6)`);
console.log(`  (${Date.now() - tB} ms)`);

/* --- 6. B-family tail k >= 1300 --- */
console.log('\n[6] B-family tail, k >= 1300 (base case + exact ratio induction):');
{
  /* after runB, pLo/pHi hold u^{1300}; advance once more to u^{1301} */
  const { pLo, pHi } = B;
  if (B.fail) { say(false, 'skipped: B sweep already failed'); }
  else {
    for (let m = 0; m <= M; m++) {
      const pl = pLo[m] * uLo[m]; pLo[m] = pl > 0 ? nextDown(pl) : 0;
      pHi[m] = nextUp(pHi[m] * uHi[m]);
    }
    /* integral lower bound over [a,b] = [0.9980001, 0.999] at k = 1300 */
    let acc = 0;
    for (let m = i998; m < 30000; m++) {
      const d = nextDown(pLo[m + 1] - pHi[m]);
      if (d > 0) acc = nextDown(acc + nextDown(invGlo[m] * d));
    }
    const L1300 = nextDown(acc / 1301);
    /* RHS: sum w_j t_j^1300 upper (beta <= 1) */
    let SHi = 0;
    for (let j = 0; j < 8; j++) {
      const tI = ratToIv(tRat[j]), wI = ratToIv(wRat[j]);
      let p = 1; for (let k = 0; k < 1300; k++) p = nextUp(p * tI[1]);
      SHi = nextUp(SHi + nextUp(wI[1] * p));
    }
    say(L1300 > SHi, `base case k=1300: integral >= ${L1300.toExponential(9)} > ${SHi.toExponential(9)} >= sum w_j t_j^1300  (paper: 1.6668e-9 > 1.6111e-9)`);
    const aRat = ratFromDecimal('0.9980001');
    say(aRat.gt(RR), 'induction ratio: a = 0.9980001 > 0.99 = max_j t_j exactly  =>  B_k > 0 for all k >= 1300');
  }
}

/* --- 7. mutation controls --- */
console.log('\n[7] Mutation controls (each MUST be rejected):');
{
  /* M1: perturb a single atom weight: w_3 += 1e-3 (mass broken) */
  const w1 = wRat.slice(); w1[2] = w1[2].add(new Rat(1n, 1000n));
  const e1 = exactChecks(cR, tRat, w1, null);
  say(e1.length > 0, `M1 (w_3 += 1e-3) rejected by exact layer: ${e1[0] || '??'}`);

  /* M2: scale all weights by (1 - 1e-3) — mass broken AND A-family genuinely negative */
  const w2 = wRat.map(w => w.mul(new Rat(999n, 1000n)));
  const e2 = exactChecks(cR, tRat, w2, null);
  const A2 = runA(tRat, w2);
  say(e2.length > 0 && A2.fail !== null && A2.fail.AHi < 0,
    `M2 (w *= 0.999) rejected: mass check fails AND A_k certified NEGATIVE at k=${A2.fail && A2.fail.k} (A_hi=${A2.fail && A2.fail.AHi.toExponential(3)})`);

  /* M3: weaken/strengthen the bound: claim c = 0.43 with the same measure */
  const c3 = new Rat(43n, 100n);
  const e3 = exactChecks(c3, tRat, wRat, null);
  say(e3.length > 0, `M3 (claim c = 0.43) rejected by exact layer: ${e3[0] || '??'}`);

  /* M4: mass-preserving tamper w_7 -= 3e-3, w_8 += 3e-3 — passes exact layer,
     must be caught by the B-family numerics (teeth) */
  const w4 = wRat.slice();
  w4[6] = w4[6].sub(new Rat(3n, 1000n)); w4[7] = w4[7].add(new Rat(3n, 1000n));
  const e4 = exactChecks(cR, tRat, w4, null);
  const B4 = runB(tRat, w4, betaHi, uLo, uHi, invGlo, 1, KMAX_B);
  say(e4.length === 0 && B4.fail !== null,
    `M4 (move 3e-3 mass from atom 7 to atom 8) passes exact layer but B-certification fails at k=${B4.fail && B4.fail.k} (B_lo=${B4.fail && B4.fail.BLo.toExponential(3)}) — rejected`);
}

/* ==================== verdict ==================== */
const secs = ((Date.now() - t0wall) / 1000).toFixed(1);
console.log(`\nTotal wall time: ${secs} s`);
if (failures === 0) {
  console.log('VERDICT: CONFIRMED — every inequality of the moment-duality criterion for the');
  console.log('explicit measure holds in our own outward-rounded arithmetic (A_k >= 0 all k,');
  console.log('B_k >= 0 all k >= 1, exact tails). Hence c_2 >= 0.4263 MODULO the paper\'s');
  console.log('duality argument (Lemma 3.1 + Wang\'s Prop. 2.1), which this script does not audit.');
  process.exit(0);
} else {
  console.log(`VERDICT: NOT CONFIRMED — ${failures} check(s) failed; see above.`);
  process.exit(1);
}
