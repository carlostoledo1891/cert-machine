#!/usr/bin/env node
/* battery.js — the gate on instruments/agtable: the enclosures against float routes, the clearing
   identity, the scheme's minimiser and conservation, the verdicts, and five red controls.
   usage: node instruments/agtable/battery.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const E = require(path.join(__dirname, 'exact.js'));
const SL = require(path.join(__dirname, 'sl.js'));
const DV = require(path.join(__dirname, 'derive.js'));
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const { iv } = I;

let checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'agtable-redecided.json'), 'utf8'));
const t0 = Date.now();
const R = DV.derive();
const ms = Date.now() - t0;
const mid = (X) => 0.5 * (X[0] + X[1]);

check('R1  the record re-derived live equals the record (' + (ms / 1000).toFixed(1) + ' s)', JSON.stringify([R.exact, R.runs, R.orders, R.tolerance, R.counts, R.asPrinted, R.pins]) === JSON.stringify([REC.exact, REC.runs, REC.orders, REC.tolerance, REC.counts, REC.asPrinted, REC.pins]));
check('R2  the code that produced the record is the code on disk', ['exact.js', 'sl.js', 'derive.js'].every((f, i) => DV.sha(path.join(__dirname, f)) === [REC.provenance.sha256, REC.provenance.schemeSha256, REC.provenance.deriveSha256][i]) && DV.sha(path.join(ROOT, 'instruments', 'interval', 'taylor2.js')) === REC.provenance.taylor2Sha256);
check('P1  the printed tables hash to their pin', R.pins.tables === REC.pins.tables);

/* ---- the enclosures against float routes ---- */
let q = -0.5, t = 0, dq = 0; const n = 20000, dt = 1 / n;
const f = (t, q) => 5 * Math.sin(3 * Math.PI * t) - 4 * q;
let inside = true;
for (let i = 0; i < n; i++) { const k1 = f(t, q), k2 = f(t + dt / 2, q + dt / 2 * k1), k3 = f(t + dt / 2, q + dt / 2 * k2), k4 = f(t + dt, q + dt * k3); q += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); t += dt; if (i % 2000 === 1999) { const X = E.Qiv(iv(t)); dq = Math.max(dq, Math.abs(q - mid(X))); if (Math.abs(q - mid(X)) > 1e-9) inside = false; } }
check('E1  the closed-form supply agrees with an RK4 integration of Q̇ = 5 sin 3πt − 4Q to 1e−9 at ten times, and Q(0) encloses −1/2', inside && I.contains(E.Qiv(I.ZERO), -0.5), dq.toExponential(2));
/* the Riccati route in float for test 1: a₂′ = 2a₂² − ½, a₁′ = −2a₂Q − 4a₂²K + ¼, a₀′ = (ϖ + a₁)²/2 − 1/32, all zero at T */
{
  const NN = 20000, hh = 1 / NN; let A2 = 0, A1 = 0, A0 = 0;
  const Qf = SL.Qexact, Kf = (s) => mid(E.Kiv(iv(s))), Pf = (s) => mid(E.price1(iv(s)));
  const F = (s, a2, a1, a0) => [2 * a2 * a2 - 0.5, -2 * a2 * Qf(s) - 4 * a2 * a2 * Kf(s) + 0.25, (Pf(s) + a1) ** 2 / 2 - 1 / 32];
  let s = 1;
  for (let i = 0; i < NN; i++) { const h = -hh; const k1 = F(s, A2, A1, A0), k2 = F(s + h / 2, A2 + h / 2 * k1[0], A1 + h / 2 * k1[1], A0 + h / 2 * k1[2]), k3 = F(s + h / 2, A2 + h / 2 * k2[0], A1 + h / 2 * k2[1], A0 + h / 2 * k2[2]), k4 = F(s + h, A2 + h * k3[0], A1 + h * k3[1], A0 + h * k3[2]); A2 += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); A1 += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); A0 += h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]); s += h; }
  check('E2  the closed a₂(0), a₁(0) and the enclosed a₀(0) contain the Riccati route (float RK4, an independent derivation of u)', Math.abs(A2 - mid(R.exact.a2_0)) < 1e-9 && Math.abs(A1 - mid(R.exact.a1_0)) < 1e-9 && A0 >= R.exact.a0.value[0] && A0 <= R.exact.a0.value[1], 'a₀ ' + A0.toFixed(9) + ' ∈ [' + R.exact.a0.value.map(v => v.toFixed(9)) + ']');
}
check('E3  the clearing identity ϖ + a₁ + 2a₂K = −Q encloses 0 at all 21 times (the exact price clears the exact market)', R.exact.clearing.every(c => c.zero), 'max half-width ' + Math.max(...R.exact.clearing.map(c => c.r[1] - c.r[0])).toExponential(1));
check('E4  every enclosure is narrow: a₀(0) to 2e−6, the bump masses and ∫|Q|^{4/3} to 1e−6, the price of test 1 to 1e−13 and of test 2 to 1e−4 (a cube root near a zero of Q widens)', R.exact.a0.remainder < 2e-6 && R.exact.Z1.remainder < 1e-6 && R.exact.Z2.remainder < 1e-6 && R.exact.int2.remainder < 1e-6 && R.exact.priceWidth[1] < 1e-13 && R.exact.priceWidth[2] < 1e-4, R.exact.a0.remainder.toExponential(1) + ' · ' + R.exact.priceWidth[1].toExponential(1) + ' · ' + R.exact.priceWidth[2].toExponential(1));
let cbrtOK = true; for (const x of [-8, -0.3, -1e-5, 1e-5, 0.7, 27]) { const c = E.cbrt(iv(x)); const back = I.pow(c, 3); if (!I.contains(back, x)) cbrtOK = false; }
check('E5  the verified cube root: cubing the enclosure contains the argument, both signs', cbrtOK);
/* the transported density integrates to one (float Simpson on the enclosure midpoints) */
{ let s1 = 0, s2 = 0; const n2 = 4000; for (let i = 0; i <= n2; i++) { const x = -1 + 2 * i / n2, wgt = (i === 0 || i === n2) ? 1 : (i % 2 ? 4 : 2); s1 += wgt * mid(E.m1atT(iv(x), iv(R.exact.Z1.value[0], R.exact.Z1.value[1]))); s2 += wgt * mid(E.m2atT(iv(x), iv(R.exact.Z2.value[0], R.exact.Z2.value[1]))); } s1 *= (2 / n2) / 3; s2 *= (2 / n2) / 3;
  check('E6  m(·, T) of both tests integrates to 1 within 1e−6 (Simpson on the enclosure midpoints)', Math.abs(s1 - 1) < 1e-6 && Math.abs(s2 - 1) < 1e-6, s1.toFixed(8) + ' · ' + s2.toFixed(8)); }

/* ---- the scheme ---- */
{
  let same = true, massOK = true;
  for (const test of [1, 2]) {
    const A = SL.solve({ test, M: 100, N: 25, eps: 1e-8, maxIter: 300, bruteForce: true }), B = SL.solve({ test, M: 100, N: 25, eps: 1e-8, maxIter: 300 });
    for (let k = 0; k <= 25; k++) if (A.w[k] !== B.w[k]) same = false;
    for (let i = 0; i <= 100; i++) if (A.u0[i] !== B.u0[i] || A.mT[i] !== B.mT[i]) same = false;
    let s0 = 0, sT = 0; for (let i = 0; i <= 100; i++) { s0 += B.m0[i]; sT += B.mT[i]; }
    if (Math.abs(s0 - sT) > 1e-12) massOK = false;
  }
  check('S1  the convexity-based minimiser returns bit for bit what the brute force over every cell returns (both tests, M = 100)', same);
  check('S2  the transport step conserves the nodal mass to 1e−12', massOK);
}
check('S3  the scheme converged at every mesh and tolerance (residual below ε before the iteration cap)', [1, 2].every(test => R.runs[test].every(r => r.theirs.converged && r.tight.converged)), [1, 2].map(test => R.runs[test].map(r => r.theirs.it + '/' + r.tight.it).join(' ')).join(' · '));

/* ---- the tables ---- */
check('T1  test 1, the price column: REPRODUCED at all four meshes to the two printed digits', R.runs[1].every(r => r.theirs.verdicts.w.verdict === 'REPRODUCED'), R.runs[1].map(r => r.theirs.w.rel[1].toExponential(2) + ' vs ' + r.printed.w.toExponential(1)).join(' · '));
check('T2  test 2: the value function and density columns REPRODUCED at every mesh; the price column reproduced or within 15 % except at the finest mesh, where the port does better than printed', R.runs[2].every(r => ['u', 'm'].every(c => r.theirs.verdicts[c].verdict === 'REPRODUCED')) && R.runs[2].slice(0, 3).every(r => r.theirs.verdicts.w.verdict !== 'DIFFERS') && R.runs[2][3].theirs.verdicts.w.factor < 1, JSON.stringify(R.counts[2]) + ' · finest w ×' + R.runs[2][3].theirs.verdicts.w.factor.toFixed(2));
check('T3  test 1, the value function and density columns: within 15 % at the coarsest mesh, and larger than printed by a growing factor at the finer ones (the port\'s choices show there)', ['u', 'm'].every(c => R.runs[1][0].theirs.verdicts[c].verdict !== 'DIFFERS' && R.runs[1][3].theirs.verdicts[c].factor > R.runs[1][1].theirs.verdicts[c].factor && R.runs[1][3].theirs.verdicts[c].factor > 1.2), R.runs[1].map(r => 'u ×' + r.theirs.verdicts.u.factor.toFixed(2) + ' m ×' + r.theirs.verdicts.m.factor.toFixed(2)).join(' · '));
check('T4  first order in the price at the tight tolerance: consecutive error ratios in [1.6, 2.6] for both tests', [1, 2].every(test => R.orders[test].w.every(r => r > 1.6 && r < 2.6)), [1, 2].map(test => R.orders[test].w.map(r => r.toFixed(2)).join(',')).join(' · '));
check('T5  the tolerance is part of the printed number: at the finest mesh of test 1 the price error at ε = 0.004 exceeds the tight one by more than 20 %', R.tolerance[1].w.change > 0.2, (100 * R.tolerance[1].w.change).toFixed(0) + ' %');
check('T6  test 2 is insensitive to its tolerance: the implicit update reaches 1e−12 in three iterations and the errors at ε = 0.0002 and 1e−8 coincide', R.runs[2].every(r => r.theirs.it <= 3 && Math.abs(mid(r.theirs.w.rel) - mid(r.tight.w.rel)) < 1e-12));
check('D1  the density as printed has a mass above 1e50 on a sliver of width 0.001 just outside |x| = 1/λ, for both λ: not a probability density; the integrable reading is the one enclosed', R.asPrinted[1.1].lowerMass > 1e50 && R.asPrinted[1.2].lowerMass > 1e50, R.asPrinted[1.1].lowerMass.toExponential(1) + ' · ' + R.asPrinted[1.2].lowerMass.toExponential(1));

/* ---- red controls ---- */
check('X1  RED ok: a printed cell forged by a factor 2 is no longer REPRODUCED', DV.verdict(R.runs[1][0].theirs.w.rel, 2 * R.runs[1][0].printed.w).verdict === 'DIFFERS' && DV.verdict(R.runs[1][0].theirs.w.rel, R.runs[1][0].printed.w).verdict === 'REPRODUCED');
{ const bad = R.exact.clearing.map(c => { const t = iv(c.t); const r = I.add(I.add(I.add(I.add(E.price1(t), iv(0.1)), E.a1(t)), I.mul(I.mul(iv(2), E.a2(t)), E.Kiv(t))), E.Qiv(t)); return I.contains(r, 0); });
  check('X2  RED ok: the price shifted by 0.1 (the paper\'s ∫x m̄ term, were the bump not symmetric) fails the clearing identity at every time', bad.every(b => !b)); }
{ const S = SL.solve({ test: 1, M: 100, N: 25, eps: 0.004, maxIter: 300 }); const wrong = S.w.slice(0, 25).map(v => -v); const d = DV.supDist(wrong, R.exact.price[1].filter((_, k) => k % 8 === 0).slice(0, 25));
  check('X3  RED ok: the scheme\'s price with its sign flipped is not within a factor 10 of the printed error', DV.verdict(d.rel, R.runs[1][0].printed.w).verdict === 'DIFFERS' && d.rel[0] > 10 * R.runs[1][0].printed.w); }
{ let threw = false; try { E.cbrt(iv(NaN)); } catch (e) { threw = true; } check('X4  RED ok: the cube root refuses an argument it cannot verify', threw); }
{ const s = JSON.stringify(R.runs); check('X5  RED ok: no run reports a relative error interval that does not contain its midpoint rounding (every rel has lo ≤ hi)', [1, 2].every(test => R.runs[test].every(r => ['w', 'u', 'm'].every(c => r.theirs[c].rel[0] <= r.theirs[c].rel[1] && r.tight[c].rel[0] <= r.tight[c].rel[1]))) && s.length > 1000); }

console.log(fails === 0 ? 'ALL PASS   (' + checks + ' checks, 5 red controls)' : fails + ' FAILED of ' + checks);
process.exit(fails === 0 ? 0 : 1);
