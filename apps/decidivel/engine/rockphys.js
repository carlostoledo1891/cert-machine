/* rockphys.js — Decidível's engine: is a 4D seismic change DECIDABLE from the
   declared uncertainty? apps/decidivel · cert-machine

   THE QUESTION. A reservoir is produced or injected (water-alternating-gas,
   CO2-rich gas). Will a monitor survey see the change? A feasibility study
   today runs one rock-physics model, or a few hundred Monte Carlo draws, and
   prints "probability of detection 70%". This file decides the question over
   EVERY model inside a declared box — porosity, frame stiffness, mineral and
   fluid moduli, saturations, and every fluid-mixing law between the uniform and
   the patchy limit — and answers in three words:
     PROVADO   detectable for every admissible model;
     REFUTADO  undetectable for every admissible model — no survey at this
               threshold can see it, so do not pay for one;
     RECUSADO  the box holds models on both sides, each side PROVED by a
               sub-box, and the receipt names what would decide it: the
               detection threshold, and which single measurement, taken to
               which resolution, settles the question.

   THE PHYSICS, and the only physics asserted (Mavko, Mukerji & Dvorkin, The
   Rock Physics Handbook):
     Kdry = kr·Kmin, Gdry = gk·Kdry                     the dry frame, declared as ratios
     Gassmann  Ksat = Kdry + (1 − kr)² / (φ/Kfl + (1 − φ − kr)/Kmin)
     Kfl = KR + w·(KV − KR), w ∈ [0, 1]                 KR the Reuss (Wood, uniform) mix,
                                                       KV the Voigt (patchy) limit: every
                                                       Brie exponent lies between them
     ρ = (1 − φ)ρmin + φ Σ Sᵢρᵢ,  M = Ksat + (4/3)Gdry, Ip² = ρM, Vp² = M/ρ
     r = Ip₂²/Ip₁²  — the 4D change is ΔIp/Ip = √r − 1; the time shift across
     a layer of thickness h is Δt = 2h(1/Vp₂ − 1/Vp₁).
   Gassmann's assumptions (connected pores, low frequency, a frame the fluid
   does not soften) are the model's; a PROVADO speaks for this model and this
   box, not for the rock. Domain: the frame must sit under the Voigt bound,
   kr ≤ 1 − φ, and saturations must stay in [0, 1]; a box that leaves the
   domain is RECUSADO, never decided.

   RIGOR. Every quantity is an interval in outward-rounded arithmetic
   (instruments/interval/interval.js). The decision compares r with (1 ± θ)²,
   so no square root enters a verdict; √ is used only for the printed
   percentages, and there it is VERIFIED (a candidate root is squared back in
   interval arithmetic before it is accepted as a bound).

   HOW A WHOLE BOX IS DECIDED. The extremes of r over the box are found by
   interval branch and bound with a MONOTONICITY TEST (Hansen & Walster,
   Global Optimization Using Interval Analysis): r and its gradient are
   evaluated together in interval forward-mode differentiation; a dimension
   whose partial derivative is PROVED of one sign on the box is pinned at the
   endpoint that extremises r, which removes it from the problem exactly; only
   the dimensions left are bisected. The result is a proved bound on each
   extreme AND a thin point that attains a value within it — the witness.
   The 4D change is written in difference form (see change()), so the interval
   carries the change's uncertainty and not the rock's.                     MIT */
'use strict';

const I = require('../../../instruments/interval/interval.js');
const Q = require('../../../instruments/interval/rational.js');
const { iv, add, sub, mul, div, sqr, nextUp, nextDown } = I;

const PROVADO = 'PROVADO', REFUTADO = 'REFUTADO', RECUSADO = 'RECUSADO';
const DIMS = ['phi', 's', 'phic', 'gk', 'Kmin', 'rhomin', 'Kw', 'rhow', 'Ko', 'rhoo', 'Kg', 'rhog', 'Swi', 'dSw', 'dSg', 'w'];
const N = DIMS.length;
const lo = (x) => x[0], hi = (x) => x[1];
const one = iv(1);

/* ------------------------------------------------ declared decimals -- */
/* exact when the double IS the decimal (0, 1, 70, 0.25), else the nearest
   double widened one ulp each side */
function ratOf(s) {
  const m = /^\s*(-?)(\d+)(?:\.(\d+))?(?:e(-?\d+))?\s*$/i.exec(String(s)); if (!m) return null;
  const frac = m[3] || '', e = Number(m[4] || 0), n = BigInt(m[2] + frac) * (m[1] ? -1n : 1n), p = frac.length - e;
  return p >= 0 ? Q.R(n, 10n ** BigInt(p)) : Q.R(n * 10n ** BigInt(-p), 1n);
}
function dec(s) {
  const d = Number(s); if (!Number.isFinite(d)) throw new Error('rockphys: not a number: ' + s);
  const r = ratOf(s);
  if (r && Q.cmp(Q.fromDouble(d), r) === 0) return [d, d];
  return [nextDown(d), nextUp(d)];
}
function box(b) {
  const o = {};
  for (const k of DIMS) {
    if (!b[k]) throw new Error('rockphys: the box needs ' + k);
    o[k] = [dec(b[k][0])[0], dec(b[k][1])[1]];
    if (!(o[k][0] <= o[k][1])) throw new Error('rockphys: empty ' + k);
  }
  return o;
}
/* the verified square root: bounds accepted only after squaring back */
function isqrt(X) {
  if (!(X[0] >= 0)) throw new Error('rockphys: sqrt of a negative interval');
  let a = nextDown(Math.sqrt(X[0])), b = nextUp(Math.sqrt(X[1]));
  while (a > 0 && hi(mul(iv(a), iv(a))) > X[0]) a = nextDown(a);
  while (lo(mul(iv(b), iv(b))) < X[1]) b = nextUp(b);
  return [Math.max(0, a), b];
}

/* ------------------------------------ interval forward differentiation -- */
/* a value interval and the interval of each partial derivative (null = 0) */
const Z = () => new Array(N).fill(null);
const C = (x) => ({ v: x, g: Z() });
function V(B, k) { const g = Z(); g[DIMS.indexOf(k)] = one; return { v: B[k], g }; }
const gadd = (a, b) => (a && b ? add(a, b) : a || b);
function dAdd(a, b) { return { v: add(a.v, b.v), g: a.g.map((x, i) => gadd(x, b.g[i])) }; }
function dSub(a, b) { return { v: sub(a.v, b.v), g: a.g.map((x, i) => (x && b.g[i] ? sub(x, b.g[i]) : x || (b.g[i] ? sub(iv(0), b.g[i]) : null))) }; }
function dMul(a, b) { return { v: mul(a.v, b.v), g: a.g.map((x, i) => gadd(x ? mul(x, b.v) : null, b.g[i] ? mul(b.g[i], a.v) : null)) }; }
function dDiv(a, b) {
  const v = div(a.v, b.v);
  return { v, g: a.g.map((x, i) => { const t = gadd(x, b.g[i] ? sub(iv(0), mul(v, b.g[i])) : null); return t ? div(t, b.v) : null; }) };
}
function dSqr(a) { return { v: sqr(a.v), g: a.g.map((x) => (x ? mul(mul(iv(2), a.v), x) : null)) }; }

/* ------------------------------------------------------------ physics -- */
/* THE FLUIDS. Water and oil share the pores at the pore scale, so the liquid is
   their Reuss (Wood) mix — the standard for connate water. The injected gas is
   where the distribution is unknown: uniform (Reuss of liquid and gas) or
   patchy (Voigt), and every blend w ∈ [0, 1] between them, which holds every
   Brie exponent. Before injection there is no gas. */
function liquid(P, sw, so) {
  const s = dAdd(sw, so);
  const Kl = dDiv(s, dAdd(dDiv(sw, P.Kw), dDiv(so, P.Ko)));               /* the liquid's own Reuss mix */
  return { K: Kl, s };
}
function states(P) {
  const sw1 = P.Swi, so1 = dSub(C(one), P.Swi);
  const sw2 = dAdd(P.Swi, P.dSw), so2 = dSub(dSub(C(one), sw2), P.dSg);
  const L1 = liquid(P, sw1, so1);
  const L2 = liquid(P, sw2, so2);
  /* after: liquid (fraction 1 − Sg) with gas (Sg), Reuss to Voigt by w */
  const sl = dSub(C(one), P.dSg);
  const R = dDiv(C(one), dAdd(dDiv(sl, L2.K), dDiv(P.dSg, P.Kg)));
  const Vv = dAdd(dMul(sl, L2.K), dMul(P.dSg, P.Kg));
  const D = dSub(Vv, R); D.v = [Math.max(0, D.v[0]), Math.max(0, D.v[1])];   /* Voigt ≥ Reuss: a theorem */
  const K2 = dAdd(R, dMul(P.w, D));
  const rho1 = dAdd(dMul(sw1, P.rhow), dMul(so1, P.rhoo));
  return { K1: L1.K, K2, rho1 };
}
/* r = Ip²(after)/Ip²(before) in DIFFERENCE form:
     r = (1 + Δρ/ρ₁)(1 + ΔK/M₁)
     Δρ = φ[ΔSw(ρw − ρo) + ΔSg(ρg − ρo)]
     ΔK = (1 − kr)² φ (Kfl₂ − Kfl₁) / (d₁ d₂ Kfl₁ Kfl₂),  dᵢ = φ/Kflᵢ + (1 − φ − kr)/Kmin
   Evaluating ρM before and after and dividing would carry the rock's whole
   uncertainty into a change of a few percent. */
function changeD(B) {
  const P = {}; for (const k of DIMS) P[k] = V(B, k);
  /* the frame follows porosity: Kdry/Kmin = s·(1 − φ/φc), Nur's critical-porosity
     trend scaled by a stiffness factor s — the box of s is what the plugs measured */
  P.kr = dMul(P.s, dSub(C(one), dDiv(P.phi, P.phic)));
  const S = states(P);
  const F1 = { K: S.K1, rho: S.rho1 }, F2 = { K: S.K2 };
  const base = dSub(dSub(C(one), P.phi), P.kr);
  const d1 = dAdd(dDiv(P.phi, F1.K), dDiv(base, P.Kmin)), d2 = dAdd(dDiv(P.phi, F2.K), dDiv(base, P.Kmin));
  /* dᵢ > 0 and Kflᵢ > 0 are theorems on the domain (every term is positive once
     kr ≤ 1 − φ, which domain() decides on the declared box); their values are
     intersected with (0, ∞), which interval arithmetic cannot know on its own */
  for (const x of [d1, d2, F1.K, F2.K]) { x.v = [Math.max(x.v[0], Number.MIN_VALUE), Math.max(x.v[1], Number.MIN_VALUE)]; }
  const om = dSqr(dSub(C(one), P.kr));
  const Kdry = dMul(P.kr, P.Kmin);
  const M1 = dAdd(dAdd(Kdry, dDiv(om, d1)), dMul(C(div(iv(4), iv(3))), dMul(P.gk, Kdry)));
  const rho1 = dAdd(dMul(dSub(C(one), P.phi), P.rhomin), dMul(P.phi, F1.rho));
  const drho = dMul(P.phi, dAdd(dMul(P.dSw, dSub(P.rhow, P.rhoo)), dMul(P.dSg, dSub(P.rhog, P.rhoo))));
  const dK = dDiv(dMul(dMul(om, P.phi), dSub(F2.K, F1.K)), dMul(dMul(d1, d2), dMul(F1.K, F2.K)));
  const r = dMul(dAdd(C(one), dDiv(drho, rho1)), dAdd(C(one), dDiv(dK, M1)));
  /* r is a ratio of two positive impedances: positive, whatever a wide box says */
  r.v = [Math.max(r.v[0], 0), Math.max(r.v[1], 0)];
  if (!Number.isFinite(r.v[1])) return null;
  return r;
}
/* the domain, decided on the declared box: a box that can leave it is never decided */
function domain(B) {
  if (!(hi(B.phi) < lo(B.phic))) return 'a porosidade pode passar da porosidade crítica φc';
  const krHi = mul(B.s, sub(one, div(B.phi, B.phic)));
  if (hi(krHi) > lo(sub(one, B.phi))) return 'o arcabouço seco pode passar do limite de Voigt (Kdry > (1 − φ)Kmin)';
  if (lo(sub(sub(one, add(B.Swi, B.dSw)), B.dSg)) < 0) return 'a saturação de óleo depois da injeção pode ficar negativa';
  for (const k of ['phi', 's', 'phic', 'gk', 'Kmin', 'rhomin', 'Kw', 'rhow', 'Ko', 'rhoo', 'Kg', 'rhog']) if (!(B[k][0] > 0)) return k + ' precisa ser positivo';
  for (const k of ['Swi', 'dSw', 'dSg', 'w']) if (B[k][0] < 0 || B[k][1] > 1) return k + ' precisa ficar em [0, 1]';
  return null;
}

/* -------------------------------------------- extremes of r on a box -- */
/* thin: a declared single value, possibly widened one ulp each side to enclose
   its decimal — it is never cut and never collapsed to a midpoint */
const thin = (B, k) => B[k][0] === B[k][1] || nextUp(nextUp(B[k][0])) >= B[k][1];
/* dir = +1: a proved UPPER bound of max r and a thin witness; dir = −1: a
   proved LOWER bound of min r and a thin witness. Best-first: the box whose
   proved edge is most extreme is cut next, so when the budget runs out the
   bound is the best edge still standing — never a guess. */
function extreme(B0, dir, opts) {
  const budget = (opts && opts.budget) || 6000, tol = (opts && opts.tol) || 1e-7;
  /* stop: a threshold T — the search ends as soon as it PROVES the extreme is on
     one side of T (the best edge standing is past... not past T) or finds a
     witness beyond it; a decision never needs the extreme itself */
  const T = opts && opts.stop !== undefined ? opts.stop : null;
  let evals = 0, best = null;
  const better = (v, w) => (dir > 0 ? v > w : v < w);
  const span = {}; for (const k of DIMS) span[k] = (B0[k][1] - B0[k][0]) || 1;
  /* the natural enclosure, intersected with the MEAN-VALUE form
     r(B) ⊆ r(c) + Σ ∂r/∂xᵢ(B)·(Bᵢ − cᵢ), which tightens quadratically as a box
     shrinks — both are proved, so their intersection is */
  const point = (B) => {
    evals++;
    const r = changeD(B); if (!r) return null;
    const free = DIMS.filter((k) => !thin(B, k));
    if (!free.length) return r;
    const c = thinAt(B), rc = changeD(c); evals++;
    if (!rc) return r;
    let m = rc.v;
    for (let i = 0; i < N; i++) {
      const k = DIMS[i]; if (thin(B, k)) continue;
      const g = r.g[i]; if (!g) continue;
      m = add(m, mul(g, sub(B[k], c[k])));
    }
    r.v = [Math.max(r.v[0], m[0]), Math.min(r.v[1], m[1])];
    return r;
  };
  /* pin every dimension whose partial derivative is proved of one sign */
  function pin(B) {
    for (let pass = 0; pass < N; pass++) {
      const r = point(B); if (!r) return { B, r: null };
      let moved = false;
      for (let i = 0; i < N; i++) {
        const k = DIMS[i], g = r.g[i];
        if (thin(B, k) || !g) continue;
        const sg = g[0] >= 0 ? 1 : g[1] <= 0 ? -1 : 0;          /* monotone, even weakly: the extreme is at an end */
        if (!sg) continue;
        const e = B[k][(sg * dir) > 0 ? 1 : 0];
        B = Object.assign({}, B, { [k]: [e, e] }); moved = true;
      }
      if (!moved) return { B, r };
    }
    return { B, r: point(B) };
  }
  function cut(B, r) {
    const free = DIMS.filter((k) => !thin(B, k));
    let k = free[0], kw = -1;
    for (const f of free) {
      const g = r ? r.g[DIMS.indexOf(f)] : null;
      /* with a gradient: |∂r/∂x|·width; without one: the share of its declared range still open */
      const w = r ? (g ? Math.max(Math.abs(g[0]), Math.abs(g[1])) : 0) * (B[f][1] - B[f][0]) : (B[f][1] - B[f][0]) / span[f];
      if (w > kw) { kw = w; k = f; }
    }
    const m = (B[k][0] + B[k][1]) / 2;
    return [Object.assign({}, B, { [k]: [B[k][0], m] }), Object.assign({}, B, { [k]: [m, B[k][1]] })];
  }
  /* a binary heap on the proved edge */
  const H = [];
  const key = (x) => (dir > 0 ? x.edge : -x.edge);
  const push = (x) => { H.push(x); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (key(H[p]) >= key(H[i])) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const t = H[0], l = H.pop(); if (H.length) { H[0] = l; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < H.length && key(H[a]) > key(H[m])) m = a; if (b < H.length && key(H[b]) > key(H[m])) m = b; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return t; };
  function enter(B1) {
    const { B, r } = pin(B1);
    const free = DIMS.filter((k) => !thin(B, k)).length;
    if (!r) { push({ B, r: null, edge: dir > 0 ? Infinity : -Infinity, free }); return; }
    const edge = dir > 0 ? hi(r.v) : lo(r.v);
    /* every box that reaches here offers a witness at its centre */
    const W = free ? thinAt(B) : B, rw = free ? point(W) : r;
    if (rw) { const iw = dir > 0 ? lo(rw.v) : hi(rw.v); if (!best || better(iw, best.inner)) best = { B: W, r: rw.v, inner: iw }; }
    push({ B, r, edge, free });
  }
  /* THE PROPOSER: a float coordinate search over the box's endpoints and centre
     for the extreme. It only LOCATES a candidate; the candidate becomes a
     witness after changeD encloses it — the bound still comes from the boxes. */
  {
    const P = {}; for (const k of DIMS) P[k] = (B0[k][0] + B0[k][1]) / 2;
    const f = (p) => { try { return dir * pointR(p); } catch (e) { return -Infinity; } };
    for (let round = 0; round < 4; round++) {
      let moved = false;
      for (const k of DIMS) {
        if (thin(B0, k)) continue;
        const cands = [B0[k][0], (B0[k][0] + B0[k][1]) / 2, B0[k][1]];
        let bestv = f(P), bestx = P[k];
        for (const x of cands) { const q = Object.assign({}, P, { [k]: x }); const v = f(q); if (v > bestv + 1e-15) { bestv = v; bestx = x; } }
        if (bestx !== P[k]) { P[k] = bestx; moved = true; }
      }
      if (!moved) break;
    }
    const W = {}; for (const k of DIMS) W[k] = thin(B0, k) ? B0[k] : [P[k], P[k]];
    const rw = changeD(W); evals++;
    if (rw) best = { B: W, r: rw.v, inner: dir > 0 ? lo(rw.v) : hi(rw.v) };
  }
  enter(B0);
  let bound = null;
  while (H.length) {
    const x = H[0];
    if (T !== null) {
      if (best && (dir > 0 ? best.inner > T : best.inner < T)) { bound = x.edge; break; }   /* a witness beyond T */
      if (x.r && (dir > 0 ? x.edge <= T : x.edge >= T)) { bound = x.edge; break; }         /* every box within T */
    }
    if (best && x.r && !better(x.edge, best.inner)) { bound = x.edge; break; }       /* nothing left can beat the witness */
    if (!x.free || (x.r && (x.r.v[1] - x.r.v[0]) < tol) || evals > budget) { bound = x.edge; break; }
    pop();
    for (const S of cut(x.B, x.r)) enter(S);
  }
  if (bound === null) bound = best ? (dir > 0 ? hi(best.r) : lo(best.r)) : (dir > 0 ? Infinity : -Infinity);
  /* the bound can never sit inside the witness: it is at least as far out */
  if (best) bound = dir > 0 ? Math.max(bound, hi(best.r)) : Math.min(bound, lo(best.r));
  return { bound, witness: best, evals, open: H.length };
}
function thinAt(B) { const o = {}; for (const k of DIMS) { if (thin(B, k)) { o[k] = B[k]; continue; } const m = (B[k][0] + B[k][1]) / 2; o[k] = [m, m]; } return o; }

/* ------------------------------------------------------ one question -- */
const pctOf = (x) => (Math.sqrt(x) - 1) * 100;                      /* for words only */
function pctLo(x) { return (isqrt([x, x])[0] - 1) * 100; }          /* proved outward */
function pctHi(x) { return (isqrt([x, x])[1] - 1) * 100; }
/* decide "|ΔIp/Ip| ≥ θ" on a box already in the domain. With neg = (1 − θ)²
   and pos = (1 + θ)²: detectable ⇔ r ≤ neg or r ≥ pos. Each search stops as
   soon as it has what the decision needs — a proved side, or a witness past
   the threshold — never the extreme itself. */
function decideBox(B, theta, opts) {
  const t = dec(theta), neg = sqr(sub(one, t)), pos = sqr(add(one, t));
  const run = (dir, T) => extreme(B, dir, Object.assign({}, opts, { stop: T }));
  const det = (w) => !!w && (hi(w.r) <= lo(neg) || lo(w.r) >= hi(pos));
  const und = (w) => !!w && lo(w.r) > hi(neg) && hi(w.r) < lo(pos);
  const out = { evals: 0 }, seen = [];
  const go = (dir, T) => { const e = run(dir, T); out.evals += e.evals; if (e.witness) seen.push(e.witness); return e; };
  /* 1 — every model at or below 1 − θ, or every model at or above 1 + θ */
  const a = go(+1, lo(neg)); if (a.bound <= lo(neg)) { out.verdict = PROVADO; out.side = 'neg'; return out; }
  const b = go(-1, hi(pos)); if (b.bound >= hi(pos)) { out.verdict = PROVADO; out.side = 'pos'; return out; }
  /* 2 — no model reaches either threshold */
  const c = go(-1, hi(neg)), d = go(+1, lo(pos));
  if (c.bound > hi(neg) && d.bound < lo(pos)) { out.verdict = REFUTADO; out.und = seen.find(und) || null; return out; }
  /* 3 — neither: the witnesses say whether both sides are proved */
  out.verdict = RECUSADO; out.det = seen.find(det) || null; out.und = seen.find(und) || null;
  out.split = !!(out.det && out.und);
  return out;
}

/* the proved range of r on the box, for the printed envelope and the flips */
function range(B, opts) {
  const mx = extreme(B, +1, opts), mn = extreme(B, -1, opts);
  return { U: mx.bound, L: mn.bound, wmax: mx.witness, wmin: mn.witness, evals: mx.evals + mn.evals };
}
/* |ΔIp/Ip| on a box, in percent, as four proved numbers:
     lo   a proved LOWER bound of the smallest change any model shows
     loA  the smallest change a witness ATTAINS (a model that shows no more)
     hiA  the largest change a witness attains
     hi   a proved UPPER bound of the largest change
   For a threshold θ: PROVADO iff θ ≤ lo; REFUTADO iff θ > hi; RECUSADO with two
   proved witnesses iff loA < θ ≤ hiA; in the thin gaps between a bound and a
   witness the engine says it has not decided. When the change can take both
   signs, some model shows none at all (r is continuous on a connected box, so
   it passes through 1): lo = loA = 0. */
function absRange(B, opts) {
  const G = range(B, opts);
  const p = (x) => (Math.sqrt(x) - 1) * 100;
  const pl = (x) => pctLo(x), ph = (x) => pctHi(x);
  const ur = G.wmax ? G.wmax.r : null, lr = G.wmin ? G.wmin.r : null;
  let lo, loA, hiA, hi;
  if (G.U < 1) {                           /* every model loses impedance */
    lo = -ph(G.U); hi = -pl(G.L);
    loA = ur ? -pl(ur[0]) : null; hiA = lr ? -ph(lr[1]) : null;
  } else if (G.L > 1) {                    /* every model gains it */
    lo = pl(G.L); hi = ph(G.U);
    loA = lr ? ph(lr[1]) : null; hiA = ur ? pl(ur[0]) : null;
  } else {
    /* the bounds straddle 1; what the witnesses ATTAIN is read on its own */
    hi = Math.max(-pl(G.L), ph(G.U));
    lo = 0;
    if (ur && lr && ur[0] > 1 && lr[1] < 1) loA = 0;                  /* a model on each side: by continuity one shows no change */
    else if (ur && ur[1] < 1) loA = -pl(ur[0]);                       /* every witness loses: the least loss seen */
    else if (lr && lr[0] > 1) loA = ph(lr[1]);                        /* every witness gains: the least gain seen */
    else loA = null;
    const a = lr ? (lr[1] < 1 ? -ph(lr[1]) : lr[0] > 1 ? pl(lr[0]) : 0) : 0;
    const b = ur ? (ur[1] < 1 ? -ph(ur[1]) : ur[0] > 1 ? pl(ur[0]) : 0) : 0;
    hiA = Math.max(a, b);
  }
  return { lo, loA, hiA, hi, sign: G.U < 1 ? -1 : G.L > 1 ? 1 : 0, evals: G.evals, wmin: G.wmin, wmax: G.wmax };
}
function classifyAbs(A, thetaPct) {
  if (thetaPct <= A.lo) return PROVADO;
  if (thetaPct > A.hi) return REFUTADO;
  if (A.loA !== null && A.hiA !== null && A.loA < thetaPct && thetaPct <= A.hiA) return RECUSADO;
  return null;                               /* not decided at this budget: said so */
}

/* ------------------------------------------------------------ receipt -- */
const MEASURABLE = {
  dSg: 'a saturação de gás injetado (perfil de saturação, simulação calibrada)',
  w: 'como o gás se distribui (uniforme ou em manchas: testemunho, perfil de ressonância, 4D anterior)',
  s: 'a rigidez do arcabouço seco (ensaio em plugue, perfil sônico e de cisalhamento)',
  phi: 'a porosidade (perfis e testemunhos)',
  Kg: 'o módulo do gás injetado (análise PVT)',
  gk: 'a razão G/K do arcabouço (perfil de cisalhamento)',
  Swi: 'a saturação de água inicial (perfis)',
  dSw: 'a saturação de água injetada (perfil de saturação)'
};
const br = (x, d) => x.toFixed(d).replace('.', ',');
function words(B, k) { const [a, b] = B[k]; return a === b ? br(a, 3) : br(a, 3) + '–' + br(b, 3); }
function witnessText(W) {
  const B = W.B;
  return 'φ = ' + words(B, 'phi') + ', rigidez s = ' + words(B, 's') + ', Sg injetado = ' + words(B, 'dSg') + ', mistura w = ' + words(B, 'w') + ', Kgás = ' + words(B, 'Kg') + ' GPa';
}
/* decl: the declared box (strings); q: { theta: "0.03" } — the detection threshold on |ΔIp/Ip| */
function decide(decl, q, opts) {
  const B = box(decl), th = Number(q.theta) * 100;
  const out = { question: q, checks: [], flips: [], price: [] };
  const why = domain(B);
  if (why) { out.verdict = RECUSADO; out.checks.push({ id: 'dominio', verdict: RECUSADO, text: 'Fora do domínio do modelo: ' + why + '. Não há decisão a dar.' }); return out; }
  out.checks.push({ id: 'dominio', verdict: PROVADO, text: 'Toda a caixa está no domínio de Gassmann: arcabouço sob o limite de Voigt, saturações em [0, 1].' });
  const D = decideBox(B, q.theta, opts);
  const G = range(B, Object.assign({ budget: 40000 }, opts));
  out.verdict = D.verdict; out.evals = D.evals + G.evals;
  out.envelope = [Math.floor(pctLo(G.L) * 100) / 100, Math.ceil(pctHi(G.U) * 100) / 100];
  out.attained = [G.wmin ? Math.floor(pctLo(G.wmin.r[0]) * 100) / 100 : null, G.wmax ? Math.ceil(pctHi(G.wmax.r[1]) * 100) / 100 : null];
  const env = '[' + br(out.envelope[0], 2) + '%; ' + br(out.envelope[1], 2) + '%]';
  if (D.verdict === PROVADO) out.checks.push({ id: 'deteccao', verdict: PROVADO, text: 'Para todo modelo admissível, |ΔIp/Ip| ≥ ' + br(th, 1) + '%: a mudança de impedância fica em ' + env + ' e não atravessa o limiar.' });
  else if (D.verdict === REFUTADO) out.checks.push({ id: 'deteccao', verdict: REFUTADO, text: 'Para todo modelo admissível, |ΔIp/Ip| < ' + br(th, 1) + '%: a mudança fica em ' + env + '. Nenhum levantamento com esse limiar vê a injeção, qualquer que seja a rocha dentro da caixa.' });
  else out.checks.push({ id: 'deteccao', verdict: RECUSADO, text: D.split
    ? 'A caixa contém modelos dos dois lados, ambos provados. Detectável: ' + witnessText(D.det) + ' → ΔIp/Ip ∈ [' + br(pctLo(D.det.r[0]), 2) + '%; ' + br(pctHi(D.det.r[1]), 2) + '%]. Não detectável: ' + witnessText(D.und) + ' → [' + br(pctLo(D.und.r[0]), 2) + '%; ' + br(pctHi(D.und.r[1]), 2) + '%]. A evidência declarada não decide.'
    : 'A mudança fica em ' + env + ', que atravessa o limiar de ' + br(th, 1) + '%; o motor não isolou as duas testemunhas neste orçamento.' });
  out.witnesses = { det: D.det ? { at: D.det.B, r: D.det.r } : null, und: D.und ? { at: D.und.B, r: D.und.r } : null };
  if (D.verdict === RECUSADO && G.U < 1) {
    /* the thresholds that flip it, from the proved extremes: every model changes by at least
       1 − √U and at most 1 − √L */
    const tDet = Math.floor(-pctHi(G.U) * 100) / 100, tNone = Math.ceil(-pctLo(G.L) * 100) / 100;
    out.flips.push({ kind: 'theta', det: tDet, none: tNone, text: 'Um levantamento que resolva |ΔIp/Ip| ≥ ' + br(tDet, 2) + '% vê a injeção em toda a caixa: PROVADO. Com limiar acima de ' + br(tNone, 2) + '%, nenhum modelo é visível: REFUTADO.' });
  }
  if (D.verdict === RECUSADO && !(opts && opts.noPrice)) out.price = priceOfInformation(decl, q, opts);
  return out;
}

/* THE PRICE OF INFORMATION. For each input that can be measured, the coarsest
   resolution — its declared range cut into K = 2, 4, 8, 16 slices — at which
   knowing it DECIDES the question in every slice (PROVADO or REFUTADO,
   possibly different slice by slice). The input that decides at the coarsest
   cut is the cheapest measurement to buy; an input that decides at no cut
   cannot settle the question alone. */
function priceOfInformation(decl, q, opts) {
  const out = [];
  for (const k of Object.keys(MEASURABLE)) {
    const a = Number(decl[k][0]), b = Number(decl[k][1]);
    if (a === b) continue;
    let found = null, slices = null;
    for (const K of [2, 4, 8, 16]) {
      const vs = [];
      for (let i = 0; i < K; i++) {
        const s = Object.assign({}, decl, { [k]: [String(a + (b - a) * i / K), String(a + (b - a) * (i + 1) / K)] });
        const B = box(s);
        const v = domain(B) ? RECUSADO : decideBox(B, q.theta, Object.assign({ budget: 3000 }, opts)).verdict;
        vs.push(v);
        if (v === RECUSADO) break;
      }
      if (vs.length === K && !vs.includes(RECUSADO)) { found = K; slices = vs; break; }
    }
    out.push({ k, what: MEASURABLE[k], slices: found, resolution: found ? (b - a) / found : null, verdicts: slices });
  }
  out.sort((x, y) => (x.slices || 99) - (y.slices || 99));
  return out;
}

/* ------------------------------------------------ the decidability map -- */
function map(decl, q, ax, opts) {
  const [xk, nx] = ax.x, [yk, ny] = ax.y;
  const X = decl[xk].map(Number), Y = decl[yk].map(Number);
  const cells = []; let evals = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const s = Object.assign({}, decl, {
      [xk]: [String(X[0] + (X[1] - X[0]) * i / nx), String(X[0] + (X[1] - X[0]) * (i + 1) / nx)],
      [yk]: [String(Y[0] + (Y[1] - Y[0]) * j / ny), String(Y[0] + (Y[1] - Y[0]) * (j + 1) / ny)]
    });
    const B = box(s);
    if (domain(B)) { cells.push('D'); continue; }
    const D = decideBox(B, q.theta, Object.assign({ budget: 1500 }, opts)); evals += D.evals;
    cells.push(D.verdict === PROVADO ? 'P' : D.verdict === REFUTADO ? 'F' : 'R');
  }
  return { x: xk, y: yk, nx, ny, X, Y, cells, evals };
}

/* a float point value, for the second implementation's comparison only */
function pointR(p) {
  const sw2 = p.Swi + p.dSw, so2 = 1 - sw2 - p.dSg, so1 = 1 - p.Swi;
  const Kl = (sw, so) => (sw + so) / (sw / p.Kw + so / p.Ko);
  const K1 = Kl(p.Swi, so1), L2 = Kl(sw2, so2), sl = 1 - p.dSg;
  const R = 1 / (sl / L2 + p.dSg / p.Kg), Vv = sl * L2 + p.dSg * p.Kg, K2 = R + p.w * (Vv - R);
  const kr = p.s * (1 - p.phi / p.phic), Kdry = kr * p.Kmin;
  const M = (K) => Kdry + (1 - kr) ** 2 / (p.phi / K + (1 - p.phi - kr) / p.Kmin) + 4 / 3 * p.gk * Kdry;
  const rho1 = (1 - p.phi) * p.rhomin + p.phi * (p.Swi * p.rhow + so1 * p.rhoo);
  const rho2 = rho1 + p.phi * (p.dSw * (p.rhow - p.rhoo) + p.dSg * (p.rhog - p.rhoo));
  return (rho2 * M(K2)) / (rho1 * M(K1));
}

module.exports = { decide, decideBox, range, absRange, classifyAbs, extreme, map, box, dec, domain, changeD, isqrt, pointR, priceOfInformation, pctOf, DIMS, MEASURABLE, PROVADO, REFUTADO, RECUSADO };
