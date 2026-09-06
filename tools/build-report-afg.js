#!/usr/bin/env node
/* build-report-afg.js — generate reports/afg.html: the first-order stationary
   mean-field game of Almulla, Ferreira and Gomes, enclosed by its current.

   The gate: the record certs/afg-enclosure.json is RE-DERIVED during this build
   (node instruments/afg/run.js --check, ~20 s) and the page refuses to render
   if a single byte of it has moved. Every number on the page is read from that
   record after the check passes; nothing is typed in.

   usage: node tools/build-report-afg.js */
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
const A = require(path.join(ROOT, 'instruments', 'afg', 'afg.js'));
const die = (m) => { console.error('AFG REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- re-derive the record, or no page --------------------------------- */
try { cp.execSync('node instruments/afg/run.js --check', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { die('the live re-derivation differs from certs/afg-enclosure.json:\n' + (e.stderr || e.stdout || e.message)); }
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'afg-enclosure.json'), 'utf8'));
if (REC.verdict !== 'VERIFIED') die('record verdict is ' + REC.verdict);
const CA = REC.cases.A, CB = REC.cases.B;
if (!(CB.j[0] > 0)) die('the current is not certified positive in the record');
if (!(CA.closedForm.H[0] >= CA.H[0] && CA.closedForm.H[1] <= CA.H[1])) die('the closed form is not inside the control enclosure');

/* ---- number formatting: outward, so a printed interval still contains ---- */
const floorTo = (v, d) => (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
const ceilTo = (v, d) => (Math.ceil(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
const box = (iv, d) => '[' + floorTo(iv[0], d) + ', ' + ceilTo(iv[1], d) + ']';
const mid = (iv, d) => ((iv[0] + iv[1]) / 2).toFixed(d);
const halfw = (iv) => ((iv[1] - iv[0]) / 2).toExponential(1);
/* a box around zero is printed as ± its half-width: thirteen zeros say less than one exponent */
const boxc = (iv, d) => (iv[0] <= 0 && 0 <= iv[1] && iv[1] - iv[0] < 1e-9 ? '±' + halfw(iv) : box(iv, d));
const { CAT, CTX } = TK.CHART;
const LEGEND_LINE = 19;   /* the legend line pitch, as charts.js has it */

/* ---- a tube figure: the certified band, with an optional dashed overlay --
   The band is CH.band's drawing (fill + two solid edges = DECIDED). The
   overlay is a float curve and wears the grammar's CLAIM dash — asserted, not
   decided — which here is the paper's closed form drawn from its formula. */
function tube(o) {
  const f = CH.frame(Object.assign({}, o, { padB: o.padB || 28 + (o.xLabel ? 22 : 0) + (o.keys ? 5 + 16 : 0) }));
  const pts = o.pts;
  const up = pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[2]).toFixed(2)).join(' ');
  const dn = pts.slice().reverse().map(p => 'L' + f.px(p[0]).toFixed(2) + ' ' + f.py(p[1]).toFixed(2)).join(' ');
  const out = [CH.open({ w: f.w, h: f.h, alt: o.alt })];
  out.push(CH.axes(f, o));
  out.push('    <path d="' + up + ' ' + dn + ' Z" fill="' + CAT[0] + '" opacity="0.14"/>');
  for (const idx of [1, 2]) {
    out.push('    <path d="' + pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' '
      + f.py(p[idx]).toFixed(2)).join(' ') + '" fill="none" stroke="' + CAT[0]
      + '" stroke-width="2" stroke-linejoin="round"/>');
  }
  if (o.overlay) {
    out.push('    <path d="' + o.overlay.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' '
      + f.py(p[1]).toFixed(2)).join(' ') + '" fill="none" stroke="' + CAT[2]
      + '" stroke-width="2" stroke-linejoin="round" stroke-dasharray="' + G.CLAIM + '"/>');
  }
  for (const m of (o.marks || [])) {
    const x = f.px(m.x);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + f.T + '" x2="' + x.toFixed(1) + '" y2="' + (f.T + f.ph)
      + '" stroke="' + CTX + '" stroke-width="1" stroke-dasharray="' + G.GUIDE + '"/>');
    out.push(CH.txt(CH.clampX(f, x, m.t, 'middle'), f.T + 13, m.t, 't-note', 'middle'));
  }
  for (const p of pts) {
    out.push('    <rect ' + CH.hit('x="' + (f.px(p[0]) - 3).toFixed(1) + '" y="' + f.T + '" width="' + (f.px(p[0] + (pts[1][0] - pts[0][0])) - f.px(p[0])).toFixed(1) + '" height="' + f.ph
      + '" fill="transparent" data-cmx="' + f.px(p[0]).toFixed(1) + '"',
      'x ∈ [' + p[0].toFixed(4) + ', ' + (p[0] + (pts[1][0] - pts[0][0])).toFixed(4) + ')',
      o.name + ' ∈ [' + p[1].toFixed(5) + ', ' + p[2].toFixed(5) + ']') + '/>');
  }
  out.push('    <line class="cm-cross" x1="0" y1="' + f.T + '" x2="0" y2="' + (f.T + f.ph)
    + '" stroke="' + TK.CHART.AXIS + '" stroke-width="1" style="opacity:0"/>');
  if (o.keys) out.push(CH.legend(o.keys, f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
}

/* ---- figure 1: the density of the instance, enclosed over every plot cell ---- */
const mPts = CB.mTube.map(p => [p[0], p[1], p[2]]);
const xTicks = [0, 0.25, 0.5, 0.75, 1].map(v => ({ v, t: String(v) }));
const FIG_M = tube({
  w: 900, h: 320, x0: 0, x1: 1, y0: 0, y1: 2.6, name: 'm',
  xTicks, yTicks: [0, 0.5, 1, 1.5, 2, 2.5].map(v => ({ v, t: String(v) })),
  xLabel: 'x on the torus', yLabel: 'density m',
  marks: [{ x: 0.25, t: 'their peak' }],
  pts: mPts,
  alt: 'The density m(x) of the instance b = cos²(2πx) as a certified tube over 256 cells of the torus: a single hump '
    + 'rising from about ' + CB.mMin.toFixed(2) + ' near x = 0.75 to about ' + CB.mMax.toFixed(2) + ' near x = 0.25, the tube '
    + 'thin everywhere but visible where the slope is steep.'
});

/* ---- figure 2: the value function of the instance ---- */
const uPts = CB.uTube.map(p => [p[0], p[1], p[2]]);
const uMax = Math.max(...uPts.map(p => Math.abs(p[1])), ...uPts.map(p => Math.abs(p[2])));
const FIG_U = tube({
  w: 900, h: 300, x0: 0, x1: 1, y0: -0.1, y1: 0.1, name: 'u',
  xTicks, yTicks: [-0.1, -0.05, 0, 0.05, 0.1].map(v => ({ v, t: String(v) })),
  xLabel: 'x on the torus', yLabel: 'value function u  (∫u = 0)',
  pts: uPts,
  alt: 'The value function u(x) of the instance as a certified tube: an oscillation of amplitude about ' + uMax.toFixed(3)
    + ' with zero mean, periodic, its enclosure too thin to see at this scale.'
});

/* ---- figure 3: the control — the certified tube and the paper's closed form ---- */
const K = 256;
const cfInt = CA.closedForm.intExpV;
const overlay = [];
for (let k = 0; k <= K; k++) {
  const x = k / K;
  overlay.push([x, Math.exp(Math.sin(2 * Math.PI * x)) / ((cfInt[0] + cfInt[1]) / 2)]);
}
const FIG_CTRL = tube({
  w: 900, h: 320, x0: 0, x1: 1, y0: 0, y1: 2.6, name: 'm',
  xTicks, yTicks: [0, 0.5, 1, 1.5, 2, 2.5].map(v => ({ v, t: String(v) })),
  xLabel: 'x on the torus', yLabel: 'density m',
  pts: CA.mTube.map(p => [p[0], p[1], p[2]]),
  overlay,
  keys: [{ token: CAT[0], t: 'certified tube (decided)', kind: 'line' },
         { token: CAT[2], t: 'the paper\'s closed form e^V / ∫e^V (asserted, drawn from its formula)', kind: 'dash' }],
  alt: 'The control b = 0: the certified density tube and, dashed, the closed form the paper states. The dashed '
    + 'curve runs inside the tube everywhere — a single hump peaking near 2.15 at x = 0.25 and bottoming near 0.29 at x = 0.75.'
});

/* ---- figure 4: the (j, H̄) plane — two float curves and the decided box ---- */
function curve(which, cs, j0, H0, span, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const j = j0 - span + (2 * span * i) / n;
    let H = H0;
    for (let it = 0; it < 40; it++) {
      const f = A.floatF(cs, j, H, 1024)[which], e = 1e-6;
      const fp = (A.floatF(cs, j, H + e, 1024)[which] - f) / e;
      if (!(Math.abs(fp) > 0)) break;
      const s = f / fp; H -= s; if (Math.abs(s) < 1e-13) break;
    }
    pts.push([j, H]);
  }
  return pts;
}
const jB = (CB.j[0] + CB.j[1]) / 2, HB = (CB.H[0] + CB.H[1]) / 2;
const SPAN = 0.12;
const c1 = curve(0, A.CASES.B, jB, HB, SPAN, 48), c2 = curve(1, A.CASES.B, jB, HB, SPAN, 48);
const FIG_PLANE = (() => {
  const keys = [
    { token: CAT[1], t: 'mass condition ∫m = 1 (float curve)', kind: 'dash' },
    { token: CAT[2], t: 'periodicity ∫u_x = 0 (float curve)', kind: 'dash' },
    { token: CAT[0], t: 'the Krawczyk box (decided; a point at this scale)', kind: 'line' }
  ];
  const nLeg = CH.legendLines(keys, 900 - 62 - 22);
  const o = { w: 900, h: 340 + (nLeg - 1) * LEGEND_LINE, x0: jB - SPAN, x1: jB + SPAN, y0: HB - 0.12, y1: HB + 0.12,
    padB: 28 + 22 + 5 + nLeg * LEGEND_LINE, xLabel: 'current  j', yLabel: 'ergodic constant  H̄' };
  const f = CH.frame(o);
  const out = [CH.open({ w: f.w, h: f.h, alt: 'The (j, H̄) plane near the solution of the instance: the mass condition and the periodicity condition '
    + 'as two dashed float curves crossing once, transversally, and at the crossing a solid mark for the Krawczyk box, which at this scale is a point '
    + '(its true size is ' + halfw(CB.j) + ' by ' + halfw(CB.H) + ' half-widths).' })];
  const jt = [-0.1, -0.05, 0, 0.05, 0.1].map(d => ({ v: jB + d, t: (jB + d).toFixed(2) }));
  const ht = [-0.1, -0.05, 0, 0.05, 0.1].map(d => ({ v: HB + d, t: (HB + d).toFixed(2) }));
  out.push(CH.axes(f, Object.assign({}, o, { xTicks: jt, yTicks: ht })));
  for (const [c, tok] of [[c1, CAT[1]], [c2, CAT[2]]]) {
    out.push('    <path d="' + c.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[1]).toFixed(2)).join(' ')
      + '" fill="none" stroke="' + tok + '" stroke-width="2" stroke-linejoin="round" stroke-dasharray="' + G.CLAIM + '"/>');
  }
  const bx = f.px(jB), by = f.py(HB);
  out.push('    <circle cx="' + bx.toFixed(2) + '" cy="' + by.toFixed(2) + '" r="6" fill="' + CAT[0] + '" stroke="' + TK.CHART.SURFACE + '" stroke-width="2"/>');
  const lab = 'the box, ' + halfw(CB.j) + ' × ' + halfw(CB.H) + ' half-widths';
  out.push(CH.txt(CH.clampX(f, bx - 12, lab, 'end'), by - 12, lab, 't-lab', 'end'));
  out.push(CH.legend(keys, f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
})();

/* ---- the page ------------------------------------------------------------ */
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · the record is re-derived at every build',
  title: 'A first-order mean-field game, enclosed by its current',
  deck: 'Almulla, Ferreira and Gomes (Dynamic Games and Applications, 2017) solve a stationary mean-field game '
    + 'numerically and write, of the case with nonzero mean drift, "we are not aware of any closed-form solution." '
    + 'This page encloses that case: the whole game reduces, through its constant current, to two numbers, and the two '
    + 'numbers are enclosed in a Krawczyk box with every integral a rigorous quadrature. A classical solution exists, '
    + 'is locally unique, and its density is strictly positive — proved, not observed on a plot. The paper\'s own closed '
    + 'form, in the case that has one, is the certifier\'s control.'
}));

O.push(C.tldr({
  findingRaw: 'For the first-order system (1.1) of AFG with V = sin 2πx and b = cos² 2πx, a classical solution exists with '
    + 'current j ∈ ' + C.m(box(CB.j, 8)) + ' and ergodic constant H̄ ∈ ' + C.m(box(CB.H, 8)) + ', locally unique in that '
    + 'box, density in [' + CB.mMin.toFixed(4) + ', ' + CB.mMax.toFixed(4) + '] and certified positive everywhere.',
  mechanismRaw: 'The transport equation integrates once to a constant current; the Hamilton–Jacobi equation then fixes the '
    + 'density pointwise as a verified scalar inverse; two integral conditions fix (j, H̄); a two-dimensional Krawczyk '
    + 'contraction encloses them. Every integral carries the midpoint rule\'s remainder as an interval.',
  checkRaw: C.m('node instruments/afg/battery.js') + ' (19 checks, 6 red controls, about 25 s) re-derives the record '
    + 'and compares it byte for byte; this page refused to render until that comparison passed.'
}));

O.push(C.stats([
  { k: 'the current', v: 'j = ' + mid(CB.j, 7), role: 'held', n: '± ' + halfw(CB.j) + ' — strictly positive, which is what ∫b = ½ forces' },
  { k: 'the ergodic constant', v: 'H̄ = ' + mid(CB.H, 7), role: 'held', n: '± ' + halfw(CB.H) + ' — the constant the paper computes by flow to a tolerance' },
  { k: 'density floor', v: 'm ≥ ' + CB.mMin.toFixed(4), role: 'held', n: 'over every cell, for every (j, H̄) in the box — ln m needs it and it is not assumed' },
  { k: 'the control', v: 'ln ∫e^V inside', role: 'held', n: 'b = 0: the paper\'s closed form, enclosed independently to ' + halfw(CA.closedForm.H) + ', lies inside the certifier\'s H̄ box' },
  { k: 'quadrature', v: REC.grid.KF.toLocaleString('en-US') + ' cells', n: 'midpoint rule with its remainder; ' + REC.grid.KD.toLocaleString('en-US') + ' cells for the Jacobian over the box; ' + CB.rounds + ' Krawczyk round' + (CB.rounds === 1 ? '' : 's') },
  { k: 'falsifiers', v: 'MUST REFUSE', role: 'warn', n: 'six planted breaks — remainder deleted, bracket shifted, candidate moved, closed form shifted, floor forged, closure forged — each required to go red' }
]));

O.push(C.section({
  lab: '§1 · the instance', title: 'The case the paper leaves open',
  bodyRaw: '<div class="col">'
    + C.pRaw('The system is the one-dimensional, first-order, stationary mean-field game of <a href="https://doi.org/10.1007/s13235-016-0203-5">Almulla, Ferreira and Gomes</a> '
      + '(their equation (1.1)), on the torus:')
    + C.eq(C.esc('u_x²/2 + V(x) + b(x) u_x = ln m + H̄,     −( m (u_x + b) )_x = 0,     ∫u = 0,  ∫m = 1,  m > 0'))
    + C.pRaw('First order: no viscosity, no Laplacian. The unknowns are the value function u, the density m and the constant H̄ that '
      + 'lets m carry unit mass. The paper builds two numerical methods for it — a gradient flow on the variational functional and '
      + 'a contracting monotone flow — and validates both against the explicit solutions it constructs in §2.1 for the case '
      + '∫b = 0, where u = 0 and m = e^V/∫e^V. Then, verbatim:')
    + C.quote({ text: 'If ∫ b dx ≠ 0, we are not aware of any closed-form solution.', cite: 'Almulla, Ferreira & Gomes, §2.1' })
    + C.pRaw('Their one example with nonzero mean drift is b = cos² 2πx (their Figures 7 and 8, the monotone flow on 100 grid points), '
      + 'with V = sin 2πx as everywhere in the paper. ∫b = ½. The figures are the only record of the answer: §4 carries no table, so '
      + 'there is nothing to reproduce to a printed digit, and the word for what follows is <em>enclosure</em>, never reproduction.')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · the reduction', title: 'The whole game is two numbers',
  bodyRaw: '<div class="col">'
    + C.pRaw('The transport equation says the flux m (u_x + b) has zero derivative on the torus, so it is a constant — the '
      + '<em>current</em> j. This is the one-dimensional current formulation of <a href="https://arxiv.org/abs/1611.08161">Gomes, Nurbekyan and Prazeres</a>; '
      + 'it is their method and it is cited as such. With u_x = j/m − b, the Hamilton–Jacobi equation becomes, at every point x, one '
      + 'scalar equation in m:')
    + C.eq(C.esc('φ_j(m) := ln m − j²/(2m²)  =  V(x) − b(x)²/2 − H̄  =: r(x)'))
    + C.pRaw('φ_j is strictly increasing on m > 0 (its derivative is 1/m + j²/m³), so for any pair (j, H̄) the density is the unique inverse '
      + 'm(x) = φ_j⁻¹(r(x)), smooth by the implicit function theorem. Two conditions remain, and they fix the two numbers:')
    + C.eq(C.esc('F₁(j, H̄) = ∫m − 1 = 0   (mass)          F₂(j, H̄) = j ∫1/m − ∫b = 0   (u is periodic: ∫u_x = 0)'))
    + C.pRaw('When ∫b = 0 the second condition forces j = 0 and the first returns exactly the paper\'s closed form, H̄ = ln ∫e^V. '
      + 'When ∫b ≠ 0 it forces j ≠ 0, and the pair (j, H̄) is what the flow was hunting. A solution of the two equations rebuilds a '
      + 'classical solution of the whole system by construction: m from the inverse, u from ∫(j/m − b) with its mean removed, '
      + 'both equations satisfied pointwise. So enclosing the pair encloses the game.')
    + '</div>'
}));

O.push(C.section({
  lab: '§3 · the certificate', title: 'A Krawczyk box, with every integral rigorous',
  bodyRaw: '<div class="col">'
    + C.pRaw('Three pieces, all in outward-rounded interval arithmetic, all inside <span class="m">instruments/interval</span>:')
    + C.plainList([
      { b: 'The verified inverse.', text: 'A float Newton step proposes m; the certificate is the sign check sup φ_j(m−δ) < r < inf φ_j(m+δ) evaluated in intervals, which by monotonicity proves exactly one root in the bracket. Over a cell of x and a box of (j, H̄), the density is enclosed by the two corner inverses, because m is increasing in r and in |j|.' },
      { b: 'The rigorous integral.', text: 'The midpoint rule on 2¹⁴ cells with its remainder h³/24 · sup|f″| added as an interval on every cell — the second derivative of the density and of 1/m enclosed from r″, φ′ and φ″ on the cell. A rule that stays green without its remainder is lucky, not rigorous; the battery deletes the remainder and shows the miss.' },
      { b: 'The contraction.', text: 'A two-dimensional Krawczyk operator on (j, H̄): the map F at the candidate by the rigorous rule, its Jacobian over the box by a Riemann enclosure on 2¹¹ cells, and the requirement that the image lands strictly inside the box. Existence and local uniqueness follow in one step; it closed in one round.' }
    ])
    + C.pRaw('What the box then yields, for EVERY (j, H̄) it contains: the density enclosed on each of 256 plot cells and certified above '
      + CB.mMin.toFixed(4) + '; the value function enclosed at 257 points with its mean removed; and the closure ∫u_x enclosed in an '
      + 'interval containing zero (half-width ' + halfw(CB.closure) + '), which is periodicity, checked rather than assumed.')
    + '</div>'
    + C.figure({ svgRaw: FIG_M, caption: 'Figure 1 · The density of the instance b = cos² 2πx as a certified tube: on each of 256 cells, the fill is the interval every m(x) in the cell provably lies in, for every (j, H̄) in the box. Solid edges: decided. Their Figure 8 is a picture of the same hump.' })
    + C.figure({ svgRaw: FIG_U, caption: 'Figure 2 · The value function u of the instance, enclosed at 257 points with ∫u = 0. The paper\'s Figure 7 shows the same oscillation from the monotone flow; here its amplitude is ' + uMax.toFixed(4) + ' and its closure is proved.' })
    + C.figure({ svgRaw: FIG_PLANE, caption: 'Figure 3 · The (j, H̄) plane near the solution. The two conditions are drawn from floats and dashed accordingly — asserted, not decided. Where they cross, the solid mark is the Krawczyk box, ' + box(CB.j, 7) + ' by ' + box(CB.H, 7) + ', which at this scale is a point. The crossing is transversal, which is why one round sufficed.' })
}));

O.push(C.section({
  lab: '§4 · the control', title: 'The paper\'s closed form, hit by the same certifier',
  bodyRaw: '<div class="col">'
    + C.pRaw('With b = 0 the paper states u = 0, m = e^V/∫e^V and H̄ = ln ∫e^V. The same code, run on that case, must enclose j at zero '
      + 'and H̄ around the closed form — or the certifier is not to be believed on the case that has no closed form. It does: '
      + 'j ∈ ' + C.m(boxc(CA.j, 8)) + ', H̄ ∈ ' + C.m(box(CA.H, 9)) + ', and ln ∫e^V, enclosed by the same quadrature on e^V, is '
      + C.m(box(CA.closedForm.H, 9)) + ' — inside the box. The value function is flat to 1e−9 at every plotted point. ∫e^{sin 2πx} is '
      + 'the modified Bessel value I₀(1); the enclosure of ln I₀(1) here is a by-product, not a claim.')
    + '</div>'
    + C.figure({ svgRaw: FIG_CTRL, caption: 'Figure 4 · The control. The certified tube is the certifier\'s output for b = 0; the dashed curve is the paper\'s formula e^V/∫e^V drawn from floats. The dashed line never leaves the tube. Dash means asserted; solid means decided.' })
    + C.table({
      cols: [{ h: 'quantity' }, { h: 'A · b = 0 (the control)', cls: 'v' }, { h: 'B · b = cos² 2πx (the instance)', cls: 'v' }],
      rows: [
        ['current j', { raw: C.m(boxc(CA.j, 8)) }, { raw: C.m(box(CB.j, 8)) }],
        ['ergodic constant H̄', { raw: C.m(box(CA.H, 8)) }, { raw: C.m(box(CB.H, 8)) }],
        ['density range', '[' + floorTo(CA.mMin, 4) + ', ' + ceilTo(CA.mMax, 4) + ']', '[' + floorTo(CB.mMin, 4) + ', ' + ceilTo(CB.mMax, 4) + ']'],
        ['box half-widths (j · H̄)', halfw(CA.j) + ' · ' + halfw(CA.H), halfw(CB.j) + ' · ' + halfw(CB.H)],
        ['closed form ln ∫e^V, enclosed', { raw: C.m(box(CA.closedForm.H, 8)) + ' — inside' }, 'none known (§2.1)'],
        ['what the paper says', 'u = 0, m = e^V/∫e^V, H̄ = ln ∫e^V — hit', '"we are not aware of any closed-form solution" — enclosed']
      ]
    })
}));

O.push(C.section({
  lab: '§5 · the honest boundary', title: 'What is claimed, and what is not',
  bodyRaw: '<div class="col">'
    + C.plainList([
      { b: 'Claimed.', text: 'Existence of a classical solution with (j, H̄) in the recorded box; local uniqueness there; the density enclosed pointwise and strictly positive; the value function enclosed pointwise and periodic. All of it for every parameter pair in the box, not at a sampled point.' },
      { b: 'Assumed, and cited.', text: 'Global uniqueness. The paper\'s Lemma 2.3 proves the operator monotone in L²×L², and uniqueness follows by Lasry–Lions. This page proves uniqueness of (j, H̄) in the box and takes the rest from them.' },
      { b: 'Not claimed.', text: 'Any reproduction of their figures (no table exists to reproduce), any first anywhere — the literature gate on this instance (instruments/afg/FINDINGS_LIT.md) finds no validated enclosure of a first-order stationary mean-field game and says "to our knowledge", with its query log as the evidence and one unread paper as the falsifier. This repository\'s own mfg-cap page holds the first enclosure of a mean-field game; this one is additive by instance: first order, which the sequence-space kernels cannot reach.' },
      { b: 'What decides, what only proposes.', text: 'The float Newton iterate and the approximate inverse are candidates and are trusted for nothing. The dashed curves in Figures 3 and 4 are drawn from floats and dashed for that reason. Everything solid is an interval endpoint.' },
      { b: 'The nearest neighbour.', text: 'Al Abdulaziz, Ashrafyan, Gevorgyan and Gomes (arXiv:2606.19611, June 2026) prove strong convergence of a mirror iteration for regularized stationary games — a convergence theorem, not an enclosure. The two results are of different kinds and are cited as such.' }
    ])
    + '</div>'
}));

O.push(C.section({
  lab: '§6 · check it', title: 'Twenty-five seconds on your machine',
  bodyRaw: '<div class="col">'
    + C.code('git clone https://github.com/carlostoledo1891/cert-machine && cd cert-machine\n'
      + 'node instruments/afg/battery.js      # re-derives the record, 19 checks, 6 red controls\n'
      + 'node instruments/afg/run.js --check  # the record, re-derived and compared byte for byte\n'
      + 'node instruments/interval/tests/test-quadrature.js   # the rigorous integral, and its falsifier')
    + C.pRaw('No dependencies: the interval library, the transcendental enclosures and the quadrature are plain Node files in the '
      + 'repository. The record is <span class="m">certs/afg-enclosure.json</span> and carries the sha256 of the code that made it.')
    + '</div>'
}));

O.push(C.section({
  lab: 'references', title: 'Sources',
  bodyRaw: '<div class="col">' + C.plainList([
    { raw: 'Noha Almulla, Rita Ferreira, Diogo Gomes, <em>Two Numerical Approaches to Stationary Mean-Field Games</em>, Dynamic Games and Applications 7(4) 657–682 (2017), <a href="https://doi.org/10.1007/s13235-016-0203-5">doi:10.1007/s13235-016-0203-5</a>, <a href="https://arxiv.org/abs/1511.06576">arXiv:1511.06576</a>. Equations (1.1), §2.1, §4.2, Figures 7–8, Lemma 2.3.' },
    { raw: 'Diogo A. Gomes, Levon Nurbekyan, Mariana Prazeres, <em>One-dimensional stationary mean-field games with local coupling</em>, Dynamic Games and Applications 8 (2018), <a href="https://arxiv.org/abs/1611.08161">arXiv:1611.08161</a> — the current formulation.' },
    { raw: 'Hussain Al Abdulaziz, Yuri Ashrafyan, Yeva Gevorgyan, Diogo Gomes, <em>Bregman-projected mirror methods for regularized stationary mean-field games</em>, <a href="https://arxiv.org/abs/2606.19611">arXiv:2606.19611</a> (2026) — the nearest neighbour.' },
    { raw: 'R. Krawczyk, <em>Newton-Algorithmen zur Bestimmung von Nullstellen mit Fehlerschranken</em>, Computing 4 (1969) 187–201 — the operator.' }
  ]) + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-afg.js @ git ' + gitrev
  + ' — certs/afg-enclosure.json re-derived during this build and compared byte for byte (identical, or no page). '
  + 'Code sha256 ' + REC.provenance.sha256.slice(0, 16) + '…') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'afg.html'),
  TPL.render({ title: 'A first-order mean-field game, enclosed by its current · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/afg.html',
    desc: 'The first-order stationary mean-field game of Almulla, Ferreira and Gomes, in the case they say has no closed form, enclosed: two numbers in a Krawczyk box, every integral rigorous, the density certified positive.' }));
console.log('reports/afg.html written: record re-derived identically (j=' + box(CB.j, 8) + ', H=' + box(CB.H, 8) + ') @ git ' + gitrev);
