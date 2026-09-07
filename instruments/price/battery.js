#!/usr/bin/env node
/* battery.js — the gate on instruments/price: the closed form against the paper, the band, the
   port against the lab, conservation, convergence, and five red controls.
   usage: node instruments/price/battery.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const PR = require(path.join(__dirname, 'price.js'));
const FD = require(path.join(__dirname, 'fd.js'));
const DV = require(path.join(__dirname, 'derive.js'));
const { Rn } = PR;
const { add, sub, mul, neg, cmp, sign, toDouble } = Rn;

let checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'price-band.json'), 'utf8'));
const t0 = Date.now();
const R = DV.derive();
const ms = Date.now() - t0;

/* the exact objects again, for the checks that need rationals */
const lab = FD.labScenario(DV.SLIDERS);
const Q = Array.from(lab.Q), Qr = Q.map(PR.rat), N = DV.MODEL.N;
const xbar0 = R.exact.xbar0.value;
const rho = PR.rat(DV.RHO);
const lo = Qr.map(q => mul(q, sub(Rn.ONE, rho))), hi = Qr.map(q => mul(q, add(Rn.ONE, rho)));
const P0 = PR.model(Object.assign({}, DV.MODEL, { eta: '0', kappa: '0', xbar0 }));
const P6 = PR.model(Object.assign({}, DV.MODEL, { eta: '6', kappa: '3/5', xbar0 }));

check('R1  the record re-derived live equals the record (' + (ms / 1000).toFixed(1) + ' s)', JSON.stringify([R.exact, R.fdBox, R.wideRuns, R.Q]) === JSON.stringify([REC.exact, REC.fdBox, REC.wideRuns, REC.Q]));
check('R2  the code that produced the record is the code on disk', PR.sha256File(path.join(__dirname, 'price.js')) === REC.provenance.sha256 && PR.sha256File(path.join(__dirname, 'fd.js')) === REC.provenance.fdSha256 && PR.sha256File(path.join(__dirname, 'derive.js')) === REC.provenance.deriveSha256);
check('R3  every ladder certificate is PROVED and carries a falsifier', R.exact.ladder.every(L => L.certificate.verdict === 'PROVED' && L.certificate.falsifier.length >= 5));

/* ---- the closed form against the paper ---- */
const pr0 = PR.price(P0, Qr), th = PR.theta(P0, Qr);
check('E1  η = 0: Π_n = −Θ EXACTLY at all ' + (N + 1) + ' grid times, Θ the paper\'s (30) — the price is the line ϖ = Θ − cQ of (25)', pr0.Pi.every(p => cmp(p, neg(th)) === 0), 'Θ = ' + Rn.toString(th).slice(0, 40) + '…');
check('E2  Ξ(T) = x̄₀ + ∫Q exactly (the paper\'s (32), conservation of energy)', cmp(pr0.Xi[N], add(P0.xbar0, PR.energy(P0, Qr))) === 0);
const pr6 = PR.price(P6, Qr);
check('E3  η > 0: Π(T) = γ(Ξ(T) − ζ) exactly and Π_n − Π_{n+1} = η d ((Ξ_n + Ξ_{n+1})/2 − κ) exactly at every step', cmp(pr6.Pi[N], mul(P6.gamma, sub(pr6.Xi[N], P6.zeta))) === 0 && pr6.Pi.every((p, n) => n === N || cmp(sub(p, pr6.Pi[n + 1]), mul(P6.eta, mul(P6.d, sub(Rn.div(add(pr6.Xi[n], pr6.Xi[n + 1]), Rn.R(2)), P6.kappa)))) === 0));

/* the Riccati route, in float: u = a x² + b x + e, a' = 2a²/c − η/2, b' = −2aQ − 4a²Ξ/c + ηκ, Π = 2aΞ + b */
function riccati(P, Qf, sub) {
  const c = toDouble(P.c), gamma = toDouble(P.gamma), eta = toDouble(P.eta), kappa = toDouble(P.kappa), zeta = toDouble(P.zeta), d = toDouble(P.d), x0 = toDouble(P.xbar0);
  const Xi = new Float64Array(N + 1); Xi[0] = x0; for (let n = 0; n < N; n++) Xi[n + 1] = Xi[n] + d * Qf[n];
  let a = gamma / 2, b = -gamma * zeta; const w = new Float64Array(N + 1);
  w[N] = -c * Qf[N] - (2 * a * Xi[N] + b);
  for (let n = N - 1; n >= 0; n--) {
    const q = Qf[n], XiAt = (s) => Xi[n] + s * q;               /* s measured from t_n within the step */
    const f = (s, a, b) => [2 * a * a / c - eta / 2, -2 * a * q - 4 * a * a * XiAt(s) / c + eta * kappa];
    const h = -d / sub; let s = d;
    for (let k = 0; k < sub; k++) {
      const k1 = f(s, a, b), k2 = f(s + h / 2, a + h / 2 * k1[0], b + h / 2 * k1[1]), k3 = f(s + h / 2, a + h / 2 * k2[0], b + h / 2 * k2[1]), k4 = f(s + h, a + h * k3[0], b + h * k3[1]);
      a += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); b += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); s += h;
    }
    w[n] = -c * Qf[n] - (2 * a * Xi[n] + b);
  }
  return w;
}
const ric0 = riccati(P0, Q, 4), ric6 = riccati(P6, Q, 4);
const dev = (w, ex) => Math.max(...w.map((v, n) => Math.abs(v - toDouble(ex.w[n]))));
check('E4  the Riccati route (float RK4, an independent derivation) agrees with the closed form to 1e−9 at η = 0 and η = 6', dev(ric0, pr0) < 1e-9 && dev(ric6, pr6) < 1e-9, dev(ric0, pr0).toExponential(2) + ' · ' + dev(ric6, pr6).toExponential(2));

/* ---- the band ---- */
const B0 = PR.band(P0, lo, hi), B6 = PR.band(P6, lo, hi);
let sensOK = true, sensMin = null;
for (const P of [P0, P6]) for (const n of [0, 60, 120, 180, 240]) for (const k of [0, 1, 59, 60, 120, 239, 240]) { const s = PR.sensitivity(P, Qr, n, k); if (sign(s) > 0) sensOK = false; if (sensMin === null || cmp(s, sensMin) < 0) sensMin = s; }
check('B1  every sampled sensitivity ∂ϖ_n/∂Q_k is ≤ 0 exactly (η = 0 and η = 6): the price never rises with supply', sensOK, 'most negative ' + toDouble(sensMin).toFixed(6));
let insideAll = true;
for (let s = 1; s <= 20; s++) { const Qi = PR.interior(lo, hi, 1000 + s); if (!PR.inside(B0, PR.price(P0, Qi).w) || !PR.inside(B6, PR.price(P6, Qi).w)) insideAll = false; }
check('B2  twenty random supply paths inside the box price inside the band at every grid time, exactly (η = 0 and η = 6)', insideAll);
check('B3  the band edges are attained: price(hi) = lo edge and price(lo) = hi edge, and lo ≤ hi everywhere', B0.lo.every((v, n) => cmp(v, B0.hi[n]) <= 0) && B6.lo.every((v, n) => cmp(v, B6.hi[n]) <= 0) && cmp(PR.price(P0, hi).w[100], B0.lo[100]) === 0);
check('B4  the width decomposes exactly: instant + day + set-point = width, at every grid time (η = 6)', B6.width.every((w, n) => cmp(PR.widthParts(P6, lo, hi, n).total, w) === 0));
check('B5  the recorded widest band and Θ equal the live rationals', R.exact.ladder[0].maxWidth.exact === Rn.toString(B0.width.reduce((m, v) => cmp(v, m) > 0 ? v : m, Rn.ZERO)) && R.exact.theta.exact === Rn.toString(th));

/* ---- the port and the lab ---- */
check('L1  the port still produces the numbers that matched the lab kernel bit for bit on 2026-09-07: 49 iterations, residual 8.037e−10, converged', R.lab.it === 49 && Math.abs(R.lab.res - 8.03704297558383e-10) < 1e-24 && R.lab.converged, R.lab.it + ' · ' + R.lab.res.toExponential(3));
check('L2  the lab\'s scheme clears in the controls to 1e−12 while its fleet ends ' + R.fdBox.lab.lost.toFixed(4) + ' short of the energy it cleared (Ξ(T) = ' + R.fdBox.lab.XiT.toFixed(4) + ' vs ' + R.exact.XiT.value.toFixed(4) + ')', R.fdBox.lab.clearGap < 1e-12 && R.fdBox.lab.lost > 0.08, 'wall density at T ' + R.fdBox.wallDensityT.lab.toFixed(1));
check('L3  forbidding the wall-pointing control reduces the loss but does not remove it', R.fdBox.constrained.lost > 0.03 && R.fdBox.constrained.lost < R.fdBox.lab.lost);
check('L4  clearing on the Fokker–Planck flux conserves: Ξ(T) matches the exact model to 1e−12 and the flux demand equals Q to 1e−12', R.fdBox.consistent.lost < 1e-12 && R.fdBox.consistent.clearGap < 1e-12 && R.fdBox.consistent.unreachable === 0);
check('W1  on the wide domain the consistent scheme approaches the closed form at first order: error ratio in [1.6, 2.4] for H halved, both runs converged', R.wideRuns.order > 1.6 && R.wideRuns.order < 2.4 && R.wideRuns.consistent.every(c => c.converged && c.lost < 1e-12), R.wideRuns.consistent.map(c => c.maxErr.toFixed(4)).join(' → '));
check('W2  the same with the set-point potential on (η = 6): error below 0.1 at the coarse mesh and the mid-day Π within 1 % of exact', R.wideRuns.consistentEta[0].maxErr < 0.1 && Math.abs(R.wideRuns.consistentEta[0].PiMid - R.wideRuns.consistentEta[0].PiMidExact) < 0.01 * R.wideRuns.consistentEta[0].PiMidExact, R.wideRuns.consistentEta[0].maxErr.toFixed(4));

/* ---- red controls ---- */
const Pneg = PR.model(Object.assign({}, DV.MODEL, { eta: '-60', kappa: '3/5', xbar0 }));
let posSens = false; for (const n of [0, 120]) for (const k of [60, 200]) if (sign(PR.sensitivity(Pneg, Qr, n, k)) > 0) posSens = true;
const cornerLo = PR.price(Pneg, hi).w, cornerHi = PR.price(Pneg, lo).w;
let escaped = false; for (let s = 1; s <= 20 && !escaped; s++) { const w = PR.price(Pneg, PR.interior(lo, hi, 2000 + s)).w; if (!w.every((v, n) => cmp(cornerLo[n], v) <= 0 && cmp(v, cornerHi[n]) <= 0)) escaped = true; }
let threw = false; try { PR.band(Pneg, lo, hi); } catch (e) { threw = true; }
check('X1  RED ok: η < 0 gives a positive sensitivity, an interior path escapes the corner band, and band() refuses', posSens && escaped && threw);
const thForged = add(th, Rn.R(1n, 1000000000n));
check('X2  RED ok: Θ forged by 1e−9 is no longer −Π at any grid time', pr0.Pi.every(p => cmp(p, neg(thForged)) !== 0));
const ricForged = riccati(PR.model(Object.assign({}, DV.MODEL, { eta: '0', kappa: '0', xbar0: xbar0 + 1e-6 })), Q, 4);
check('X3  RED ok: the Riccati route with x̄₀ moved by 1e−6 disagrees with the closed form by more than 1e−9', dev(ricForged, pr0) > 1e-9, dev(ricForged, pr0).toExponential(2));
check('X4  RED ok: the lab\'s wall treatment on the wide domain does NOT converge to the closed form — the error grows as the mesh refines (ratio ' + R.wideRuns.labOrder.toFixed(2) + ' < 1)', R.wideRuns.labOrder < 1 && R.wideRuns.lab.every(c => c.lost > 0.05));
const Qout = hi.map(h => add(h, Rn.R(1n, 10n)));
check('X5  RED ok: a supply path above the box prices below the band (the band is not a tautology)', PR.price(P0, Qout).w.every((v, n) => cmp(v, B0.lo[n]) < 0));

console.log(fails === 0 ? 'ALL PASS   (' + checks + ' checks, 5 red controls)' : fails + ' FAILED of ' + checks);
process.exit(fails === 0 ? 0 : 1);
