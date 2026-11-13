#!/usr/bin/env node
/* build-report-macmahon.js — reports/macmahon.html: Jason Davies's classification of the minimum universal sets of
   MacMahon cubes (2026-11-01; developed with GPT-6 Astra, in Lean 4; the Johnson–Roldán conjectures), checked here two
   ways that share no code with each other: the 300 released constructions rebuilt by our own program
   (certs/macmahon-witnesses.json, instruments/macmahon/check.py) and the ten Lean theorems accepted by two kernels on a
   hosted runner (certs/macmahon-kernel.json, .github/workflows/macmahon-kernel.yml).

   THE MATHEMATICS IS NOT OURS. The result and the proof are Jason Davies's; the conjectures are Johnson and Roldán's.
   What stays open comes first. Every number, verdict word, date, count and name on the page is read from the two
   records, the pins (corpus/macmahon/PINS.json) or the pinned files they name (the author's formalization.yaml, his
   released witnesses), and the build refuses when one of them stops saying what the page states. Both records are
   re-checked before a word is written.

   usage: node tools/build-report-macmahon.js                                                                       MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));   /* the page's own light art card (og-macmahon.png) */
const die = (msg) => { console.error('MACMAHON PAGE REFUSED: ' + msg); process.exit(1); };
const need = (ok, msg) => { if (!ok) die(msg); };
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const WREC = 'certs/macmahon-witnesses.json', KREC = 'certs/macmahon-kernel.json', PREC = 'corpus/macmahon/PINS.json';
const day = (iso) => { const d = new Date(iso + 'T00:00:00Z'); return d.getUTCDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };

/* both records re-checked first: the sufficiency record re-derived from the pinned witnesses, the kernel record re-read
   from the run's saved output */
for (const [cmd, args] of [['python3', ['-I', 'instruments/macmahon/check.py', '--check']], ['node', ['tools/record-macmahon-kernel.js', '--check']]]) {
  let out = '';
  try { out = cp.execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die(args.join(' ') + ' refused: ' + (e.stdout || '') + (e.stderr || '')); }
  need(/^PASS/.test(out), args.join(' ') + ' did not pass: ' + out.trim());
}
const W = JSON.parse(fs.readFileSync(path.join(ROOT, WREC), 'utf8'));
const K = JSON.parse(fs.readFileSync(path.join(ROOT, KREC), 'utf8'));
const P = JSON.parse(fs.readFileSync(path.join(ROOT, PREC), 'utf8'));

/* ---- the words this page states, each read back from a record ---- */
need(W.verdict === 'CERTIFIED' && K.verdict === 'CERTIFIED', 'a record is not CERTIFIED, and this page says both are');
need(W.decided.sufficiency === 'CERTIFIED' && /^NOT DECIDED HERE/.test(W.decided.necessity), 'the witness record no longer says: sufficiency CERTIFIED, necessity NOT DECIDED HERE');
need(K.decided.kernel === 'CERTIFIED' && K.decided.mathematics === 'not decided here beyond what a kernel is', 'the kernel record no longer limits itself to what a kernel is');
need(/concordance with the claimant's CI and the registry's check/.test(K.what), 'the kernel record no longer calls itself a concordance with the claimant\'s CI and the registry\'s check');
const T = W.facts;
need(T.T1.verdict === 'CERTIFIED' && T.T2.verdict === 'CERTIFIED' && T.T3.verdict === 'CERTIFIED', 'a witness fact is not CERTIFIED');
need(T.T1.six_distinct_colours_each === true && T.T1.labels === T.T1.rotation_classes && T.T1.rotation_classes === T.T1.classes_of_all_720_colourings, 'T1 no longer says the table lists every variety once');
need(T.T2.sets === T.T2.distinct_sets && T.T2.sets === T.T2.two_triangle_sets && T.T2.sets === T.T2.partitions_of_six_into_two_triples, 'T2 no longer says the released sets are exactly the two-triangle sets');
need(T.T3.built === T.T3.constructions && T.T3.failed.length === 0 && T.T3.constructions === T.T2.sets * T.T1.labels, 'T3 no longer says every construction (sets × targets) was built');
const ROTS = (/our (\d+) proper rotations/.exec(W.what) || [])[1];
need(ROTS && /our eight corner slots/.test(W.what) && /the claimant's rotation indices and slot order ignored/.test(W.what), 'the witness record no longer describes our own rotations and slots');
const REDS = W.red_controls;
need(REDS.length === 3 && REDS.every((r) => r.fired) && W.reds_dead.length === 0 && W.failed.length === 0, 'a red control did not fire');
need(/swapped for a cube outside the set/.test(REDS[0].red) && /target with two faces exchanged/.test(REDS[1].red), 'the first two red controls are no longer the ones this page describes');
const REFL = /admits reflections \((\d+) maps\) merges the (\d+) varieties into (\d+)/.exec(REDS[2].red);
need(REFL && Number(REFL[2]) === T.T1.labels, 'the third red control is no longer the reflections one');

need(K.theorems.length === 10 && K.comparator.exit === 0 && K.comparator.okay === true && K.comparator.nanodaRequested && K.comparator.nanodaAnswered, 'the kernel facts moved');
need(K.comparator.kernels.length === 2 && /^Lean default kernel accepts/.test(K.comparator.kernels[0]) && /^nanoda kernel accepts/.test(K.comparator.kernels[1]), 'the two kernels no longer both accept');
const STD = ['propext', 'Classical.choice', 'Quot.sound'];
need(K.axiomsExit === 0 && [...K.permittedAxioms].sort().join() === [...STD].sort().join(), 'the permitted axioms are no longer the three standard ones');
for (const t of K.theorems) need(K.axioms[t] && K.axioms[t].length && K.axioms[t].every((x) => STD.includes(x)), 'an axiom outside the three under ' + t);
const FEWER = K.theorems.filter((t) => K.axioms[t].length < 3);
need(FEWER.length === 1 && K.axioms[FEWER[0]].join() === 'propext', 'the theorem resting on propext alone moved');
const LEANV = (/Lean v(\d+\.\d+\.\d+), Mathlib v(\d+\.\d+\.\d+)/.exec(K.what) || []);
const COMPV = (/leanprover\/comparator v(\d+\.\d+\.\d+) with nanoda on/.exec(K.what) || [])[1];
need(LEANV[1] && LEANV[2] && COMPV && K.env.includes('Lean (version ' + LEANV[1] + ','), 'the toolchain versions are no longer in the kernel record');
need(/nanoda build: stack1g/.test(K.env), 'the nanoda build is no longer the declared one (stack raised to 1 GiB)');
need(K.reading.word === 'MATCHES' && /a reading, not a decision/.test(K.reading.what) && /the paper's Theorem 1/.test(K.reading.what) && K.reading.points.length === 6, 'the statement reading moved');
need(/^Not in the Lean statement: the physical cubes themselves/.test(K.reading.points[5]), 'the reading no longer names the discrete model as the step taken on the paper\'s word');

need(K.source.commit === P.registered_commit && W.source.registered_commit === P.registered_commit && W.source.commit === P.commit && P.commit !== P.registered_commit, 'the pinned commits moved');
/* what is the same at the two commits: only what a machine held. The pins say every Lean and configuration file is the
   registered bytes, and the kernel run asserts it (each such file at the registered commit against the digest pinned at
   the later one). The pins' own list of what the diff touches is NOT repeated on the page: GitHub's compare shows README.md
   and formalization.yaml in it too (read 2026-11-12), which that sentence leaves out. */
need(/every \.lean, comparator\.json, lakefile\.toml and lake-manifest\.json are the registered bytes/.test(P.lean_files_identical_at_registered_commit), 'the pins no longer say the Lean and configuration files are the registered bytes');
need(/READ, never run/.test(P.what), 'the pins no longer say the claimant\'s verifier and search were read, never run');
const PALOMAR = (/PALOMAR-\d{4}-\d{2}-\d{2}-\d+/.exec(P.what) || [])[0];
need(PALOMAR, 'the pins no longer name the Palomar entry');
const CLAIMED = (/\(Jason Davies, (\d{4}-\d{2}-\d{2})\)/.exec(W.what) || [])[1];
need(CLAIMED && K.what.includes('(Jason Davies, ' + CLAIMED + ')') && /Johnson–Roldán Conjectures 4 and 8/.test(W.claim), 'the records no longer name the claimant, the date and the conjectures');
need(W.generated.slice(0, 10) === K.generated && K.generated === P.pinned, 'the two records and the pins are no longer of one day');
const CHECKED = day(K.generated);
need(P.what.includes('HEAD on ' + P.pinned), 'the pins no longer say which commit was newest on the day they were taken');
/* the numbers the title, the headings and the description state in words */
const WORD = { 10: 'ten', 12: 'twelve', 30: 'thirty' };
const word = (n) => WORD[n] || die('no word for ' + n + ': the title and the headings state ten, twelve and thirty');
need(T.T2.sets === 10 && T.T1.labels === 30 && T.T3.constructions === 300 && K.theorems.length === 10, 'the counts the title and the headings state in words moved (ten sets, thirty cubes, 300 constructions, ten theorems)');
need('classes_of_all_720_colourings' in T.T1 && /2×2×2 models of all 30 varieties, exteriors only, repeats allowed/.test(W.claim), 'the claim as the record words it moved');
need(/no other 12-multiset and no 11-multiset is universal/.test(W.what), 'the witness record no longer names the half it does not decide');
need(K.theorems.includes('MacMahon.physical_minimum_has_no_repeats') && K.theorems.includes('MacMahon.physical_exactly_ten') && K.theorems.includes('MacMahon.minimum_size'), 'a main theorem left the list');
/* the workflow, for what the page says of the run: a hosted machine, nanoda switched on as the one change, its stack raised */
const WF = fs.readFileSync(path.join(ROOT, K.source.workflow), 'utf8');
need(WF.includes("assert got == want, 'the pinned file moved at the registered commit: ' + f"), 'the kernel run no longer holds the Lean and configuration files to the pinned digests');
need(/runs-on: ubuntu-24\.04/.test(WF) && WF.includes("c['enable_nanoda'] = True") && /nanoda — the independent Rust kernel/.test(WF) && /STACK_SIZE: usize = 1_073_741_824/.test(WF) && WF.includes('CLAIM_PIN: ' + P.registered_commit), 'the workflow no longer runs what this page describes');

/* the pinned files the page quotes: the author's own disclosure and his released sets, each held to its pinned digest */
const pinned = (rel) => { need(sha('corpus/macmahon/' + rel) === P.files[rel], 'a pinned file moved: ' + rel); return fs.readFileSync(path.join(ROOT, 'corpus', 'macmahon', rel), 'utf8'); };
const F = pinned('formalization.yaml').replace(/\s+/g, ' ');
const says = (re, what) => need(re.test(F), 'the author\'s formalization.yaml no longer says: ' + what);
says(/authors: \["Jason Davies"\]/, 'the author is Jason Davies');
says(/GPT-6-Astra \(OpenAI\), used through Codex, developed the research argument, code, Lean proofs and manuscript under the human author's direction/, 'GPT-6 Astra developed the argument, code, Lean proofs and manuscript under his direction');
says(/Claude Opus 5\.5 \(Anthropic\), used through Claude Code, contributed to paper review/, 'a Claude model contributed to paper review');
says(/authors: \["Inga Johnson", "Erika Roldán"\] id: "https:\/\/arxiv\.org\/abs\/2407\.13208v1"/, 'the conjectures are Johnson and Roldán\'s (arXiv:2407.13208)');
says(/Conjectures 4 and 8/, 'Conjectures 4 and 8');
says(/authors: \["Kazuya Haraguchi"\] id: "https:\/\/arxiv\.org\/abs\/1408\.3696v2"/, 'Haraguchi\'s paper');
says(/Prior lower bound of twelve and a minimum universal construction/, 'the lower bound of twelve is Haraguchi\'s');
says(/status: "self-assessed; not independently reviewed by a human expert"/, 'self-assessed, not independently reviewed');
says(/Publication priority beyond the cited sources has not been established independently/, 'priority not established');
says(/The formal proof uses a different route from the written support-graph and general construction arguments/, 'the Lean proof takes a different route from the written one');
says(/target-count histograms for sizes eight through thirteen and the minimum size for exactly twenty-nine targets are computational results in the paper, not formalized theorems/, 'the histograms are not Lean theorems');
says(/Source of the ten-set conjecture, the two-triangle characterization, and the tableau convention/, 'Johnson and Roldán are the source of the conjecture and the two-triangle description');
says(new RegExp('The full Palomar mechanical verification passed at commit ' + P.registered_commit.slice(0, 7) + ', registered as ' + PALOMAR), 'Palomar\'s check passed at the registered commit');
says(/The source conjecture concerns sets of distinct varieties\. The theorem is stronger: arbitrary natural-number multiplicities are allowed/, 'the theorem also covers repeats');

/* the ten released sets, read from the pinned witness file and held to the ten splits of six letters into two triples
   (the record's T2, re-derived here for the drawing) */
const LET = 'ABCDEF'.split('');
const key = (tri) => [...tri].sort().join('');
const SETS = JSON.parse(pinned('results/universal_witnesses.json')).map((w) => {
  const cubes = new Set(w.cubes);
  let split = null;
  for (let i = 1; i < 6; i++) for (let j = i + 1; j < 6; j++) {
    const t = ['A', LET[i], LET[j]], u = LET.filter((x) => !t.includes(x));
    const want = [t, u].flatMap((tri) => tri.flatMap((p) => tri.filter((q) => q !== p).map((q) => p + q.toLowerCase())));
    if (want.length === cubes.size && want.every((c) => cubes.has(c))) split = [t, u];
  }
  need(split, 'a released set is not a split into two triples: ' + w.cubes.join(' '));
  need(Object.keys(w.targets).length === T.T1.labels, 'a released set is not witnessed for every target');
  return { cubes, split, name: key(split[0]) + ' | ' + key(split[1]) };
}).sort((x, y) => x.name < y.name ? -1 : 1);
need(SETS.length === T.T2.sets && new Set(SETS.map((s) => s.name)).size === T.T2.sets, 'the released sets are no longer ' + T.T2.sets + ' different splits');
const SIZE = SETS[0].cubes.size;
need(SETS.every((s) => s.cubes.size === SIZE) && /12-cube collections/.test(W.claim) && SIZE === 12, 'a released set does not have twelve cubes');
const SHOWN = SETS.find((s) => s.name === 'ABC | DEF');
need(SHOWN, 'the set ABC | DEF is not among the released sets');

/* ---- the hero: the 30 cubes as Conway's table, one set of twelve filled, and the ten sets as two triangles each.
   Every mark is drawn solid: the table and the ten sets are decided (T1, T2), and nothing here is a float or a pick. ---- */
const L = (x, y, text, cls, anchor) => C.label({ x, y, text, cls, anchor });
function grid(gx, gy, cell, gap) {
  const o = [], pitch = cell + gap;
  LET.forEach((R, i) => {
    o.push(L(gx - 14, gy + i * pitch + cell / 2 + 4, R, 't-ax', 'middle'), L(gx + i * pitch + cell / 2, gy - 10, R.toLowerCase(), 't-ax', 'middle'));
    LET.forEach((Q, j) => {
      if (i === j) return;
      const on = SHOWN.cubes.has(R + Q.toLowerCase());
      o.push('    <rect x="' + (gx + j * pitch) + '" y="' + (gy + i * pitch) + '" width="' + cell + '" height="' + cell + '" rx="4" fill="var(' + (on ? '--ink' : '--surface') + ')" stroke="var(' + (on ? '--ink' : '--ink-3') + ')" stroke-width="1.6"/>');
    });
  });
  return o;
}
function hexagon(cx, cy, r, s) {
  const o = [], pos = {};
  LET.forEach((X, i) => { const th = -Math.PI / 2 + i * Math.PI / 3; pos[X] = [cx + r * Math.cos(th), cy + r * Math.sin(th), cx + (r + 13) * Math.cos(th), cy + (r + 13) * Math.sin(th) + 4]; });
  s.split.forEach((tri, k) => o.push('    <polygon points="' + tri.map((X) => pos[X][0].toFixed(1) + ',' + pos[X][1].toFixed(1)).join(' ') + '" fill="' + (k ? 'none' : 'var(--ink)') + '"' + (k ? '' : ' fill-opacity="0.16"') + ' stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>'));
  LET.forEach((X) => o.push(L(pos[X][2], Number(pos[X][3].toFixed(1)), X, 't-ax', 'middle')));
  o.push(L(cx, cy + r + 36, s.name, 't-ax', 'middle'));
  return o;
}
const HALT = 'Left, a grid with rows A to F and columns a to f. Its ' + T.T1.labels + ' cells off the diagonal are the ' + T.T1.labels + ' cubes; ' + SIZE + ' of them, two blocks of six, are filled: the set ABC | DEF. '
  + 'Right, ' + T.T2.sets + ' small hexagons with corners A to F; in each, two triangles join one triple of letters and the other triple: the ' + T.T2.sets + ' sets.';
const tally = T.T2.sets + ' sets × ' + T.T1.labels + ' cubes to build = ' + T.T3.constructions + ' constructions, ' + T.T3.built + ' rebuilt';
const HW = [C.svgOpen({ w: 900, h: 356, alt: HALT })];
HW.push(L(0, 18, 'the ' + T.T1.labels + ' cubes, each named by two letters', 't-lab'));
HW.push(...grid(34, 64, 30, 6));
HW.push(L(0, 304, 'filled: one set of ' + SIZE + ', ABC | DEF', 't-ax'), L(0, 326, 'hollow: the other ' + (T.T1.labels - SIZE) + ' cubes', 't-ax'));
HW.push(L(330, 18, 'the ' + T.T2.sets + ' sets of ' + SIZE + ': every split of six letters into two triples', 't-lab'));
SETS.forEach((s, k) => HW.push(...hexagon(387 + (k % 5) * 114, k < 5 ? 96 : 232, 34, s)));
HW.push(L(330, 326, tally, 't-ax'));
HW.push('    </svg>');
const HN = [C.svgOpen({ w: 360, h: 972, alt: HALT })];
HN.push(L(0, 18, 'the ' + T.T1.labels + ' cubes, each named by two letters', 't-lab'));
HN.push(...grid(64, 62, 36, 6));
HN.push(L(0, 338, 'filled: one set of ' + SIZE + ', ABC | DEF', 't-ax'), L(0, 358, 'hollow: the other ' + (T.T1.labels - SIZE) + ' cubes', 't-ax'));
HN.push(L(0, 398, 'the ' + T.T2.sets + ' sets of ' + SIZE + ': six letters, two triples', 't-lab'));
SETS.forEach((s, k) => HN.push(...hexagon(62 + (k % 3) * 118, 466 + Math.floor(k / 3) * 126, 28, s)));
HN.push(L(0, 940, tally.split(' = ')[0] + ' =', 't-ax'), L(0, 960, tally.split(' = ')[1], 't-ax'));
HN.push('    </svg>');

const TITLE = 'The ten minimum universal sets of MacMahon cubes: a classification decided twice';
const repoAt = (c) => a(P.repo + '/tree/' + c, 'jasondavies/macmahon-min-universal-sets at ' + c.slice(0, 8));
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: TITLE,
  /* "sides", not the census word, in the lead */
  deck: 'On ' + day(CLAIMED) + ' Jason Davies published a proof, developed with OpenAI’s GPT-6 Astra and written in Lean, that exactly ' + word(T.T2.sets) + ' collections of ' + word(SIZE) + ' MacMahon cubes can build every one of the ' + word(T.T1.labels) + ' cubes as a 2×2×2 model. It settles two conjectures of Johnson and Roldán from 2024. The result and the proof are his. '
    + 'With Claude (Anthropic’s AI model), I checked his release two ways that share no code with each other: my own program rebuilt all ' + T.T3.constructions + ' of his released constructions, and two independent proof checkers accepted his ' + word(K.theorems.length) + ' Lean theorems.'
}));
O.push(C.figure({ hero: true, svgRaw: HW.join('\n'), svgNarrowRaw: HN.join('\n'), record: [WREC, 'corpus/macmahon/results/universal_witnesses.json'],
  caption: 'The claim, drawn. A MacMahon cube has six colours, one on each side; there are ' + T.T1.labels + ' of them, and Conway’s table names each by two different letters from A to F. Split the six letters into two triples and take the cubes whose two letters fall in the same triple: a set of ' + SIZE + '. There are ' + T.T2.sets + ' splits, so ' + T.T2.sets + ' sets. Davies’s theorem says these ' + T.T2.sets + ', and no other collection of ' + SIZE + ' cubes or fewer, can build every one of the ' + T.T1.labels + ' cubes. The sets drawn are the ones in his released file.',
  stop: 'a released set is not a split of the six letters into two triples, the sets are not ' + T.T2.sets + ' different ones, or a released construction is not rebuilt' }));
O.push(C.stats([
  { k: 'released constructions rebuilt', v: T.T3.built + ' of ' + T.T3.constructions, n: 'by my own program, with its own rotations and corner positions' },
  { k: 'Lean theorems accepted', v: K.theorems.length + ' of ' + K.theorems.length, n: 'by two kernels: Lean’s own and nanoda' },
  { k: 'planted errors caught', v: REDS.filter((r) => r.fired).length + ' of ' + REDS.length, n: 'all on the first route' },
  { k: 'the Lean statement against the paper', v: K.reading.word === 'MATCHES' ? 'matches' : die('reading'), sm: true, n: 'a reading, not a machine check' }
]));
O.push(C.scope('The result and the proof are Jason Davies’s; his disclosure says GPT-6 Astra (OpenAI) developed the argument, the code, the Lean proofs and the manuscript under his direction. The conjectures are Inga Johnson and Erika Roldán’s. This page checks his release; it is not new mathematics. The checks are mine, run with Claude (Anthropic’s AI model), which wrote the programs under my direction.'));

O.push(C.section({ lab: 'read this first', title: 'What is still open', id: 'limits', bodyRaw: C.plainList([
  { b: 'My own program checks one half only.', text: 'It shows that the ' + T.T2.sets + ' sets work. That no other collection of ' + SIZE + ' works, and none of ' + (SIZE - 1) + ', rests on the Lean proof. Here that half was checked by the two kernels only; I ran no independent search for other sets.' },
  { b: 'The second route repeats a check that had already been run.', text: 'The author’s own automated checks and the Palomar registry (entry ' + PALOMAR + ') had checked the same commit. Mine is a second party’s run on a separate machine, with my own report of the axioms. It agrees with theirs; it is not a different kind of evidence.' },
  { b: 'The first route uses his table of names.', text: 'My program takes his table of the ' + T.T1.labels + ' colourings as the naming of the cubes, after checking that it lists every cube exactly once, and it takes his lists of which eight cubes to use. How to turn and place them it works out itself.' },
  { b: 'The cubes are a model.', text: 'The Lean statement is about six directions and a table of ' + ROTS + ' rotations, not about solid cubes in space. That this is what building a 2×2×2 model means is the paper’s declaration, and I take it on the paper’s word.' },
  { b: 'Not the paper’s written proof.', text: 'The Lean statement was read against the paper’s main theorem and matches; that is a reading. The paper’s written argument was not checked, and the author’s disclosure says the Lean proof takes a different route from it. The paper’s other computations (counts of how many cubes sets of eight to thirteen can build) are not Lean theorems, and I did not re-run them: his search and his verifier were read, never run.' },
  { b: 'Two commits.', raw: C.esc('The kernels ran on commit ') + m(P.registered_commit.slice(0, 8)) + C.esc(', the one the registry names. The constructions, and the author’s disclosure quoted on this page, were read at a later commit, ') + m(P.commit.slice(0, 8)) + C.esc(', the newest on ' + day(P.pinned) + '. Every Lean and configuration file pinned here is the same bytes at both: the kernel run holds each one to the digest pinned at the later commit.') },
  { b: 'AI models on both sides.', text: 'The proof was developed by GPT-6 Astra (OpenAI). My programs were written by Claude (Anthropic), and the author’s disclosure says a Claude model also reviewed his manuscript. An exact program and two kernels decide here, not a model; you should still know.' },
  { b: 'Lean and Mathlib are trusted,', text: 'as in any check of this kind, and so is Comparator’s matching of the statements.' },
  { b: 'Review and priority.', text: 'The author’s disclosure calls the work self-assessed and not independently reviewed by a human expert, and says priority beyond the sources it cites has not been established. Neither was examined here.' }
]) }));

O.push(C.section({ lab: 'the claim', title: word(T.T1.labels).replace(/^t/, 'T') + ' cubes, ' + word(SIZE) + ' at a time', id: 'claim', bodyRaw:
  C.pRaw(C.esc('Paint the six sides of a cube with six colours, one each. Up to turning the cube in the hand there are ' + T.T1.labels + ' ways, mirror images counted apart: the MacMahon cubes. A collection of cubes is universal if, for every one of the ' + T.T1.labels + ', eight cubes of the collection can be stacked into a 2×2×2 block whose outside is that cube, twice as large; the hidden sides need not match. '))
  + C.pRaw(a('https://arxiv.org/abs/1408.3696', 'Kazuya Haraguchi') + C.esc(' showed that a universal collection needs at least ' + SIZE + ' cubes and gave one of that size. In 2024 ') + a('https://arxiv.org/abs/2407.13208', 'Inga Johnson and Erika Roldán') + C.esc(' conjectured that exactly ' + T.T2.sets + ' sets of ' + SIZE + ' different cubes are universal (their Conjectures 4 and 8), and described them: the two-triple splits drawn above. '
    + 'Davies’s theorem is that the conjecture is right, and stays right when a collection may hold the same cube more than once: no collection with a repeat reaches the minimum.'))
}));

const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : 'dep');
O.push(C.section({ lab: '1 · my own program', title: 'All ' + T.T3.constructions + ' released constructions, rebuilt', id: 'constructions', bodyRaw: C.plainList([
  { b: 'What he released.', text: 'For each of the ' + T.T2.sets + ' sets and each of the ' + T.T1.labels + ' cubes to build, the eight cubes that build it: ' + T.T3.constructions + ' constructions.' },
  { b: 'What the program does.', raw: rec('instruments/macmahon/check.py') + C.esc(' was written from the definitions by Claude (Anthropic’s AI model) under my direction, in Python’s standard library. It makes its own ' + ROTS + ' rotations of a cube and its own eight corner positions. For each construction it searches for a way to turn the eight cubes and put one in each corner so that every outside side shows the right colour. It ignores the rotations and positions his file suggests, and runs none of his code.') },
  { b: 'First, the names.', raw: C.esc('His table gives ' + T.T1.labels + ' colourings, six different colours on each, and no rotation takes one to another. They are the same ' + T.T1.classes_of_all_720_colourings + ' classes that all 720 colourings of a cube fall into, so the table lists every cube once. ') + tag(T.T1.verdict) },
  { b: 'Then the sets.', raw: C.esc('The released sets are ' + T.T2.distinct_sets + ' different sets of ' + SIZE + ' cubes, and they are exactly the ' + T.T2.partitions_of_six_into_two_triples + ' splits of six letters into two triples. ') + tag(T.T2.verdict) },
  { b: 'Then the constructions.', raw: C.esc(T.T3.built + ' of ' + T.T3.constructions + ' build their cube. ') + tag(T.T3.verdict) },
  { b: 'What that decides.', text: 'That each of the ' + T.T2.sets + ' sets can build all ' + T.T1.labels + ' cubes. It says nothing about whether other sets can.' }
]) }));

O.push(C.section({ lab: '2 · two kernels', title: 'His ' + K.theorems.length + ' Lean theorems, accepted by two independent checkers', id: 'kernels', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'What was run.', raw: C.esc('On a machine hosted by GitHub (') + rec(K.source.workflow) + C.esc(', run ') + m(String(K.source.run)) + C.esc('), with Claude writing the workflow under my direction: his repository at the commit the Palomar registry names, built with its own Lean ' + LEANV[1] + ' and Mathlib ' + LEANV[2] + '. Then Comparator ' + COMPV + ', in the configuration his repository ships, with one change: nanoda, a kernel written in Rust apart from Lean, switched on beside Lean’s own.') },
    { b: 'What Comparator checks.', text: 'That each of the ' + K.theorems.length + ' theorems proved is exactly the one stated in a separate file that imports only Mathlib, so a proof cannot quietly change what it proves; that only the three standard axioms are used; and that the proofs replay.' },
    { b: 'What came back.', raw: C.esc('Both kernels accept all ' + K.theorems.length + '. A report of the axioms, printed from a file of mine, names nothing beyond ') + m(STD.join(', ')) + C.esc('; one theorem needs ') + m('propext') + C.esc(' alone. The library’s cache took ' + N(K.comparator.cacheSeconds) + ' s, the build ' + N(K.comparator.buildSeconds) + ' s and the comparison ' + N(K.comparator.seconds) + ' s. ') + tag(K.verdict) },
    { b: 'One declared change to nanoda.', text: 'Its working memory per thread (the stack) was raised to 1 GiB. Nothing else in it was touched.' },
    { b: 'The statement, read.', text: 'With Claude, I read the Lean statement file against the paper’s main theorem, sentence by sentence. It matches: a collection counts copies, so repeats are in the statement; a construction needs eight distinct physical cubes; only the outside sides are constrained; all ' + T.T1.labels + ' cubes must be built. This is a reading, kept apart from what the kernels decided.' }
  ]) + '</div>'
  + '<div class="wide"><details class="more"><summary>The ' + K.theorems.length + ' theorems and their axioms</summary>'
  + '<div class="col">' + C.plainList(K.theorems.map((t) => ({ raw: m(t.replace(/^MacMahon\./, '')) + C.esc(' · ' + K.axioms[t].join(', ')) }))) + '</div>'
  + '</details></div>'
  + '<div class="wide"><details class="more"><summary>The reading, in ' + K.reading.points.length + ' points</summary><div class="col">'
  + C.pRaw(C.esc(K.reading.what)) + C.plainList(K.reading.points.map((p, i) => ({ b: (i + 1) + '.', text: p })))
  + '</div></details></div>'
}));

O.push(C.section({ lab: '3 · planted errors', title: 'What would have caught a wrong construction', id: 'planted', bodyRaw: C.plainList([
  { b: 'A cube from outside the set.', text: 'In one released construction, one of the eight cubes is swapped for a cube that is not in the set. The program refuses it.' },
  { b: 'A wrong cube to build.', text: 'The same eight cubes are asked to build a cube with two of its sides exchanged. The program refuses it.' },
  { b: 'Mirror images allowed.', text: 'If turning a cube could include mirror reflections (' + REFL[1] + ' maps in place of ' + ROTS + '), the ' + REFL[2] + ' cubes would merge into ' + REFL[3] + ' and the check of the names would fail. Under that table it does.' },
  { b: 'None on the second route.', text: 'I planted no false theorem in the kernel run. What guards the statement there is Comparator’s own comparison with the separate statement file.' }
]) }));

O.push(C.section({ lab: 'who did what', title: 'Each step is a separate job', id: 'roles', bodyRaw: C.plainList([
  { b: 'The result and the proof.', text: 'Jason Davies, with GPT-6 Astra (OpenAI), which his disclosure says developed the argument, the code, the Lean proofs and the manuscript under his direction.' },
  { b: 'The conjectures.', text: 'Inga Johnson and Erika Roldán. The minimum of ' + SIZE + ': Kazuya Haraguchi. The cubes are MacMahon’s; the table of names is Conway’s.' },
  { b: 'The checkers.', text: 'Lean, Mathlib, Comparator and nanoda: their authors. The earlier mechanical check of the same commit: the Palomar registry.' },
  { b: 'The checks on this page.', text: 'Carlos Toledo, with Claude (Anthropic), which wrote the program and the workflow under my direction. Both ran on ' + CHECKED + '.' }
]) }));

O.push(C.section({ lab: 'check it yourself', title: 'How to re-run it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'The constructions.', raw: m('python3 instruments/macmahon/check.py --check') + C.esc(' rebuilds all ' + T.T3.constructions + ' from the pinned files and refuses on any difference from ') + rec(WREC) + '.' },
  { b: 'The kernels.', raw: m('node tools/record-macmahon-kernel.js --check') + C.esc(' re-reads ') + rec(KREC) + C.esc(' from the run’s saved output; ') + m('gh workflow run macmahon-kernel.yml') + C.esc(' on a copy of this repository runs the build and both kernels again.') },
  { b: 'The pinned files.', raw: rec(PREC) + C.esc(': ' + Object.keys(P.files).length + ' files of his repository, each with its sha256, copied in ') + rec('corpus/macmahon') + '.' },
  { b: 'What was checked.', raw: repoAt(P.registered_commit) + C.esc(' (the kernels) and ') + repoAt(P.commit) + C.esc(' (the constructions).') }
]) }));

const foot = '<p>' + C.esc('Generated by tools/build-report-macmahon.js from ' + WREC + ' and ' + KREC + ', both re-checked as the page is built, and ' + PREC + '. I did this with Claude (Anthropic); Claude wrote the programs under my direction.') + '</p>'
  + '<p>' + C.esc('git ' + (cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() || '—') + ' · cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'macmahon.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/macmahon.html',
  og: { image: '/og-macmahon.png', alt: OG.alt('macmahon') },
  desc: 'Jason Davies’s proof, developed with GPT-6 Astra and written in Lean, that exactly ' + word(T.T2.sets) + ' collections of ' + word(SIZE) + ' MacMahon cubes can build all ' + word(T.T1.labels) + ', checked two ways: his ' + T.T3.constructions + ' released constructions rebuilt by an independent program, and his ' + word(K.theorems.length) + ' theorems accepted by two kernels. What stays open is said first.' }));
console.log('reports/macmahon.html written · constructions ' + T.T3.built + '/' + T.T3.constructions + ' ' + W.verdict + ' · ' + K.theorems.length + ' theorems, two kernels ' + K.verdict + ' · reading ' + K.reading.word);
