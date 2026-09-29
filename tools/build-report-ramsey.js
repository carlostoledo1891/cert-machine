#!/usr/bin/env node
/* build-report-ramsey.js — reports/diagonal-ramsey.html: the "preliminary, unverified" iteration in Gupta, Ndiaye,
   Norin and Wei's paper, decided. Every number comes from certs/gnnw-certificate.json (tools/run-gnnw-ledger.py),
   re-derived here (--check) before a word is written, and from the battery's own count.

   usage: node tools/build-report-ramsey.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('RAMSEY REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const py = (args) => cp.execFileSync('python3', args, { cwd: ROOT, encoding: 'utf8' });

try { py(['tools/run-gnnw-ledger.py', '--check']); } catch (e) { die('the certificate does not re-derive: ' + (e.stdout || e.message)); }
let bat = ''; try { bat = py(['instruments/gnnw/battery.py']); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /gnnw battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const Z = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'gnnw-certificate.json'), 'utf8'));
const D = Z.decided;
if (D.verdict !== 'CERTIFIED' || !D.printedDigitsHold) die('the certificate is not the certified one this page describes');
const c = D.c[0], c10 = c.slice(0, 12);
const S = D.stats;
const pts = Z.curve.points;
const minPt = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
const lim = pts[0][1];
const e3 = (v) => v.toExponential(2).replace('e-', '·10⁻').replace(/⁻(\d)/, (m, d) => '⁻' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]);

const FIG = CH.lines({
  w: 900, h: 360, x0: 1e-8, x1: 1, y0: 3e-5, y1: 0.1, logX: true, logY: true, hover: false,
  xTicks: [1e-8, 1e-6, 1e-4, 1e-2, 1].map((v) => ({ v, t: v === 1 ? '1' : '10⁻' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[-Math.log10(v)] })),
  yTicks: [1e-4, 1e-3, 1e-2, 1e-1].map((v) => ({ v, t: String(v) })),
  xLabel: 'λ = ℓ/k (log scale)', yLabel: 'slack(λ) / λ',
  series: [{ name: 'the slack of Theorem 14\'s inequality over λ, lower end of an interval enclosure at each of ' + pts.length + ' points (decided)', pts }],
  alt: 'On logarithmic axes, the slack of the inequality divided by λ, for λ from 10⁻⁸ to 1. It is flat at about 6.3·10⁻⁵ for small λ, rises to about 0.04 near λ = 0.1, falls back to about 6·10⁻⁵ near λ = 0.93, and ends near 3.6·10⁻⁴ at λ = 1. It is positive everywhere; its two lowest stretches are at the far left and near λ = 0.93.'
});

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · decided · diagonal Ramsey numbers',
  title: 'An unverified Ramsey bound, verified: 3.7823',
  deck: 'Gupta, Ndiaye, Norin and Wei prove R(k, k) ≤ 3.7992^(k+o(k)), and print one more iteration of their optimisation, proposed by '
    + 'ChatGPT 5.6 Sol, as "preliminary, unverified": if it held, the base would drop to 3.78233. Decided here with exact interval arithmetic, '
    + 'on the paper\'s own Theorem 14 and the region its Theorem 1 already proves: it holds. The inequality the theorem needs is true at every '
    + 'λ in (0, 1], with a witness chosen here, so R(k, k) ≤ ' + c10 + '…^(k+o(k)) follows from the paper as written.'
}));
B.push(C.scope('The paper: arXiv 2407.19026v2 (29 August 2026), pinned by sha256 in corpus/gnnw. What is decided is the numerical hypothesis of its '
  + 'Theorem 14 for this F; the theorem itself, Lemma 15 and Theorem 1 are the authors\' (the paper reports its main results formalised in Lean). '
  + 'Published, not peer-reviewed, not independently rerun. Nothing has been sent to the authors.'));
B.push(C.tldr({
  findingRaw: '<b>CERTIFIED.</b> For F(λ) = (1+λ)ln(1+λ) − λ ln λ + G_AI(λ), with the paper\'s G_AI, a continuous M chosen here and Y taken from '
    + 'the region the paper\'s proved bound F₀.₀₃ gives (Lemma 15), all four conditions of Theorem 14 hold on (0, 1]. Its conclusion is '
    + 'R(k, ℓ) ≤ e^(F(ℓ/k)k + o(k)), and at ℓ = k the base is e^F(1) = 4·e^G_AI(1) = <b>' + c.slice(0, 22) + '…</b>; the paper\'s 3.78233 is ' + D.printedIs + '.',
  mechanismRaw: 'The inequality holds with little room: its slack is about ' + e3(lim) + '·λ as λ → 0 and ' + e3(minPt[1]) + '·λ near λ = ' + minPt[0].toFixed(2)
    + '. It is decided on ' + (S.tailIntervals + S.mainIntervals) + ' intervals of λ, each enclosed in 40-digit decimal arithmetic with every rounding outward: '
    + 'below λ = 0.01 the slack divided by λ with its ln λ terms cancelled by hand, above it a mean-value bound with the derivative written out.',
  checkRaw: C.m('python3 verify/verify_gnnw_gai.py certs/gnnw-certificate.json') + ' — one standard-library file, ' + D.seconds + ' s here · '
    + C.m('python3 instruments/gnnw/battery.py') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' forgeries refused.'
}));
B.push(C.stats([
  { k: 'base of the bound', v: '3.7823', n: 'From the 3.7992 the paper proves; c = ' + c.slice(0, 16) + '…' },
  { k: 'slack as λ → 0', v: e3(lim), n: 'Per unit λ: thin. Moving G_AI\'s linear coefficient from −0.3864 to −0.3870 already breaks it (a forgery the battery refuses).' },
  { k: 'intervals decided', v: String(S.tailIntervals + S.mainIntervals), n: S.tailIntervals + ' on (0, 0.01], ' + S.mainIntervals + ' on [0.01, 1].' },
  { k: 'seconds', v: String(D.seconds), n: 'The whole decision, re-run at every build of this page.' }
]));
B.push(C.section({
  lab: '§1 · the claim', title: 'One more iteration, printed as unverified',
  bodyRaw: [
    C.quote({ text: Z.source.remark, cite: 'Gupta, Ndiaye, Norin and Wei, arXiv 2407.19026v2, after Remark 17' }),
    C.pRaw('Their method turns a known upper bound on the off-diagonal numbers R(k, ℓ) into a better one: Theorem 14 takes a function F with F′ > 0, '
      + 'functions M, X, Y into (0, 1) with M continuous, X(λ) = (1 − e^−F′(λ))^(1/(1−M(λ)))·(1 − M(λ)), the pair (X(λ), Y(λ)) in the region R of '
      + 'pairs the known bounds allow, and'),
    C.eq(C.esc('F(λ) > −½ ( log X(λ) + λ log M(λ) + λ log Y(λ) )     for every 0 < λ ≤ 1,')),
    C.pRaw('and concludes R(k, ℓ) ≤ e^(F(ℓ/k)k + o(k)). Their Theorem 1 is two rounds of this, ending at F₀.₀₃ and the base 3.7992. The remark\'s G_AI is a '
      + 'third round, and the remark names neither the M nor the Y that go with it.')
  ].join('\n')
}));
B.push(C.section({
  lab: '§2 · the witness', title: 'An M, a Y, and an inequality that holds everywhere', wide: true,
  bodyRaw: [
    C.pRaw('Y is not chosen: it is Lemma 15\'s function Y_f for f = F₀.₀₃, which the paper\'s Remark 17 places in R — the region Theorem 1 already proves. '
      + 'It has three branches, where X is above b = B(1), between a = A(1) and b, and below a, with A(t) = e^−f′(t) and B(t) = e^(t f′(t) − f(t)); '
      + 'each is solved for its parameter t by an interval bracket.'),
    C.pRaw('M is chosen: M(λ) = λ·m(λ), m piecewise linear through ' + (Z.m.N + 1) + ' rational values — at each node the value that makes the slack '
      + 'largest, and at 0 the root μ = ' + Z.m.m0 + ' of 1/μ + 1/(e^0.3864 + μ) = 1, which maximises the slack\'s limit. Any continuous M into (0, 1) '
      + 'that passes is a witness; this one passes with the margin drawn below.'),
    C.figure({ svgRaw: FIG, caption: 'The slack of Theorem 14\'s inequality divided by λ, as decided: flat at ' + e3(lim) + ' for small λ, lowest at '
      + e3(minPt[1]) + ' near λ = ' + minPt[0].toFixed(2) + ', and never below zero. The tight stretches — the flat left end and three dips between 0.6 and 0.95 — are where a '
      + 'coarser witness, or a slightly more ambitious G, would fail.' })
  ].join('\n')
}));
B.push(C.section({
  lab: '§3 · the decision', title: 'Four hundred intervals, every rounding outward',
  bodyRaw: [
    C.plainList([
      { b: 'Below λ = 0.01.', text: 'F carries −λ ln λ and the two logarithms carry +½ λ ln λ each (M ≈ 1.5λ, and Y through t ≈ 3λ); cancelled by hand, slack/λ is a smooth function of λ, enclosed on intervals that contain 0, with ln(1+z)/z and ln(1−z)/z bracketed by their series. ' + S.tailIntervals + ' intervals, the smallest lower bound ' + e3(S.minTailS) + '.' },
      { b: 'From 0.01 to 1.', text: 'On each piece of m, slack on [a, b] lies inside slack(midpoint) plus slack′([a, b]) times half the width; slack′ is written out, with d log Y / d log X = −1/t, −1 or −t on the three branches (the paper\'s Appendix A). ' + S.mainIntervals + ' intervals.' },
      { b: 'Along the way.', text: 'F′ > 0 (at least ' + S.minFp.toFixed(3) + '), M below ' + S.maxM.toFixed(4) + ', X in (0, 1); and for f = F₀.₀₃ the hypotheses of Lemma 15: strictly concave, increasing, A < B.' },
      { b: 'The controls.', text: 'The derivative agrees with a central difference, the tail form with the direct slack, Y with an independent float solver. Moving the linear coefficient to −0.3870, starting M with slope 1.2, lowering the sixth coefficient by 0.002, letting M reach 1, or a proposer that lies about a branch parameter: each is refused. GNNW\'s own F₀.₀₃ passes in its own region.' }
    ])
  ].join('\n')
}));
B.push(C.section({
  lab: '§4 · limits', title: 'What this does and does not say',
  bodyRaw: C.plainList([
    { b: 'It rests on the paper.', text: 'Theorem 14, Lemma 15 and Theorem 1 are the authors\' and are used, not re-proved. What was missing, the numerical hypothesis for G_AI and a witness M, is supplied and decided here.' },
    { b: 'It is the paper\'s own next step.', text: 'The authors expect that going below 3.75 would need new ideas. The certificate HorizonMath credits with 3.6961 does not satisfy this theorem; it is decided on the HorizonMath page.' },
    { b: 'It is not yet reviewed.', text: 'A single program by one author, with its controls; a second independent implementation, or the authors\' own check, is the next step. The verifier is one file with no dependencies, so anyone can run it.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-ramsey.js from certs/gnnw-certificate.json (' + Z.generated + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls fired.') + '</p><p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'diagonal-ramsey.html'), TPL.render({
  title: 'An unverified Ramsey bound, verified · cert-machine', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot,
  desc: 'The iteration Gupta, Ndiaye, Norin and Wei print as preliminary and unverified, decided in exact interval arithmetic on their own Theorem 14: it holds, so R(k,k) ≤ ' + c10 + '…^(k+o(k)).',
  path: '/reports/diagonal-ramsey.html'
}));
console.log('reports/diagonal-ramsey.html written: ' + D.verdict + ', c = ' + c.slice(0, 16) + ' @ git ' + git);
