#!/usr/bin/env node
/* build-report-frontier.js — generate reports/frontier.html: the concentration
   frontier as a measurement. certs/frontier-measurement.json is re-derived during
   the build from the pinned data.
   usage: node tools/build-report-frontier.js */
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
const die = (m) => { console.error('FRONTIER REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

try { cp.execSync('node instruments/frontier/run.js --check', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { die('the live re-derivation differs from certs/frontier-measurement.json:\n' + (e.stderr || e.stdout || e.message)); }
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'frontier-measurement.json'), 'utf8'));
if (REC.verdict !== 'VERIFIED') die('record verdict is ' + REC.verdict);
if (!Object.values(REC.pins).every(p => p.ok)) die('a data pin has moved');
const { CAT, CTX } = TK.CHART;
const fi = (iv, d) => '[' + iv[0].toFixed(d) + ', ' + iv[1].toFixed(d) + ']';

/* ---- figure 1: the six ladders at N = 14 -------------------------------------- */
const LG = Math.log10;
const FIG_LADDERS = CH.segments({
  /* segments() has no log axis of its own, so the amplitude axis is log10(A) and the ticks carry the amplitudes */
  w: 900, x0: LG(0.04), x1: LG(40), rowH: 40,
  rows: REC.ladders.map(l => ({ k: 'σ = ' + l.sigma, segs: [
    { x0: LG(0.04), x1: LG(l.bisected[0]), token: CAT[0], k: 'CERTIFIED', v: 'enclosed at every evaluated A up to ' + l.bisected[0].toFixed(5) },
    { x0: LG(l.bisected[0]), x1: LG(l.bisected[1]), token: CTX, hatch: true, k: 'the A⋆ bracket', v: fi(l.bisected, 5) },
    { x0: LG(l.bisected[1]), x1: LG(40), token: CTX, k: 'REFUSED', v: 'first refusal ' + l.firstMode + ' (Z1 = ' + l.firstZ1.toFixed(4) + ')' }
  ] })),
  xTicks: [0.05, 0.1, 0.3, 1, 3, 10, 30].map(v => ({ v: LG(v), t: String(v) })),
  xLabel: 'potential amplitude A, logarithmic — sixteen amplitudes from 0.05 to 32 were evaluated on every row',
  keys: [{ token: CAT[0], t: 'CERTIFIED: an enclosure at every evaluated A (decided)', kind: 'swatch' }, { token: CTX, t: 'the A⋆ bracket, bisected to ≤ 0.1 % (between two decided points)', kind: 'hatch' }, { token: CTX, t: 'REFUSED, by name: Z1 ≥ 1 first', kind: 'swatch' }],
  alt: 'Six rows, one per viscosity from 0.1 to 1.2, over a logarithmic amplitude axis: each row is certified up to a boundary that moves right as σ grows, from about 0.48 to about 28, and refused beyond it.'
});

/* ---- figure 2: A⋆ rises with N, under the N-free ceiling ---------------------- */
function riseFig(c, r) {
  const Ns = r.N, lows = r.AstarLo;
  const y0 = Math.min(...lows) * 0.97, y1 = c.Arec[1] * 1.01;
  const keysR = [{ token: CAT[0], t: 'A⋆(N): the bisected bracket (decided at each N); the dashed line joins them (a trend, not a law)', kind: 'dash' }, { token: CAT[2], t: 'A_rec: the N-free ceiling (decided from the candidate alone)', kind: 'line' }];
  const nLegR = CH.legendLines(keysR, 900 - 62 - 22);
  const o = { w: 900, h: 240 + nLegR * 19, x0: 12, x1: 42, y0, y1, padB: 28 + 22 + 5 + nLegR * 19, xLabel: 'truncation order N', yLabel: 'A at σ = ' + c.sigma };
  const f = CH.frame(o);
  const out = [CH.open({ w: f.w, h: f.h, alt: 'At σ = ' + c.sigma + ' the certified boundary rises from ' + lows[0].toFixed(3) + ' at N = 14 to ' + lows[3].toFixed(3) + ' at N = 40, approaching but not reaching the solid ceiling at ' + c.Arec[0].toFixed(3) + '.' })];
  out.push(CH.axes(f, Object.assign({}, o, { xTicks: Ns.map(v => ({ v, t: String(v) })), yTicks: [y0, c.Arec[0]].map(v => ({ v, t: v.toFixed(3) })) })));
  const yc = f.py(c.Arec[0]);
  out.push('    <line x1="' + f.L + '" y1="' + yc.toFixed(1) + '" x2="' + (f.L + f.pw) + '" y2="' + yc.toFixed(1) + '" stroke="' + CAT[2] + '" stroke-width="2"/>');
  out.push(CH.txt(f.L + f.pw - 4, yc - 6, 'A_rec, N-free: ' + fi(c.Arec, 4), 't-note', 'end'));
  /* the brackets at each N, and a dashed line through their lower ends (a float trend, not a law) */
  out.push('    <path d="' + Ns.map((n, k) => (k ? 'L' : 'M') + f.px(n).toFixed(1) + ' ' + f.py(lows[k]).toFixed(1)).join(' ') + '" fill="none" stroke="' + CAT[0] + '" stroke-width="2" stroke-dasharray="' + G.CLAIM + '"/>');
  c.ratios.forEach((x, k) => {
    const px = f.px(x.N);
    out.push('    <line x1="' + px.toFixed(1) + '" y1="' + f.py(x.Astar[0]).toFixed(1) + '" x2="' + px.toFixed(1) + '" y2="' + f.py(x.Astar[1]).toFixed(1) + '" stroke="' + CAT[0] + '" stroke-width="6" stroke-linecap="round"/>');
    out.push('    <circle ' + CH.hit('cx="' + px.toFixed(1) + '" cy="' + f.py(x.Astar[0]).toFixed(1) + '" r="10" fill="transparent"', 'N = ' + x.N, 'A⋆ ∈ ' + fi(x.Astar, 5) + ' · A⋆/A_rec = ' + x.ratio.toFixed(4)) + '/>');
    out.push(CH.txt(px, f.py(x.Astar[0]) + 18, x.ratio.toFixed(3), 't-note', 'middle'));
  });
  out.push(CH.legend(keysR, f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
}
const FIGS_RISE = REC.ceiling.map(c => riseFig(c, REC.rise.find(r => r.sigma === c.sigma)));

/* ---- the tables ---- */
const T1 = C.table({
  cols: [{ h: 'σ' }, { h: 'pattern over the 16 amplitudes' }, { h: 'A⋆ bracket (bisected)', cls: 'v' }, { h: 'first refusal' }, { h: 'min m at the last certified point', cls: 'v' }, { h: 'min w', cls: 'v' }],
  rows: REC.ladders.map(l => [String(l.sigma), { raw: C.m(l.pattern) }, { raw: C.m(fi(l.bisected, 5)) }, l.firstMode + ' (Z1 = ' + l.firstZ1.toFixed(4) + ')', l.lastMinM.toFixed(4), l.lastMinW.toFixed(4)])
});
const T2 = C.table({
  cols: [{ h: 'σ' }, { h: 'A_rec (N-free)', cls: 'v' }, { h: 'A⋆/A_rec at N = 14', cls: 'v' }, { h: '20', cls: 'v' }, { h: '28', cls: 'v' }, { h: '40', cls: 'v' }, { h: 'A⋆ rise 14 → 40', cls: 'v' }],
  rows: REC.ceiling.map(c => [String(c.sigma), { raw: C.m(fi(c.Arec, 5)) }].concat(c.ratios.map(x => x.ratio.toFixed(4))).concat(['+' + REC.rise.find(r => r.sigma === c.sigma).movePct.toFixed(2) + ' %']))
});

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · a measurement over pinned data, re-derived at every build',
  title: 'The concentration frontier, as a measurement',
  deck: 'The congestion mean-field-game enclosure certifies one equilibrium. Sweep the same certifier over the depth of the potential '
    + 'and it stops certifying somewhere: as the crowd concentrates, the contraction bound crosses one and the instrument refuses. '
    + 'This page is the map of where that happens, at six viscosities and four truncation orders, and the finding that hurts: the '
    + 'boundary of a fixed-order certificate moves with the order, by five to ten percent, and is still moving at the highest order '
    + 'run. What does not move is a ceiling computable from the candidate alone. The boundary is a lower bound on it; whether it '
    + 'reaches it is not established, and the page says so.'
}));

O.push(C.tldr({
  findingRaw: 'At N = 14 every ladder is monotone: certified up to A⋆, refused beyond, the first refusal always Z1 ≥ 1. A⋆ rises with N at every σ '
    + '(' + REC.rise.map(r => 'σ = ' + r.sigma + ': +' + r.movePct.toFixed(1) + ' %').join(', ') + ' from N = 14 to 40). The N-free ceiling A_rec is bit-identical across N, and A⋆/A_rec climbs from '
    + Math.min(...REC.ceiling.map(c => c.ratios[0].ratio)).toFixed(3) + ' to ' + Math.max(...REC.ceiling.map(c => c.ratios[3].ratio)).toFixed(3) + ' without reaching 1.',
  mechanismRaw: 'The validated-numerics certifier of <a href="mfg-congest.html">the congestion page</a>, run over amplitude ladders in the source lab; the refusal is one identified coefficient of the tail bound, cMrecip, whose denominator does not depend on N; the ceiling is where it reaches 1.',
  checkRaw: C.m('node instruments/frontier/battery.js') + ' (19 checks, 5 red controls, under a second) re-derives every statement above from the three pinned data files and refuses if a pin has moved.'
}));

O.push(C.stats([
  { k: 'ladders', v: '6 × 16', role: 'held', n: 'every one monotone; every certified point an enclosure with Z1 < 1 and positive density; every refusal named' },
  { k: 'A⋆ moves with N', v: '+5 to +10 %', role: 'warn', n: 'from N = 14 to 40, still rising: the fixed-N map is the boundary of the N = 14 certificate, never “the boundary”' },
  { k: 'the ceiling', v: 'bit-identical', role: 'held', n: 'A_rec(σ) the same at N = 14, 20, 28, 40 to the bisection\'s resolution — the refusal is method-intrinsic in mechanism' },
  { k: 'the ratio', v: '< 1 always', role: 'held', n: 'A⋆(N)/A_rec rises toward 1 at every σ; the limit is not established and is not claimed' },
  { k: 'unevaluated', v: 'the a-axis', role: 'warn', n: 'the exponent a = ½ is hard-coded in the kernel; there is no A⋆(σ, a) map here and none is promised' },
  { k: 'not re-run', v: 'pinned', role: 'warn', n: 'the frontier took hours in the source lab; the files are sha-pinned and re-hashed at every build; the one published point IS re-run by its own page' }
]));

O.push(C.section({
  lab: '§1 · the instrument', title: 'A certifier that knows where it stops',
  bodyRaw: '<div class="col">'
    + C.pRaw('The instance is the discounted Gomes–Mitake congestion system with exponent a = ½, potential A cos 2πx + γm with γ = ½, the system whose one equilibrium <a href="mfg-congest.html">the congestion page</a> encloses and re-proves at every build. The certifier is a radii-polynomial contraction in a weighted sequence space; it returns an enclosure with an explicit radius, or a refusal with a name: Z1 ≥ 1 when the approximate inverse stops being one, a non-positive mean of √m when the candidate itself has gone bad, a non-finite candidate when Newton diverges. Only the first of those is the certificate\'s boundary; the other two are the solver\'s, and the data keeps them apart.')
    + C.pRaw('A ladder is the certifier run at sixteen amplitudes, from 0.05 to 32, at one viscosity. Its pattern must be monotone, certified then refused, and on every ladder it is. The boundary A⋆ is bracketed by the last certified and the first refused amplitude, then bisected to a tenth of a percent, every trial warm-started from the last certificate so a cold-start failure can never be mistaken for a refusal.')
    + '</div>'
    + C.figure({ svgRaw: FIG_LADDERS, caption: 'Figure 1 · The six ladders at N = 14 on a logarithmic amplitude axis. Solid: certified at every evaluated amplitude. Hatched: the bisected bracket in which the certificate turns into a refusal. Beyond: refused, by name. The boundary rises steeply with σ, and the local slope of that rise changes across the range, so no power law is claimed.' })
    + T1
}));

O.push(C.section({
  lab: '§2 · the finding that hurts', title: 'The boundary moves with the truncation',
  bodyRaw: '<div class="col">'
    + C.pRaw('Refine the truncation order N from 14 to 20, 28 and 40 at three viscosities, holding the candidate grid fixed at 1024 points so the two cannot be confounded, and the boundary rises every time. At σ = 0.1 it rises ten percent; at σ = 0.5 and 1.2, about six. It is still rising at N = 40. A boundary measured at one N is therefore a lower bound on the frontier of this method, and a published A⋆(σ) at N = 14 would be a resolution artefact at the five-to-ten-percent level. The source note says this first, and this page repeats it before anything else.')
    + '</div>'
    + FIGS_RISE.map((svg, k) => C.figure({ svgRaw: svg, caption: 'Figure ' + (2 + k) + ' · σ = ' + REC.ceiling[k].sigma + '. The bracket at each N is decided; the dashed line through them is a trend, not a law. The solid rule is the N-free ceiling. The number under each bracket is the ratio A⋆/A_rec.' })).join('')
}));

O.push(C.section({
  lab: '§3 · what does not move', title: 'An N-free ceiling, read off the code',
  bodyRaw: '<div class="col">'
    + C.pRaw('The Z1 bound is a maximum over explicit columns and an analytic tail. In the tail, every term but one carries a denominator that grows with N. The one exception is the reciprocal block\'s tail inverse, the scalar 1/(2s̄₀), because that block\'s linear part has no derivative; its term, cMrecip = ‖w∗w‖_ν/(2s̄₀), is measured to be N-free. Since Z1 ≥ cMrecip, the implication cMrecip ≥ 1 ⇒ refusal holds at EVERY N. Define A_rec(σ) as the amplitude where cMrecip reaches 1: it is computable from the candidate alone, before any interval arithmetic, and it came out bit-identical across N = 14, 20, 28 and 40 at every σ. A⋆(N) approaches it from below.')
    + '</div>' + T2 + '<div class="col">'
    + C.pRaw('The ceiling depends on the weight ν of the sequence space by as much as the boundary depends on N — six percent across ν ∈ [1.00, 1.10] at σ = 0.5. It is a property of this approximate-inverse construction with this ν, not of the equation. Nothing here bounds where solutions exist, and the refused region was not probed for existence.')
    + '</div>'
}));

O.push(C.section({
  lab: '§4 · the honest boundary', title: 'What is claimed, and what is not',
  bodyRaw: '<div class="col">' + C.plainList([
    { b: 'Claimed.', text: 'The ladders and their patterns; the brackets; the named modes; the rise of A⋆ with N; the N-invariance of A_rec; the ratios. Each is re-derived from the pinned files at every build and gated.' },
    { b: 'Not claimed.', text: 'A⋆(σ) as “the boundary” (it is the boundary of the N = 14 certificate); the limit of A⋆(N) (N > 40 is unevaluated); an order for the decay of the gap (the local slope drifts from about −0.8 to −0.7 and is drawn dashed); anything on the a-axis (the kernel hard-codes a = ½); existence of solutions past the boundary.' },
    { b: 'Not re-run.', text: 'The frontier itself. The three data files come from the source lab through the lift, are sha-pinned, and are re-hashed at every build; the kernel that produced them is named by its hash in the source note. The one published point of the same certifier is re-run at every build of its own page. This is the house convention: published, not independently rerun, and said so.' },
    { b: 'Occupied, and cited.', text: 'Certified continuation over a parameter set is the validated-numerics literature\'s (Day–Lessard–Mischaikow; van den Berg–Lessard–Mischaikow; Gameiro–Lessard–Pugliese). What is drawn here is narrower: a refusal named and mechanised, and a ceiling read off the code path.' }
  ]) + '</div>'
}));

O.push(C.section({
  lab: '§5 · check it', title: 'Under a second on your machine',
  bodyRaw: '<div class="col">'
    + C.code('node instruments/frontier/battery.js     # pins, ladders, brackets, ceilings; 19 checks, 5 red controls\nmake drift                               # re-hash the lifted data against the source lab\nnode instruments/frontier/run.js --check  # the record, re-derived and compared')
    + C.pRaw('The data is <span class="m">corpus/refusal-frontier/</span> with the source note beside it; the record is <span class="m">certs/frontier-measurement.json</span>.')
    + '</div>'
}));

O.push(C.section({
  lab: 'references', title: 'Sources',
  bodyRaw: '<div class="col">' + C.plainList([
    { raw: 'D. A. Gomes, H. Mitake, <em>Existence for stationary mean-field games with congestion and quadratic Hamiltonians</em>, NoDEA 22 (2015) 1897–1910 — the existence theory the instance sits in.' },
    { raw: 'S. Day, J.-P. Lessard, K. Mischaikow, <em>Validated continuation for equilibria of PDEs</em>, SIAM J. Numer. Anal. 45 (2007); M. Gameiro, J.-P. Lessard, A. Pugliese, <em>Computation of smooth manifolds via rigorous multi-parameter continuation in infinite dimensions</em>, Found. Comput. Math. 16 (2016) — certified continuation over parameters, cited as the occupied method.' },
    { raw: 'The source note: corpus/refusal-frontier/REFUSAL_FRONTIER.md (sin-mfg, 2026-07-28, addendum 2026-08-21), lifted verbatim.' },
    { raw: '<a href="mfg-congest.html">A congestion mean-field game, enclosed</a> — the one point, re-proved at every build.' }
  ]) + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-frontier.js @ git ' + gitrev
  + ' — certs/frontier-measurement.json re-derived from the pinned data during this build and compared byte for byte (identical, or no page). Code sha256 ' + REC.provenance.sha256.slice(0, 16) + '…') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'frontier.html'),
  TPL.render({ title: 'The concentration frontier, as a measurement · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/frontier.html',
    desc: 'Where the congestion mean-field-game certifier stops certifying, measured at six viscosities and four truncation orders: the boundary moves with the order and an N-free ceiling does not.' }));
console.log('reports/frontier.html written: record re-derived identically @ git ' + gitrev);
