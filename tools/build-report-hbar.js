#!/usr/bin/env node
/* build-report-hbar.js — generate reports/hbar.html: the effective Hamiltonian band.
   certs/hbar-band.json is re-derived during the build and compared byte for byte.
   usage: node tools/build-report-hbar.js */
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
const die = (m) => { console.error('HBAR REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

try { cp.execSync('node instruments/hbar/run.js --check', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { die('the live re-derivation differs from certs/hbar-band.json:\n' + (e.stderr || e.stdout || e.message)); }
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'hbar-band.json'), 'utf8'));
if (!Object.values(REC.p0).every(p => p.contains4overPi)) die('a P₀ enclosure misses 4/π');
if (REC.counts.refused) die('a refused point on the band');
const { CAT, CTX } = TK.CHART;
const e1 = (v) => v.toExponential(1), f6 = (v) => v.toFixed(6), f9 = (v) => v.toFixed(9);
const mid = (X) => 0.5 * (X[0] + X[1]);
const P0 = REC.p0.sin.value;
const decided = REC.band.filter(b => b.regime !== 'UNDECIDED');
const rot = REC.band.filter(b => b.regime === 'ROTATING');
const und = REC.band.find(b => b.regime === 'UNDECIDED');

/* ---- figure 1: the band ---- */
function bandFig() {
  const keys = [
    { token: CAT[0], t: 'H̄(P): FLAT, exactly 1 (decided) · ROTATING, a bracket narrower than the stroke (decided)', kind: 'line' },
    { token: CTX, t: 'P₀ = 4/π, enclosed; the one sampled P inside the enclosure is UNDECIDED', kind: 'dash' }
  ];
  const nLeg = CH.legendLines(keys, 900 - 62 - 22);
  const o = { w: 900, h: 320 + nLeg * 19, x0: 0, x1: 3.05, y0: 0.9, y1: 3.3, padB: 28 + 22 + 5 + nLeg * 19, xLabel: 'P', yLabel: 'H̄(P), V = sin 2πx' };
  const f = CH.frame(o);
  const out = [CH.open({ w: f.w, h: f.h, alt: 'The effective Hamiltonian against P: flat at one up to P₀ near 1.27, then rising convexly to about 3.2 at P = 3; a dashed vertical rule marks P₀.' })];
  out.push(CH.axes(f, Object.assign({}, o, { xTicks: [0, 0.5, 1, 4 / Math.PI, 1.5, 2, 2.5, 3].map(v => ({ v, t: v === 4 / Math.PI ? '4/π' : String(v) })), yTicks: [1, 1.5, 2, 2.5, 3].map(v => ({ v, t: String(v) })) })));
  const xp = f.px(4 / Math.PI);
  out.push('    <line x1="' + xp.toFixed(1) + '" y1="' + f.T + '" x2="' + xp.toFixed(1) + '" y2="' + (f.T + f.ph) + '" stroke="' + CTX + '" stroke-width="1" stroke-dasharray="' + G.GUIDE + '"/>');
  const pts = decided.map(b => [b.P, mid(b.value)]);
  out.push('    <path d="' + pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(1) + ' ' + f.py(p[1]).toFixed(1)).join(' ') + '" fill="none" stroke="' + CAT[0] + '" stroke-width="2" stroke-linejoin="round"/>');
  for (const b of decided) out.push('    <circle ' + CH.hit('cx="' + f.px(b.P).toFixed(1) + '" cy="' + f.py(mid(b.value)).toFixed(1) + '" r="3.5" fill="' + CAT[0] + '"', 'P = ' + b.P.toFixed(4) + ' · ' + b.regime, b.regime === 'FLAT' ? 'H̄ = 1 exactly · Mather measure: ' + b.mather : 'H̄ ∈ [' + f9(b.value[0]) + ', ' + f9(b.value[1]) + '] · width ' + e1(b.width)) + '/>');
  out.push('    <circle cx="' + xp.toFixed(1) + '" cy="' + f.py(1).toFixed(1) + '" r="5" fill="none" stroke="' + CTX + '" stroke-width="2"/>');
  out.push(CH.txt(xp + 8, f.py(1) - 10, 'UNDECIDED at P = 4/π', 't-note', 'start'));
  out.push(CH.legend(keys, f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
}
/* ---- figure 2: the width of the bracket toward the degeneracy ---- */
const FIG_WIDTH = CH.lines({
  w: 900, h: 280, x0: 1.25, x1: 3.05, y0: -7, y1: -4.5, yTicks: [-7, -6, -5].map(v => ({ v, t: '1e' + v })), xTicks: [4 / Math.PI, 1.5, 2, 2.5, 3].map(v => ({ v, t: v === 4 / Math.PI ? '4/π' : String(v) })), xLabel: 'P', yLabel: 'bracket width, log', hover: false,
  vmarks: [{ x: 4 / Math.PI, t: 'P₀', dashed: true }],
  series: [{ name: 'the width of the decided bracket on H̄(P), V = sin 2πx, ' + REC.K.sweep + ' cells', pts: rot.map(b => [b.P, Math.log10(b.width)]) }],
  alt: 'The bracket width on a logarithmic scale: between 1e−6 and 2e−6 across the whole rotating part.'
});
/* ---- figure 3: the Mather density ---- */
const FIG_M = CH.lines({
  w: 900, h: 300, x0: 0, x1: 1, y0: 0, y1: 2.2, yTicks: [0, 0.5, 1, 1.5, 2].map(v => ({ v, t: String(v) })), xTicks: [0, 0.25, 0.5, 0.75, 1].map(v => ({ v, t: String(v) })), xLabel: 'x', yLabel: 'projected Mather density', hover: false,
  series: REC.mather.filter(m => !m.refused).map(m => ({ name: 'P = ' + m.P + ': m = 1/(T(c)√(2(c − sin 2πx))), T ∈ [' + m.T.map(v => v.toFixed(6)).join(', ') + '] (decided)', pts: m.xs.map((x, j) => [x, mid(m.density[j])]) })),
  alt: 'Two density profiles over the torus peaking at x = 0.25 where the potential is highest and the orbit slowest; the lower-P one peaks higher.'
});

/* ---- tables ---- */
const T_BAND = C.table({
  cols: [{ h: 'P' }, { h: 'regime' }, { h: 'H̄(P)', cls: 'v' }, { h: 'width', cls: 'v' }, { h: 'Mather measure' }],
  rows: REC.band.map(b => [b.P === 4 / Math.PI ? '4/π' : String(b.P), { raw: C.tag(b.regime) }, b.value ? { raw: C.m(b.regime === 'FLAT' ? '1' : '[' + f9(b.value[0]) + ', ' + f9(b.value[1]) + ']') } : 'inside the P₀ enclosure', b.width === null ? '—' : b.regime === 'FLAT' ? '0 (exact)' : e1(b.width), b.mather || '—'])
});
const T1 = C.table({
  cols: [{ h: 'k' }, { h: 'HRF (printed)', cls: 'v' }, { h: 'against the enclosure' }, { h: 'Newton (printed)', cls: 'v' }, { h: 'against the enclosure' }],
  rows: REC.printed.table1.k.map((k, i) => [String(k), REC.table1.HRF[i].v.toFixed(5), { raw: C.tag(REC.table1.HRF[i].place) }, REC.table1.NM[i].v.toFixed(5), { raw: C.tag(REC.table1.NM[i].place) }])
});
const T2 = C.table({
  cols: [{ h: 'N' }, { h: 'H̄◇ (printed, k = 100)', cls: 'v' }, { h: 'exact H̄(0.5)', cls: 'v' }, { h: 'gap', cls: 'v' }],
  rows: REC.printed.table2.N.map((N, i) => [String(N), REC.table2.Hdiamond[i].v.toFixed(6), '1 (FLAT, decided)', REC.table2.Hdiamond[i].gap.toFixed(6)])
});

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · the classical formula, enclosed; re-derived at every build',
  title: 'The effective Hamiltonian band',
  deck: 'The cell problem H(x, P + u′) = H̄(P) has one number in it, and it is the number everyone computes: the effective Hamiltonian '
    + 'of homogenization, the Mañé critical value, the eigenvalue of weak KAM. Gomes and Yang compute it with a Hessian Riemannian flow '
    + 'and a Newton method, alongside the Mather measure, and test against the one case with a formula: one dimension, a mechanical '
    + 'Hamiltonian, where H̄ is flat up to a threshold and beyond it the inverse of an integral. This page encloses that formula. The flat '
    + 'part is decided exactly; the rising part is bracketed by bisection on a rigorously enclosed integral, closed by the mean value theorem; the threshold is enclosed and '
    + 'the one point inside its enclosure is left undecided, because that is where the problem degenerates and the integrand\'s second '
    + 'derivative goes to infinity. Then the paper\'s tables are held against the band, and the eight-digit value it quotes for the '
    + 'separable two-dimensional example is found one digit too generous.'
}));

O.push(C.tldr({
  findingRaw: 'For V = sin 2πx the band is FLAT (H̄ = 1) at ' + REC.counts.flat + ' sampled P, ROTATING with brackets below ' + e1(REC.widest.width) + ' at ' + REC.counts.rotating + ', UNDECIDED at one (P = 4/π, inside the enclosure of P₀). Table 1\'s separable value: H̄(1.5, 2.5) ∈ [' + f9(REC.table1.sum[0]) + ', ' + f9(REC.table1.sum[1]) + ']; the 4.4099660 quoted from Gomes–Oberman lies ' + e1(REC.table1.citedGap) + ' above it, the paper\'s own Newton values below it as the entropy penalization requires. Table 2\'s 0.96476 at k = 100 sits ' + REC.table2.Hdiamond[3].gap.toFixed(4) + ' below the exact 1.',
  mechanismRaw: 'H̄(P) = max V for |P| ≤ P₀ = ∫√(2(max V − V)); beyond, H̄ = c with ∫√(2(c − V)) = |P|. The integrals are enclosed by the midpoint rule with a remainder from a second-order interval jet, the cusp and near-degenerate cells by a plain Riemann bound; c by bisection that stops when the enclosed integral can no longer separate the sides.',
  checkRaw: C.m('node instruments/hbar/battery.js') + ' (18 checks, 5 red controls, about a minute) re-derives the record, holds P₀ against 4/π, every bracket against a geometrically convergent trapezoid rule, the Mather density against its mass, and the paper\'s numbers against the enclosures.'
}));

O.push(C.stats([
  { k: 'P₀, enclosed', v: '[' + P0.map(v => v.toFixed(6)).join(', ') + ']', role: 'held', n: 'contains 4/π = 1.2732395…, the closed form, for all three potentials; width ' + e1(REC.p0.sin.width) },
  { k: 'the band', v: REC.counts.flat + ' + ' + REC.counts.rotating + ' + 1', role: 'held', n: 'flat, rotating, undecided; every rotating bracket is between ' + e1(Math.min(...rot.map(b => b.width))) + ' and ' + e1(REC.widest.width) + ' wide' },
  { k: 'H̄(1.5, 2.5), separable', v: f6(mid(REC.table1.sum)), role: 'held', n: 'enclosed to ' + e1(REC.table1.width) + ': [' + f9(REC.table1.sum[0]) + ', ' + f9(REC.table1.sum[1]) + ']' },
  { k: 'the quoted 4.4099660', v: 'ABOVE', role: 'warn', n: 'by ' + e1(REC.table1.citedGap) + ': the eighth-significant-digit value the paper takes from Gomes–Oberman (2004) is not the value\'s seventh digit; the paper\'s own 4.40996 agrees with the enclosure' },
  { k: 'Table 2 at P = 0.5', v: '1, exactly', role: 'held', n: 'on the flat part of −sin 2πx; the printed 0.96476 at k = 100 is ' + REC.table2.Hdiamond[3].gap.toFixed(4) + ' below: the entropy penalization\'s gap, unchanged from N = 60 to 120' },
  { k: 'the Mather measure', v: 'decided where rotating', role: 'held', n: 'absolutely continuous with the density enclosed at P = 1.5 and 2; a Dirac at x = ¼ on the flat part (Mather; the paper\'s δ at P = P₀)' }
]));

O.push(C.section({
  lab: '§1 · the formula', title: 'Flat, then the inverse of an integral',
  bodyRaw: '<div class="col">'
    + C.pRaw('For H = p²/2 + V(x) on the circle, the corrector u solves (P + u′)²/2 + V = H̄, so P + u′ = ±√(2(H̄ − V)). If H̄ = max V the root can change sign where V peaks, u′ can be arranged with any mean between −P₀ and P₀, and H̄ stays at max V: the flat part. Beyond P₀ the sign is fixed and the mean of P + u′ is the integral Q(H̄) = ∫√(2(H̄ − V)), so H̄ is the number with Q(H̄) = |P|. The paper quotes this (§6.1, from Cacace–Camilli) for V = sin 2πx with P₀ = 4/π.')
    + C.eq(C.esc('H̄(P) = max V  for |P| ≤ P₀ = ∫₀¹ √(2(max V − V)) dx;      Q(H̄) = ∫₀¹ √(2(H̄ − V)) dx = |P|  beyond.'))
    + C.pRaw('Everything on this page is that formula evaluated as intervals. Q is strictly increasing (its derivative is the period ∫1/√(2(c − V)) > 0), so bisection brackets c whenever Q can be bounded above and below; Q is bounded by the midpoint rule with its remainder w³/24·sup|f″|, the second derivative carried through every operation as an interval. The trouble is where the formula is interesting: as c ↓ max V the integrand √(2(c − V)) develops a cusp at the peak of V and f″ grows like (c − V)^{−3/2}. Cells where the base is not positive by a margin fall back to a plain Riemann bound and the enclosure of Q widens toward P₀. Bisection stops when it cannot tell which side of |P| the integral is on; the mean value theorem, with the period ∫1/√(2(c − V)) as the derivative of Q, then turns the last straddling enclosure into a bracket on c. P₀ itself has the cusp on the nose; its enclosure is ' + e1(REC.p0.sin.width) + ' wide, it contains 4/π, and the one sampled P inside it is left undecided.')
    + '</div>'
    + C.figure({ svgRaw: bandFig(), caption: 'Figure 1 · The band for V = sin 2πx at ' + REC.band.length + ' sampled P. Flat at exactly 1 up to P₀, a convex rise beyond, every rotating point a bracket narrower than the stroke. The hollow circle at P = 4/π is the one point inside the enclosure of P₀: undecided, not assigned.' })
    + C.figure({ svgRaw: FIG_WIDTH, caption: 'Figure 2 · The width of the bracket on H̄(P) across the rotating part, with ' + REC.K.sweep + ' cells: between ' + e1(Math.min(...rot.map(b => b.width))) + ' and ' + e1(Math.max(...rot.map(b => b.width))) + '. Bisection alone stalls where the enclosed integral straddles |P|; the mean value theorem with the period as Q′ then closes the bracket to the quadrature\'s width divided by the period. The red control halves the cells and watches the bracket widen.' })
    + T_BAND
}));

O.push(C.section({
  lab: '§2 · the Mather measure', title: 'A density where it rotates, a point where it does not',
  bodyRaw: '<div class="col">'
    + C.pRaw('On the rotating part the projected Mather measure is the time the orbit spends: m(x) = 1/(T(c)√(2(c − V(x)))) with T(c) the period ∫1/√(2(c − V)). Both are enclosed at P = 1.5 and P = 2; the density integrates to 1 to 1e−5 on the enclosure midpoints. On the flat part it is the Dirac mass at the maximum of V, x = ¼ for the sine — Mather\'s theorem, and the paper\'s own statement at P = P₀ (δ at ¾ for their −sin). The support of the Mather measure is therefore decided at every sampled P except the undecided one.')
    + '</div>'
    + C.figure({ svgRaw: FIG_M, caption: 'Figure 3 · The projected Mather density at P = 1.5 and 2 for V = sin 2πx, enclosed pointwise (the widths are below the stroke). The orbit is slowest where V peaks, so the density peaks there; at larger P the orbit is faster and the density flatter.' })
}));

O.push(C.section({
  lab: '§3 · their tables', title: 'Two tables held against the band',
  bodyRaw: '<div class="col">'
    + C.pRaw('<b>Table 1.</b> The two-dimensional Hamiltonian |p|²/2 + cos 2πx₁ + cos 2πx₂ is separable, so H̄(P₁, P₂) = H̄(P₁) + H̄(P₂) with the one-dimensional cosine formula — the paper says so and quotes H̄(1.5, 2.5) = 4.4099660 from Gomes–Oberman (2004), then reports its own flow and Newton values at k = 10 to 10⁴. Both one-dimensional values are bracketed here to below 1e−6 with ' + REC.K.table + ' cells: c(1.5) ∈ [' + f9(REC.table1.c15[0]) + ', ' + f9(REC.table1.c15[1]) + '], c(2.5) ∈ [' + f9(REC.table1.c25[0]) + ', ' + f9(REC.table1.c25[1]) + '], sum [' + f9(REC.table1.sum[0]) + ', ' + f9(REC.table1.sum[1]) + ']. The quoted 4.4099660 lies above the enclosure by ' + e1(REC.table1.citedGap) + ': its seventh significant digit is not the value\'s. The paper\'s own numbers all lie below the enclosure, which is what they must do — the entropy-penalized H̄^k is a soft maximum and never exceeds H̄ — and its k = 10⁴ value 4.40996 agrees with the enclosure to every digit it prints.')
    + '</div>' + T1
    + '<div class="col">'
    + C.pRaw('<b>Table 2.</b> At P = 0.5 on −sin 2πx the paper says H̄ = 1 and reports H̄◇, the flow\'s large-time value at k = 100, for four meshes: 0.964609 to 0.96476. The exact value is decided here — 0.5 is below the lower end of the P₀ enclosure, so the point is FLAT and H̄ = 1 exactly — and the printed values sit ' + REC.table2.Hdiamond[0].gap.toFixed(4) + ' to ' + REC.table2.Hdiamond[3].gap.toFixed(4) + ' below it. The gap does not close from N = 60 to N = 120; it is the entropy penalization at k = 100, not the mesh, and the paper\'s Figure 1 shows the same gap shrinking with k.')
    + '</div>' + T2
}));

O.push(C.section({
  lab: '§4 · the honest boundary', title: 'What is claimed, and what is not',
  bodyRaw: '<div class="col">' + C.plainList([
    { b: 'Decided.', text: 'The enclosures of P₀ (containing 4/π), of every rotating H̄(P), of the separable Table 1 value and of the periods and Mather densities at two P; the flat values; the placement of every printed number against its enclosure. All interval statements, re-derived at every build.' },
    { b: 'Assumed.', text: 'The one-dimensional formula itself (classical; Cacace–Camilli as the paper cites it; the sign argument in §1 is the sketch, not a proof). The Mather measure on the flat part is Mather\'s theorem for a single nondegenerate maximum, not re-proved. Q strictly increasing in c, from its derivative being a positive integral.' },
    { b: 'Not claimed.', text: 'Anything at the undecided P; anything in two dimensions beyond the separable case — the non-separable Hamiltonian of §6.2 has no formula and is not touched; a new method: the formula is textbook, and the page\'s contribution is the enclosure and the two placements. The width of the band is the quadrature\'s, as the red control shows by halving the cells.' },
    { b: 'On the seventh digit.', text: 'The 4.4099660 is quoted by the paper from another paper; it may be a rounding, a typo, or a six-digit computation written with eight. Nothing here says which. What is said is that the value with a rigorous enclosure is ' + f6(mid(REC.table1.sum)) + ' and that 4.4099660 is outside it.' }
  ]) + '</div>'
}));

O.push(C.section({
  lab: '§5 · check it', title: 'A minute on your machine',
  bodyRaw: '<div class="col">'
    + C.code('node instruments/hbar/battery.js       # 18 checks, 5 red controls: P₀ vs 4/π, brackets vs the trapezoid rule, the Mather mass, the tables\nnode instruments/hbar/run.js --check   # the record, re-derived and compared byte for byte')
    + C.pRaw('The instrument is <span class="m">instruments/hbar/exact.js</span> with <span class="m">derive.js</span>; the interval jet is <span class="m">instruments/interval/taylor2.js</span>; the record is <span class="m">certs/hbar-band.json</span>.')
    + '</div>'
}));

O.push(C.section({
  lab: 'references', title: 'Sources',
  bodyRaw: '<div class="col">' + C.plainList([
    { raw: 'D. A. Gomes, X. Yang, <em>The Hessian Riemannian flow and Newton\'s method for effective Hamiltonians and Mather measures</em>, arXiv:1810.03483v2; ESAIM M2AN 54 (2020) 1883–1915 — §6.1 (the formula and P₀ = 4/π), §6.2 (Table 1 and the quoted 4.4099660), §6.4 (Table 2).' },
    { raw: 'D. A. Gomes, A. M. Oberman, <em>Computing the effective Hamiltonian using a variational approach</em>, SIAM J. Control Optim. 43 (2004) — the source of the quoted value, not consulted here; the number is taken as the paper prints it.' },
    { raw: 'S. Cacace, F. Camilli, <em>A generalized Newton method for homogenization of Hamilton–Jacobi equations</em>, SIAM J. Sci. Comput. 38 (2016) — the one-dimensional formula as the paper cites it.' },
    { raw: '<a href="regatlas.html">The regularization, measured</a>, <a href="afg.html">the first-order game by its current</a> — the machine\'s other first-order pages; the ergodic constants there are enclosed by radii polynomials, this one by the classical integral.' }
  ]) + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-hbar.js @ git ' + gitrev
  + ' — certs/hbar-band.json re-derived during this build and compared byte for byte (identical, or no page). Code sha256 ' + REC.provenance.sha256.slice(0, 16) + '…') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'hbar.html'),
  TPL.render({ title: 'The effective Hamiltonian band · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/hbar.html',
    desc: 'The one-dimensional effective Hamiltonian enclosed as a band: flat exactly, rotating bracketed, the threshold enclosed and the point inside it left undecided; Gomes–Yang\'s tables held against it, and the eight-digit value they quote found one digit too generous.' }));
console.log('reports/hbar.html written: record re-derived identically @ git ' + gitrev);
