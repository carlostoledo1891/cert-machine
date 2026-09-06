#!/usr/bin/env node
/* build-report-maxval.js — generate reports/maxval.html: the maximal value
   function, drawn. certs/maxval-cylinder.json is re-derived during the build.
   usage: node tools/build-report-maxval.js */
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
const die = (m) => { console.error('MAXVAL REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

try { cp.execSync('node instruments/maxval/run.js --check', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { die('the live re-derivation differs from certs/maxval-cylinder.json:\n' + (e.stderr || e.stdout || e.message)); }
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'maxval-cylinder.json'), 'utf8'));
if (REC.verdict !== 'VERIFIED' || REC.certificate.verdict !== 'PROVED') die('record is not VERIFIED/PROVED');
if (!(REC.pairOK && REC.gapOK && REC.terminalOK)) die('a certificate flag is false in the record');
const NT = REC.options.NT, NX = REC.options.NX, T = (REC.instance.T[0] + REC.instance.T[1]) / 2, L = REC.instance.L;
const { CAT, CTX, SURFACE } = TK.CHART;
const cnt = REC.counts;

/* ---- figure 1: the space–time cylinder, painted ---------------------------- */
const FIG_MAP = (() => {
  const keys = [
    { token: CAT[0], t: 'support: u* = u by Theorem 1.8 (decided)', kind: 'swatch' },
    { token: CAT[1], t: 'vacuum, tight: u* = the free Hopf–Lax value, every minimising path clear (decided)', kind: 'swatch' },
    { token: 'var(--c-grid)', t: 'vacuum, bracket: u* between Hopf–Lax and the cheapest clear path (decided, wider)', kind: 'swatch' },
    { token: CTX, t: 'refused: the cell meets the moving boundary of the support', kind: 'hatch' }
  ];
  const nLeg = CH.legendLines(keys, 900 - 62 - 22);
  const o = { w: 900, h: 360 + nLeg * 19, x0: -L / 2, x1: L / 2, y0: 0, y1: T, padB: 28 + 22 + 5 + nLeg * 19, xLabel: 'x on the circle of length 6', yLabel: 'time t  (T ≈ ' + T.toFixed(3) + ')' };
  const f = CH.frame(o);
  const out = [CH.open({ w: f.w, h: f.h, alt: 'The space–time cylinder painted cell by cell: a central band of support cells narrowing from |x| < 2 at t = 0 to |x| < 1.5 at t = T, '
    + 'a thin hatched seam along its moving edge, and the vacuum outside decided everywhere — tight near the horizon and near the antipode, a wider bracket elsewhere.' })];
  out.push(CH.HATCH_DEF);
  out.push(CH.axes(f, Object.assign({}, o, { xTicks: [-3, -2, -1, 0, 1, 2, 3].map(v => ({ v, t: String(v) })), yTicks: [0, 0.5, 1, 1.5].map(v => ({ v, t: String(v) })) })));
  const cw = f.px(L / NX) - f.px(0), chh = f.py(0) - f.py(T / NT);
  for (const c of REC.cells) {
    const [i, j, region, standing, tight, gapProven, u, us, gap] = c;
    const x = f.px(-L / 2 + L * j / NX), y = f.py(T * (i + 1) / NT);
    const fill = standing === 'S' ? CAT[0] : standing === 'D' ? (tight ? CAT[1] : 'var(--c-grid)') : 'url(#cmHatch)';
    const lab = 'x ∈ [' + (-L / 2 + L * j / NX).toFixed(3) + ', ' + (-L / 2 + L * (j + 1) / NX).toFixed(3) + '), t ∈ [' + (T * i / NT).toFixed(3) + ', ' + (T * (i + 1) / NT).toFixed(3) + ')';
    const val = standing === 'S' ? 'support · u* = u ∈ [' + u[0].toFixed(3) + ', ' + u[1].toFixed(3) + ']'
      : standing === 'D' ? (tight ? 'tight' : 'bracket') + ' · u* ∈ [' + us[0].toFixed(3) + ', ' + us[1].toFixed(3) + '] · u ∈ [' + u[0].toFixed(3) + ', ' + u[1].toFixed(3) + ']' + (gapProven ? ' · gap proved > 0' : '')
      : 'refused · the moving boundary';
    out.push('    <rect ' + CH.hit('x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + (cw + 0.5).toFixed(2) + '" height="' + (chh + 0.5).toFixed(2) + '" fill="' + fill + '"', lab, val) + '/>');
  }
  /* the support boundary r(t) = 2 sin²θ(t), drawn from the record's cell radii */
  const rows = [];
  for (let i = 0; i < NT; i++) {
    const cell = REC.cells.find(c => c[0] === i && c[2] === 'B' && c[1] >= NX / 2);
    if (cell) rows.push([T * (i + 0.5) / NT, -L / 2 + L * (cell[1] + 0.5) / NX]);
  }
  for (const sgn of [1, -1]) {
    out.push('    <path d="' + rows.map((p, k) => (k ? 'L' : 'M') + f.px(sgn * p[1]).toFixed(1) + ' ' + f.py(p[0]).toFixed(1)).join(' ') + '" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="' + G.GUIDE + '"/>');
  }
  out.push(CH.txt(f.px(2.55), f.py(T * 0.55), 'm = 0', 't-lab', 'middle'));
  out.push(CH.txt(f.px(-2.55), f.py(T * 0.55), 'm = 0', 't-lab', 'middle'));
  out.push(CH.legend(keys, f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
})();

/* ---- figure 2: profiles — u* enclosed, u dotted, at two times --------------- */
function profileFig(prof, title) {
  const keys = [
    { token: CAT[0], t: 'u* enclosed (decided; solid edges are the bracket)', kind: 'line' },
    { token: CAT[2], t: 'u, the parabolic member of U(m) (CHOSEN: one of many off the support)', kind: 'dash' },
    { token: 'var(--c-grid)', t: 'the support of m', kind: 'swatch' }
  ];
  const nLeg = CH.legendLines(keys, 900 - 62 - 22);
  const ys = prof.rows.flatMap(r => [r.u[0], r.u[1]].concat(r.ustar ? [r.ustar[0], r.ustar[1]] : []));
  const y0 = Math.min(...ys) - 0.1, y1 = Math.max(...ys) + 0.1;
  const o = { w: 900, h: 300 + nLeg * 19, x0: -L / 2, x1: L / 2, y0, y1, padB: 28 + 22 + 5 + nLeg * 19, xLabel: 'x', yLabel: 'value at t ∈ [' + prof.t[0].toFixed(3) + ', ' + prof.t[1].toFixed(3) + ')' };
  const f = CH.frame(o);
  const out = [CH.open({ w: f.w, h: f.h, alt: title })];
  out.push(CH.axes(f, Object.assign({}, o, { xTicks: [-3, -2, -1, 0, 1, 2, 3].map(v => ({ v, t: String(v) })), yTicks: [y0, y1].map(v => ({ v, t: v.toFixed(1) })) })));
  const sup = prof.rows.filter(r => r.standing === 'SUPPORT');
  if (sup.length) out.push('    <rect x="' + f.px(sup[0].x - L / NX / 2).toFixed(1) + '" y="' + f.T + '" width="' + (f.px(sup[sup.length - 1].x + L / NX / 2) - f.px(sup[0].x - L / NX / 2)).toFixed(1) + '" height="' + f.ph + '" fill="var(--c-grid)"/>');
  /* u* enclosure as a band over the decided cells, in runs */
  const runs = [];
  for (const r of prof.rows) { const last = runs[runs.length - 1]; if (r.ustar && last && last.length && Math.abs(last[last.length - 1].x + L / NX - r.x) < 1e-9) last.push(r); else if (r.ustar) runs.push([r]); }
  for (const run of runs) {
    const up = run.map((r, k) => (k ? 'L' : 'M') + f.px(r.x).toFixed(2) + ' ' + f.py(r.ustar[1]).toFixed(2)).join(' ');
    const dn = run.slice().reverse().map(r => 'L' + f.px(r.x).toFixed(2) + ' ' + f.py(r.ustar[0]).toFixed(2)).join(' ');
    out.push('    <path d="' + up + ' ' + dn + ' Z" fill="' + CAT[0] + '" opacity="0.18"/>');
    for (const idx of [0, 1]) out.push('    <path d="' + run.map((r, k) => (k ? 'L' : 'M') + f.px(r.x).toFixed(2) + ' ' + f.py(r.ustar[idx]).toFixed(2)).join(' ') + '" fill="none" stroke="' + CAT[0] + '" stroke-width="2" stroke-linejoin="round"/>');
  }
  /* u dotted, its enclosure too thin to matter at this scale */
  out.push('    <path d="' + prof.rows.map((r, k) => (k ? 'L' : 'M') + f.px(r.x).toFixed(2) + ' ' + f.py((r.u[0] + r.u[1]) / 2).toFixed(2)).join(' ') + '" fill="none" stroke="' + CAT[2] + '" stroke-width="2" stroke-linecap="round" stroke-dasharray="' + G.PICK + '"/>');
  for (const r of prof.rows) out.push('    <rect ' + CH.hit('x="' + (f.px(r.x) - 3).toFixed(1) + '" y="' + f.T + '" width="' + (f.px(L / NX) - f.px(0)).toFixed(1) + '" height="' + f.ph + '" fill="transparent" data-cmx="' + f.px(r.x).toFixed(1) + '"',
    'x = ' + r.x.toFixed(3) + ' · ' + r.standing, (r.ustar ? 'u* ∈ [' + r.ustar[0].toFixed(3) + ', ' + r.ustar[1].toFixed(3) + '] · ' : '') + 'u ∈ [' + r.u[0].toFixed(3) + ', ' + r.u[1].toFixed(3) + ']') + '/>');
  out.push('    <line class="cm-cross" x1="0" y1="' + f.T + '" x2="0" y2="' + (f.T + f.ph) + '" stroke="' + TK.CHART.AXIS + '" stroke-width="1" style="opacity:0"/>');
  out.push(CH.legend(keys, f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
}
const P0 = REC.profiles[0], P2 = REC.profiles[2], P4 = REC.profiles[4];
const FIG_P0 = profileFig(P0, 'The value functions at t near 0: on the support, u* and u coincide; in the vacuum u* sits above u, enclosed as a bracket that is wide because the free path from far out has a long time to dive into the crowd.');
const FIG_P2 = profileFig(P2, 'The value functions at t near T/2: the support has narrowed; in the vacuum u* lies above the dotted u with a bracket that narrows toward the horizon.');
const FIG_P4 = profileFig(P4, 'The value functions just before T: the bracket has collapsed to a line, u* is the Hopf–Lax value almost everywhere in the vacuum, and it meets u at the edge of the support.');

/* ---- the page ---------------------------------------------------------------- */
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · the record is re-derived at every build',
  title: 'The maximal value function, drawn',
  deck: 'Gomes and Üçer prove that in a first-order mean-field game the value function is decided only where the density lives. '
    + 'Off the support it is one member of a set of subsolutions, and among them exactly one is maximal. Their paper carries no '
    + 'example, so this page builds one: a crowd whose support shrinks under a terminal cost, in closed form, with a vacuum around it. '
    + 'The pair is verified cell by cell as a solution; the maximal value function is enclosed on every vacuum cell; the parabolic '
    + 'solution is drawn dotted beneath it; and the gap between the two is proved positive on most of the vacuum. Where the '
    + 'arithmetic cannot decide, the cell says so.'
}));

O.push(C.tldr({
  findingRaw: 'On a ' + NT + ' × ' + NX + ' cell cylinder, ' + cnt.SUPPORT + ' support cells carry u* = u by Theorem 1.8, ' + cnt.DECIDED + ' vacuum cells carry an enclosure of u* '
    + '(' + cnt.tight + ' of them tight, the free Hopf–Lax path proved clear of the crowd), and ' + cnt.REFUSED + ' cells on the moving boundary are refused. The gap u* − u is proved '
    + 'positive on ' + cnt.gapProven + ' vacuum cells and reaches ' + REC.maxGap.toFixed(3) + '.',
  mechanismRaw: 'The instance is explicit through r = 2 sin²θ. The pair is checked by interval residuals; the maximal solution is bracketed '
    + 'between the free Hopf–Lax value (a rigorous branch-and-bound over the endpoint) and the cheapest path proved clear of the support, '
    + 'with every surviving minimiser\'s straight path tested against the shrinking crowd in intervals.',
  checkRaw: C.m('node instruments/maxval/battery.js') + ' (18 checks, 5 red controls, about 20 s) re-derives the record and compares it byte for byte.'
}));

O.push(C.stats([
  { k: 'support cells', v: String(cnt.SUPPORT), role: 'held', n: 'u* = u there, by their theorem; the pair verified by residuals enclosing 0' },
  { k: 'vacuum cells', v: String(cnt.DECIDED), role: 'held', n: 'u* enclosed on every one; ' + cnt.tight + ' tight, the rest a bracket' },
  { k: 'refused', v: String(cnt.REFUSED), role: 'warn', n: 'the cells the moving boundary passes through — a budget, not a defect' },
  { k: 'gap proved', v: cnt.gapProven + ' cells', role: 'held', n: 'u* > u strictly; the room in which the other value functions live; max ' + REC.maxGap.toFixed(3) },
  { k: 'the horizon', v: 'T = ' + T.toFixed(4), n: '√(2/3)(π/3 + √3/2), enclosed to ' + ((REC.instance.T[1] - REC.instance.T[0]) / 2).toExponential(1) + '; r shrinks from 2 to 3/2' },
  { k: 'falsifiers', v: 'MUST REFUSE', role: 'warn', n: 'a flipped coupling sign, a flipped velocity sign, a diving path, a lazy branch-and-bound, a forged u*' }
]));

O.push(C.section({
  lab: '§1 · the theorem', title: 'Decided where the crowd is, chosen where it is not',
  bodyRaw: '<div class="col">'
    + C.pRaw('<a href="https://arxiv.org/abs/2606.28378">Gomes and Üçer</a> study first-order time-dependent mean-field games with local coupling by monotone operators in Banach spaces:')
    + C.eq(C.esc('−u_t + H(t, x, Du, m) = 0,     m_t − div(m D_pH) = 0,     m(0) = m₀,  u(T) = u_T'))
    + C.pRaw('Their Theorem 1.8 is about structure. Fix a density m for which value functions exist. Among all admissible subsolutions of the '
      + 'Hamilton–Jacobi inequality there is a unique maximal one, u*, and the MFG value functions are exactly the subsolutions that equal u* '
      + 'wherever m > 0 and, at t = 0, wherever m₀ > 0. Off the support, a value function is one member of a set. In this machine\'s grammar '
      + 'that is the CHOSEN standing, and u* is the DECIDED one.')
    + C.pRaw('The paper proves this in every dimension, for non-separable Hamiltonians with power growth, and carries no example. This page builds one.')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · the instance', title: 'A crowd that shrinks, in closed form',
  bodyRaw: '<div class="col">'
    + C.pRaw('On the circle of length 6 take H = ½p² − m (their Example 2.7 with H₀ = ½p², f(m) = m, g = 0; Assumptions 1⁺ and 2–7A hold). Look for a parabolic bump of density with a self-similar velocity:')
    + C.eq(C.esc('m(t, x) = ( A(t) − B(t) x² )₊,   |x| < r(t);      u(t, x) = a(t) x² + b(t)'))
    + C.pRaw('The transport equation forces the velocity −u_x = (ṙ/r) x and, with mass one, A = 3/(4r), B = 3/(4r³). The Hamilton–Jacobi equation on the support then forces one ordinary differential equation, r̈ = −3/(2r²): the crowd contracts. Starting at rest with r(0) = 2, the energy integral is ṙ² = 3(2 − r)/(2r), and the substitution r = 2 sin²θ makes everything elementary:')
    + C.eq(C.esc('t(θ) = √(2/3)(π − 2θ + sin 2θ),   a = √(3/2) cos θ / (4 sin³θ),   A = 3/(8 sin²θ),   B = 3/(32 sin⁶θ),   b = √(3/2)(θ − π/3)'))
    + C.pRaw('with θ running from π/2 down to π/3, so r(T) = 3/2 and T = √(2/3)(π/3 + √3/2) ≈ ' + T.toFixed(4) + '. What pulls the crowd inward is the terminal cost: u_T = a(T) φ(x), a parabola out to |x| = 9/4 and a C¹ cap beyond it so that u_T is periodic. Off the support the same u = aφ + b is a strict subsolution — on the parabola because A − Bx² < 0 past r, on the cap because φ′ ≤ 2ρ₀ and φ ≥ ρ₀² give A − Bρ₀² < 0. So (m, u) is an MFG solution in the sense of their Definition 1.1, with a vacuum, and u is one member of U(m).')
    + '</div>'
}));

O.push(C.section({
  lab: '§3 · the certificates', title: 'The pair, the maximal one, and the gap',
  bodyRaw: '<div class="col">'
    + C.plainList([
      { b: 'The pair.', text: 'On every support cell the HJ residual −u_t + ½u_x² − m and the transport residual m_t − (m u_x)_x are evaluated in intervals and must enclose zero; on every vacuum cell the strict subsolution inequality is decided by a corner bound (the identity A − Bx² is monotone in |x| and in r, so its supremum over a cell sits at a corner and is evaluated there, where the raw interval evaluation would have refused); u(T) = u_T because b(T) is enclosed at zero.' },
      { b: 'The maximal one.', text: 'For continuous bounded m the maximal subsolution is the value of the control problem with running cost ½|ẋ|² + m and terminal cost u_T — the classical identification, assumed and cited. Since m ≥ 0, the free Hopf–Lax value min_y [d(x,y)²/(2(T − t)) + u_T(y)] is a lower bound, computed by a rigorous branch-and-bound over y. The cheapest path proved clear of the crowd is an upper bound: the resting path always is, because the support only shrinks; a surviving minimiser\'s straight path is, when sixteen interval checks along it stay outside r(s). Where every minimiser is clear the bracket closes and u* = HL exactly.' },
      { b: 'The gap.', text: 'Maximality says u* ≥ u. On every decided cell the upper end of u* must clear the lower end of u, and it does; on ' + cnt.gapProven + ' cells the lower end of u* clears the upper end of u, which proves the gap positive there. That gap is the space Theorem 1.8 leaves for the other members of U(m).' }
    ])
    + '</div>'
    + C.figure({ svgRaw: FIG_MAP, caption: 'Figure 1 · The space–time cylinder, cell by cell. The central band is the support, where u* = u by the theorem; the dashed curves are r(t); the seam of hatched cells is where the moving boundary crosses a cell at this budget. Outside, every cell is decided: tight where the free path is clear, a wider bracket where the free minimiser would dive into the crowd and only a clear path bounds it from above.' })
}));

O.push(C.section({
  lab: '§4 · drawn', title: 'Three times, two value functions',
  bodyRaw: '<div class="col">'
    + C.pRaw('At each time the shaded band is the support. Inside it the two functions are the same function. Outside it the dotted parabola is u, one admissible value function; the solid bracket is where u* lives. Early on, the bracket is wide far from the crowd: a free path from there has time to dive into the crowd, so the free value is only a lower bound and the resting path only an upper one. Near the horizon the bracket collapses and u* is the Hopf–Lax value.')
    + '</div>'
    + C.figure({ svgRaw: FIG_P0, caption: 'Figure 2 · t ∈ [' + P0.t[0].toFixed(3) + ', ' + P0.t[1].toFixed(3) + '). The gap is largest here, and so is the bracket. The sawtooth in the vacuum is the upper bound switching between two clear paths, the resting one and a straight one, cell by cell; both are rigorous and the smaller is taken.' })
    + C.figure({ svgRaw: FIG_P2, caption: 'Figure 3 · t ∈ [' + P2.t[0].toFixed(3) + ', ' + P2.t[1].toFixed(3) + '). The support has narrowed toward 3/2.' })
    + C.figure({ svgRaw: FIG_P4, caption: 'Figure 4 · t ∈ [' + P4.t[0].toFixed(3) + ', ' + P4.t[1].toFixed(3) + '). Just before the horizon: u* is decided almost everywhere and meets u at the support\'s edge.' })
}));

O.push(C.section({
  lab: '§5 · the honest boundary', title: 'What is claimed, and what is not',
  bodyRaw: '<div class="col">' + C.plainList([
    { b: 'Claimed.', text: 'The explicit pair is an MFG solution with a vacuum, verified cell by cell; the maximal value function is enclosed on every vacuum cell and equals u on the support; the gap is positive where proved.' },
    { b: 'Assumed, and cited.', text: 'That the maximal subsolution of Theorem 1.8 is the control value (the viscosity solution) for this Lipschitz density — classical, and the paper itself lists the general characterisation as open.' },
    { b: 'Ours, and said so.', text: 'The instance. The paper has no worked example; the contracting parabolic bump is the first-order analogue of the parabolic profiles of gas dynamics and is used, not claimed. The literature gate is instruments/maxval/FINDINGS_LIT.md.' },
    { b: 'Refused.', text: 'The ' + cnt.REFUSED + ' cells the moving boundary passes through. A finer grid shrinks them; nothing about them is claimed.' }
  ]) + '</div>'
}));

O.push(C.section({
  lab: '§6 · check it', title: 'Twenty seconds on your machine',
  bodyRaw: '<div class="col">'
    + C.code('node instruments/maxval/battery.js     # re-derives the record, 18 checks, 5 red controls\nnode instruments/maxval/run.js --check  # the record, re-derived and compared byte for byte')
    + C.pRaw('The record is <span class="m">certs/maxval-cylinder.json</span>: every cell\'s standing, u, u*, gap and m, plus the closed forms and the code\'s sha256.')
    + '</div>'
}));

O.push(C.section({
  lab: 'references', title: 'Sources',
  bodyRaw: '<div class="col">' + C.plainList([
    { raw: 'Diogo Gomes, Melih Üçer, <em>Existence and Structure for First-Order Time-Dependent Mean-Field Games with Local Couplings</em>, <a href="https://arxiv.org/abs/2606.28378">arXiv:2606.28378</a> (2026) — Definitions 1.1 and 1.7, Theorem 1.8, Corollary 1.9, Example 2.7.' },
    { raw: 'M. Bardi, I. Capuzzo-Dolcetta, <em>Optimal Control and Viscosity Solutions of Hamilton–Jacobi–Bellman Equations</em>, Birkhäuser 1997 — the maximal subsolution as the value function.' },
    { raw: 'The grammar: design/grammar.js on this site — DECIDED, COMPUTED, CHOSEN, REFUSED, as stroke.' }
  ]) + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-maxval.js @ git ' + gitrev
  + ' — certs/maxval-cylinder.json re-derived during this build and compared byte for byte (identical, or no page). Code sha256 ' + REC.provenance.sha256.slice(0, 16) + '…') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'maxval.html'),
  TPL.render({ title: 'The maximal value function, drawn · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/maxval.html',
    desc: 'Gomes and Üçer’s maximal value function drawn on an explicit first-order game with a vacuum: the pair verified cell by cell, the maximal solution enclosed, the chosen one dotted beneath it, the gap proved.' }));
console.log('reports/maxval.html written: record re-derived identically (' + cnt.SUPPORT + '/' + cnt.DECIDED + '/' + cnt.REFUSED + ') @ git ' + gitrev);
