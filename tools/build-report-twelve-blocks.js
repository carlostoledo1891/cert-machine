#!/usr/bin/env node
/* build-report-twelve-blocks.js — reports/twelve-blocks.html: two AI models (GPT-6.2 Astra, Claude Fable 5.2), working
   together in one folder, propose the exact least number of monochromatic 3-term progressions at large lengths.

   THE MATHEMATICS IS THE MODELS'. THE THEOREM IS NOT DECIDED HERE. What stays open comes first. Every number, verdict
   word and name on the page is read from certs/twelve-blocks.json (the judge's record), certs/twelve-blocks-series.json
   (the figure) and corpus/twelve-blocks/readings.json (who read what, written by hand); the build refuses when a record
   stops saying what a sentence of the page states.

   usage: node tools/build-report-twelve-blocks.js                                                               MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));   /* the page's own light art card (og-twelve-blocks.png) */
const die = (msg) => { console.error('TWELVE BLOCKS PAGE REFUSED: ' + msg); process.exit(1); };
const need = (ok, msg) => { if (!ok) die(msg); };
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.breakable(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const T = (s) => String(s).replace(/'/g, '’').replace(/"([^"]*)"/g, '“$1”');
const tag = (v, k) => C.tag(v, k);
const REC = 'certs/twelve-blocks.json';
const SER = 'certs/twelve-blocks-series.json';
const DIR = 'corpus/twelve-blocks/';
const PRE = 'notes/twelve-blocks-preregistration-2026-11-19.md';

try { const out = cp.execFileSync('python3', ['instruments/twelve-blocks/judge.py', '--check'], { cwd: ROOT, encoding: 'utf8' }); need(/^pins intact/.test(out), 'the record did not pass its check: ' + out.trim()); }
catch (e) { die('instruments/twelve-blocks/judge.py --check refused: ' + (e.stdout || '') + (e.stderr || '')); }
const R = JSON.parse(fs.readFileSync(path.join(ROOT, REC), 'utf8'));
const S = JSON.parse(fs.readFileSync(path.join(ROOT, SER), 'utf8'));
const RD = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'readings.json'), 'utf8'));
const ST = R.statements, GPT = RD.models.gpt.name, CLA = RD.models.claude.name;
const who = (k) => ({ gpt: GPT, claude: CLA, 'gpt and claude': GPT + ' and ' + CLA }[k] || k);

/* ---- the words this page states, each read back from the records ---- */
const DS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'];
need(DS.every((k) => ST[k] && ST[k].verdict === 'CERTIFIED'), 'a finite statement is no longer CERTIFIED');
need(ST.L1 && ST.L1.verdict === 'CERTIFIED', 'the Lean step is no longer CERTIFIED');
need(R.controls.length > 0 && R.controlsMissed.length === 0 && R.controls.every((k) => k.refused), 'a control was missed');
need(/NOT DECIDED/.test(R.theorem), 'the record no longer says the theorem is not decided');
const A2 = (R.amendments || []).find((x) => x.id === 'A2');
need(A2 && A2.statement === 'D9' && A2.firstVerdict === 'REFUTED', 'the amendment on D9 is gone from the record');
const d4 = ST.D4.detail, d5 = ST.D5.detail, d6 = ST.D6.detail, d3 = ST.D3.detail, d2 = ST.D2.detail, d10 = ST.D10.detail, d8 = ST.D8.detail;
need(d4.cutoffs.even === 118 && d4.cutoffs.odd === 123 && d4.maxima.even === 237 && d4.maxima.odd === 244, 'the cutoffs moved');
need(d5.census.filter((c) => c.m % 2).every((c) => c.ties === 51) && d5.census.filter((c) => c.m % 2 === 0).every((c) => c.ties === 1), 'the census moved');
need(d3.scales.some((x) => x.m === 118) && d3.scales.some((x) => x.m === 123), 'the outside-window bound no longer reaches the cutoffs');
need(d10.rows.length === 24 && d10.rows.every((x) => x.equal && x.n >= 92000), 'the in-domain witnesses moved');
need(S.rows.length === 1096 && S.denominator === 2192 && S.proposed.min === -1476 && S.proposed.max === 3516 && S.rounded.max === 2192 * 1453 / 137 && S.rounded.min === -4 * 369, 'the figure\'s series moved');
need(S.rows.every((x) => x[1] >= x[2]), 'the proposed minimum lies above the rounded count on some residue');
need(RD.claims.every((c) => c.status === 'PROOF READ' && c.readBy.length >= 1), 'a reading moved');
const claim = (id) => { const c = RD.claims.find((x) => x.id === id); need(c, 'the claim ' + id + ' is gone'); return c; };
['H3', 'WINDOW', 'GLOBAL', 'ROUNDED', 'ALLN', 'PERIOD'].forEach(claim);
const pieces = d6.pieces.length, colourings = d2.colourings, baseScales = d5.baseline.length;
const refused = R.controls.filter((k) => k.refused).length;
const minutes = RD.run.minutes;
const lean = ST.L1.detail;
need(lean.axioms.join(', ') === 'propext, Classical.choice, Quot.sound' && lean.exit === 0 && lean.plantedRefused && lean.tie.differ === 0 && lean.compare.mismatches === 0, 'the Lean step moved');

/* ---- the figure: the correction to 117n²/2192 − n/2, residue by residue. The rounded colouring's count is decided
   (counted from its bits, D7 and D9); the proposed minimum is the two models' table and wears the weaker standing. ---- */
/* the first quarter of the period only: 1,096 jagged values in 900 pixels cannot be read; the record holds them all */
const QUARTER = 274;
const pts = (k) => S.rows.filter((x) => x[0] <= QUARTER).map((x) => [x[0], x[k] / S.denominator]);
need(S.rows.find((x) => x[0] === 220)[1] === S.rounded.max, 'the largest excess of the rounded colouring is no longer at residue 220');
const SERIES = (short) => [
  { name: short ? 'twelve blocks, rounded (counted)' : 'the twelve blocks rounded to the nearest integer: counted here from the colouring', pts: pts(1), standing: W.DECIDED },
  { name: short ? 'proposed minimum (not decided)' : 'the minimum the two models propose for n ≥ 92,000: their table, not decided here', pts: pts(2), standing: W.COMPUTED }
];
const eq = S.roundedEqualsProposedOn;
const FALT = 'Two jagged curves over the residue of n modulo 1096, shown from 0 to ' + QUARTER + ', both between about −1 and 11 progressions above 117n²/2192 − n/2. The dashed one, the minimum the two models propose, never rises above the solid one, the count of the rounded twelve blocks, which peaks near 10.6 at residue 220; the two often coincide and differ by at most 10.';
const fig = (w, h, short) => CH.lines({ w, h, x0: 0, x1: QUARTER, y0: -2, y1: 12, hover: false, padR: short ? 30 : 22, padL: short ? 40 : 62,
  yTicks: [0, 4, 8, 12].map((v) => ({ v, t: String(v) })), xTicks: (short ? [0, 137, 274] : [0, 55, 110, 165, 220, 274]).map((v) => ({ v, t: String(v) })),
  xLabel: short ? 'n mod 1096' : 'n modulo 1096 (the first quarter of the period)', yLabel: short ? 'above the formula' : 'progressions above 117n²/2192 − n/2',
  series: SERIES(short), alt: FALT });

const TITLE = 'Twelve blocks on the integers: two AI models propose an exact minimum';
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the record',
  title: TITLE,
  deck: 'I gave ' + GPT + ' (' + RD.models.gpt.lab + ') and ' + CLA + ' (' + RD.models.claude.lab + ') one identical message and one shared folder, and asked what happens when the best known colouring for a question of Ron Graham’s, twelve blocks of red and blue, is put on the integers. '
    + 'In ' + minutes + ' minutes they proposed, and each read the other’s proof of, the exact least number of single-coloured 3-term progressions: at every length n = 548m with m even and at least ' + d4.cutoffs.even + ', or odd and at least ' + d4.cutoffs.odd + ', and at every length from 92,000 on. '
    + 'With Claude (Anthropic’s AI model, and the same model as one of the two), I then decided the finite facts those proofs display: ' + DS.length + ' statements, all certified, and ' + refused + ' planted wrong versions, all refused. '
    + 'The theorem itself is not decided here. No machine has checked the proofs, nobody outside the two models has read them, and they rest on a lower bound that is this repository’s own and is not refereed.'
}));
O.push(C.figure({ hero: true, svgRaw: fig(900, 380, false), svgNarrowRaw: fig(360, 420, true), record: [SER, REC],
  caption: 'What is left after the formula. The least number of single-coloured progressions is 117n²/2192 − n/2 plus a bounded correction. The solid curve is that correction for the twelve blocks rounded to the nearest integer, counted here from the colouring itself; it repeats every 1,096 lengths. '
    + 'The dashed curve is the minimum the two models propose for every n from 92,000 on: their table of 1,096 integers, which this page does not decide. Over the whole period it coincides with the rounded colouring on ' + eq + ' residues and lies below it by at most 10 on the rest. The figure shows residues 0 to ' + QUARTER + ' of the 1,096; the record holds them all.',
  stop: 'the proposed minimum rises above the counted colouring on any residue, or the counted series stops repeating with period 1,096' }));
O.push(C.stats([
  { k: 'finite statements decided', v: DS.length + ' of ' + DS.length, n: 'all certified, each on a stated finite domain; ' + refused + ' planted wrong versions refused' },
  { k: 'proofs checked by a machine', v: '0', n: 'each proof was read once, by the other model; one finite lemma is checked in Lean' },
  { k: 'least scale the proposed theorem covers', v: 'm = ' + d4.cutoffs.even, n: 'n = 548m with m even; odd m from ' + d4.cutoffs.odd + '. Every other scale is open' },
  { k: 'from the first message to the last', v: minutes + ' min', n: N(RD.run.messages.gpt + RD.run.messages.claude) + ' messages between the two models, in one shared folder' }
]));
O.push(C.scope('This page reports one run of two models working together; it does not compare them. The mathematics is theirs. The checks and this page are mine, done with Claude, and the session that ran the checks is the same model as one of the two.'));

O.push(C.section({ lab: 'read this first', title: 'What is still open', id: 'limits', bodyRaw:
  C.plainList(RD.notDone.map((t) => ({ text: T(t) })))
  + C.pRaw(C.esc('The conditions of the run:'))
  + C.plainList(RD.conditions.map((t) => ({ text: T(t) }))) }));

/* ---- the question ---- */
O.push(C.section({ lab: 'the question', title: 'How few single-coloured progressions can a colouring have', id: 'question', bodyRaw:
  C.pRaw(C.esc('Colour each of the integers 1 to n red or blue and count the triples a, a + d, a + 2d, with d ≥ 1, whose three members have one colour. Call the least possible count V(n). A random colouring has about n²/16. In 1999 Ron Graham offered $100 for the true constant.'))
  + C.pRaw(C.esc('In 2008 Parrilo, Robertson and Saracino found a colouring in twelve alternating blocks, of lengths proportional to'))
  + C.pRaw('<span class="m">' + C.esc('28 · 6 · 28 · 37 · 59 · 116 · 116 · 59 · 37 · 28 · 6 · 28   (out of 548)') + '</span>')
  + C.pRaw(C.esc('that has (117/2192)·n² of them to first order, and conjectured that nothing does better. In October 2026 this repository published a proof of the matching lower bound, by five exact certificates; it is ') + a('/reports/delta3.html', 'its own report') + C.esc(', and it has not been refereed.'))
  + C.pRaw(C.esc('That result is about the leading term. On the integers, with n = 548m and every block m times as long, the twelve blocks have exactly 117n²/2192 − n/2 single-coloured progressions when m is even, and one more when m is odd. The question I put to the two models: is that the minimum, exactly, once m is large?')) }));

/* ---- the run ---- */
O.push(C.section({ lab: 'the run', title: 'One message, one folder, two models', id: 'run', bodyRaw: C.plainList([
  { b: 'One message.', raw: C.esc('Both chats received the same line, pointing at one folder with the question in it (') + rec(DIR + 'twelve-block-session.md') + C.esc(' is the brief; ') + rec(DIR + 'run/GOAL.md') + C.esc(' is what the folder told them was already known).') },
  { b: 'One conversation.', raw: C.esc('Each model wrote only in its own subfolder, could read the other’s at any time, and talked to the other through a shared log: ') + rec(DIR + 'run/chat/gpt.jsonl') + C.esc(' and ') + rec(DIR + 'run/chat/claude.jsonl') + C.esc('. I relayed nothing between them.') },
  { b: 'A control room.', text: 'A third chat answered their questions, brought them the files of the lower-bound proof, counted the colourings they submitted, and planted one false claim, which both caught. It had no say in the mathematics.' },
  { b: 'Reading before building.', text: 'A model could not check its own claim. Each claim below was read by the other model, from a derivation of its own where it says so.' }
]) }));

/* ---- 1 · what they proposed ---- */
O.push(C.section({ lab: '1 · what they proposed', title: 'Six claims, each read by the other model', id: 'claims', wide: true, bodyRaw:
  '<div class="col">' + C.pRaw(C.esc('PROOF READ means a written proof was followed line by line by the reader named and no error was found. It is not a formal check, and it is not this repository’s verdict.')) + '</div>'
  + C.table({ cols: [{ h: 'Claim' }, { h: 'From' }, { h: 'Read by' }, { h: 'Standing' }, { h: 'How it was read' }],
    rows: RD.claims.map((c) => [T(c.statement), who(c.from), c.readBy.map(who).join(', '), { raw: tag(c.status, 'cert') }, T(c.note)]) })
}));

/* ---- 2 · the proof ---- */
O.push(C.section({ lab: '2 · the argument', title: 'Four steps, and who took each', id: 'proof', bodyRaw: C.plainList([
  { b: 'A strict bound near the optimum.', text: 'The lower-bound proof shows that no colouring beats the twelve blocks in the limit, but it gives no margin for colourings close to them. ' + GPT + ' found one: add a rank-one term to one certificate, and the same verifier still accepts it. A colouring that differs from the twelve blocks on a fraction μ of the interval then pays at least μ²/1024. ' + CLA + ' pushed the constant to 948 and showed 947 fails.' },
  { b: 'An exact identity on the integers.', text: 'The count on the integers equals the continuous functional plus terms that can be written down exactly: the two parity sums, and a correction that only sees neighbouring sites of different colours. ' + GPT + ' wrote it for even n, ' + CLA + ' for every n.' },
  { b: 'Few flips, all near the boundaries.', text: 'Together these say a colouring at or below the twelve blocks differs from them in fewer than ' + d4.maxima.odd + ' sites. A flipped site far from every block boundary costs about 2m, more than those few flips can win back once m ≥ ' + d4.cutoffs.even + ' (even) or ' + d4.cutoffs.odd + ' (odd). ' + GPT + ' had this from m ≥ 192; a sharper count by ' + CLA + ', with a deletion argument of ' + GPT + '’s, brought it down.' },
  { b: 'Near the boundaries, an enumeration.', text: 'Within 2m sites of the eleven boundaries the cost of any pattern of flips is a positive definite quadratic form in 22 integers. Its non-positive points can be listed: only the twelve blocks at even m, and 51 patterns at odd m. ' + GPT + ' and ' + CLA + ' each did this with their own program.' }
]) + C.pRaw(C.esc('The same four steps, with the rounded colouring in place of the twelve blocks, give the bounds at every length and the table of 1,096 corrections. The proofs are ') + rec(DIR + 'run/gpt/global.md') + C.esc(', ') + rec(DIR + 'run/gpt/windows.md') + C.esc(', ') + rec(DIR + 'run/gpt/sharper-cutoffs.md') + C.esc(', ') + rec(DIR + 'run/gpt/rounding.md') + C.esc(', ') + rec(DIR + 'run/gpt/periodic-optimum.md') + C.esc(' and ') + rec(DIR + 'run/claude/NOTES-alln.md') + C.esc('.')) }));

/* ---- 3 · what is decided ---- */
const DOMAIN = {
  D1: 'The strengthened certificate, with the constant 948, is accepted by this repository’s own verifier, unmodified; 947 is refused.',
  D2: 'The identity on the integers, and the bound on its correction: every colouring of every length from 2 to 14, and 200 random ones at each length to 80 (' + N(colourings) + ' colourings).',
  D3: 'A flip far from the boundaries costs at least 2m + 2, or 2m + 1 at odd m: every such site at m = 1 to 12 and at the two cutoffs, ' + d4.cutoffs.even + ' and ' + d4.cutoffs.odd + '. The bound is attained.',
  D4: 'The arithmetic that turns the bounds into the cutoffs ' + d4.cutoffs.even + ' and ' + d4.cutoffs.odd + ' and into the constants of the every-length bounds, by exhaustion over a box that contains every case.',
  D5: 'The twelve blocks have exactly 117n²/2192 − n/2, plus one at odd m, at ' + baseScales + ' scales up to m = 195; among the 4,194,304 patterns of the 22 boundary sites none goes below them, with 51 ties at odd scales and none at even scales (m = 1 to 8).',
  D6: N(pieces) + ' pieces of the wider windows, 24 sites each, walked in full at m = 1, 2 and 3: none goes below the twelve blocks, and the ties are exactly the expected ones.',
  D7: 'The rounded twelve blocks, counted at every length from 1 to 3,288: the excess repeats with period 1,096 and lies between −369/548 and 1453/137.',
  D8: 'The bounds at every length contain the 45 known values of V(n) (OEIS A121385); the first 14 were recomputed here by exhaustion.',
  D9: 'The table of 1,096 corrections, as a table, agrees on every row with the count of the rounded colouring and the loss the table states.',
  D10: 'At 24 lengths from 92,000 on, one in each of 24 residue classes, the colouring the table names has exactly the count the table states. This shows V(n) is at most that value there, and nothing about the other direction.'
};
O.push(C.section({ lab: '3 · what is decided here', title: 'Ten finite statements, and the wrong versions that had to fail', id: 'decided', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'What this is.', raw: C.esc('A judge that shares no code with either model decides the finite facts the proofs display, each on a stated finite domain, in exact arithmetic. The statements were written down before the judge existed (') + rec(PRE) + C.esc('). It does not decide the theorem: a statement about every n is checked on the lengths named and no further.') },
    { b: 'The controls.', text: refused + ' wrong versions of the same statements were planted and each had to be refused: the constant 947, the identity without its correction term, a bound one larger, cutoffs two smaller, a tie count of 50, a period of 548, and others. None was missed.' },
    { b: 'A fault of mine, kept.', text: 'The first run refused one statement, D9. The fault was in how I had written it down: I had guessed the sign of one field of the models’ table. The statement was restated in a dated amendment before the judge was changed, and the first verdict is kept in the record.' }
  ]) + '</div>'
  + C.table({ cols: [{ h: '' }, { h: 'What was decided, and on what' }, { h: 'Verdict' }],
    rows: DS.map((k) => [k, T(DOMAIN[k]), { raw: tag(ST[k].verdict) }]) })
  + '<div class="wide"><details class="more"><summary>The ' + R.controls.length + ' planted wrong versions</summary>' + C.table({ cols: [{ h: 'Planted' }, { h: 'What the judge found' }, { h: 'Refused' }],
    rows: R.controls.map((k) => [T(k.control), T(k.text), k.refused ? 'yes' : 'MISSED']) }) + '</details></div>'
  + '<div class="wide"><details class="more"><summary>What the judge does not decide, by name</summary>' + C.plainList(R.notDecided.map((t) => ({ text: T(t) }))) + '</details></div>'
}));

/* ---- 4 · Lean ---- */
O.push(C.section({ lab: '4 · one lemma in Lean', title: 'The step from two scales to every scale', id: 'lean', bodyRaw: C.plainList([
  { b: 'The lemma.', text: 'The cost of flipping any pattern of the 22 boundary sites is a quadratic form with 253 coefficients, given by closed formulas in m. The models’ first step is that these coefficients are the same at m and at m + 2, so two finite computations, one odd and one even, settle every scale.' },
  { b: 'What the kernel checked.', raw: C.esc('That equality, for every integer m ≥ 1, in Lean ' + lean.version + ' with no library beyond the core: ') + rec('instruments/twelve-blocks/lean/TwelveBlocks.lean') + C.esc(', on the three standard axioms, with no sorry. Three planted false versions are refused.') },
  { b: 'What ties it to the question.', text: 'The Lean definitions agree with the formulas of the brief on all ' + N(lean.compare.compared) + ' numbers at m = 1 to 8, and with costs recounted here from whole colourings on the same ' + N(lean.tie.compared) + '.' },
  { b: 'What it does not check.', text: 'That the cost of a pattern is that quadratic form with those formulas, for every m. That step is on paper. Nothing else of the argument is in Lean: not the enumeration near the boundaries, not the identity on the integers.' }
]) }));

/* ---- prior work ---- */
O.push(C.section({ lab: 'prior work', title: 'What was already known', id: 'prior', bodyRaw:
  C.pRaw(C.esc('A web search of about thirty pages, not a survey. Nothing on this page should be called new before someone who knows this literature has read it. The constant 117/2192 itself is, in print, still a conjecture.'))
  + C.plainList(RD.priorWork.map((p) => ({ raw: a(p.url, p.who + ', ' + p.what + ' (' + p.year + ')') + C.esc(T(': ' + p.says + '.')) })))
  + C.pRaw(C.esc('Not found: ' + RD.notFound.charAt(0).toLowerCase() + RD.notFound.slice(1) + ' The search and its limits are in ') + rec(DIR + 'literature-2026-11-19.md') + C.esc('.')) }));

O.push(C.section({ lab: 'who did what', title: 'Each step is a separate job', id: 'roles', bodyRaw: C.plainList([
  { b: 'The mathematics.', text: GPT + ' and ' + CLA + ': every claim, proof and table on this page. Each is credited in the table of claims.' },
  { b: 'The readings.', text: 'Each model on the other’s proofs. I have not read the proofs as a mathematician would, and I do not vouch for them.' },
  { b: 'The judge.', text: 'This repository’s counter of progressions, its verifier of the lower-bound certificates, and a program written after the run from the definitions. It decides what it is given; it found nothing.' },
  { b: 'The run, the Lean lemma and this page.', text: 'Carlos Toledo, with Claude (Anthropic), which wrote the programs under my direction. The run was made on 19 November 2026 (UTC) on one laptop.' }
]) }));

O.push(C.section({ lab: 'check it yourself', title: 'How to re-read it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'The record.', raw: m('python3 instruments/twelve-blocks/judge.py --check') + C.esc(' re-checks the pinned files and decides four of the statements again in seconds; ') + m('--write') + C.esc(' decides all of them, in about twenty minutes on eight cores, and writes ') + rec(REC) + C.esc('.') },
  { b: 'One colouring.', raw: C.esc('Any colouring can be counted from its bits with ') + rec('instruments/twelve-blocks/ap3.py') + C.esc(', which also walks every pattern of up to 24 sites. A colouring of 1 to 548m with fewer single-coloured progressions than the twelve blocks, for an even m ≥ ' + d4.cutoffs.even + ', would refute the theorem in one file.') },
  { b: 'The Lean lemma.', raw: m('sh instruments/twelve-blocks/lean/check.sh') + C.esc(' regenerates and compiles it in about a minute.') },
  { b: 'What the models wrote.', raw: C.esc('Their notes, tables and the whole conversation are under ') + rec(DIR + 'run') + C.esc('. Their programs are not copied here; each is pinned by its hash in ') + rec(DIR + 'MANIFEST.json') + C.esc('.') },
  { b: 'Who read what.', raw: rec(DIR + 'readings.json') + C.esc(', written by hand from the conversation; the page states nothing about a proof that is not in it.') }
]) }));

const foot = '<p>' + C.esc('Generated by tools/build-report-twelve-blocks.js from ' + REC + ', re-checked as the page is built. I did this with Claude (Anthropic); Claude wrote the programs under my direction.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'twelve-blocks.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/twelve-blocks.html',
  og: { image: '/og-twelve-blocks.png', alt: OG.alt('twelve-blocks') },
  desc: 'GPT-6.2 Astra and Claude Fable 5.2, working together, propose the exact least number of single-coloured 3-term progressions at large lengths. The finite facts are decided; the theorem is not.' }));
console.log('reports/twelve-blocks.html written · statements ' + DS.length + ' CERTIFIED · controls refused ' + refused + ' of ' + R.controls.length + ' · cutoffs ' + d4.cutoffs.even + '/' + d4.cutoffs.odd);
