#!/usr/bin/env node
/* build-report-horizonmath.js — reports/horizonmath.html: the discoveries a benchmark credits to frontier models, decided.
   Every number comes from certs/horizonmath-ledger.json (tools/run-horizonmath-ledger.py), re-derived here (--check)
   before a word is written, and from the battery's own count. The one drawn curve that is not decided — the boundary
   GNNW's Lemma 15 places with the bound U — is computed here in floats and labelled as a drawing.

   usage: node tools/build-report-horizonmath.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('HORIZONMATH REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const py = (args) => cp.execFileSync('python3', args, { cwd: ROOT, encoding: 'utf8' });

try { py(['tools/run-horizonmath-ledger.py', '--check']); } catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.message)); }
let bat = ''; try { bat = py(['instruments/horizonmath/battery.py']); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /horizonmath battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'horizonmath-ledger.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'horizonmath', 'meta.json'), 'utf8'));
const row = (id) => L.rows.find((r) => r.id === id) || die('no ledger row ' + id);
const R = row('ramsey-asymptotic'), K = row('keich-thin-triangles-128'), G = row('gpt56-closed-forms');
if (R.verdict !== 'REFUTED' || K.verdict !== 'CERTIFIED' || G.verdict !== 'NEEDS DATA') die('the verdicts are not the ones this page describes');
const D = R.decided, last = R.points[R.points.length - 1], w = last.outsideR;
if (last.lambda !== 1 || !w) die('the pair at lambda = 1 is no longer the excluded one');
const eU1 = D.eMinusU1[0];
const f5 = (v) => Number(v).toFixed(5);
const frac = (s) => { const [a, b] = s.split('/').map(Number); return a / b; };

/* ---- the figure: the certificate's pairs against the regions ---- */
const U = (t) => (1 + t) * Math.log(1 + t) - t * Math.log(t) + (-0.25 * t + 0.033 * t * t + 0.08 * t ** 3) * Math.exp(-t);
const Up = (t) => Math.log((1 + t) / t) + Math.exp(-t) * ((-0.25 + 0.066 * t + 0.24 * t * t) - (-0.25 * t + 0.033 * t * t + 0.08 * t ** 3));
const A = (t) => Math.exp(-Up(t)), B = (t) => Math.exp(t * Up(t) - U(t));
const bnd = [];
for (let i = 1; i <= 200; i++) { const t = (i / 200) ** 2; bnd.push([A(t), B(t)]); }
const a1 = A(1), b1 = B(1);
for (let i = 0; i <= 20; i++) { const x = a1 + (b1 - a1) * i / 20; bnd.push([x, Math.exp(-U(1)) / x]); }
for (let i = 200; i >= 1; i--) { const t = (i / 200) ** 2; bnd.push([B(t), A(t)]); }
const TOK = { out: 'var(--c-1)', np: 'var(--c-2)', ok: 'var(--c-3)' };
const pts = R.points.map((p) => ({
  x: (p.X[0] + p.X[1]) / 2, y: p.Y, diamond: p.lambda === 1,
  token: p.outsideR ? TOK.out : p.notPlacedByU ? TOK.np : TOK.ok,
  k: 'λ = ' + p.lambda.toFixed(4), v: '(X, Y) = (' + f5(p.X[0]) + ', ' + f5(p.Y) + ') · ' + (p.outsideR ? 'outside R' : p.notPlacedByU ? 'not placed by U' : 'not refuted here')
}));
const FIG = CH.scatter({
  w: 900, h: 580, x0: 0, x1: 1, y0: 0, y1: 1.12, padL: 62,
  xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => ({ v, t: v.toFixed(1) })), yTicks: [0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => ({ v, t: v.toFixed(1) })),
  xLabel: 'X(λ)', yLabel: 'Y(λ)',
  vlines: [{ x: eU1, t: 'x = e^−U(1): the rule accepts any y left of here', dashed: true }],
  curves: [{ pts: [[0, 1], [1, 0]], dashed: true }, { pts: bnd }],
  pts,
  keys: [{ token: TOK.out, t: 'outside R (decided)' }, { token: TOK.np, t: 'not placed in R by U (decided)' }, { token: TOK.ok, t: 'not refuted here' },
    { token: 'var(--c-ctx)', t: 'solid: the edge of what U places (Lemma 15, drawn in floats); dashed: y = 1 − x' }],
  alt: 'The certificate\'s ' + D.points + ' pairs (X, Y) in the unit square. A solid curve from the top left to the bottom right is the edge of the region the problem\'s bound places in R; '
    + 'a dashed diagonal is the Erdős–Szekeres line y = 1 − x, inside R. Most pairs sit well above the solid curve: a row of them at Y = 0.9988 for X between 0.23 and 0.26, '
    + 'and a descending arc for X near 1. The diamond at X = ' + f5(last.X[0]) + ', Y = ' + f5(last.Y) + ' is the pair at λ = 1 that sets the constant. A dashed vertical line at x = '
    + eU1.toFixed(4) + ' marks where the problem\'s rule stops accepting every y.'
});

/* ---- a few rows of the decision ---- */
const pick = [0, 40, 80, 100, 120, 150, 180, R.points.length - 1].map((i) => R.points[i]);
const TABLE = C.table({
  cols: [{ h: 'λ', cls: 'n' }, { h: 'X(λ)', cls: 'n' }, { h: 'Y(λ)', cls: 'n' }, { h: 'decided' }, { h: 'witness' }],
  rows: pick.map((p) => [p.lambda.toFixed(4), f5(p.X[0]), f5(p.Y),
    { raw: C.tag(p.outsideR ? 'OUTSIDE R' : p.notPlacedByU ? 'NOT PLACED' : 'NOT REFUTED', p.outsideR ? 'cert' : 'open') },
    p.outsideR ? 'Erdős at e = ' + p.outsideR.e + ', p = ' + p.outsideR.p + ': gap ' + p.outsideR.gap.toFixed(5)
      : p.notPlacedByU ? 'U(' + p.notPlacedByU.s + ') exceeds ' + p.notPlacedByU.line.replace(' >= U(s)', '') + ' by ' + (p.notPlacedByU.U_lo - p.notPlacedByU.line_hi).toFixed(4) : '—'])
});

const B_ = [];
B_.push(C.header({
  eyebrow: 'cert-machine · audit · a benchmark\'s discoveries',
  title: 'HorizonMath\'s discoveries, decided',
  deck: 'HorizonMath, a benchmark of 113 mostly unsolved problems, credits frontier models with six discoveries and prints the constructions for three. '
    + 'Decided here from what it prints: the Kakeya construction\'s area holds, exactly. The Ramsey certificate — a claimed improvement of the best '
    + 'upper bound on diagonal Ramsey numbers, from 3.7992 to 3.6961 — does not satisfy the theorem it is applied to: the checker that accepted it '
    + 'admits pairs of numbers the theorem\'s region cannot contain, and the certificate uses one at the point that sets the constant. '
    + 'The other three expressions are not published.'
}));
B_.push(C.scope('The paper: arXiv 2603.15617v2 (10 September 2026, CC BY 4.0), Appendix A; the benchmark\'s code at github.com/ewang26/HorizonMath @ '
  + L.source.commit.slice(0, 8) + '; the theorem: Gupta, Ndiaye, Norin and Wei, arXiv 2407.19026v2. Each pinned by sha256 in corpus/horizonmath, the printed '
  + 'constructions transcribed there. What is refuted is a certificate, not an inequality: whether R(k,k) ≤ 3.6961^(k+o(k)) is true is untouched. Nothing has been sent to the authors.'));
B_.push(C.tldr({
  findingRaw: '<b>The Ramsey certificate is REFUTED.</b> At λ = 1, where the constant c = e^F(1) = 3.6960839… is read, it takes (X, Y) = ('
    + f5(last.X[0]) + ', ' + f5(last.Y) + '), and Gupta–Ndiaye–Norin–Wei\'s Theorem 14 needs that pair in their region R. It is not: '
    + 'Erdős\'s 1947 random coloring, at red clique size k = ' + w.e + '·ℓ and red-edge probability ' + w.p + ', gives R(k, ℓ) ≥ e^(' + w.erdosRateLo.toFixed(5)
    + '·ℓ − o(ℓ)), while the pair would bound it by e^(' + w.pairRateHi.toFixed(5) + '·ℓ). ' + D.outsideR + ' of the certificate\'s ' + D.points
    + ' decided points are outside R; ' + D.notPlacedByU + ' more are not placed in R by the bound the problem names. <b>The Kakeya area is CERTIFIED</b>: exactly '
    + K.decided.area.num + '/' + K.decided.area.den + ' = ' + K.decided.area.decimal.slice(0, 14) + '…, below the AlphaEvolve baseline.',
  mechanismRaw: 'R is symmetric, so a bound on R(k, ℓ) for ℓ ≤ k places a pair only when two inequalities hold: one for ℓ ≤ k and, by R(k, ℓ) = R(ℓ, k), one for ℓ > k. '
    + 'The problem statement, and its checker, accept a pair when <i>either</i> holds. With the problem\'s bound that admits every pair with x ≤ '
    + eU1.toFixed(5) + ', whatever y is — a strip R does not contain. Changing the checker\'s min to max, so both must hold, and running it again: '
    + 'the certificate fails on its first interval.',
  checkRaw: C.m('python3 tools/run-horizonmath-ledger.py --check') + ' · ' + C.m('python3 instruments/horizonmath/battery.py') + ' — ' + bm[1] + ' checks, '
    + bm[3] + ' red controls fired.'
}));
B_.push(C.stats([
  { k: 'discoveries credited', v: '6', n: 'Three by GPT-5.4 Pro (reproduced by GPT-5.6 Sol Max), three more by GPT-5.6 Sol Max alone.' },
  { k: 'constructions printed', v: '3', n: 'Appendix A details A.1–A.3; the paper says it details all six.' },
  { k: 'certified', v: '1', n: 'The Kakeya union area, as an exact rational.' },
  { k: 'refuted', v: '1', n: 'The Ramsey certificate: its pair at λ = 1 lies outside the region its theorem needs.' }
]));
B_.push(C.section({
  lab: '§1 · the claim', title: 'A better base for diagonal Ramsey numbers',
  bodyRaw: [
    C.pRaw('Campos, Griffiths, Morris and Sahasrabudhe proved R(k, k) ≤ (4 − ε)^k in 2023; Gupta, Ndiaye, Norin and Wei (GNNW) optimised the argument to '
      + 'R(k, k) ≤ 3.7992^(k+o(k)). Their Theorem 14 turns three conditions on functions F, M and Y of λ = ℓ/k into the bound R(k, ℓ) ≤ e^(F(ℓ/k)k + o(k)): '
      + 'F and F′ positive; the pair (X(λ), Y(λ)) in a region R, with X(λ) = (1 − e^−F′(λ))^(1/(1−M(λ)))·(1 − M(λ)); and F(λ) > −½(log X + λ log M + λ log Y). '
      + 'At λ = 1 the bound is the diagonal one, c = e^F(1).'),
    C.pRaw('HorizonMath poses this as a problem and credits GPT-5.4 Pro with a certificate: GNNW\'s own cubic correction plus −0.0778 λ⁵, and M and Y constant on '
      + '200 intervals of (0.001, 1]. Its checker accepts it, with c = 3.69608391263. The rebuilt certificate reproduces that number here, enclosed: '
      + C.m(D.cEnclosure[0].slice(0, 16)) + '.'),
    C.pRaw('The paper calls this "a verified certificate in the Gupta–Ndiaye–Norin–Wei framework", and says all six discoveries "have been verified by domain experts".')
  ].join('\n')
}));
B_.push(C.section({
  lab: '§2 · the region', title: 'Two inequalities, and a rule that asks for one', wide: true,
  bodyRaw: [
    C.pRaw('GNNW define R through its interior points: pairs (x, y) with R(k, ℓ) ≤ x^−k y^−ℓ for <i>all</i> k and ℓ with k + ℓ large. A bound known for ℓ ≤ k, '
      + 'R(k, ℓ) ≤ e^(U(ℓ/k)k), places a pair in R when, for every s in (0, 1],'),
    C.eq(C.esc('−log x − s·log y ≥ U(s)      (the pairs with ℓ ≤ k)') + '<br>' + C.esc('−log y − s·log x ≥ U(s)      (the pairs with ℓ > k, read through R(k, ℓ) = R(ℓ, k))')),
    C.pRaw('Their Lemma 15 proves both lines before it places a point. HorizonMath\'s statement defines its inner region by the first line alone and adds: "Since '
      + 'R(k, ℓ) = R(ℓ, k), the pair (x, y) is accepted if either (x, y) ∈ R₀ or (y, x) ∈ R₀." Symmetry makes R symmetric; it does not turn a one-sided test into a '
      + 'two-sided one. Because U increases on (0, 1], the first line holds for every y as soon as x ≤ e^−U(1) = ' + eU1.toFixed(8) + ' — so the rule accepts, for '
      + 'instance, (0.26, 0.9999), which R cannot contain.'),
    C.figure({ svgRaw: FIG, caption: 'Each dot is one of the certificate\'s pairs (X(λ), Y(λ)), at the midpoint of an interval where M and Y are constant; the diamond is λ = 1. '
      + 'Colour is repeated in the legend and in the table below. The certificate sets Y "0.12% below the active xy = e^−U(1) branch" on every interval — a branch '
      + 'Lemma 15 proves only for ' + a1.toFixed(4) + ' ≤ x ≤ ' + b1.toFixed(4) + '.' })
  ].join('\n')
}));
B_.push(C.section({
  lab: '§3 · the decision', title: 'The pair that sets the constant is outside R', wide: true,
  bodyRaw: [
    C.pRaw('Membership in R has a price that can be checked from below. For k, ℓ ≥ 3 and 0 < p < 1, colour the edges of K_N red with probability p, with '
      + 'N = ⌊min(p^−(k−1)/2, (1 − p)^−(ℓ−1)/2)⌋: the expected numbers of red K_k and blue K_ℓ are each below 1/6, so some colouring has neither, and R(k, ℓ) > N '
      + '(Erdős 1947). If (x, y) were in R, then along k = ⌈eℓ⌉ the two bounds would force e·(−log x) + (−log y) ≥ min((e/2)(−log p), ½(−log(1 − p))), and the same with x and y exchanged.'),
    C.pRaw('At λ = 1 the certificate\'s pair fails that with e = ' + w.e + ' and p = ' + w.p + ': the lower bound grows at ' + w.erdosRateLo.toFixed(6)
      + ' per ℓ, the pair allows ' + w.pairRateHi.toFixed(6) + '. Both are enclosed in decimal intervals at 60 digits, every rounding outward. The pair is not in R; '
      + 'Theorem 14 does not apply; the certificate proves nothing about c.'),
    TABLE,
    C.pRaw('Across the certificate: ' + D.outsideR + ' of ' + D.points + ' points outside R, each with its own (e, p); ' + D.notPlacedByU + ' where one rational s shows the '
      + 'problem\'s own U does not place the pair (it may or may not lie in R by some other bound); ' + D.notRefutedHere + ' not refuted — the pairs with X near the '
      + 'window where the xy = e^−U(1) branch is legitimate.'),
    C.pRaw('The checker, run as published at the pinned commit, accepts the certificate in 107 s. With ' + C.m('min(bu, bs)') + ' changed to ' + C.m('max(bu, bs)')
      + ' — both orientations required — it refuses it in 0.2 s, on the first interval: ' + C.esc('"R_0 check failed somewhere on [0.001, 0.0010014]"') + '.')
  ].join('\n')
}));
B_.push(C.section({
  lab: '§4 · the Kakeya construction', title: 'The area holds, exactly',
  bodyRaw: [
    C.pRaw('128 thin triangles with slopes i/128, base width 1/128, and 128 intercepts the model chose — every one a multiple of 1/1024. Between two consecutive '
      + 'crossings of the 256 edge lines the union\'s cross-section has a fixed combinatorial shape, so its length is linear there; summing width times midpoint '
      + 'length over the ' + K.decided.pieces.toLocaleString('en-US') + ' pieces gives the area as a rational, with no rounding anywhere:'),
    C.eq(C.esc('Area(E) = ' + K.decided.area.num + ' / ' + K.decided.area.den + ' = ' + K.decided.area.decimal.slice(0, 22) + '…')),
    C.pRaw('That is ' + K.decided.improvement.slice(0, 10) + ' below the printed AlphaEvolve baseline 0.1148103258186177, and the paper\'s 0.1091479892 is ' + K.decided.printedIs
      + '. The benchmark\'s own checker computes the same area in floating point, to 15 digits, against Keich\'s older baseline.')
  ].join('\n')
}));
B_.push(C.section({
  lab: '§5 · limits', title: 'What is not decided here',
  bodyRaw: C.plainList([
    { b: 'Whether c < 3.7992 is reachable.', text: 'A certificate with pairs inside R might exist for this F or another. The Erdős bound alone does not rule out the quintic at λ = 1 for every M; deciding that needs a better outer bound on R, or a certificate that passes the two-sided test.' },
    { b: 'The three GPT-5.6 Sol Max closed forms.', text: 'The Airy moment a₅ and the two spherical-mode quality factors: the expressions are not in the paper, which details A.1–A.3. Agreement with a reference to 20 digits would not decide an equality in any case.' },
    { b: 'The spinor-norm integral.', text: 'Γ(1/4)²/(8√π) + Γ(3/4)²/√π, with a printed derivation through a Landen transformation and a Beltrami transform to 2E(½) − K(½)/2. Not checked here yet: an enclosure of the integral to hundreds of digits, or each step, is next.' },
    { b: 'Whose defect.', text: 'The model optimised against the problem exactly as stated — the statement gives the either-orientation rule in words. The defect is in the statement and its checker, and in the verification that relied on them.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-horizonmath.js from certs/horizonmath-ledger.json (' + L.generated + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls fired. The Lemma 15 curve in the figure is drawn in floats; every verdict is decided in intervals.') + '</p><p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'horizonmath.html'), TPL.render({
  title: 'HorizonMath\'s discoveries, decided · cert-machine', bodyRaw: B_.join('\n\n') + CH.script(), footRaw: foot,
  desc: 'The discoveries HorizonMath (arXiv 2603.15617) credits to frontier models, decided from what it prints: the Kakeya area certified exactly; the diagonal-Ramsey certificate refuted — its pair at λ = 1 lies outside the region Gupta–Ndiaye–Norin–Wei\'s theorem needs, admitted by a checker that asks one of two inequalities.',
  path: '/reports/horizonmath.html'
}));
console.log('reports/horizonmath.html written: Ramsey ' + R.verdict + ' (' + D.outsideR + '/' + D.points + ' outside R), Kakeya ' + K.verdict + ' @ git ' + git);
