#!/usr/bin/env node
/* build-report-zeta7-anand.js — reports/zeta7-anand.html: a claimed proof that ζ(7) is irrational,
   audited.

   P. Anand's preprint "Zeta 7 is Irrational" (Zenodo 22920911, v1, 2026-09-23) adapts Fauzan's ζ(5)
   argument. On 2026-10-03 a third party, GitHub user huntrontrakkr, reported on gmDevi/zeta-7-21-lean
   (issue #1) that the outer integral I_out does not follow from the paper's own formulas, and that the
   decay constant moves from −11.99 to +0.95. This page decides that report, and what it does to the proof,
   in exact arithmetic written here.

   EVERY NUMBER ON THE PAGE IS READ FROM certs/zeta7-anand-audit.json, which
   instruments/zeta7audit/decide.py writes (exact rationals and arb balls), and from the measured-family
   record it pins. This builder runs instruments/zeta7audit/battery.py and refuses unless it passes clean
   with every red control fired, refuses a record whose verdicts overreach (the theorem itself called
   refuted), and never computes a scientific quantity itself — only rounds for display.

   usage: node tools/build-report-zeta7-anand.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('ZETA7-ANAND REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const fmt = (n) => Number(n).toLocaleString('en-US');
const sg = (v, d) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d === undefined ? 2 : d);
const mq = (s) => String(s).replace(/-/g, '−');            /* an exact rational, typeset */

/* ---- gates ------------------------------------------------------------------ */
const bat = cp.spawnSync('python3', [path.join(ROOT, 'instruments', 'zeta7audit', 'battery.py')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /zeta7audit battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the zeta7audit battery did not pass clean:\n' + bout.slice(-900));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);

const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'zeta7-anand-audit.json'), 'utf8'));
const V = Object.fromEntries(R.verdicts.map((v) => [v.id, v]));
if (R.verdict !== 'REFUTED') die('the record\'s verdict is ' + R.verdict + ' — this page is written for a refuted proof route');
if (!V['paper-thm11'] || V['paper-thm11'].verdict !== 'REFUSED') die('Theorem 1.1 must be REFUSED (not proved here), never refuted');
if (R.issue.author !== 'huntrontrakkr' || R.issue.authorIsThisLab) die('the issue must be credited to its third-party author');
const O = R.outer, M = R.margins, PC = M.printedChain, CN = R.constants, FK = R.finiteK, LN = R.lean, MS = R.measured;
const S = Object.fromEntries(M.scenarios.map((s) => [s.key, s]));
const f = (x) => Number(x.f);
if (!(f(O.formula.R2.value) > 0 && f(O.formula.R1.value) > 0 && f(O.table5.integral) < 0)) die('the signs of I_out moved — rewrite the page, do not rebuild it');
if (!(f(M.decidedMinA200plusU) > 0 && f(M.decidedMinB0plusU) > 0)) die('a decided scenario is no longer positive — rewrite the page');
const fk = FK.rows.reduce((m, r) => (!m || r.n > m.n ? r : m), null);
const m3 = MS.rows.reduce((m, r) => (!m || r.n > m.n ? r : m), null);
const mid = (b) => (b[0] + b[1]) / 2;
const vtag = (w) => C.tag(w, { CERTIFIED: 'cert', REFUTED: 'open', REFUSED: 'dep', PARTIAL: 'held' }[w] || 'dep');
const issueLink = '<a href="' + C.esc(R.issue.url) + '">issue #' + R.issue.number + '</a>';
const who = C.m('@' + R.issue.author);

/* ---- the figure: Table 5 against the integrand the paper's own formulas give --------------- */
const fr = (x) => { const [a, b] = String(x).split('/'); return Number(a) / (b === undefined ? 1 : Number(b)); };
const pts = (rows) => rows.flatMap((r) => { const lo = fr(r.lo), hi = fr(r.hi), b = fr(r.b), c = fr(r.c); return [[lo, b + c * lo], [hi, b + c * hi]]; });
const tabPts = pts(O.table5.rows), formPts = pts(O.formula.R2.pieces);
const allY = tabPts.concat(formPts).map((p) => p[1]);
const yLo = Math.floor(Math.min(...allY) / 2) * 2, yHi = Math.ceil(Math.max(...allY) / 2) * 2;
const yT = []; for (let v = yLo; v <= yHi + 1e-9; v += 2) yT.push({ v, t: v === 0 ? '0' : sg(v, 0) });
const FIG = CH.lines({
  w: 900, h: 380, x0: 1 / 3, x1: 37 / 20, y0: yLo, y1: yHi,
  xTicks: [[1 / 3, '1/3'], [0.5, '1/2'], [0.75, '3/4'], [1, '1'], [1.25, '5/4'], [1.5, '3/2'], [37 / 20, '37/20']].map(([v, t]) => ({ v, t })),
  yTicks: yT, xLabel: 'y = p/K, the outer range of primes', yLabel: 'T(y), the outer integrand',
  rules: [{ v: 0, t: 'zero' }],
  series: [
    { name: 'from the paper\'s formulas', pts: formPts, token: CH.CAT[0] },
    { name: 'Table 5 as printed', pts: tabPts, token: CH.CAT[1], dashed: true }
  ],
  keys: [{ token: CH.CAT[0], t: 'decided: from the paper\'s own formulas (54), (58), (59), (62) — integral ' + sg(f(O.formula.R2.value), 3), kind: 'line' },
    { token: CH.CAT[1], t: 'claimed: Table 5 as printed — integral ' + sg(f(O.table5.integral), 2) + ', the printed (122)', kind: 'dash' }],
  xOf: (x) => 'y = ' + x.toFixed(4), vOf: (v) => 'T = ' + sg(v, 3),
  alt: 'Two piecewise-linear outer integrands over y from 1/3 to 37/20. The one computed from the paper\'s own formulas stays between about '
    + sg(Math.min(...formPts.map((p) => p[1])), 1) + ' and ' + sg(Math.max(...formPts.map((p) => p[1])), 1) + ' and integrates to '
    + sg(f(O.formula.R2.value), 3) + '. Table 5 as printed runs between about ' + sg(Math.min(...tabPts.map((p) => p[1])), 0) + ' and '
    + sg(Math.max(...tabPts.map((p) => p[1])), 0) + ', drops to about −14 past y = 1, and integrates to ' + sg(f(O.table5.integral), 2) + '.'
});

/* ---- the page ---------------------------------------------------------------- */
const P = [];
P.push(C.header({
  eyebrow: 'cert-machine · report · ζ(7) · a claimed proof, audited · generated from the record',
  title: 'A claimed proof that ζ(7) is irrational: the inequality it rests on fails',
  deck: 'A preprint posted on 23 September 2026 claims that ζ(7) is irrational, by adapting the Hankel-determinant argument '
    + 'that settled ζ(5) a week earlier. The proof rests on one number, A₂₀₀ + U, being negative; the paper prints −11.99. '
    + 'On 3 October a reader, GitHub user @' + R.issue.author + ', reported that one of its integrals does not follow from the paper\'s own '
    + 'formulas. We recomputed it in exact arithmetic, with code written here. The reader is right: the number is positive, under every '
    + 'reading of the paper and every correction in its favour that we could decide. That breaks this proof. It does not show that ζ(7) is '
    + 'rational — whether ζ(7) is irrational remains open.'
}));

P.push(C.tldr({
  findingRaw: 'The paper needs ' + C.m('A₂₀₀ + U < 0') + ' and prints ' + C.m(sg(f(PC.A200plusU), 2)) + '. Computed from its own formulas, the outer '
    + 'integral is ' + C.m(sg(f(O.formula.R2.value), 3)) + ', not ' + C.m(sg(f(O.table5.integral), 2)) + ', and ' + C.m('A₂₀₀ + U')
    + ' is ' + C.m(sg(f(S['R2|printed|printed'].A200plusU), 2)) + '. With every correction in the author\'s favour that we could decide, it is still '
    + C.m(sg(f(M.decidedMinA200plusU), 2)) + ', and no other cutoff M can bring it below zero. The proof route fails. Theorem 1.1 is not '
    + 'disproved: ζ(7) may well be irrational; this paper does not show it.',
  mechanismRaw: 'The paper\'s Table 5, the piecewise-linear function it integrates, does not come from its own exponent formula (59). '
    + 'Past y = 1 the paper itself sets the local exponent to zero, which leaves 37/20 − y ≥ 0; Table 5 prints −239/20 − 2y there. '
    + 'The local p-adic bound (59) is not the problem: on the paper\'s own polynomials at K = 40, 80, 120 it holds at every prime we tested, '
    + 'and holds with equality at most of them. The error is in integrating it.',
  checkRaw: C.m('python3 instruments/zeta7audit/battery.py') + ' re-derives every decided number, re-runs two of the paper\'s polynomials '
    + 'exactly, and fires ' + nReds + ' planted forgeries (' + nChecks + ' checks, under a minute). ' + C.m('instruments/zetahankel/.venv/bin/python instruments/zeta7audit/decide.py')
    + ' rewrites the record in seconds.'
}));

P.push(C.stats([
  { k: 'A₂₀₀ + U, as printed', v: sg(f(PC.A200plusU), 2), n: 'must be negative for the proof to work' },
  { k: 'A₂₀₀ + U, recomputed', v: sg(f(S['R2|printed|printed'].A200plusU), 2), n: 'the paper\'s own formulas, its own A0 and U' },
  { k: 'smallest after any decided repair', v: sg(f(M.decidedMinA200plusU), 2), n: 'every reading, A0 and U corrected in the author\'s favour' },
  { k: 'outer integral I_out', v: sg(f(O.formula.R2.value), 3), n: 'printed: ' + sg(f(O.table5.integral), 2) + ' (122)' },
  { k: 'the family itself, n = ' + m3.n, v: sg(mid(m3.logP_per_K2), 2), n: 'log P(ζ(7))/K², measured exactly · a measurement, not the limit' },
  { k: 'the reader\'s report', v: ['issue-point-1', 'issue-point-2', 'issue-point-3', 'issue-final'].filter((k) => V[k].verdict === 'CERTIFIED').length + ' / 4',
    n: 'points confirmed · issue #' + R.issue.number + ' by @' + R.issue.author + ', a third party' }
]));

P.push(C.scope('Local working document, machine-derived, not peer-reviewed. Decided: the arithmetic of the paper\'s proof route, from its formulas '
  + 'as printed, as exact rationals or arb balls — the outer integral, the inner integral (121), the constants A0 and U\'s ingredients, the '
  + 'margins (117)–(119). Measured, not decided: the paper\'s own family at three sizes. Not decided: whether ζ(7) is irrational (open); '
  + 'Theorem 1.2 as a statement about large n; the inner estimate Proposition 4.4; Lemma 6.1\'s supremum; the Lean repository\'s own theorem, '
  + 'which was read, not built. Nothing was posted, commented or sent.'));

/* §1 the claim and the report */
P.push(C.section({
  lab: '§1 · the claim and the report', title: 'What the paper claims, and what the reader found',
  bodyRaw: C.pRaw('<b>The paper.</b> P. Anand, <i>Zeta 7 is Irrational</i>, Zenodo ' + C.m('10.5281/zenodo.22920911') + ', ' + R.claim.version + ', '
    + R.claim.date + ', ' + R.claim.pages + ' pages, ' + R.claim.license + '. Theorem 1.1: ζ(7) is irrational. The route is Fauzan\'s for ζ(5): integer '
    + 'polynomials Q built from Hankel determinants of a moment functional that is positive at ζ(7), with ' + C.m('lim sup K⁻² log Q(ζ(7)) ≤ A_M + U')
    + ' (117). A_M collects the arithmetic (the primes that can be divided out), U the size of the determinant. The proof needs the sum negative; '
    + '(118) states ' + C.m('A₂₀₀ + U < −11') + ', and Theorem 1.2\'s rate exp(−19000 n²) comes from it.')
    + C.pRaw('<b>The report.</b> On ' + R.issue.opened.slice(0, 10) + ' GitHub user ' + who + ' — a third party, not this lab — opened ' + issueLink
      + ' on gmDevi/zeta-7-21-lean, a repository whose README cites the paper, because the paper gives no contact address. The report makes four points: '
      + 'the outer integrand on (1, 37/20] is 37/20 − y, not Table 5\'s −239/20 − 2y, which alone moves A₂₀₀ + U to +0.95; integrating the paper\'s '
      + '(54), (58), (59), (62) gives I_out = 453803/288000, not −11002997/720000; the constant A0 is Fauzan\'s entire ζ(5) constant; and with all '
      + 'of it, A₂₀₀ + U ≈ +4.86. It says plainly that it concerns only the v1 argument, not whether ζ(7) is irrational. As fetched on '
      + R.issue.fetched + ' the issue is ' + R.issue.state + ' with ' + R.issue.comments + ' comments.')
    + C.pRaw('<b>What we did.</b> We recomputed each of those points from the paper\'s printed formulas, with code written here that shares nothing '
      + 'with the paper or with the report\'s script, and checked it by reproducing a published value that is right: Fauzan\'s own outer '
      + 'integral, 127751/96000. We also computed the paper\'s own polynomials exactly at three sizes. The author\'s Zenodo note mentions a '
      + 'rounding issue in the decay constant, to be fixed in a v2; no v2 has been posted.')
}));

/* §2 the verdicts */
{
  const rowsV = [
    ['the reader\'s point 1: the last piece alone moves A₂₀₀ + U to +0.95', V['issue-point-1'], sg(f(S['lastRow|printed|printed'].A200plusU), 4)],
    ['the reader\'s point 2: I_out = 453803/288000 from the formulas', V['issue-point-2'], mq(O.formula.R2.value.q)],
    ['the reader\'s point 3: A0 is Fauzan\'s whole ζ(5) constant; (85) bounds that tail by ≈ −0.057', V['issue-point-3'], mq(CN.tail85.bound.q)],
    ['the reader\'s total: A₂₀₀ + U ≈ +4.86, or ≈ +3.49 with A0 replaced', V['issue-final'], sg(f(S['R2|printed|printed'].A200plusU), 3) + ' · ' + sg(f(S['R2|tail85|printed'].A200plusU), 3)],
    ['(122) I_out = −11002997/720000 follows from the paper\'s formulas', V['paper-122'], 'it is Table 5\'s integral'],
    ['Table 5, last row: −239/20 − 2y on [1, 37/20]', V['table5-last-row'], 'it is 37/20 − y'],
    ['(118) A₂₀₀ + U < −11, the inequality the proof rests on', V['paper-118'], sg(f(S['R2|printed|printed'].A200plusU), 3)],
    ['(119) A₁₀₀₀₀₀ + U < −12, used for the irrationality measure', V['paper-119'], sg(f(S['R2|printed|printed'].A100000plusU), 3)],
    ['Theorem 1.2, the decay exp(−19000 n²): its proof', V['paper-thm12'], 'proof only; see §5'],
    ['Theorem 1.1: ζ(7) is irrational', V['paper-thm11'], 'not proved here; open'],
    ['Corollary 1.3: |ζ(7) − a/b| > b⁻²⁷⁰', V['paper-cor13'], 'rests on (119)'],
    ['(121) the inner integral, from (64)–(69)', V['paper-121'], 'exact, as printed'],
    ['(96) U = 44/25 bounds λM0 − I(ρ) + C*', V['paper-96'], 'holds; the printed I(ρ) is mis-summed'],
    ['Proposition 4.6, the local bound (59), at K = 40, 80, 120', V['paper-prop46'], 'holds at every prime tested'],
    ['Proposition 6.3, the real bound, at K = 40, 80, 120', V['paper-prop63'], 'holds'],
  ].map(([c, v, x]) => [c, { raw: vtag(v.verdict) }, x]);
  P.push(C.section({
    lab: '§2 · the verdicts', title: 'The reader is right on every point we checked', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Each line is decided from the paper as printed, except the last two, which are its finite statements checked at three '
      + 'sizes. CERTIFIED means the statement holds exactly; REFUTED means it does not; REFUSED means the paper does not establish it, which is '
      + 'not the same as false; PARTIAL means checked only where stated. The kind of defect, where there is one, is an arithmetic slip.') + '</div>'
      + C.table({ cols: [{ h: 'claim' }, { h: 'verdict' }, { h: 'the number', cls: 'n' }], rows: rowsV })
  }));
}

/* §3 where it breaks */
{
  const rowsT = O.byTable5Interval.map((r) => ['[' + r.lo + ', ' + r.hi + ']', sg(f(r.table), 4), sg(f(r.R2), 4), sg(f(r.R1), 4)]);
  rowsT.push([{ raw: '<b>[1/3, 37/20]</b>' }, { raw: '<b>' + sg(f(O.table5.integral), 4) + '</b>' }, { raw: '<b>' + sg(f(O.formula.R2.value), 4) + '</b>' }, { raw: '<b>' + sg(f(O.formula.R1.value), 4) + '</b>' }]);
  P.push(C.section({
    lab: '§3 · where it breaks', title: 'Table 5 is not the integrand the paper defines', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('The outer primes, K/3 < p ≤ 2h, enter through an exponent L<sub>p</sub> = v<sub>p</sub>(S<sub>K</sub>) + γ<sub>p</sub><sup>out</sup> (60): '
      + 'the factorials of the normalisation (62) and the local bound (59). In the variable y = p/K, −L<sub>p</sub>/K tends to a piecewise-linear '
      + 'function T(y), and I_out is its integral over [1/3, 37/20]. The paper\'s Appendix A.2 gives T as Table 5 and its integral as (122).')
      + C.pRaw('Past y = 1 there is nothing to compute. The paper sets γ<sub>p</sub><sup>out</sup> = 0 for p > K (§5.1); K!, N! and 4 are units at such p; '
        + 'only the factorials (2i)! of S<sub>K</sub> carry p, and they carry it in the denominator. So L<sub>p</sub> = −(2h − p − 1) < 0 and T(y) = 37/20 − y, '
        + 'which is positive. Table 5 prints −239/20 − 2y, about −14. That one row is worth ' + sg(f(O.lastRow.delta), 2) + ' in I_out. Across the '
        + 'rest of the range the table is wrong as well, by ' + sg(f(O.oneThirdToOne.R2) - f(O.oneThirdToOne.table), 2) + '.') + '</div>'
      + C.figure({ svgRaw: FIG, caption: 'The outer integrand T(y): solid, decided from the paper\'s own formulas; dashed, the claim as printed in its Table 5. The steep vertical segments are jumps in the functions. The signed area under each line is I_out. Hover for values.' })
      + C.table({ cols: [{ h: 'Table 5 interval', cls: 'n' }, { h: 'Table 5 gives', cls: 'n' }, { h: 'formulas, reading R2', cls: 'n' }, { h: 'formulas, reading R1', cls: 'n' }], rows: rowsT })
      + '<div class="col">' + C.note({ lab: 'two readings, both decided', bodyRaw: C.pRaw('The paper defines R0 twice, inconsistently: (71) makes it the limit of −γ/K, '
        + 'while §5.3 and the proof of Proposition 5.4 say −γ = K(R0 − d) + O(1), so that R0 − d is that limit. <b>R2</b> follows the proof: the integrand '
        + 'is the limit of the exponents the normalisation (61) actually uses, and its integral is ' + C.m(mq(O.formula.R2.value.q)) + ', the reader\'s value. '
        + '<b>R1</b> takes (71) and (73) literally and subtracts d(y) a second time, which lowers I_out by ' + C.m(mq(O.formula.dIntegral.q)) + ' and favours the author. '
        + 'It gives ' + C.m(mq(O.formula.R1.value.q)) + '. Neither is close to ' + C.m(mq(O.table5.integral.q)) + ', which is exactly the integral of Table 5.') }) + '</div>'
  }));
}

/* §4 what it does to the proof */
{
  const L = M.labels;
  const cell = (k) => { const s = S[k]; return { raw: (f(s.A200plusU) < 0 ? '' : '<b>') + sg(f(s.A200plusU), 3) + (f(s.A200plusU) < 0 ? '' : '</b>') }; };
  const rowsS = [['printed', 'I_out as printed (122)'], ['lastRow', 'Table 5 with only its last row corrected'], ['R2', 'from the formulas, reading R2'], ['R1', 'from the formulas, reading R1']]
    .map(([k, t]) => [t, cell(k + '|printed|printed'), cell(k + '|tail85|nested'), cell(k + '|tail85|measured'), sg(f(S[k + '|tail85|nested'].B0plusU), 3)]);
  P.push(C.section({
    lab: '§4 · what it does to the proof', title: 'A₂₀₀ + U is positive, and no repair we could decide brings it back', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('A₂₀₀ = A0 + I_out + ∫₃²⁰ R/x³ + (cutoff terms) (88)–(89), and the proof needs A₂₀₀ + U < 0. We recomputed it in every combination: '
      + 'I_out as printed, with only Table 5\'s last row fixed, and from the formulas under each reading; A0 and U as printed, or corrected in the author\'s '
      + 'favour where this audit can decide the correction. Two such corrections exist. The paper\'s A0 (≈ ' + sg(f(CN.A0.printed87), 3) + ') is larger than '
      + 'the paper\'s own tail bound (85) for the quantity it stands for, ' + C.m(mq(CN.tail85.bound.q)) + '. And the paper\'s U overstates its own bound, '
      + 'because (110) sums the comparison measure\'s energy with the wrong logarithm; correctly summed, λM0 − I(ρ) + C* = '
      + C.m(sg(mid(CN.U.sumNested), 4)) + ', not 1.7514.') + '</div>'
      + C.table({ cols: [{ h: 'I_out' }, { h: 'A0, U as printed', cls: 'n' }, { h: 'A0 → (85), U → 0.556', cls: 'n' }, { h: 'A0 → (85), U → measured', cls: 'n' }, { h: 'best any cutoff can do', cls: 'n' }], rows: rowsS })
      + '<div class="col">' + C.pRaw('Read across a row. With I_out from the formulas, every entry is positive, and the smallest decided one is '
        + C.m(sg(f(M.decidedMinA200plusU), 3)) + '. The third column goes further than the audit can decide: it replaces U with the measured value, at n = '
        + m3.n + ', of the quantity U bounds, ' + C.m(sg(f(S['R2|tail85|measured'].UValue), 3)) + '. Even then the entry stays positive. The last column is '
        + 'B0 + U, the floor that A_M + U approaches as the cutoff M grows. A_M > B0 for every M, because (89)\'s cutoff terms form a quadratic with negative '
        + 'discriminant, so no choice of M rescues (118). (119), the input to the irrationality measure, fails the same way.')
        + C.note({ lab: 'the reader\'s point 1, read carefully', bodyRaw: C.pRaw('Correcting only the last row moves A₂₀₀ + U from ' + sg(f(PC.A200plusU), 2) + ' to '
          + C.m(sg(f(S['lastRow|printed|printed'].A200plusU), 4)) + ', exactly as reported. But that keeps the paper\'s A0 and U, which are both too large. '
          + 'With them corrected too, the last row alone would leave ' + sg(f(S['lastRow|tail85|nested'].A200plusU), 2) + ' < 0. So the last row does not break the '
          + 'proof by itself. What breaks it is the whole of Table 5, and the formulas decide every row of it.') }) + '</div>'
  }));
}

/* §5 the route or the bounds? */
{
  const rowsM = MS.rows.map((r) => [String(r.n), String(r.K), String(r.h), { raw: '<b>' + sg(mid(r.logP_per_K2), 4) + '</b>' }, sg(mid(r.logP_per_h2), 3),
    sg(mid(r.logF_per_K2), 3), r.prop46Sharp + ' / ' + r.prop46Tested, String(r.aboveK.length) + ' primes · all 0']);
  P.push(C.section({
    lab: '§5 · the bounds, or the route?', title: 'The paper\'s own polynomials do not get small at n ≤ 3', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('A failed inequality could mean the bounds are loose while the polynomials are still small. To check, we computed the paper\'s '
      + 'own determinant exactly: K = 40n, N = 3n, D<sub>N</sub><sup>8</sup>/D<sub>K</sub>, h = 37n, with our Hankel engine (its functional at k = 7 is the paper\'s (5)–(6)). '
      + 'We then divided out every common factor. What is left, P<sub>K</sub>, is the smallest integer polynomial any normalisation can give. The paper\'s B.3 says '
      + 'its Q<sub>K,M</sub> is a positive-integer multiple of P<sub>K</sub>. Theorem 1.2 would need log P<sub>K</sub>(ζ(7))/K² below −11.87 for large n.') + '</div>'
      + C.table({ cols: [{ h: 'n', cls: 'n' }, { h: 'K', cls: 'n' }, { h: 'h', cls: 'n' }, { h: 'log P(ζ(7))/K²', cls: 'n' }, { h: 'per h²', cls: 'n' }, { h: 'log F(ζ(7))/K²', cls: 'n' }, { h: '(59) exact at', cls: 'n' }, { h: 'v_p above K', cls: 'n' }], rows: rowsM })
      + '<div class="col">' + C.pRaw('The margin is positive at every size and still rising: ' + MS.rows.map((r) => sg(mid(r.logP_per_K2), 3)).join(', ')
        + '. Per h² it sits near ' + sg(mid(m3.logP_per_h2), 2) + ', the same wall the <a href="/reports/zeta-hankel.html">Hankel-method measurement</a> found for ζ(7) across '
        + '323 families. The paper\'s family was measured here, not assumed to share that wall. The local bound (59) holds at every outer prime tested, '
        + 'and with equality at most. At every prime between K and 2h the exact valuation of Δ<sub>K</sub> is 0, where Table 5\'s last row would need about 15K.')
        + C.note({ lab: 'a measurement, labelled', bodyRaw: C.pRaw('Three sizes do not decide a limit in n, and Theorem 1.2 is a limit statement. What the table '
          + 'shows is narrower: the paper\'s proof is refuted by its own arithmetic (§3–§4), and on these polynomials nothing suggests the theorem\'s rate. '
          + 'If the route can be saved, it will take a different family, not tighter bounds on this one.') }) + '</div>'
  }));
}

/* §6 fairness: what the paper gets right */
P.push(C.section({
  lab: '§6 · what holds', title: 'Most of the paper\'s machinery checks out',
  bodyRaw: C.plainList([
    { b: 'The inner integral.', raw: '(121), ∫₃²⁰ R(x)/x³ dx = ' + C.m(sg(f(R.inner.fromDefinitions), 6)) + ', follows exactly from the definitions (64)–(69). '
      + 'R was proved affine on ' + R.inner.certifiedPieces + ' cells (the paper lists ' + R.inner.printedPieces + ', unmerged).' },
    { b: 'The bookkeeping.', raw: 'A₂₀₀ and A₁₀₀₀₀₀ recompute exactly from the printed A0, I_out and (121). The arithmetic after I_out is consistent; the problem is the input.' },
    { b: 'The local estimate.', raw: 'Proposition 4.6 holds on the exact Δ<sub>K</sub> at K = 40, 80, 120: ' + MS.rows.map((r) => r.prop46Sharp + ' of ' + r.prop46Tested).join(', ')
      + ' outer primes with equality. Lemma 2.3\'s leading coefficient is exact. Proposition 6.3, stated for every K, holds at all three.' },
    { b: 'Errors against the author.', raw: 'The energy slip in (110) makes U larger, not smaller. A0 is larger than the paper\'s own bound for the tail it stands for. '
      + 'Both are in §4\'s repairs, and neither changes the outcome.' },
    { b: 'The calibration.', raw: 'The same evaluator, applied to Fauzan\'s (4.10), (4.14) and (5.3), returns his printed ' + C.m(mq(O.fauzan.printed510.q))
      + '. So do his printed (5.8)–(5.10) and his Table 4, whose last row is the 37/20 − y that Anand\'s Table 5 lacks. A0 equals Fauzan\'s A* (5.19) exactly, '
      + 'and equals his I_out + (5.18) + (5.16) exactly.' }
  ])
}));

/* §7 the Lean repository */
P.push(C.section({
  lab: '§7 · the Lean repository', title: 'gmDevi/zeta-7-21-lean proves something else, and says so',
  bodyRaw: C.pRaw('The issue was filed on <a href="https://github.com/gmDevi/zeta-7-21-lean">gmDevi/zeta-7-21-lean</a> because its README cites the paper. '
    + 'The repository does not formalise the paper. Its theorem, at commit ' + C.m(LN.commit.slice(0, 7)) + ', is')
    + C.eq(C.esc('¬ ∀ k ∈ {7, 9, 11, 13, 15, 17, 19, 21}, ∃ q : ℚ, riemannZeta k = q'))
    + C.pRaw('that is, at least one of ζ(7), ζ(9), …, ζ(21) is irrational, by Zudilin\'s very-well-poised forms. It does not say which one, and it does not imply '
      + 'that ζ(7) is irrational. Its README cites Anand\'s paper as background and says its own check could not confirm two constants in the final inequality; '
      + 'that matches what §3 finds.')
    + C.plainList([
      { b: 'Census, grep-level.', raw: LN.files + ' .lean files, ' + fmt(LN.lines) + ' lines: ' + LN.counts.sorry + ' sorry (' + C.m('Challenge.lean:32')
        + ', the intended statement stub for the Comparator check), ' + LN.counts.admit + ' admit, ' + LN.counts['axiom declaration'] + ' axiom declarations, '
        + LN.counts.native_decide + ' native_decide, ' + LN.counts['decide +kernel'] + ' uses of decide +kernel. The main theorem has no hypotheses.' },
      { b: 'Not built here.', raw: 'It needs a full Mathlib cache at Lean v4.35.0-rc2. The README reports ' + C.m('#print axioms') + ' = propext, Classical.choice, Quot.sound, '
        + 'and registration in the Palomar registry at commit a3b69fc. Neither claim was checked here.' }
    ])
}));

/* §8 why you can trust this */
P.push(C.section({
  lab: '§8 · why you can trust this', title: 'How each number was decided',
  bodyRaw: C.plainList([
    { b: 'Exact integrals, no sampling.', raw: 'Each integrand is written once, as code over an affine form on a cell. Every max, min and floor it takes is checked '
      + 'to keep the same branch across the whole cell. When a branch changes, the cell is cut at the exact rational point where it does. '
      + 'The integrand is therefore proved piecewise linear, and each integral is an exact rational. The battery re-checks every stored piece on its own cell.' },
    { b: 'Two routes that share nothing.', raw: 'The finite exponents L<sub>p</sub>(K) are computed as integers straight from (54), (58), (59), (62). Summed over every '
      + 'integer p, they approach the limit at a clean 1/K rate (' + FK.rows.map((r) => r.anandIntegerSumMinusLimit.toExponential(1).replace('-', '−')).join(', ')
      + ' at K = ' + FK.rows.map((r) => fmt(r.K)).join(', ') + '). Weighted by log p over the ' + fmt(fk.primes) + ' primes, they give the outer part of '
      + 'log m<sub>K,M</sub>/K² itself: ' + C.m('[' + fk.anandPrimeSum[0].toFixed(6) + ', ' + fk.anandPrimeSum[1].toFixed(6) + ']') + ' at K = ' + fmt(fk.K) + ', an arb ball.' },
    { b: 'Balls for the rest.', raw: 'I(ρ), C*, the potential and every logarithm are evaluated in arb, with endpoints rounded outward. The polynomials P<sub>K</sub> are exact integer '
      + 'polynomials, and log P<sub>K</sub>(ζ(7)) is a ball of relative radius below 2⁻⁶⁰.' },
    { b: 'Independent of the claimant.', raw: 'No line is taken from the paper or from the reader\'s script. The control that the method is right is Fauzan\'s value, '
      + 'which a wrong method would not reproduce.' },
    { b: 'The battery.', raw: nChecks + ' checks and ' + nReds + ' planted forgeries at this build, every forgery refused: a flipped bit in the paper, a tampered I_out, '
      + '(59)\'s constant 9 moved by 10⁻⁶, Table 5\'s last row "corrected", Fauzan\'s constant moved by 10⁻⁶, two affine pieces merged, (118) relabelled '
      + 'CERTIFIED, the theorem itself called refuted, a forged fingerprint.' },
    { b: 'Not decided.', raw: R.notDecided.map(C.esc).join(' ') }
  ])
}));

/* §9 records and context */
P.push(C.section({
  lab: '§9 · the records', title: 'Sources, records, context',
  bodyRaw: C.note({ lab: 'the records', bodyRaw: C.pRaw('<a href="/certs/zeta7-anand-audit.json">The audit record</a> (every decided quantity as an exact rational '
    + 'or a ball, both readings, all ' + M.scenarios.length + ' margin scenarios, the verdicts, the Lean census) · the measured family in '
    + C.m('certs/zeta7-anand/measure.json') + ' · the code in ' + C.m('instruments/zeta7audit/') + ' · the sources pinned by sha256 in '
    + C.m('instruments/zeta7audit/PROVENANCE.json') + ': the paper (CC-BY-4.0, committed), the issue thread as fetched, and, git-ignored, Fauzan\'s '
    + 'paper and the Lean clone.') })
    + C.pRaw('Context: <a href="/reports/zeta-hankel.html">the Hankel method, measured past ζ(5)</a>, where the same family shape shows a positive '
      + 'margin at ζ(7) across 323 families. That is a measurement, not a theorem. This page decides one paper\'s proof, which is a narrower thing. '
      + 'The issue is ' + issueLink + ' by ' + who + '; the credit for finding the error is theirs.')
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-zeta7-anand.js from certs/zeta7-anand-audit.json — written by instruments/zeta7audit/decide.py in exact arithmetic — after instruments/zeta7audit/battery.py passed with every planted forgery refused; the build fails if any of it does not hold.') + '</p>'
  + '<p>' + C.esc('git ' + git + ' · cert-machine · Carlos Toledo') + '</p>';

fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'zeta7-anand.html'),
  TPL.render({ title: 'A ζ(7) proof, audited · cert-machine', bodyRaw: P.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/zeta7-anand.html',
    desc: 'Anand\'s "Zeta 7 is Irrational" (Zenodo 22920911 v1) audited in exact arithmetic: its outer integral is ' + sg(f(O.formula.R2.value), 3)
      + ', not ' + sg(f(O.table5.integral), 2) + ', so A₂₀₀ + U, which must be negative, is ' + sg(f(S['R2|printed|printed'].A200plusU), 2)
      + '. The reader who reported it (issue #1, @' + R.issue.author + ') is right. The proof fails; ζ(7)\'s irrationality is untouched.' }));
console.log('reports/zeta7-anand.html written — I_out ' + sg(f(O.formula.R2.value), 4) + ' (printed ' + sg(f(O.table5.integral), 4) + '); A200+U '
  + sg(f(S['R2|printed|printed'].A200plusU), 3) + ' (printed ' + sg(f(PC.A200plusU), 3) + '), decided min ' + sg(f(M.decidedMinA200plusU), 3)
  + '; battery ' + nChecks + ' checks, ' + nReds + ' reds');
