#!/usr/bin/env node
/* build-report-lean-intake.js — reports/lean-intake.html: the Lean intake (tools/lean-intake.js) and the two claims it has
   decided, Erdős #488 (the pilot, against a hand run's answers) and Erdős #786(i) (a claim it had not seen).

   Every number, statement and verdict word is read from certs/lean-intake-erdos-488.json and certs/lean-intake-erdos-786i.json
   (each re-derived from its run's facts by `tools/lean-intake.js record <id> --check`) and from their pre-registered specs;
   the build refuses when a verdict is not the one this page states. The limits and every amendment come before the results.
   Added 2026-11-12: the identity mode for self-contained files (tools/lean-intake.js, 2026-11-10) and the case it was tested
   on, AlphaProof Nexus's proof of Erdős #12 (ii), read the same way from certs/lean-intake-apn-erdos-12-ii.json and its spec.
   Redrawn 2026-11-09 on the operator's word ("our reports are too dense … the papers should be the dense element"): the
   figures carry the argument, the prose is short, the rigor is unchanged.

   usage: node tools/build-report-lean-intake.js                                                                     MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));   /* the page's own light art card (og-lean-intake.png) */
const die = (m) => { console.error('LEAN INTAKE REPORT REFUSED: ' + m); process.exit(1); };
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');

const IDS = ['erdos-488', 'erdos-786i'];
const R = {}, S = {};
for (const id of IDS) { R[id] = J('certs/lean-intake-' + id + '.json'); S[id] = J('corpus/lean-intake/' + id + '/spec.json'); }
const A = R['erdos-488'], B = R['erdos-786i'];

/* the words this page states, each read back from the records */
for (const id of IDS) {
  const r = R[id];
  if (r.verdict !== 'CERTIFIED') die(id + ' is ' + r.verdict + ', and this page states CERTIFIED');
  for (const k of ['F1', 'F3']) if (r.words[k] !== 'CERTIFIED') die(id + ' ' + k + ' is ' + r.words[k]);
  if (r.words.F1controls.word !== 'CERTIFIED' || r.words.plantedClaims.word !== 'CERTIFIED') die(id + ': a control is not as expected');
  if (!r.kernels.every((k) => k.word === 'ACCEPTS')) die(id + ': a kernel does not accept');
  if ([...r.F1.axioms].sort().join() !== 'Classical.choice,Quot.sound,propext') die(id + ' rests on more than the three standard axioms');
}
if (A.words.F2.word !== 'CERTIFIED' || !A.F2.kernel.confirmed) die('#488 F2 is not certified and kernel-confirmed');
if (!/^REFUSED \(not run\)/.test(B.words.F2.word)) die('#786(i) F2 is not the refusal this page explains');
const F2 = A.F2, F2c = F2.canonical;
if (!A.reproduces || !A.reproduces.rows.every((r) => r.same)) die('the #488 run no longer reaches the hand run\'s verdicts');
if (F2c.implicationDisagreements !== F2c.implicationExplained || F2c.explainedBy.join() !== '0 ∉ A' || F2c.explainedInstances.join() !== 'A = [0]') die('the #488 disagreements are no longer the A = {0} ones this page explains');
const ctl = (r, kind) => { const xs = r.mutants.filter((x) => x.kind === kind); return [xs.filter((x) => x.asExpected).length, xs.length]; };
const sum = (kind) => IDS.reduce((s, id) => [s[0] + ctl(R[id], kind)[0], s[1] + ctl(R[id], kind)[1]], [0, 0]);
const [wOk, wN] = sum('wrong'), [sOk, sN] = sum('same'), [eOk, eN] = sum('equivalent');
const redsOk = IDS.reduce((s, id) => s + R[id].reds.filter((x) => x.caught).length, 0), redsN = IDS.reduce((s, id) => s + R[id].reds.length, 0);
if (wOk !== wN || sOk !== sN || eOk !== eN || redsOk !== redsN) die('a planted statement or defect is not as expected');

/* the clock of the fresh claim: its spec's commit, then the last step of its run */
const specAt = cp.execSync('git log --diff-filter=A --format=%cI -- corpus/lean-intake/erdos-786i/spec.json', { cwd: ROOT }).toString().trim().split('\n').pop();
const status = fs.readFileSync(path.join(ROOT, B.run.facts, '_status.txt'), 'utf8').trim().split('\n');
const endAt = status[status.length - 1].split(' ')[0];
const minutes = Math.round((Date.parse(endAt) - Date.parse(specAt)) / 60000);
if (!(minutes > 0 && minutes < 240)) die('the fresh claim\'s clock reads ' + minutes + ' minutes');
const hhmm = (iso) => new Date(iso).toISOString().slice(11, 16);
const ndec = (B.kernels.find((k) => /^nanoda/.test(k.name)) || {}).name ? (fs.readFileSync(path.join(ROOT, B.run.facts, 'nanoda.log'), 'utf8').match(/Checked (\d+) declarations/) || [])[1] : null;
if (!ndec) die('the nanoda log of #786(i) does not print its declaration count');

/* the two runs of the fresh claim on one clock: the spec's commit, the first run, the fix, the re-run of the planted statements */
const done = status.map((l, i) => [l, i]).filter(([l]) => / done: /.test(l));
if (done.length !== 2) die('the #786(i) status no longer shows the two runs this page draws');
const t0 = Date.parse(specAt), mm = (iso) => (Date.parse(iso) - t0) / 60000, ts = (l) => l.split(' ')[0];
const RUN1 = [ts(status[0]), ts(done[0][0])], RUN2 = [ts(status[done[0][1] + 1]), ts(done[1][0])];
const fixAt = cp.execSync('git log --format=%cI -- corpus/lean-intake/erdos-786i/spec.json', { cwd: ROOT }).toString().trim().split('\n')[0];
if (!(mm(RUN1[0]) >= 0 && mm(RUN1[1]) < mm(fixAt) && mm(fixAt) <= mm(RUN2[0]) + 2 && mm(RUN2[1]) === mm(endAt))) die('the #786(i) clock is out of order');

/* the identity mode for self-contained files (2026-11-10) and the case it was tested on: AlphaProof Nexus's proof of Erdős
   #12 (ii). Every word the two sections state is read here from the record and its spec; the build refuses when either stops
   saying it. */
const P_REC = 'certs/lean-intake-apn-erdos-12-ii.json', P_SPEC = 'corpus/lean-intake/apn-erdos-12-ii/spec.json';
const P = J(P_REC), PS = J(P_SPEC), SC = (P.F1 || {}).selfContained;
const dieP = (msg) => die('#12 (ii): ' + msg);
if (require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ROOT, P_SPEC))).digest('hex') !== P.spec.sha256) dieP('the spec is not the one the record was decided from');
if (P.verdict !== 'CERTIFIED' || P.words.F1 !== 'CERTIFIED' || P.words.F3 !== 'CERTIFIED') dieP('the verdict is ' + P.verdict + ' (F1 ' + P.words.F1 + ', F3 ' + P.words.F3 + '), and this page states CERTIFIED');
if (P.words.F1controls.word !== 'CERTIFIED' || P.words.plantedClaims.word !== 'CERTIFIED') dieP('a control is not as expected');
if (PS.canonical.selfContained !== true || !SC) dieP('the spec no longer asks for the mode for self-contained files');
if (!/^The identity mode for self-contained files .*tested on a recorded case/.test(PS.what) || PS.polarity !== 'proves') dieP('the spec no longer says this is the case the mode was tested on, a proof');
if (!/alphaproof-nexus-results/.test(P.pins.claim.url) || !/google-deepmind\/formal-conjectures/.test(P.pins.canonical.url)) dieP('the pins are not AlphaProof Nexus’s results and DeepMind’s formal-conjectures');
if (SC.copy.added !== 'namespace IntakeCanon' || SC.copy.canonicalSha256 !== P.pins.canonical.sha256) dieP('the copy is no longer the pinned file with the one line this page prints');
if (SC.copyIsCanonical.word !== 'CERTIFIED' || SC.copyIsCanonical.bytes !== true || SC.copyIsCanonical.declarations.length !== 1 || !SC.copyIsCanonical.declarations.every((d) => d.identical === true && d.constants > 0)) dieP('the copy is not shown to be the canonical file');
if (SC.axioms.word !== 'none declared' || SC.conditionalOn.length || P.conditionalOn) dieP('the verdict is conditional on axioms, and this page says it is not');
if ([...P.F1.axioms].sort().join() !== 'Classical.choice,Quot.sound,propext') dieP('the proof rests on more than the three standard axioms');
if (P.F1.report.equal !== false || P.F1.report.defeq !== true) dieP('the two statements no longer differ as written and agree after unfolding');
if (!/^False ↔ ∃ c > 0, /.test(P.F1.claim) || !/Erdos12\.IsGood A/.test(P.F1.claim) || !/IntakeCanon\.Erdos12\.IsGood A/.test(P.F1.canonical) || !/\.ncard < ↑N \^ \(1 - c\)\}\.Infinite$/.test(P.F1.claim)) dieP('the statement is no longer the one this page puts in words');
if (!/^REFUSED \(not run\)/.test(P.words.F2.word) || !/every infinite set/.test(P.words.F2.why) || !/no finite instance decides/.test(P.words.F2.why)) dieP('the small cases are not the refusal this page explains');
const pW = P.mutants.filter((x) => x.kind === 'wrong'), pS = P.mutants.filter((x) => x.kind === 'same');
if (pW.length + pS.length !== P.mutants.length || !pW.length || !pS.length) dieP('a planted statement is neither a wrong one nor a rewording');
if (!pW.every((x) => x.asExpected && x.outcome === 'REFUSED by type mismatch') || !pS.every((x) => x.asExpected && x.outcome === 'ACCEPTED')) dieP('a planted statement is not as expected');
if (P.words.F1controls.wrongRefused !== pW.length + ' of ' + pW.length || P.words.F1controls.sameAccepted !== pS.length + ' of ' + pS.length) dieP('the record counts its planted statements otherwise');
if (P.reds.length !== 2 || !P.reds.every((x) => x.caught) || !P.reds[0].nonstandardAxioms.includes('sorryAx') || !/intakeRedAxiom$/.test(P.reds[1].nonstandardAxioms.join())) dieP('the planted defects are no longer a sorry and an added axiom, both caught');
if (P.kernels.length !== 2 || !P.kernels.every((k) => k.word === 'ACCEPTS') || !/^Lean /.test(P.kernels[0].name) || !/^nanoda /.test(P.kernels[1].name)) dieP('the kernels that accept are no longer Lean and nanoda');
const pTool = (/^leanprover\/lean4:(v[0-9.]+)$/.exec(P.pins.canonical.toolchain) || [])[1];
if (!pTool || P.pins.claim.toolchain !== P.pins.canonical.toolchain) dieP('the two pins are not on one Lean release');
if (P.notRun[0] !== 'leanchecker (the toolchain does not ship it)' || P.notRun.slice(1).join() !== A.notRun.join()) dieP('the checkers not run are no longer leanchecker (not shipped) and the four named at the top');
const pMin = Math.round(P.run.stepSeconds / 60);
if (!(pMin > 0 && pMin < 240) || JSON.stringify(P.run.machine) !== JSON.stringify(B.run.machine)) dieP('the run is no longer ' + pMin + ' minutes on the machine of #786(i)');
const pStatus = fs.readFileSync(path.join(ROOT, P.run.facts, '_status.txt'), 'utf8').trim().split('\n');
const pSpecAt = cp.execSync('git log --diff-filter=A --format=%cI -- ' + P_SPEC, { cwd: ROOT }).toString().trim().split('\n').pop();
if (pStatus.filter((l) => / done: /.test(l)).length !== 1 || !(Date.parse(pSpecAt) < Date.parse(pStatus[0].split(' ')[0]))) dieP('the spec was not committed before the one run');
const pAm = PS.amendments || [];
if (pAm.length !== 1 || P.spec.amendments !== 1 || pAm[0].date !== '2026-11-10' || !/ships no leanchecker/.test(pAm[0].what) || !/made the whole verdict REFUSED/.test(pAm[0].what)
  || !/No planted statement and no expected outcome changed; nothing was re-run/.test(pAm[0].what)) dieP('the spec’s amendment is no longer the leanchecker one this page describes');
/* the same proof, decided in October by Comparator with two kernels (the AlphaProof Nexus report): the same file, by its sha256 */
const APN = J('certs/apn-kernel.json'), apnRow = APN.rows.find((r) => r.item === 'erdos_12.parts.ii');
if (!apnRow || apnRow.word !== 'CERTIFIED' || !/^2026-10-20T/.test(APN.generated) || !apnRow.runs.some((r) => r.kernels.length === 2 && r.sha256.some((x) => x.startsWith(P.pins.claim.sha256 + ' '))))
  dieP('certs/apn-kernel.json no longer records this file CERTIFIED by two kernels on 20 October');

const TITLE = 'Does an AI’s Lean proof prove the right statement? One command to check';
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: TITLE,
  deck: 'A Lean proof can be correct and still prove the wrong thing. Lean’s kernels check the proof; this tool checks the statement, with exact tests instead of a reader’s opinion. '
    + 'Two AI-written refutations of Erdős problems, waiting on Google DeepMind’s list of open problems, went through it.'
}));

/* figure 1 (the hero) — the two questions, drawn wide and, for a phone, stacked; every number read from the records */
const k488 = A.kernels.length, k786 = B.kernels.length;
if (k488 !== 3 || k786 !== 3) die('the drawing says three kernels per claim');
const QS = [
  { k: 'the proof', s: 'the claimant’s Lean, pinned', q: '1 · is the proof correct?', a: ['Lean, leanchecker and nanoda all accept, on both claims', 'only the three standard axioms'] },
  { k: 'the statement', s: 'DeepMind’s, from its declaration', q: '2 · is it the right statement?', a: ['the kernel accepts the proof against it, exactly', wOk + ' of ' + wN + ' wrong statements refused · ' + sOk + ' of ' + sN + ' rewordings accepted', 'on #488, ' + N(F2c.conclusionCompared) + ' small cases agree with Erdős’s sentence'] }
];
const box = (x, y, w, h, fillRaw) => '    <rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + (fillRaw || 'var(--surface)') + '" stroke="var(--ink)" stroke-width="1.6"/>';
const arrow = (x1, y1, x2, y2) => '    <line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--ink-3)" stroke-width="1.6"/>'
  + '    <path d="M' + x2 + ' ' + y2 + ' l' + (x2 > x1 ? '-9 -5 l0 10 z' : '-5 -9 l10 0 z') + '" fill="var(--ink-3)"/>';
const QALT = 'Two rows. The proof goes to question 1, is the proof correct: Lean, leanchecker and nanoda all accept, on both claims, with only the standard axioms. The statement goes to question 2, is it the right statement: the kernel accepts the proof against it exactly, ' + wOk + ' of ' + wN + ' planted wrong statements are refused and ' + sOk + ' of ' + sN + ' rewordings accepted, and on #488 ' + N(F2c.conclusionCompared) + ' small cases agree with Erdős’s sentence.';
const qWide = [C.svgOpen({ w: 900, h: 300, alt: QALT })];
QS.forEach((q, r) => {
  const y = 14 + r * 150, h = r ? 128 : 104;
  qWide.push(box(0, y, 300, 78), C.label({ x: 16, y: y + 30, text: q.k, cls: 't-lab' }), C.label({ x: 16, y: y + 54, text: q.s, cls: 't-ax' }));
  qWide.push(arrow(306, y + 39, 352, y + 39));
  qWide.push(box(358, y, 542, h), C.label({ x: 376, y: y + 30, text: q.q, cls: 't-lab' }));
  q.a.forEach((t, k) => qWide.push(C.label({ x: 376, y: y + 56 + k * 22, text: t, cls: 't-ax' })));
});
qWide.push('    </svg>');
const qNarrow = [C.svgOpen({ w: 360, h: 610, alt: QALT })];
let yy = 4;
QS.forEach((q) => {
  qNarrow.push(box(0, yy, 360, 66), C.label({ x: 14, y: yy + 26, text: q.k, cls: 't-lab' }), C.label({ x: 14, y: yy + 48, text: q.s, cls: 't-ax' }));
  qNarrow.push(arrow(180, yy + 70, 180, yy + 98));
  const lines = [].concat(...q.a.map((t) => C.fitLines ? [t] : [t]));
  const wrap = (t) => { const out = [], ws = t.split(' '); let cur = ''; for (const w of ws) { if ((cur + ' ' + w).trim().length > 44) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; } out.push(cur.trim()); return out; };
  const al = lines.flatMap(wrap), h = 44 + al.length * 21;
  qNarrow.push(box(0, yy + 104, 360, h), C.label({ x: 14, y: yy + 132, text: q.q, cls: 't-lab' }));
  al.forEach((t, k) => qNarrow.push(C.label({ x: 14, y: yy + 156 + k * 21, text: t, cls: 't-ax' })));
  yy += 104 + h + 44;
});
qNarrow.push('    </svg>');
qNarrow[0] = C.svgOpen({ w: 360, h: yy - 40, alt: QALT });
O.push(C.figure({ svgRaw: qWide.join('\n'), svgNarrowRaw: qNarrow.join('\n'), hero: true, record: ['certs/lean-intake-erdos-488.json', 'certs/lean-intake-erdos-786i.json'],
  caption: 'Lean’s kernels answer the first question. The second is the one this tool adds: the same statement, wrong ones refused, and the statement compared with the problem’s own words on small cases.' }));

O.push(C.stats([
  { k: 'claims checked', v: '2', n: 'Erdős #488 and #786(i)' },
  { k: 'planted wrong statements refused', v: wOk + ' of ' + wN, n: 'and ' + sOk + ' of ' + sN + ' rewordings accepted' },
  { k: 'planted defects caught', v: redsOk + ' of ' + redsN, n: 'a false step, a sorry, an axiom, native_decide' },
  { k: 'a fresh claim, rules to record', v: minutes + ' min', n: 'on a laptop' }
]));

O.push(C.scope('The mathematics is the claimants’ (Declan Gessel’s, with OpenAI’s GPT-6 Astra, for both refutations); the statements are Google DeepMind’s. This page checks their proofs against those statements. The tool is mine, built with Claude (Anthropic).'));

O.push(C.section({
  lab: 'read this first', title: 'What it does not decide', id: 'limits',
  bodyRaw: C.plainList([
    { b: 'Whether the formal statement is the problem.', text: 'That stays a reading; the small cases are evidence, not proof.' },
    { b: '“The same” means the same after unfolding definitions.', text: 'Statements equivalent only by an argument are refused (all ' + eN + ' planted ones were).' },
    { b: 'Small cases compare true and false.', text: 'A change that never flips an answer there is invisible to them.' },
    { b: 'Some statements have no small cases.', text: '#786(i) is about densities of infinite sets: refused there, as planned.' },
    { b: 'Four of Lean 4.35’s bundled checkers were not run.', text: 'Both claims are on Lean 4.33.1; ' + A.notRun.join(', ') + ' come later.' }
  ])
}));

/* figure 2 — every planted test, one square each: filled = refused or caught, hollow = accepted */
const PLANT = [
  { k: 'wrong statements', sub: 'must be refused', items: IDS.flatMap((id) => R[id].mutants.filter((x) => x.kind === 'wrong').map((x) => ({ id, x, filled: x.outcome !== 'ACCEPTED' }))) },
  { k: 'the same, reworded', sub: 'must be accepted', items: IDS.flatMap((id) => R[id].mutants.filter((x) => x.kind === 'same').map((x) => ({ id, x, filled: x.outcome !== 'ACCEPTED' }))) },
  { k: 'equivalent by an argument', sub: 'refused: the limit', items: IDS.flatMap((id) => R[id].mutants.filter((x) => x.kind === 'equivalent').map((x) => ({ id, x, filled: x.outcome !== 'ACCEPTED' }))) },
  { k: 'defects in the proofs', sub: 'must be caught', items: IDS.flatMap((id) => R[id].reds.map((x) => ({ id, x: { id: x.id, why: x.why, outcome: x.caught ? 'caught: ' + x.how : 'NOT caught' }, filled: x.caught }))) }
];
const SQ = 22, GAP = 7, LX = 250, RW = 52, PW = 900;
const sq = (it, x, y) => '    <rect x="' + x + '" y="' + y + '" width="' + SQ + '" height="' + SQ + '" rx="4" stroke="var(--ink)" stroke-width="1.6" fill="' + (it.filled ? 'var(--ink)' : 'var(--surface)') + '"><title>'
  + C.esc(((it.id === 'erdos-488' ? '#488 ' : '#786(i) ') + it.x.id + ': ' + it.x.why + ' — ' + it.x.outcome).replace(/`/g, '')) + '</title></rect>';
const plantSvg = [C.svgOpen({ w: PW, h: PLANT.length * RW + 40, alt: 'Four rows of small squares, one per planted test. Wrong statements: ' + wN + ' squares, all filled (refused). The same statement reworded: ' + sN + ' squares, all hollow (accepted). Equivalent only by an argument: ' + eN + ' squares, filled (refused, the stated limit). Defects planted in the proofs: ' + redsN + ' squares, all filled (caught). Within each row, #488 comes first, then a gap, then #786(i).' })];
PLANT.forEach((row, r) => {
  const y = 16 + r * RW;
  plantSvg.push(C.label({ x: 0, y: y + 10, text: row.k, cls: 't-lab' }));
  plantSvg.push(C.label({ x: 0, y: y + 27, text: row.sub, cls: 't-ax' }));
  let x = LX, prev = null;
  for (const it of row.items) { if (prev && prev !== it.id) x += 18; plantSvg.push(sq(it, x, y)); x += SQ + GAP; prev = it.id; }
  const ok = row.items.filter((it) => it.filled === (row.k !== 'the same, reworded')).length;
  plantSvg.push(C.label({ x: x + 10, y: y + 16, text: ok + ' of ' + row.items.length, cls: 't-lab' }));
});
plantSvg.push(C.label({ x: LX, y: PLANT.length * RW + 30, text: 'filled: refused or caught · hollow: accepted · in each row, #488 first, then #786(i)', cls: 't-ax' }));
plantSvg.push('    </svg>');

O.push(C.section({
  lab: 'does the check work?', title: 'Every planted test came out as it should', id: 'planted', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Each run tests the check itself. Wrong versions of the statement are planted (a dropped hypothesis, a changed constant, a shifted interval) and must be refused; rewordings of the same statement must be accepted; broken copies of the proof must be caught. One square per test; hover for what it was.') + '</div>'
    + C.figure({ svgRaw: plantSvg.join('\n'), wide: false, record: ['certs/lean-intake-erdos-488.json', 'certs/lean-intake-erdos-786i.json'], stop: 'a planted statement or defect is not as expected',
      caption: 'The planted tests of both runs. The three filled squares in the third row are the stated limit: statements that are logically the same but differ by more than unfolding a definition are refused.' })
}));

/* figure 3 — #488's 3,024 small cases in one bar */
const CASES = F2.instances, DEF = F2c.conclusionCompared, UND = F2c.undefinedInInformal;
if (DEF + UND !== CASES) die('the #488 cases no longer add up');
const FIG_CASES = CH.segments({
  w: 900, x0: 0, x1: CASES, padL: 200,
  xTicks: [0, 1000, 2000, CASES].map((v) => ({ v, t: N(v) })), xLabel: 'small cases (A ⊆ {0, …, 5}, n below 6, m below 8)',
  rows: [
    { k: 'agree: ' + N(DEF), segs: [{ x0: 0, x1: DEF, token: 'var(--c-1)', k: 'Erdős’s sentence is defined', v: N(DEF) + ' cases: every part of DeepMind’s statement agrees with it' }], marks: [] },
    { k: 'divide by zero: ' + N(UND), segs: [{ x0: DEF, x1: CASES, hatch: true, token: 'var(--c-ctx)', k: 'the sentence divides by zero', v: N(UND) + ' cases (n = 0 or m = 0): not compared' }], marks: [] },
    { k: 'differ: ' + F2c.implicationDisagreements, segs: [{ x0: 0, x1: Math.max(F2c.implicationDisagreements, 12), token: 'var(--ink)', k: 'the whole statements differ', v: F2c.implicationDisagreements + ' cases, all A = {0}' }],
      marks: [{ x: Math.max(F2c.implicationDisagreements, 12) + 30, t: 'all with A = {0}' }] }
  ],
  alt: 'Two bars on a scale of 3,024 small cases. Each part: ' + N(DEF) + ' cases where Erdős’s sentence is defined, all agreeing with DeepMind’s statement, then ' + N(UND) + ' hatched cases where the sentence divides by zero. Whole statements: a thin sliver of ' + F2c.implicationDisagreements + ' cases where they differ, all with A = {0}.'
});

O.push(C.section({
  lab: 'Erdős #488', title: 'DeepMind’s statement against Erdős’s sentence', id: 'erdos-488', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Erdős asked whether, for a finite set A and B the numbers with a divisor in A, ' + m('|B ∩ [1,m]|/m < 2|B ∩ [1,n]|/n') + ' always holds for ' + m('m > n ≥ max(A)') + '. Gessel’s proof refutes DeepMind’s Lean version of it; this run reached the same verdicts as a separate hand-built check of 6 November.')
    + C.pRaw('Then the new check: Lean evaluated DeepMind’s statement part by part on ' + N(CASES) + ' small cases (the kernel confirmed every value), and a program written from Erdős’s sentence alone evaluated the same cases.') + '</div>'
    + C.figure({ svgRaw: FIG_CASES, wide: false, record: ['certs/lean-intake-erdos-488.json', 'instruments/intake/erdos-488.js'], stop: 'the cases stop adding up, or a disagreement is not one with A = {0}',
      caption: 'Every part agrees wherever Erdős’s sentence makes sense. The 20 cases where the whole statements differ all have A = {0}: B is empty there, the sentence reads 0 < 0 and is false as written. DeepMind’s statement adds the hypothesis 0 ∉ A for exactly this (their pull request #256); the check found the reason without being told.' })
}));

/* figure 4 — the fresh claim on one clock */
const hm = (min) => hhmm(new Date(t0 + min * 60000).toISOString());
const FIG_CLOCK = CH.segments({
  w: 900, x0: -2, x1: minutes + 3, padL: 150,
  xTicks: [0, 10, 20, 30, 40, 50].filter((v) => v <= minutes).map((v) => ({ v, t: hm(v) })), xLabel: 'time, UTC (9 November 2026)',
  rows: [
    { k: 'rules', segs: [], marks: [{ x: 0, t: 'spec committed ' + hhmm(specAt) }, { x: mm(fixAt), t: 'tool fixed ' + hhmm(fixAt), anchor: 'end' }] },
    { k: 'runs', segs: [
      { x0: mm(RUN1[0]), x1: mm(RUN1[1]), token: 'var(--c-1)', k: 'the full run', v: hhmm(RUN1[0]) + '–' + hhmm(RUN1[1]) + ' UTC' },
      { x0: mm(RUN2[0]), x1: mm(RUN2[1]), token: 'var(--c-1)', k: 'the planted statements again', v: hhmm(RUN2[0]) + '–' + hhmm(RUN2[1]) + ' UTC' }], marks: [] },
    { k: 'record', segs: [], marks: [{ x: mm(endAt), t: 'recorded ' + hhmm(endAt) + ' · ' + minutes + ' min', anchor: 'end' }] }
  ],
  alt: 'Three rows on one clock. Rules: the spec committed at ' + hhmm(specAt) + ', the tool fixed at ' + hhmm(fixAt) + '. Runs: the full run from ' + hhmm(RUN1[0]) + ' to ' + hhmm(RUN1[1]) + ', the planted statements again from ' + hhmm(RUN2[0]) + ' to ' + hhmm(RUN2[1]) + '. Record: ' + hhmm(endAt) + ', ' + minutes + ' minutes after the spec.'
});

O.push(C.section({
  lab: 'Erdős #786(i)', title: 'A claim the tool had not seen', id: 'erdos-786', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Part (i) asks whether some set of density above 1 − ε has all its equal products of equal length. Gessel’s refutation (' + a('https://github.com/google-deepmind/formal-conjectures/pull/5299', 'pull request #5299') + ', open since 6 September) states its own versions of the two definitions it needs. The kernel accepts it against DeepMind’s declaration as it stands today, so the definitions match.')
    + C.pRaw('It also turned up one thing for the pull request: DeepMind reworded this statement on 14 October, so the change no longer applies and GitHub reports a conflict. The proof still refutes the current statement.') + '</div>'
    + C.figure({ svgRaw: FIG_CLOCK, wide: false, record: ['certs/lean-intake-erdos-786i.json', B.run.facts + '/_status.txt'], stop: 'the clock falls out of order',
      caption: 'From the spec committed to the record, on a laptop. The first run found a defect in the tool (its test files missed one line of DeepMind’s file); it was fixed and the planted statements run again, with no statement or expectation changed.' })
}));

/* the batch (2026-11-10): specs written by claimbox, every row read from its record */
const BATCH = [['erdos-488', 'Erdős #488', 'Declan Gessel', '#5297'], ['erdos-902', 'Erdős #902 · f(2) = 7', 'Matt Stokes', '#7678'], ['erdos-123', 'Erdős #123 · powers 2, 3', 'Matt Stokes', '#7678'],
  ['erdos-652', 'Erdős #652 · first', 'Matt Stokes', '#7678'], ['erdos-669', 'Erdős #669 · k = 2', 'Matt Stokes', '#7678'], ['mo-75792', 'MathOverflow 75792', 'Daniel Puri', '#7660'],
  ['giuga-weak', 'Weak Giuga numbers', 'Daniel Puri', '#7660'], ['giuga-strong', 'Strong Giuga numbers', 'Daniel Puri', '#7660'], ['sqtuples', 's-increasing triples', 'Daniel Puri', '#7660']]
  .map(([id, what, who, pr]) => ({ id, what, who, pr, r: J('certs/lean-intake-' + id + '-claimbox.json') }));
/* the correction of 2026-11-11: a planted statement whose outcome is neither ACCEPTED nor a refusal at the claimant's term never
   reached the check (instruments/intake/SPEC.md, the erratum); the records of the first format counted it as a met prediction */
const reached = (x) => x.outcome === 'ACCEPTED' || x.outcome === 'REFUSED by type mismatch';
const NT = BATCH.flatMap((b) => b.r.mutants.filter((x) => !reached(x)).map((x) => ({ claim: b.what, id: x.id, kind: x.kind, expect: x.expect, counted: x.asExpected })));
if (!NT.length || !NT.every((x) => x.kind === 'type' && x.expect === 'NOT ACCEPTED' && x.counted === true)) throw new Error('build-report-lean-intake: the statements that did not reach the check are no longer the retyped ones the correction describes');
if (IDS.some((id) => R[id].mutants.some((x) => !reached(x)))) throw new Error('build-report-lean-intake: a hand-written planted statement did not reach the check');
const NTclaims = [...new Set(NT.map((x) => x.claim))].length;
const FIXES = [
  { b: '#488: a “wrong” statement was the same.', text: 'Counting from 0 changes nothing, since 0 is never counted; the kernel saw it. My label was wrong (' + A.words.F1controls.asPreregistered + ' as first written).' },
  { b: '#488: the small cases found more than I expected.', text: 'The 20 cases above, all explained.' },
  { b: '#488: one planted statement was invisible to the small cases.', text: 'Counting from 2 changes counts, never answers: the limit, measured.' },
  { b: '#786(i): a defect in the tool.', text: 'Fixed and re-run; then ' + B.words.F1controls.asPreregistered + ' came out as written.' },
  { b: '#12 (ii): a defect in the tool (10 November 2026).', text: 'Lean ' + pTool + ' ships no leanchecker. The tool counted the step that could not start as a kernel that did not accept, and the verdict came out REFUSED. Fixed: a checker the toolchain does not ship is now listed as not run. No statement or expectation changed, and nothing was re-run.' },
  { b: 'The batch: ' + NT.length + ' planted statements tested nothing (11 November 2026).', raw: 'In ' + NTclaims + ' of the nine claims below, a planted statement that swaps a number type did not compile, so the proof was never tried against it. My records counted each as a prediction met. The table now counts only statements that reached the check. No verdict changes. The records stay as written; the tool no longer counts this way, and ' + rec('instruments/intake/SPEC.md') + ' lists what else those records misstate (their cost, machine and checker lines).' }
];
const COUNT = { 5: 'Five', 6: 'Six' }[FIXES.length];
if (!COUNT) die('the corrections are ' + FIXES.length + ', and the title has no word for that');
O.push(C.section({
  lab: 'what I got wrong', title: COUNT + ' corrections, made in the open', id: 'amendments',
  bodyRaw: C.plainList(FIXES) + C.pRaw('Each spec was committed before its run, and each correction is dated beside the first outcome.')
}));

const bRow = (b) => {
  const ch = b.r.mutants.filter((x) => x.kind === 'changed'), all = b.r.mutants.filter((x) => x.expect !== 'kernel decides'), cert = all.filter(reached), nt = all.length - cert.length;
  return [{ raw: a(GH + 'certs/lean-intake-' + b.id + '-claimbox.json', b.what) }, b.who + ' · PR ' + b.pr, b.r.verdict,
    cert.filter((x) => x.asExpected).length + ' of ' + cert.length + (nt ? ' · ' + nt + ' not tested' : ''), ch.filter((x) => x.outcome === 'REFUSED by type mismatch').length + ' of ' + ch.length,
    String(Math.round(b.r.run.stepSeconds / 60))];
};
const bAll = BATCH.reduce((s, b) => { const ch = b.r.mutants.filter((x) => x.kind === 'changed'); return [s[0] + ch.length, s[1] + ch.filter((x) => x.outcome === 'REFUSED by type mismatch').length]; }, [0, 0]);
const bAcc = BATCH.flatMap((b) => b.r.mutants.filter((x) => x.kind === 'changed' && x.outcome === 'ACCEPTED').map((x) => b.id + ' ' + x.id));
/* the sentence below says the accepted ones are #488's Icc 0 for Icc 1: refuse the page if the records say otherwise */
if (bAcc.join(',') !== 'erdos-488 C16,erdos-488 C20') throw new Error('build-report-lean-intake: the accepted changed statements are ' + bAcc.join(', ') + ', not #488 C16 and C20');
if (bAll[0] !== bAll[1] + bAcc.length) throw new Error('build-report-lean-intake: a changed statement neither refused nor accepted (it did not elaborate): ' + bAll.join('/'));
O.push(C.section({
  lab: 'the batch', title: 'Nine claims, specs written by a program', id: 'batch', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('From here the planted statements are no longer written by hand. ' + a('https://github.com/carlostoledo1891/claimbox', 'claimbox') + ' writes each spec from the claim’s pins: rewordings that must be accepted, wrong statements by fixed rules (a hypothesis dropped, a strict inequality made weak, a numeral moved by one), and a prediction only where the kernel’s rules make it certain. Everything else the kernel decides. Each spec was committed before its run.')
    + C.pRaw('#488 ran again first, against its known answers, then two open pull requests: four of Matt Stokes’s Erdős proofs and four of Daniel Puri’s. Across the nine, the kernel refused ' + bAll[1] + ' of ' + bAll[0] + ' changed statements. The two it accepted, both on #488, count from 0 instead of 1, and 0 is never counted: the same statement, which is why such changes carry no prediction.') + '</div>'
    + C.table({ cols: [{ h: 'claim', cls: 'cap' }, { h: 'proof' }, { h: 'verdict' }, { h: 'predictions met' }, { h: 'changed refused' }, { h: 'min', cls: 'n' }],
      rows: BATCH.map(bRow) })
    + '<div class="col">' + C.pRaw('None of the other eight has small cases a program can read the original sentence on, so the comparison with the sentence ran only for #488. ' + (BATCH.find((b) => b.id === 'sqtuples').r.spec.amendments ? 'One claim needed a dated amendment: its statement uses a shorthand that DeepMind’s file keeps private, which the planted statements could not see. The first run, refused, is kept in the repository’s history.' : '')) + '</div>'
}));

/* the identity mode for self-contained files, then the case it was tested on; every number is the record's (read and refused above) */
O.push(C.section({
  lab: 'files that repeat the statement', title: 'When the proof file restates the statement', id: 'self-contained',
  bodyRaw: C.pRaw('Many proofs ship as a pair: a statement file and a solution file that declare the same names. Lean cannot load both at once, so the check above could not even be written for them. Since 10 November 2026 the tool has a mode for such files. It decides in three steps.')
    + C.plainList([
      { b: 'A copy of the statement file.', raw: 'One line is added (' + m(SC.copy.added) + '), so the copy loads beside the proof file. Without that line the copy is the original, byte for byte.' },
      { b: 'The copy is shown to be the original.', text: 'Every declaration the check uses is compared with the original’s, constant by constant: types, the values of definitions, inductive types. Any difference refuses the claim.' },
      { b: 'Then the same check, against the copy.', text: 'The kernel must accept the proof as a proof of the copy’s statement, so every definition the proof file restates has to unfold to the original one.' }
    ])
    + C.pRaw('What it cannot do:')
    + C.plainList([
      { b: 'Restated structures.', text: 'Lean treats a structure or an inductive type written out again as a new type, even word for word. Such a claim is refused.' },
      { b: 'Restated imports.', text: 'If the proof file also repeats names from a file the statement imports, the two still collide.' },
      { b: 'Automatic names.', text: 'An instance that Lean names after its namespace would have no counterpart in the copy. The tool refuses and says so.' },
      { b: 'Planted statements.', raw: 'The ' + m('open') + ' lines a spec gives for them are written as given, inside the copy’s namespace; the tool does not adapt them.' },
      { b: 'Axioms the statement file declares.', text: 'The proof may rest on its own axioms of the same names only if each matches the original, name for name. The verdict is then conditional on them and says so. Nothing here proves them.' }
    ])
}));

const pDate = (iso) => Number(iso.slice(8, 10)) + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(iso.slice(5, 7)) - 1];
const pConst = SC.copyIsCanonical.declarations[0].constants;
/* a list, not a table: a table's 560px floor scrolls sideways on a phone, and these outcomes are sentences */
O.push(C.section({
  lab: 'Erdős #12 (ii)', title: 'A proof that restates DeepMind’s definition', id: 'erdos-12',
  bodyRaw: C.pRaw('The proof is AlphaProof Nexus’s (Google DeepMind), from its published results; the statement is DeepMind’s too, from its list of open problems. Erdős #12 is about infinite sets of whole numbers in which no element divides the sum of two different larger ones. Part (ii) asks whether some fixed c > 0 gives every such set fewer than ' + m('N^(1 − c)') + ' elements up to N, for infinitely many N. The proof says no.')
    + C.pRaw('The proof file writes out DeepMind’s definition of such a set again, under DeepMind’s own name (' + m('Erdos12.IsGood') + '), so the two files cannot be loaded together. The proof itself was already checked here on ' + pDate(APN.generated) + ', by two kernels (' + a('alphaproof-nexus.html', 'the AlphaProof Nexus report') + '). The question this time was the tool’s: does the new mode reach the same answer, and does it still refuse a wrong statement?')
    + C.plainList([
      { b: 'The copy is DeepMind’s file.', text: 'Byte for byte without the added line, and the declaration the check uses is identical (' + pConst + ' constants compared).' },
      { b: 'The kernel accepts the proof against the statement.', text: 'The two statements differ as written and agree once the restated definition is unfolded. Only the three standard axioms sit under the proof.' },
      { b: P.words.F1controls.sameAccepted + ' rewordings accepted, ' + P.words.F1controls.wrongRefused + ' wrong statements refused.', text: 'The wrong ones: ' + pW.map((x) => x.why.replace(/ - /g, ' − ')).join('; ') + '.' },
      { b: P.words.plantedClaims.caught + ' planted defects caught.', text: 'A sorry and an added axiom, each shown in the axiom list.' },
      { b: 'Lean and nanoda accept.', text: 'leanchecker was not run: Lean ' + pTool + ' does not ship it. Nor were the four later checkers named at the top.' },
      { b: 'Small cases: refused, not run.', text: 'No finite case decides a statement about every infinite set.' }
    ])
    + C.pRaw('The verdict is ' + P.verdict + ', from one run of ' + pMin + ' minutes on a laptop: the kernels named accept the proof as a proof of DeepMind’s statement, and the check still tells a wrong statement from the right one. DeepMind’s file declares no axioms, so nothing here is conditional. Whether that statement is Erdős’s problem stays a reading.')
    + C.pRaw('The record is ' + rec(P_REC) + '; its rules, committed before the run, are ' + rec(P_SPEC) + '.')
}));

O.push(C.cards([
  { k: 'Erdős #488 · pull request #5297', title: 'Gessel’s refutation, against DeepMind’s statement', desc: 'Identity, ' + ctl(A, 'wrong').join(' of ') + ' wrong statements refused, the small cases, three kernels.', n: 'the record', href: GH + 'certs/lean-intake-erdos-488.json' },
  { k: 'Erdős #786(i) · pull request #5299', title: 'Its own definitions, matched by the kernel', desc: ctl(B, 'wrong').join(' of ') + ' wrong statements refused, ' + N(ndec) + ' declarations checked by nanoda, ' + minutes + ' minutes on a laptop.', n: 'the record', href: GH + 'certs/lean-intake-erdos-786i.json' },
  { k: 'Erdős #12 (ii) · AlphaProof Nexus', title: 'A proof file that restates the statement', desc: P.words.F1controls.wrongRefused + ' wrong statements refused, ' + P.words.plantedClaims.caught + ' planted defects caught, Lean and nanoda accept; leanchecker not run.', n: 'the record', href: GH + P_REC }
]));

O.push(C.section({
  lab: 'check it yourself', title: 'Re-run it', id: 'rerun',
  bodyRaw: C.plainList([
    { b: 'The verdicts.', raw: m('node tools/lean-intake.js record <id> --check') + ' re-derives each record from its run’s logs in ' + rec('corpus/lean-intake') + '.' },
    { b: 'The runs.', raw: m('node tools/lean-intake.js run <id>') + ' fetches the pins and repeats every step (about 6 GB of Mathlib per claim).' },
    { b: 'The rules.', raw: IDS.map((id) => rec('corpus/lean-intake/' + id + '/spec.json')).join(' and ') + ', with their dated amendments; Erdős’s sentence as a program: ' + rec('instruments/intake/erdos-488.js') + '.' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-lean-intake.js from certs/lean-intake-erdos-488.json, certs/lean-intake-erdos-786i.json, certs/lean-intake-apn-erdos-12-ii.json and the nine certs/lean-intake-*-claimbox.json (tools/lean-intake.js record --check). I built the tool with Claude (Anthropic).') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'lean-intake.html'),
  TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/lean-intake.html', og: { image: '/og-lean-intake.png', alt: OG.alt('lean-intake') },
    desc: 'A one-command check that an AI-written Lean proof proves the statement it claims: two refutations of Erdős problems (#488, #786(i)) checked against Google DeepMind’s statements, with planted wrong statements refused, rewordings accepted, and the formal statement compared with Erdős’s sentence on small cases.' }));
console.log('reports/lean-intake.html written · #488 ' + A.verdict + ' · #786(i) ' + B.verdict + ' · ' + wOk + '/' + wN + ' wrong refused · ' + minutes + ' min');
