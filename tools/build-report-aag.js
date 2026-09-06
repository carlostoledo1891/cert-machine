#!/usr/bin/env node
/* build-report-aag.js — generate reports/aag.html: the empty region, painted
   by standing. The record certs/aag-empty-region.json is re-derived during
   the build and the page refuses on a byte.

   usage: node tools/build-report-aag.js */
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
const die = (m) => { console.error('AAG REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

try { cp.execSync('node instruments/aag/run.js --check', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { die('the live re-derivation differs from certs/aag-empty-region.json:\n' + (e.stderr || e.stdout || e.message)); }
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'aag-empty-region.json'), 'utf8'));
if (REC.verdict !== 'VERIFIED' || REC.certificate.verdict !== 'PROVED') die('record is not VERIFIED/PROVED');
const K = REC.options.K, c1 = REC.case1, c2 = REC.case2;
if (!(c1.refusedOK && c1.rootsOK && c1.weak.ok && c2.mMin > 0)) die('a certificate condition is false in the record');

const { CAT, CTX, SURFACE } = TK.CHART;
const xTicks = [0, 1 / 12, 0.25, 5 / 12, 0.5, 0.75, 1].map(v => ({ v, t: v === 1 / 12 ? '1/12' : v === 5 / 12 ? '5/12' : v === 0.75 ? '3/4' : String(v) }));
const fi = (iv, d) => '[' + iv[0].toFixed(d) + ', ' + iv[1].toFixed(d) + ']';

/* ---- figure 1: the painted domain (case 1) ------------------------------ */
const FIG_PAINT = (() => {
  const o = { w: 900, h: 340, x0: 0, x1: 1, y0: -0.05, y1: 0.55, padB: 28 + 22 + 5 + 2 * 19, xLabel: 'x on (0, 1)', yLabel: 'density m = V₊' };
  const f = CH.frame(o);
  const out = [CH.open({ w: f.w, h: f.h, alt: 'The density of case 1 over the unit interval: two solid humps on the occupied runs (0, 1/12) and (5/12, 3/4), '
    + 'nothing drawn but the zero line on the empty runs (1/12, 5/12) and (3/4, 1), and three narrow hatched bands at 1/12, 5/12 and 3/4 where the cells are refused.' })];
  out.push(CH.HATCH_DEF);
  out.push(CH.axes(f, Object.assign({}, o, { xTicks, yTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5].map(v => ({ v, t: String(v) })) })));
  /* refused bands */
  for (const r of c1.runs) {
    if (r.standing !== 'REFUSED') continue;
    const x0 = f.px(r.x0), x1 = f.px(r.x1);
    out.push('    <rect x="' + x0.toFixed(1) + '" y="' + f.T + '" width="' + Math.max(3, x1 - x0).toFixed(1) + '" height="' + f.ph + '" fill="url(#cmHatch)" stroke="' + CTX + '" stroke-width="1"/>');
  }
  /* the empty runs: the decided zero line */
  for (const r of c1.runs) {
    if (r.standing !== 'EMPTY') continue;
    out.push('    <line x1="' + f.px(r.x0).toFixed(1) + '" y1="' + f.py(0).toFixed(1) + '" x2="' + f.px(r.x1).toFixed(1) + '" y2="' + f.py(0).toFixed(1) + '" stroke="' + CAT[0] + '" stroke-width="3"/>');
  }
  /* the occupied runs: the tube */
  const occ = c1.mTube.filter(p => p[3] === 'OCCUPIED');
  const groups = [];
  for (const p of occ) { const g = groups[groups.length - 1]; if (g && Math.abs(g[g.length - 1][0] + 1 / K - p[0]) < 1e-12) g.push(p); else groups.push([p]); }
  for (const g of groups) {
    const pts = g.map(p => [p[0] + 0.5 / K, p[1], p[2]]);
    const up = pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[2]).toFixed(2)).join(' ');
    const dn = pts.slice().reverse().map(p => 'L' + f.px(p[0]).toFixed(2) + ' ' + f.py(p[1]).toFixed(2)).join(' ');
    out.push('    <path d="' + up + ' ' + dn + ' Z" fill="' + CAT[0] + '" opacity="0.14"/>');
    for (const idx of [1, 2]) out.push('    <path d="' + pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[idx]).toFixed(2)).join(' ') + '" fill="none" stroke="' + CAT[0] + '" stroke-width="2" stroke-linejoin="round"/>');
  }
  for (const p of c1.mTube) {
    out.push('    <rect ' + CH.hit('x="' + f.px(p[0]).toFixed(1) + '" y="' + f.T + '" width="' + (f.px(p[0] + 1 / K) - f.px(p[0])).toFixed(1) + '" height="' + f.ph + '" fill="transparent" data-cmx="' + f.px(p[0]).toFixed(1) + '"',
      'x ∈ [' + p[0].toFixed(4) + ', ' + (p[0] + 1 / K).toFixed(4) + ')', p[3] + (p[3] === 'EMPTY' ? ' · m = 0 exactly' : p[3] === 'OCCUPIED' ? ' · m ∈ [' + p[1].toFixed(4) + ', ' + p[2].toFixed(4) + ']' : ' · the cell holds a root of V')) + '/>');
  }
  out.push('    <line class="cm-cross" x1="0" y1="' + f.T + '" x2="0" y2="' + (f.T + f.ph) + '" stroke="' + TK.CHART.AXIS + '" stroke-width="1" style="opacity:0"/>');
  out.push(CH.legend([
    { token: CAT[0], t: 'OCCUPIED: m = V enclosed on the cell (decided)', kind: 'line' },
    { token: CAT[0], t: 'EMPTY: m = 0 exactly (decided) — the zero line', kind: 'line' },
    { token: CTX, t: 'REFUSED: the cell holds a root of V at this budget', kind: 'hatch' }
  ], f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
})();

/* ---- figure 2: the budget ladder ------------------------------------------ */
const FIG_LADDER = CH.segments({
  w: 900, x0: 0, x1: 1, rowH: 40,
  rows: REC.ladder.map(l => ({ k: 'K = ' + l.K + ' · ' + (l.refusedLength < 0.01 ? l.refusedLength.toExponential(1) : String(l.refusedLength)),
    segs: l.runs.map(r => ({ x0: r.x0, x1: r.x1, token: r.standing === 'OCCUPIED' ? CAT[0] : r.standing === 'EMPTY' ? 'var(--c-grid)' : CTX, hatch: r.standing === 'REFUSED', k: r.standing, v: '[' + r.x0.toFixed(4) + ', ' + r.x1.toFixed(4) + ']' })) })),
  xTicks,
  xLabel: 'x on (0, 1) — the refused length is 4/K at every budget; the roots never move',
  keys: [{ token: CAT[0], t: 'OCCUPIED (decided)', kind: 'line' }, { token: 'var(--c-grid)', t: 'EMPTY (decided)', kind: 'line' }, { token: CTX, t: 'REFUSED (a root inside)', kind: 'hatch' }],
  alt: 'Four strips, one per budget K = 16, 64, 256, 1024, each showing the unit interval painted occupied, empty or refused; the refused bands at 1/12, 5/12 and 3/4 shrink from a quarter of the interval at K = 16 to four thousandths at K = 1024 while the occupied and empty runs keep their edges.'
});

/* ---- figure 3: the two value functions ------------------------------------ */
const FIG_U = (() => {
  const keysU = [{ token: CAT[0], t: 'u₊ and u₋: each one member of the solution set (CHOSEN) — the fill is its enclosure', kind: 'dash' }, { token: 'var(--c-grid)', t: 'the empty region, where u is not unique', kind: 'line' }];
  const nLegU = CH.legendLines(keysU, 900 - 62 - 22);
  const o = { w: 900, h: 300 + nLegU * 19, x0: 0, x1: 1, y0: -0.55, y1: 0.55, padB: 28 + 22 + 5 + nLegU * 19, xLabel: 'x on (0, 1)', yLabel: 'value function u  (u(1) = 0)' };
  const f = CH.frame(o);
  const out = [CH.open({ w: f.w, h: f.h, alt: 'Two dotted curves, mirror images about zero: u plus descends from about 0.46 at x = 0 to 0 at x = 1 in two steps, flat on the occupied runs and falling on the empty ones; u minus is its negative. Each is a thin enclosed tube.' })];
  out.push(CH.axes(f, Object.assign({}, o, { xTicks, yTicks: [-0.5, -0.25, 0, 0.25, 0.5].map(v => ({ v, t: String(v) })) })));
  for (const r of c1.runs) if (r.standing === 'EMPTY') out.push('    <rect x="' + f.px(r.x0).toFixed(1) + '" y="' + f.T + '" width="' + (f.px(r.x1) - f.px(r.x0)).toFixed(1) + '" height="' + f.ph + '" fill="var(--c-grid)"/>');
  for (const [tube, name] of [[c1.uPlus, 'u₊'], [c1.uMinus, 'u₋']]) {
    const up = tube.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[2]).toFixed(2)).join(' ');
    const dn = tube.slice().reverse().map(p => 'L' + f.px(p[0]).toFixed(2) + ' ' + f.py(p[1]).toFixed(2)).join(' ');
    out.push('    <path d="' + up + ' ' + dn + ' Z" fill="' + CAT[0] + '" opacity="0.14"/>');
    out.push('    <path d="' + tube.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py((p[1] + p[2]) / 2).toFixed(2)).join(' ') + '" fill="none" stroke="' + CAT[0] + '" stroke-width="2" stroke-linecap="round" stroke-dasharray="' + G.PICK + '"/>');
    const last = tube[Math.floor(tube.length * 0.05)];
    out.push(CH.txt(f.px(last[0]) + 8, f.py((last[1] + last[2]) / 2) - 8, name, 't-lab', 'start'));
  }
  out.push(CH.legend(keysU, f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
})();

/* ---- figure 4: case 2 over the γ box --------------------------------------- */
const FIG_C2 = (() => {
  const o = { w: 900, h: 300, x0: 0, x1: 1, y0: 0, y1: 0.3, padB: 28 + 22 + 5 + 19, xLabel: 'x on (0, 1)', yLabel: 'density m, every γ ∈ [' + c2.gamma + ']' };
  const f = CH.frame(o);
  const pts = c2.mTube.map(p => [p[0] + 0.5 / K, p[1], p[2]]);
  const out = [CH.open({ w: f.w, h: f.h, alt: 'The density of case 2 as a wide band over the unit interval, between about 0.07 and 0.27, a single hump near x = 0.55; the band is wide because it holds every γ in the box; a floor line at the certified minimum.' })];
  out.push(CH.axes(f, Object.assign({}, o, { xTicks, yTicks: [0, 0.1, 0.2, 0.3].map(v => ({ v, t: String(v) })) })));
  const up = pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[2]).toFixed(2)).join(' ');
  const dn = pts.slice().reverse().map(p => 'L' + f.px(p[0]).toFixed(2) + ' ' + f.py(p[1]).toFixed(2)).join(' ');
  out.push('    <path d="' + up + ' ' + dn + ' Z" fill="' + CAT[0] + '" opacity="0.14"/>');
  for (const idx of [1, 2]) out.push('    <path d="' + pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[idx]).toFixed(2)).join(' ') + '" fill="none" stroke="' + CAT[0] + '" stroke-width="2" stroke-linejoin="round"/>');
  const yf = f.py(c2.mMin);
  out.push('    <line x1="' + f.L + '" y1="' + yf.toFixed(1) + '" x2="' + (f.L + f.pw) + '" y2="' + yf.toFixed(1) + '" stroke="' + CAT[2] + '" stroke-width="1"/>');
  out.push(CH.txt(f.L + 6, yf - 6, 'certified floor m ≥ ' + c2.mMin.toFixed(4), 't-note', 'start'));
  out.push(CH.legend([{ token: CAT[0], t: 'm over the cell AND over the γ box (decided)', kind: 'line' }, { token: CAT[2], t: 'the density floor, every x and every γ', kind: 'line' }], f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
})();

/* ---- the boundary table ---- */
const b1 = c1.boundary, b2 = c2.boundary;
const brow = (name, v1, s1, v2, s2) => [name, { raw: v1 }, s1, { raw: v2 }, s2];
const BT = C.table({
  cols: [{ h: 'condition of (3.6)' }, { h: 'case 1 (j₀ = 0)', cls: 'v' }, { h: 'standing' }, { h: 'case 2 (j₀ = 1/10)', cls: 'v' }, { h: 'standing' }],
  rows: [
    brow('inflow at x = 0: −m(0) u_x(0) = j₀', C.m('0 = 0') + ', m(0) ∈ ' + C.m(fi(b1.m0, 4)), 'decided', C.m(fi(b2.inflow.value, 3)) + ' identically', 'exact by the current'),
    brow('relaxed exit at x = 1: u(1) ≤ ψ = 0', C.m('u(1) = 0'), 'contact', C.m('u(1) = 0'), 'contact'),
    brow('no entry at x = 1: m(1) u_x(1) ≤ 0', C.m('m(1) = 0') + ' since V(1) ∈ ' + C.m(fi(b1.V1, 3)), 'decided: flux 0', C.m('−j₀ = ' + fi(b2.noEntry.flux, 2)), 'decided: flux < 0'),
    brow('contact product (ψ − u(1)) · m(1) u_x(1) = 0', C.m('0 · 0'), 'holds — no exit', C.m('0 · (−j₀)'), 'holds — exit')
  ]
});

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · the record is re-derived at every build',
  title: 'The empty region, painted by standing',
  deck: 'A first-order mean-field game on an interval with an entry at one end and an exit at the other, from Alharbi, Ashrafyan and '
    + 'Gomes (Applied Mathematics & Optimization, 2026). Where the potential is negative the density vanishes: an empty region, and '
    + 'inside it the value function is not unique. This page takes the paper\'s own explicit solutions and decides them cell by cell: '
    + 'occupied, empty, or refused where the cell holds the free boundary at the budget chosen. The refused cells are drawn as refused. '
    + 'The two value functions are drawn as two members of a set. And the sentence from the paper\'s abstract, that contact with the '
    + 'exit does not imply exit, is evaluated as an interval, twice.'
}));

O.push(C.tldr({
  findingRaw: 'On ' + K + ' cells, the density of case 1 is decided zero on the runs ' + c1.runs.filter(r => r.standing === 'EMPTY').map(r => '(' + r.x0.toFixed(3) + ', ' + r.x1.toFixed(3) + ')').join(' and ')
    + ', decided positive and enclosed on the two occupied runs, and refused on ' + c1.refused + ' cells that hold the exact roots 1/12, 5/12 and 3/4. '
    + 'The refused length is 4/K at every budget from 16 to 1024. Both value functions are enclosed; they differ by ' + (c1.uPlus[0][1] * 2).toFixed(2) + ' at x = 0 and meet at x = 1. '
    + 'x = 1 is in the contact set with exit flux exactly zero in case 1 and exactly −j₀ in case 2.',
  mechanismRaw: 'An interval enclosure of the sine on each cell decides the sign of V; the density is V on the positive cells and zero on the '
    + 'negative ones; a cell whose enclosure straddles zero is refused, and a refused cell must contain a root. The value functions are Riemann '
    + 'brackets from the exit. Case 2 inverts the paper\'s cubic on every cell for every γ in a box, because the paper prints no γ.',
  checkRaw: C.m('node instruments/aag/battery.js') + ' (18 checks, 5 red controls, under a second) re-derives the record and compares it byte for byte.'
}));

O.push(C.stats([
  { k: 'refused cells', v: c1.refused + ' of ' + K, role: 'warn', n: 'length ' + c1.refusedLength + ' — each holds one of the three exact roots; at K = 1024 the length is ' + REC.ladder[3].refusedLength },
  { k: 'the empty region', v: '{V < 0}', role: 'held', n: 'm = 0 exactly on ' + c1.runs.filter(r => r.standing === 'EMPTY').length + ' runs, m = V enclosed on ' + c1.runs.filter(r => r.standing === 'OCCUPIED').length + ' runs' },
  { k: 'two value functions', v: 'u₊ ≠ u₋', role: 'held', n: 'u₊(0) ∈ ' + fi(c1.uPlus[0].slice(1), 3) + ', u₋(0) its negative; Theorem 1.3 gives uniqueness of Du only where m > 0' },
  { k: 'contact without exit', v: 'flux 0', role: 'held', n: 'case 1: u(1) = ψ and m(1) = 0, so nobody leaves through the exit they touch' },
  { k: 'case 2 floor', v: 'm ≥ ' + c2.mMin.toFixed(3), role: 'held', n: 'for every γ ∈ [' + c2.gamma + '] and every x — a positive current keeps the density positive, as the paper says' },
  { k: 'falsifiers', v: 'MUST REFUSE', role: 'warn', n: 'the float sign rule paints the root cells; a deleted root; a raised exit cost; a shifted cubic bracket; a zero current' }
]));

O.push(C.section({
  lab: '§1 · the instance', title: 'An entry, an exit, and a place nobody stands',
  bodyRaw: '<div class="col">'
    + C.pRaw('<a href="https://arxiv.org/abs/2305.15952">Alharbi, Ashrafyan and Gomes</a> study first-order stationary mean-field games on bounded domains where part of the boundary is an entry, with a prescribed inflow, and part is an exit, with a cost and a relaxed Dirichlet condition: agents may leave, and pay, but nothing forces them to. Their one-dimensional example (§3.2) on (0, 1) is')
    + C.eq(C.esc('½ u_x² + V(x) = m,     −(m u_x)_x = 0,     −m(0) u_x(0) = j₀,     u(1) ≤ 0,     u(1) m(1) u_x(1) = 0'))
    + C.pRaw('with V(x) = γ + ½ sin(3π(x + ¼)). With no inflow (j₀ = 0) the current vanishes and at every point either the velocity is zero or the density is: the solution they exhibit is m = V₊, zero wherever V is negative, with the value function u(x) = ±√2 ∫ₓ¹ √(V₋) — two of them. With inflow j₀ = 1/10 the current is −j₀ everywhere, the density is the positive root of a cubic, and it is positive everywhere whatever V does.')
    + C.quote({ text: 'However, as our examples show, contact does not necessarily imply that exit occurs.', cite: 'Alharbi, Ashrafyan & Gomes, abstract' })
    + C.pRaw('Their figures are made with a finite-difference discretisation of the variational problem and Mathematica\'s FindMinimum, and carry no error bound. γ for the second figure is read from the plot; it is not in the text.')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · the vanishing set', title: 'Decided where it can be, refused where it cannot',
  bodyRaw: '<div class="col">'
    + C.pRaw('The domain is cut into K cells. On each, an interval enclosure of the sine gives an enclosure of V. If it lies above zero the cell is OCCUPIED and the density is V, enclosed; below zero the cell is EMPTY and the density is exactly zero; straddling zero, the cell is REFUSED: at this budget the arithmetic cannot say. The three roots of V are exact, x = 1/12, 5/12 and 3/4, and the certificate requires every refused cell to contain one and every root to lie in a refused cell. The root 3/4 sits on a cell edge at every power-of-two budget and takes two cells; so the refused count is four at every K and the refused length is 4/K.')
    + C.pRaw('The mathematics of a topologically correct sign map from interval arithmetic is thirty years old: Plantinga and Vegter refine until every cell is decided and then draw a clean curve. What is drawn here is the other thing, and it is the point: the cells the budget could not decide, drawn as what they are.')
    + '</div>'
    + C.figure({ svgRaw: FIG_PAINT, caption: 'Figure 1 · Case 1 on ' + K + ' cells. The occupied runs carry the density tube m = V; the empty runs carry the decided zero line; the hatched bands are the refused cells at the three roots. The free boundary is not located by this figure; it is exact, and the hatch is the width of the budget.' })
    + C.figure({ svgRaw: FIG_LADDER, caption: 'Figure 2 · The budget ladder. The same interval painted at K = 16, 64, 256 and 1024. The refused length is 4/K each time and the decided runs keep their edges to within a cell.' })
}));

O.push(C.section({
  lab: '§3 · the value function', title: 'Two solutions, both enclosed, neither chosen for you',
  bodyRaw: '<div class="col">'
    + C.pRaw('Where the density vanishes the Hamilton–Jacobi equation only bounds the velocity, ½u_x² ≤ −V, and the paper\'s Theorem 1.3 proves the gradient of u unique only on the support of m. So there are two value functions, u₊ and u₋, and picking one is a choice the data does not make. In this machine\'s grammar that is the CHOSEN standing, drawn dotted. Both are enclosed here by a Riemann bracket from the exit, which is rigorous and about 1/K wide, wider than the density\'s tube and said so. They differ at x = 0 by ' + (c1.uPlus[0][1] * 2).toFixed(3) + ' and meet at x = 1, where both are zero.')
    + '</div>'
    + C.figure({ svgRaw: FIG_U, caption: 'Figure 3 · The two value functions of case 1, each dotted because it is one member of the solution set, each with its enclosure as fill. On the occupied runs u is flat (u_x = 0); on the empty runs, shaded, the two branches move apart.' })
}));

O.push(C.section({
  lab: '§4 · the boundary', title: 'Contact without exit, and contact with it',
  bodyRaw: '<div class="col">'
    + C.pRaw('The mixed boundary conditions are four relations, and each is evaluated as an interval from the enclosed solution. In case 1, V(1) < 0 so m(1) = 0: the point x = 1 is in the contact set, u(1) = ψ, and the exit flux is exactly zero. Nobody leaves through the exit they touch. In case 2 the current is −j₀ at every point by the transport equation, so the same contact carries exit flux −j₀: everybody leaves. The paper\'s sentence is a theorem about these two cases, and here it is a table.')
    + '</div>' + BT
}));

O.push(C.section({
  lab: '§5 · case 2', title: 'A positive current keeps the density positive, for every γ in a box',
  bodyRaw: '<div class="col">'
    + C.pRaw('With inflow the density is the unique positive root of m³ − V m² − j₀²/2 = 0 at every x. The root is enclosed on each cell by a verified bracket (the cubic is increasing past 2V/3, and the positive root lies there), and because the root is increasing in V and V in γ, the two corners of a cell-and-γ box enclose every root inside it. The paper does not print γ; its Figure 2 shows a line near −0.4. So case 2 is certified for every γ in [' + c2.gamma + '] at once, and the band in the figure is wide because it holds them all.')
    + '</div>'
    + C.figure({ svgRaw: FIG_C2, caption: 'Figure 4 · Case 2, j₀ = 1/10: the density enclosed over every cell and every γ in the box, with its certified floor. The band is the price of not knowing γ, and it is paid in the open.' })
}));

O.push(C.section({
  lab: '§6 · the honest boundary', title: 'What is claimed, and what is not',
  bodyRaw: '<div class="col">' + C.plainList([
    { b: 'Claimed.', text: 'The paper\'s explicit solutions satisfy its weak-solution conditions (Definition 2.11) and its boundary conditions (3.6) cell by cell, in intervals; the vanishing set is exactly {V < 0} with the three roots exact; the two value functions are enclosed and distinct; case 2 is positive for every γ in the box.' },
    { b: 'Not claimed.', text: 'That the free boundary was found — it is exact, and the refusal is a display of budget. That anything was reproduced to a printed digit — the figures carry none and γ is unprinted. That a certified contour is new mathematics — it is not (Plantinga–Vegter 2004); the display of the undecided cells is the contribution, as the target memory ruled before this page was built.' },
    { b: 'The width you see.', text: 'The value functions are Riemann brackets, first order in the cell width, because √(V₋) has no bounded second derivative at a root. The density\'s tube is the sine enclosure itself. The two widths are different and are drawn as they are.' }
  ]) + '</div>'
}));

O.push(C.section({
  lab: '§7 · check it', title: 'Under a second on your machine',
  bodyRaw: '<div class="col">'
    + C.code('node instruments/aag/battery.js     # re-derives the record, 18 checks, 5 red controls\nnode instruments/aag/run.js --check  # the record, re-derived and compared byte for byte')
    + C.pRaw('The record is <span class="m">certs/aag-empty-region.json</span>; it carries the sha256 of the code that made it, every cell\'s standing, both value-function tubes and the ladder.')
    + '</div>'
}));

O.push(C.section({
  lab: 'references', title: 'Sources',
  bodyRaw: '<div class="col">' + C.plainList([
    { raw: 'AbdulRahman M. Alharbi, Yuri Ashrafyan, Diogo Gomes, <em>A First-Order Mean-Field Game on a Bounded Domain with Mixed Boundary Conditions</em>, Applied Mathematics & Optimization 93, Art. 40 (2026); <a href="https://arxiv.org/abs/2305.15952">arXiv:2305.15952v4</a> — §3.2 Cases 1 and 2, (3.5)–(3.6), Definition 2.11, Theorem 1.3, Figures 1–2.' },
    { raw: 'S. Plantinga, G. Vegter, <em>Isotopic approximation of implicit curves and surfaces</em>, SGP 2004 — the certified sign map, refined until decided; cited as the method this page deliberately stops short of.' },
    { raw: 'The grammar: playground/warrant.js and design/grammar.js on this site — DECIDED, COMPUTED, CHOSEN, REFUSED, as stroke.' }
  ]) + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-aag.js @ git ' + gitrev
  + ' — certs/aag-empty-region.json re-derived during this build and compared byte for byte (identical, or no page). Code sha256 ' + REC.provenance.sha256.slice(0, 16) + '…') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'aag.html'),
  TPL.render({ title: 'The empty region, painted by standing · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/aag.html',
    desc: 'A first-order mean-field game with an entry and an exit, its empty region decided cell by cell and refused where the budget cannot decide, its two value functions enclosed, and contact without exit evaluated as an interval.' }));
console.log('reports/aag.html written: record re-derived identically (' + c1.refused + ' refused cells of ' + K + ') @ git ' + gitrev);
