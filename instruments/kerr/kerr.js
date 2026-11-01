/* kerr.js — the decided layer of the black hole: the Kerr critical curve (the shadow edge), enclosed.
   instruments/kerr · cert-machine · 2026-10-31 (Phase 0; pre-registered in
   notes/black-hole-phase0-preregistration-2026-10-31.md before any enclosure).

   What this file decides, given a spin a, an inclination θo and a mass row:
     - the Schwarzschild critical impact parameter √27 (r = 3 a double root of r³ − b²(r − 2), in rationals);
     - the spherical-photon-orbit radii r̃± (the roots in [1, 4] of r(r − 3)² = 4a²), by exact rational bisection;
     - the critical curve's horizontal extent W, vertical extent H and mean diameter d̄ = (W + H)/2, at one spin and
       as a band over a box of spins and inclinations (branch and bound);
     - θg = GM/(c²D) in µas and t_g = GM/c³, exact rationals (one au at one Mpc is one µas: π cancels);
     - the ISCO radius (Bardeen–Press–Teukolsky 1972) and the circular-orbit period there, in days.

   Rigor model: instruments/interval (outward-rounded doubles; the sound transcendental cos/sin and π) and
   instruments/interval/algebraic.js (square and cube roots verified in exact rationals). No float result is used in
   a decision: floats only PROPOSE where to look (which u to test, which box to split); every bound is an interval
   evaluation over a box.

   THE CURVE (Bardeen 1973, in Gralla & Lupsasca's form, arXiv:1910.12873), M = 1:
     λ = −[r³ − 3r² + a²r + a²]/(a(r − 1)),  η = r³[4a² − r(r − 3)²]/(a²(r − 1)²),
     α = −λ/sin θo,  β = ±√(η + a² cos²θo − λ² cot²θo),  r ∈ [r̃₋, r̃₊].
   With u = (r − 3)/a the 1/a goes away: λ = −[r²u + a(r + 1)]/(r − 1), η = r³(4 − r u²)/(r − 1)², r = 3 + a u.
   η ≥ 0 ⇔ r u² ≤ 4 ⇔ r ∈ [r̃₋, r̃₊]. At a = 0 this is the circle λ² + η = 27 for every θo.

   A point (a, u, θo) is ON the curve when r u² ≤ 4 and β² ≥ 0. Upper ends are sups over u-boxes that cover every
   such point (a box is dropped only when r u² > 4 or β² < 0 is PROVEN on it); lower ends come from points PROVEN on
   the curve for every (a, θo) in the box. */
'use strict';

const I = require('../interval/interval.js');
const T = require('../interval/transcendental.js');
const Q = require('../interval/rational.js');
const A = require('../interval/algebraic.js');
const { iv, add, sub, mul, div, neg, sqr, nextUp, nextDown } = I;

/* ---------- exact pieces ---------- */

/* b² = 27 ⇔ r = 3 is a double root of f(r) = r³ − b²(r − 2): f(3) = 27 − b², f'(3) = 27 − b². Exact. */
function schwarzschildDoubleRoot(b2) {            /* b2 a rational */
  const three = Q.R(3n), f = Q.sub(Q.mul(Q.mul(three, three), three), Q.mul(b2, Q.sub(three, Q.R(2n))));
  const fp = Q.sub(Q.mul(Q.R(3n), Q.mul(three, three)), b2);
  return { f3: Q.toString(f), fp3: Q.toString(fp), doubleRootAt3: Q.isZero(f) && Q.isZero(fp) };
}

/* the roots of r(r − 3)² = 4a² in [1, 3] (prograde, r̃₋) and [3, 4] (retrograde, r̃₊), a rational, 0 < a < 1.
   f(r) = r(r − 3)² − 4a² is decreasing on (1, 3) and increasing on (3, ∞), f(1) = f(4) = 4 − 4a² > 0, f(3) = −4a² < 0,
   so each interval holds exactly one root; bisection on exact rationals, to 2^-bits. */
function photonOrbitRoots(aQ, bits = 50) {
  if (!(Q.sign(aQ) > 0 && Q.cmp(aQ, Q.ONE) < 0)) throw new Error('photonOrbitRoots: a must be a rational in (0, 1)');
  const a2x4 = Q.mul(Q.R(4n), Q.mul(aQ, aQ));
  const f = r => { const t = Q.sub(r, Q.R(3n)); return Q.sub(Q.mul(r, Q.mul(t, t)), a2x4); };
  const iso = (lo, hi) => {                            /* f(lo), f(hi) of opposite signs */
    const sl = Q.sign(f(lo));
    if (sl === 0) return [lo, lo];
    if (Q.sign(f(hi)) === 0) return [hi, hi];
    if (Q.sign(f(hi)) === sl) throw new Error('photonOrbitRoots: no sign change');
    const eps = Q.R(1n, 1n << BigInt(bits));
    while (Q.cmp(Q.sub(hi, lo), eps) > 0) {
      const m = Q.div(Q.add(lo, hi), Q.R(2n));
      const sm = Q.sign(f(m));
      if (sm === 0) return [m, m];
      if (sm === sl) lo = m; else hi = m;
    }
    return [lo, hi];
  };
  const rm = iso(Q.R(1n), Q.R(3n)), rp = iso(Q.R(3n), Q.R(4n));
  return { rMinus: rm, rPlus: rp, signsAtEnds: { f1: Q.sign(f(Q.R(1n))), f3: Q.sign(f(Q.R(3n))), f4: Q.sign(f(Q.R(4n))) } };
}

/* ---------- the angular scale and the clock (exact rationals) ---------- */

const C_LIGHT = 299792458n;                          /* m/s, SI */
const GM_SUN = Q.R(13271244n * 10n ** 13n);          /* 1.3271244e20 m^3 s^-2, IAU 2015 B3 nominal */
const AU = 149597870700n;                            /* m, IAU 2012 B2 */
const GM_C2 = Q.div(GM_SUN, Q.R(C_LIGHT * C_LIGHT)); /* GM☉/c² in m */

/* θg in µas = (M/M☉)·(GM☉/c²)/(D_Mpc · au): pc = (648000/π) au, µas = π/(648000·10^6) rad. */
const thetaG = (mSunQ, dMpcQ) => Q.div(Q.mul(mSunQ, GM_C2), Q.mul(dMpcQ, Q.R(AU)));
/* t_g = GM/c³ in seconds */
const tG = mSunQ => Q.div(Q.mul(mSunQ, GM_C2), Q.R(C_LIGHT));

/* a decimal string → its exact rational */
function decQ(s) {
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(s).trim());
  if (!m) throw new Error('decQ: not a decimal: ' + s);
  const frac = m[3] || '', e = Number(m[4] || 0) - frac.length;
  let n = BigInt(m[2] + frac); if (m[1]) n = -n;
  return e >= 0 ? Q.R(n * 10n ** BigInt(e)) : Q.R(n, 10n ** BigInt(-e));
}

const qIv = q => A.qToIv(q, q);                      /* the tightest double interval holding a rational */
const qIv2 = (lo, hi) => A.qToIv(lo, hi);

/* ---------- inclination ---------- */

const DEG = div(T.PI, iv(180));
/* cos, sin and cot² over an inclination box given in degrees (decimal strings) */
function incl(degLo, degHi) {
  const X = mul(qIv2(decQ(degLo), decQ(degHi === undefined ? degLo : degHi)), DEG);
  const c = T.cos(X), s = T.sin(X);
  if (!(s[0] > 0 && c[0] > 0)) throw new Error('incl: the inclination box must lie in (0°, 90°)');
  return { c, s, c2: sqr(c), cot2: div(sqr(c), sqr(s)), deg: [degLo, degHi === undefined ? degLo : degHi] };
}

/* ---------- the curve over a box ---------- */

/* everything over the box (a ∈ Ab, u ∈ U, θo ∈ th): r u², β², α, and G = λ² + η + a² cos²θo.
   G is what makes the horizontal extent robust to a wide inclination box: on the curve β² ≥ 0, i.e.
   λ² cot²θo ≤ η + a² cos²θo, so α² = λ²/sin²θo = λ² + λ² cot²θo ≤ G, with EQUALITY where β = 0. α itself scales
   like 1/sin θo; G depends on θo only through a² cos²θo. */
function evalBox(Ab, U, th) {
  const r = add(iv(3), mul(Ab, U));
  const rm1 = sub(r, iv(1));
  if (!(rm1[0] > 0)) throw new Error('evalBox: r − 1 not proven positive');
  const ru2 = mul(r, sqr(U));
  const lam = neg(div(add(mul(sqr(r), U), mul(Ab, add(r, iv(1)))), rm1));
  const eta = div(mul(mul(sqr(r), r), sub(iv(4), ru2)), sqr(rm1));
  const a2c2 = mul(sqr(Ab), th.c2);
  const lam2 = sqr(lam);
  const b2 = sub(add(eta, a2c2), mul(lam2, th.cot2));
  const alpha = neg(div(lam, th.s));
  const G = add(add(lam2, eta), a2c2);
  return { ru2, b2, alpha, G };
}

/* √ of a double, rounded outward by two ulps (the kernel's rigor model: IEEE sqrt is correctly rounded, so the
   exact root lies within half an ulp of Math.sqrt; interval.js states the model once for + − × ÷ and sqrt). The
   reported H and the final ends go through algebraic.js's verified sqrtInterval instead. */
const sqUp = x => (x <= 0 ? 0 : nextUp(nextUp(Math.sqrt(x))));
const sqDn = x => (x <= 0 ? 0 : Math.max(0, nextDown(nextDown(Math.sqrt(x)))));
const offCurve = e => e.ru2[0] > 4 || e.b2[1] < 0;

/* The extents over the box (a ∈ Ab, θo ∈ th), for every (a, θo) in it at once:
     W ∈ [Wlo, Whi], H ∈ [Hlo, Hhi], d̄ ∈ [dlo, dhi].
   UPPER ends: a sup over u-boxes covering the curve; on a box where α > 0 the bound is min(α, √G), where α < 0 it is
   max(α, −√G) (α² ≤ G on the curve).
   LOWER ends, two kinds of witness, each valid for every (a, θo) in the box:
     a point u proven on the curve (r u² ≤ 4 and β² ≥ 0): α_max ≥ α(u), α_min ≤ α(u), (H/2)² ≥ β²(u);
     a bracket [u₁, u₂] with r u² ≤ 4 on it and β² of opposite proven signs at its two ends: by continuity β = 0 at
     some u_e inside, a point of the curve where α² = G, so α_max ≥ √(min G) if α > 0 on the bracket (and
     α_min ≤ −√(min G) if α < 0). The bracket survives a wide inclination box where a point does not.
   The u-axis: a coarse pass over [−2, 2] finds the boxes not proven off the curve, a fine pass splits each, and a
   box is split again while it could still move an end past the proven one. */
function extents(Ab, th, { coarse = 256, fine = 16, refine = 14, slack = 0, maxU = 3000 } = {}) {
  const keep = [];
  for (let k = 0; k < coarse; k++) {
    const U = iv(-2 + 4 * k / coarse, -2 + 4 * (k + 1) / coarse);   /* dyadic ends: exact */
    if (!offCurve(evalBox(Ab, U, th))) keep.push(U);
  }
  if (!keep.length) throw new Error('extents: no box survived (the curve is empty?)');
  let aMaxLo = -Infinity, aMinHi = Infinity, b2MaxLo = -Infinity;      /* the witnesses */
  let onCurve = 0;
  const cache = new Map();
  const point = u0 => {                                                /* a point, for all (a, θo) in the box */
    let p = cache.get(u0);
    if (p) return p;
    p = evalBox(Ab, iv(u0), th);
    cache.set(u0, p);
    if (p.ru2[1] <= 4 && p.b2[0] >= 0) {
      onCurve++;
      if (p.alpha[0] > aMaxLo) aMaxLo = p.alpha[0];
      if (p.alpha[1] < aMinHi) aMinHi = p.alpha[1];
      if (p.b2[0] > b2MaxLo) b2MaxLo = p.b2[0];
    }
    return p;
  };
  const bracket = (U, e) => {
    if (!(e.ru2[1] <= 4)) return;
    const pl = point(U[0]), pr = point(U[1]);
    const change = (pl.b2[0] >= 0 && pr.b2[1] <= 0) || (pl.b2[1] <= 0 && pr.b2[0] >= 0);
    if (!change) return;
    if (e.alpha[0] > 0) { onCurve++; const w = sqDn(e.G[0]); if (w > aMaxLo) aMaxLo = w; }
    if (e.alpha[1] < 0) { onCurve++; const w = -sqDn(e.G[0]); if (w < aMinHi) aMinHi = w; }
  };
  const ubMax = e => (e.alpha[0] > 0 ? Math.min(e.alpha[1], sqUp(e.G[1])) : e.alpha[1]);
  const lbMin = e => (e.alpha[1] < 0 ? Math.max(e.alpha[0], -sqUp(e.G[1])) : e.alpha[0]);
  let boxes = [];
  for (const U of keep) {
    const h = (U[1] - U[0]) / fine;
    for (let j = 0; j < fine; j++) boxes.push(iv(U[0] + j * h, U[0] + (j + 1) * h));   /* exact: dyadic */
  }
  let live = [];
  for (let pass = 0; pass <= refine; pass++) {
    live = [];
    for (const U of boxes) {
      const e = evalBox(Ab, U, th);
      if (offCurve(e)) continue;
      point(U[0]); point(U[1]);
      bracket(U, e);
      live.push({ U, e });
    }
    if (pass === refine) break;
    /* a box is split while it could move an outer end past the proven one by more than `slack` (the caller's
       budget for this box: a box wide in spin or inclination cannot be helped past its own width) */
    let any = false;
    const next = [];
    for (const { U, e } of live) {
      const matters = ubMax(e) > aMaxLo + slack || lbMin(e) < aMinHi - slack || e.b2[1] > b2MaxLo + 5 * slack;
      if (matters) { any = true; const m = (U[0] + U[1]) / 2; next.push(iv(U[0], m), iv(m, U[1])); }
      else next.push(U);
    }
    if (!any) break;
    boxes = next;
    if (boxes.length > maxU) break;                                    /* the box itself is the limit now */
  }
  /* the multi-scale bracket: a proven-visible point and the next proven-invisible one (in u order, whatever lies
     between undecided), with every segment between them proven inside r u² ≤ 4 and of one sign of α. Over a wide
     inclination box the visible arc's end sweeps a stretch of u wider than one refined box, and only this finds it. */
  const us = [...cache.keys()].sort((x, y) => x - y);
  const cls = u => { const p = cache.get(u); return p.b2[0] >= 0 && p.ru2[1] <= 4 ? 1 : p.b2[1] <= 0 ? -1 : 0; };
  for (let i = 0; i < us.length; i++) {
    const ci = cls(us[i]);
    if (ci === 0) continue;
    let j = i + 1;
    while (j < us.length && cls(us[j]) === 0) j++;
    if (j >= us.length || cls(us[j]) === ci) { i = j - 1; continue; }
    let gMin = Infinity, pos = true, negv = true, inside = true;
    for (let k = i; k < j; k++) {
      const e = evalBox(Ab, iv(us[k], us[k + 1]), th);
      if (!(e.ru2[1] <= 4)) { inside = false; break; }
      gMin = Math.min(gMin, e.G[0]);
      if (!(e.alpha[0] > 0)) pos = false;
      if (!(e.alpha[1] < 0)) negv = false;
    }
    if (inside && pos) { onCurve++; aMaxLo = Math.max(aMaxLo, sqDn(gMin)); }
    if (inside && negv) { onCurve++; aMinHi = Math.min(aMinHi, -sqDn(gMin)); }
    i = j - 1;
  }
  if (!onCurve || !(aMaxLo > -Infinity) || !(aMinHi < Infinity) || !(b2MaxLo >= 0)) return null;   /* split */
  let aMaxHi = -Infinity, aMinLo = Infinity, b2MaxHi = -Infinity;      /* outer: a sup over every live box */
  for (const { e } of live) {
    aMaxHi = Math.max(aMaxHi, ubMax(e));
    aMinLo = Math.min(aMinLo, lbMin(e));
    b2MaxHi = Math.max(b2MaxHi, e.b2[1]);
  }
  const W = [nextDown(aMaxLo - aMinHi), nextUp(aMaxHi - aMinLo)];
  const Hlo = mul(iv(2), A.sqrtInterval(iv(Math.max(0, b2MaxLo))))[0];
  const Hhi = mul(iv(2), A.sqrtInterval(iv(b2MaxHi)))[1];
  const H = [Hlo, Hhi];
  const d = div(add(W, H), iv(2));
  return { W, H, d: [d[0], d[1]], alpha: { max: [aMaxLo, aMaxHi], min: [aMinLo, aMinHi] } };
}

/* the band over a ∈ [aLo, aHi] (rationals) × θo ∈ [degLo, degHi]: branch and bound. Returns, for W, H and d̄, the
   enclosure of the minimum and of the maximum over the box; the band is then ⊆ [min.lo, max.hi]. A box is split
   while it could still hold the minimum or the maximum to within tol (in M). */
function band(aLoQ, aHiQ, degLo, degHi, { tol = 2e-4, maxBoxes = 60000, keys = ['W', 'H', 'd'], opts } = {}) {
  let queue = [];
  const mk = (aL, aH, tL, tH) => ({ aL, aH, tL, tH });
  const nA = 16, nT = degLo === degHi ? 1 : 4;
  const aStep = Q.div(Q.sub(aHiQ, aLoQ), Q.R(BigInt(nA)));
  const tL0 = decQ(degLo), tH0 = decQ(degHi);
  const tStep = Q.div(Q.sub(tH0, tL0), Q.R(BigInt(nT)));
  for (let i = 0; i < nA; i++) for (let j = 0; j < nT; j++)
    queue.push(mk(Q.add(aLoQ, Q.mul(aStep, Q.R(BigInt(i)))), Q.add(aLoQ, Q.mul(aStep, Q.R(BigInt(i + 1)))),
                  Q.add(tL0, Q.mul(tStep, Q.R(BigInt(j)))), Q.add(tL0, Q.mul(tStep, Q.R(BigInt(j + 1))))));
  let evaluated = 0;
  const evalOne = b => {
    evaluated++;
    const X = mul(qIv2(b.tL, b.tH), DEG);
    const c = T.cos(X), s = T.sin(X);
    const th = { c, s, c2: sqr(c), cot2: div(sqr(c), sqr(s)) };
    /* the u-refinement slack follows the box: a wide box cannot be helped past its own width (float: a budget only;
       measured: an extent's enclosure widens by ~5–17 per unit of spin and ~0.08 per degree) */
    const wBox = 10 * Q.toDouble(Q.sub(b.aH, b.aL)) + 0.08 * Q.toDouble(Q.sub(b.tH, b.tL));
    const o = Object.assign({ coarse: 128, fine: 4, refine: 18, slack: Math.max(wBox / 4, tol / 8) }, opts);
    return extents(qIv2(b.aL, b.aH), th, o);
  };
  const splitA = b => { const m = Q.div(Q.add(b.aL, b.aH), Q.R(2n)); return [mk(b.aL, m, b.tL, b.tH), mk(m, b.aH, b.tL, b.tH)]; };
  const splitT = b => { const m = Q.div(Q.add(b.tL, b.tH), Q.R(2n)); return [mk(b.aL, b.aH, b.tL, m), mk(b.aL, b.aH, m, b.tH)]; };
  const split = b => (Q.isZero(Q.sub(b.tH, b.tL)) ? splitA(b) : splitA(b).concat(splitT(b)));
  /* best first: the leaf with the largest excess over the proven extremes is split, until none exceeds tol. The
     running extremes take every box ever evaluated: a parent's upper end bounds the minimum over it from above
     whatever its children say. */
  const best = {};
  for (const k of keys) best[k] = { minHi: Infinity, maxLo: -Infinity };
  const note = b => { for (const k of keys) { best[k].minHi = Math.min(best[k].minHi, b.e[k][1]); best[k].maxLo = Math.max(best[k].maxLo, b.e[k][0]); } };
  const leaves = [];
  /* a box is split both ways when it has an inclination width; the pair of children with the smaller summed width
     is kept as leaves, and all four count toward the running extremes (each is a true enclosure of its own box) */
  const spread = e => (e ? keys.reduce((t, k) => t + e[k][1] - e[k][0], 0) : Infinity);
  const admit = b => {
    b.e = evalOne(b);
    if (!b.e) { refine(b); return; }                               /* no witness on so wide a box: split it */
    note(b); leaves.push(b);
  };
  const refine = b => {
    const kids = split(b);
    if (kids.length === 2) { for (const c of kids) admit(c); return; }
    for (const c of kids) { c.e = evalOne(c); if (c.e) note(c); }
    const sa = Math.max(spread(kids[0].e), spread(kids[1].e)), st = Math.max(spread(kids[2].e), spread(kids[3].e));
    for (const c of (sa <= st ? kids.slice(0, 2) : kids.slice(2))) { if (c.e) leaves.push(c); else refine(c); }
  };
  for (const b of queue) admit(b);
  const excess = b => {
    let x = -Infinity;
    for (const k of keys) {
      if (b.e[k][1] - b.e[k][0] < tol / 2) continue;               /* tight: splitting cannot help this key */
      x = Math.max(x, best[k].minHi - b.e[k][0], b.e[k][1] - best[k].maxLo);
    }
    return x;
  };
  for (;;) {
    let wi = -1, wx = tol;
    for (let i = 0; i < leaves.length; i++) { const x = excess(leaves[i]); if (x > wx) { wx = x; wi = i; } }
    if (wi < 0) break;
    if (evaluated >= maxBoxes) throw new Error('band: the budget of ' + maxBoxes + ' boxes was spent before tol ' + tol);
    const [b] = leaves.splice(wi, 1);
    refine(b);
  }
  const done = leaves;
  const out = { boxes: done.length, evaluated };
  for (const k of keys) {
    out[k] = {
      min: [Math.min(...done.map(b => b.e[k][0])), Math.min(...done.map(b => b.e[k][1]))],
      max: [Math.max(...done.map(b => b.e[k][0])), Math.max(...done.map(b => b.e[k][1]))]
    };
  }
  /* where the extremes sit (float, a description only) */
  const argOf = (k, which) => {
    const b = which === 'min' ? done.reduce((p, q) => (q.e[k][0] < p.e[k][0] ? q : p))
                              : done.reduce((p, q) => (q.e[k][1] > p.e[k][1] ? q : p));
    return { a: [Q.toString(b.aL), Q.toString(b.aH)], deg: [Q.toString(b.tL), Q.toString(b.tH)] };
  };
  out.where = { dMin: argOf('d', 'min'), dMax: argOf('d', 'max') };
  return out;
}

/* ---------- ISCO (Bardeen, Press & Teukolsky 1972) ---------- */

/* cube root of a nonnegative double interval, each end verified in rationals */
function cbrtIv(X) {
  if (X[0] < 0) throw new Error('cbrtIv: negative');
  const f = (x, end) => { const q = Q.fromDouble(x); return Q.isZero(q) ? 0 : A.cbrtRational(q.n, q.d).iv[end]; };
  return iv(f(X[0], 0), f(X[1], 1));
}
/* r_isco over a ∈ Ab (a double interval inside [0, 1)), prograde (+1) or retrograde (−1) */
function isco(Ab, dir = +1) {
  if (!(Ab[0] >= 0 && Ab[1] < 1)) throw new Error('isco: a must lie in [0, 1)');
  const omA2 = sub(iv(1), sqr(Ab)), opA = add(iv(1), Ab), omA = sub(iv(1), Ab);
  const clamp0 = X => iv(Math.max(0, X[0]), X[1]);           /* 1 − a², 1 − a ≥ 0 on [0, 1): true lower end */
  const Z1 = add(iv(1), mul(cbrtIv(clamp0(omA2)), add(cbrtIv(opA), cbrtIv(clamp0(omA)))));
  const Z2 = A.sqrtInterval(add(mul(iv(3), sqr(Ab)), sqr(Z1)));
  /* (3 − Z1)(3 + Z1 + 2 Z2) ≥ 0 since Z1 ≤ 3 on [0, 1) (BPT): the lower end may be clamped at 0 */
  const P = clamp0(mul(sub(iv(3), Z1), add(add(iv(3), Z1), mul(iv(2), Z2))));
  const rt = A.sqrtInterval(P);
  return dir > 0 ? sub(add(iv(3), Z2), rt) : add(add(iv(3), Z2), rt);
}
/* circular equatorial orbit period at radius R (interval, in M), spin Ab, in units of t_g: 2π (R^{3/2} ± a) */
function periodTg(R, Ab, dir = +1) {
  const r32 = mul(R, A.sqrtInterval(R));
  return mul(T.TWO_PI, dir > 0 ? add(r32, Ab) : sub(r32, Ab));
}

module.exports = {
  schwarzschildDoubleRoot, photonOrbitRoots,
  GM_C2, AU, C_LIGHT, thetaG, tG, decQ, qIv, qIv2,
  incl, evalBox, extents, band, isco, periodTg, cbrtIv, DEG
};
