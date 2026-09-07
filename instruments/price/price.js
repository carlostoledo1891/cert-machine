/* price.js — the clearing price of the Gomes–Saúde price-formation model, exactly.
   instruments/price · cert-machine · 2026-09-07

   THE MODEL (Gomes–Saúde, arXiv:1807.07088, §6: linear-quadratic with a set-point potential)
     agents:   ẋ = α, running cost  c α²/2 + ϖ(t) α + η (x − κ)²/2,  terminal cost  γ (x − ζ)²/2
     system:   −u_t + (ϖ + u_x)²/(2c) − η (x − κ)²/2 = 0,   m_t − (m (ϖ + u_x))_x / c = 0
     clearing: (1/c) ∫ (ϖ + u_x) m dx = −Q(t)          (the price is the multiplier of this identity)

   THE PRICE, CLOSED. Write Π(t) = ∫ u_x m and Ξ(t) = ∫ x m. The paper (§6.2) derives the
   averaged dynamics Ξ̇ = Q (conservation of energy) and Π̇ = −η (Ξ − κ), then solves for Π by
   a Volterra equation and a Laplace transform, leaving Π(0) implicit. With quadratic terminal
   data the terminal value is explicit instead — Π(T) = ∫ γ (x − ζ) m(T) = γ (Ξ(T) − ζ) — and
   the two ODEs integrate in closed form:

       Ξ(t) = x̄₀ + ∫₀ᵗ Q,      Π(t) = γ (Ξ(T) − ζ) + η ∫ₜᵀ (Ξ(s) − κ) ds,      ϖ(t) = −c Q(t) − Π(t).

   For η = 0 this is the paper's (25)/(30): ϖ = Θ − cQ with Θ = −γ (∫₀ᵀQ + x̄₀ − ζ). The price
   is AFFINE in the supply path and every coefficient is ≤ 0 when c, γ, η ≥ 0, so over a box of
   supply paths lo ≤ Q ≤ hi the price band is attained at the corners: price(hi) ≤ ϖ ≤ price(lo).

   WHAT IS EXACT. With Q piecewise constant on the grid and rational data, every quantity above
   is a rational number and is computed as one (BigInt fractions, instruments/interval/rational).
   A double entered as data is converted losslessly (m·2^e). Nothing here is solved iteratively.

   WHAT IS NOT CLAIMED. That the lab's box-constrained battery model (fd.js) is this model — it
   is not: its wall changes Π̇, and the report measures by how much. That Q is anything but a
   step function on the grid. Anything about ε > 0 (viscosity): the closed form is first-order. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Rn = require(path.join(__dirname, '..', 'interval', 'rational.js'));
const CERT = require(path.join(__dirname, '..', 'interval', 'certificate.js'));
const { R, ZERO, add, sub, mul, div, neg, cmp, sign, fromDouble, toDouble } = Rn;
const rs = Rn.toString;

/* a rational from a double (lossless), a "p/q" or decimal string, or a rational */
function rat(v) {
  if (v && typeof v === 'object' && 'n' in v) return v;
  if (typeof v === 'number') return fromDouble(v);
  const s = String(v).trim();
  if (s.includes('/')) { const [a, b] = s.split('/'); return R(BigInt(a), BigInt(b)); }
  if (s.includes('.')) { const [i, f] = s.split('.'); return R(BigInt(i + f), 10n ** BigInt(f.length)); }
  return R(BigInt(s));
}
const TWO = R(2);

function model(o) {
  const P = { c: rat(o.c), gamma: rat(o.gamma), zeta: rat(o.zeta), eta: rat(o.eta), kappa: rat(o.kappa), T: rat(o.T), xbar0: rat(o.xbar0), N: o.N | 0 };
  if (P.N < 1) throw new Error('price: N ≥ 1');
  P.d = div(P.T, R(P.N));
  return P;
}
const monotone = (P) => sign(P.c) >= 0 && sign(P.gamma) >= 0 && sign(P.eta) >= 0;

/* Ξ at the N+1 grid times: x̄₀ plus the energy absorbed so far (Q_n rules [t_n, t_{n+1})) */
function trajectory(P, Q) {
  const Xi = [P.xbar0];
  for (let n = 0; n < P.N; n++) Xi.push(add(Xi[n], mul(P.d, Q[n])));
  return Xi;
}
/* ∫₀ᵀ Q — the day's energy, the paper's K(0) */
function energy(P, Q) { let K = ZERO; for (let n = 0; n < P.N; n++) K = add(K, mul(P.d, Q[n])); return K; }

/* Π at the grid times, backward from the terminal identity; Ξ is linear on each step so the
   cell integral ∫(Ξ − κ) is exact: d · ((Ξ_n + Ξ_{n+1})/2 − κ) */
function pressure(P, Q) {
  const Xi = trajectory(P, Q), N = P.N;
  const Pi = new Array(N + 1);
  Pi[N] = mul(P.gamma, sub(Xi[N], P.zeta));
  for (let n = N - 1; n >= 0; n--) {
    const cell = mul(P.d, sub(div(add(Xi[n], Xi[n + 1]), TWO), P.kappa));
    Pi[n] = add(Pi[n + 1], mul(P.eta, cell));
  }
  return { Xi, Pi };
}
function price(P, Q) {
  if (Q.length !== P.N + 1) throw new Error('price: Q must have N + 1 values');
  const { Xi, Pi } = pressure(P, Q);
  return { Xi, Pi, w: Q.map((q, n) => sub(neg(mul(P.c, q)), Pi[n])) };
}
/* the paper's Θ (eq. 30): the constant offset of the price-supply line when η = 0 */
const theta = (P, Q) => neg(mul(P.gamma, sub(add(energy(P, Q), P.xbar0), P.zeta)));

/* the band over lo ≤ Q ≤ hi: attained at the corners when the model is monotone */
function band(P, lo, hi) {
  if (!monotone(P)) throw new Error('price: the corner band needs c, γ, η ≥ 0 — see sensitivity()');
  for (let n = 0; n <= P.N; n++) if (cmp(lo[n], hi[n]) > 0) throw new Error('price: lo > hi at n = ' + n);
  const a = price(P, hi), b = price(P, lo);
  return { lo: a.w, hi: b.w, width: a.w.map((v, n) => sub(b.w[n], v)), atHi: a, atLo: b };
}
/* ∂ϖ_n/∂Q_k, exactly: the map is affine, so one exact difference is the coefficient */
function sensitivity(P, Q, n, k) {
  const Q2 = Q.slice(); Q2[k] = add(Q2[k], R(1));
  return sub(price(P, Q2).w[n], price(P, Q).w[n]);
}
/* the width of the band decomposed: the instant term c·(hi−lo)_n, the day term γ·∫(hi−lo),
   and the set-point term η·∫ₜᵀ(∫₀ˢ(hi−lo)) — three non-negative parts that add to the width */
function widthParts(P, lo, hi, n) {
  const dq = hi.map((h, k) => sub(h, lo[k]));
  const inst = mul(P.c, dq[n]);
  const day = mul(P.gamma, energy(P, dq));
  const Xi = trajectory(model({ c: 0, gamma: 0, zeta: 0, eta: 0, kappa: 0, T: P.T, xbar0: 0, N: P.N }), dq);
  let set = ZERO;
  for (let k = n; k < P.N; k++) set = add(set, mul(P.d, div(add(Xi[k], Xi[k + 1]), TWO)));
  set = mul(P.eta, set);
  return { inst, day, set, total: add(add(inst, day), set) };
}

/* a uniform random path inside the box (for the battery's falsifier), deterministic seed */
function interior(lo, hi, seed) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return lo.map((l, n) => { const u = R(BigInt(Math.floor(rnd() * 1000)), 1000n); return add(l, mul(u, sub(hi[n], l))); });
}
const inside = (band, w) => w.every((v, n) => cmp(band.lo[n], v) <= 0 && cmp(v, band.hi[n]) <= 0);

/* ---- the certificate ---------------------------------------------------------- */
function certificate(P, lo, hi, provenance, extra) {
  const falsifier = [
    'η < 0: a sensitivity ∂ϖ_n/∂Q_k turns positive and a path inside the box prices outside the corner band (the battery shows it)',
    'a supply path inside the box whose exact price leaves the band at any grid time',
    'η = 0: Π_n ≠ −Θ at some n, Θ the paper\'s (30) — the closed form would not be the paper\'s line',
    'the Riccati route (u = a x² + b x + e, float ODE) disagreeing with the closed form beyond 1e−9',
    'the wide-domain finite-difference solve of the same system disagreeing beyond first order in the mesh'
  ];
  const claim = 'Gomes–Saúde LQ price formation with c = ' + rs(P.c) + ', γ = ' + rs(P.gamma) + ', ζ = ' + rs(P.zeta) + ', η = ' + rs(P.eta)
    + (sign(P.eta) ? ', κ = ' + rs(P.kappa) : '') + ', x̄₀ ≈ ' + toDouble(P.xbar0).toFixed(6) + ', N = ' + P.N + ': for every supply path in the box lo ≤ Q ≤ hi the clearing price lies in the corner band price(hi) ≤ ϖ ≤ price(lo) at every grid time, both edges attained';
  if (!monotone(P)) return CERT.refused({ claim, why: 'c, γ, η are not all ≥ 0: the price is not monotone in the supply and the corner band is not a band', falsifier, provenance });
  const B = band(P, lo, hi);
  let wmax = ZERO, nmax = 0;
  B.width.forEach((v, n) => { if (cmp(v, wmax) > 0) { wmax = v; nmax = n; } });
  return CERT.proved({
    claim,
    evidence: Object.assign({ gridTimes: P.N + 1, maxWidth: toDouble(wmax), maxWidthAt: nmax, energyLo: toDouble(energy(P, lo)), energyHi: toDouble(energy(P, hi)) }, extra || {}),
    assumes: [
      'the model is the paper\'s (33) on the whole line with quadratic terminal data; the price is the multiplier of the clearing identity (Problem 1)',
      'the closed form: Ξ̇ = Q and Π̇ = −η(Ξ − κ) (the paper\'s §6.2 averaged dynamics, an identity for C² solutions with decaying m) closed by Π(T) = γ(Ξ(T) − ζ)',
      'Q is a step function on the grid: Q_n rules [t_n, t_{n+1}); the price at t_n is its right limit',
      'first order (ε = 0); the box-constrained battery of the lab kernel is a different model and is measured, not enclosed'
    ],
    falsifier, provenance
  });
}
function sha256File(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

module.exports = { rat, model, monotone, trajectory, energy, pressure, price, theta, band, sensitivity, widthParts, interior, inside, certificate, sha256File, Rn };
