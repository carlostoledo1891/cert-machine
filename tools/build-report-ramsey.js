#!/usr/bin/env node
/* build-report-ramsey.js — reports/diagonal-ramsey.html: the "preliminary, unverified" iteration in Gupta, Ndiaye,
   Norin and Wei's paper, decided. Every number comes from certs/gnnw-certificate.json (tools/run-gnnw-ledger.py),
   re-derived here (--check) before a word is written, and from the battery's own count.

   NOT THE RECORD. 3.7823 and 3.7721… decide the GNNW paper's own iteration. Two smaller upper bounds on R(k, k)
   appeared in September 2026 — Neisler–Shin–Sukhatankar's 3.769^(k+o(k)) (kernel-checked in Lean by its authors, wamlat/RamseyLean-bootstrap,
   Zenodo concept 22263823, 2026-09-03) and Lu–Wang's 3.69507^k (arXiv 2609.14525, 2026-09-13) — and the page names
   both, as "not checked here", from sources pinned in corpus/sources/ramsey and re-hashed at every build. Until
   2026-10-05 it named neither; until 2026-10-06 §5 called them "lower bounds on R(k, k)". They are UPPER bounds on
   R(k, k) with lower bases (both pinned abstracts say R(k,k) ≤ …), and §5 now says so.

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
const PIN = require(path.join(ROOT, 'instruments', 'pin.js'));

/* ---- the newer bounds, read from pinned bytes: each sentence the page says about them must still be in them */
const NEWER = {
  lw: 'ramsey/arxiv-2609.14525-abs_2026-10-05.html',
  readme: 'ramsey/wamlat-readme-pin.txt',   /* a pin note quoting the README: the repository states no licence, so its bytes are not stored */
  zenodo: 'ramsey/zenodo-22263823_2026-10-05.json',
  paper: 'ramsey/wamlat-paper-pin.txt'
};
for (const f of Object.values(NEWER)) { const v = PIN.verify(f); if (!v.ok) die('pinned source ' + f + ': ' + v.why); }
{
  const rd = (f) => fs.readFileSync(path.join(ROOT, 'corpus', 'sources', f), 'utf8');
  const lw = rd(NEWER.lw), rm = rd(NEWER.readme), z = JSON.parse(rd(NEWER.zenodo)), pp = rd(NEWER.paper);
  if (!/R\(k,k\)\\le3\.69507\^k\$ for all sufficiently large/.test(lw) || !/citation_date" content="2026\/09\/13"/.test(lw)
    || !/citation_author" content="Lu, Zhipeng"[\s\S]*citation_author" content="Wang, Sichen"/.test(lw)) die('the pinned arXiv 2609.14525 abstract no longer says what this page cites');
  if (!/kernel-checked Lean 4 formalization/.test(rm) || !/\\le 3\.769\^\{\\,k\+o\(k\)\}/.test(rm) || !/sha256 7ffbf9e0737c02ce/.test(rm)) die('the pinned RamseyLean-bootstrap README no longer says what this page cites');
  if (z.conceptdoi !== '10.5281/zenodo.22263823' || z.metadata.publication_date !== '2026-09-03') die('the pinned Zenodo record is not the one this page cites');
  if (!/Christian Neisler, Ryan Min June Shin, and Sohum Sukhatankar/.test(pp)) die('the pin note no longer names the 3.769 paper\'s authors');
}

try { py(['tools/run-gnnw-ledger.py', '--check']); } catch (e) { die('the certificate does not re-derive: ' + (e.stdout || e.message)); }
let bat = ''; try { bat = py(['instruments/gnnw/battery.py']); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /gnnw battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const Z = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'gnnw-certificate.json'), 'utf8'));
const K = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'gnnw-chain-certificate.json'), 'utf8'));
if (K.decided.verdict !== 'CERTIFIED' || !K.second.agrees || !K.second.current) die('the chain is not certified by both implementations');
const cK = K.decided.c[0], bases = K.decided.bases, NS = bases.length;
const nInt = K.decided.perStep.reduce((a, r) => a + r.tail + r.main, 0);
const nInt2 = K.second.result.steps.reduce((a, r) => a + r.tail + r.main, 0);
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
  title: 'Diagonal Ramsey below 3.7992: 3.7823, then 3.77213…',
  deck: 'Gupta, Ndiaye, Norin and Wei prove R(k, k) ≤ 3.7992^(k+o(k)) and print one more round of their optimisation, proposed by ChatGPT 5.6 Sol, as '
    + '"preliminary, unverified": 3.78233. Decided here on the paper\'s own Theorem 14, by two independent programs: it holds. The paper adds that "further '
    + 'improvements by performing additional iterations are possible"; five more rounds, each proposed here by a float optimiser and each decided in the '
    + 'region the round before it establishes, reach R(k, k) ≤ ' + cK.slice(0, 12) + '…^(k+o(k)). Both numbers decide the paper\'s own '
    + 'iteration; neither is the best known bound — lower ones appeared in September 2026 and are not checked here (§5).'
}));
B.push(C.scope('The paper: arXiv 2407.19026v2 (29 August 2026), pinned by sha256 in corpus/gnnw. What is decided is the numerical hypothesis of its '
  + 'Theorem 14 for this F; the theorem itself, Lemma 15 and Theorem 1 are the authors\' (the paper reports its main results formalised in Lean). '
  + 'Not the record: R(k, k) ≤ 3.769^(k+o(k)) (Neisler, Shin and Sukhatankar, kernel-checked in Lean by its authors, 3 September 2026) and '
  + 'R(k, k) ≤ 3.69507^k (Lu and Wang, arXiv 2609.14525, 13 September 2026) are both lower than anything on this page; neither is checked here. '
  + 'Published, not peer-reviewed, not independently rerun. Nothing has been sent to the authors.'));
B.push(C.tldr({
  findingRaw: '<b>CERTIFIED.</b> For F(λ) = (1+λ)ln(1+λ) − λ ln λ + G_AI(λ), with the paper\'s G_AI, a continuous M chosen here and Y taken from '
    + 'the region the paper\'s proved bound F₀.₀₃ gives (Lemma 15), all four conditions of Theorem 14 hold on (0, 1]. Its conclusion is '
    + 'R(k, ℓ) ≤ e^(F(ℓ/k)k + o(k)), and at ℓ = k the base is e^F(1) = 4·e^G_AI(1) = <b>' + c.slice(0, 22) + '…</b>; the paper\'s 3.78233 is ' + D.printedIs + '. <b>Five more rounds, CERTIFIED:</b> the bases ' + bases.map((b) => b.slice(0, 8)).join(' → ') + ', the last '
    + '<b>' + cK.slice(0, 22) + '…</b>. A second program, written apart in another language and arithmetic, certifies every round and agrees to 25 digits.',
  mechanismRaw: 'The inequality holds with little room: its slack is about ' + e3(lim) + '·λ as λ → 0 and ' + e3(minPt[1]) + '·λ near λ = ' + minPt[0].toFixed(2)
    + '. It is decided on ' + (S.tailIntervals + S.mainIntervals) + ' intervals of λ, each enclosed in 40-digit decimal arithmetic with every rounding outward: '
    + 'below λ = 0.01 the slack divided by λ with its ln λ terms cancelled by hand, above it a mean-value bound with the derivative written out.',
  checkRaw: C.m('python3 verify/verify_gnnw_gai.py certs/gnnw-chain-certificate.json') + ' — one standard-library file, ' + K.decided.seconds + ' s here · '
    + C.m('node instruments/gnnw/second.js certs/gnnw-chain-certificate.json') + ' — the second program, ' + Math.round(K.second.result.seconds / 60) + ' min · '
    + C.m('python3 instruments/gnnw/battery.py') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' forgeries refused.'
}));
B.push(C.stats([
  { k: 'base, the remark\'s round', v: '3.7823', n: 'Printed as unverified; decided here. c = ' + c.slice(0, 16) + '…' },
  /* the base is printed truncated with its ellipsis, never rounded down: under an o(k) exponent 3.7721^(k+o(k)) would
     claim more than c = 3.77213… proves (the paper agent's correction, 2026-10-01); the valid rounded form is 3.7722 */
  { k: 'base, five rounds more', v: cK.slice(0, 7) + '…', n: 'c = ' + cK.slice(0, 16) + '…, each round in the region of the one before; rounded, 3.7722, never 3.7721.' },
  { k: 'intervals decided', v: nInt.toLocaleString('en-US'), n: 'By the first program; the second, with its coarser method, used ' + nInt2.toLocaleString('en-US') + '.' },
  { k: 'implementations', v: '2', n: 'Python and Decimal with a written derivative; JavaScript and dyadic intervals with monotone bounds. They agree to 25 digits.' }
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
  lab: '§3 · the decision', title: 'The remark\'s round: four hundred intervals',
  bodyRaw: [
    C.plainList([
      { b: 'Below λ = 0.01.', text: 'F carries −λ ln λ and the two logarithms carry +½ λ ln λ each (M ≈ 1.5λ, and Y through t ≈ 3λ); cancelled by hand, slack/λ is a smooth function of λ, enclosed on intervals that contain 0, with ln(1+z)/z and ln(1−z)/z bracketed by their series. ' + S.tailIntervals + ' intervals, the smallest lower bound ' + e3(S.minTailS) + '.' },
      { b: 'From 0.01 to 1.', text: 'On each piece of m, slack on [a, b] lies inside slack(midpoint) plus slack′([a, b]) times half the width; slack′ is written out, with d log Y / d log X = −1/t, −1 or −t on the three branches (the paper\'s Appendix A). ' + S.mainIntervals + ' intervals.' },
      { b: 'Along the way.', text: 'F′ > 0 (at least ' + S.minFp.toFixed(3) + '), M below ' + S.maxM.toFixed(4) + ', X in (0, 1); and for f = F₀.₀₃ the hypotheses of Lemma 15: strictly concave, increasing, A < B.' },
      { b: 'The controls.', text: 'The derivative agrees with a central difference, the tail form with the direct slack, Y with an independent float solver. Moving the linear coefficient to −0.3870, starting M with slope 1.2, lowering the sixth coefficient by 0.002, letting M reach 1, or a proposer that lies about a branch parameter: each is refused. GNNW\'s own F₀.₀₃ passes in its own region.' }
    ])
  ].join('\n')
}));
const TABLE = C.table({
  cols: [{ h: 'round' }, { h: 'base e^F(1)', cls: 'n' }, { h: 'second program', cls: 'n' }],
  rows: bases.map((b, i) => [String(i + 1), b.slice(0, 12), K.second.result.steps[i].c[0].slice(0, 12)])
});
B.push(C.section({
  lab: '§4 · further rounds', title: 'Five more rounds, each in the region of the last', wide: true,
  bodyRaw: [
    C.pRaw('Once F is established, it is a better bound on R(k, ℓ) than F₀.₀₃, and Lemma 15 turns it into a larger region — provided it is strictly concave, '
      + 'increasing, and 2F′(1) − F(1) > 0, which both programs decide on intervals before using it. Theorem 14 can then be applied again. Each new F is h + q(λ)e^−λ with '
      + 'q a polynomial of degree 9, found by a float optimiser here: minimise q(1) while the slack stays at least 5·10⁻⁵·λ on 215 points, with M chosen as before. The '
      + 'optimiser only proposes; every round is decided like the first. Round 1 is the remark\'s, in the region of F₀.₀₃; round k is in the region of round k − 1.'),
    TABLE,
    C.pRaw('In floats, the rounds converge: degree 6 settles near 3.7732 and degree 9 near 3.77213, so further rounds of this kind buy almost nothing. The authors expect '
      + 'that going below 3.75 would need new ideas; nothing here disagrees. The two newer upper bounds of §5, both with lower bases, change the method rather than add rounds: one '
      + 'collapses the iteration into a single self-consistent system over free-form rate functions, the other descends through retained sets.')
  ].join('\n')
}));
B.push(C.section({
  lab: '§5 · limits', title: 'What this does and does not say',
  bodyRaw: C.plainList([
    { b: 'It is not the record.', raw: C.esc('3.7823 and ' + cK.slice(0, 7) + '… decide the paper\'s own iteration. Two upper bounds on R(k, k) with lower bases than these appeared in September 2026: ')
      + '<b>3.769</b>' + C.esc('^(k+o(k)), by C. Neisler, R. M. J. Shin and S. Sukhatankar — a self-consistent bootstrap of the same book algorithm, with the whole proof, '
      + 'including the decimal bound R(k, k) ≤ 3.7690^k for all large k, kernel-checked in Lean 4 by its authors (')
      + '<a href="https://github.com/wamlat/RamseyLean-bootstrap">wamlat/RamseyLean-bootstrap</a>, <a href="https://doi.org/10.5281/zenodo.22263823">doi:10.5281/zenodo.22263823</a>'
      + C.esc(', 3 September 2026); and ') + '<b>3.69507</b>' + C.esc('^k for all sufficiently large k, by Z. Lu and S. Wang, “Retained-Set Descent for Diagonal Ramsey Numbers” (')
      + '<a href="https://arxiv.org/abs/2609.14525">arXiv 2609.14525</a>' + C.esc(', 13 September 2026; the arXiv comment points to a Lean 4 formalization and Python certificate checks). '
      + 'Neither is checked here; their public pages are pinned in corpus/sources/ramsey.') },
    { b: 'It rests on the paper.', text: 'Theorem 14, Lemma 15 and Theorem 1 are the authors\' and are used, not re-proved. What was missing, the numerical hypothesis for G_AI and a witness M, is supplied and decided here.' },
    { b: 'It is the paper\'s own next step.', text: 'The authors expect that going below 3.75 would need new ideas. The certificate HorizonMath credits with 3.6961 does not satisfy this theorem; it is decided on the HorizonMath page.' },
    { b: 'It is not yet reviewed.', text: 'Two programs agree, but they share an author and a reading of the paper; the authors\' own check is the next step. The first verifier is one file with no dependencies, so anyone can run it.' },
    { b: 'Each round rests on the one before.', text: 'Round k uses the bound round k − 1 establishes; the chain is only as good as its first link, the paper\'s Theorem 1.' }
  ])
}));
/* 3.769 and 3.69507 bound R(k, k) from ABOVE; the page called them "lower bounds on R(k, k)" until 2026-10-06 */
if (/lower bounds? on R\(k, ?k\)/.test(B.join('\n'))) die('the page calls an upper bound on R(k, k) a lower bound');
const foot = '<p>' + C.esc('Generated by tools/build-report-ramsey.js from certs/gnnw-certificate.json and certs/gnnw-chain-certificate.json (' + Z.generated + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls fired.') + '</p><p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'diagonal-ramsey.html'), TPL.render({
  title: 'Diagonal Ramsey below 3.7992 · cert-machine', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot,
  desc: 'The iteration Gupta, Ndiaye, Norin and Wei print as preliminary and unverified, decided on their own Theorem 14 by two independent programs: it holds (3.7823); five further rounds reach R(k,k) ≤ ' + cK.slice(0, 10) + '…^(k+o(k)). The paper\'s own iteration, not the record: 3.769 (Lean-checked by its authors) and 3.69507 (arXiv 2609.14525) are lower and not checked here.',
  path: '/reports/diagonal-ramsey.html'
}));
console.log('reports/diagonal-ramsey.html written: ' + D.verdict + ', c = ' + c.slice(0, 16) + '; chain c = ' + cK.slice(0, 16) + ' @ git ' + git);
