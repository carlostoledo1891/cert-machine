#!/usr/bin/env node
/* build-report-agtable.js — generate reports/agtable.html: Ashrafyan–Gomes Tables 1 and 2, re-decided.
   certs/agtable-redecided.json is re-derived during the build and compared byte for byte.
   usage: node tools/build-report-agtable.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const TK = require(path.join(ROOT, 'design', 'tokens.js'));
const die = (m) => { console.error('AGTABLE REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

try { cp.execSync('node instruments/agtable/run.js --check', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { die('the live re-derivation differs from certs/agtable-redecided.json:\n' + (e.stderr || e.stdout || e.message)); }
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'agtable-redecided.json'), 'utf8'));
if (REC.verdict !== 'MEASURED') die('record verdict is ' + REC.verdict);
if (!REC.exact.clearing.every(c => c.zero)) die('the clearing identity failed somewhere');
const { CAT, CTX } = TK.CHART;
const mid = (X) => 0.5 * (X[0] + X[1]);
const e1 = (v) => v.toExponential(1), e2 = (v) => v.toExponential(2), f3 = (v) => v.toFixed(3), f4 = (v) => v.toFixed(4);
const N = REC.exact.N, xs = REC.exact.xs;
const totals = { reproduced: REC.counts[1].reproduced + REC.counts[2].reproduced, near: REC.counts[1].near + REC.counts[2].near, differs: REC.counts[1].differs + REC.counts[2].differs };
const COLS = { w: 'ϖ, the price', u: 'u at t = 0', m: 'm at t = T' };
const tag = (v) => C.tag(v === 'REPRODUCED' ? 'REPRODUCED' : v === 'NEAR' ? 'NEAR' : 'DIFFERS');

/* ---- figure 1: the supply and the two exact prices, with the scheme's coarsest price ---- */
const ts = (arr) => arr.map((X, k) => [k / N, mid(X)]);
const c1 = REC.coarse[1], c2 = REC.coarse[2];
const FIG_PRICES = CH.lines({
  w: 900, h: 320, x0: 0, x1: 1, y0: -1.6, y1: 0.9, yTicks: [-1.5, -1, -0.5, 0, 0.5].map(v => ({ v, t: String(v) })), xTicks: [0, 0.25, 0.5, 0.75, 1].map(v => ({ v, t: String(v) })), xLabel: 't', yLabel: 'supply and price', hover: false,
  series: [
    { name: 'Q(t), the supply of both tests: Q̇ = 5 sin 3πt − 4Q, Q(0) = −½ (closed form, enclosed)', pts: ts(REC.exact.Qgrid), token: CTX },
    { name: 'ϖ₁(t), test 1: −Q + (1 − t)/4 − ∫ₜ¹∫₀ˢQ (enclosed to 1e−13)', pts: ts(REC.exact.price[1]) },
    { name: 'ϖ₂(t), test 2: −Q^{1/3} − (1 − t) (enclosed; a verified cube root)', pts: ts(REC.exact.price[2]) },
    { name: 'the scheme\'s ϖ₁ at the coarsest mesh, ρ = 0.02, h = 0.04 (computed)', pts: c1.w.slice(0, c1.N).map((v, k) => [k / c1.N, v]), token: CAT[0], dashed: true }
  ],
  alt: 'Three oscillating curves over one unit of time: the supply from minus one half up through zero and back, the test-1 price mirroring it, the test-2 price lower and sharper at the zeros of the supply; a dashed staircase follows the test-1 price closely.'
});

/* ---- figure 2: test 1, u(x, 0) and m(x, T), exact against the coarse scheme ---- */
const FIG_U = CH.lines({
  w: 900, h: 300, x0: -1, x1: 1, y0: -0.1, y1: 0.7, yTicks: [0, 0.2, 0.4, 0.6].map(v => ({ v, t: String(v) })), xTicks: [-1, -0.5, 0, 0.5, 1].map(v => ({ v, t: String(v) })), xLabel: 'x', yLabel: 'u(x, 0), test 1', hover: false,
  series: [
    { name: 'exact: a₀ + a₁x + a₂x², a₀ enclosed to ' + e1(REC.exact.a0.remainder) + ' (decided)', pts: xs.map((x, i) => [x, mid(REC.exact.u0[1][i])]) },
    { name: 'the scheme at ρ = 0.02, h = 0.04 (computed)', pts: c1.xs.map((x, i) => [x, c1.u0[i]]), token: CAT[0], dashed: true }
  ],
  alt: 'A convex parabola from 0.6 at the left edge down to near zero around x = 0.3 and up to 0.15 at the right; the dashed scheme lies just above it.'
});
const FIG_M = CH.lines({
  w: 900, h: 300, x0: -1, x1: 1, y0: 0, y1: 1.6, yTicks: [0, 0.5, 1, 1.5].map(v => ({ v, t: String(v) })), xTicks: [-1, -0.5, 0, 0.5, 1].map(v => ({ v, t: String(v) })), xLabel: 'x', yLabel: 'm(x, T), test 1', hover: false,
  series: [
    { name: 'exact: the initial bump carried by the affine flow, scale cosh(1)⁻¹ = ' + f4(mid(REC.exact.sigmaT)) + ', mean K(1) = ' + f4(mid(REC.exact.K1)) + ' (decided)', pts: xs.map((x, i) => [x, mid(REC.exact.mT[1][i])]) },
    { name: 'the scheme at ρ = 0.02, h = 0.04 (computed): the disagreement sits at the edge of the support, as the paper says', pts: c1.xs.map((x, i) => [x, c1.mT[i]]), token: CAT[0], dashed: true }
  ],
  alt: 'A narrow bump centred near zero, 1.4 high, with a dashed bump of the same height spreading slightly wider at its feet.'
});

/* ---- figure 3: the errors against the mesh, ours and printed, one panel per column ---- */
function errFig(col) {
  const keys = [
    { token: CAT[0], t: 'test 1, this port at the paper\'s ε (computed)', kind: 'dash' }, { token: CAT[1], t: 'test 2, this port at the paper\'s ε (computed)', kind: 'dash' },
    { token: CTX, t: 'printed in Tables 1 and 2 (hollow)', kind: 'line' }
  ];
  const nLeg = CH.legendLines(keys, 900 - 62 - 22);
  const LG = Math.log10;
  const all = [1, 2].flatMap(t => REC.runs[t].flatMap(r => [r.theirs[col].rel[1], r.printed[col]]));
  const y0 = Math.floor(LG(Math.min(...all)) * 2) / 2 - 0.1, y1 = Math.ceil(LG(Math.max(...all)) * 2) / 2 + 0.1;
  const o = { w: 900, h: 300 + nLeg * 19, x0: LG(0.0018), x1: LG(0.028), y0, y1, padB: 28 + 22 + 5 + nLeg * 19, xLabel: 'ρ (h = 2ρ), logarithmic — the relative error of ' + COLS[col], yLabel: 'error, log' };
  const f = CH.frame(o);
  const out = [CH.open({ w: f.w, h: f.h, alt: 'Relative error of ' + COLS[col] + ' against the mesh for both tests on logarithmic axes: the port\'s dashed lines fall at first order; the printed hollow circles sit on them for the price and below them for the other columns of test 1.' })];
  out.push(CH.axes(f, Object.assign({}, o, { xTicks: [0.0025, 0.005, 0.01, 0.02].map(v => ({ v: LG(v), t: String(v) })), yTicks: [-3, -2.5, -2, -1.5, -1].filter(v => v >= y0 && v <= y1).map(v => ({ v, t: Number.isInteger(v) ? String(Math.pow(10, v)) : '' })) })));
  [1, 2].forEach((test, ti) => {
    const R = REC.runs[test];
    out.push('    <path d="' + R.map((r, k) => (k ? 'L' : 'M') + f.px(LG(r.rho)).toFixed(1) + ' ' + f.py(LG(r.theirs[col].rel[1])).toFixed(1)).join(' ') + '" fill="none" stroke="' + CAT[ti] + '" stroke-width="2" stroke-dasharray="' + G.CLAIM + '"/>');
    for (const r of R) {
      out.push('    <circle cx="' + f.px(LG(r.rho)).toFixed(1) + '" cy="' + f.py(LG(r.theirs[col].rel[1])).toFixed(1) + '" r="4" fill="' + CAT[ti] + '"/>');
      out.push('    <circle ' + CH.hit('cx="' + f.px(LG(r.rho)).toFixed(1) + '" cy="' + f.py(LG(r.printed[col])).toFixed(1) + '" r="6" fill="none" stroke="' + CTX + '" stroke-width="2"', 'test ' + test + ' · ρ = ' + r.rho, 'printed ' + e1(r.printed[col]) + ' · this port ' + e2(r.theirs[col].rel[1]) + ' · ' + r.theirs.verdicts[col].verdict) + '/>');
    }
  });
  out.push(CH.legend(keys, f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
}

/* ---- the tables ---- */
function table(test) {
  const rows = [];
  for (const r of REC.runs[test]) for (const col of ['w', 'u', 'm']) {
    const v = r.theirs.verdicts[col];
    rows.push([{ raw: C.m('ρ = ' + r.rho + ', h = ' + r.h) }, COLS[col], e1(r.printed[col]), { raw: C.m('[' + e2(r.theirs[col].rel[0]) + ', ' + e2(r.theirs[col].rel[1]) + ']') }, e2(r.tight[col].rel[1]), { raw: tag(v.verdict) + (v.verdict === 'REPRODUCED' ? '' : ' ×' + v.factor.toFixed(2)) }]);
  }
  return C.table({ cols: [{ h: 'mesh' }, { h: 'quantity' }, { h: 'printed (ε = ' + REC.printed['test' + test].eps + ')', cls: 'v' }, { h: 'this port at that ε, as an interval', cls: 'v' }, { h: 'at ε = 1e−8', cls: 'v' }, { h: 'verdict' }], rows });
}
const T_EXACT = C.table({
  cols: [{ h: 'quantity' }, { h: 'enclosure', cls: 'v' }, { h: 'width', cls: 'v' }, { h: 'how' }],
  rows: [
    ['Q(1)', { raw: C.m('[' + REC.exact.Q1.map(v => v.toFixed(12)).join(', ') + ']') }, e1(REC.exact.Q1[1] - REC.exact.Q1[0]), 'closed form with π, e enclosed'],
    ['K(1) = ∫₀¹Q, the day\'s energy', { raw: C.m('[' + REC.exact.K1.map(v => v.toFixed(12)).join(', ') + ']') }, e1(REC.exact.K1[1] - REC.exact.K1[0]), 'closed form'],
    ['a₀(0), test 1', { raw: C.m('[' + REC.exact.a0.value.map(v => v.toFixed(9)).join(', ') + ']') }, e1(REC.exact.a0.remainder), 'midpoint rule, ' + REC.exact.a0.K + ' cells, the remainder from an interval f″'],
    ['a₁(0), a₂(0), test 1', { raw: C.m(f4(mid(REC.exact.a1_0)) + ', ' + f4(mid(REC.exact.a2_0))) }, e1(Math.max(REC.exact.a1_0[1] - REC.exact.a1_0[0], REC.exact.a2_0[1] - REC.exact.a2_0[0])), 'closed: a₂ = ½ tanh(1 − t), a₁ = Π − 2a₂K'],
    ['∫m̂, the bump\'s mass (λ = 1.1; 1.2)', { raw: C.m(f4(mid(REC.exact.Z1.value)) + '; ' + f4(mid(REC.exact.Z2.value))) }, e1(Math.max(REC.exact.Z1.remainder, REC.exact.Z2.remainder)), 'midpoint rule with f″ on the core, a sliver bound at the edges'],
    ['∫₀¹|Q|^{4/3}/4, test 2', { raw: C.m('[' + REC.exact.int2.value.map(v => v.toFixed(9)).join(', ') + ']') }, e1(REC.exact.int2.remainder), 'midpoint with f″ off the zeros of Q, a Riemann bound on the cells through them'],
    ['ϖ₁ on the finest grid', '201 values', e1(REC.exact.priceWidth[1]), 'closed form'],
    ['ϖ₂ on the finest grid', '201 values', e1(REC.exact.priceWidth[2]), 'a cube root near a zero of Q is where the width lives']
  ]
});

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · a replication with intervals, re-derived at every build',
  title: 'Their tables, re-decided',
  deck: 'A numerical-analysis paper ends with a table: the scheme\'s error against an exact solution, at four meshes, to two digits. '
    + 'The exact solution is a formula with π and e in it, evaluated in floating point; the error is a float minus a float; the '
    + 'digits are trusted because the authors are. This page takes the two tables of Ashrafyan and Gomes\'s semi-Lagrangian scheme '
    + 'for the price-formation game and does the other thing: the exact solutions are enclosed in interval arithmetic, the scheme is '
    + 'written again from the paper\'s own description with its inner minimisation solved exactly, and every printed cell is met by an '
    + 'interval and given a verdict. Most cells survive. Where they do not, the page says which choice the paper left open. And two things '
    + 'the tables could not show are found: the printed tolerance is a large part of the finest printed number, and the printed initial '
    + 'density, read as printed, is not a density.'
}));

O.push(C.tldr({
  findingRaw: 'Of the 24 printed cells, ' + totals.reproduced + ' are reproduced to their two digits, ' + totals.near + ' fall within 15 %, ' + totals.differs + ' differ. The price column of test 1 is reproduced at every mesh; test 2 is reproduced in the value function and the density at every mesh. The paper\'s tolerance ε = 0.004 is ' + (100 * REC.tolerance[1].w.change).toFixed(0) + ' % of the finest printed price error of test 1. The initial density as printed has a mass above ' + e1(REC.asPrinted[1.1].lowerMass) + ' on a sliver of width 0.001.',
  mechanismRaw: 'The exact solutions (§8.1.1, §8.2.1 of the paper) evaluated as intervals — a second-order interval jet bounds the remainder of every integral — and the scheme of §4 run on the paper\'s meshes at the paper\'s tolerance and at 1e−8; each error is the scheme\'s float against an enclosure, so it is an interval, and a printed cell is REPRODUCED when its rounding box meets it.',
  checkRaw: C.m('node instruments/agtable/battery.js') + ' (24 checks, 5 red controls, about 10 s) re-derives the record, checks the enclosures against float routes, decides the clearing identity, and re-runs the scheme.'
}));

O.push(C.stats([
  { k: 'cells reproduced', v: totals.reproduced + ' of 24', role: 'held', n: 'to the two printed digits, by an implementation written from the paper; ' + totals.near + ' more within 15 %' },
  { k: 'the price of test 1', v: '4 of 4', role: 'held', n: 'reproduced at every mesh: ' + REC.runs[1].map(r => e1(r.theirs.w.rel[1])).join(', ') + ' against ' + REC.runs[1].map(r => e1(r.printed.w)).join(', ') },
  { k: 'the tolerance inside the number', v: (100 * REC.tolerance[1].w.change).toFixed(0) + ' %', role: 'warn', n: 'the finest printed price error of test 1 at ε = 0.004 exceeds the same run at ε = 1e−8 by this much; test 2 is immune (its implicit update converges to 1e−12 in three steps)' },
  { k: 'clearing identity', v: '21 of 21', role: 'held', n: 'ϖ + a₁ + 2a₂K + Q encloses 0 at every sampled time: the exact price clears the exact market, decided' },
  { k: 'the density as printed', v: '> ' + e1(REC.asPrinted[1.1].lowerMass), role: 'warn', n: 'its mass on 0.910 < x < 0.911 alone, read literally (support |x| < 1); the integrable reading, support |x| < 1/λ, is the one used' },
  { k: 'where the port differs', v: 'u, m of test 1', role: 'warn', n: 'at the fine meshes the port\'s errors are ' + REC.runs[1][3].theirs.verdicts.u.factor.toFixed(1) + '× and ' + REC.runs[1][3].theirs.verdicts.m.factor.toFixed(1) + '× the printed ones; the paper\'s inner minimiser and its treatment of feet leaving [−1, 1] are not specified to the digit' }
]));

O.push(C.section({
  lab: '§1 · the exact solutions', title: 'Two formulas, enclosed',
  bodyRaw: '<div class="col">'
    + C.pRaw('Both tests share a supply that solves Q̇ = 5 sin 3πt − 4Q from Q(0) = −½: a sinusoid with a decaying start, in closed form with π and e. Test 1 is the linear-quadratic game with a set-point potential (x − ¼)²/2, and its price is the paper\'s semi-explicit formula, which with a symmetric initial density reads ϖ₁ = −Q + (1 − t)/4 − ∫ₜ¹∫₀ˢQ — the same closed form as <a href="price.html">the clearing-price page</a> with γ = 0, η = 1. Test 2 has the cost 3|α|^{4/3}/4 and a linear potential, and its price is ϖ₂ = −Q^{1/3} − (1 − t). Everything the tables measure against is one of these two prices, the value function at t = 0, or the density at t = 1.')
    + C.pRaw('Every one of them is evaluated as an interval. The prices need π, e, sines, cosines and a cube root (verified by cubing). The value function of test 1 is a₀ + a₁x + a₂x² with a₂ = ½ tanh(1 − t) and a₁ read off the clearing identity, but a₀(0) is an integral of a squared combination of Q, K and tanh, and the density of test 2 needs ∫|Q|^{4/3}, which has a cusp at every zero of Q. Those integrals are done by the midpoint rule with its remainder w³/24 · sup|f″| — and sup|f″| comes from a second-order interval jet, a value with its first two derivatives carried through every operation, so nobody differentiates by hand and the bound is rigorous on each cell. At the cusps a plain Riemann bound takes over. The densities are the initial bump carried by an affine flow (test 1: contracted by cosh(1)⁻¹ and shifted by the day\'s energy; test 2: shifted only), with the bump\'s mass enclosed the same way.')
    + '</div>' + T_EXACT
    + C.figure({ svgRaw: FIG_PRICES, caption: 'Figure 1 · The supply and the two exact prices over the day, enclosed (the widths are below the stroke). Dashed: the scheme\'s price of test 1 at the paper\'s coarsest mesh, a staircase of 25 steps that already follows the exact price to about a percent.' })
    + '<div class="col">'
    + C.pRaw('One identity is decided outright: the exact price of test 1 must clear the exact market, ϖ + a₁ + 2a₂K = −Q. Evaluated as intervals at 21 times, the residual encloses zero every time, to a half-width of ' + e1(Math.max(...REC.exact.clearing.map(c => c.r[1] - c.r[0]))) + '. Shift the price by 0.1 — the size the paper\'s ∫x m̄ term would have if the bump were not symmetric — and the identity fails at every time. That is the red control on the formula.')
    + '</div>'
    + C.figure({ svgRaw: FIG_U, caption: 'Figure 2 · Test 1, the value function at t = 0: the exact parabola and the scheme at the coarsest mesh. The scheme sits above the exact function everywhere by about the size of its time step; a semi-Lagrangian value is an upper bound on a convex problem\'s infimum.' })
    + C.figure({ svgRaw: FIG_M, caption: 'Figure 3 · Test 1, the density at t = T: the bump contracted by cosh(1)⁻¹ and carried to the day\'s energy, against the scheme at the coarsest mesh. The scheme\'s P1 transport diffuses the feet; the paper\'s own remark that the disagreement is at the boundary of the support is what one sees.' })
}));

O.push(C.section({
  lab: '§2 · the tables', title: 'Twenty-four cells, each met by an interval',
  bodyRaw: '<div class="col">'
    + C.pRaw('The scheme is the paper\'s: P1 interpolation of the value function, the backward step u_{i,k} = inf_α { I[u_{k+1}](x_i + hα) + h(l₀(α) + ϖ_k α + V_i) }, the forward push of the density by the minimising feet, the price corrected by the imbalance (explicitly for test 1, through an implicit cubic for test 2), stop when the price moves by less than ε. Two things the paper leaves to the reader are fixed here and said: the infimum is taken exactly — on each interpolation cell the objective is a convex function of α with a closed-form stationary point, so the least of the cell minima and the node values is the infimum, with no inner tolerance — and a foot that would leave [−1, 1] is held at the wall rather than given a shorter time step. The relative errors are sup norms on the grid: the price over the time grid, u at t = 0 and m at t = T over the space grid, each divided by the sup norm of the exact quantity. Because the exact quantity is an interval, so is each error; the tables print the interval, and a cell is REPRODUCED when the printed number\'s two-digit rounding box meets it.')
    + '</div>'
    + C.pRaw('<b>Table 1 of the paper (test 1, ε = 0.004).</b>') + table(1)
    + C.pRaw('<b>Table 2 of the paper (test 2, ε = 0.0002).</b>') + table(2)
    + C.figure({ svgRaw: errFig('w'), caption: 'Figure 4 · The price error against the mesh. The port\'s dashed lines halve as ρ halves (ratios ' + REC.orders[1].w.map(r => r.toFixed(2)).join(', ') + ' for test 1, ' + REC.orders[2].w.map(r => r.toFixed(2)).join(', ') + ' for test 2, at ε = 1e−8); the printed circles sit on the test-1 line at every mesh and on the test-2 line at three of four.' })
    + C.figure({ svgRaw: errFig('u'), caption: 'Figure 5 · The value-function error. Test 2 is reproduced throughout; test 1 parts from the printed values at the finer meshes, the port\'s errors larger by a growing factor — the fingerprint of the two open choices, not of the analytic solution, which both sides share.' })
    + C.figure({ svgRaw: errFig('m'), caption: 'Figure 6 · The density error. The same pattern: test 2 reproduced, test 1 within 15 % at the coarse meshes and larger at the fine ones.' })
}));

O.push(C.section({
  lab: '§3 · what the tables could not show', title: 'The tolerance, and the density as printed',
  bodyRaw: '<div class="col">'
    + C.pRaw('<b>The tolerance is inside the finest number.</b> The paper stops when the price moves by less than ε = 0.004 and reports that every case converges in four iterations. Run the same four meshes to ε = 1e−8 (fourteen or fifteen iterations) and the coarse errors do not move, but at the finest mesh the price error of test 1 falls from ' + e2(REC.tolerance[1].w.theirs) + ' to ' + e2(REC.tolerance[1].w.tight) + ': the printed 2.1e−3 is ' + (100 * REC.tolerance[1].w.change).toFixed(0) + ' % tolerance and the rest mesh. The convergence order the table suggests for the price (ratios ' + REC.runs[1].slice(1).map((r, i) => (REC.runs[1][i].printed.w / r.printed.w).toFixed(2)).join(', ') + ' between printed rows) is therefore blunted at the end by ε, and is ' + REC.orders[1].w.map(r => r.toFixed(2)).join(', ') + ' — clean first order — once ε is out of the way. Test 2 is immune: its implicit price update reaches 1e−12 in three iterations at every mesh, and its errors at ε = 0.0002 and 1e−8 coincide.')
    + C.pRaw('<b>The density as printed is not one.</b> Both tests start from m̂(x) = exp(−1/(1 − (λx)²)) "for |x| < 1, 0 otherwise", λ = 1.1 and 1.2. For 1/λ < |x| < 1 the exponent −1/(1 − (λx)²) is positive and unbounded as |x| ↓ 1/λ, so the printed function has no finite integral: on the sliver 1/λ + 0.001 ≤ x ≤ 1/λ + 0.002 alone its mass is at least ' + e1(REC.asPrinted[1.1].lowerMass) + ' (λ = 1.1) and ' + e1(REC.asPrinted[1.2].lowerMass) + ' (λ = 1.2), decided by a one-cell Riemann bound. The only integrable reading is the standard bump with support |x| < 1/λ, which is what the paper\'s figures show and what this page encloses. A typo, almost certainly; but a table of digits rests on it, and the digits survived, which says the authors\' code used the bump and not the sentence.')
    + '</div>'
}));

O.push(C.section({
  lab: '§4 · the honest boundary', title: 'What is claimed, and what is not',
  bodyRaw: '<div class="col">' + C.plainList([
    { b: 'Decided.', text: 'The enclosures of the two exact solutions and their widths; the clearing identity at 21 times; the bump\'s masses; the divergence of the density as printed. All interval statements, re-derived at every build.' },
    { b: 'Measured.', text: 'Every error of the port at every mesh and tolerance, as an interval around a float scheme; the verdicts on the printed cells; the convergence ratios; the tolerance\'s share. A REPRODUCED cell means an independent implementation of the described scheme lands in the printed rounding box; a DIFFERS cell means it does not, and for the fine-mesh u and m of test 1 the port\'s two fixed choices are the likeliest reason. Nothing here says a printed number is wrong.' },
    { b: 'Assumed.', text: 'The analytic solutions are the paper\'s (§8.1.1, §8.2.1); their derivation is not re-proved beyond the clearing identity. The relative error is the sup-norm ratio on the grid, which the paper\'s wording supports but does not spell out. The initial density is the integrable reading of the printed formula.' },
    { b: 'Not done.', text: 'The paper\'s comparisons with the variational and the recurrent-network methods; the authors\' own code, which is not published; the meshes between the four printed rows.' }
  ]) + '</div>'
}));

O.push(C.section({
  lab: '§5 · check it', title: 'Ten seconds on your machine',
  bodyRaw: '<div class="col">'
    + C.code('node instruments/agtable/battery.js       # 24 checks, 5 red controls: enclosures vs float routes, the clearing identity, the scheme, the verdicts\nnode instruments/agtable/run.js --check   # the record, re-derived and compared byte for byte')
    + C.pRaw('The instrument is <span class="m">instruments/agtable/exact.js</span> (the enclosures) with <span class="m">sl.js</span> (the scheme) and <span class="m">derive.js</span>; the interval jet is <span class="m">instruments/interval/taylor2.js</span>; the printed numbers are pinned in <span class="m">corpus/ashrafyan-gomes-2403.02785/tables.json</span>; the record is <span class="m">certs/agtable-redecided.json</span>.')
    + '</div>'
}));

O.push(C.section({
  lab: 'references', title: 'Sources',
  bodyRaw: '<div class="col">' + C.plainList([
    { raw: 'Y. Ashrafyan, D. A. Gomes, <em>A fully-discrete semi-Lagrangian scheme for a price formation MFG model</em>, arXiv:2403.02785v2 (30 Jan 2025) — §4 (the scheme), §8 (the tests, the analytic solutions, Tables 1 and 2 on pp. 24 and 27).' },
    { raw: 'D. A. Gomes, J. Saúde, <em>A mean-field game approach to price formation in electricity markets</em>, arXiv:1807.07088; Dyn. Games Appl. 11 (2021) — the model and the linear-quadratic solutions the tests rest on.' },
    { raw: '<a href="price.html">The clearing price, as a proved band</a> — the same closed form, exact in rationals, on the source lab\'s scenario.' }
  ]) + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-agtable.js @ git ' + gitrev
  + ' — certs/agtable-redecided.json re-derived during this build (enclosures and the scheme) and compared byte for byte (identical, or no page). Code sha256 ' + REC.provenance.sha256.slice(0, 16) + '…') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'agtable.html'),
  TPL.render({ title: 'Their tables, re-decided · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/agtable.html',
    desc: 'The two error tables of the Ashrafyan–Gomes semi-Lagrangian scheme met by intervals: the analytic solutions enclosed, the scheme rewritten from the paper, every printed cell given a verdict.' }));
console.log('reports/agtable.html written: record re-derived identically @ git ' + gitrev);
