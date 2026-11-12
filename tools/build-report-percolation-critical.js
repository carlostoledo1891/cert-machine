#!/usr/bin/env node
/* build-report-percolation-critical.js — reports/percolation-critical.html: two labs' Lean proofs that bond percolation on
   Z^d has no infinite cluster at p_c — Anthropic's (J. Leder with Claude, every d >= 2) and OpenAI's (d = 3) — checked
   against a statement written independently from Grimmett's textbook.

   THE MATHEMATICS IS NOT OURS. The proofs are the labs'; ours are the statement, the two bridges and the checks. What
   stays open comes first. Every number and verdict word is read from certs/percolation-critical.json
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

const SAYS = { bridgeA: 'CERTIFIED', bridgeO: 'CERTIFIED', replayA: 'REPLAYED', anchors: 'CERTIFIED', seam: 'READ, NOT DECIDED' };
for (const [k, v] of Object.entries(SAYS)) if (R.verdicts[k] !== v) die(k + ' is ' + R.verdicts[k] + ' in the record, and this page states ' + v);
if (!/^The proofs are Anthropic’s .* and OpenAI’s/.test(R.undecided)) die('the record no longer says first whose proofs these are');
const falsePl = R.planted.filter((p) => p.false), refusedBoth = falsePl.filter((p) => p.refusedA && p.refusedO);
if (refusedBoth.length !== falsePl.length) die('a false planted statement was not refused by both bridges');
const A = R.anthropic, O = R.openai;

/* figure 1 (the hero): the book, our statement, and the two proofs that reach it, each by a bridge we wrote */
const box = (x, y, w, h, solid) => '    <rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="var(--surface)" stroke="var(--ink)" stroke-width="' + (solid ? 2.4 : 1.6) + '"/>';
const line = (x1, y1, x2, y2, dash) => '    <line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--ink-3)" stroke-width="1.6"' + (dash ? ' stroke-dasharray="5 4"' : '') + '/>';
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
    + 'Before reading either, I wrote the statement myself from Grimmett’s textbook, and checked, with Claude, that both proofs prove it: Anthropic’s for every dimension from 2 up, OpenAI’s for dimension 3.'
}));
O_.push(C.figure({ hero: true, svgRaw: W.join('\n'), svgNarrowRaw: NW.join('\n'), record: ['certs/percolation-critical.json'],
  caption: 'What was checked. Each arrow is a Lean proof, which I call a bridge, that the lab’s theorem implies my statement. Both bridges are checked by two independent kernels, and both fail when the statement is changed to a false one.',
  stop: 'a bridge is no longer accepted by both kernels, or a false planted statement is accepted' }));
O_.push(C.stats([
  { k: 'labs’ proofs that prove my statement', v: '2 of 2', n: 'Anthropic: every d ≥ 2 · OpenAI: d = 3' },
  { k: 'kernels that accept each bridge', v: '2', n: 'Lean’s and nanoda, plus a full replay' },
  { k: 'false statements planted', v: refusedBoth.length + ' of ' + falsePl.length, n: 'refused by both bridges' },
  { k: 'rented computer time', v: 'US$' + R.money.usd.toFixed(2), sm: true, n: R.money.pods + ' machines, under 3 hours' }
]));
O_.push(C.scope('The proofs are Anthropic’s (Justin Leder with Claude) and OpenAI’s. This page checks that their Lean theorems prove a statement written independently from the textbook; it is not new mathematics, and it does not check either informal paper. The checks are mine, run with Claude (Anthropic’s AI model), which wrote the programs and the two bridges under my direction.'));

O_.push(C.section({ lab: 'read this first', title: 'What is still open', id: 'limits', bodyRaw: C.plainList([
  { b: 'Two Lean versions.', text: 'The bridge to Anthropic’s proof runs on Lean ' + A.pins.toolchain + ', the one to OpenAI’s on ' + O.pins.toolchain + '. My statement is the same file in both, byte for byte. Of the ' + N(R.seam.common) + ' definitions it reaches in both, ' + N(R.seam.identical) + ' are identical; the rest differ by Mathlib’s own changes between the versions. That the statement means the same in both is a careful reading, not a kernel check.' },
  { b: 'Not the papers.', text: 'This checks the Lean statements against the textbook’s definitions. It does not check either lab’s informal argument, or Kozma and Nitzan’s reduction as printed.' },
  { b: 'Anthropic’s proof is not on its repository’s main branch.', text: 'It is reachable only by its commit hash (the pull request was closed the same day); I pinned that commit by its hash.' },
  { b: 'The same model family.', text: 'The bridge to Anthropic’s proof was written by Claude, Anthropic’s model. The kernels decide, not the model; you should still know.' },
  { b: 'Lean and Mathlib are trusted,', text: 'as in any check of this kind.' }
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

O_.push(C.section({ lab: '4 · planted errors', title: 'What would have caught a wrong statement', id: 'planted', bodyRaw: C.plainList(R.planted.map((p) => ({
  b: p.id + ' · ' + p.what + '.',
  text: p.false ? (p.provedFalse ? 'False, and proved false in Lean in the same environment. Both bridges fail on it.' : 'False. Both bridges fail on it.')
    : 'Still true, as it turned out, so its failure shows only that the bridges depend on how p_c is written. Not counted as a refusal; R4 replaced it.'
}))) }));

O_.push(C.section({ lab: 'the method', title: 'How it was done', id: 'method', bodyRaw: C.plainList([
  { b: 'Rules first.', text: 'The rules for each stage were written and sealed before the stage ran: a salted fingerprint of the private work, posted to a public registry and to Bitcoin, which proves the date without showing the content (' + R.seals.length + ' seals). Each departure from the rules is listed in the records.' },
  { b: 'Written by agents, checked by me.', text: 'Claude agents wrote the two bridges on a rented machine. I rebuilt both, listed their axioms and ran both kernels and the full replays myself.' },
  { b: 'Size.', text: 'One day, 12 November 2026: a laptop and ' + R.money.pods + ' rented machines, about US$' + R.money.usd.toFixed(2) + '.' }
]) }));

O_.push(C.section({ lab: 'who did what', title: 'Each step is a separate job', id: 'roles', bodyRaw: C.plainList([
  { b: 'The proofs.', text: 'Anthropic (Justin Leder with Claude) and OpenAI. Both build on Kozma and Nitzan’s reduction.' },
  { b: 'The statement.', text: 'Geoffrey Grimmett’s textbook; written in Lean by me.' },
  { b: 'The checkers.', text: 'Lean, Mathlib, Comparator and nanoda: their authors.' },
  { b: 'The bridges and the checks on this page.', text: 'Carlos Toledo, with Claude (Anthropic), which wrote the programs and the Lean under my direction.' }
]) }));

O_.push(C.section({ lab: 'check it yourself', title: 'How to re-run it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'The record.', raw: m('node tools/record-percolation-critical.js --check') + C.esc(' re-derives every number on this page from ') + rec('corpus/percolation-critical') + C.esc(' (' + R.provenance.files + ' files, each pinned by its hash) and refuses on any difference.') },
  { b: 'The records as written.', raw: C.esc('The rules sealed before each stage, every run’s log, the bridges and the statement, gaps first: ') + rec('corpus/percolation-critical/results/percolation/VERDICT.md') + '.' },
  { b: 'What was checked.', raw: a(A.pins.repository + '/tree/' + A.pins.commit, 'anthropics/formal-math at ' + A.pins.commit.slice(0, 8)) + C.esc(' and ') + a(O.pins.repository + '/tree/' + O.pins.commit, 'openai/math at ' + O.pins.commit.slice(0, 8)) + '.' }
].concat(R.note.published ? [{ b: 'The note.', raw: C.esc('The report and the records, deposited: ') + a('https://doi.org/' + R.note.doi, 'doi:' + R.note.doi) + '.' }] : [])) }));

const foot = '<p>' + C.esc('Generated by tools/build-report-percolation-critical.js from certs/percolation-critical.json (tools/record-percolation-critical.js --check). I did this with Claude agents (Anthropic); Claude wrote the programs and the bridges under my direction.') + '</p>'
  + '<p>' + C.esc('git ' + (cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() || '—') + ' · cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'percolation-critical.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O_.join('\n\n'), footRaw: foot, path: '/reports/percolation-critical.html',
  og: { image: '/og-percolation-critical.png', alt: OG.alt('percolation-critical') },
  desc: 'Anthropic’s and OpenAI’s Lean proofs that critical bond percolation on ℤ^d has no infinite cluster, checked against a statement written independently from Grimmett’s textbook: both prove it, by bridges checked on two kernels.' }));
console.log('reports/percolation-critical.html written · ' + Object.entries(R.verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
