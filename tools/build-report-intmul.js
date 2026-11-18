#!/usr/bin/env node
/* build-report-intmul.js — reports/intmul.html: two Lean proofs that integers multiply below n log n on a Turing machine
   (Cui, Liu, Woodruff, lockqueue/intmul; Brown, Daniel, platypii/integer-mult-bounds-lean), replayed here from source
   under questions written before the run (corpus/intmul/preregistration.json).

   THE MATHEMATICS IS NOT OURS. What stays open comes first. Every number, verdict word, date and name on the page is
   read from certs/intmul-audit.json, which is re-checked before a word is written (tools/record-intmul.js --check), and
   the build refuses when the record stops saying what a sentence of the page states.

   A DRAFT until the operator says otherwise: the page is wired into no index, no sitemap and no control build, and it
   has no share card yet.

   usage: node tools/build-report-intmul.js                                                                         MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const die = (msg) => { console.error('INTMUL PAGE REFUSED: ' + msg); process.exit(1); };
const need = (ok, msg) => { if (!ok) die(msg); };
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const REC = 'certs/intmul-audit.json';
const day = (iso) => { const d = new Date(iso.slice(0, 10) + 'T00:00:00Z'); return d.getUTCDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
/* text read from the record is typed with straight apostrophes; the page sets them as the rest of the site does */
const T = (s) => String(s).replace(/'/g, '’').replace(/"([^"]*)"/g, '“$1”');
const hm = (s) => Math.floor(s / 3600) + ' h ' + Math.round(s % 3600 / 60) + ' min';

/* the record re-derived from the facts first */
try { const out = cp.execFileSync('node', ['tools/record-intmul.js', '--check'], { cwd: ROOT, encoding: 'utf8' }); need(/^PASS/.test(out), 'the record did not pass its check: ' + out.trim()); }
catch (e) { die('tools/record-intmul.js --check refused: ' + (e.stdout || '') + (e.stderr || '')); }
const R = JSON.parse(fs.readFileSync(path.join(ROOT, REC), 'utf8'));
const g = R.Q1['google-cmu'], c = R.Q1.community, Q2 = R.Q2, Q3 = R.Q3, Q4 = R.Q4, Q5 = R.Q5, Q6 = R.Q6;
const PG = R.pins['google-cmu'], PC = R.pins.community;

/* ---- the words this page states, each read back from the record ---- */
need(g.word === 'CERTIFIED' && /amendment A1/.test(g.wordNote), 'the Google/CMU word is no longer CERTIFIED under amendment A1');
need(c.word === 'REFUSED' && /^resources/.test(c.reason), 'the community word is no longer REFUSED on resources');
need(Q3.word === 'PROVED IN LEAN, ONE KERNEL' && Q2.word === 'READING', 'the words for the reading or the joining theorem moved');
const STD = ['propext', 'Quot.sound', 'Classical.choice'];
const std = (x) => [...x].sort().join() === [...STD].sort().join();
need(std(g.axioms) && std(c.holds.axioms) && std(Q3.axioms), 'an axiom outside the three');
need(g.freshReplay.exit === 0 && g.comparator.run.exit === 0 && g.nanoda.word === 'ACCEPTS' && g.conLeche.word === 'ACCEPTS' && g.acceptedBy.length === 3, 'the three checkers no longer all accept the Google/CMU proof');
need(g.lean4lean.fresh.exit === 1 && /^NO VERDICT/.test(g.lean4lean.fresh.word) && c.lean4lean.word === 'NOT RUN', 'the lean4lean facts moved');
const gc = Q4['google-cmu'], cc = Q4.community, nine = Q4.comparatorControls['google-cmu'];
need(gc.planted === 15 && gc.noVerdict.length === 5 && gc.gotAVerdict === 10 && gc.asPredicted === 9 && gc.noPrediction.length === 2, 'the Google/CMU planted statements moved');
need(cc.planted === 13 && cc.noVerdict.length === 0 && cc.asPredicted === 12 && cc.noPrediction.length === 1, 'the community planted statements moved');
need(nine.length === 9 && nine.every((x) => x.asTheReleaseReports) && nine.filter((x) => x.outcome === 'accepted').length === 1, 'the nine controls moved');
const DEF = g.plantedDefects.concat(c.holds.plantedDefects);
need(DEF.length === 6 && DEF.every((d) => d.caught), 'a planted defect was not caught');
const SC = Q4.structuralComparison;
need(SC['google-cmu'].changedAllDifferent === '11 of 11' && SC.community.changedAllDifferent === '9 of 9', 'the structural comparison moved');
need(c.secondKernel.second.exit === 137 && c.freshReplay.exit === 137 && /^NO VERDICT/.test(c.comparatorPositive.word), 'the community stops moved');
need(Q5.c.rows === Q5.c.exact && Q5.python.rows === Q5.python.exactAgainstPythonIntegers, 'a program row is not exact');
need(R.cost.deletedConfirmed === true && R.gaps.length === 8, 'the cost or the list of gaps moved');
const CL = c.conLeche.word;   /* ACCEPTS | STOPPED | DOES NOT ACCEPT */
need(['ACCEPTS', 'STOPPED', 'DOES NOT ACCEPT'].includes(CL), 'con-leche on the community proof has no word');
need(CL !== 'STOPPED' || (c.conLeche.readingsBeforeTheGrowth > 30 && c.conLeche.highestBeforeTheGrowthGiB < 10 && c.conLeche.lastReadingGiB > 100), 'con-leche’s memory readings on the community proof moved');
const kernelsThatFinishedOnCommunity = CL === 'ACCEPTS' ? 1 : 0;
const RAN = day(c.freshReplay.start);
const tag = (v) => C.tag(v);

/* ---- the figure: the memory of the three stopped checkers in their last hour. Readings, so every line wears the
   COMPUTED standing; the machine's limit is a plain rule. Drawn twice, wide and for a phone. ---- */
const MC = R.memoryCurves;
need(MC.series.length === 3 && MC.series.map((x) => x.id).join() === 'nanoda,lean,con-leche' && MC.limitGiB > 119 && MC.limitGiB < 120, 'the memory curves moved');
need(MC.series.every((x) => x.points[0][0] <= -50 && x.points[0][1] < 12 && x.lastGiB > 100 && x.lastGiB < MC.limitGiB), 'a memory curve no longer starts quiet an hour before its stop and ends between 100 GiB and the limit');
const ran = (x) => x.minutesRunning >= 120 ? Math.floor(x.minutesRunning / 60) + ' h ' + (x.minutesRunning % 60) + ' min' : x.minutesRunning + ' min';
const SERIES = (short) => MC.series.map((x) => ({ name: short ? { nanoda: 'nanoda', lean: 'Lean’s kernel', 'con-leche': 'con-leche' }[x.id] + ', ' + ran(x) + ' in' : T(x.name) + ': stopped ' + ran(x) + ' after its start', pts: x.points, standing: W.COMPUTED }));
const FALT = 'Three lines of memory against time, over the hour before each checker was stopped. Each stays near the bottom of the chart, under 12 GiB, for most of the hour, then climbs almost straight up: nanoda to ' + MC.series[0].lastGiB + ' GiB, Lean’s kernel to ' + MC.series[1].lastGiB + ' GiB, con-leche to ' + MC.series[2].lastGiB + ' GiB. A horizontal rule marks the machine’s limit, ' + MC.limitGiB + ' GiB.';
const fig = (w, h, short) => CH.lines({ w, h, x0: -60, x1: 0, y0: 0, y1: 128, hover: false, padR: short ? 30 : 22, padL: short ? 46 : 62,
  yTicks: [0, 25, 50, 75, 100].map((v) => ({ v, t: String(v) })), xTicks: (short ? [-60, -30, 0] : [-60, -45, -30, -15, 0]).map((v) => ({ v, t: String(-v) })),
  xLabel: short ? 'minutes before the stop' : 'minutes before the checker was stopped', yLabel: 'memory, GiB',
  rules: [{ v: MC.limitGiB, t: (short ? 'limit, ' : 'the machine’s limit, ') + MC.limitGiB + ' GiB' }],
  series: SERIES(short), alt: FALT });

const TITLE = 'Integer multiplication below n log n: two Lean proofs, replayed by a second party';
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the record',
  title: TITLE,
  deck: 'Two groups have published Lean proofs that two n-bit integers can be multiplied in fewer than n log n steps on a Turing machine, a result OpenAI announced in a manuscript: Piaoyang Cui, Yiming Liu and David Woodruff (Google and CMU), and Dan Brown and Kenny Daniel (jdb19937 and platypii on GitHub, a community project). The mathematics and the proofs are theirs. '
    + 'With Claude (Anthropic’s AI model), I rebuilt both from source on a rented machine, under questions written down before the run. The Google/CMU proof is accepted by three independent checkers. The community proof builds and proves its own statement, '
    + (CL === 'ACCEPTS' ? 'but the second checker I had named beforehand ran out of memory on it; a different one accepts it. ' : 'but no second checker finished on it: each ran out of memory. ')
    + 'I also proved, in Lean, that the community proof gives the Google/CMU statement.'
}));
O.push(C.figure({ hero: true, svgRaw: fig(900, 380, false), svgNarrowRaw: fig(360, 420, true), record: [REC, 'corpus/intmul/pod/extra/guard3.txt'],
  caption: 'What stopped the second check of the community proof. Three checkers written independently of each other were given the proof to re-check from nothing. Each ran quietly, then its memory climbed past 100 GiB within minutes and it was stopped just under the machine’s limit. Lean’s kernel had been quiet for more than six hours before the hour shown. One reading a minute; a measurement, drawn dashed because nothing here is an exact decision. Nothing rejected the proof.',
  stop: 'a curve does not start under 12 GiB an hour before its stop, or does not end between 100 GiB and the machine’s limit' }));
O.push(C.stats([
  { k: 'checkers that accept the Google/CMU proof', v: String(g.acceptedBy.length), n: 'Lean’s kernel, nanoda and con-leche, each on the whole proof' },
  { k: 'second checkers that finished on the community proof', v: String(kernelsThatFinishedOnCommunity), n: CL === 'ACCEPTS' ? 'con-leche accepts; nanoda and a fresh Lean replay ran out of memory' : 'nanoda, a fresh Lean replay and con-leche all stopped; nothing rejected it' },
  { k: 'planted wrong proofs caught', v: DEF.filter((d) => d.caught).length + ' of ' + DEF.length, n: 'three in each proof: sorry, an added axiom, native_decide' },
  { k: 'products of the released programs', v: (Q5.c.exact + Q5.python.exactAgainstPythonIntegers) + ' of ' + (Q5.c.rows + Q5.python.rows), n: 'exact against Python’s integers' }
]));
O.push(C.scope('This page checks two releases; it is not new mathematics and it does not rank them. The result is OpenAI’s claim; the proofs are their authors’. The checks are mine, run with Claude (Anthropic’s AI model), which wrote the programs and the Lean files under my direction.'));

O.push(C.section({ lab: 'read this first', title: 'What is still open', id: 'limits', bodyRaw: C.plainList(R.gaps.map((x) => ({ b: T(x.lead), text: T(x.text) }))) }));

/* ---- the claim ---- */
const PUB = R.publicRecord.rows;
O.push(C.section({ lab: 'the claim', title: 'Below n log n, by a factor that grows very slowly', id: 'claim', wide: true, bodyRaw:
  '<div class="col">'
  + C.pRaw(C.esc('Since 2021 the fastest known way to multiply two n-bit integers on a Turing machine has taken about n log n steps (Harvey and van der Hoeven), and many expected that to be the end. The new claim is a bound of n·(log n)^(1 − κ) for a fixed κ > 0: n log n divided by (log n)^κ. The three public numbers for κ are OpenAI’s ' + R.pins.source.match(/kappa = (\S+?)[;,]/)[1] + ', Google/CMU’s ' + PG.kappa + ', and the community’s ' + PC.kappa + '. A larger κ is a stronger theorem.'))
  + C.pRaw(C.esc('Both proofs audited here state the result on Mathlib’s multi-stack Turing machine. A third Lean development, on Prove2Me, uses a model of its own and was not audited.'))
  + '</div>'
  + C.table({ cols: [{ h: 'Release' }, { h: 'Authors' }, { h: 'Saving κ' }, { h: 'Lean' }, { h: 'Verdict here' }], rows: [
    [{ raw: a(PG.repo, 'lockqueue/intmul') + C.esc(' at ') + m(PG.commit.slice(0, 8)) }, PG.who, PG.kappa, PG.lean.replace('leanprover/lean4:v', ''), { raw: tag(g.word) + C.esc(' as amended') }],
    [{ raw: a(PC.repo, 'platypii/integer-mult-bounds-lean') + C.esc(' at ') + m(PC.commit.slice(0, 8)) }, 'Dan Brown (jdb19937), Kenny Daniel (platypii)', PC.kappa, PC.lean.replace('leanprover/lean4:v', ''), { raw: tag(c.word) + C.esc(' on resources') }]
  ] })
  + '<div class="wide"><details class="more"><summary>Dates of the public record</summary><div class="col">'
  + C.pRaw(C.esc('Read from the sources named, by public record only. Private dates are unknown and no priority is decided here.'))
  + C.plainList(PUB.map((r) => ({ b: day(r.date) + '.', text: T(r.who + ': ' + r.what + ' Source: ' + r.source + '.') })))
  + '</div></details></div>'
}));

/* ---- 1 · Google/CMU ---- */
const cmpT = g.comparator.tools;
O.push(C.section({ lab: '1 · the Google/CMU proof', title: 'Accepted by three independent checkers', id: 'gcmu', bodyRaw: C.plainList([
  { b: 'Built from source.', raw: C.esc('The release at its pinned commit, with its own Lean ' + PG.lean.replace('leanprover/lean4:v', '') + ': ' + g.builtFromSource.replace(/^(\d+) jobs, exit 0/, (x, n) => N(n) + ' build steps, no error') + '. The headline theorem ') + m(g.theorem) + C.esc(' has the type ') + m(g.statement) + C.esc(', the proposition of the release’s 80-line statement file, and rests on ') + m(STD.join(', ')) + C.esc(' and nothing else.') },
  { b: 'Lean’s kernel.', text: 'It checked every module of the release as it was built. Afterwards a fresh replay of the whole proof, Mathlib included, also passed (' + g.freshReplay.wall.replace(/^(\d+):(\d+):\d+$/, '$1 h $2 min') + ').' },
  { b: 'nanoda.', text: 'An independent kernel written in Rust: it accepts all ' + N(g.nanoda.declarations) + ' declarations of the exported proof.' },
  { b: 'con-leche.', text: 'A third checker, run in its default mode on the same export: accepted. Its count of declarations (' + N(/accepted (\d+)/.exec(g.conLeche.said)[1]) + ') is not nanoda’s; the two tools count differently and I did not reconcile them.' },
  { b: 'The authors’ own check, repeated.', raw: C.esc('The release ships a configuration for Comparator, the tool that checks a proof against a separately written statement. Run here on another machine, it accepts under both of its kernels. This repeats the authors’ check; it is not a different kind of evidence. Comparator’s first attempt here ended in a stack overflow inside nanoda, with the nanoda build I had made for the intake; the run that counts used the nanoda commit the release names.') },
  { b: 'One checker gave no verdict.', text: 'lean4lean, a kernel written in Lean, stopped at its own recursion limit after ' + g.lean4lean.fresh.wall.replace(/^(\d+):(\d+)\..*$/, '$1 min') + ' on the fresh replay. That is its limit, not a rejection.' },
  { b: 'The word.', raw: tag(g.word) + C.esc(' with one amendment, stated under “planted errors” below: five of my planted statements got no verdict, so the sentence I wrote before the run is met only in an amended reading.') }
]) }));

/* ---- 2 · community ---- */
const sk = c.secondKernel;
O.push(C.section({ lab: '2 · the community proof', title: 'Proves its statement; no second kernel finished', id: 'community', bodyRaw: C.plainList([
  { b: 'What holds.', raw: C.esc('The release at its pinned commit builds from source with its own Lean ' + PC.lean.replace('leanprover/lean4:v', '') + ': ' + c.holds.builtFromSource.replace(/^(\d+) jobs, exit 0, \d+ s.*/, (x, n) => N(n) + ' build steps, no error') + ', so Lean’s kernel accepted every module. The theorem ') + m(c.theorem) + C.esc(' proves ') + m(c.statement) + C.esc(' on the three standard axioms. All ' + cc.planted + ' of my planted statements came out as predicted, and the three planted wrong proofs were caught.') },
  { b: 'What did not finish: nanoda.', text: 'The second kernel I had named before the run was stopped on memory twice. The first time the run’s own watchdog stopped it, ' + Math.round((Date.parse('2026-11-18T' + sk.first.stopped.slice(0, 8) + 'Z') - Date.parse(sk.first.started)) / 60000) + ' minutes in, while a tool build of mine shared the machine: how much of that memory was mine cannot be separated from the log. I ran the same step again by hand, from the same binary, configuration and export. It stayed small for about 70 minutes, then passed 100 GiB within ten, and was stopped at ' + (/stopped at ([\d.]+) GB/.exec(sk.second.stopped) || [])[1] + ' GiB.' },
  { b: 'What did not finish: Lean’s own kernel, afresh.', text: 'A fresh replay of the whole proof by Lean’s kernel stayed under 12 GiB for hours, then grew to ' + c.freshReplay.residentGiBWhenStopped + ' GiB in under half an hour; I stopped it after ' + hm(c.freshReplay.elapsedSeconds) + '. The machine’s limit was 119 GiB.' },
  CL === 'ACCEPTS'
    ? { b: 'A third checker accepts.', text: 'con-leche, run on the same export, accepts it (' + c.conLeche.said.replace(/^con-leche: /, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '). It was not the kernel named before the run, and it was added after the result, so it does not change the word; it is the only second opinion on this proof that finished here.' }
    : { b: 'What did not finish: con-leche.', text: 'A third checker, run on the same export as the last optional step, this time alone on the machine. It stayed under 10 GiB for ' + c.conLeche.readingsBeforeTheGrowth + ' minutes, then grew by more than 10 GiB a minute, and my guard stopped it at ' + c.conLeche.lastReadingGiB + ' GiB. It printed nothing.' },
  { b: 'Comparator.', text: 'The release ships no statement file for Comparator, so I wrote one. With the saving raised by one unit in its numerator, Comparator refuses: the statements do not match. On the true statement it gave no verdict: it was still running after five hours when my memory guard stopped it, and I did not run it again.' },
  { b: 'The same pattern in three checkers.', text: 'Memory grew without bound after a long quiet stretch in every run whose input contains this proof: nanoda on the proof, nanoda on the joined theorem below, Lean’s kernel on the fresh replay' + (CL === 'STOPPED' ? ', and con-leche' : '') + '. The three checkers are written independently of each other. During the ordinary build, Lean’s kernel checked the same modules within the same memory. I did not find the cause. One guess, a very large number literal, was tested and not supported.' },
  { b: 'The word.', raw: tag(c.word) + C.esc(' on resources: a check did not give its positive answer, and the reason is memory. Nothing rejected the proof. A machine with more memory, or the cause found, would settle it; I did not rent a larger one.') }
]) }));

/* ---- 3 · the two statements ---- */
O.push(C.section({ lab: '3 · the two statements', title: 'Read twice, then joined by a theorem', id: 'statements', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'Two readings.', text: 'Before the runs, each statement file was read against its paper twice, by readers who did not see each other’s notes (Claude sessions, under my direction). They agree. This is a reading, kept apart from the verdicts.' },
    { b: 'What the readings found.', text: T(Q2.whatBothFound[0]) },
    { b: 'The differences between the two.', text: 'The input is written differently (a separator symbol against tagged halves), the bound is written differently (an inequality in whole numbers against big-O over the reals), the Google/CMU statement asks every stack alphabet to be finite and the community statement does not, and the savings differ.' },
    { b: 'The encodings, on small pairs.', text: 'Each release’s encoder was evaluated in Lean against an encoder of mine on ' + /^(\d+)/.exec(Q2.encodingsOnSmallPairs.gcmu)[1] + ' pairs of numbers: all agree.' },
    { b: 'The joining theorem.', raw: m(Q3.theorem) + C.esc(T('. ' + Q3.says) + ' It rests on the three standard axioms and was accepted by one kernel, Lean’s; nanoda on its export was stopped on memory, like the proof it imports. Under the words fixed before the run that is not CERTIFIED, which asks for two kernels.') },
    { b: 'Finite alphabets.', raw: C.esc('To supply the clause the community statement lacks, one module rebuilds the community machine along the community’s own lemmas and carries the finiteness through. That an unreachable part of an alphabet cannot matter was already shown for this statement by ') + m('ywz65') + C.esc(' on ' + day('2026-10-15') + ', with a kernel-checked lemma on definitions extracted from Mathlib; the module here is inside a real Mathlib import and specific to this machine.') }
  ]) + '</div>'
  + '<div class="wide"><details class="more"><summary>What the joining theorem does not say</summary><div class="col">' + C.plainList(Q3.limits.map((t) => ({ text: T(t) }))) + '</div></details></div>'
  + '<div class="wide"><details class="more"><summary>Its four parts</summary><div class="col">' + C.plainList(Q3.parts.map((p) => ({ raw: m(p.name) + C.esc(T(': ' + p.says + '.')) }))) + '</div></details></div>'
}));

/* ---- 4 · planted errors ---- */
const outcomeWord = (r) => /^REFUSED/.test(r.outcome) ? 'refused' : r.outcome === 'ACCEPTED' ? 'accepted' : 'no verdict';
O.push(C.section({ lab: '4 · planted errors', title: 'What would have caught a wrong result', id: 'planted', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'Planted statements.', text: 'For each proof I wrote variants of its statement before the run, some reworded and some changed, each with a prediction: the proof must still prove a rewording and must fail to prove a change.' },
    { b: 'Google/CMU: ' + gc.gotAVerdict + ' of ' + gc.planted + ' got a verdict.', text: 'All ' + gc.gotAVerdict + ' came out as predicted or, where I had made no prediction, were refused. The other ' + gc.noVerdict.length + ' got no verdict: my check tried to unfold the 2^46 power and ran into Lean’s recursion limit. They include every variant that changes the saving, so as run, this check did not show that it tells κ = 2^-46 from κ = 2^-45.' },
    { b: 'The amendment.', text: 'Before the run I wrote that every prediction would be met among the statements that reached the check. Those ' + gc.noVerdict.length + ' reached it and got no verdict, so that sentence is not met as written. I now read it as “among the statements that got a verdict”, and I say so here and in the record.' },
    { b: 'Two checks added afterwards.', text: 'First, every planted statement of both proofs was compared with its statement as an expression, with nothing unfolded: all ' + (11 + 9) + ' changed statements differ. Second, Comparator on the release’s own nine controls: its exponent-45 control is refused because the statement does not match.' },
    { b: 'Community: ' + cc.gotAVerdict + ' of ' + cc.planted + ' got a verdict.', text: 'All as predicted, the variants of the saving included.' },
    { b: 'Planted wrong proofs.', text: 'In each release’s theorem file: the proof replaced by sorry, the theorem proved by an added axiom, and one step decided by native_decide. All ' + DEF.length + ' are caught by the list of axioms. One of them, the added axiom, was also exported and shown to nanoda, which fails on it.' }
  ]) + '</div>'
  + '<div class="wide"><details class="more"><summary>The ' + gc.planted + ' statements planted against the Google/CMU proof</summary>'
  + C.table({ cols: [{ h: '' }, { h: 'Change' }, { h: 'Predicted' }, { h: 'Outcome' }], rows: gc.rows.map((r) => [r.id, r.change, r.predicted === 'none' ? 'none' : /^REFUSED/.test(r.predicted) ? 'refused' : 'accepted', outcomeWord(r)]) })
  + '</details></div>'
  + '<div class="wide"><details class="more"><summary>The ' + cc.planted + ' statements planted against the community proof</summary>'
  + C.table({ cols: [{ h: '' }, { h: 'Change' }, { h: 'Predicted' }, { h: 'Outcome' }], rows: cc.rows.map((r) => [r.id, r.change, r.predicted === 'none' ? 'none' : /^REFUSED/.test(r.predicted) ? 'refused' : 'accepted', outcomeWord(r)]) })
  + '</details></div>'
  + '<div class="wide"><details class="more"><summary>The Google/CMU release’s own nine controls, run here</summary>'
  + C.table({ cols: [{ h: 'Control' }, { h: 'What it changes' }, { h: 'Outcome here' }, { h: 'As the release reports' }], rows: nine.map((x) => [x.id, x.change, x.outcome, x.asTheReleaseReports ? 'yes' : 'NO']) })
  + '</details></div>'
}));

/* ---- 5 · the programs ---- */
O.push(C.section({ lab: '5 · the released programs', title: 'Exact on every input tried, and what they are', id: 'programs', bodyRaw: C.plainList([
  { b: 'The C program.', text: N(Q5.c.rows) + ' products, from ' + N(Q5.c.bits[0]) + ' to ' + N(Q5.c.bits[Q5.c.bits.length - 1]) + ' bits, in both of its modes, zero and one included: every one equals the product computed by Python’s integers. ' + T(Q5.say[0]) },
  { b: 'The Python reference.', text: N(Q5.python.rows) + ' products, each equal to Python’s own, with the library’s counters recorded for each row to show which path ran: ' + Q5.python.ranTheForcedBridge + ' ran the new transform on test parameters, ' + Q5.python.fellBackToThe2DTransform + ' fell back to the two-dimensional transform, and ' + Q5.python.smallInputShortcut + ' returned Python’s own product through the small-input shortcut.' },
  { b: 'What neither shows.', text: T(Q5.say[1].replace(/ The Python rows.*$/, '')) + ' Nothing here measures speed, and no timing is quoted: the rows ran while the machine was building.' }
]) }));

/* ---- 6 · what it buys ---- */
O.push(C.section({ lab: '6 · in plain numbers', title: 'What the theorem buys', id: 'buys', bodyRaw: C.plainList([
  { b: 'Google/CMU.', text: T(Q6.gcmu.says) },
  { b: 'Community.', text: T(Q6.community.says) + ' The saving is ' + Q6.community.kappaAsPowerOfTwo.replace(' (rounded)', '') + ', rounded.' },
  { b: 'The constants.', text: Q6.constants },
  { b: 'So.', text: 'This is a theorem about the shape of a bound at sizes far beyond any computer. Its interest is that n log n is not optimal, not that anything multiplies faster today.' }
]) }));

/* ---- what changed after the plan ---- */
O.push(C.section({ lab: 'departures', title: 'What changed after the questions were written', id: 'amendments', wide: true, bodyRaw:
  '<div class="col">' + C.pRaw(C.esc('The questions, the verdict words and the stop rules were committed before the rented machine existed; their digest reached a public place only after the first result (see A11). Everything that departed from them is listed in ') + rec(R.amendments.file) + C.esc(', ' + R.amendments.count + ' entries. The pre-registration itself was not edited.')) + '</div>'
  + '<div class="wide"><details class="more"><summary>The ' + R.amendments.count + ' amendments</summary><div class="col">'
  + C.plainList(R.amendments.list.map((x) => ({ b: T(x.id + ' · ' + x.about) + '.', text: T(x.text) })))
  + '</div></details></div>'
}));

O.push(C.section({ lab: 'who did what', title: 'Each step is a separate job', id: 'roles', bodyRaw: C.plainList([
  { b: 'The claim.', text: 'OpenAI’s manuscript “Integer multiplication below n log n”. It is not judged here.' },
  { b: 'The proofs.', text: PG.who + ' (Google and CMU); Dan Brown (jdb19937) and Kenny Daniel (platypii), the community repository. The n log n algorithm all of this improves on is Harvey and van der Hoeven’s.' },
  { b: 'The note on finite alphabets.', text: 'ywz65, in the upstream community repository.' },
  { b: 'The checkers.', text: 'Lean, Mathlib, Comparator, nanoda, con-leche, lean4lean and lean4export: their authors.' },
  { b: 'The checks on this page.', text: 'Carlos Toledo, with Claude (Anthropic), which wrote the programs, the planted statements and the Lean files of the joining theorem under my direction. The runs were made on ' + day('2026-11-17') + ' and ' + RAN + ' on one rented machine (16 processors, 128 GB), for US$ ' + R.cost.usd.toFixed(2) + '.' }
]) }));

O.push(C.section({ lab: 'check it yourself', title: 'How to re-read it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'The record.', raw: m('node tools/record-intmul.js --check') + C.esc(' re-derives ') + rec(REC) + C.esc(' from the kept logs and refuses on any difference. It needs no Lean.') },
  { b: 'The two intake records.', raw: rec(g.record) + C.esc(' and ') + rec(c.record) + C.esc(', each decided by ') + m('tools/lean-intake.js') + C.esc(' from the run’s files.') },
  { b: 'The questions and the departures.', raw: rec(R.preregistration.file) + C.esc(' and ') + rec(R.amendments.file) + '.' },
  { b: 'The joining theorem.', raw: rec('corpus/intmul/bridge/assembly') + C.esc(': five Lean files. They compile inside the community release at its pinned commit.') },
  { b: 'To run it again.', raw: C.esc('The scripts that ran on the machine are in ') + rec('corpus/intmul/checks/pod-scripts') + C.esc(' and ') + m('tools/runpod-lean-intake.sh') + C.esc('. The community proof needs more than 119 GiB for a second kernel; that is the open item.') }
]) }));

const foot = '<p>' + C.esc('Generated by tools/build-report-intmul.js from ' + REC + ', re-checked as the page is built. I did this with Claude (Anthropic); Claude wrote the programs under my direction.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'intmul.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/intmul.html',
  desc: 'Two Lean proofs that integers multiply below n log n on a Turing machine, rebuilt from source by a second party: the Google/CMU proof accepted by three independent checkers, the community proof proving its statement with no second kernel finished, and a Lean theorem joining the two statements.' }));
console.log('reports/intmul.html written (DRAFT, unwired) · Google/CMU ' + g.word + ' · community ' + c.word + ' · con-leche on the community proof: ' + CL);
