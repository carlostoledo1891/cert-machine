/* derive.js — everything the record and the page state, derived live from the scenario.
   instruments/price · cert-machine · 2026-09-07

   run.js writes what this returns; battery.js re-derives it and checks every statement;
   the report builder execs run.js --check and refuses on any difference. */
'use strict';
const path = require('path');
const PR = require(path.join(__dirname, 'price.js'));
const FD = require(path.join(__dirname, 'fd.js'));
const { Rn } = PR;
const { add, sub, mul, cmp, toDouble } = Rn;
const rs = Rn.toString;

/* the lab's scenario at its default sliders: peak cut 0.5, midday width 0.7, adequacy 1.25, σ 0.10 */
const SLIDERS = { apk: 0.5, aw: 0.7, adeq: 1.25, sig: 0.10 };
const MODEL = { c: '1', gamma: '12', zeta: '17/20', T: '1', N: 240 };        /* the lab's c = 1, terminal 6(x − 0.85)² = γ/2 (x − ζ)² */
const RHO = '3/20';                                                           /* the forecast box: Q (1 ± ρ) */
const LADDER = [{ eta: '0', kappa: '0' }, { eta: '3', kappa: '3/5' }, { eta: '12', kappa: '3/5' }];
const WIDE = { xa: -1, xb: 2, nu: 0.005, meshes: [[150, 240], [300, 480]] };

const D = (v) => toDouble(v);
const Ds = (arr) => arr.map(D);

/* the lab's step-function supply replicated onto a finer time grid (Q_k rules [t_k, t_{k+1})) */
function resample(Q, NT) {
  const N0 = Q.length - 1, out = new Float64Array(NT + 1);
  for (let n = 0; n <= NT; n++) { const k = Math.min(N0, Math.floor(n * N0 / NT + 1e-12)); out[n] = Q[k]; }
  return out;
}
/* what the finite-difference price does against the exact one on the same grid */
function compare(W, P, Qr) {
  const ex = PR.price(P, Qr);
  let maxErr = 0, at = 0, XiErr = 0;
  for (let n = 0; n <= P.N; n++) {
    const d = Math.abs(W.w[n] - D(ex.w[n])); if (d > maxErr) { maxErr = d; at = n; }
    XiErr = Math.max(XiErr, Math.abs(W.Xi[n] - D(ex.Xi[n])));
  }
  return { maxErr, maxErrAt: at, XiErr, PiMid: 0, it: W.it, res: W.res, converged: W.converged, clearGap: W.clearGap, unreachable: W.unreachable, XiT: W.Xi[P.N], XiTexact: D(ex.Xi[P.N]), lost: D(ex.Xi[P.N]) - W.Xi[P.N] };
}

function derive() {
  const lab = FD.labScenario(SLIDERS);
  const Q = Array.from(lab.Q), Qr = Q.map(PR.rat);
  const N = MODEL.N;

  /* ---- the lab's kernel on its box, three ways ---- */
  const box = {};
  const runBox = (walls, clearing) => FD.solve(Object.assign({}, lab, { walls, clearing }));
  box.lab = runBox('lab', 'control');
  box.constrained = runBox('constrained', 'control');
  box.consistent = runBox('constrained', 'flux');
  const xbar0 = box.lab.xbar0;                       /* the discrete fleet's mean, a double, taken as exact data below */

  /* ---- the exact model on the lab's supply ---- */
  const rho = PR.rat(RHO);
  const lo = Qr.map(q => mul(q, sub(Rn.ONE, rho))), hi = Qr.map(q => mul(q, add(Rn.ONE, rho)));
  const ladder = LADDER.map(L => {
    const P = PR.model(Object.assign({}, MODEL, { eta: L.eta, kappa: L.kappa, xbar0 }));
    const pr = PR.price(P, Qr), B = PR.band(P, lo, hi);
    let wmax = Rn.ZERO, nmax = 0; B.width.forEach((v, n) => { if (cmp(v, wmax) > 0) { wmax = v; nmax = n; } });
    const parts = PR.widthParts(P, lo, hi, nmax);
    const parts0 = PR.widthParts(P, lo, hi, 0);
    return {
      eta: L.eta, kappa: L.kappa,
      price: Ds(pr.w), Pi: Ds(pr.Pi), Xi: Ds(pr.Xi),
      band: { lo: Ds(B.lo), hi: Ds(B.hi), width: Ds(B.width) },
      maxWidth: { exact: rs(wmax), value: D(wmax), at: nmax, parts: { inst: D(parts.inst), day: D(parts.day), set: D(parts.set) } },
      widthAt0: { value: D(B.width[0]), parts: { inst: D(parts0.inst), day: D(parts0.day), set: D(parts0.set) } },
      Pi0: { exact: rs(pr.Pi[0]), value: D(pr.Pi[0]) }, PiT: { exact: rs(pr.Pi[N]), value: D(pr.Pi[N]) },
      certificate: PR.certificate(P, lo, hi, { code: 'instruments/price/price.js' }, { maxWidthExact: rs(wmax) }).toJSON()
    };
  });
  const P0 = PR.model(Object.assign({}, MODEL, { eta: '0', kappa: '0', xbar0 }));
  const theta = PR.theta(P0, Qr), K = PR.energy(P0, Qr), XiT = PR.trajectory(P0, Qr)[N];
  const exact = {
    xbar0: { exact: rs(PR.rat(xbar0)), value: xbar0 }, energy: { exact: rs(K), value: D(K) }, XiT: { exact: rs(XiT), value: D(XiT) },
    theta: { exact: rs(theta), value: D(theta) }, rho: RHO, boxLo: Ds(lo), boxHi: Ds(hi), ladder
  };

  /* ---- the lab's box against the exact model (η = 0) ---- */
  const cmpBox = (W) => { const c = compare(W, P0, Qr); c.PiMid = -Q[N >> 1] - W.w[N >> 1]; c.price = Array.from(W.w); c.Xi = Array.from(W.Xi); c.rebound = W.rebound; return c; };
  const fdBox = { lab: cmpBox(box.lab), constrained: cmpBox(box.constrained), consistent: cmpBox(box.consistent), wallDensityT: { lab: box.lab.M[N * lab.NX + lab.NX - 1], constrained: box.constrained.M[N * lab.NX + lab.NX - 1], consistent: box.consistent.M[N * lab.NX + lab.NX - 1] } };

  /* ---- the wide domain: the consistent scheme must approach the closed form at first order ---- */
  const wideRun = (NX, NT, walls, clearing, eta, kappa) => {
    const Qn = resample(Q, NT);
    const W = FD.solve({ xa: WIDE.xa, xb: WIDE.xb, NX, NT, T: 1, nu: WIDE.nu, gamma: 12, zeta: 0.85, eta, kappa, Q: Qn, m0: FD.gaussian(WIDE.xa, WIDE.xb, NX, 0.30, 0.12), TOL: 1e-9, MAX_ITER: 400, THMIX: 0.35, walls, clearing });
    const P = PR.model(Object.assign({}, MODEL, { N: NT, eta: String(eta), kappa: String(kappa), xbar0: W.xbar0 }));
    const c = compare(W, P, Array.from(Qn).map(PR.rat));
    c.PiMid = -Qn[NT >> 1] - W.w[NT >> 1]; c.PiMidExact = D(PR.price(P, Array.from(Qn).map(PR.rat)).Pi[NT >> 1]);
    c.NX = NX; c.NT = NT; c.H = W.H; c.walls = walls; c.clearing = clearing; c.eta = eta;
    return c;
  };
  const wide = {
    consistent: WIDE.meshes.map(([NX, NT]) => wideRun(NX, NT, 'constrained', 'flux', 0, 0)),
    consistentEta: [wideRun(WIDE.meshes[0][0], WIDE.meshes[0][1], 'constrained', 'flux', 6, 0.6)],
    lab: WIDE.meshes.map(([NX, NT]) => wideRun(NX, NT, 'lab', 'control', 0, 0))
  };
  wide.order = wide.consistent[0].maxErr / wide.consistent[1].maxErr;
  wide.labOrder = wide.lab[0].maxErr / wide.lab[1].maxErr;

  return { sliders: SLIDERS, model: MODEL, wide: { xa: WIDE.xa, xb: WIDE.xb, nu: WIDE.nu }, Q, exact, fdBox, wideRuns: wide, lab: { it: box.lab.it, res: box.lab.res, converged: box.lab.converged, NX: lab.NX, NT: lab.NT, nu: lab.nu } };
}

module.exports = { derive, resample, SLIDERS, MODEL, RHO, LADDER, WIDE };
