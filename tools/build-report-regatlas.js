#!/usr/bin/env node
/* build-report-regatlas.js — generate reports/regatlas.html: the regularization, measured.
   certs/regatlas.json is re-derived during the build and compared byte for byte.
   usage: node tools/build-report-regatlas.js */
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
const die = (m) => { console.error('REGATLAS REPORT REFUSED: ' + m); process.exit(1); };
/* WARRANT v2.1 (design/WARRANT.md), 2026-10-28. A proved cell, its radius, its κ, its density floor and every decided
   distance are exact arithmetic over intervals: DECIDED, plain and solid. Three things on this page were not:
   - the minimum density at a refused cell is the float candidate sampled at 512 points: COMPUTED;
   - the curves of κ and of the distance were straight segments drawn between knots ten amplitudes or four ε apart,
     and nothing decided the values between them: one curve of the many the knots admit, CHOSEN (dotted), with the
     knots themselves drawn as the decided dots they are;
   - the diagonal of the distance figure is a guide, and was drawn in the COMPUTED pattern; it is the guide pattern now.
   And PROVED rests on bounds derived by hand: §4 names that premise with its grade (rule 11), without touching the
   verdict word. (`WR`, because `W` is a figure width below.) */
const WR = require(path.join(ROOT, 'playground', 'warrant.js'));
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

try { cp.execSync('node instruments/regatlas/run.js --check', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { die('the live re-derivation differs from certs/regatlas.json:\n' + (e.stderr || e.stdout || e.message)); }
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'regatlas.json'), 'utf8'));
if (!REC.cells.filter(c => c.ok).every(c => c.kappa < 1 && c.mLow > 0)) die('a proved cell has κ ≥ 1 or no density floor');
if (!REC.frontier.every(f => f.monotone)) die('a row of the atlas is not proved-then-refused');
const { CAT, CTX, SURFACE } = TK.CHART;
/* the battery the page names, run here so its counts are read, not typed */
const tBat = Date.now();
const bat = cp.spawnSync('node', [path.join(ROOT, 'instruments', 'regatlas', 'battery.js')], { cwd: ROOT });
const batSecs = (Date.now() - tBat) / 1000;
const bm = /ALL PASS\s+\((\d+) checks, (\d+) red controls\)/.exec(String(bat.stdout) + String(bat.stderr));
if (bat.status !== 0 || !bm) die('the regatlas battery did not pass clean:\n' + (String(bat.stdout) + String(bat.stderr)).slice(-600));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);
if (batSecs > 180) die('the battery took ' + batSecs.toFixed(0) + ' s: "about half a minute" would be false');
const BATTIME = WR.value('about half a minute', WR.COMPUTED, { title: 'a wall-clock on the machine that built this page — a measurement, nothing decided it' });
/* FIVE FALSIFIERS, FOUR FIRED (2026-10-28). The page said "each certificate carries five falsifiers, and the battery
   fires them". derive.js writes five into every certificate; the battery's red controls fire four (the shift, the
   wrong sign, the candidate on no branch, the dip below zero) and a fifth of its own (a refused cell re-certified with
   a wider ν). The third falsifier, a principal coefficient forced negative, has no red control. Read from the code. */
const DERIVE = fs.readFileSync(path.join(ROOT, 'instruments', 'regatlas', 'derive.js'), 'utf8');
const BATSRC = fs.readFileSync(path.join(ROOT, 'instruments', 'regatlas', 'battery.js'), 'utf8');
const falsifiers = (/const falsifier = \[([\s\S]*?)\];/.exec(DERIVE) || [, ''])[1].match(/'[^']+'/g) || [];
const redNames = BATSRC.match(/check\('X\d\s+RED ok: [^']+'/g) || [];
if (!(falsifiers.length === 5 && /principal coefficient forced negative/.test(falsifiers[2]) && redNames.length === nReds && !redNames.some((x) => /principal|coefficient forced/.test(x)))) die('the falsifier sentence would be false: ' + falsifiers.length + ' falsifiers, ' + redNames.length + ' red controls');
const KERNEL = fs.readFileSync(path.join(ROOT, 'instruments', 'regatlas', 'kernel.js'), 'utf8');
if (!/KEXP = Math\.max\(6 \* N,/.test(KERNEL)) die('Z1 is no longer explicit to six times N');
const Ns = REC.cells.map((c) => c.N);
if (!(Math.min(...Ns) === 24 && Math.max(...Ns) === 40)) die('the candidates are not N = 24 to 40 modes');
if (!(REC.cells.length === 50 && REC.amps.join() === '0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9' && REC.eps.join() === '0,0.01,0.1,0.3,1')) die('the atlas is not fifty cells, A from 0 to 0.9, ε in {0, 0.01, 0.1, 0.3, 1}');
if (!/K2 .*three proved cells/.test(BATSRC)) die('the finite-difference check is not at three proved cells');
if (!(REC.xs.length === 129 && REC.profiles.filter((p) => !p.refused).every((p) => p.r < 1e-9))) die('the profiles are not 129 samples certified below 1e−9');
const dAt = (eps) => REC.distances.filter((d) => d.eps === eps && d.decided);
if (!(dAt(0.01).every((d) => d.hi > 0.9 * 0.01 && d.hi < 1.4 * 0.01) && dAt(1).every((d) => d.hi > 0.3 && d.hi < 0.4))) die('"about ε at 0.01, a third of ε at 1" would be false');
/* A PRINTED BOUND ROUNDS OUTWARD (rule 8): κ and a radius are upper bounds, a density floor a lower one. f2/f3 rounded
   to nearest, and printed two certified floors inward (ε = 0.1: 0.34070 as 0.341; ε = 1: 0.29858 as 0.299) and 20 of
   the 34 κ in the atlas below their bound. */
const upTo = (v, d) => (Math.ceil(v * 10 ** d) / 10 ** d).toFixed(d), downTo = (v, d) => (Math.floor(v * 10 ** d) / 10 ** d).toFixed(d);
const eUp = (v) => { const k = Math.floor(Math.log10(v)); return (Math.ceil(v / 10 ** (k - 1)) * 10 ** (k - 1)).toExponential(1); };
/* the constant root of εu³ + u = 1 at ε = 1, read from the decided distance at A = 0 (1 − u, to the radii) */
const d01 = REC.distances.find((d) => d.A === 0 && d.eps === 1);
if (!(d01 && d01.decided && (1 - d01.hi).toFixed(3) === (1 - d01.lo).toFixed(3))) die('the constant root at ε = 1 is not decided to three places');
const uRoot = (1 - d01.hi).toFixed(3);
const find = (A, eps) => REC.cells.find(c => c.A === A && c.eps === eps);
const e1 = (v) => v.toExponential(1), f2 = (v) => v.toFixed(2), f3 = (v) => v.toFixed(3);
const f0 = REC.frontier[0], fLast = REC.frontier[REC.frontier.length - 1];
/* D10: a refused cell's float min m is a record cell, read through its address and printed to three places (f3) */
const mFloat = (c) => WR.val({ rec: { path: 'certs/regatlas.json', ptr: '/cells/' + REC.cells.indexOf(c) + '/mMinFloat' }, standing: WR.COMPUTED, fmt: 'fixed:3', why: 'the float candidate sampled at 512 points — computed, nothing decided it' });

/* ---- figure 1: the atlas ---- */
function atlasFig() {
  const W = 900, L = 70, T = 30, cw = 78, chh = 46, A = REC.amps, E = REC.eps;
  const H = T + E.length * chh + 60;
  const out = [CH.open({ w: W, h: H, alt: 'A grid of ten amplitudes by five regularization strengths: proved cells solid with their contraction factor written in, refused cells hatched; the proved region shrinks from the right as the regularization grows.' })];
  out.push(CH.HATCH_DEF);
  E.forEach((eps, r) => {
    const y = T + r * chh;
    out.push(CH.txt(L - 8, y + chh / 2 + 4, 'ε = ' + eps, 't-lab', 'end'));
    A.forEach((amp, k) => {
      const c = find(amp, eps), x = L + k * cw;
      if (c.ok) {
        const op = 0.12 + 0.6 * (1 - c.kappa);
        out.push('    <rect x="' + x + '" y="' + y + '" width="' + (cw - 3) + '" height="' + (chh - 3) + '" fill="' + CAT[0] + '" opacity="' + op.toFixed(2) + '" stroke="' + CAT[0] + '" stroke-width="1"/>');
        out.push('    <text x="' + (x + (cw - 3) / 2) + '" y="' + (y + chh / 2 + 4) + '" text-anchor="middle" font-family="var(--f-mono)" font-size="11" fill="' + (op >= 0.4 ? SURFACE : CAT[0]) + '">κ ' + upTo(c.kappa, 2) + '</text>');
      } else {
        out.push('    <rect x="' + x + '" y="' + y + '" width="' + (cw - 3) + '" height="' + (chh - 3) + '" fill="url(#hatch)" stroke="' + CTX + '" stroke-width="1"/>');
        out.push(CH.txt(x + (cw - 3) / 2, y + chh / 2 + 4, c.why.startsWith('Z1') ? 'Z1 ' + f2(c.Z1) : 'Z1 ≈ 1', 't-note', 'middle'));
      }
      out.push('    <rect ' + CH.hit('x="' + x + '" y="' + y + '" width="' + (cw - 3) + '" height="' + (chh - 3) + '" fill="transparent"', 'A = ' + amp + ', ε = ' + eps + ', N = ' + c.N, c.ok ? 'PROVED · r = ' + eUp(c.r) + ' · κ ≤ ' + upTo(c.kappa, 3) + ' · min m ≥ ' + downTo(c.mLow, 3) : 'REFUSED · ' + c.why.slice(0, 60)) + '/>');
    });
  });
  A.forEach((amp, k) => out.push(CH.txt(L + k * cw + (cw - 3) / 2, T + E.length * chh + 16, 'A = ' + amp, 't-lab', 'middle')));
  out.push(CH.txt(L, T + E.length * chh + 40, 'V = A cos 2πx · ε the strength of the 4-Laplacian term · a proved cell is lighter the smaller its κ', 't-note', 'start'));
  out.push(CH.close);
  return out.join('\n');
}

/* ---- figure 2: the distance to the unregularized solution ---- */
function distFig() {
  const LG = Math.log10;
  const As = [0, 0.3, 0.6].filter(A => REC.distances.some(d => d.A === A && d.decided));
  /* each decided distance is a dot (DECIDED); the segment between two is one curve of many the dots admit (CHOSEN) */
  const knots = As.map((A) => REC.distances.filter(d => d.A === A && d.decided).map(d => [LG(d.eps), LG(d.hi)]));
  const svg = CH.scatter({
    w: 900, h: 320, x0: LG(0.008), x1: LG(1.3), y0: LG(0.008), y1: LG(0.5), xLabel: 'ε, logarithmic', yLabel: 'distance, log',
    xTicks: [0.01, 0.1, 0.3, 1].map(v => ({ v: LG(v), t: String(v) })), yTicks: [0.01, 0.1, 0.3].map(v => ({ v: LG(v), t: String(v) })),
    pts: [].concat(...knots.map((ks, i) => ks.map(([x, y]) => ({ x, y, token: CAT[i], k: 'A = ' + As[i] + ', ε = ' + +(10 ** x).toPrecision(2), v: '‖u_ε − u_0‖_2 ≤ ' + (10 ** y).toExponential(4) + ', decided to the two radii' })))),
    curves: knots.map((ks) => ({ pts: ks, standing: WR.CHOSEN })).concat([{ pts: [[LG(0.01), LG(0.01)], [LG(1), LG(1)]], token: CTX, guide: true, k: '= ε' }]),
    keys: As.map((A, i) => ({ token: CAT[i], t: 'A = ' + A + ': ‖u_ε − u_0‖_2, decided to the two radii' })).concat([{ token: CTX, kind: 'guide', t: 'the line ‖u_ε − u_0‖ = ε (a guide)' }]),
    alt: 'On logarithmic axes the distance between the regularized and unregularized solutions rises with epsilon along the diagonal at small epsilon and bends below it toward epsilon equal one, for three amplitudes that lie nearly on top of one another.'
  });
  /* the diagonal is a GUIDE (design/grammar.js, 2 3): charts.js draws it and its swatch as hairlines in the guide
     pattern by option (`guide: true`, kind 'guide', 2026-10-29; until then both were re-patterned here by string
     surgery on the COMPUTED pattern). Anchored: exactly two, the curve and the swatch, or no page */
  const GUIDE_AS = 'stroke="' + CTX + '" stroke-width="1" stroke-dasharray="' + G.GUIDE + '"';
  if (svg.split(GUIDE_AS).length - 1 !== 2) die('the distance figure\'s guide is not one curve and one swatch');
  return svg;
}

/* ---- figure 3: the density at A = 0.6 for the proved ε ---- */
const provedProfiles = REC.profiles.filter(p => !p.refused);
const FIG_M = CH.lines({
  w: 900, h: 320, x0: 0, x1: 1, y0: 0, y1: 2, yTicks: [0, 0.5, 1, 1.5, 2].map(v => ({ v, t: String(v) })), xTicks: [0, 0.25, 0.5, 0.75, 1].map(v => ({ v, t: String(v) })), xLabel: 'x', yLabel: 'm(x) at A = 0.6', hover: false,
  series: provedProfiles.slice(0, CAT.length).map(p => ({ name: 'ε = ' + p.eps + ' (PROVED, r = ' + e1(p.r) + ')', pts: REC.xs.map((x, j) => [x, p.m[j]]) })),
  alt: 'Three nearly coincident density profiles over the torus, low near x = 0 where the potential peaks and high near x = one half, the regularized ones slightly flatter.'
});
const FIG_U = CH.lines({
  w: 900, h: 300, x0: 0, x1: 1, y0: 0.4, y1: 1.4, yTicks: [0.5, 1].map(v => ({ v, t: String(v) })), xTicks: [0, 0.25, 0.5, 0.75, 1].map(v => ({ v, t: String(v) })), xLabel: 'x', yLabel: 'u(x) at A = 0.6', hover: false,
  series: provedProfiles.slice(0, CAT.length).map(p => ({ name: 'ε = ' + p.eps, pts: REC.xs.map((x, j) => [x, p.u[j]]) })),
  alt: 'Three value-function profiles, nearly flat, the regularized ones lower by about epsilon.'
});

/* ---- figure 4: κ along A, three ε ---- */
const epsShown = [0, 0.1, 1].filter(e => REC.eps.includes(e)).slice(0, CAT.length);
const kKnots = epsShown.map(eps => REC.amps.map(A => find(A, eps)).filter(c => c.ok).map(c => [c.A, c.kappa]));
const FIG_KAPPA = CH.scatter({
  w: 900, h: 300, x0: 0, x1: 0.95, y0: 0, y1: 1.05, yTicks: [0, 0.5, 1].map(v => ({ v, t: String(v) })), xTicks: REC.amps.map(v => ({ v, t: String(v) })), xLabel: 'A, the amplitude of the potential', yLabel: 'κ = Z1 + Z2 r',
  hlines: [{ y: 1, token: CTX, t: 'κ = 1: no contraction' }],
  pts: [].concat(...kKnots.map((ks, i) => ks.map(([x, y]) => ({ x, y, token: CAT[i], k: 'ε = ' + epsShown[i] + ', A = ' + x, v: 'κ ≤ ' + upTo(y, 3) + ', decided' })))),
  curves: kKnots.map((ks) => ({ pts: ks, standing: WR.CHOSEN })),
  keys: epsShown.map((eps, i) => ({ token: CAT[i], t: 'ε = ' + eps + ' — proved cells only; the row stops where the certificate refuses' })),
  alt: 'Three rising curves of the contraction factor against amplitude, reaching one soonest for the strongest regularization.'
});

/* ---- tables ---- */
const T_FRONT = C.table({
  cols: [{ h: 'ε' }, { h: 'proved to A =', cls: 'v' }, { h: 'refused from A =', cls: 'v' }, { h: 'the first refusal, by name' }, { h: 'm floor, last proved (certified)', cls: 'v' }, { h: 'min m, first refused (float)', cls: 'v' }],
  rows: REC.frontier.map(f => { const last = find(f.lastProved, f.eps), first = f.firstRefused !== null ? find(f.firstRefused, f.eps) : null; return [String(f.eps), String(f.lastProved), first ? String(f.firstRefused) : '—', first ? (first.why.startsWith('Z1') ? 'Z1 = ' + f3(first.Z1) + ' ≥ 1 (worst explicit column; tail ' + f3(first.Z1tail) + ')' : 'Z1 = ' + f3(first.Z1) + ', so near 1 that no radius closes') : '—', downTo(last.mLow, 3), first ? { raw: mFloat(first) } : '—']; })
});
const T_DIST = C.table({
  cols: [{ h: 'A' }].concat(REC.eps.slice(1).map(e => ({ h: 'ε = ' + e, cls: 'v' }))),
  rows: REC.amps.map(A => [String(A)].concat(REC.eps.slice(1).map(e => { const d = REC.distances.find(d => d.A === A && d.eps === e); return d.decided ? { raw: C.m('[' + d.lo.toExponential(4) + ', ' + d.hi.toExponential(4) + ']') } : { raw: C.tag('UNDECIDED') }; })))
});

/* WHAT PROVED RESTS ON (WARRANT v2.1, rule 11; a reading gets no rung, 2026-10-28): the radii-polynomial bounds were
   derived by hand and are read, not machine-checked; the code that evaluates them reproduces the one exact solution
   the game has (the constant at A = 0); a finite-difference solve agrees to 1e−3, which is a cross-check, not a rung. */
const PREMISES = [
  { grade: WR.ASSUMED, label: 'The bounds',
    evidence: 'Y0 and the first six times N columns of Z1 are computed in interval arithmetic; the tail of Z1 beyond them and Z2 (from the algebra property of the weighted norm) are estimates derived by hand for this quasilinear problem and written out in kernel.js, and every certificate names them as its assumption. Read, not machine-checked, and not reviewed by anyone else.' },
  { grade: WR.VERIFIED, label: 'The code that evaluates them',
    evidence: 'at A = 0 the solution is the constant root of εu³ + u = 1, and at every ε the battery holds the certified ball against that cubic, which must change sign across it: the code reproduces an exact solution of its own equations. A second-order finite-difference solve on 96 points, a different discretization, agrees with the candidate to 1e−3 at three proved cells.' },
  { grade: WR.ASSUMED, label: 'The instance',
    evidence: 'the one-dimensional game, quadratic Hamiltonian, one cosine mode in the potential, the even subspace: chosen because its regularization is polynomial. Nothing here speaks for the paper\'s d-dimensional theorems.' },
];
if (!/K2 .*96 points/.test(BATSRC) || !/K1 .*cubic/.test(BATSRC)) die('the premise chain names battery checks that are not there');
if (!/the radii-polynomial bounds of kernel\.js/.test(DERIVE)) die('the certificates no longer name the bounds as their assumption');
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · a new kernel, re-derived at every build',
  title: 'The regularization, measured',
  deck: 'Ferreira, Gomes and Üçer prove that stationary first-order mean-field games have solutions by casting the system as a '
    + 'monotone operator on a Banach space and adding a small p-Laplacian to make it coercive; the regularization is then sent to zero. '
    + 'The proof needs the ε. Does the solution? On the one-dimensional game with a quadratic Hamiltonian and a cosine potential this '
    + 'page encloses every regularized equilibrium and the unregularized one, cell by cell across an atlas in the potential\'s '
    + 'amplitude and the regularization\'s strength, and decides the distance between them. The unregularized game certifies as readily '
    + 'as any regularized one and further than the strongly regularized ones, because after the density is eliminated the game is a '
    + 'second-order elliptic equation for the value function wherever the density is positive. The regularization was for the proof.'
}));

O.push(C.tldr({
  findingRaw: REC.counts.proved + ' of ' + REC.cells.length + ' cells PROVED, each a unique classical even solution with density bounded away from zero; ' + REC.counts.refused + ' refused by name. Along the amplitude every row is proved then refused: ε = 0 reaches A = ' + f0.lastProved + ', ε = ' + fLast.eps + ' only A = ' + fLast.lastProved + '. Where both are proved, ‖u_ε − u_0‖_2 is decided to the two radii: ' + f3(REC.distances.find(d => d.A === 0.4 && d.eps === 0.01).hi / 0.01) + ' ε at ε = 0.01 and A = 0.4, sublinear beyond.',
  mechanismRaw: 'Eliminating m = u + u′²/2 − V turns the transport equation into F_ε(u) = m − (m u′ + ε u′³)′ + ε u³ − 1 = 0, whose linearization is −(c h′)′ + e h with c = m + (1 + 3ε) u′² ≥ m. A radii polynomial in the derivative-weighted ℓ¹ space X_2 (explicit columns to six times the truncation, an analytic tail beyond, the algebra property for the nonlinear term) closes a ball about a Galerkin candidate.',
  checkRaw: C.m('node instruments/regatlas/battery.js') + ' (' + nChecks + ' checks, ' + nReds + ' red controls, ' + BATTIME + ') re-derives the atlas, holds the constant solution at A = 0 against the cubic it must solve, and an independent finite-difference solve against three certified cells.'
}));

O.push(C.stats([
  { k: 'cells proved', v: REC.counts.proved + ' of ' + REC.cells.length, role: 'held', n: 'radii from ' + eUp(Math.min(...REC.cells.filter(c => c.ok).map(c => c.r))) + ' to ' + eUp(Math.max(...REC.cells.filter(c => c.ok).map(c => c.r))) + ' in X_2; every refusal is Z1 ≥ 1 or Z1 so near 1 that no radius closes' },
  { k: 'ε = 0 reaches', v: 'A = ' + f0.lastProved, role: 'held', n: 'as far as ε = ' + REC.frontier[1].eps + ' and further than ε = ' + fLast.eps + ' (A = ' + fLast.lastProved + '): the certifier needs no regularization; the strong regularization costs it' },
  { k: 'the density at the frontier', v: downTo(find(f0.lastProved, 0).mLow, 3), role: 'held', n: 'the certified floor of m at the last proved cell of ε = 0; the refusal beyond is the certificate\'s (a diagonal tail against a varying coefficient), not the density\'s' },
  { k: 'distance at ε = 0.01', v: f3(REC.distances.find(d => d.A === 0.4 && d.eps === 0.01).hi), role: 'held', n: 'at A = 0.4, decided to ' + eUp(REC.distances.find(d => d.A === 0.4 && d.eps === 0.01).hi - REC.distances.find(d => d.A === 0.4 && d.eps === 0.01).lo) + ': the regularized solution sits ε away, to first order' },
  { k: 'at ε = 1', v: f3(REC.distances.find(d => d.A === 0.4 && d.eps === 1).hi), role: 'held', n: 'a third of ε: sublinear, as the cubic ε u³ + u = 1 already shows at A = 0 (u = ' + uRoot + ')' },
  { k: 'a new kernel', v: 'X_2', role: 'warn', n: 'the first radii polynomial in this machine for a quasilinear, variable-coefficient problem; its bounds are stated in the code and their tail term is the frontier' }
]));

O.push(C.section({
  lab: '§1 · the game and its regularization', title: 'Elliptic after all',
  bodyRaw: '<div class="col">'
    + C.pRaw('The paper\'s Problem 1 on the torus, with the power-growth Hamiltonian H = |p|²/2 − m and a discount, reads')
    + C.eq(C.esc('−u − u′²/2 + m + V = 0,      m − (m u′)′ − 1 = 0,      V = A cos 2πx.'))
    + C.pRaw('Its regularized operator (3.1) adds, in the transport slot, ε times the γ̄-Laplacian of u and the γ̄-power of u with γ̄ = α(β + 1)/β; for α = 2, β = 1 that is γ̄ = 4, so the added terms are ε(u′³)′ and ε u³ — polynomial. The first equation gives m outright, and the second becomes one scalar equation for u:')
    + C.eq(C.esc('F_ε(u) = m − (m u′ + ε u′³)′ + ε u³ − 1 = 0,      m = u + u′²/2 − V.'))
    + C.pRaw('Its linearization at ū is a Sturm–Liouville operator, −(c h′)′ + e h, with c = m̄ + (1 + 3ε)ū′² and e = 1 − ū″ + 3εū². The coefficient c is at least the density. Wherever m > 0 the operator is elliptic — at ε = 0 as at ε > 0 — and that is the whole reason the page can certify the unregularized game with the same instrument: the first-order game, after eliminating its density, is a second-order elliptic equation in disguise. The paper\'s ε is what makes the abstract operator coercive on the Banach space where existence is proved; it is not what makes the equation solvable.')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · the atlas', title: 'Fifty cells, each proved or refused by name',
  bodyRaw: '<div class="col">'
    + C.pRaw('For every amplitude A from 0 to 0.9 and every ε in {0, 0.01, 0.1, 0.3, 1}, a Galerkin candidate with N = 24 to 40 cosine modes is found by Newton continuation from the constant solution, and a radii polynomial in the space X_2 = {u : Σ|u_k|(1 + k)²ν^k < ∞}, ν = ' + REC.nu + ', is asked to close a ball about it. The approximate inverse is the dense inverse of the Galerkin Jacobian on the first N modes and the diagonal 1/(c₀(2πk)² + e₀) beyond; Z1 is computed column by column to six times N and bounded analytically past that; Z2 comes from the algebra property of the weighted norm. A zero of F in X_2 is twice differentiable with an analytic Fourier series — a classical solution — and the density is certified positive on the whole ball, so it is a strong solution in the paper\'s sense with m bounded away from zero.')
    + '</div>'
    + C.figure({ svgRaw: atlasFig(), caption: 'Figure 1 · The atlas. Solid: PROVED, the shade darkening as the contraction factor κ falls; hatched: REFUSED, with the Z1 that refused it. Every row is proved then refused as A grows, and the proved region shrinks as ε grows.' })
    + T_FRONT
    + '<div class="col">' + WR.legendHtml({ compact: true }) + '</div>'
    + '<div class="col">'
    + C.pRaw('Every refusal is the same refusal: Z1, the norm of I − A·DF(ū), reaches 1. It is the tail\'s doing. A diagonal approximate inverse beyond N is right when the principal coefficient c is nearly constant and wrong in proportion to its variation, and c = m + (1 + 3ε)u′² varies more as A grows (m follows −V) and as ε grows (the 4-Laplacian weights u′² three times more). So the frontier moves left with ε: the regularization that gives the paper its coercivity takes contraction from the certificate. The density is nowhere near zero at the frontier — the certified floor at the last proved cell of ε = 0 is ' + downTo(find(f0.lastProved, 0).mLow, 3) + ', and the float candidate at the first refused cell still has min m = ' + mFloat(find(f0.firstRefused, 0)) + '. The void of this atlas is the certificate\'s boundary, not the equation\'s; the two would only coincide where m reaches zero, which is where the paper\'s strong solutions stop being classical, and that is beyond the map.')
    + '</div>'
    + C.figure({ svgRaw: FIG_KAPPA, record: 'certs/regatlas.json', stop: 'a proved cell has a contraction factor κ ≥ 1 or no density floor', caption: 'Figure 2 · The contraction factor along the amplitude for three regularization strengths, on the proved cells. Each dot is a proved cell\'s κ, decided; the dotted segments between them are a chosen picture, because nothing computed κ between two amplitudes. Each row rises toward 1 and stops at its frontier; the strongly regularized one first.' })
}));

O.push(C.section({
  lab: '§3 · the regularization measured', title: 'ε away, to first order',
  bodyRaw: '<div class="col">'
    + C.pRaw('Where a regularized cell and its unregularized neighbour are both proved, the distance ‖u_ε − u_0‖_2 is decided: the norm of the difference of the two candidates, exactly, plus or minus the two radii. At A = 0 the solutions are constants — u_ε is the real root of εu³ + u = 1 — and the distance is 1 − u_ε, which the battery holds against the cubic. At every amplitude the distance grows with ε, equals about ε at ε = 0.01, and is a third of ε at ε = 1: the regularized game is a first-order perturbation of the unregularized one in this norm, and the perturbation saturates because the cubic term is bounded. The paper passes ε → 0 by compactness; here the limit is watched.')
    + '</div>'
    + C.figure({ svgRaw: distFig(), record: 'certs/regatlas.json', stop: 'a decided distance at ε = 0.01 falls outside 0.9ε to 1.4ε, or one at ε = 1 outside 0.3 to 0.4', caption: 'Figure 3 · The decided distance ‖u_ε − u_0‖_2 against ε for three amplitudes, on logarithmic axes. Each dot is decided, its bracket narrower than the dot; the dotted segments between them are chosen, since only four ε were computed. The fine-dashed guide is the diagonal, ‖u_ε − u_0‖ = ε.' })
    + '<div class="col">' + WR.legendHtml({ compact: true }) + '</div>'
    + T_DIST
    + C.figure({ svgRaw: FIG_M, caption: 'Figure 4 · The density at A = 0.6 for the proved regularization strengths, each the certified candidate sampled at ' + REC.xs.length + ' points and drawn solid: the solution lies within its radius, below 1e−9, far inside the stroke; the regularized densities are slightly flatter and, through the cubic term, carry slightly less mass where u is large.' })
    + C.figure({ svgRaw: FIG_U, caption: 'Figure 5 · The value function at A = 0.6, the same cells. The regularized ones sit lower by about ε: the zero-order term εu³ acts like an added discount.' })
}));

O.push(C.section({
  lab: '§4 · the honest boundary', title: 'What is claimed, and what is not',
  bodyRaw: '<div class="col">' + C.plainList([
    { b: 'Proved, cell by cell.', text: 'A unique zero of F_ε in a ball of X_2 about the candidate, in the even subspace; classical; density positive on the ball. Each certificate carries ' + ['', 'one', 'two', 'three', 'four', 'five', 'six'][falsifiers.length] + ' falsifiers; the battery fires four of them as red controls (the shift, the wrong sign, the candidate on no branch, the dip below zero) and one of its own (a refused cell re-certified with a wider ν). The third, a principal coefficient forced negative, has no red control yet.' },
    { b: 'Decided.', text: 'The distances between doubly-proved cells; the ellipticity of the linearization (c₀ > 0, e₀ ≥ 0) on every proved cell; the constant solution\'s cubic at A = 0.' },
    { b: 'Not claimed.', text: 'Uniqueness outside the ball or outside the even subspace; anything on a refused cell — existence there is neither asserted nor denied; the paper\'s d-dimensional theorems; the singular-congestion and weak-growth cases (Theorems 1.5, 1.6). The one-dimensional quadratic game with a single cosine mode is the instance, and it is the instance because its regularization is polynomial.' },
    { b: 'The frontier is the certificate\'s.', text: 'Every refusal is Z1 ≥ 1 from a diagonal tail against a varying coefficient. A banded tail inverse would move it; the density would not. The page says so rather than drawing a boundary it does not have.' },
    { b: 'A new kernel.', text: 'The radii-polynomial bounds for this quasilinear problem are written out in kernel.js and are this machine\'s, not lifted. They are checked here by a finite-difference solve on a different discretization and by the constant solution; they have not been reviewed by anyone else.' }
  ]) + C.pRaw('<strong>What PROVED rests on.</strong> The arithmetic of every cell is exact over its intervals. What it evaluates are bounds, and the bounds rest on premises the arithmetic cannot reach. In the order a cell travels through them, each with the rung its checking reached — <b>validated</b> (against the thing itself, held out), <b>compared</b> (against a model that keeps more), <b>verified</b> (the code against an exact solution of its own equations) or <b>assumed</b> (adopted, chosen or read; no machine here checked it):')
    + WR.premisesHtml(PREMISES, { meetLine: 'The arithmetic is exact; the weakest premise is <b>' + WR.GRADE[WR.weakest(...PREMISES.map((q) => q.grade))] + '</b>: each cell is PROVED <em>given the bounds of kernel.js</em>, derived by hand and read, and checked by a machine only where an exact solution was there to check them against.' }) + '</div>'
}));

O.push(C.section({
  lab: '§5 · check it', title: 'Half a minute on your machine',
  bodyRaw: '<div class="col">'
    + C.code('node instruments/regatlas/battery.js     # ' + nChecks + ' checks, ' + nReds + ' red controls: the atlas re-derived, the cubic at A = 0, finite differences, the frontier\nnode instruments/regatlas/run.js --check  # the record, re-derived and compared byte for byte')
    + C.pRaw('The kernel is <span class="m">instruments/regatlas/kernel.js</span>, with <span class="m">derive.js</span>; the record is <span class="m">certs/regatlas.json</span>.')
    + '</div>'
}));

O.push(C.section({
  lab: 'references', title: 'Sources',
  bodyRaw: '<div class="col">' + C.plainList([
    { raw: 'R. Ferreira, D. A. Gomes, M. Üçer, <em>Solving mean-field games with monotonicity methods in Banach spaces</em>, arXiv:2506.21212v3 (2026) — Problem 1, Assumption 2.4 (power growth), the regularized operator (3.1), Proposition 3.1 (coercivity), Theorem 1.4.' },
    { raw: 'J. B. van den Berg, J.-P. Lessard, <em>Rigorous numerics in dynamics</em>, Notices AMS 62 (2015); S. Day, J.-P. Lessard, K. Mischaikow, SIAM J. Numer. Anal. 45 (2007) — the radii polynomial; the derivative-weighted ℓ¹ space is the standard device for quasilinear problems.' },
    { raw: '<a href="mfg-cap.html">The congestion cap</a>, <a href="frontier.html">the concentration frontier</a> — the machine\'s earlier radii polynomials for the viscous game, whose lifted kernel this one does not use.' },
    { raw: '<a href="afg.html">The first-order game by its current</a> — the same first-order structure without a discount, enclosed through its current instead.' }
  ]) + '</div>'
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-regatlas.js @ git ' + gitrev
  + ' — certs/regatlas.json re-derived during this build (' + REC.cells.length + ' certificates) and compared byte for byte (identical, or no page). Kernel sha256 ' + REC.provenance.sha256.slice(0, 16) + '…') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'regatlas.html'),
  TPL.render({ title: 'The regularization, measured · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/regatlas.html',
    desc: 'The p-Laplacian regularization of Ferreira–Gomes–Üçer measured on the one-dimensional first-order mean-field game: every regularized equilibrium and the unregularized one enclosed across an atlas, the distance between them decided.' }));
console.log('reports/regatlas.html written: record re-derived identically @ git ' + gitrev);
