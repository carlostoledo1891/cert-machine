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
/* WARRANT v2.2 (design/WARRANT.md), 2026-10-28: a number on this page is decided by exact arithmetic unless it is marked.
   What the paper, its checker or its certificate printed is their claim (COMPUTED, underlined dashed); so is a timing and
   a value computed here in floats (the Lemma 15 window, the curve in the figure). A printed end of an enclosure moves
   OUTWARD (design/outward.js): until this pass the tl;dr printed the Erdős rate's LOWER end rounded up (0.01213 for
   0.0121266…) and §2 printed e^−U(1), the edge of the strip the rule accepts, rounded up (0.26292279 for 0.2629227864…). */
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OUT = require(path.join(ROOT, 'design', 'outward.js'));
/* D10: a claimant's number names the record cell that holds it; a timing names the cell it is read from */
const said = (s, title, claim) => W.value(C.esc(String(s)), W.COMPUTED, { claim, title: title || 'printed by HorizonMath: a claim, not decided here' });
const WHY_TIMED = 'a wall-clock time of their checker, measured on 2026-09-29: not decided';
const timed = (s, from) => W.value(C.esc(String(s)), W.COMPUTED, { derived: from, title: WHY_TIMED });
const LEDGER = 'certs/horizonmath-ledger.json', META = 'corpus/horizonmath/meta.json';
const floated = (s, title) => W.value(C.esc(String(s)), W.COMPUTED, { title });

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
/* THE TYPED NUMBERS (WARRANT rule 8): each number the prose types, read from its record; the page refuses when a record
   stops saying it. e^−U(1) is an upper limit on the accepted x, so it prints DOWN; the Erdős rate is a lower bound, DOWN;
   the pair's rate an upper bound, UP; a gap is a lower bound, DOWN. */
const PRN = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'horizonmath', 'ramsey-a3-printed.json'), 'utf8'));
const KAK = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'horizonmath', 'kakeya-a2-intercepts.json'), 'utf8'));
const OBS = meta.observed;
const theirC = (/c = e\^\{F\(1\)\} = ([0-9.]+);/.exec(R.theirChecker) || die('their checker\'s printed c is no longer in the record'))[1];
const gnnwBase = (/improving ([0-9.]+) \(Gupta/.exec(R.claim) || die('the record no longer names the bound the claim improves'))[1];
const andSecs = (/; ([0-9.]+) s\)$/.exec(OBS.ramseyValidatorWithAnd.output) || die('the max() re-run no longer records its time'))[1];
const quint = PRN.coeffs[4], shrinkPct = (100 * Number(PRN.shrink)).toFixed(2).replace(/0+$/, '') + '%';
if (!(gnnwBase === '3.7992' && theirC === '3.69608391263' && OBS.ramseyValidator.seconds === 107 && /valid: true/.test(OBS.ramseyValidator.output)
  && /valid: false/.test(OBS.ramseyValidatorWithAnd.output) && quint === '-0.0778' && PRN.coeffs.length === 5 && PRN.M_values.length === 200
  && Number(PRN.lambda0) === 0.001 && shrinkPct === '0.12%' && /All six problems/.test(meta.sources.paper.read) && /A\.1-A\.3 only/.test(meta.sources.paper.read)))
  die('a number the prose types (3.7992, 3.69608391263, 107 s, −0.0778, 200 intervals, 0.12%, six and three) moved in its record');
if (!(KAK.intercepts.length === 128 && KAK.intercepts.every((v) => Number.isInteger(Number(v) * 1024)))) die('the 128 intercepts are no longer all multiples of 1/1024');
if (!(D.cEnclosure[0].startsWith('3.6960839') && OUT.up(D.cEnclosure[1], 4) === '3.6961')) die('the enclosed c no longer reads 3.6960839… or rounds to the 3.6961 the deck states');
/* (0.26, 0.9999): accepted by the rule (x below e^−U(1)) and outside R, because it dominates the λ = 1 pair, which is
   decided outside R, and R is a down-set (if R(k, ℓ) ≤ x^−k y^−ℓ, the same holds for any smaller x and y) */
const EX = [0.26, 0.9999];
if (!(EX[0] <= Number(OUT.down(eU1, 8)) && EX[0] >= last.X[1] && EX[1] >= last.Y && last.outsideR)) die('(0.26, 0.9999) no longer sits in the strip and above the λ = 1 pair');
const rateLo = (x, d) => OUT.down(x, d), rateHi = (x, d) => OUT.up(x, d);
{ const row = R.points.filter((p) => p.Y === last.Y).map((p) => p.X[0]);
  if (!(row.length > 1 && Math.min(...row) >= 0.22 && Math.max(...row) <= 0.27)) die('the row of pairs at Y = ' + last.Y + ' no longer sits between X = 0.23 and 0.26'); }
/* the window where Lemma 15 proves the branch, in floats (the curve below): computed, not decided */
const LEMMA15 = 'computed here in floats from the problem\'s U: where Lemma 15 proves the xy = e^−U(1) branch. Not decided.';

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
  /* WARRANT (2026-10-28): the strokes say what each line rests on. Until this pass they said the opposite: the exact
     diagonal y = 1 − x and the decided e^−U(1) were dashed, and the curve drawn in floats was solid. Now the Lemma 15 edge
     is COMPUTED (dashed, through playground/warrant.js); the diagonal is exact and solid, in the context grey so it stays
     behind the data; and so is the vertical at the enclosed e^−U(1) */
  vlines: [{ x: eU1, t: 'x = e^−U(1): the rule accepts any y left of here' }],
  curves: [{ pts: [[0, 1], [1, 0]], token: 'var(--c-ctx)' }, { pts: bnd, standing: W.COMPUTED }],
  pts,
  keys: [{ token: TOK.out, t: 'outside R (decided)' }, { token: TOK.np, t: 'not placed in R by U (decided)' }, { token: TOK.ok, t: 'not refuted here' },
    { token: 'var(--ink-3)', kind: 'dash', t: 'the edge of what U places (Lemma 15), in floats' }, { token: 'var(--c-ctx)', kind: 'line', t: 'y = 1 − x, exact' }],
  alt: 'The certificate\'s ' + D.points + ' pairs (X, Y) in the unit square. A dashed curve from the top left to the bottom right is the edge of the region the problem\'s bound places in R, computed in floats; '
    + 'a solid diagonal is the Erdős–Szekeres line y = 1 − x, inside R. Most pairs sit well above the dashed curve: a row of them at Y = ' + last.Y + ' for X between 0.23 and 0.26, '
    + 'and a descending arc for X near 1. The diamond at X = ' + f5(last.X[0]) + ', Y = ' + f5(last.Y) + ' is the pair at λ = 1 that sets the constant. A solid vertical line at x = '
    + OUT.down(eU1, 4) + ' marks where the problem\'s rule stops accepting every y.'
});

/* ---- a few rows of the decision ---- */
const pick = [0, 40, 80, 100, 120, 150, 180, R.points.length - 1].map((i) => R.points[i]);
const TABLE = C.table({
  cols: [{ h: 'λ', cls: 'n' }, { h: 'X(λ)', cls: 'n' }, { h: 'Y(λ)', cls: 'n' }, { h: 'decided' }, { h: 'witness' }],
  rows: pick.map((p) => [p.lambda.toFixed(4), f5(p.X[0]), f5(p.Y),
    { raw: C.tag(p.outsideR ? 'OUTSIDE R' : p.notPlacedByU ? 'NOT PLACED' : 'NOT REFUTED', p.outsideR ? 'cert' : 'open') },
    /* the × (WARRANT rule 5): a pair the certificate itself uses, exhibited outside R with its own (e, p) */
    p.outsideR ? { raw: W.witness('a pair the certificate uses, outside R') + ' ' + C.esc('Erdős at e = ' + p.outsideR.e + ', p = ' + p.outsideR.p + ': gap ≥ ' + OUT.down(p.outsideR.gap, 5)) }
      : p.notPlacedByU ? 'U(' + p.notPlacedByU.s + ') exceeds ' + p.notPlacedByU.line.replace(' >= U(s)', '') + ' by ≥ ' + OUT.down(p.notPlacedByU.U_lo - p.notPlacedByU.line_hi, 4) : '—'])
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
  + 'constructions transcribed there. What is refuted is a certificate, not an inequality: whether R(k,k) ≤ 3.6961^(k+o(k)) is true is untouched. Reported to the authors on 2026-10-05 as HorizonMath issue #10 (github.com/ewang26/HorizonMath/issues/10).'));
B_.push(C.tldr({
  findingRaw: '<b>The Ramsey certificate is REFUTED.</b> At λ = 1, where the constant c = e^F(1) = 3.6960839… is read, it takes (X, Y) = ('
    + f5(last.X[0]) + ', ' + f5(last.Y) + ') ' + W.witness('the pair the certificate uses at λ = 1, outside R') + ', and Gupta–Ndiaye–Norin–Wei\'s Theorem 14 needs that pair in their region R. It is not: '
    + 'Erdős\'s 1947 random coloring, at red clique size k = ' + w.e + '·ℓ and red-edge probability ' + w.p + ', gives R(k, ℓ) ≥ e^(' + rateLo(w.erdosRateLo, 5)
    + '·ℓ − o(ℓ)), while the pair would bound it by e^(' + rateHi(w.pairRateHi, 5) + '·ℓ). ' + D.outsideR + ' of the certificate\'s ' + D.points
    + ' decided points are outside R; ' + D.notPlacedByU + ' more are not placed in R by the bound the problem names. <b>The Kakeya area is CERTIFIED</b>: exactly '
    + K.decided.area.num + '/' + K.decided.area.den + ' = ' + K.decided.area.decimal.slice(0, 14) + '…, below the AlphaEvolve baseline.',
  mechanismRaw: 'R is symmetric, so a bound on R(k, ℓ) for ℓ ≤ k places a pair only when two inequalities hold: one for ℓ ≤ k and, by R(k, ℓ) = R(ℓ, k), one for ℓ > k. '
    + 'The problem statement, and its checker, accept a pair when <i>either</i> holds. With the problem\'s bound that admits every pair with x ≤ '
    + OUT.down(eU1, 5) + ', whatever y is — a strip R does not contain. Changing the checker\'s min to max, so both must hold, and running it again: '
    + 'the certificate fails on its first interval.',
  checkRaw: C.m('python3 tools/run-horizonmath-ledger.py --check') + ' · ' + C.m('python3 instruments/horizonmath/battery.py') + ' — ' + bm[1] + ' checks, '
    + bm[3] + ' red controls fired.'
}));
B_.push(C.stats([
  { k: 'discoveries credited', vRaw: said('6', 'the paper\'s own count (p. 8): a claim, not decided here', META + '#/sources/paper/read'), n: 'Three by GPT-5.4 Pro (reproduced by GPT-5.6 Sol Max), three more by GPT-5.6 Sol Max alone.' },
  { k: 'constructions printed', v: '3', n: 'Appendix A details A.1–A.3; the paper says it details all six.' },
  { k: 'certified', v: '1', n: 'The Kakeya union area, as an exact rational.' },
  { k: 'refuted', v: '1', n: 'The Ramsey certificate: its pair at λ = 1 lies outside the region its theorem needs.' }
]));
/* the marks, said once (WARRANT rule 9) */
B_.push('<div class="col">' + C.note({ lab: 'how to read the marks', bodyRaw: C.pRaw('Every number on this page is decided by exact arithmetic unless it is marked. '
  + 'Underlined dashed: nothing here decided it — a number the paper, its checker or its certificate printed, a timing, or a value computed here in floats. '
  + 'The figure uses the same patterns as strokes. ' + W.witness('a pair the certificate uses, outside R') + ' marks a pair the certificate itself uses that lies outside R, each shown with its own Erdős colouring. '
  + 'What the refutation rests on, and how far each premise was checked, is listed in §3.')
  + W.legendHtml({ compact: true }) }) + '</div>');
B_.push(C.section({
  lab: '§1 · the claim', title: 'A better base for diagonal Ramsey numbers',
  bodyRaw: [
    C.pRaw('Campos, Griffiths, Morris and Sahasrabudhe proved R(k, k) ≤ (4 − ε)^k in 2023; Gupta, Ndiaye, Norin and Wei (GNNW) optimised the argument to '
      + 'R(k, k) ≤ ' + said(gnnwBase, 'GNNW\'s published bound (arXiv:2407.19026v2): printed, not decided here', LEDGER + '#/rows[id=' + R.id + ']/claim') + '^(k+o(k)). Their Theorem 14 turns three conditions on functions F, M and Y of λ = ℓ/k into the bound R(k, ℓ) ≤ e^(F(ℓ/k)k + o(k)): '
      + 'F and F′ positive; the pair (X(λ), Y(λ)) in a region R, with X(λ) = (1 − e^−F′(λ))^(1/(1−M(λ)))·(1 − M(λ)); and F(λ) > −½(log X + λ log M + λ log Y). '
      + 'At λ = 1 the bound is the diagonal one, c = e^F(1).'),
    C.pRaw('HorizonMath poses this as a problem and credits GPT-5.4 Pro with a certificate: GNNW\'s own cubic correction plus ' + said(quint.replace('-', '−'), 'the certificate\'s printed coefficient (Appendix A.3): its input, as printed', 'corpus/horizonmath/ramsey-a3-printed.json#/coeffs/4') + ' λ⁵, and M and Y constant on '
      + PRN.M_values.length + ' intervals of (' + Number(PRN.lambda0) + ', 1]. Its checker accepts it, with c = ' + said(theirC, 'what their checker printed, in mpmath: a claim, not decided here', LEDGER + '#/rows[id=' + R.id + ']/theirChecker') + '. The rebuilt certificate reproduces that number here, enclosed: '
      /* both ends, outward at 14 decimals (it printed one end cut at 16 characters until 2026-10-28) */
      + C.m('[' + OUT.down(D.cEnclosure[0], 14) + ', ' + OUT.up(D.cEnclosure[1], 14) + ']') + '.'),
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
      + 'two-sided one. Because U increases on (0, 1], the first line holds for every y as soon as x ≤ e^−U(1), and e^−U(1) ≥ ' + OUT.down(eU1, 8) + ' — so the rule accepts, for '
      + 'instance, (' + EX[0] + ', ' + EX[1] + '), which R cannot contain: it lies above and to the right of the λ = 1 pair, which §3 decides is outside R, and R contains every pair below and left of any of its points.'),
    C.figure({ svgRaw: FIG, record: LEDGER, stop: 'the pair at λ = 1 is not the one decided outside R, or the row of pairs at its Y no longer sits between X = 0.23 and 0.26', caption: 'Each dot is one of the certificate\'s pairs (X(λ), Y(λ)), at the midpoint of an interval where M and Y are constant; the diamond is λ = 1. '
      + 'Colour is repeated in the legend and in the table below. The strokes carry standing: the dashed curve is computed in floats; the solid diagonal y = 1 − x and the solid vertical at e^−U(1) are exact.' }),
    C.pRaw('The certificate sets Y "' + shrinkPct + ' below the active xy = e^−U(1) branch" on every interval — a branch Lemma 15 proves only for '
      + floated(a1.toFixed(4), LEMMA15) + ' ≤ x ≤ ' + floated(b1.toFixed(4), LEMMA15) + ', the middle stretch of the dashed curve, where it follows xy = e^−U(1).')
  ].join('\n')
}));
B_.push(C.section({
  lab: '§3 · the decision', title: 'The pair that sets the constant is outside R', wide: true,
  bodyRaw: [
    C.pRaw('Membership in R has a price that can be checked from below. For k, ℓ ≥ 3 and 0 < p < 1, colour the edges of K_N red with probability p, with '
      + 'N = ⌊min(p^−(k−1)/2, (1 − p)^−(ℓ−1)/2)⌋: the expected numbers of red K_k and blue K_ℓ are each below 1/6, so some colouring has neither, and R(k, ℓ) > N '
      + '(Erdős 1947). If (x, y) were in R, then along k = ⌈eℓ⌉ the two bounds would force e·(−log x) + (−log y) ≥ min((e/2)(−log p), ½(−log(1 − p))), and the same with x and y exchanged.'),
    C.pRaw('At λ = 1 the certificate\'s pair fails that with e = ' + w.e + ' and p = ' + w.p + ': the lower bound grows at a rate of at least ' + rateLo(w.erdosRateLo, 6)
      + ' per ℓ, the pair allows a rate of at most ' + rateHi(w.pairRateHi, 6) + '. Both are enclosed in decimal intervals at 60 digits, every rounding outward, and the two printed here round outward too. The pair is not in R; '
      + 'Theorem 14 does not apply; the certificate proves nothing about c.'),
    TABLE,
    C.pRaw('Across the certificate: ' + D.outsideR + ' of ' + D.points + ' points outside R, each with its own (e, p); ' + D.notPlacedByU + ' where one rational s shows the '
      + 'problem\'s own U does not place the pair (it may or may not lie in R by some other bound); ' + D.notRefutedHere + ' not refuted — the pairs with X near the '
      + 'window where the xy = e^−U(1) branch is legitimate.'),
    C.pRaw('The checker, run as published at the pinned commit, accepts the certificate in ' + W.val({ rec: { path: META, ptr: '/observed/ramseyValidator/seconds' }, standing: W.COMPUTED, fmt: 'int', why: WHY_TIMED }) + ' s' + '. With ' + C.m('min(bu, bs)') + ' changed to ' + C.m('max(bu, bs)')
      + ' — both orientations required — it refuses it in ' + timed(andSecs + ' s', META + '#/observed/ramseyValidatorWithAnd/output') + ', on the first interval: ' + C.esc('"R_0 check failed somewhere on [0.001, 0.0010014]"') + '.'),
    /* WHAT THE REFUTATION RESTS ON (WARRANT v2.1, rule 11; a step read and not run is graded assumed, 2026-10-28) */
    C.pRaw('<b>What the refutation rests on</b>, in the order the decision travels through it:') + W.premisesHtml([
      { grade: W.ASSUMED, label: 'GNNW\'s region R, and its closure under smaller x and y', evidence: 'their definition (12) and Lemma 15, read in arXiv:2407.19026v2 (pinned by sha256 in <span class="m">corpus/<wbr>horizonmath/<wbr>meta.json</span>); no machine here checked them' },
      { grade: W.ASSUMED, label: 'Erdős\'s 1947 lower bound, and its consequence along k = ⌈eℓ⌉', evidence: 'the random-colouring argument written out above: a classical theorem and a few lines of algebra, read; no machine here checked it' }
    ], { meetLine: 'The two rates are enclosed exactly, at 60 digits, every rounding outward; the weakest premise is <b>assumed</b>: the definition of R and Erdős\'s bound are read, not machine-checked.' })
  ].join('\n')
}));
B_.push(C.section({
  lab: '§4 · the Kakeya construction', title: 'The area holds, exactly',
  bodyRaw: [
    C.pRaw('128 thin triangles with slopes i/128, base width 1/128, and 128 intercepts the model chose — every one a multiple of 1/1024. Between two consecutive '
      + 'crossings of the 256 edge lines the union\'s cross-section has a fixed combinatorial shape, so its length is linear there; summing width times midpoint '
      + 'length over the ' + K.decided.pieces.toLocaleString('en-US') + ' pieces gives the area as a rational, with no rounding anywhere:'),
    C.eq(C.esc('Area(E) = ' + K.decided.area.num + ' / ' + K.decided.area.den + ' = ' + K.decided.area.decimal.slice(0, 22) + '…')),
    C.pRaw('That is at least ' + OUT.down(K.decided.improvement, 8) + ' below the printed AlphaEvolve baseline ' + said(KAK.baseline, 'the AlphaEvolve baseline the problem statement prints: a claim, not decided here; the comparison with it is exact', 'corpus/horizonmath/kakeya-a2-intercepts.json#/baseline') + ', and the paper\'s ' + said(KAK.printedArea, 'the area the paper prints: a claim; decided here to be the exact area\'s ' + K.decided.printedIs.replace(/^its /, ''), 'corpus/horizonmath/kakeya-a2-intercepts.json#/printedArea') + ' is ' + K.decided.printedIs
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
/* what has come back from outside: re-runs and credits, from design/outside.js (one record, pinned quotes) */
{ const OUT = require(path.join(ROOT, 'design', 'outside.js')).section(C, 'reports/horizonmath.html'); if (OUT) B_.push(OUT); }

const foot = '<p>' + C.esc('Generated by tools/build-report-horizonmath.js from certs/horizonmath-ledger.json (' + L.generated + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls fired. The Lemma 15 curve in the figure is drawn in floats; every verdict is decided in intervals.') + '</p><p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'horizonmath.html'), TPL.render({
  title: 'HorizonMath\'s discoveries, decided · cert-machine', bodyRaw: B_.join('\n\n') + CH.script(), footRaw: foot,
  desc: 'The discoveries HorizonMath (arXiv 2603.15617) credits to frontier models, decided from what it prints: the Kakeya area certified exactly; the diagonal-Ramsey certificate refuted — its pair at λ = 1 lies outside the region Gupta–Ndiaye–Norin–Wei\'s theorem needs, admitted by a checker that asks one of two inequalities.',
  path: '/reports/horizonmath.html'
}));
console.log('reports/horizonmath.html written: Ramsey ' + R.verdict + ' (' + D.outsideR + '/' + D.points + ' outside R), Kakeya ' + K.verdict + ' @ git ' + git);
