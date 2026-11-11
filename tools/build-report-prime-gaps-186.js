#!/usr/bin/env node
/* build-report-prime-gaps-186.js — reports/prime-gaps-186.html: OpenAI's conditional Lean proof that prime gaps are at
   most 186 (GPT-6 Astra; openai/PrimeGaps186), checked from outside: the Lean proof, the two quoted assumptions on every
   prime below 2,000, the numerical certificate replayed, its 152 numbers recomputed with no shared code.

   THE MATHEMATICS IS NOT OURS. The bound, its proof, the Lean development and the certificate are OpenAI's; the proof is
   conditional on three axioms it declares, and nothing on this page proves one of them. What stays open comes first.

   Every number, statement and verdict word is read from certs/prime-gaps-186.json (tools/record-prime-gaps-186.js, which
   re-derives it from corpus/prime-gaps-186 with --check). The build refuses when a verdict is not the one this page
   states, when the record no longer says first whose mathematics it is, or when a figure's count stops adding up. The
   note's DOI is printed only when the record says the deposit is published.

   usage: node tools/build-report-prime-gaps-186.js                                                                 MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));   /* the page's own light art card (og-prime-gaps-186.png) */
const die = (m) => { console.error('PRIME GAPS 186 REPORT REFUSED: ' + m); process.exit(1); };
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'prime-gaps-186.json'), 'utf8'));
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const mins = (s) => Math.round(s / 60);

/* the words this page states, each read back from the record */
const SAYS = { build: 'builds as shipped', comparator: 'CONCORDANT', kernels: 'three accept', statementLayer: 'CERTIFIED', axiom1: 'CERTIFIED on the instances', axiom2: 'CERTIFIED on the instances',
  certificate: 'REPRODUCED', recomputed: '152 of 152', margin: 'CERTIFIED on our numbers', axioms: 'ASSUMED, all three' };
for (const [k, v] of Object.entries(SAYS)) if (R.verdicts[k] !== v) die(k + ' is ' + R.verdicts[k] + ' in certs/prime-gaps-186.json, and this page states ' + v);
if (!/^The bound liminf .* are OpenAI’s/.test(R.undecided) || !/does not verify the bound 186 and proves none of the three axioms/.test(R.undecided)) die('the record no longer says first whose mathematics it is and what it does not decide');
const L = R.lean, F = R.finite, CE = R.certificate, RC = R.recomputed, MG = R.margin, RV = R.review, SL = L.statementLayer;
const A1 = F.axiom1, A2 = F.axiom2, IV = RC.againstTheCertificatesIntervals;
const kern = (n) => L.kernels.find((k) => k.name === n) || die('the record has no kernel ' + n);
if (!['Lean (the build)', 'nanoda', 'lean4lean'].every((n) => kern(n).word === 'accepts')) die('one of the three kernels no longer accepts');
if (!['con-ron', 'con-leche'].every((n) => /^declines/.test(kern(n).word))) die('a declining checker is no longer recorded as declining');
if (SL.rewordingsAccepted !== SL.rewordings || SL.alterationsAccepted !== 0 || SL.defectsCaught !== SL.defects.length) die('a planted statement or defect is not as the page states');
if (SL.planted.length !== SL.rewordings + SL.alterations || SL.alterations !== SL.alterationsRefusedByMismatch + SL.alterationsNotElaborating) die('the planted statements no longer add up');
if (A1.instances !== A1.holdInBoth || A2.instances !== A2.holdInBoth || A1.primes !== A2.primes) die('an instance of a quoted assumption does not hold in both deciders');
if (RC.integers !== 152 || CE.integersEqual !== 152 || IV.rows !== 149 || IV.insideAsFirstComputed + IV.belowAsFirstComputed !== 149) die('the 152 numbers no longer add up');
if (!(MG.marginOurs > 1 / 50000) || MG.totalLossOurs > MG.totalLossPrinted) die('the margin on our numbers is not what the page states');
const TITLE = 'OpenAI’s prime-gap bound of 186, checked from every side I could reach';
const PRIMES = A1.primes, CASES = A1.instances + A2.instances;

/* figure 1 (the hero) — the proof as a chain: three assumptions, the Lean proof, the conclusion; under each, what was
   done to it. Drawn wide and, for a phone, stacked; every number read from the record. */
const ASSUME = [
  { k: 'assumed · a Kloosterman-sum bound', s: 'quoted from Deligne and Katz', t: 'tested: ' + N(A1.instances) + ' cases, all hold' },
  { k: 'assumed · a correlation bound', s: 'quoted from Fouvry, Kowalski, Michel', t: 'tested: ' + N(A2.instances) + ' cases, all hold' },
  { k: 'assumed · ' + RC.integers + ' numerical bounds', s: 'reproduced, and recomputed apart', t: 'integral ≤ estimate: argued, not in Lean' }
];
const LEANL = ['builds as shipped, no warning', 'Lean, nanoda, lean4lean accept', 'OpenAI’s checker: same result', SL.rewordings + ' rewordings accepted', SL.alterations + ' altered statements, none accepted', 'rests on the 3 assumptions and', 'the 3 standard axioms only'];
const box = (x, y, w, h) => '    <rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6"/>';
const arrow = (x1, y1, x2, y2) => '    <line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--ink-3)" stroke-width="1.6"/>'
  + '    <path d="M' + x2 + ' ' + y2 + ' l' + (x2 > x1 ? '-9 -5 l0 10 z' : '-5 -9 l10 0 z') + '" fill="var(--ink-3)"/>';
const CALT = 'A chain of boxes. On the left, three assumptions. The first, a Kloosterman-sum bound quoted from Deligne and Katz: tested on ' + N(A1.instances) + ' cases, all hold. The second, a correlation bound quoted from Fouvry, Kowalski and Michel: tested on ' + N(A2.instances) + ' cases, all hold. '
  + 'The third, ' + RC.integers + ' numerical bounds: reproduced and recomputed apart; that each integral is at most its estimate is argued, not in Lean. All three lead to the Lean proof, checked: it builds as shipped, Lean, nanoda and lean4lean accept it, OpenAI’s checker gives the same result, ' + SL.rewordings + ' rewordings of the statements are accepted and none of ' + SL.alterations + ' altered statements, and it rests on the three assumptions and the three standard axioms only. '
  + 'The proof leads to the conclusion: if the three assumptions hold, infinitely many gaps between consecutive primes are at most 186.';
const cWide = [C.svgOpen({ w: 900, h: 330, alt: CALT })];
ASSUME.forEach((q, i) => {
  const y = 6 + i * 110;
  cWide.push(box(0, y, 322, 96), C.label({ x: 16, y: y + 28, text: q.k, cls: 't-lab' }), C.label({ x: 16, y: y + 52, text: q.s, cls: 't-ax' }), C.label({ x: 16, y: y + 76, text: q.t, cls: 't-ax' }));
  cWide.push(arrow(328, y + 48, 362, y + 48));
});
cWide.push(box(368, 6, 296, 316), C.label({ x: 384, y: 34, text: 'the Lean proof · checked', cls: 't-lab' }));
LEANL.forEach((t, i) => cWide.push(C.label({ x: 384, y: 66 + i * 26, text: t, cls: 't-ax' })));
cWide.push(arrow(670, 164, 704, 164));
cWide.push(box(710, 104, 190, 120), C.label({ x: 724, y: 134, text: 'if the three hold', cls: 't-lab' }), C.label({ x: 724, y: 160, text: 'infinitely many prime', cls: 't-ax' }), C.label({ x: 724, y: 182, text: 'gaps are at most 186', cls: 't-ax' }), C.label({ x: 724, y: 204, text: '(OpenAI’s result)', cls: 't-ax' }));
cWide.push('    </svg>');
const cNarrow = [''];
let yy = 4;
ASSUME.forEach((q) => {
  cNarrow.push(box(0, yy, 360, 92), C.label({ x: 14, y: yy + 26, text: q.k, cls: 't-lab' }), C.label({ x: 14, y: yy + 50, text: q.s, cls: 't-ax' }), C.label({ x: 14, y: yy + 74, text: q.t, cls: 't-ax' }));
  yy += 102;
});
cNarrow.push(arrow(180, yy, 180, yy + 26)); yy += 34;
cNarrow.push(box(0, yy, 360, 40 + LEANL.length * 23), C.label({ x: 14, y: yy + 26, text: 'the Lean proof · checked', cls: 't-lab' }));
LEANL.forEach((t, i) => cNarrow.push(C.label({ x: 14, y: yy + 52 + i * 23, text: t, cls: 't-ax' })));
yy += 40 + LEANL.length * 23 + 8;
cNarrow.push(arrow(180, yy, 180, yy + 26)); yy += 34;
cNarrow.push(box(0, yy, 360, 92), C.label({ x: 14, y: yy + 26, text: 'if the three hold', cls: 't-lab' }), C.label({ x: 14, y: yy + 50, text: 'infinitely many prime gaps are at most 186', cls: 't-ax' }), C.label({ x: 14, y: yy + 74, text: '(OpenAI’s result)', cls: 't-ax' }));
yy += 96;
cNarrow.push('    </svg>');
cNarrow[0] = C.svgOpen({ w: 360, h: yy, alt: CALT });

/* figure 2 — every planted statement and every broken proof, one square each: filled = not accepted or caught, hollow =
   accepted (the Lean intake page's drawing) */
const PLANT = [
  { k: 'the same, reworded', sub: 'must be accepted', items: SL.planted.filter((x) => x.kind === 'same').map((x) => ({ x, filled: x.outcome !== 'ACCEPTED' })), want: false },
  { k: 'altered', sub: 'refused: the statements differ', items: SL.planted.filter((x) => x.kind !== 'same' && /type mismatch/.test(x.outcome)).map((x) => ({ x, filled: true })), want: true },
  { k: 'altered', sub: 'did not get as far as a check', items: SL.planted.filter((x) => x.kind !== 'same' && /FAILED/.test(x.outcome)).map((x) => ({ x, filled: true })), want: true },
  { k: 'proofs broken on purpose', sub: 'must be caught', items: SL.defects.map((x) => ({ x: { of: x.of, id: x.id, why: x.why, outcome: x.caught ? 'caught: ' + x.how : 'NOT caught' }, filled: x.caught })), want: true }
];
if (PLANT.reduce((s, r) => s + r.items.length, 0) !== SL.planted.length + SL.defects.length) die('a planted test is in no row of the drawing');
const SQ = 20, GAP = 6, LX = 250, RW = 52, PW = 900, PER = 14;
const sq = (it, x, y) => '    <rect x="' + x + '" y="' + y + '" width="' + SQ + '" height="' + SQ + '" rx="4" stroke="var(--ink)" stroke-width="1.6" fill="' + (it.filled ? 'var(--ink)' : 'var(--surface)') + '"><title>'
  + C.esc((it.x.of + ' ' + it.x.id + ': ' + it.x.why + ' — ' + it.x.outcome).replace(/`/g, '')) + '</title></rect>';
const lineCount = (row) => Math.ceil(row.items.length / PER);
const PH = PLANT.reduce((h, row) => h + RW + (lineCount(row) - 1) * (SQ + GAP), 0) + 40;
const plantSvg = [C.svgOpen({ w: PW, h: PH, alt: 'Four rows of small squares, one per planted test. The same statement reworded: ' + SL.rewordings + ' squares, all hollow (accepted). Altered statements refused because they differ: ' + SL.alterationsRefusedByMismatch + ' squares in two lines, all filled. Altered statements that did not get as far as a check: ' + SL.alterationsNotElaborating + ' squares, filled. Proofs broken on purpose: ' + SL.defects.length + ' squares, all filled (caught).' })];
let py = 16;
for (const row of PLANT) {
  plantSvg.push(C.label({ x: 0, y: py + 10, text: row.k, cls: 't-lab' }));
  plantSvg.push(C.label({ x: 0, y: py + 27, text: row.sub, cls: 't-ax' }));
  row.items.forEach((it, i) => plantSvg.push(sq(it, LX + (i % PER) * (SQ + GAP), py + Math.floor(i / PER) * (SQ + GAP))));
  plantSvg.push(C.label({ x: LX + Math.min(row.items.length, PER) * (SQ + GAP) + 10, y: py + 15, text: row.items.filter((it) => it.filled === row.want).length + ' of ' + row.items.length, cls: 't-lab' }));
  py += RW + (lineCount(row) - 1) * (SQ + GAP);
}
plantSvg.push(C.label({ x: LX, y: PH - 10, text: 'filled: not accepted, or caught · hollow: accepted', cls: 't-ax' }));
plantSvg.push('    </svg>');

/* figures 3a, 3b — how close each quoted assumption comes, prime by prime (square roots, for display: the decisions are
   on the squares, in exact arithmetic) */
const perPrime = (ax, y1, ticks, name, alt) => CH.scatter({   /* a curve and a rule on scatter's frame: lines() would add its hover crosshair, a faint mark the render gate counts */
  w: 900, h: 300, x0: 0, x1: 2000, y0: 0, y1,
  xTicks: [0, 500, 1000, 1500, 2000].map((v) => ({ v, t: N(v) })), yTicks: ticks.map((v) => ({ v, t: String(v) })),
  xLabel: 'the prime p',
  curves: [{ pts: ax.perPrimeDisplayOnly, token: 'var(--c-1)' }],
  hlines: [{ y: ax.bound, t: 'the assumed bound, ' + ax.bound }],
  pts: [{ x: ax.closest.p, y: ax.closest.value, token: 'var(--c-1)', k: 'the closest approach', v: ax.closest.value.toFixed(2) + ' at p = ' + ax.closest.p }],
  alt
});
const FIG_A1 = perPrime(A1, 3.3, [0, 1, 2, 3], 'the largest value at p', 'A jagged line over the ' + PRIMES + ' primes below 2,000: for each prime, the largest size of the first sum. It rises quickly to about 2 and then wanders between about 2.3 and 2.8, never reaching the horizontal line at the assumed bound 3. Its highest point is ' + A1.closest.value.toFixed(2) + ', at p = ' + A1.closest.p + '.');
const FIG_A2 = perPrime(A2, 8.6, [0, 2, 4, 6, 8], 'the largest value at p', 'A jagged line over the ' + PRIMES + ' primes below 2,000: for each prime, the largest size of the second sum, divided by p times the square root of p. It rises to about 4 and then wanders between about 4 and 5.2, well under the horizontal line at the assumed bound 8. Its highest point is ' + A2.closest.value.toFixed(2) + ', at p = ' + A2.closest.p + '.');

/* figure 4 — each recomputed value placed in the interval OpenAI's own run prints for the same quantity: 0 is the
   interval's lower end, 1 its upper end. One dot per value, by kind; dots in a row are spread vertically, by their order
   in the record, so that they do not hide each other. */
const ROWS = [
  { key: 'caps', k: 'cap quantities' }, { key: 'P', k: 'rank-two rows' }, { key: 'H', k: 'high rows' },
  { key: 'L root', k: 'low rows, first number' }, { key: 'L face', k: 'low rows, second number' }, { key: 'L inner', k: 'low rows, inner tables' }
];
const POS = IV.positions.concat(RC.caps.insideTheCertificatesInterval.map((c) => ['caps', c.position]));
if (POS.some((p) => !ROWS.some((r) => r.key === p[0]))) die('a value of the cross-check belongs to no row of the drawing');
if (POS.length !== IV.rows + RC.caps.quantities) die('the drawing would not hold every value');
for (const row of ROWS) row.n = POS.filter((p) => p[0] === row.key).length;
if (ROWS.find((r) => r.key === 'P').n !== RC.rows.rankTwo.integers || ROWS.find((r) => r.key === 'H').n !== RC.rows.high.integers || ROWS.filter((r) => /^L /.test(r.key)).reduce((t, r) => t + r.n, 0) !== RC.rows.low.integers) die('the rows of the drawing do not hold the counts the record states');
const ATZERO = POS.filter((p) => p[1] === 0).length;
const XMIN = Math.min(...POS.map((p) => p[1]));
if (!(XMIN >= -0.75) || Math.max(...POS.map((p) => p[1])) > 1) die('a value lies outside what the drawing shows');
const pts = [];
ROWS.forEach((row, r) => {
  const mine = POS.filter((p) => p[0] === row.key);
  mine.forEach((p, i) => pts.push({ x: p[1], y: (ROWS.length - 1 - r) + ((i % 7) - 3) * 0.09, token: 'var(--c-1)', k: row.k, v: 'at ' + p[1].toFixed(3) + ' of the interval' }));
});
const FIG_POS = CH.scatter({
  w: 900, h: 420, x0: -0.75, x1: 1.25, y0: -0.6, y1: ROWS.length - 0.4, padL: 226,
  xTicks: [-0.5, 0, 0.5, 1].map((v) => ({ v, t: v === 0 ? '0 · lower end' : v === 1 ? '1 · upper end' : String(v) })),
  yTicks: ROWS.map((row, r) => ({ v: ROWS.length - 1 - r, t: row.k + ' · ' + row.n })),
  xLabel: 'position of the recomputed value inside the interval OpenAI’s run prints',
  vlines: [{ x: 0 }, { x: 1 }],
  pts,
  alt: 'Six rows of dots on an axis from −0.75 to 1.25, where 0 and 1 are the two ends of the interval OpenAI’s own run prints for a quantity. The two cap quantities sit at 0.5. The ' + RC.rows.rankTwo.integers + ' rank-two values lie between 0.1 and 0.5, except two at −0.04 and −0.64, left of the interval. The ' + RC.rows.high.integers + ' high-row values sit at 0.5, one at 0.28. The low rows’ first numbers lie between 0 and 0.5, their second numbers near the lower end, and the inner-table values at or near 0.5; ' + ATZERO + ' low-row values sit exactly at 0. No dot is right of 1.'
});

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: TITLE,
  deck: 'In August 2026 OpenAI’s GPT-6 Astra proved that infinitely many pairs of primes lie at most 186 apart, and released a Lean proof of it that rests on three stated assumptions. The result and the proof are theirs. '
    + 'I checked the release as far as an outside party can, with Claude: the Lean proof holds as written, its ' + RC.integers + ' numerical inputs reproduce and were recomputed with no shared code, and the three assumptions remain assumptions.'
}));

O.push(C.figure({ svgRaw: cWide.join('\n'), svgNarrowRaw: cNarrow.join('\n'), hero: true, record: ['certs/prime-gaps-186.json'],
  caption: 'What was checked, and what was not. The Lean proof was checked as a proof. The three assumptions it starts from were tested, not proved: the first two on every case for the ' + PRIMES + ' primes below 2,000, the third by re-running and recomputing its ' + RC.integers + ' numbers.' }));

O.push(C.stats([
  { k: 'assumptions proved here', v: '0 of 3', n: 'they remain assumptions' },
  { k: 'the Lean proof', v: '3 kernels accept', sm: true, n: 'Lean, nanoda, lean4lean' },
  { k: 'numerical inputs', v: RC.integers + ' of ' + RC.integers, n: 'reproduced, and recomputed with no shared code' },
  { k: 'cases of the two quoted assumptions', v: N(CASES), sm: true, n: 'every prime below 2,000 · all hold' }
]));

O.push(C.scope('The bound, its proof, the Lean development and the numerical certificate are OpenAI’s, attributed to GPT-6 Astra. This page checks their release; it is not new mathematics, and it does not verify the bound. The checks are mine, run with Claude (Anthropic’s AI model), which wrote the programs under my direction.'));

O.push(C.section({
  lab: 'read this first', title: 'What is still open', id: 'limits',
  bodyRaw: C.plainList(R.gaps.map((g) => ({ b: g.b, text: g.text })))
}));

O.push(C.section({
  lab: '1 · the Lean proof', title: 'The Lean proof holds as written', id: 'lean', wide: true,
  bodyRaw: '<div class="col">' + C.plainList([
      { b: 'It builds as shipped.', text: 'In ' + mins(L.build.seconds) + ' minutes, with no warning.' },
      { b: 'OpenAI’s own checker gives the same result.', text: 'Comparator, the tool the release names, reports that the three theorems and the three assumptions match the statement file. Given a statement file with 186 made 185, and one with a constant changed in the first assumption, it rejects both.' },
      { b: 'Nothing else is assumed.', text: 'Each of the three theorems rests on exactly the three standard axioms of Lean and the three declared assumptions, by two computations that agree.' },
      { b: 'Three kernels accept the proof.', text: 'Lean’s own, also with every import replayed from scratch (' + mins(kern('leanchecker --fresh').seconds) + ' minutes); nanoda (' + N(kern('nanoda').declarations) + ' declarations); and lean4lean (' + N(kern('lean4lean').declarations) + ' declarations). Two further checkers, con-ron and con-leche, decline any proof that declares assumptions, so they say nothing here.' },
      { b: 'It proves the stated statement.', text: 'The proof file and the statement file agree, theorem by theorem and assumption by assumption, through every definition under them. Of ' + SL.planted.length + ' statements planted to test that comparison, all ' + SL.rewordings + ' rewordings were accepted and none of the ' + SL.alterations + ' altered ones was; ' + SL.defects.length + ' copies of the proof broken on purpose were all caught.' }
    ]) + '</div>'
    + C.figure({ svgRaw: plantSvg.join('\n'), wide: false, record: ['certs/prime-gaps-186.json'], stop: 'a rewording is refused, an altered statement is accepted, or a broken proof is not caught',
      caption: 'The planted tests. Each square is one statement or one proof changed on purpose; hover for what it was. Six altered statements stopped before the comparison, because Lean could not read them as written: not accepted, but not refused by the comparison either.' })
}));

O.push(C.section({
  lab: '2 · the two quoted assumptions', title: 'Every case for the primes below 2,000', id: 'finite', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Two of the three assumptions are bounds on sums over a finite field, one for every prime. A computer can decide them prime by prime, which proves nothing about all primes and still tests whether the Lean statements say something false.')
    + C.plainList([
      { b: 'All hold.', text: N(A1.instances) + ' cases of the first and ' + N(A2.instances) + ' of the second, for the ' + PRIMES + ' primes below 2,000, each decided in exact arithmetic by two programs that share no code. None fails; none is left undecided.' },
      { b: 'How close they come.', text: 'The first sum reaches ' + A1.closest.value.toFixed(2) + ' against the assumed ' + A1.bound + ', at p = ' + A1.closest.p + '. The second reaches ' + A2.closest.value.toFixed(2) + ' against ' + A2.bound + ', at p = ' + N(A2.closest.p) + '.' },
      { b: 'The programs read the definitions as Lean does.', text: 'The values at p = ' + L.anchors.at.replace('p = ', '') + ' are proved in Lean, in ' + L.anchors.theorems + ' small theorems, and equal both programs’ values.' },
      { b: 'Wrong versions are caught.', text: 'Four deliberately wrong assumptions (a missing factor, smaller constants) are refuted, the first at p = ' + F.planted[0].refutedAt + ', the last at p = ' + F.planted[3].refutedAt + '.' },
      { b: 'The Lean statements say what the cited theorems say.', text: 'By two readings of the sources, made without sight of the Lean text.' }
    ]) + '</div>'
    + C.figure({ svgRaw: FIG_A1, wide: false, record: ['certs/prime-gaps-186.json', 'corpus/prime-gaps-186/records/a2/results.jsonl'], stop: 'a prime’s largest value reaches the bound, or the two programs disagree',
      caption: 'The first assumption: the largest size of the sum at each prime, against the assumed bound 3. Square roots are for the drawing; the decisions are made on the squares, exactly.' })
    + C.figure({ svgRaw: FIG_A2, wide: false, record: ['certs/prime-gaps-186.json', 'corpus/prime-gaps-186/records/a2/results.jsonl'], stop: 'a prime’s largest value reaches the bound, or the two programs disagree',
      caption: 'The second assumption: the largest size of the sum at each prime, divided by p√p, against the assumed bound 8.' })
}));

O.push(C.section({
  lab: '3 · the third assumption', title: 'The ' + RC.integers + ' numbers', id: 'numbers', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('The third assumption is a list of ' + RC.integers + ' numerical bounds: 149 upper bounds for integrals, in six tables, and three bounds on two further quantities. OpenAI supports them with a Python program, the certificate.')
    + C.plainList([
      { b: 'Reproduced.', raw: C.esc('On the released versions of its arithmetic library the certificate stops at its own startup check: a known bug, corrected in ') + a(CE.fix.url, CE.fix.where) + C.esc(' by ' + CE.fix.by + ' in August 2026 and in no release yet. OpenAI’s numerics note cites the correction; the README’s list of versions does not. With that one correction applied, their program, unmodified, runs to “passed” in ' + CE.run.minutes + ' minutes and prints all ' + CE.integers + ' numbers as published.') },
      { b: 'Recomputed.', text: 'Programs written from the Lean statement file and the note alone, in sessions that never saw OpenAI’s program, enclose all ' + RC.integers + ' quantities. The three cap bounds hold, with the two quantities known to about ' + RC.caps.digits + ' digits; all 149 row values are at or below their printed bounds.' },
      { b: 'Inside OpenAI’s own intervals.', text: 'Both cap quantities and ' + IV.insideAsFirstComputed + ' of the 149 row values lie inside the interval OpenAI’s run prints for the same quantity. The other ' + IV.belowAsFirstComputed + ' came out just below their intervals, so still below their bounds; computed with a recurrence exactly as the note writes it, both land in the middle.' },
      { b: 'Re-run.', text: 'Every one of these programs was run again from a clean copy on a second machine, and every recorded number came back.' },
      { b: 'Reviewed.', text: 'A separate session, told to look for errors, went through the ' + RV.links + ' steps of the hand derivations: ' + RV.hold + ' hold, ' + RV.holdUnderACheckedCondition + ' hold under a condition it then checked, ' + RV.notRederived + ' it did not re-derive in full. None was found wrong. It is not a human referee.' },
      { b: 'The final inequality holds on these numbers.', text: 'Total loss ' + N(MG.totalLossOurs) + ' units against the published ' + N(MG.totalLossPrinted) + '. The proof needs a margin above zero: the loss could grow ' + MG.roomToPositivityPercent + '% before that fails, and ' + MG.roomToStatedPercent + '% before the 1/50000 the papers state.' }
    ]) + '</div>'
    + C.figure({ svgRaw: FIG_POS, wide: false, record: ['certs/prime-gaps-186.json'], stop: 'a value lies above its interval, or a value is missing from the drawing',
      caption: 'Where each recomputed value falls in the interval OpenAI’s own run prints for it: 0 is the interval’s lower end, 1 its upper end, and each printed bound is that upper end rounded up. Two computations that share no code agree to within OpenAI’s stated uncertainty, except the two rank-two values left of 0. The ' + ATZERO + ' dots exactly at 0 are low-row values that are all but zero, in intervals that start at zero. Dots in a row are spread vertically only so that they do not hide each other.' })
}));

O.push(C.section({
  lab: 'along the way', title: 'What the check found about the release', id: 'found',
  bodyRaw: C.plainList([
    { b: 'The certificate does not run on the versions the README lists.', text: 'It needs the one upstream correction above, which the numerics note cites and the README omits.' },
    { b: 'The certificate never compares its results with the published numbers.', text: 'It tests only the final margin. That its numbers are the published ones is the comparison made here.' },
    { b: 'Each published row bound is the upper end of that run’s own interval, rounded up.', text: 'All ' + IV.printedIsCeilingOfUpperEnd + ' of them. A reader with only the note can confirm the bounds, not regenerate their last digits.' },
    { b: 'The note is ambiguous in two places.', text: 'Which cells one sum runs over, and which recurrence one table used. The Lean file settles the first; the second was settled here by a stated reading.' },
    { b: 'Some published bounds are generous.', text: 'One is about twice what the same method gives, and one column carries a floor of thousands of units. That is slack, not error.' },
    { b: 'The startup check tests a multiplication the program itself never performs.', text: 'It guards against the known bug; it does not show where the program is exposed to it.' }
  ])
}));

O.push(C.section({
  lab: 'the method', title: 'How it was done', id: 'method',
  bodyRaw: C.pRaw('The rules for each stage were written first and sealed: a salted fingerprint of the private work, posted to a public registry and to Bitcoin, which proves the date without showing the content. There are four sets of rules (' + R.method.rules.map((r) => rec(r)).join(', ') + '), each with its questions, its verdict words and its predictions, and each departure from them is listed in the records.')
    + C.plainList([
      { b: 'Planted errors on every check.', text: 'A wrong statement, a broken proof, a wrong assumption, a changed input: each check had to catch its own.' },
      { b: 'Recomputation apart.', text: 'The sessions that recomputed the numbers were given the Lean statement file, the note and the paper, and nothing of OpenAI’s program. They are sessions of one AI model under one person’s direction: independent by construction, not by authorship.' },
      { b: 'Size.', text: 'One day, ' + R.method.rentedMachineDays.map((d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })).join(' and ') + ', on a laptop and ' + R.method.rentedMachines + ' rented machines: about US$' + Math.round(R.method.rentedUSD) + '.' }
    ])
}));

const role = (r, who) => ({ b: r + '.', text: who });
O.push(C.section({
  lab: 'who did what', title: 'Each step is a separate job', id: 'roles',
  bodyRaw: C.plainList([
    role('The bound, its proof, the Lean development and the certificate', 'OpenAI, attributed to GPT-6 Astra.'),
    role('The two quoted theorems', 'Deligne and Katz; Fouvry, Kowalski and Michel.'),
    role('The correction to FLINT', CE.fix.by + '.'),
    role('The checkers', 'Comparator, nanoda, lean4lean, con-ron, con-leche and Mathlib: their authors.'),
    role('The checks on this page', 'Carlos Toledo, with Claude (Anthropic), which wrote the programs, the small Lean theorems and the hand derivations under his direction.')
  ])
}));

O.push(C.section({
  lab: 'check it yourself', title: 'How to re-run it', id: 'rerun',
  bodyRaw: C.plainList([
    { b: 'The record.', raw: m('node tools/record-prime-gaps-186.js --check') + C.esc(' re-derives every number on this page from ') + rec('corpus/prime-gaps-186') + C.esc(' (' + R.provenance.files + ' files, each pinned by its hash) and refuses on any difference.') },
    { b: 'The records as written.', raw: C.esc('What each stage found, gaps first: ') + rec('corpus/prime-gaps-186/records') + '.' },
    { b: 'What was checked.', raw: a(R.pins.repository, 'openai/PrimeGaps186') + C.esc(' at ') + m(R.pins.commit.slice(0, 8)) + C.esc(', on ' + R.pins.toolchain.replace('leanprover/lean4:', 'Lean ') + '; the paper is ') + a(R.pins.paper, 'Improved short gaps between primes') + '.' }
  ].concat(R.note.published ? [{ b: 'The note.', raw: C.esc('The same material at full length, with the records: ') + a('https://doi.org/' + R.note.doi, 'doi:' + R.note.doi) + '.' }] : []))
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-prime-gaps-186.js from certs/prime-gaps-186.json (tools/record-prime-gaps-186.js --check). I did this with Claude agents (Anthropic); Claude wrote the programs under my direction.') + '</p>'
  + '<p>' + C.esc('git ' + (cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() || '—') + ' · cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'prime-gaps-186.html'),
  TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/prime-gaps-186.html', og: { image: '/og-prime-gaps-186.png', alt: OG.alt('prime-gaps-186') },
    desc: 'OpenAI’s Lean proof that prime gaps are at most 186 rests on three stated assumptions. Checked from outside: the Lean proof holds as written, its 152 numerical inputs reproduce and were recomputed with no shared code, and the three assumptions remain assumptions.' }));
console.log('reports/prime-gaps-186.html written · ' + Object.entries(R.verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
