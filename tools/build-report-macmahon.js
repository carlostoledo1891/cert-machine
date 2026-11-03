#!/usr/bin/env node
/* build-report-macmahon.js — reports/macmahon.html: Jason Davies's classification of the minimum universal sets of
   MacMahon cubes (2026-11-01; GPT-6 Astra + Lean 4; the Johnson–Roldán conjectures), decided here twice with no code
   shared with the claimant — the sufficiency half from the 300 released witnesses with our own geometry
   (certs/macmahon-witnesses.json) and the whole classification through Comparator with nanoda on a hosted runner
   (certs/macmahon-kernel.json). Both records are re-checked before a word is written. The gaps lead.

   usage: node tools/build-report-macmahon.js                                                                       MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('MACMAHON PAGE REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const short = (h) => String(h).slice(0, 12) + '…';
const num = (n) => Number(n).toLocaleString('en-US');
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const WREC = 'certs/macmahon-witnesses.json', KREC = 'certs/macmahon-kernel.json';

for (const [cmd, args, want] of [['python3', ['-I', 'instruments/macmahon/check.py', '--check'], /PASS/], ['node', ['tools/record-macmahon-kernel.js', '--check'], /PASS/]]) {
  let out = '';
  try { out = cp.execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die(args.join(' ') + ' refused: ' + (e.stdout || '') + (e.stderr || '')); }
  if (!want.test(out)) die(args.join(' ') + ' did not pass: ' + out.trim());
}
const W = JSON.parse(fs.readFileSync(path.join(ROOT, WREC), 'utf8'));
const K = JSON.parse(fs.readFileSync(path.join(ROOT, KREC), 'utf8'));
const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'macmahon', 'PINS.json'), 'utf8'));
if (W.verdict !== 'CERTIFIED' || K.verdict !== 'CERTIFIED') die('a record is not CERTIFIED; the page says both are');
if (W.facts.T3.constructions !== 300 || W.facts.T3.built !== 300 || W.facts.T2.two_triangle_sets !== 10 || W.facts.T1.rotation_classes !== 30) die('the witness facts moved');
if (!K.theorems || K.theorems.length !== 10 || !K.comparator.okay || !K.comparator.nanodaAnswered) die('the kernel facts moved');
const PERMITTED = ['propext', 'Classical.choice', 'Quot.sound'];
for (const t of K.theorems) if (!K.axioms[t] || !K.axioms[t].every((a) => PERMITTED.includes(a))) die('an axiom outside the three: ' + t);
const pin = K.source.commit;

/* the ten two-triangle sets: the partitions of {A..F} into two triples — derived here, the same count the record decided (T2) */
const LABELS = 'ABCDEF'.split('');
const parts = [];
for (let i = 1; i < 6; i++) for (let j = i + 1; j < 6; j++) parts.push([['A', LABELS[i], LABELS[j]], LABELS.filter((x) => x !== 'A' && x !== LABELS[i] && x !== LABELS[j])]);
if (parts.length !== 10) die('ten partitions expected');
function tableauSvg() {
  const w = 1000, h = 250, r = 36, cx0 = 60, step = 98;
  const out = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="Ten small hexagons of the labels A to F; in each, two disjoint triangles join one triple of labels and its complement: the ten minimum universal collections of MacMahon cubes." style="font-family:var(--f-mono);font-size:12px">'];
  parts.forEach((p, k) => {
    const cx = cx0 + k * step, cy = 128;
    const pos = {};
    LABELS.forEach((L, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; pos[L] = [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
    p.forEach((tri, s) => {
      const pts = tri.map((L) => pos[L].map((v) => v.toFixed(1)).join(',')).join(' ');
      out.push('<polygon points="' + pts + '" fill="' + (s ? 'var(--c-3)' : 'var(--c-1)') + '" fill-opacity="0.14" stroke="' + (s ? 'var(--c-3)' : 'var(--c-1)') + '" stroke-width="2" stroke-linejoin="round"/>');
    });
    LABELS.forEach((L) => out.push('<circle cx="' + pos[L][0].toFixed(1) + '" cy="' + pos[L][1].toFixed(1) + '" r="9" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.2"/><text x="' + pos[L][0].toFixed(1) + '" y="' + (pos[L][1] + 4).toFixed(1) + '" text-anchor="middle" fill="var(--ink)">' + L + '</text>'));
    out.push('<text x="' + cx + '" y="' + (cy + r + 40) + '" text-anchor="middle" fill="var(--ink-3)">' + p[0].join('') + ' | ' + p[1].join('') + '</text>');
  });
  out.push('<text x="' + cx0 + '" y="24" fill="var(--ink-4)">each triangle: the six varieties whose two tableau labels both lie in that triple; twelve cubes, every variety buildable</text>');
  out.push('</svg>');
  return out.join('\n');
}

const OUT = [];
OUT.push(C.header({
  eyebrow: 'cert-machine · a classification by an AI, decided twice',
  title: 'The ten minimum universal sets of MacMahon cubes: a classification decided twice',
  deck: 'A MacMahon cube is coloured with six colours, one per side; thirty varieties exist up to rotation. A collection is universal when, for every variety, eight of its cubes assemble into a 2×2×2 model with that variety\'s exterior. '
    + 'Haraguchi proved twelve cubes are the minimum; Johnson and Roldán conjectured in 2024 that exactly ten collections attain it. On 1 November 2026 Jason Davies published a proof, written by GPT-6 Astra and checked in Lean 4, with the witnesses and the search released. '
    + 'It was decided here twice, at commit ' + short(pin) + ', with no code shared with the claimant: the sufficiency half from the 300 released constructions with our own geometry, and the whole classification through two independent kernels. The gaps come first.'
}));
OUT.push(C.scope('Published, not peer-reviewed. The theorems are the kernel\'s: the lane below re-checks the build, that the ten stated theorems are the proved ones, and the axioms, under Lean\'s kernel and nanoda; the mathematics beyond what a kernel checks is not claimed here. '
  + 'The sufficiency check uses the claimant\'s table of thirty colourings as the labelling convention, after deciding that it lists every variety exactly once; everything else in it is ours. The claimant was told after this page was built.'));
OUT.push(C.tldr({
  findingRaw: '<b>The classification holds, twice over.</b> Every one of the ' + num(W.facts.T3.constructions) + ' released constructions builds its target under our rotations and slots, the ten witnessed sets are exactly the ten two-triangle sets, and the label table lists all ' + W.facts.T1.rotation_classes + ' varieties once (sufficiency, from the bytes). '
    + 'The repository at the commit the Palomar registry names builds with its own toolchain, Comparator finds each of the ten theorems stating what the Mathlib-only challenge states, both kernels accept the proofs, and our own axiom report names nothing beyond propext, Classical.choice and Quot.sound (the whole theorem, through the kernels). The statement reads as the paper\'s Theorem 1.',
  mechanismRaw: 'Our own 24 proper rotations from signed axis permutations of determinant +1, our own eight corner slots, a perfect matching of cubes to slots searched here; the claimant\'s rotation indices, slot order, verifier and search ignored or read, never run. '
    + 'Then leanprover/comparator v4.35.0 with nanoda switched on, on the configuration the repository ships, on a hosted runner; the axioms printed from our file.',
  checkRaw: m('python3 instruments/macmahon/check.py --check') + ' re-derives the sufficiency record from the pinned witnesses; ' + m('node tools/record-macmahon-kernel.js --check') + ' re-reads the kernel record from the run\'s artifact; ' + m('gh workflow run macmahon-kernel.yml') + ' runs the lane again.'
}));
OUT.push(C.stats([
  { k: 'constructions built', v: num(W.facts.T3.built) + ' of ' + num(W.facts.T3.constructions), n: 'ten sets × thirty targets, each a perfect matching under our 24 rotations and 8 slots' },
  { k: 'varieties in the table', v: String(W.facts.T1.rotation_classes) + ' of ' + String(W.facts.T1.classes_of_all_720_colourings), n: 'six distinct colours each; pairwise inequivalent under rotation; every class once' },
  { k: 'minimum sets', v: String(W.facts.T2.two_triangle_sets), n: 'the ten partitions of six labels into two triples, exactly' },
  { k: 'theorems through two kernels', v: String(K.theorems.length), n: K.comparator.kernels.join('; ') + '; axioms the three standard ones' },
  { k: 'red controls', v: String(W.red_controls.length), n: 'a cube from outside the set, a target with two faces exchanged, reflections admitted: each refused' }
]));

/* §1 the gaps */
OUT.push(C.section({
  lab: '§1 · the gaps', title: 'What is taken on the paper\'s word, and what is not decided here',
  bodyRaw: C.table({ cols: [{ h: 'gap' }, { h: 'status' }, { h: 'where it is decided, if anywhere' }], rows: [
    ['The physical cubes are modelled discretely: six face directions, rotations as signed-axis permutations of determinant +1, a model\'s exterior as the outward faces of eight corner slots. That this is what "building a 2×2×2 model, exteriors only" means is the paper\'s declaration, and the reader\'s.', 'read, not decided', 'the challenge\'s own theorems certify the tables against that model (proper_rotation_iff, exposed_face_rule); the model itself is a convention'],
    ['The necessity half — no other 12-multiset and no 11-multiset is universal — rests on the Lean proof: here it is decided through two kernels, not by an independent search.', 'decided by the kernel lane only', KREC + ' (an independent exhaustive search is the stage not run)'],
    ['The Palomar registry entry names commit d8856c9; the repository\'s HEAD on 3 November is one commit later, changing only the paper\'s date, its PDF and a figure script.', 'read', 'corpus/macmahon/PINS.json: every Lean and configuration file identical at both commits'],
    ['Priority beyond the cited sources is not established by the claimant (formalization.yaml says so) and not examined here.', 'not examined', '—'],
  ] })
}));

/* §2 the claim */
OUT.push(C.section({
  lab: '§2 · the claim', title: 'Thirty cubes, twelve at a time',
  bodyRaw: C.pRaw('Conway\'s tableau names each variety by an ordered pair of distinct labels from A to F; the labels are not colours. The claim: a collection of twelve cubes is universal exactly when it is one copy of each variety whose two labels lie in the same triple of a partition of the six labels into two triples — the two disjoint triangles below — and there are ten such partitions, so ten minimum collections, none with a repeated variety, even when repeats are allowed.')
    + C.figure({ svgRaw: tableauSvg(), record: WREC, wide: true, stop: 'the ten witnessed sets are no longer the ten two-triangle sets, or a construction fails to build its target',
      caption: 'The ten minimum universal collections, one per partition of the six labels into two triples. Each triangle stands for the six ordered pairs inside its triple; the twelve cubes build every one of the thirty varieties.' })
}));

/* §3 sufficiency */
const T = W.facts;
OUT.push(C.section({
  lab: '§3 · sufficiency, from the bytes', title: 'The 300 released constructions, re-decided with our own geometry',
  bodyRaw: C.pRaw('The claimant releases, for each of the ten sets and each of the thirty targets, the eight cubes used. ' + m('instruments/macmahon/check.py') + ' (standard library) ignores his rotation indices and slot order: it builds the 24 proper rotations from the signed axis permutations of determinant +1, the eight corner slots as the sign patterns of three axes, and asks whether the eight cubes admit rotations and a one-to-one assignment to slots with every exposed face the target\'s colour, by a backtracking match. '
    + 'First it decides that the label table is a table of all thirty varieties: six distinct colours on every entry, thirty rotation classes, the same thirty as the 720 colourings of a cube give.')
    + C.table({ cols: [{ h: 'fact' }, { h: 'decided' }, { h: 'word' }], rows: [
      ['T1 · the label table', T.T1.labels + ' labelled colourings; ' + T.T1.rotation_classes + ' rotation classes, equal to the ' + T.T1.classes_of_all_720_colourings + ' classes of all colourings', { raw: C.tag(T.T1.verdict, T.T1.verdict === 'CERTIFIED' ? 'held' : 'dep') }],
      ['T2 · the ten sets', T.T2.sets + ' witnessed sets, ' + T.T2.distinct_sets + ' distinct, ' + T.T2.two_triangle_sets + ' two-triangle sets of the ' + T.T2.partitions_of_six_into_two_triples + ' partitions', { raw: C.tag(T.T2.verdict, T.T2.verdict === 'CERTIFIED' ? 'held' : 'dep') }],
      ['T3 · the constructions', num(T.T3.built) + ' of ' + num(T.T3.constructions) + ' build their target', { raw: C.tag(T.T3.verdict, T.T3.verdict === 'CERTIFIED' ? 'held' : 'dep') }],
    ] })
    + C.pRaw('<b>Red controls.</b> ' + C.esc(W.red_controls.map((r) => r.red + (r.fired ? ' (fired)' : ' (DEAD)')).join('. ')) + '.')
}));

/* §4 the kernel lane */
OUT.push(C.section({
  lab: '§4 · the kernel lane', title: 'The ten theorems, under two kernels',
  bodyRaw: C.pRaw('The repository ships a Comparator challenge: ' + m('Challenge.lean') + ' states the ten theorems with sorry and imports only Mathlib; ' + m('Solution.lean') + ' proves them. On a hosted runner (' + m('.github/workflows/macmahon-kernel.yml') + ', run ' + C.esc(String(K.source.run)) + ') the repository at ' + short(pin) + ' was built with its own toolchain (Lean v4.35.0, Mathlib v4.35.0; cache ' + num(K.comparator.cacheSeconds) + ' s, build ' + num(K.comparator.buildSeconds) + ' s) and audited by leanprover/comparator v4.35.0 with nanoda on, in ' + num(K.comparator.seconds) + ' s. '
    + 'Comparator checks that each named theorem states exactly what the challenge states and replays the proofs; then ' + m('#print axioms') + ' of the ten, from our own file.')
    + C.table({ cols: [{ h: 'theorem' }, { h: 'axioms (our report)' }], rows: K.theorems.map((t) => [t.replace(/^MacMahon\./, ''), K.axioms[t].join(', ')]) })
    + C.pRaw('<b>What the kernels said.</b> ' + C.esc(K.comparator.kernels.join('; ')) + '; ' + C.esc(K.why) + '.')
}));

/* §5 the reading */
OUT.push(C.section({
  lab: '§5 · the statement, read', title: 'Does the Lean statement say what the paper says?',
  bodyRaw: C.pRaw(C.esc(K.reading.what) + ' Word: ' + K.reading.word + '.') + C.plainList(K.reading.points.map((p, i) => ({ b: String(i + 1) + '.', text: p })))
}));

/* §6 the limits */
OUT.push(C.section({
  lab: '§6 · what is claimed, and what is not', title: 'The limits',
  bodyRaw: C.plainList([
    { b: 'Claimed.', text: 'That the ten released sets are universal, decided from the bytes with our own geometry; that the repository builds at the named commit, that its ten theorems are the ones proved, that two kernels accept the proofs under the three standard axioms; that the Lean statement reads as the paper\'s theorem.' },
    { b: 'Used, not re-proved.', text: 'The discrete model of the cubes the paper declares; Lean\'s kernel and nanoda; Comparator\'s statement matching; the claimant\'s label table as the naming convention, after deciding it lists every variety once.' },
    { b: 'Not claimed.', text: 'Any independent proof of necessity; priority; anything about how the proof was found.' },
    { b: 'Independence.', text: 'From the claimant: his verifier and search were read, never run, and no code here derives from them. Not from the operator (one).' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-macmahon.js from ' + WREC + ' (' + W.generated.slice(0, 10) + ', sha256 ' + short(sha(WREC)) + ') and ' + KREC + ' (' + K.generated + ', sha256 ' + short(sha(KREC)) + '), both re-checked at build; the repository pinned at ' + pin + ' (corpus/macmahon/PINS.json, ' + Object.keys(P.files).length + ' files).') + '</p>'
  + '<p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'macmahon.html'), TPL.render({
  title: 'The ten minimum universal sets of MacMahon cubes: a classification decided twice · cert-machine', bodyRaw: OUT.join('\n\n'), footRaw: foot,
  desc: 'Jason Davies\'s classification of the minimum universal sets of MacMahon cubes (GPT-6 Astra + Lean 4, 1 November 2026; the Johnson–Roldán conjectures) decided twice with no code shared with the claimant: the 300 released constructions re-built with our own geometry, and the ten theorems replayed through Lean\'s kernel and nanoda with our own axiom report; the gaps first.',
  path: '/reports/macmahon.html'
}));
console.log('reports/macmahon.html written: ' + W.facts.T3.built + '/' + W.facts.T3.constructions + ' constructions, ' + K.theorems.length + ' theorems ' + K.verdict + ' @ git ' + git);
