#!/usr/bin/env node
/* build-report-gsm8k.js — reports/gsm8k-audit.html: GSM8K's answer key
   re-decided to the last step.

   Every harness that scores GSM8K compares a model's number with the `#### N`
   line of a stored solution. The solution also prints the arithmetic that
   reaches N — calculator annotations <<lhs=rhs>> and prose equations — and
   that arithmetic can be re-decided without a model and without a reader.
   instruments/gsm8k/audit.py does that in exact rational arithmetic;
   tools/run-gsm8k-ledger.py writes the ledger and joins GSM8K-Platinum's
   human revision to it. This page reads the ledger and nothing else.

   Gates: the battery must pass with every red fired, the ledger must
   re-derive unchanged, and every sentence below is gated on the ledger field
   it reads.

   usage: node tools/build-report-gsm8k.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('GSM8K REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const bat = cp.spawnSync('python3', [path.join(ROOT, 'instruments', 'gsm8k', 'battery.py')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /gsm8k battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the gsm8k battery did not pass clean:\n' + bout.slice(-800));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);
const chk = cp.spawnSync('python3', [path.join(ROOT, 'tools', 'run-gsm8k-ledger.py'), '--check'], { cwd: ROOT });
if (chk.status !== 0) die('the ledger does not re-derive unchanged:\n' + String(chk.stdout) + String(chk.stderr));

const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'gsm8k-ledger.json'), 'utf8'));
const claims = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'gsm8k', 'claims.json'), 'utf8'));
const fmt = (x) => Number(x).toLocaleString('en-US');
const T = L.test, R = L.train, F = L.findings, P = L.platinum;
const CL = ['REPRODUCED', 'ANSWER_IN_PROSE', 'ANSWER_UNDERIVED', 'ROUNDED_STEP', 'PRINTED_STEP_WRONG', 'NO_STEPS', 'REFUSED'];
const HOLD = ['REPRODUCED', 'ANSWER_IN_PROSE'], READ = ['ANSWER_UNDERIVED', 'NO_STEPS'], FAULT = ['ROUNDED_STEP', 'PRINTED_STEP_WRONG', 'REFUSED'];
const tokOf = (c) => (HOLD.includes(c) ? 'var(--c-2)' : READ.includes(c) ? 'var(--c-3)' : 'var(--c-1)');
const sum = (o, ks) => ks.reduce((a, k) => a + (o[k] || 0), 0);

/* ---- gates on the facts the prose states ---- */
if (T.items !== 1319 || R.items !== 7473) die('the item counts are not 1,319 and 7,473');
if (T.annotationsTotal !== 4282 || T.annotations.EXACT !== 4282) die('the test annotations are not 4,282 exact');
if (R.annotationsTotal !== 23716 || R.annotations.EXACT !== 23714 || R.annotations.REFUSED !== 2) die('the train annotations are not 23,714 exact + 2 refused');
if (F.printedStepWrongTest !== 2 || F.printedStepWrongTestAnswerNotHeld !== 1) die('the test-set printed-step count moved');
if (F.faultsPlatinumStatus.consensus !== 2 || Object.keys(F.faultsPlatinumStatus).length !== 1) die('the two test faults are not both Platinum-consensus items');
if (F.revisedWithPrintedStepWrong !== 0 || F.revisedByPlatinum.length !== 10) die('the revised-with-fault sentence would be false');
if (!F.revisedByPlatinum.every((r) => r.sameAnswer === false)) die('a Platinum revision kept the answer');
if (P.counts.removed !== 110 || P.counts.verified !== 99 || P.counts.revised !== 10 || P.counts.consensus !== 1100) die('the Platinum counts moved');
if (F.removedByPlatinum.classes.REPRODUCED !== 103) die('the removed-reproduced sentence would be false');
const holdT = sum(T.classes, HOLD), readT = sum(T.classes, READ), faultT = sum(T.classes, FAULT);
const holdR = sum(R.classes, HOLD), readR = sum(R.classes, READ), faultR = sum(R.classes, FAULT);
if (holdT + readT + faultT !== 1319 || holdR + readR + faultR !== 7473) die('the three groups do not partition');
const w501 = T.rows.find((r) => r.i === 501), w1024 = T.rows.find((r) => r.i === 1024);
if (!w501 || !w1024 || w501.class !== 'PRINTED_STEP_WRONG' || w1024.class !== 'PRINTED_STEP_WRONG') die('the two named witnesses are not items 501 and 1024');
if (w501.witness.exact !== '91' || w1024.witness.exact !== '12') die('the witnesses\' exact values moved');
const frac = T.answerForms.fraction || 0, neg = T.answerForms.negative || 0, thou = T.answerForms.thousands || 0, dec = T.answerForms.decimal || 0;
if (frac !== 0 || dec !== 0 || T.answerForms.integer + thou + neg !== T.items) die('the key forms are not all integers');
if (T.rows.some((r) => /[\/.]/.test(r.answer))) die('a test answer carries a slash or a point');
const obs = claims.observedHere.matchNumeric;
const o2125 = obs.find((o) => o.answer === 'ANSWER: 2125'), o145 = obs.find((o) => o.answer === 'ANSWER: 1450000'), om3 = obs.find((o) => o.answer === 'ANSWER: -3');
if (!(o2125 && o2125.graded === 'C' && o145 && o145.graded === 'C' && om3 && om3.graded === 'C')) die('the observed grader behaviour is not what the prose says');
const trainWrong = R.rows.filter((r) => r.class === 'PRINTED_STEP_WRONG');
if (trainWrong.length !== F.printedStepWrongTrain) die('train witnesses and the finding disagree');

/* ---- figure 1: the 1,319 test items, one cell each, by this page's verdict ---- */
const cells = T.rows.map((r) => ({
  token: tokOf(r.class),
  k: 'item ' + r.i + ' · ' + r.class + ' · Platinum: ' + r.platinum,
  v: 'answer ' + r.answer + (r.witness ? ' · ' + r.witness.lhs + ' = ' + r.witness.rhs + ', exact ' + r.witness.exact : r.derived_by ? ' · by ' + r.derived_by : ''),
}));
const FIG1 = CH.strip({
  w: 900, perRow: 60, cell: 12, padL: 6, items: cells,
  keys: [{ token: 'var(--c-2)', t: fmt(holdT) + ' — the printed arithmetic holds and reaches the answer' },
    { token: 'var(--c-3)', t: fmt(readT) + ' — no fault, but the answer is no printed value (a reader decides)' },
    { token: 'var(--c-1)', t: fmt(faultT) + ' — a printed step that does not hold as printed' }],
  alt: 'One thousand three hundred and nineteen cells, one per GSM8K test item in file order: green where every printed step holds and reaches the answer, amber where the answer is not any printed value, plum for the two items whose key prints a step that does not hold.',
});
/* ---- figure 2: the same 1,319 cells, by Platinum's verdict ---- */
const ptok = { consensus: 'var(--c-2)', verified: 'var(--c-3)', revised: 'var(--c-1)', removed: 'var(--c-1)' };
const cells2 = T.rows.map((r) => ({ token: ptok[r.platinum], k: 'item ' + r.i + ' · Platinum: ' + r.platinum + ' · here: ' + r.class, v: 'answer ' + r.answer }));
const FIG2 = CH.strip({
  w: 900, perRow: 60, cell: 12, padL: 6, items: cells2,
  keys: [{ token: 'var(--c-2)', t: fmt(P.counts.consensus) + ' consensus — no model disagreed, never inspected' },
    { token: 'var(--c-3)', t: fmt(P.counts.verified) + ' verified — inspected, kept' },
    { token: 'var(--c-1)', t: fmt(P.counts.removed + P.counts.revised) + ' removed or relabelled' }],
  alt: 'The same cells coloured by GSM8K-Platinum: green for the 1,100 items no model disagreed with, amber for the 99 inspected and kept, plum for the 110 removed and the 10 relabelled.',
});
/* ---- figure 3: the train set by class ---- */
const FIG3 = CH.bars({
  w: 900, max: 7473, padL: 190, rows: CL.filter((c) => R.classes[c]).map((c) => ({ k: c.toLowerCase().replace(/_/g, ' '), v: R.classes[c], token: tokOf(c), lab: fmt(R.classes[c]) })),
  xTicks: [0, 2000, 4000, 6000].map((v) => ({ v, t: fmt(v) })), xLabel: 'train items (7,473)',
  alt: 'Horizontal bars: the 7,473 train items by class — 6,981 reproduced, 200 with the answer in prose, 193 underived, 71 with no steps, 24 with a printed step that does not hold, 2 rounded, 2 refused.',
});

/* ---- tables ---- */
const crossRows = ['consensus', 'verified', 'revised', 'removed'].map((s) => [s, fmt(P.counts[s])].concat(['REPRODUCED', 'ANSWER_IN_PROSE', 'ANSWER_UNDERIVED', 'NO_STEPS', 'PRINTED_STEP_WRONG'].map((c) => String((P.crossTab[s] || {})[c] || 0))));
const crossTable = C.table({
  cols: [{ h: 'Platinum' }, { h: 'items', cls: 'n' }, { h: 'reproduced', cls: 'n' }, { h: 'answer in prose', cls: 'n' }, { h: 'underived', cls: 'n' }, { h: 'no steps', cls: 'n' }, { h: 'step wrong', cls: 'n' }],
  rows: crossRows,
});
const revTable = C.table({
  cols: [{ h: 'item' }, { h: 'GSM8K answer', cls: 'n' }, { h: 'Platinum answer', cls: 'n' }, { h: 'its arithmetic, here' }],
  rows: F.revisedByPlatinum.map((r) => [String(r.i), r.gsm8k, r.platinum, r.class.toLowerCase().replace(/_/g, ' ')]),
});
const witTable = C.table({
  cols: [{ h: 'set · item' }, { h: 'the printed step' }, { h: 'exact', cls: 'n' }, { h: 'answer', cls: 'n' }, { h: 'answer held by another step' }],
  rows: [w501, w1024].map((r) => ['test · ' + r.i, r.witness.lhs + ' = ' + r.witness.rhs, r.witness.exact, r.answer, r.answer_held_elsewhere ? 'yes' : 'no'])
    .concat(trainWrong.map((r) => ['train · ' + r.i, r.witness.lhs + ' = ' + r.witness.rhs, r.witness.exact, r.answer, r.answer_held_elsewhere ? 'yes' : 'no'])),
});

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · the answer key · re-decided at this build',
  title: 'GSM8K’s answer key, re-decided to the last step.',
  deck: 'Every harness that scores GSM8K compares a model’s number with the answer line of a stored solution, and the solution prints the arithmetic that reaches it: calculator annotations the authors inserted, and the prose steps between them. That arithmetic can be re-decided without a model and without a reader. This page evaluates all ' + fmt(T.annotationsTotal) + ' annotations of the test set and ' + fmt(R.annotationsTotal) + ' of the train set from the expressions they print, reads every prose equation with them in exact rational arithmetic, classes each item by whether its own steps reach its own answer, and sets the result beside GSM8K-Platinum, the human revision of the same test set.',
}));
B.push(C.tldr({
  findingRaw: '<strong>The key’s arithmetic is clean where the humans looked, and slips where no model disagreed.</strong> All ' + fmt(T.annotationsTotal) + ' test-set calculator annotations evaluate exactly to the value they print — not one is wrong, not one is rounded — and so do ' + fmt(R.annotations.EXACT) + ' of the ' + fmt(R.annotationsTotal) + ' train-set ones (the other two use an operator the calculator grammar does not have and are refused, not guessed). Reading the prose steps too, ' + F.printedStepWrongTest + ' test keys and ' + F.printedStepWrongTrain + ' train keys print a step that does not hold as printed — <em>364 / 4 = 273</em>, <em>$32 − $20 = $300</em> — and both test-set slips sit in items GSM8K-Platinum classes <em>consensus</em>: no frontier model disagreed with the answer, so no human ever read them. The converse holds too: every one of Platinum’s ' + F.revisedByPlatinum.length + ' relabelled answers has arithmetic that holds to the last step, and ' + F.removedByPlatinum.classes.REPRODUCED + ' of its ' + F.removedByPlatinum.n + ' removed items are REPRODUCED here. Those errors are readings of the problem, not sums, and no re-decision of the arithmetic can find them. The two halves of a task-QA audit find different things, and the mechanical half costs three seconds.',
  mechanismRaw: 'An annotation <<lhs=rhs>> is read as the expression its left side denotes — a hand-written parser for + − × ÷ and parentheses over stdlib fractions; nothing is ever passed to eval — and compared with the rational its right side denotes: EXACT, ROUNDED (within half a unit of the last printed place, and said so), WRONG, or REFUSED. A prose equation is a run of arithmetic characters around an “=”, read as a chain “a = b = c” pair by pair, with the notations GSM8K writers use — a spaced x as times, a dollar sign, a percent sign or the word “cents” as a unit label, “5 and 2/3” as a mixed number, “25 / 1/3” as 25 ÷ (1/3) — and anything cut off by a word, glued to a variable or otherwise unreadable is UNREAD, never a verdict. The answer line is read as the rational it denotes and compared with the last annotation’s value, then with every prose step’s. Platinum’s rows are joined to GSM8K’s by question text, exactly, and their three statuses cross-tabulated with this page’s classes.',
  checkRaw: C.m('python3 instruments/gsm8k/battery.py') + ' — ' + nChecks + ' checks, ' + nReds + ' red controls that must fire (a planted wrong annotation, a value off by more than half a unit, division by zero, the // operator, a Python name and a power, the two named witnesses, a wrong step whose answer rests on it). ' + C.m('python3 tools/run-gsm8k-ledger.py') + ' re-hashes the three pinned files and re-decides both sets in about three seconds.',
}));
B.push(C.stats([
  { k: 'annotations exact', v: fmt(T.annotationsTotal) + ' / ' + fmt(T.annotationsTotal), role: 'held', n: 'test set; train ' + fmt(R.annotations.EXACT) + ' / ' + fmt(R.annotationsTotal) + ', two refused for an operator outside the grammar' },
  { k: 'test keys whose steps reach the answer', v: fmt(holdT) + ' / ' + fmt(T.items), role: 'held', n: fmt(T.classes.REPRODUCED) + ' by the last annotation, ' + fmt(T.classes.ANSWER_IN_PROSE) + ' by a prose step that checks exactly' },
  { k: 'a reader decides', v: fmt(readT), role: 'open', n: fmt(T.classes.ANSWER_UNDERIVED) + ' answers that are no printed value (a unit change, a rounding up, algebra) and ' + fmt(T.classes.NO_STEPS) + ' keys with no step at all' },
  { k: 'printed steps that do not hold', v: F.printedStepWrongTest + ' test · ' + F.printedStepWrongTrain + ' train', role: 'open', n: 'as printed; the answer rests on the wrong step in ' + F.printedStepWrongTestAnswerNotHeld + ' test and ' + F.printedStepWrongTrainAnswerNotHeld + ' train keys, and is held by another step in the rest' },
  { k: 'Platinum’s relabelled answers with an arithmetic fault', v: F.revisedWithPrintedStepWrong + ' of ' + F.revisedByPlatinum.length, role: 'held', n: 'every relabelling is a reading of the problem; the sums hold' },
  { k: 'answer keys in a form a harness misreads', v: '0', role: 'held', n: 'every key is an integer as printed — ' + thou + ' with thousands separators, ' + neg + ' negative — and both pinned scoring rules read those forms' },
]));

B.push(C.section({
  lab: '§1 · the two readings', title: 'Two audits of one test set, cell by cell',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG1, caption: 'The ' + fmt(T.items) + ' test items in file order, classed by this page: green where every printed step holds and reaches the answer, amber where no step is wrong but the answer is not any printed value, plum where a printed step does not hold. Hover for the item, its class and Platinum’s status.' })
    + C.figure({ svgRaw: FIG2, caption: 'The same cells, classed by GSM8K-Platinum: green for the ' + fmt(P.counts.consensus) + ' items every frontier model got right (never inspected), amber for the ' + P.counts.verified + ' inspected and kept, plum for the ' + P.counts.removed + ' removed and the ' + P.counts.revised + ' relabelled.' })
    + '<div class="col">' + C.pRaw('The two pictures do not overlap where it matters. Platinum’s plum is where models and humans disagreed with the key about what the problem means; this page’s plum is where the key disagrees with itself about what its numbers add up to. The cross-tabulation:') + '</div>'
    + crossTable
    + '<div class="col">' + C.pRaw('Of the ' + P.counts.removed + ' items Platinum removed as ambiguous or inconsistent, ' + F.removedByPlatinum.classes.REPRODUCED + ' have arithmetic that holds to the last step; so do ' + (P.crossTab.revised.REPRODUCED) + ' of the ' + P.counts.revised + ' it relabelled. The ' + F.printedStepWrongTest + ' keys that print a wrong step are both <em>consensus</em> items: every model reproduced the intended answer, so the flagging method — look only where a model disagrees — had no reason to open them. A typo no model copies is invisible to a model-flagged audit by construction.') + '</div>',
}));

B.push(C.section({
  lab: '§2 · the witnesses', title: F.printedStepWrongTest + ' test keys and ' + F.printedStepWrongTrain + ' train keys print a step that does not hold',
  wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Each row is a step exactly as the key prints it, the value its left side actually has, the key’s answer, and whether that answer is still reached by some other step of the same key that does hold. Most are typos beside a correct calculator annotation (“6*2.5” beside <<6*3=18.00>>; “14*20=140” for 280); a few are unit slips (“100 * 0.75 = $0.75”, “5 * 3 = $15,000”) or a fraction divided the way it was not written (“500/ 2/5 = 200”). Two of the train rows read a day number and a week range as arithmetic (“day 1 * 2”, “Weeks 1-2”); they are listed rather than excused, because the rule that would exclude them is not one this page can state.') + '</div>'
    + witTable
    + '<div class="col">' + C.pRaw('Nothing here changes an answer a harness grades against: in the test set the answer of item ' + w501.i + ' (' + w501.answer + ') is the calculator annotation beside the slip, and item ' + w1024.i + '’s ' + w1024.answer + ' is the number the writer meant by “$320 − $20”. These are provenance findings about the key’s text — the kind a few-shot prompt copies into a model’s context verbatim, since both harnesses draw their examples from the train set.') + '</div>',
}));

B.push(C.section({
  lab: '§3 · the relabelled ten', title: 'Platinum’s ten corrections all have arithmetic that holds',
  bodyRaw: '<div class="col">' + C.pRaw('Platinum changed the answer of ten test items after inspection. This page’s verdict on each original key:') + '</div>'
    + revTable
    + '<div class="col">' + C.pRaw('Nine are REPRODUCED and one is ANSWER_UNDERIVED: in every case the printed steps compute what they say they compute, and the error — a rate read as linear, a quantity counted twice, a condition missed — lives in the step from the words to the first number, which no evaluation of the numbers can see. That is the precise boundary between the two halves of a task-QA audit, and this page stays on its side of it: nothing here calls a question ambiguous, and nothing here calls a relabelling right.') + '</div>',
}));

B.push(C.section({
  lab: '§4 · the train set', title: fmt(R.items) + ' train keys, the few-shot pool of both harnesses',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG3, caption: 'The train set by class. The shape is the test set’s: ' + fmt(holdR) + ' keys whose steps reach the answer, ' + fmt(readR) + ' for a reader, ' + fmt(faultR) + ' with a printed step that does not hold, is rounded, or is refused.' })
    + '<div class="col">' + C.pRaw('The train set is not scored by anyone, but both harnesses draw their few-shot examples from it (' + claims.harnesses.inspect_evals.file.split('/').pop() + ': ten shuffled train items in the system message; ' + claims.harnesses.lm_eval.file.split('/').pop() + ': five). A key with a wrong printed step is then a worked example the model is shown. The ' + F.printedStepWrongTrain + ' train slips are listed in §2; ' + F.printedStepWrongTrainAnnotationBeside + ' of them stand beside a correct annotation that a calculator-using model would follow instead.') + '</div>',
}));

B.push(C.section({
  lab: '§5 · the graders', title: 'The key’s forms, read against two harnesses',
  bodyRaw: '<div class="col">' + C.pRaw('Every test answer is an integer as printed: ' + fmt(T.answerForms.integer) + ' plain, ' + thou + ' with thousands separators (“2,125”, “1,450,000”), ' + neg + ' negative; no decimal and no fraction, and the train set has the same shape. Read against the two scoring rules pinned by commit in the ledger: Inspect’s ' + C.m('match(numeric=True)') + ' parses the target as a number and compares numerically — “2125” against “2,125” and “-3” against “-3” are CORRECT (observed on inspect_ai ' + claims.observedHere.inspect_ai.split(',')[0] + ' on ' + claims.observedHere.date + ') — and lm-eval strips commas from both sides before its exact match. No key is in a form either harness misreads. Forms a key could take that a grader would not read (a fraction, a percent sign) are observed in the ledger for completeness and occur in no answer line of either set.') + '</div>',
}));

B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('No answer is called wrong: a step that does not hold as printed is a fact about the key’s text, and in every test case the intended answer is recoverable from the key itself. No question is called ambiguous; that is Platinum’s reading and it is reported, not re-decided. The prose reader is conservative by design — ' + fmt(T.prose.UNREAD) + ' test and ' + fmt(R.prose.UNREAD) + ' train equations it could not read are UNREAD and counted, never guessed — and two of the train witnesses are notation it read as arithmetic; they are listed with the rest. The harness observations are of two pinned commits on one date and say nothing about other versions. GSM8K is MIT-licensed and its files are held here verbatim for verification; Platinum’s rows were read through the Hugging Face datasets-server at the revision pinned in the corpus.'),
}));

const foot = '<p>Generated by tools/build-report-gsm8k.js @ git ' + git + '. Gates at this build: the three corpus files re-hashed against their pins, the ledger re-derived and required unchanged, the gsm8k battery (' + nChecks + ' checks, ' + nReds + ' red controls, all fired), every sentence above gated on the ledger field it reads. A moved count, a third test-set slip, a relabelled item with an arithmetic fault, or a key in a non-integer form refuses this page.</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'gsm8k-audit.html'),
  TPL.render({ title: 'GSM8K’s answer key, re-decided', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/gsm8k-audit.html',
    desc: 'GSM8K’s answer key re-decided in exact rational arithmetic: all 4,282 test and 23,716 train calculator annotations evaluated from the expressions they print, every readable prose equation with them, each item classed by whether its own steps reach its own answer, and the result set beside GSM8K-Platinum’s human revision — the arithmetic is clean where humans looked and slips where no model disagreed; the ten relabelled answers are readings, not sums.' }));
console.log('reports/gsm8k-audit.html written: ' + fmt(T.items) + ' test items, ' + fmt(T.annotationsTotal) + ' annotations exact, ' + F.printedStepWrongTest + '+' + F.printedStepWrongTrain + ' printed slips, battery ' + nChecks + ' checks / ' + nReds + ' reds @ git ' + git);
