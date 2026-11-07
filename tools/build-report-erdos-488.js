#!/usr/bin/env node
/* build-report-erdos-488.js — reports/erdos-488.html: the independent certification of the refutation of Erdős Problem
   #488 (D. Gessel with OpenAI's GPT-6 Astra in Codex, 2026-09-05; google-deepmind/formal-conjectures PR #5297).

   Every number and every verdict word is read from certs/erdos488.json (tools/record-erdos488.js, which re-derives it from
   the run's facts with --check); the build refuses when a verdict is not the one this page states, when the record no
   longer says first whose discovery it is, or when a pinned file moved. What it does not decide comes first.

   usage: node tools/build-report-erdos-488.js                                                                       MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const die = (m) => { console.error('ERDOS-488 REPORT REFUSED: ' + m); process.exit(1); };
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'erdos488.json'), 'utf8'));
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const said = (v) => '<b>' + C.esc(v) + '</b>';
const N = (x) => Number(x).toLocaleString('en-US');

/* the words this page states, each read back from the record */
const SAYS = { P1: 'CERTIFIED', P2: 'CERTIFIED', P3: 'CERTIFIED', P3secondKernel: 'ACCEPTS', P4: 'CERTIFIED', P5: 'NEGATIVE (no claim)', P6: 'READING', P7: '4/4 caught' };
for (const [k, v] of Object.entries(SAYS)) if (R.verdicts[k] !== v) die(k + ' is ' + R.verdicts[k] + ' in certs/erdos488.json, and this page states ' + v);
if (!/^The discovery is Declan Gessel's/.test(R.undecided)) die('the record no longer says first whose discovery it is');
if (R.P3.notRun.length !== 4) die('the list of checkers not run moved: the page says four');
const P3 = R.P3, P4 = R.P4, P5 = R.P5, FRESHMIN = Math.round(Number(P3.fresh.wall.split(':')[0]) + Number(P3.fresh.wall.split(':')[1]) / 60);
const TITLE = 'Erdős #488: an AI-assisted refutation, certified';

/* figure A — the set {5}: the exact share ⌊x/5⌋/x for x = 5..60, the share at 9 and twice it */
const FIVE = []; for (let x = 5; x <= 60; x++) FIVE.push([x, Math.floor(x / 5) / x]);
if (Math.max(...FIVE.map((p) => p[1])) >= 2 / 9) die('the {5} example crossed twice its share at 9');
const pct = (v) => (v * 100).toFixed(0) + '%';
const FIG_FIVE = CH.scatter({
  w: 900, h: 300, x0: 4, x1: 61, y0: 0, y1: 0.26,
  xTicks: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((v) => ({ v, t: String(v) })),
  yTicks: [0, 0.05, 0.10, 0.15, 0.20, 0.25].map((v) => ({ v, t: pct(v) })),
  xLabel: 'the limit x', yLabel: 'share that are multiples of 5',
  hlines: [{ y: 2 / 9, token: 'var(--ink)', t: 'twice the share at 9: 2 in 9 (22.2%)' }],
  pts: FIVE.map(([x, y]) => ({ x, y, token: 'var(--c-1)', diamond: x === 9, k: 'up to ' + x, v: Math.floor(x / 5) + ' of ' + x + ' (' + (y * 100).toFixed(1) + '%)' })),
  alt: 'Dots for the share of multiples of 5 among the numbers up to x, for x from 5 to 60. The share jumps to exactly 20% at every multiple of 5 and dips between them; at x = 9 it is 1 in 9, about 11%, marked with a diamond. A horizontal line at 22.2%, twice the share at 9, stays above every dot.'
});

/* figure B — the search: the best ratio per quarter-decade of |A| (the record's envelope) and Liu's point (read) */
const ENV = P5.envelope, LIU = P5.liu;
if (!ENV.length || ENV.some((e) => !(e.R < 2)) || P5.hits !== 0) die('a point of the search reached 2×, or the search recorded a hit');
const tickX = [[1, '1'], [10, '10'], [100, '100'], [1e3, '1k'], [1e4, '10k'], [1e5, '100k'], [1e6, '1M'], [1e7, '10M'], [1e8, '100M']];
const FIG_SEARCH = CH.scatter({
  w: 900, h: 330, logX: true, x0: 0.7, x1: 2e8, y0: 1.0, y1: 2.15,
  xTicks: tickX.map(([v, t]) => ({ v, t })), yTicks: [1.0, 1.25, 1.5, 1.75, 2.0].map((v) => ({ v, t: v.toFixed(2) + '×' })),
  xLabel: 'the size of the set, |A| (log scale)', yLabel: 'best share ratio',
  hlines: [{ y: 2, token: 'var(--ink)', t: '2×: a counterexample must rise above this line' }],
  vlines: [{ x: ENV[ENV.length - 1].A, token: 'var(--c-ctx)' }],
  /* direct labels (a one-point path draws nothing; its label says what the eye would misread): the dot at one number sits
     a hair under the 2× line, and Liu's diamond is read, not decided */
  curves: [
    { pts: [[ENV[0].A, ENV[0].R]], token: 'var(--c-1)', k: 'the dot at 1: ' + ENV[0].R + '×, under 2', kAt: [12, 1.93, 'start'] },
    { pts: [[ENV[ENV.length - 1].A, 1.0]], token: 'var(--c-ctx)', k: 'where the counting stopped', kAt: [ENV[ENV.length - 1].A * 1.35, 1.08, 'start'] },
    { pts: [[LIU.A, LIU.ratio]], token: 'var(--c-ctx)', k: 'Liu: ' + LIU.ratio + '× at 65 million', kAt: [LIU.A, 1.53, 'end'] }
  ],
  pts: ENV.map((e) => ({ x: e.A, y: e.R, token: 'var(--c-1)', k: '|A| = ' + N(e.A), v: 'best ratio ' + e.R.toFixed(4) + '× (below 2, decided exactly)' }))
    .concat([{ x: LIU.A, y: LIU.ratio, token: 'var(--c-ctx)', diamond: true, hollow: true, k: 'Liu, |A| = ' + N(LIU.A), v: LIU.ratio + '× at n = 6.7·10¹³ (read from his paper; the limit as the set grows is ' + LIU.limit + '×)' }]),
  keys: [{ token: 'var(--c-1)', t: 'my search, the best ratio for sets of about this size' }, { token: 'var(--c-ctx)', t: 'Liu’s computation at 65 million numbers (read)' }],
  alt: 'A log-scale chart of the best share ratio against the size of the set. At one number the ratio is just under 2; it falls to about 1.39 at ten numbers and levels near 1.25 from a thousand to fifteen thousand numbers, the largest the search reached. A hollow diamond at about 65 million numbers marks Liu’s computation, 1.447. A horizontal line at 2 sits above every point.'
});
const O = [];

O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: TITLE,
  deck: 'Erdős asked whether the share of numbers that are multiples of a finite set can ever more than double as you look further out. '
    + 'On 5 September 2026 Declan Gessel, working with OpenAI’s GPT-6 Astra, showed with a Lean proof that it can, and asked Google DeepMind’s list of open problems to mark the question settled. '
    + 'The request sat for two months, and the list changed its wording in the meantime. I checked it from every side, pre-registered and sealed before any code ran: it refutes the problem exactly as DeepMind states it today.'
}));

O.push(C.tldr({
  findingRaw: 'Gessel’s Lean refutation of Erdős #488 is correct against the statement as it stands in ' + m('google-deepmind/formal-conjectures') + ': Lean’s kernel accepts it three ways, an independent kernel (nanoda) accepts all ' + N(P3.nanoda.declarations) + ' declarations, and nothing but the three standard axioms is used.',
  mechanismRaw: 'His proof restated the problem instead of importing it, and the problem’s file changed after his request. Here the statement is taken from DeepMind’s own declaration, so an edit cannot pass unnoticed; three planted wrong statements were each refused.',
  checkRaw: m('node tools/record-erdos488.js --check') + ' re-derives every verdict from the run’s facts; the two arithmetic deciders re-run in it.'
}));

O.push(C.stats([
  { k: 'his statement vs DeepMind’s', v: R.verdicts.P1, n: 'the same expression up to variable names; 3 wrong variants refused' },
  { k: 'kernels', v: '2 accept', n: 'Lean (also from scratch, ' + FRESHMIN + ' min) and nanoda, ' + N(P3.nanoda.declarations) + ' declarations' },
  { k: 'planted fakes caught', v: R.P7.filter((r) => r.caught).length + ' of ' + R.P7.length, n: 'a false sum, a sorry, an axiom, an unchecked shortcut' },
  { k: 'a small counterexample', v: 'none found', n: N(P5.configurations) + ' setups to ' + N(P5.sieveLimit) + '; best ' + P5.bestRatioAtLeast10.toFixed(2) + '× with 10+ numbers' }
]));

O.push(C.scope('The discovery is Declan Gessel’s, made with GPT-6 Astra. This page certifies his proof; it is not a new result, and who found the counterexample first is a reading of dated sources.'));

O.push(C.section({
  lab: 'first, the limits', title: 'What this does not decide', id: 'limits',
  bodyRaw: C.plainList([
    { b: 'Whose result it is.', text: 'The refutation is Gessel’s, with GPT-6 Astra in Codex (5 September 2026). Others went further the same week: an explicit instance, and a proof that the ratio has no bound at all (below).' },
    { b: 'Four checkers were not run.', text: P3.notRun.join(', ') + ': ' + P3.notRunWhy + '.' },
    { b: 'The smallest counterexample.', text: 'Still unknown. My search found none among small cases; the known ones live at numbers with over a hundred digits.' },
    { b: 'Who was first.', text: 'A reading of the sources as dated on 6 November 2026, not a decision.' }
  ])
}));

O.push(C.section({
  lab: 'also first', title: 'Where the run differs from the plan', id: 'deviations',
  bodyRaw: C.pRaw('The plan was sealed before the run; three things differ from it, and the record keeps all three.')
    + C.plainList(R.deviations.map((d) => ({ b: { pin: 'A wrong pin in the plan.', P3: 'One Lean checker short.', P7: 'A planted fake that was not false.' }[d.id] || (d.id + '.'), text: d.text })))
}));

O.push(C.section({
  lab: 'the question', title: 'Can the share of multiples more than double?', id: 'question',
  bodyRaw: C.pRaw('Take a finite set of whole numbers, none of them 0 or 1, and count how many numbers up to a limit are multiples of at least one of them. With the set {5}: up to 9, one number in nine is a multiple (about 11%); far out, one in five (20%). The share grew by a factor of about 1.8. '
      + 'Erdős asked whether, from a limit n at least as large as every number in the set to any larger m, the share can ever reach more than twice what it was at n. With a single number it gets close to 2 and never reaches it.')
    + C.figure({ svgRaw: FIG_FIVE, source: 'built: the share ⌊x/5⌋/x, computed exactly as the page is built',
        caption: 'The set {5}. Each dot is the share of the numbers up to x that are multiples of 5, exact. At x = 9 the share is 1 in 9 (the diamond); the upper line is twice that, 2 in 9. The share climbs back to exactly 1 in 5 at every multiple of 5 and never reaches the upper line: here the share grows by a factor of 1.8, not 2. Erdős asked whether any finite set can push it past the line.' })
    + C.pRaw('In DeepMind’s list the question is the Lean declaration ' + m(R.pins.entry.declaration) + ' in ' + m(R.pins.entry.path) + ', still marked open at commit ' + m(R.pins.entry.commit) + '.')
}));

O.push(C.section({
  lab: 'the claim', title: 'A Lean proof that waited two months', id: 'claim',
  bodyRaw: C.pRaw('Gessel’s construction takes every number between T and 256·T whose prime factors are all below 257. Up to 256·T their multiples are rare; much further out they fill more than twice the share. '
      + 'A counting argument shows that some T = 256<sup>k</sup> with k below 4,096 works, without saying which. His proof is a single Lean file, and it restates the problem’s text instead of importing DeepMind’s declaration.')
    + C.pRaw('His request to mark the problem solved (' + '<a href="' + C.escAttr(R.pins.claim.pr) + '">pull request #5297</a>' + ') drew one approving review and a maintainer’s question: how is the counterexample built, and who found it first? It was not answered, the request’s licence check failed, and on 14 October the problem’s file changed its form, so the request no longer applies as written.')
}));

/* who did what: each step of the work as a separate job, with whoever did it for this claim. The translation line says
   plainly that it was not needed here — claimbox was not used for #488, and the page must never imply it was. */
const role = (r, whoRaw) => ({ b: r + '.', raw: whoRaw });
O.push(C.section({
  lab: 'who did what', title: 'Each step is a separate job', id: 'roles',
  bodyRaw: C.plainList([
    role('Find the result', C.esc('Declan Gessel, with OpenAI’s GPT-6 Astra in Codex.')),
    role('State the question formally', C.esc('Google DeepMind, in its list of open problems in Lean (formal-conjectures).')),
    role('Turn a claim in words into a formal statement', C.esc('Not needed here: the question already existed in Lean, and the proof came in Lean. When a claim arrives in words, this is the job of ') + '<a href="../claimbox/">claimbox</a>' + C.esc(', which was not used for this claim.')),
    role('Write the proof', C.esc('Gessel, in one Lean file.')),
    role('Decide it, independently', C.esc('cert-machine: the statement checked against DeepMind’s own declaration, the axiom audit, two arithmetic deciders, the search, the planted fakes.')),
    role('Check the proof', C.esc('Lean’s kernel (three ways) and nanoda, a kernel written apart from Lean.')),
    role('Prove the dates', C.esc('Verify Seal: salted fingerprints in a public registry and in Bitcoin, before each step ran.'))
  ])
}));

const row = (q, did, v, kind) => [{ raw: C.esc(q) }, { raw: did }, { raw: C.tag(v, kind || 'held') }];
O.push(C.section({
  lab: 'the checks', title: 'Seven questions, written down and sealed before any code ran', id: 'checks', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'question' }, { h: 'what was done' }, { h: 'verdict' }],
    rows: [
      row('P1 · the same question?', C.esc('DeepMind’s statement taken from its declaration; his restatement compared as an expression; 3 planted wrong statements'), R.verdicts.P1),
      row('P2 · works as delivered?', C.esc('built unchanged in his environment (Lean 4.33.0) and in DeepMind’s (4.33.1)'), R.verdicts.P2),
      row('P3 · do the kernels accept it?', C.esc('our axiom audit; Lean’s checker; Lean’s checker from scratch (' + FRESHMIN + ' min); nanoda on an export of ' + N(P3.nanoda.export.bytes) + ' bytes'), R.verdicts.P3 + ' · nanoda ' + R.verdicts.P3secondKernel),
      row('P4 · is the arithmetic right?', C.esc('five closed facts re-derived by two deciders in two languages, by two authors'), R.verdicts.P4),
      row('P5 · a small counterexample?', C.esc(N(P5.configurations) + ' setups, exact counts to ' + N(P5.sieveLimit)), 'none found', 'open'),
      row('P6 · who was first?', C.esc('the dated sources, from Liu’s history'), 'a reading', 'open'),
      row('P7 · can the checks be fooled?', C.esc('4 planted fakes of his proof'), R.verdicts.P7)
    ]
  })
}));

O.push(C.section({
  lab: 'P1 · the statement', title: 'Exactly DeepMind’s question, as it reads today', id: 'statement',
  bodyRaw: C.pRaw('A Lean module of mine states ' + m('¬ (type_of% @Erdos488.erdos_488)') + ', the negation of DeepMind’s own declaration, and proves it with Gessel’s ' + m('refutation') + '. It builds, on the three standard axioms. His restated proposition and DeepMind’s statement are the same expression up to the names of bound variables. '
      + 'Three planted variants were each refused by Lean with a type mismatch: the wording before 14 October (' + m('answer(sorry) ↔ …') + '), the constant 3 for 2, and ' + m('m ≥ n') + ' for ' + m('m > n') + '.')
    + C.pRaw('One correction, on the record: the first planted variant first failed for the wrong reason, a missing import, not the statement. With the import it was refused for the right one.')
}));

O.push(C.section({
  lab: 'P2 · P3 · the kernels', title: 'Two kernels, nothing but the standard axioms', id: 'kernels',
  bodyRaw: C.pRaw('The proof compiles unchanged in both environments. My audit of every declaration finds only ' + m(P3.audit.axiomsInClosure.join(', ')) + ' across a closure of ' + N(P3.audit.closure) + ' constants, the two traversals agreeing. '
      + 'Lean’s checker accepts the module, and accepts it again from scratch, replaying every constant it rests on, the mathematics library included, into an empty environment (' + FRESHMIN + ' minutes). '
      + 'nanoda, a checker written apart from Lean, accepts all ' + N(P3.nanoda.declarations) + ' declarations of the export.')
}));

O.push(C.section({
  lab: 'P4 · the arithmetic', title: 'The numbers the proof leans on', id: 'arithmetic',
  bodyRaw: C.pRaw('Two deciders, one in JavaScript and one in Python, written by different authors who did not see each other’s code or the proof, re-derive the closed facts the proof evaluates: there are 53 odd primes below 257; Q, their product, and φ(Q); 128 &lt; Q; 3·Q &lt; 16·φ(Q); and 2<sup>4096</sup>·32769<sup>53</sup> &lt; 3<sup>4096</sup>. '
      + 'They agree to the last digit. The margin that makes the construction work is thin but real: φ(Q)/Q = ' + P4.phiOverQ + ' against the 3/16 = 0.1875 it needs.')
    + C.pRaw('One correction, on the record: one of my planted false facts (3·Q &lt; 15·φ(Q)) was in fact true; the second author had computed the right one, 14.')
}));

O.push(C.section({
  lab: 'P5 · a small counterexample', title: 'None among the small cases', id: 'search',
  bodyRaw: C.pRaw('I searched the same kind of construction at small sizes, ' + N(P5.configurations) + ' setups with exact counts up to ' + N(P5.sieveLimit) + ': no counterexample. The share comes close to doubling only for one to four numbers, where a short argument keeps it below 2; with ten or more numbers the best was ' + P5.bestRatioAtLeast10.toFixed(2) + '×. '
      + 'This was the outcome predicted before the search, and it matches Liu’s computation at n = 6.7·10<sup>13</sup>, which reaches 1.447.')
    + C.figure({ svgRaw: FIG_SEARCH, wide: true, record: ['certs/erdos488.json', 'corpus/erdos488/p5/scan1.out'],
        stop: 'a point of the search reaches 2× (that would be a counterexample, and it is decided in exact integers), or a plotted point disagrees with the record',
        caption: 'How close the share comes to doubling, by the size of the set. Light dots: the best ratio my search found among sets of about that size (exact counts up to 10 million; the ratios are double-precision values of those counts, while the 2× test itself was decided in exact integers). One number alone comes within a hair of 2 and provably stays below it; larger sets fall back to about 1.25× wherever the counts reach. The hollow diamond is Liu’s direct computation at 65 million numbers, 1.447, read from his paper. The known counterexamples are far off the right edge, among numbers with more than a hundred digits.' })
}));

O.push(C.section({
  lab: 'P6 · who was first', title: 'The dated sources', id: 'provenance',
  bodyRaw: C.plainList(R.P6.sources.map((s) => ({ b: s.who + ', ' + s.date + '.', raw: C.esc(s.what) + ' <a href="' + C.escAttr(s.url) + '">source</a>.' })))
    + C.pRaw(C.esc('As far as these sources show, Gessel’s is the first counterexample. This reading is ' + R.P6.reading + '.'))
}));

O.push(C.section({
  lab: 'P7 · the red team', title: 'Four fakes, four caught', id: 'redteam',
  bodyRaw: C.plainList(R.P7.map((r) => ({ b: r.id + '.', text: (r.how.charAt(0).toUpperCase() + r.how.slice(1)).replace(/Submissions\.ErdosMultiplesSmoothRefuted\.Counterexample\.(FiniteGrowth\.)?/g, '') + '.' })))
}));

O.push(C.section({
  lab: 'the method', title: 'Rules first, sealed, then the run', id: 'method',
  bodyRaw: C.pRaw('Each step’s plan was written and committed before the step ran (' + rec(R.preregistration) + '), and each stage was sealed: a salted fingerprint of the private work posted to a public registry and to Bitcoin through OpenTimestamps, proving the date without showing the content.')
    + C.plainList(R.seals.map((s) => ({ b: 'Seal ' + s.seal + '.', raw: m(s.digest.slice(0, 16) + '…') + ' · ' + C.esc(s.anchors) })))
}));

O.push(C.section({
  lab: 'check it yourself', title: 'How to re-run it', id: 'rerun',
  bodyRaw: C.plainList([
    { b: 'The note.', raw: 'The full account, ten pages, with the provenance and the protocol: <a href="https://doi.org/10.5281/zenodo.24025464">doi:10.5281/zenodo.24025464</a>.' },
    { b: 'The record.', raw: m('node tools/record-erdos488.js --check') + ' re-derives every verdict from ' + rec('corpus/erdos488/runs/pod-2026-11-06') + ' and re-runs both arithmetic deciders.' },
    { b: 'The arithmetic alone.', raw: m('node tools/erdos488-p4.js --controls') + ' and ' + m('python3 -I tools/erdos488-p4.py --controls') + ', standard library only.' },
    { b: 'The Lean run.', raw: rec('tools/erdos488-lean/runpod-488.sh') + ' with its statement, check and planted files beside it: a Linux machine with elan, about an hour for the from-scratch replay.' },
    { b: 'His proof.', raw: '<a href="' + C.escAttr(R.pins.claim.gist) + '">the gist</a> at ' + m(R.pins.claim.commit.slice(0, 8)) + ', sha256 ' + m(R.pins.claim.sha256.slice(0, 16) + '…') + '. It is not copied here: its licence is not stated.' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-erdos-488.js from certs/erdos488.json (tools/record-erdos488.js --check). I ran this with Claude agents (Anthropic).') + '</p>'
  + '<p>' + C.esc('git ' + (cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() || '—') + ' · cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'erdos-488.html'),
  TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/erdos-488.html',
    desc: 'Declan Gessel’s Lean refutation of Erdős #488, made with GPT-6 Astra, certified against DeepMind’s current statement: two kernels, the arithmetic by two deciders, four planted fakes caught.' }));
console.log('reports/erdos-488.html written · ' + Object.entries(R.verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
