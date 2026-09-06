#!/usr/bin/env node
/* build-report-monoflow.js — generate reports/monoflow.html: monotone, and
   provably not a gradient — two certificates on one MFG equilibrium.

   The gate: certs/monoflow-spectrum.json is re-derived during this build
   (node instruments/monoflow/run.js --check) and the page refuses on a byte.

   usage: node tools/build-report-monoflow.js */
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
const die = (m) => { console.error('MONOFLOW REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

try { cp.execSync('node instruments/monoflow/run.js --check', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { die('the live re-derivation differs from certs/monoflow-spectrum.json:\n' + (e.stderr || e.stdout || e.message)); }
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'monoflow-spectrum.json'), 'utf8'));
if (REC.verdict !== 'VERIFIED') die('record verdict is ' + REC.verdict);
const by = Object.fromEntries(REC.instances.map(i => [i.id, i]));
const decided = REC.instances.filter(i => i.verdict === 'NOT A GRADIENT FLOW');
const undecided = REC.instances.filter(i => i.verdict === 'NOT DECIDED');
if (decided.length !== 5 || undecided.length !== 2) die('expected 5 decided and 2 undecided instances');
if (!REC.instances.every(i => i.form.contains)) die('the Lasry–Lions form did not return c/2 somewhere');

const { CAT, CTX } = TK.CHART;
const fmtI = (iv, d) => '[' + iv[0].toFixed(d) + ', ' + iv[1].toFixed(d) + ']';
const mid = (iv, d) => ((iv[0] + iv[1]) / 2).toFixed(d);
const label = (i) => '(σ, c, A) = (' + i.sigma + ', ' + i.c + ', ' + i.A + ')' + (i.branch === 'herding' ? ', herding branch' : '');

/* ---- figure 1: the complex plane ------------------------------------------ */
const FIG_PLANE = (() => {
  const keys = [
    { token: CAT[0], t: 'certified pair (decided): Im μ enclosed away from 0', kind: 'line' },
    { token: CAT[2], t: 'closed-form modes at the constant solution, k = 1..3 (asserted from the formula)', kind: 'dash' },
    { token: CTX, t: 'real eigenvalues reached by iteration on the NOT DECIDED instances (floats)', kind: 'dash' }
  ];
  const nLeg = CH.legendLines(keys, 900 - 62 - 22);
  const o = { w: 900, h: 320 + nLeg * 19, x0: -40, x1: 6, y0: -1, y1: 20, padB: 28 + 22 + 5 + nLeg * 19,
    xLabel: 'Re μ  (eigenvalue of the flow Jacobian)', yLabel: 'Im μ' };
  const f = CH.frame(o);
  const out = [CH.open({ w: f.w, h: f.h, alt: 'The complex plane of the flow Jacobian: five certified eigenvalues drawn as solid marks with imaginary parts between about 4.4 and 18, '
    + 'the closed-form modes of the constant solutions as dashed hollow marks, and the real eigenvalues reached on the two undecided instances as short dashed ticks on the real axis.' })];
  out.push(CH.axes(f, Object.assign({}, o, {
    xTicks: [-40, -30, -20, -10, 0].map(v => ({ v, t: String(v) })),
    yTicks: [0, 5, 10, 15, 20].map(v => ({ v, t: String(v) })) })));
  /* the real axis */
  out.push('    <line x1="' + f.L + '" y1="' + f.py(0).toFixed(1) + '" x2="' + (f.L + f.pw) + '" y2="' + f.py(0).toFixed(1) + '" stroke="' + CTX + '" stroke-width="1" stroke-dasharray="' + G.GUIDE + '"/>');
  /* closed-form modes at (½, 1) and (½, −12), k = 1..3, dashed hollow */
  for (const id of ['C1', 'H0']) {
    const i = by[id];
    for (const m of i.modes.slice(0, 3)) {
      const pts = m.complex ? [[m.re, m.im]] : [[m.mu1, 0], [m.mu2, 0]];
      for (const p of pts) {
        if (p[0] < o.x0 || p[0] > o.x1) continue;
        out.push('    <circle cx="' + f.px(p[0]).toFixed(1) + '" cy="' + f.py(p[1]).toFixed(1) + '" r="6" fill="none" stroke="' + CAT[2] + '" stroke-width="2" stroke-dasharray="' + G.CLAIM_SM + '"/>');
      }
    }
  }
  /* real eigenvalues reached on R1 and H0 */
  for (const i of undecided) for (const t of i.tried) {
    if (t.mu[0] < o.x0 || t.mu[0] > o.x1) continue;
    const x = f.px(t.mu[0]);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + (f.py(0) - 7).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + (f.py(0) + 7).toFixed(1) + '" stroke="' + CTX + '" stroke-width="2" stroke-dasharray="' + G.CLAIM_SM + '"/>');
  }
  /* certified pairs; instances whose eigenvalues nearly coincide share one label, set to the left */
  const placed = [];
  for (const i of decided) {
    const p = i.certified[0];
    const mx = (p.mu[0][0] + p.mu[0][1]) / 2, my = (p.mu[1][0] + p.mu[1][1]) / 2;
    const x = f.px(mx), y = f.py(my);
    out.push('    <circle ' + CH.hit('cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6" fill="' + CAT[0] + '" stroke="' + TK.CHART.SURFACE + '" stroke-width="2"',
      i.id + ' · ' + label(i), 'μ ∈ ' + fmtI(p.mu[0], 6) + ' + i ' + fmtI(p.mu[1], 6)) + '/>');
    const g = placed.find(q => Math.abs(q.mx - mx) < 1.5 && Math.abs(q.my - my) < 1.5);
    if (g) g.ids.push(i.id); else placed.push({ mx, my, x, y, ids: [i.id] });
  }
  for (const g of placed) out.push(CH.txt(g.x - 11, g.y + 4, g.ids.join(' · '), 't-lab', 'end'));
  out.push(CH.legend(keys, f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
})();

/* ---- figure 2: the coupling axis — where the constant solution's modes go complex ---- */
const FIG_AXIS = (() => {
  const lam = (k) => (2 * Math.PI * k) * (2 * Math.PI * k);
  const rows = [];
  for (const [sig, ks] of [[0.5, [1, 2]], [0.3, [1]]]) {
    for (const k of ks) {
      const lo = lam(k) * (1 - 2 * sig), hi = lam(k) * (1 + 2 * sig);
      rows.push({ k: 'σ = ' + sig + ', mode k = ' + k, segs: [
        { x0: -20, x1: Math.max(-20, Math.min(lo, 100)), token: CTX, k: 'real eigenvalues (closed form)' },
        { x0: Math.max(-20, Math.min(lo, 100)), x1: Math.max(-20, Math.min(hi, 100)), token: CAT[0], k: 'non-real pair (closed form)' },
        { x0: Math.max(-20, Math.min(hi, 100)), x1: 100, token: CTX, k: 'real eigenvalues (closed form)' }
      ], marks: (sig === 0.5 && k === 1) ? [{ x: -12, t: 'H0 · H1 · H2', anchor: 'start' }, { x: 1, t: 'C1 · M1 · M2', anchor: 'start', row: 1 }, { x: -(0.25) * (2 * Math.PI) ** 2, t: 'c* (pitchfork)', anchor: 'end', row: 1 }]
        : (sig === 0.3 ? [{ x: 2, t: 'R1', anchor: 'start' }] : []) });
    }
  }
  return CH.segments({
    w: 900, x0: -20, x1: 100, rows, rowH: 44,
    xTicks: [-20, 0, 20, 40, 60, 80, 100].map(v => ({ v, t: String(v) })),
    xLabel: 'coupling  c   (c ≥ 0 monotone, c < 0 herding; light: the mode\'s pair is non-real at the constant solution)',
    keys: [{ token: CAT[0], t: 'non-real pair at the constant solution (closed form)', kind: 'line' }, { token: CTX, t: 'real eigenvalues at the constant solution (closed form)', kind: 'line' }],
    alt: 'Three rows over the coupling axis from −20 to 100: for σ = ½ the mode-1 window is 0 < c < 79 and the mode-2 window 0 < c < 316, so the whole positive axis shown is non-real; for σ = 0.3, mode 1 is non-real only between 15.8 and 63.2, which leaves c = 2 real. The instances are marked at c = −12, 1 and 2, and the pitchfork c* at −9.87.'
  });
})();

/* ---- the table ---- */
const rows = REC.instances.map(i => {
  const p = i.certified[0];
  return [i.id, label(i), i.monotone ? 'monotone (c ≥ 0)' : 'not monotone (c < 0, witness c/2 = ' + (i.c / 2) + ')',
    i.verdict === 'NOT A GRADIENT FLOW' ? { raw: '<b>not a gradient flow</b> · μ ∈ ' + C.m(fmtI(p.mu[0], 4) + ' + i ' + fmtI(p.mu[1], 4)) } : { raw: '<em>not decided</em> · ' + i.tried.length + ' eigenvalues reached, all real' },
    i.galerkinRadius.toExponential(1) + ' · ' + i.pde.r.toExponential(1)];
});

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · the record is re-derived at every build',
  title: 'Monotone, and provably not a gradient',
  deck: 'The monotone flow is how the Gomes school computes stationary mean-field games: an operator that is monotone in the sense '
    + 'of Lasry and Lions, so a contracting flow finds its zero. This page puts two certificates on the same equilibrium. The first '
    + 'says the linearised operator is monotone exactly when the coupling is non-negative, and it is one line. The second says '
    + 'the flow is not a gradient flow under any Riemannian metric near that equilibrium, because its Jacobian has a non-real '
    + 'eigenvalue pair, enclosed. Monotone operator theory is needed here because energy descent is not available. Where every '
    + 'eigenvalue reached is real, the page says not decided and claims nothing.'
}));

O.push(C.tldr({
  findingRaw: 'At five certified equilibria of the quadratic stationary MFG, three monotone and two on the herding branch, the '
    + 'Jacobian of the monotone flow has a certified eigenvalue with Im μ between ' + Math.min(...decided.map(i => i.certified[0].mu[1][0])).toFixed(2)
    + ' and ' + Math.max(...decided.map(i => i.certified[0].mu[1][1])).toFixed(2) + ', so the flow is not a gradient flow for any metric. '
    + 'At the same equilibria the Lasry–Lions form evaluated from the same Jacobian is c/2 at δm = cos 2πx, as the theory says.',
  mechanismRaw: 'A finite-dimensional Krawczyk box for the Galerkin equilibrium; the interval Jacobian of the flow over that box; '
    + 'a second Krawczyk box for an eigenpair, with the imaginary part enclosed away from zero. A gradient flow\'s Jacobian is '
    + 'similar to a symmetric matrix at an equilibrium, so a non-real pair excludes every metric and energy at once.',
  checkRaw: C.m('node instruments/monoflow/battery.js') + ' (16 checks, 5 red controls, under a second) re-derives the record and '
    + 'compares it byte for byte; the control at A = 0 must contain the closed-form eigenvalue.'
}));

O.push(C.stats([
  { k: 'not a gradient flow', v: '5 of 7', role: 'held', n: 'C1, M1, M2 (monotone) and H1, H2 (herding): a certified non-real pair each' },
  { k: 'not decided', v: '2 of 7', role: 'warn', n: 'R1 (σ = 0.3, c = 2) and H0 (constant, c = −12): every eigenvalue reached is real; nothing claimed' },
  { k: 'the control', v: 'closed form inside', role: 'held', n: 'at the constant solution the mode-1 eigenvalue has a formula; the certified pair contains it' },
  { k: 'the form', v: 'c/2, every instance', role: 'held', n: '⟨DA v, v⟩ = c∫δm² + ∫m(δu\')², checked from the assembled Jacobian at δm = cos 2πx' },
  { k: 'radii', v: '≤ ' + Math.max(...REC.instances.map(i => i.galerkinRadius)).toExponential(0), n: 'Galerkin box; the PDE enclosure of the same candidate by validate.js is ≤ ' + Math.max(...REC.instances.map(i => i.pde.r)).toExponential(0) },
  { k: 'falsifiers', v: 'MUST REFUSE', role: 'warn', n: 'a symmetric matrix, a candidate moved 0.5, a wrong σ in the closed form, a perturbed equilibrium, a flipped coupling sign' }
]));

O.push(C.section({
  lab: '§1 · the flow', title: 'What the monotone flow is',
  bodyRaw: '<div class="col">'
    + C.pRaw('The model is the quadratic stationary mean-field game of <a href="mfg-observatory.html">the observatory</a> on the torus, with coupling c and potential A cos 2πx:')
    + C.eq(C.esc('−σ u″ + ½ (u′)² + ρ = c m + A cos 2πx,     −σ m″ − (m u′)′ = 0,     ∫m = 1,  ∫u = 0,  m > 0'))
    + C.pRaw('Lasry and Lions read it as the zero of one operator on the pair (m, u), paired in L²:')
    + C.eq(C.esc('A(m, u) = ( c m + V + σ u″ − ½ (u′)²  ,  −σ m″ − (m u′)′ )'))
    + C.pRaw('and <a href="https://doi.org/10.1007/s13235-016-0203-5">Almulla, Ferreira and Gomes</a> (§2.6) run the flow (ṁ, u̇) = −A(m, u), with the '
      + 'zero mode held so that mass and mean are preserved. Because A is monotone, the flow contracts in L² and its limit is the '
      + 'equilibrium. The chapter by <a href="https://arxiv.org/abs/2502.20091">Ferreira, Gomes and Tada</a> is the survey of that method. '
      + 'Everything below is about this flow on the even Fourier–Galerkin space of order N, the same truncation the lab\'s certificates live in.')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · certificate 1', title: 'Monotone, in one exact line',
  bodyRaw: '<div class="col">'
    + C.pRaw('Linearise A at any pair with m > 0 and pair the result with the direction itself. Two integrations by parts on the torus cancel every cross term, and what remains is')
    + C.eq(C.esc('⟨DA(m,u)(δm, δu), (δm, δu)⟩  =  c ∫ δm²  +  ∫ m (δu′)²'))
    + C.pRaw('So the linearised operator is positive semidefinite exactly when c ≥ 0. That is the Lasry–Lions condition, and it is decided by '
      + 'inspection, not by computation. For c < 0 the direction δm = cos 2πx, δu = 0 is an exact negative witness with value c/2. '
      + 'The instrument evaluates the form from the interval Jacobian it assembles at every instance and requires c/2 back: '
      + REC.instances.map(i => i.id + ' → ' + mid(i.form.value, 4)).join(', ') + '. That is a check on the assembly, and the page calls it one.')
    + C.pRaw('Two walls on the coupling axis are different things. c = 0 is where monotonicity ends. c* = −σ²(2π)² = −9.87 is where the constant '
      + 'solution\'s linearisation becomes singular and two more solutions are born, which is <a href="mfg-cap.html">the multiplicity theorem</a>. '
      + 'Between them, for −9.87 < c < 0, the operator is not monotone and the constant solution is still the only one enclosed.')
    + '</div>'
}));

O.push(C.section({
  lab: '§3 · certificate 2', title: 'Not a gradient flow, under any metric',
  bodyRaw: '<div class="col">'
    + C.pRaw('A gradient flow with respect to a Riemannian metric G and an energy E is ż = −G(z)⁻¹∇E(z). At an equilibrium its Jacobian is '
      + '−G⁻¹ Hess E, which is similar to −G^{−½} Hess E G^{−½}, a symmetric matrix. Its spectrum is real. So if the Jacobian of a flow at an '
      + 'equilibrium has one non-real eigenvalue, no choice of G and E makes the flow a gradient flow near that point. This is elementary, '
      + 'and it is the whole argument.')
    + C.plainList([
      { b: 'The equilibrium, enclosed.', text: 'A Krawczyk box for the Galerkin system in the (ρ, p, b) variables of the lab\'s validator, from the same float candidate the lab certifies; radius at most ' + Math.max(...REC.instances.map(i => i.galerkinRadius)).toExponential(1) + '. The same candidate is also enclosed as a solution of the PDE by validate.js, so both radii are on the page.' },
      { b: 'The Jacobian, over the box.', text: 'The flow\'s Jacobian in the (m, u) coefficients, every entry an interval over the equilibrium box, assembled from the validator\'s own Jacobian rows so that a rule defined twice cannot diverge.' },
      { b: 'The eigenpair, enclosed.', text: 'A float eigenpair by complex inverse iteration from the closed-form mode as the shift; then a second Krawczyk box on the 2n+2 real unknowns (the vector, real and imaginary parts, and μ), with the phase fixed by one component. The imaginary part of μ comes back as an interval; the certificate requires it not to contain zero.' }
    ])
    + C.pRaw('At the constant solution everything is a formula. Per Fourier mode k with λ = (2πk)² the block is [[−c, σλ],[−σλ, −λ]], with eigenvalues '
      + '½(−(c + λ) ± √((c − λ)² − 4σ²λ²)), non-real exactly when λ(1 − 2σ) < c < λ(1 + 2σ). For σ = ½ that window is 0 < c < 2λ, so at c = 1 '
      + 'every mode is a non-real pair; for σ = 0.3 and c = 2 no mode is, which is why R1 comes back real and undecided.')
    + '</div>'
    + C.figure({ svgRaw: FIG_PLANE, caption: 'Figure 1 · The complex plane. Solid marks: the five certified eigenvalues, each an interval box too small to draw, at the non-constant equilibria M1, M2 and the herding branch H1, H2, and at the control C1. Dashed hollow marks: the closed-form modes of the constant solutions at c = 1 and c = −12. Ticks on the real axis: the real eigenvalues reached on R1 and H0, floats, undecided.' })
    + C.figure({ svgRaw: FIG_AXIS, caption: 'Figure 2 · Where the constant solution\'s modes go non-real, by the closed form: the window λ_k(1 − 2σ) < c < λ_k(1 + 2σ) on the coupling axis. For σ = ½ it starts at c = 0, so monotone and non-gradient coincide on the whole positive axis; for σ = 0.3 it starts at 15.8, leaving R1 at c = 2 real. The instances and the pitchfork c* are marked.' })
}));

O.push(C.section({
  lab: '§4 · the instances', title: 'Seven equilibria, seven verdicts',
  bodyRaw: '<div class="col">'
    + C.pRaw('Three monotone equilibria at c = 1 (the constant control and two potentials), one monotone equilibrium at σ = 0.3, and three at the herding coupling c = −12 of the multiplicity theorem: the constant solution and the symmetry-broken branch with and without a potential. The herding branch is not monotone, and it is not a gradient either.')
    + '</div>'
    + C.table({ cols: [{ h: 'id' }, { h: 'instance' }, { h: 'certificate 1' }, { h: 'certificate 2' }, { h: 'radii (Galerkin · PDE)', cls: 'v' }], rows })
    + '<div class="col">'
    + C.pRaw('H0 deserves its own sentence. At the constant solution with c = −12 the closed form gives a real spectrum with one positive eigenvalue, '
      + mid([by.H0.tried.find(t => t.mu[0] > 0).mu[0], by.H0.tried.find(t => t.mu[0] > 0).mu[0]], 3) + ': the monotone flow leaves the constant state, which is exactly why the flow finds '
      + 'the symmetry-broken branch H1 in that regime and why <a href="mfg-cap.html">the multiplicity page</a> had to enter that branch by continuation rather than by Newton from the constant.')
    + '</div>'
}));

O.push(C.section({
  lab: '§5 · the honest boundary', title: 'What is claimed, and what is not',
  bodyRaw: '<div class="col">' + C.plainList([
    { b: 'Claimed.', text: 'At C1, M1, M2, H1, H2: the flow Jacobian at the enclosed Galerkin equilibrium has an eigenvalue with Im μ enclosed away from zero, so the flow is not a gradient flow under any Riemannian metric near that equilibrium, on the Galerkin space of the order recorded. The Lasry–Lions form returns c/2 at the witness direction on every instance.' },
    { b: 'Not claimed.', text: 'Anything at R1 or H0: a real spectrum reached by iteration is not a proof of a real spectrum, and a real spectrum would not prove a gradient structure. Any statement about the infinite-dimensional flow: the theorem is finite-dimensional, at the order N the lab certifies at, and the PDE enclosure of the same candidate is reported beside it for scale.' },
    { b: 'Not new.', text: 'That forward–backward MFG systems are not gradient flows is structure, not discovery; potential MFGs are variational in the saddle sense, which is a different thing. Monotonicity itself is decided by the one-line form. What is new is narrow: the pair is certified, at an enclosed equilibrium, in interval arithmetic, with a falsifier on each step. The literature gate is instruments/monoflow/FINDINGS_LIT.md.' },
    { b: 'Why it matters to the method.', text: 'A monotone flow that were secretly a gradient flow would admit an energy and its whole convergence theory would be Lyapunov\'s. The certificate says the monotone-operator route is not a disguised descent at these equilibria: the machinery is needed.' }
  ]) + '</div>'
}));

O.push(C.section({
  lab: '§6 · check it', title: 'Under a second on your machine',
  bodyRaw: '<div class="col">'
    + C.code('node instruments/monoflow/battery.js     # re-derives the record, 16 checks, 5 red controls\nnode instruments/monoflow/run.js --check  # the record, re-derived and compared byte for byte')
    + C.pRaw('The record is <span class="m">certs/monoflow-spectrum.json</span>; it carries the sha256 of the code that made it and the float candidates, so every box can be re-opened.')
    + '</div>'
}));

O.push(C.section({
  lab: 'references', title: 'Sources',
  bodyRaw: '<div class="col">' + C.plainList([
    { raw: 'Noha Almulla, Rita Ferreira, Diogo Gomes, <em>Two Numerical Approaches to Stationary Mean-Field Games</em>, Dynamic Games and Applications 7(4) 657–682 (2017), <a href="https://doi.org/10.1007/s13235-016-0203-5">doi:10.1007/s13235-016-0203-5</a> — §2.3 the monotone operator, §2.6 the monotone flow.' },
    { raw: 'Rita Ferreira, Diogo Gomes, Teruo Tada, <em>An introduction to monotonicity methods in mean-field games</em>, <a href="https://arxiv.org/abs/2502.20091">arXiv:2502.20091</a> (2025).' },
    { raw: 'J.-M. Lasry, P.-L. Lions, <em>Mean field games</em>, Jpn. J. Math. 2 (2007) 229–260 — the monotonicity condition.' },
    { raw: 'The kernel: legacy/core/mfg (the mfg-cap validator), <a href="mfg-cap.html">Two solutions, provably</a> and <a href="mfg-observatory.html">the regime observatory</a> on this site.' }
  ]) + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-monoflow.js @ git ' + gitrev
  + ' — certs/monoflow-spectrum.json re-derived during this build and compared byte for byte (identical, or no page). Code sha256 ' + REC.provenance.sha256.slice(0, 16) + '…') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'monoflow.html'),
  TPL.render({ title: 'Monotone, and provably not a gradient · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/monoflow.html',
    desc: 'Two certificates on one mean-field-game equilibrium: the Lasry–Lions form is c∫δm² + ∫m(δu′)² exactly, and the monotone flow has a certified non-real eigenvalue, so it is not a gradient flow under any metric.' }));
console.log('reports/monoflow.html written: record re-derived identically (5 decided, 2 undecided) @ git ' + gitrev);
