#!/usr/bin/env node
/* build-report-percolation-critical.js — reports/percolation-critical.html: two labs' Lean proofs that bond percolation on
   Z^d has no infinite cluster at p_c — Anthropic's (J. Leder with Claude, every d >= 2) and OpenAI's (d = 3) — checked
   against a statement written independently from Grimmett's textbook.

   THE MATHEMATICS IS NOT OURS. The proofs are the labs'; ours are the statement, the two bridges and the checks. What
   stays open comes first. Sections 6 to 8 are the three follow-ups of 2026-11-13 (record: followUps): theta continuous
   on [0, 1] for d >= 2, proved on Anthropic's library (classical mathematics, their heavy ingredients, never "first");
   Kozma-Nitzan's Conjecture 3 as printed against Anthropic's Lean statement; Conjecture 1 as printed against Ahmed
   Bou-Rabee's Lean proof (independent by procedure only). Every number and verdict word is read from certs/percolation-critical.json
   (tools/record-percolation-critical.js, which re-derives it from corpus/percolation-critical with --check). The build
   refuses when a verdict is not the one this page states.

   usage: node tools/build-report-percolation-critical.js                                                          MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));
const die = (m) => { console.error('PERCOLATION REPORT REFUSED: ' + m); process.exit(1); };
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'percolation-critical.json'), 'utf8'));
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const mins = (s) => Math.round(s / 60);

const SAYS = { bridgeA: 'CERTIFIED', bridgeO: 'CERTIFIED', replayA: 'REPLAYED', anchors: 'CERTIFIED', seam: 'READ, NOT DECIDED', oneLean: 'CERTIFIED', dimOne: 'CERTIFIED',
  continuity: 'PROVED', conjecture3: 'CERTIFIED, as printed under reading R0', conjecture3Proved: 'PROVED', conjecture3Blind: 'FOUND BLIND',
  conjecture1: 'CERTIFIED, as printed', conjecture1Proved: 'PROVED', conjecture1Blind: 'NOTHING TO FIND' };
for (const [k, v] of Object.entries(SAYS)) if (R.verdicts[k] !== v) die(k + ' is ' + R.verdicts[k] + ' in the record, and this page states ' + v);
if (!/^The proofs are Anthropic’s .* and OpenAI’s/.test(R.undecided)) die('the record no longer says first whose proofs these are');
const falsePl = R.planted.filter((p) => p.false), refusedBoth = falsePl.filter((p) => p.refusedA && p.refusedO);
if (refusedBoth.length !== falsePl.length) die('a false planted statement was not refused by both bridges');
const A = R.anthropic, O = R.openai, ONE = R.oneLean;
if (ONE.port.statementFile !== 'byte-identical' || ONE.toolchain !== A.pins.toolchain) die('the one-Lean check is no longer on Anthropic’s version with OpenAI’s statement file unchanged');

/* the three follow-ups (2026-11-13): what the page says first about them must still be what the record says */
const F = R.followUps, CT = F.continuity, K3 = F.conjecture3, K1 = F.conjecture1;
if (!/^Three follow-ups .*None is a first/.test(F.undecided) || CT.claimsFirst !== false || K1.claimsFirst !== false || CT.priorArtSearch !== 'partial' || CT.priorArt.found !== 0) die('the record no longer says that no follow-up is a first');
if (K1.independence !== 'by procedure only' || CT.ingredients.whose !== 'Anthropic’s' || CT.on.commit !== A.pins.commit || CT.labOwnListingCoversThem !== false || CT.labListsItAsNotClaimed !== true) die('the record no longer says whose the ingredients are, or how far the independence goes');
const rd3 = (id) => K3.readings.find((x) => x.id === id) || die('the record lacks reading ' + id);
const same3 = (id) => rd3(id).labImpliesIt === 'PROVED' && rd3(id).itImpliesLab === 'PROVED';
if (!same3('R0') || !same3('RB') || !same3('N3') || !same3('N4') || rd3('N2').labImpliesIt !== 'PROVED' || rd3('N2').itImpliesLab !== 'NOT PROVED') die('the readings of Conjecture 3 are not as this page states them');
if (K3.red.letterRefusalsReachBridge !== false || K3.red.scriptRefusalsAddedAfterSeal !== true || K3.red.tokenRuleMetToTheLetter !== false || K3.amendments !== 2) die('the two departures of the Conjecture 3 item are not as this page states them');
if (K1.targets.length !== 3 || K1.targets.some((x) => x.toOurs !== 'PROVED' || x.fromOurs !== 'PROVED') || !K1.oneSentence || K1.k0.repaired !== 0 || K1.k0.elaborated !== K1.k0.definitions || K1.k0.thirdPartyBytesPresent !== false) die('the Conjecture 1 comparison is not as this page states it');
if (K1.nonempty.printed !== false || K1.nonempty.onHisNotLiteralList !== false || K1.nonempty.immaterial !== 'PROVED' || K1.thirdParty.madeWith !== 'Claude and ChatGPT') die('the record no longer carries the facts about the unprinted “nonempty”, or how the third party’s Lean was made');
if (!K1.accidents.sessionRestartedBeforeHandBack || K1.accidents.verdictRestsOn !== 'the replay') die('the accidents of the Conjecture 1 item are not as this page states them');
const day = (iso) => { const [y, mo, d] = iso.split('-').map(Number); return d + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][mo - 1] + ' ' + y; };
const KN = a(K3.source.url, 'arXiv:2401.12397');
const TPR = K1.thirdParty.repository.replace('https://github.com/', '');
const USD = R.money.usd + F.money.usd, PODS = R.money.pods + F.money.pods, MINUTES = R.money.minutes + F.money.minutes;

/* figure 1 (the hero): the book, our statement, and the two proofs that reach it, each by a bridge we wrote */
const box = (x, y, w, h, solid) => '    <rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="var(--surface)" stroke="var(--ink)" stroke-width="' + (solid ? 2.4 : 1.6) + '"/>';
const line = (x1, y1, x2, y2, dash) => '    <line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--ink-3)" stroke-width="1.6"' + (dash ? ' stroke-dasharray="5 4" data-w="computed"' : '') + '/>';
const head = (x, y, dir) => '    <path d="M' + x + ' ' + y + ' l' + (dir * -9) + ' -5 l0 10 z" fill="var(--ink-3)"/>';
const L = (x, y, text, cls) => C.label({ x, y, text, cls });
const HALT = 'Left, a box for Grimmett’s textbook, joined by a dashed line to a central box for the statement written from it. On the right, two boxes for the two labs’ Lean proofs, Anthropic’s for every dimension from 2 and OpenAI’s for dimension 3; an arrow runs from each into the statement, labelled with the length of the bridge that proves it.';
const W = [C.svgOpen({ w: 900, h: 300, alt: HALT })];
W.push(box(0, 104, 180, 92), L(14, 132, 'the textbook', 't-lab'), L(14, 156, 'Grimmett, Percolation', 't-ax'), L(14, 178, '§1.3–1.4', 't-ax'));
W.push(line(186, 150, 236, 150, true));
W.push(box(242, 78, 300, 144, true), L(258, 106, 'my statement · θ(p_c) = 0', 't-lab'), L(258, 132, 'Mathlib only, every d ≥ 2', 't-ax'),
  L(258, 154, 'p_c = sup {p : θ(p) = 0}', 't-ax'), L(258, 176, 'θ(0) = 0, θ(1) = 1 proved', 't-ax'), L(258, 198, 'written first, from the book', 't-ax'));
W.push(box(640, 10, 260, 124), L(656, 38, 'Anthropic’s Lean proof', 't-lab'), L(656, 62, 'J. Leder with Claude', 't-ax'), L(656, 86, 'every d ≥ 2', 't-ax'), L(656, 112, 'bridge: ' + A.bridge.lines + ' lines', 't-ax'));
W.push(box(640, 166, 260, 124), L(656, 194, 'OpenAI’s Lean proof', 't-lab'), L(656, 218, 'family 213, ℤ³', 't-ax'), L(656, 242, 'd = 3', 't-ax'), L(656, 268, 'bridge: ' + O.bridge.lines + ' lines', 't-ax'));
W.push(line(634, 72, 556, 116), head(556, 116, -1));
W.push(line(634, 228, 556, 184), head(556, 184, -1));
W.push(L(242, 252, 'each bridge: two kernels accept', 't-ax'), L(242, 274, refusedBoth.length + ' false statements: refused by both', 't-ax'));
W.push('    </svg>');
const NW = [];
let y = 0;
const nbox = (title, lines_, solid) => { NW.push(box(0, y, 360, 42 + lines_.length * 22, solid), L(14, y + 26, title, 't-lab')); lines_.forEach((t, i) => NW.push(L(14, y + 50 + i * 22, t, 't-ax'))); y += 42 + lines_.length * 22; };
const narrow = (t) => { NW.push(L(14, y + 22, t, 't-ax')); y += 34; };
nbox('the textbook', ['Grimmett, Percolation, §1.3–1.4']); narrow('↓ written by hand, before reading the proofs');
nbox('my statement · θ(p_c) = 0', ['Mathlib only, every d ≥ 2', 'p_c = sup {p : θ(p) = 0}', 'θ(0) = 0, θ(1) = 1 proved'], true);
narrow('↑ bridge, ' + A.bridge.lines + ' lines · every d ≥ 2'); nbox('Anthropic’s Lean proof', ['J. Leder with Claude']);
narrow('↑ bridge, ' + O.bridge.lines + ' lines · d = 3'); nbox('OpenAI’s Lean proof', ['family 213, ℤ³']);
NW.unshift(C.svgOpen({ w: 360, h: y + 4, alt: HALT })); NW.push('    </svg>');

const TITLE = 'Two AI proofs of critical percolation, checked against the textbook statement I wrote';
const O_ = [];
O_.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: TITLE,
  deck: 'In August and September 2026, Anthropic and OpenAI released Lean proofs that bond percolation on ℤ^d has no infinite cluster at the critical point, θ(p_c) = 0, open from dimension 3 up to 10 until then. The proofs are theirs. '
    + 'Before reading either, I wrote the statement myself from Grimmett’s textbook, and checked, with Claude, that both proofs prove it: Anthropic’s for every dimension from 2 up, OpenAI’s for dimension 3. '
    + 'A day later, with Claude agents, I added three follow-ups (sections 6 to 8): a Lean proof that θ is continuous on [0, 1], and Kozma and Nitzan’s Conjectures 3 and 1, as printed, compared with their statements in Lean.'
}));
O_.push(C.figure({ hero: true, svgRaw: W.join('\n'), svgNarrowRaw: NW.join('\n'), record: ['certs/percolation-critical.json'],
  caption: 'What was checked. Each arrow is a Lean proof, which I call a bridge, that the lab’s theorem implies my statement. Both bridges are checked by two independent kernels, and both fail when the statement is changed to a false one.',
  stop: 'a bridge is no longer accepted by both kernels, or a false planted statement is accepted' }));
O_.push(C.stats([
  { k: 'labs’ proofs that prove my statement', v: '2 of 2', n: 'Anthropic: every d ≥ 2 · OpenAI: d = 3' },
  { k: 'kernels that accept each bridge', v: '2', n: 'Lean’s and nanoda, plus a full replay' },
  { k: 'false statements planted', v: refusedBoth.length + ' of ' + falsePl.length, n: 'refused by both bridges' },
  { k: 'rented computer time', v: 'US$' + USD.toFixed(2), sm: true, n: PODS + ' machines, under ' + Math.ceil(MINUTES / 60) + ' hours, follow-ups included' }
]));
O_.push(C.scope('The proofs are Anthropic’s (Justin Leder with Claude) and OpenAI’s. This page checks that their Lean theorems prove a statement written independently from the textbook; it is not new mathematics, and it does not check either informal paper. The one theorem proved here, the continuity of θ (section 6), follows from θ(p_c) = 0 by a classical step, and its hard ingredients are Anthropic’s. The checks are mine, run with Claude (Anthropic’s AI model), which wrote the programs and the two bridges under my direction.'));

O_.push(C.section({ lab: 'read this first', title: 'What is still open', id: 'limits', bodyRaw: C.plainList([
  { b: 'In the single-Lean check, OpenAI’s proof is a port.', text: 'To put both proofs in one Lean (section 4), OpenAI’s ℤ³ proof was moved to the version Anthropic’s uses: ' + ONE.port.changed + ' of its ' + ONE.port.files + ' files changed, almost all of them renamed library lemmas. Its statement file is unchanged, byte for byte, and the moved proof is accepted against it. It is still not OpenAI’s proof as shipped; that one was checked on its own version.' },
  { b: 'Not the papers.', text: 'This checks the Lean statements against the textbook’s definitions. It does not check either lab’s informal argument, or Kozma and Nitzan’s reduction as printed. Of their paper, only the sentences of Conjectures 3 and 1 are compared with Lean statements (sections 7 and 8); the step from Conjecture 3 to θ(p_c) = 0 is not.' },
  { b: 'Anthropic’s proof is not on its repository’s main branch.', text: 'It is reachable only by its commit hash (the pull request was closed the same day); I pinned that commit by its hash.' },
  { b: 'The same model family.', text: 'The bridge to Anthropic’s proof was written by Claude, Anthropic’s model. The kernels decide, not the model; you should still know.' },
  { b: 'Lean and Mathlib are trusted,', text: 'as in any check of this kind.' }
]) + C.p('And on the three follow-ups, sections 6 to 8:') + C.plainList([
  { b: 'None of them is a first.', text: 'Ahmed Bou-Rabee’s repository has held his own restatement of Conjecture 1 since ' + day(K1.thirdParty.restatementSince) + '. For continuity, my search for an earlier formal proof was partial: ' + CT.priorArt.read.slice(0, -1).join(', ') + ' and ' + CT.priorArt.read[CT.priorArt.read.length - 1] + ' do not have it, and ' + CT.priorArt.unfinished + ' did not finish. I do not claim there is none.' },
  { b: 'The hard parts are not mine.', text: 'The continuity proof stands on Anthropic’s library at one commit: the uniqueness of the infinite cluster, the zero–one law and θ(p_c) = 0 itself are their theorems. The proof of Conjecture 3 is Anthropic’s and the proof of Conjecture 1 is Ahmed Bou-Rabee’s. For those two I checked what the theorems say, not how they are proved.' },
  { b: '“As printed” is my reading.', text: 'CERTIFIED, as printed, means that the Lean sentence and my reading of the printed sentence are the same statement, by a proof that does not use the conjecture. It does not mean that Kozma and Nitzan endorse either one. The printed sentences leave choices (' + K3.statement.choices + ' for Conjecture 3, ' + K1.statement.choices + ' for Conjecture 1); each is listed in the records, and another reader may choose otherwise.' },
  { b: 'On Conjecture 1, the independence is by procedure only.', text: 'Bou-Rabee’s Lean files say they were produced with ' + K1.thirdParty.madeWith + '; my statement, my bridge and my replay were made with Claude agents. What is independent is the order of work: my statement was written from the paper, with his files unread, and sealed before any of them was opened.' },
  { b: 'Not everything was attempted, and two controls did not fit their wording.', text: 'For Conjecture 3, the version with one common p follows from Anthropic’s statement; the converse was not attempted. Two of that item’s controls did not match the wording I had sealed; both departures are stated in section 7. The blind control on Conjecture 1 had nothing to find, so it does not count as a pass.' }
]) }));

O_.push(C.section({ lab: '1 · the statement', title: 'The statement, written from the book', id: 'statement', bodyRaw:
  C.pRaw(C.esc('From Grimmett’s ') + '<em>Percolation</em>' + C.esc(' (2nd ed., 1999, §1.3–1.4): ℤ^d with an edge between points at distance one; each edge open with probability p, independently; θ(p) the probability that the origin’s open cluster is infinite; p_c the supremum of the p with θ(p) = 0. The claim: θ(p_c) = 0 in every dimension d ≥ 2. I wrote it in Lean after reading the two labs’ statement files and none of their proofs, and encoded it differently from both on purpose, so that a bridge has to show the encodings agree.'))
  + C.code([
    'def Adjacent (x y : Vertex d) : Prop := ∑ i, |x i - y i| = 1',
    'def Edge (d) := {e : Sym2 (Vertex d) // Sym2.lift ⟨Adjacent, _⟩ e}',
    'def P (d) (p) := Measure.infinitePi fun _ : Edge d => bernoulliMeasure true false p',
    'def θ (d) (p) := (P d p {ω | (cluster ω 0).Infinite}).toReal',
    'def pc (d) := sSup {p : ℝ | ∃ h : p ∈ Set.Icc 0 1, θ d ⟨p, h⟩ = 0}',
    'def Statement := ∀ d, 2 ≤ d → ∃ h : pc d ∈ Set.Icc 0 1, θ d ⟨pc d, h⟩ = 0'].join('\n'))
  + C.pRaw(C.esc('Abridged; the full file is ' + R.statement.lines + ' lines, in the record.'))
  + C.plainList([
    { b: 'It cannot be satisfied trivially.', text: 'Proved in my encoding, at both Lean versions and inside both labs’ environments: θ(0) = 0, θ(1) = 1, and p_c lies in [0, 1] with no hypothesis, so the supremum is never Lean’s default for an empty set. With them, the statement forces p_c < 1.' },
    { b: 'Sealed first.', text: 'The file’s fingerprint was registered before any of the labs’ code was built here, and the file never changed.' }
  ]) }));

O_.push(C.section({ lab: '2 · Anthropic’s proof', title: 'Replayed, then bridged for every d ≥ 2', id: 'anthropic', bodyRaw: C.plainList([
  { b: 'It replays as shipped.', raw: C.esc('Commit ') + m(A.pins.commit.slice(0, 8)) + C.esc(' builds in ' + mins(A.replay.buildSeconds) + ' minutes. The ' + A.replay.audited + ' theorems its audit names rest on the three standard axioms of Lean only. Its own Comparator check passes with Lean’s kernel and nanoda, and refuses ' + A.replay.redControls + ' planted wrong statements. Lean’s checker replays the whole environment from scratch in ' + mins(A.replay.freshSeconds) + ' minutes.') },
  { b: 'The bridge.', text: 'A ' + A.bridge.lines + '-line Lean file proves my statement for every d ≥ 2 from Anthropic’s main theorem. It matches the two graphs, carries my product measure to theirs, identifies the clusters, and turns their p_c (an infimum) into mine (a supremum) with their proof that θ increases with p.' },
  { b: 'Checked with my statement as the target.', text: 'Comparator, given my file as the statement to be proved, accepts on Lean’s kernel and on nanoda. Lean’s checker replays the bridge’s whole environment from scratch in ' + mins(A.bridge.freshSeconds) + ' minutes.' }
]) }));

O_.push(C.section({ lab: '3 · OpenAI’s proof', title: 'Bridged at d = 3, with one missing lemma added', id: 'openai', bodyRaw: C.plainList([
  { b: 'The bridge.', raw: C.esc('A ' + O.bridge.lines + '-line Lean file proves my statement at d = 3 from the bond part of OpenAI’s ℤ³ theorem (') + m('critical_no_infinite') + C.esc(', openai/math at ') + m(O.pins.commit.slice(0, 8)) + C.esc(').') },
  { b: 'One lemma was missing.', text: 'OpenAI’s ℤ³ library does not state that θ increases with p, which the step from its infimum p_c to the textbook’s supremum needs. The bridge proves it by the standard coupling, in ' + O.bridge.monotonicityLines + ' lines. That piece is ours.' },
  { b: 'Checked with my statement as the target.', text: 'Comparator accepts on Lean’s kernel and on nanoda; Lean’s checker replays the whole environment from scratch in ' + mins(O.bridge.freshSeconds) + ' minutes.' }
]) }));

O_.push(C.section({ lab: '4 · one Lean', title: 'Both proofs and my statement in a single Lean', id: 'one-lean', bodyRaw: C.plainList([
  { b: 'Why.', text: 'The two bridges first ran on two Lean versions: Anthropic’s on ' + A.pins.toolchain + ', OpenAI’s on ' + O.pins.toolchain + '. My statement was the same file in both, but of the ' + N(R.seam.common) + ' library definitions it reaches, only ' + N(R.seam.identical) + ' are identical across the two. That it meant the same thing in both was a careful reading. This section replaces the reading with a check.' },
  { b: 'The port.', text: 'OpenAI’s ℤ³ proof was moved to Lean ' + ONE.toolchain + ': ' + ONE.port.changed + ' of ' + ONE.port.files + ' files changed (' + ONE.port.linesOut + ' lines out, ' + ONE.port.linesIn + ' in), ' + ONE.port.identical + ' untouched. OpenAI’s statement file and all of Anthropic’s library are unchanged; my statement and the bridge to Anthropic’s proof are the sealed files; the bridge to OpenAI’s proof changed in ' + ONE.port.bridgeOLinesChanged + ' lines.' },
  { b: 'What was checked there.', text: 'One environment now holds both proofs, both bridges and my statement. It builds from empty with no error and no warning. Comparator, given my file as the statement to be proved, accepts both results on Lean’s kernel and on nanoda: every d ≥ 2 from Anthropic’s proof, d = 3 from OpenAI’s. It also accepts the moved proof against OpenAI’s own unchanged statement file. Lean’s checker replays the whole environment from scratch in ' + mins(ONE.freshSeconds) + ' minutes.' },
  { b: 'Planted errors, again.', text: 'In that environment, ' + ONE.planted + ' builds against a false statement (θ(p_c) = 1, and the false p_c of R4 below) all fail, each inside a bridge.' },
  { b: 'The first run failed, by my own packaging.', text: 'My archive of the inputs carried 34 stray files from macOS into the library, and the build stopped on them. I removed them, compared the tree with its list file by file, and ran every check again from an empty build. Both runs are in the records.' }
]) }));

O_.push(C.section({ lab: '5 · planted errors', title: 'What would have caught a wrong statement', id: 'planted', bodyRaw: C.plainList(R.planted.map((p) => ({
  b: p.id + ' · ' + p.what + '.',
  text: p.false ? (p.provedFalse ? 'False, and proved false in Lean in the same environment. Both bridges fail on it.' : (p.provedFalseAtDimOne ? 'False. Both bridges fail on it. The d = 1 statement is also proved false in Lean, in a ' + R.dimOne.lines + '-line file that uses Mathlib only, at both Lean versions: in one dimension p_c = 1 and θ(1) = 1, so the condition d ≥ 2 in my statement is needed.' : 'False. Both bridges fail on it.'))
    : 'Still true, as it turned out, so its failure shows only that the bridges depend on how p_c is written. Not counted as a refusal; R4 replaced it.'
}))) }));

O_.push(C.section({ lab: '6 · continuity', title: 'θ is continuous on [0, 1], proved in Lean for every d ≥ 2', id: 'continuity', bodyRaw:
  C.pRaw(C.esc('The day after the checks above, I added one theorem in the same encoding, with a Claude agent writing the Lean under rules I had sealed first: in every dimension d ≥ 2, the percolation probability θ is a continuous function of p on all of [0, 1]. The step from θ(p_c) = 0 to continuity is classical (Grimmett’s ') + '<em>Percolation</em>' + C.esc(', §8.3; van den Berg and Keane, 1984), and the hard ingredients, θ(p_c) = 0 among them, are Anthropic’s Lean theorems. Anthropic’s README lists the continuity of θ on [0, 1], as a formal statement, among the things it does not claim.'))
  + C.code(['def ContinuityStatement : Prop :=', '  ' + CT.statement.text, '', 'theorem theta_continuous :', '  TextbookPercolation.ContinuityStatement'].join('\n'))
  + C.plainList([
    { b: 'What is proved.', text: CT.theorems.length + ' theorems, each about the θ of section 1: ' + CT.theorems.map((x) => x.says).join('; ') + '.' },
    { b: 'Whose it is.', text: 'The proof file is ' + CT.proof.lines + ' lines, with a ' + CT.proof.helperLines + '-line helper, written in ' + CT.proof.compileAttempts + ' compile attempts. It joins Anthropic’s theorems: ' + CT.ingredients.list.join('; ') + '. Mine are the statement, the bridge of section 2 and the joining steps.' },
    { b: 'Checked like the bridges.', text: 'It builds on Anthropic’s library, at the commit of section 2, with no error and no warning. The ' + CT.theorems.length + ' theorems rest on the three standard axioms of Lean only; so do Anthropic’s uniqueness theorem and its zero–one law, which Anthropic’s own axiom listing does not cover. Comparator, given my statement file as the statement to be proved, accepts on Lean’s kernel and on nanoda. Lean’s checker replays the whole environment from scratch in ' + mins(CT.freshSeconds) + ' minutes.' },
    { b: 'Planted errors.', text: CT.planted.provedFalse.length + ' false variants (' + CT.planted.provedFalse.join('; ') + ') are proved false in Lean. The proof, pointed at each of them in two forms, fails to compile all ' + CT.planted.scriptRefusals + ' times, and Comparator refuses the planted statement.' },
    { b: 'What it does not say.', text: 'It adds no new mathematics: given θ(p_c) = 0, continuity is a textbook consequence. It is not claimed as the first formal proof. It is not independent of Anthropic: it stands on their library at one commit, and on the kernels. In dimension one θ is not continuous (it is 0 below p = 1 and 1 at p = 1), so the condition d ≥ 2 is needed here too.' }
  ]) }));

O_.push(C.section({ lab: '7 · Conjecture 3', title: 'Kozma and Nitzan’s Conjecture 3: is the Lean statement the printed one?', id: 'conjecture-3', bodyRaw:
  C.pRaw(C.esc('Both labs’ proofs build on a reduction by Gady Kozma and Shahaf Nitzan (') + KN + C.esc('). Its Conjecture 3 (' + K3.source.where + ') reads: “' + K3.printed + '” Anthropic’s README calls its Lean statement of this conjecture “verbatim”. I had a Claude agent write the sentence in Lean from the paper alone, with no formalization open, and sealed that file before I or the agent that wrote the comparison opened Anthropic’s statement of it. One caveat: the file’s encoding style follows my statement of section 1, which was written after reading the two labs’ statement files for θ(p_c) = 0.'))
  + C.plainList([
    { b: 'The word: CERTIFIED, as printed, under one reading.', text: 'Read “any graph G” as any finite graph with a probability on each edge. Under that reading Anthropic’s Lean statement and mine are the same statement: each implies the other, by proofs that use definitions only and never the conjecture itself. A program walks everything each proof depends on, about ' + N(Math.round(K3.walks.constantsMax / 1000) * 1000) + ' constants, to confirm that: the ' + K3.walks.clean + ' comparison proofs come out clean, and ' + K3.walks.cheatsFlagged + ' proofs written to cheat are caught.' },
    { b: 'It is not the printed sentence letter for letter.', text: 'In Anthropic’s statement ' + K3.encoding.join('; ') + '. Each difference is bridged by proof, in a ' + K3.method.lines + '-line file that uses Mathlib only.' },
    { b: 'Other readings.', text: 'The same holds when “any graph” is taken literally, as any countable graph (one direction needs a real argument, an exhaustion over finite subgraphs, ' + K3.method.exhaustionLines + ' lines), and when A is required to be nonempty or a proper subset. With one common p on all edges, Anthropic’s statement implies that version; the converse was not attempted.' },
    { b: 'The conjecture as I wrote it is proved.', text: 'My statement follows from Anthropic’s theorem. It rests on the three standard axioms; Comparator, given my file as the statement to be proved, accepts on Lean’s kernel and on nanoda; Lean’s checker replays the whole environment from scratch in ' + mins(K3.freshSeconds) + ' minutes. The proof of the conjecture is Anthropic’s. The step to my sentence is mine.' },
    { b: 'Planted errors, and two controls that did not fit.', text: K3.red.plantedProvedFalse + ' false variants of the sentence are proved false; the comparison’s own proof fails against each of them, and Comparator refuses a planted statement. Two departures from the rules I had sealed, both written into the rules as dated amendments. First, the control I had worded as “put the planted text into the statement file” was refused ' + K3.red.letterRefusals + ' times, but in my own sanity lemmas, before the build reached the comparison; the form that does test it, the proof against each planted statement, was added after the seal. Second, the search for forbidden words is empty over the files that carry proofs, but not over every file of mine as the sealed wording asked: ' + K3.red.tokenLinesElsewhere + ' lines elsewhere, all of them commands that print axioms, the walking program’s own source, or prose.' },
    { b: 'The blind control: found.', text: 'One difference had already been published, by Ahmed Bou-Rabee: Anthropic’s Lean statement allows the set A to be empty, where his restatement takes A nonempty. The agent that found his passage took no further part, and neither I nor the agents that wrote my statement and the comparison read it until my results were sealed. The same point was already in my sealed reading sheet, and one of the proofs above decides it: with A nonempty or not, the statement is the same. The remark and its priority are his. Under my primary reading it is not a difference at all, because the printed sentence does not exclude the empty set.' }
  ]) }));

O_.push(C.section({ lab: '8 · Conjecture 1', title: 'Kozma and Nitzan’s Conjecture 1, against a third party’s Lean proof', id: 'conjecture-1', bodyRaw:
  C.pRaw(C.esc('Conjecture 1 of the same paper (' + K1.source.where + ') is the stronger inequality: “' + K1.printed + '” ') + a(K1.thirdParty.repository, 'Ahmed Bou-Rabee’s repository') + C.esc(' proves a Lean statement of it (') + m(K1.thirdParty.theorem) + C.esc('), on top of Anthropic’s library. With Claude agents, I had the printed sentence written in Lean from the paper alone, without a compiler and with his files unread, and sealed it before I or either agent that wrote for me opened any of his statements. A separate scouting agent had seen his file names, his declaration names and one passage of his README; it took no further part.'))
  + C.plainList([
    { b: 'My own files first.', text: 'All ' + K1.k0.definitions + ' definitions I had sealed (the statement, other readings of it, planted wrong variants and neighbouring statements) compiled unchanged the first time Lean saw them. Before any file of his repository reached the machine, ' + K1.k0.plantedProvedFalse + ' planted variants were proved false and ' + K1.k0.readingsProvedEquivalent + ' other readings were proved equivalent to my primary one, with Mathlib only.' },
    { b: 'The word: CERTIFIED, as printed.', text: 'His repository states the conjecture ' + K1.targets.length + ' times, and the ' + K1.targets.length + ' are one sentence. That sentence and mine are the same statement: each implies the other, by proofs that use definitions only. The dependency walk finds all ' + K1.walks.clean + ' comparison proofs clean and catches ' + K1.walks.cheatsFlagged + ' proofs written to cheat.' },
    { b: 'It is not the printed sentence letter for letter.', text: 'In his Lean statement ' + K1.encoding.join('; ') + '. None of this changes what is claimed, and each difference is bridged by proof.' },
    { b: 'The unprinted “nonempty”.', text: 'The paper says “a set of vertices”. His restatement and his Lean statement take A nonempty, and his list of correspondences that are not literal does not name it. It makes no difference: my statement admits the empty set, where it holds vacuously, and is proved equivalent to the nonempty form.' },
    { b: 'The conjecture as I wrote it is proved,', text: 'from his theorem: the three standard axioms, Comparator on Lean’s kernel and on nanoda with my file as the statement to be proved, and a replay of the whole environment from scratch in ' + mins(K1.freshSeconds) + ' minutes. The proof is his. Of it I checked the axioms, and that two kernels accept the theorem built on it; nothing more.' },
    { b: 'Planted errors.', text: 'The ' + K1.red.plantedProvedFalse + ' false variants are each refused: the comparison proofs and the final proof fail to compile against every one, and Comparator refuses ' + K1.red.comparatorRefusals + ' planted statements.' },
    { b: 'The blind control: nothing to find.', text: 'His published list of non-literal correspondences names nothing for Conjecture 1, so this control could not test whether I would have found a known difference. It is recorded as that, not as a pass. The list of differences above was also not made blind: the comments in his Lean files name the encoding and the nonempty A, and the agent that wrote the comparison read them.' },
    { b: 'Accidents.', text: 'My session restarted before the agent handed its work back, so its own summary has ' + K1.accidents.authorSummaryUnfilledSections + ' unfilled sections and the verdict rests on my replay. The rented machine stood idle for about ' + K1.accidents.idleMinutes + ' minutes, and one upload hung for ' + K1.accidents.uploadHungMinutes + ' minutes and was redone.' }
  ]) }));

O_.push(C.section({ lab: 'the method', title: 'How it was done', id: 'method', bodyRaw: C.plainList([
  { b: 'Rules first.', text: 'The rules for each stage were written and sealed before the stage ran: a salted fingerprint of the private work, posted to a public registry and to Bitcoin, which proves the date without showing the content (' + R.seals.length + ' seals). Each departure from the rules is listed in the records.' },
  { b: 'Written by agents, checked by me.', text: 'Claude agents wrote the two bridges, the port and the d = 1 proof on rented machines. I rebuilt each, listed their axioms and ran both kernels and the full replays myself; the single-Lean check is my own run, from the agent’s saved files.' },
  { b: 'Size.', text: 'One day, 12 November 2026: a laptop and ' + R.money.pods + ' rented machines, about US$' + R.money.usd.toFixed(2) + '.' },
  { b: 'The follow-ups.', text: 'One more day, ' + day(F.date) + ': ' + F.money.pods + ' rented machines, about US$' + F.money.usd.toFixed(2) + ' by the clock. Claude agents wrote the three statements, the continuity proof and the two comparisons; I replayed every check from their saved files before a verdict was written. Their rules and their results have ' + F.seals.length + ' more seals in the same public registry, the rules before each stage ran.' }
]) }));

O_.push(C.section({ lab: 'who did what', title: 'Each step is a separate job', id: 'roles', bodyRaw: C.plainList([
  { b: 'The proofs.', text: 'Anthropic (Justin Leder with Claude) and OpenAI. Both build on Kozma and Nitzan’s reduction.' },
  { b: 'The conjectures.', raw: C.esc('Gady Kozma and Shahaf Nitzan, ') + KN + C.esc('. The proof of Conjecture 3 is Anthropic’s.') },
  { b: 'The proof of Conjecture 1.', raw: C.esc(K1.thirdParty.author + ', ') + a(K1.thirdParty.repository, TPR) + C.esc(' (' + K1.thirdParty.licence + '); his Lean files say they were produced with ' + K1.thirdParty.madeWith + '.') },
  { b: 'The statement.', text: 'Geoffrey Grimmett’s textbook; written in Lean by me.' },
  { b: 'The checkers.', text: 'Lean, Mathlib, Comparator and nanoda: their authors.' },
  { b: 'The bridges, the continuity proof and the checks on this page.', text: 'Carlos Toledo, with Claude (Anthropic), which wrote the programs and the Lean under my direction. The continuity proof joins Anthropic’s theorems.' }
]) }));

O_.push(C.section({ lab: 'check it yourself', title: 'How to re-run it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'The record.', raw: m('node tools/record-percolation-critical.js --check') + C.esc(' re-derives every number on this page from ') + rec('corpus/percolation-critical') + C.esc(' (' + N(R.provenance.files) + ' files, each pinned by its hash) and refuses on any difference.') },
  { b: 'The records as written.', raw: C.esc('The rules sealed before each stage, every run’s log, the bridges and the statement, gaps first: ') + rec('corpus/percolation-critical/results/percolation/VERDICT.md') + '.' },
  { b: 'The follow-ups as written.', raw: C.esc('Each verdict, with what it does not say: ') + rec('corpus/percolation-critical/results/cont/VERDICT.md') + ', ' + rec('corpus/percolation-critical/results/kn3/VERDICT.md') + ', ' + rec('corpus/percolation-critical/results/kn1/VERDICT.md') + C.esc('. The rules sealed before each are beside them (') + m('PREREG-CONT.md') + ', ' + m('PREREG-KN3.md') + ', ' + m('PREREG-KN1.md') + C.esc('), with my statements, the reading sheets and the proofs. Anthropic’s and Ahmed Bou-Rabee’s own files are not copied with them: a replay fetches both repositories at the commits below.') },
  { b: 'What was checked.', raw: a(A.pins.repository + '/tree/' + A.pins.commit, 'anthropics/formal-math at ' + A.pins.commit.slice(0, 8)) + ', ' + a(O.pins.repository + '/tree/' + O.pins.commit, 'openai/math at ' + O.pins.commit.slice(0, 8)) + C.esc(' and ') + a(K1.thirdParty.repository + '/tree/' + K1.thirdParty.commit, TPR + ' at ' + K1.thirdParty.commit.slice(0, 8)) + '.' }
].concat(R.note.published ? [{ b: 'The note.', raw: C.esc(R.note.holdsFollowUps ? 'The report and the records, deposited (version ' + R.note.version.replace(/^v/, '') + '): ' : 'The report and the records as of 12 November (version ' + R.note.version.replace(/^v/, '') + ', before the follow-ups), deposited: ') + a('https://doi.org/' + R.note.doi, 'doi:' + R.note.doi) + '.' }] : [])) }));

const foot = '<p>' + C.esc('Generated by tools/build-report-percolation-critical.js from certs/percolation-critical.json (tools/record-percolation-critical.js --check). I did this with Claude agents (Anthropic); Claude wrote the programs, the bridges and the continuity proof under my direction.') + '</p>'
  + '<p>' + C.esc('git ' + (cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() || '—') + ' · cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'percolation-critical.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O_.join('\n\n'), footRaw: foot, path: '/reports/percolation-critical.html',
  og: { image: '/og-percolation-critical.png', alt: OG.alt('percolation-critical') },
  desc: 'Anthropic’s and OpenAI’s Lean proofs that critical bond percolation on ℤ^d has no infinite cluster, checked against a statement written independently from Grimmett’s textbook: both prove it, by bridges checked on two kernels, and both are checked together in a single Lean. Three follow-ups: θ proved continuous on [0, 1] in Lean on Anthropic’s library, and Kozma and Nitzan’s Conjectures 3 and 1 compared, as printed, with the Lean statements that were proved.' }));
console.log('reports/percolation-critical.html written · ' + Object.entries(R.verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
