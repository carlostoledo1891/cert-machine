#!/usr/bin/env node
/* build-report-twelve-blocks-exact.js — reports/twelve-blocks-exact.html: the second twelve-blocks run. Exact values of
   the least number of monochromatic 3-term progressions for every n up to 95, each by a certificate and a colouring,
   and what is decided at n = 548.

   TWO KINDS OF STATEMENT, KEPT APART. The exact values are unconditional and decided here. The two models' theorems
   about every large n are NOT decided: each was read once, by the other model. What stays open comes first. Every
   number, verdict word and name on the page is read from certs/twelve-blocks-exact.json (the judge's record), the first
   run's table (corpus/twelve-blocks) and corpus/twelve-blocks-2/readings.json (who read what, written by hand); the
   build refuses when a record stops saying what a sentence of the page states.

   usage: node tools/build-report-twelve-blocks-exact.js                                                         MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));   /* the page's own light art card (og-twelve-blocks-exact.png) */
const die = (msg) => { console.error('TWELVE BLOCKS EXACT PAGE REFUSED: ' + msg); process.exit(1); };
const need = (ok, msg) => { if (!ok) die(msg); };
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.breakable(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const T = (s) => String(s).replace(/'/g, '’').replace(/"([^"]*)"/g, '“$1”');
const tag = (v, k) => C.tag(v, k);
const REC = 'certs/twelve-blocks-exact.json';
const DIR = 'corpus/twelve-blocks-2/';
const PRE = 'notes/twelve-blocks-2-preregistration-2026-11-19.md';
const INST = 'instruments/twelve-blocks/exact/';

try { const out = cp.execFileSync('python3', [INST + 'judge.py', '--check'], { cwd: ROOT, encoding: 'utf8' }); need(/^pins intact/.test(out), 'the record did not pass its check: ' + out.trim()); }
catch (e) { die(INST + 'judge.py --check refused: ' + (e.stdout || '') + (e.stderr || '')); }
const R = JSON.parse(fs.readFileSync(path.join(ROOT, REC), 'utf8'));
const RD = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'readings.json'), 'utf8'));
const MAN = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'MANIFEST.json'), 'utf8'));
const TABLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'twelve-blocks', 'run', 'gpt', 'optimum-residues.json'), 'utf8'));
const ST = R.statements, GPT = RD.models.gpt.name, CLA = RD.models.claude.name;
const who = (k) => ({ gpt: GPT, claude: CLA }[k] || k);

/* ---- the words this page states, each read back from the record ---- */
const US = ['U0', 'U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'T1', 'T2'];
need(US.every((k) => ST[k] && ST[k].verdict === 'CERTIFIED'), 'a statement is no longer CERTIFIED');
need(R.controls.length > 0 && R.controlsMissed.length === 0 && R.controls.every((k) => k.refused), 'a control was missed');
need(/NOT DECIDED/.test(R.theorems), 'the record no longer says the theorems are not decided');
const rows = ST.U1.detail.rows;
need(rows.length >= 95 && rows.every((r, i) => r.n === i + 1) && ST.U1.detail.failures.length === 0, 'the table of exact values moved');
const NMAX = rows.length, V = (n) => rows[n - 1].V, cubes = rows.reduce((s, r) => s + (r.cubes || 0), 0);
need(V(45) === 86 && V(46) === 90 && V(50) === 110, 'the table no longer joins the published values');
const cOf = {}; for (const x of TABLE) cOf[x.residue] = x.excess_numerator;
const fNum = (n) => 117 * n * n - 1096 * n;                         /* 2192 f(n) */
need(rows.every((r) => 2192 * r.V === fNum(r.n) + cOf[r.n % 1096]), 'a decided value differs from the first run\'s formula');
need(/45 of 45/.test(ST.U1.detail.observed['equal to OEIS A121385']), 'the table no longer reproduces the published 45 values');
const NEW = NMAX - 45;
need(NEW === 50, 'the title says fifty new values and the table has ' + NEW);
const E1 = (R.unitScale || {}).E1, V548 = (R.unitScale || {}).V548, E1ok = !!(E1 && E1.verdict === 'CERTIFIED' && V548 && V548.verdict === 'CERTIFIED' && E1.items.length === 9 && E1.items.every((x) => x.passed) && E1.cleanRun);
const E1ctl = E1ok ? E1.controls : [], E1missed = E1ok ? E1.controlsNotRefused : [];
need(!E1ok || (E1ctl.length >= 6 && E1missed.length <= 1), 'the controls of the unit-scale judge moved');
need(ST.U4.detail.sameAsFirstRecord === true && ST.U4.detail.exceptionCounts.join() === '15756', 'the count at the unit scale moved');
need(RD.theorems.every((t) => t.status === 'PROOF READ' && t.readBy.length >= 1), 'a reading moved');
const refused = R.controls.filter((k) => k.refused).length;
const msgs = MAN.chatLines;

/* ---- the figure: what is left of V(n) after the formula's two leading terms. Solid where V(n) is decided; dashed where
   the value is the two models' proposal (the first run's table), which this page does not decide. ---- */
const XMAX = 190;
const decided = rows.map((r) => [r.n, (2192 * r.V - fNum(r.n)) / 2192]);
/* the proposal is drawn only beyond the decided range: inside it the two are the same numbers (checked above) */
const proposed = []; for (let n = NMAX; n <= XMAX; n++) proposed.push([n, cOf[n % 1096] / 2192]);
const SERIES = (short) => [
  { name: short ? 'decided: exact V(n), n ≤ ' + NMAX : 'decided here: the exact minimum, for every n up to ' + NMAX, pts: decided, standing: W.DECIDED },
  { name: short ? 'proposed formula (not decided)' : 'the formula the two models propose for every n: not decided here', pts: proposed, standing: W.COMPUTED }
];
const FALT = 'Two curves over the length n from 1 to ' + XMAX + ', between about −0.7 and 1.6 progressions above 117n²/2192 − n/2. The solid one, the decided exact minimum, runs from n = 1 to n = ' + NMAX + '; the dashed one, the proposed formula, continues from there to n = ' + XMAX + '.';
const fig = (w, h, short) => CH.lines({ w, h, x0: 0, x1: XMAX, y0: -1, y1: 2, hover: false, padR: short ? 30 : 22, padL: short ? 40 : 62,
  yTicks: [-1, 0, 1, 2].map((v) => ({ v, t: String(v).replace('-', '−') })), xTicks: (short ? [1, NMAX, XMAX] : [1, 45, NMAX, 140, XMAX]).map((v) => ({ v, t: String(v) })),
  xLabel: short ? 'length n' : 'length n (the published table ended at 45)', yLabel: short ? 'above the formula' : 'V(n) minus (117n²/2192 − n/2)',
  series: SERIES(short), alt: FALT });

const TITLE = 'Fifty new exact values for a colouring problem, each with a certificate';
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the record',
  title: TITLE,
  deck: 'Colour the numbers 1 to n red or blue: how few three-term progressions of one colour can there be? The exact answer was known up to n = 45. '
    + 'In a second run, ' + CLA + ' (' + RD.models.claude.lab + ') and ' + GPT + ' (' + RD.models.gpt.lab + '), working together, produced a certificate for every n up to ' + NMAX + ': ' + NEW + ' new values. '
    + 'With Claude (Anthropic’s AI model, and the same model as one of the two), I checked every certificate in exact arithmetic with a program that shares no code with the search. These values depend on nothing but the definition. '
    + (E1ok ? 'One further value is decided far beyond the table: at n = 548, the first length the twelve blocks of the 2008 conjecture fit exactly, the minimum is 15,756, attained by exactly 102 colourings. ' : '')
    + 'The two models also proposed much more, an exact formula for every large n; that part is not decided here.'
}));
O.push(C.figure({ hero: true, svgRaw: fig(900, 380, false), svgNarrowRaw: fig(360, 420, true), record: [REC, 'corpus/twelve-blocks/run/gpt/optimum-residues.json'],
  caption: 'What is left of the minimum after its two leading terms. Solid: the exact minimum V(n), decided here for every n up to ' + NMAX + ' by a certificate and a colouring. Dashed: the formula the two models propose for every n, a table of 1,096 corrections that repeats with n, drawn where nothing is decided. '
    + 'On all ' + NMAX + ' decided lengths the formula gives exactly the decided value. Beyond ' + NMAX + ' it is a proposal: it is proved only from n = 15,756 on, by an argument this page does not decide.',
  stop: 'a decided value leaves the proposed formula, or the table of decided values has a gap' }));
O.push(C.stats([
  { k: 'lengths with an exact minimum', v: String(NMAX), n: NEW + ' of them new; the published table ended at 45, and its 45 values are reproduced' },
  { k: 'certificate pieces checked', v: N(cubes), n: 'each one a matrix proved positive semidefinite in exact arithmetic' },
  { k: 'planted wrong versions refused', v: refused + ' of ' + refused, n: 'a value raised by one, a piece dropped, a flipped site, and others' },
  E1ok ? { k: 'the exact minimum at n = 548', v: '15,756', n: 'with 102 minimising colourings; no paper lemma used. The theorems about every large n are not decided' }
       : { k: 'theorems about every large n decided here', v: '0', n: 'each was read once, by the other model; see what is open' }
]));
O.push(C.scope('Two kinds of statement are on this page and they are kept apart. The exact values are decided, by certificates anyone can check. The theorems about every large n are the two models’ and are only read. Nothing here compares the two models.'));

O.push(C.section({ lab: 'read this first', title: 'What is still open', id: 'limits', bodyRaw:
  C.plainList(RD.notDone.map((t) => ({ text: T(t) })))
  + C.pRaw(C.esc('The conditions of the run:'))
  + C.plainList(RD.conditions.map((t) => ({ text: T(t) }))) }));

/* ---- the certificate ---- */
O.push(C.section({ lab: 'the certificate', title: 'How a lower bound is proved without trusting the search', id: 'certificate', bodyRaw: C.plainList([
  { b: 'One identity.', text: 'Write +1 for red and −1 for blue. Three numbers have one colour exactly when (1 + ab + bc + ac)/4 is 1, and it is 0 otherwise. Summed over all progressions, four times the count is a fixed number plus a sum over pairs of sites, each pair weighted by how many progressions pass through both.' },
  { b: 'Cubes.', text: 'The 2ⁿ colourings are split into disjoint pieces, each fixing the colour of some sites and leaving the rest free.' },
  { b: 'One matrix per piece.', text: 'On each piece the certificate gives a list of integers. They define one integer matrix; if that matrix is positive semidefinite, the count on the whole piece is at least a number that can be read off, and one strict inequality makes it reach the claimed value.' },
  { b: 'The checker.', raw: C.esc('It rebuilds each matrix from the piece and the definition, proves it positive semidefinite in exact integers and fractions, checks the inequality, and checks that the pieces are disjoint and fill everything. It was written from the format’s one page (') + rec(DIR + 'run/claude/CERT-FORMAT-V.md') + C.esc(') and shares no code with the program that searched. A certificate is checked, not trusted.') },
  { b: 'The other half.', text: 'For each n a colouring with exactly that many single-coloured progressions is given and counted. Lower bound and colouring together are the exact value.' }
]) }));

/* ---- 1 · the table ---- */
const newVals = rows.filter((r) => r.n > 45).map((r) => r.V).join(', ');
O.push(C.section({ lab: '1 · the exact values', title: 'Every length from 1 to ' + NMAX, id: 'table', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'What was known.', raw: C.esc('The exact minimum for n ≤ 45 (') + a('https://oeis.org/A121385', 'OEIS A121385') + C.esc('; the last values by integer programming, R. Pratt, 2014), and upper bounds 90, 95, 100, 104, 110 for n = 46 to 50.') },
    { b: 'What is decided here.', text: 'The exact minimum for every n from 1 to ' + NMAX + '. The five upper bounds of 2014 are sharp. The 45 published values are reproduced by certificates that use none of the earlier computations.' },
    { b: 'The new values, n = 46 to ' + NMAX + '.', raw: '<span class="m">' + C.esc(newVals) + '</span>' },
    { b: 'A pattern.', text: 'Every one of the ' + NMAX + ' values equals the formula the first run proposed for large n: (117n² + c)/2192 − n/2, with c one of 1,096 integers that depends only on the remainder of n modulo 1096. Whether that holds for every n is open; the two models conjecture it.' },
    { b: 'How far it goes.', text: 'The largest certificate has ' + N(Math.max.apply(null, rows.map((r) => r.cubes || 0))) + ' pieces. The model that found it reports about twenty minutes of search; checking all ' + NMAX + ' certificates takes about two minutes.' }
  ]) + '</div>'
  + '<div class="wide"><details class="more"><summary>All ' + NMAX + ' values, with the number of pieces in each certificate</summary>' + C.table({ cols: [{ h: 'n' }, { h: 'Exact minimum V(n)' }, { h: 'Pieces in the certificate' }, { h: '' }],
    rows: rows.map((r) => [String(r.n), String(r.V), r.cubes === null ? '' : N(r.cubes), r.n > 45 ? 'new' : 'as published']) }) + '</details></div>'
}));

/* ---- 2 · n = 548 ---- */
const unitItems = [
  { b: 'Why 548.', raw: C.esc('It is the first length at which the twelve blocks of Parrilo, Robertson and Saracino fit the integers exactly: blocks of 28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6 and 28 sites. They have 15,756 single-coloured progressions. The ') + a('/reports/twelve-blocks.html', 'first report') + C.esc(' is about whether that is the minimum at this and larger lengths.') },
  { b: 'A lower bound from nothing.', text: 'One certificate with a single piece proves that every colouring of 1 to 548 has at least 15,385. A second exact computation shows that a single piece cannot prove 15,386: closing the remaining 371 this way needs many pieces.' },
  { b: 'Near the block boundaries.', text: 'Among the colourings that agree with the twelve blocks outside 48 sites (four at each of the eleven boundaries, and four more), none has fewer than 15,756, and exactly 51 have 15,756. They are the same 51 found in the first report by trying all 4,194,304 patterns of 22 sites.' }
];
if (E1ok) {
  unitItems.push({ b: 'Everything else.', raw: C.esc('A separate program, written from the text of ' + GPT + '’s finite proof and sharing no code with either model, establishes in nine steps that a colouring with at most 15,756 must agree with the twelve blocks, or with their colour exchange, outside those 48 sites. Together: V(548) = 15,756 exactly, with 102 minimising colourings. Its report, gaps first, is ') + rec('instruments/twelve-blocks/exact/judge548/REPORT.md') + C.esc('.') });
  unitItems.push({ b: 'What that rests on.', text: 'No theorem about the continuum and no lemma on paper: the inequalities of the October certificates are proved again by counting on the 548 sites. It does reuse the multipliers of those certificates as numbers, verifying every identity they enter, and it takes four of their bounds from this repository’s own verifier. One program, one author, the same model family as one of the two; nobody has replayed it with a second program.' });
  unitItems.push({ b: 'Its planted errors.', text: E1ctl.length + ' wrong versions were planted; ' + (E1ctl.length - E1missed.length) + ' were refused. ' + (E1missed.length ? 'One was not, and correctly: I had planned to double one entry of one of the proof’s 201 auxiliary vectors, but any such vector gives a true inequality, and that one still closes the argument. The control was badly chosen, and the record says so. Doubling the largest entry of each vector in turn stops the proof in 191 of 201.' : '') });
} else {
  unitItems.push({ b: 'Everything else: not decided.', text: 'What is missing for V(548) = 15,756 is that a colouring with at most 15,756 cannot differ from the twelve blocks outside those 48 sites. ' + GPT + ' wrote a finite proof of it and ' + CLA + ' rebuilt its pieces with its own program; an independent judge of this repository has not certified it. Until one does, V(548) = 15,756 is the two models’ result, read once.' });
}
O.push(C.section({ lab: '2 · the first twelve-block length', title: 'What is decided at n = 548', id: 'unit', bodyRaw: C.plainList(unitItems) }));

/* ---- 3 · the theorems ---- */
O.push(C.section({ lab: '3 · proposed, not decided', title: 'What the two models claim about every large n', id: 'theorems', wide: true, bodyRaw:
  '<div class="col">' + C.pRaw(C.esc('PROOF READ means a written proof was followed by the reader named and no error was found. It is not a formal check, and it is not this repository’s verdict. All of this rests on the lower bound of October 2026, which is this repository’s own claim and is not refereed.')) + '</div>'
  + C.table({ cols: [{ h: 'Claim' }, { h: 'From' }, { h: 'Read by' }, { h: 'Standing' }, { h: 'How it was read' }],
    rows: RD.theorems.map((c) => [T(c.statement), who(c.from), c.readBy.map(who).join(', '), { raw: tag(c.status, 'cert') }, T(c.note)]) })
  + '<div class="col">' + C.pRaw(C.esc('The proofs are in ') + rec(DIR + 'run/gpt/Localisation.md') + C.esc('; the readings are in the conversation, ') + rec(DIR + 'run/CHAT.md') + C.esc('.')) + '</div>'
}));

/* ---- 4 · tests ---- */
O.push(C.section({ lab: '4 · tested, as far as counting reaches', title: 'Three finite tests of those claims', id: 'tests', bodyRaw:
  C.pRaw(C.esc('A test that passes decides the test, not the theorem.'))
  + C.plainList([
    { b: 'The formula’s value is attained.', text: 'For every n from 1 to 3,288 some colouring has exactly the formula’s value. So the minimum is at most the formula there; the question is only whether it can be lower.' },
    { b: 'The two maps.', text: 'At 40 lengths from 20,700 on, on three kinds of colouring each, moving every colour change by its prescribed amount adds exactly 117n + 63,568 progressions, and the reflection keeps the correction: 120 of 120 cases each. A shift one site larger gives the right number in ' + ((R.controls.find((k) => /^K7/.test(k.control)) || { text: '' }).text.match(/in (\d+) of/) || [0, 'few'])[1] + ' of 120.' },
    { b: 'The table’s colourings.', text: 'At the first length from 20,700 on in each of the 1,096 residue classes, the colouring the table names has exactly the table’s value.' }
  ]) }));

O.push(C.section({ lab: 'who did what', title: 'Each step is a separate job', id: 'roles', bodyRaw: C.plainList([
  { b: 'The certificates and their format.', text: CLA + ', which also wrote the search that found them.' },
  { b: 'The theorems about large n, and the single-piece bound at 548.', text: GPT + '. ' + CLA + ' read each of them; ' + GPT + ' re-verified the certificates at n = 46 to 50, 64 and 88 with its own program.' },
  { b: 'The checker and the judge.', text: 'Written during the run by the control room from the format’s page, then pre-registered and run again for this record. It decides what it is given; it found nothing.' },
  { b: 'The run and this page.', text: 'Carlos Toledo, with Claude (Anthropic), which wrote the programs under my direction. The run took ' + RD.run.minutes + ' minutes on 19 November 2026 (UTC), on one laptop: ' + N(msgs.gpt + msgs.claude) + ' messages between the two models, in one shared folder.' }
]) }));

O.push(C.section({ lab: 'check it yourself', title: 'How to re-read it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'The record.', raw: m('python3 ' + INST + 'judge.py --check') + C.esc(' re-checks the pinned files and decides four statements again in half a minute; ') + m('--write') + C.esc(' decides everything, in about twelve minutes on eight cores, and writes ') + rec(REC) + C.esc('. The statements were written down before the judge was committed: ') + rec(PRE) + C.esc('.') },
  { b: 'One value.', raw: C.esc('The certificates are in ') + rec(DIR + 'certificates') + C.esc(', compressed. Unpack one and give it to ') + rec(INST + 'cubepsd.py') + C.esc('. A colouring of 1 to n with fewer single-coloured progressions than the table says, for any n up to ' + NMAX + ', would refute that row in one line.') },
  { b: 'The format.', raw: rec(DIR + 'run/claude/CERT-FORMAT-V.md') + C.esc(': one page and two short additions, with the argument that a certificate proves its claim.') },
  { b: 'What the models wrote.', raw: C.esc('Their notes, data and the whole conversation are under ') + rec(DIR + 'run') + C.esc('. Their programs are not copied here; each is pinned by its hash in ') + rec(DIR + 'MANIFEST.json') + C.esc('.') },
  { b: 'The first run.', raw: a('/reports/twelve-blocks.html', 'Twelve blocks on the integers') + C.esc(': the proposal this run set out to test, with its own record and what it leaves open.') }
]) }));

const foot = '<p>' + C.esc('Generated by tools/build-report-twelve-blocks-exact.js from ' + REC + ', re-checked as the page is built. I did this with Claude (Anthropic); Claude wrote the programs under my direction.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'twelve-blocks-exact.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/twelve-blocks-exact.html',
  og: { image: '/og-twelve-blocks-exact.png', alt: OG.alt('twelve-blocks-exact') },
  desc: 'The least number of single-coloured 3-term progressions in a 2-colouring of 1..n, exact for every n up to ' + NMAX + ': ' + NEW + ' new values, each with a certificate checked in exact arithmetic.' }));
console.log('reports/twelve-blocks-exact.html written · exact values to n = ' + NMAX + ' (' + NEW + ' new) · ' + N(cubes) + ' cubes · controls refused ' + refused + ' of ' + R.controls.length + ' · E1 ' + (E1ok ? 'CERTIFIED' : 'not decided'));
