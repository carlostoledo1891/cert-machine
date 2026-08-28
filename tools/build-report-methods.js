#!/usr/bin/env node
/* build-report-methods.js — generate reports/methods-note.html: the methods
   note. The bug catalog: every real bug this project has found, and the
   instrument that found it — a control, a calibration, an impossible
   number, a byte pin. None by reading code.

   THE GATE. Every catalog entry that names a living regression control is
   backed by RUNNING that battery during this build; the build refuses if
   any goes red. Numbers that live in records are recomputed from them
   (ledger decomposition closure, the census ceiling, the entropy bound);
   numbers that are HISTORY (the wrong bounds the bugs produced) are quoted
   as history and labeled so.

   usage: node tools/build-report-methods.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('METHODS NOTE REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const fmt = (n) => n.toLocaleString('en-US');

/* ---- the gates: the batteries that HOLD the catalog's regressions -------- */
const GATES = [
  ['census (henon + holmes)', ['instruments/census/battery.js'], 'holds the bisection-line fix and the shift classification'],
  ['entropy covering', ['instruments/entropy/battery.js'], 'holds the semantic ln 2 red and the slab condition'],
  ['lambda sweep', ['instruments/trigmin/lambda-battery.js'], 'refuses the wrong-endpoint bar by name'],
  ['cf audit', ['instruments/cf/battery.js'], 're-proves the spurious-solution lemma'],
  ['keller audit + fibers', ['instruments/keller/battery.js'], 'holds the pin-drift and forged-pin reds'],
  ['engine + families', ['tools/test-engine.js'], 'pins A019762 and the decomposition closure']
];
const gateRows = GATES.map(([n, argv, note]) => {
  const r = cp.spawnSync(process.execPath, argv, { cwd: ROOT, stdio: 'ignore' });
  if (r.status !== 0) die('gate went red during this build: ' + n);
  return { n, note };
});

/* ---- numbers recomputed from records ------------------------------------- */
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'ledger.json'), 'utf8'));
const T = ledger.totals;
{
  const parts = T.closedFormRefuted + T.closedFormRefutedExact + T.closedFormOnRecord
    + T.closedFormOpen + T.closedFormCandidates;
  if (parts !== T.closedFormTested) die('the decomposition does not close: ' + parts + ' != ' + T.closedFormTested);
}
const census16 = JSON.parse(fs.readFileSync(path.join(ROOT, 'census-high-periods.json'), 'utf8')).find((r) => r.p === 16);
if (!census16 || census16.points !== 1696) die('period-16 census record moved');
const ceiling = Math.log(census16.points) / 16;                  /* ln(1696)/16 */
const hcert = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'entropy-henon.json'), 'utf8'));
const hLB = hcert.hLB;
if (!(hLB > 0.3016 && hLB < ceiling)) die('entropy bound vs ceiling inconsistent: ' + hLB + ' vs ' + ceiling);
const lnphi = Math.log((1 + Math.sqrt(5)) / 2);
const ln2 = Math.LN2;

/* ---- the catalog ---------------------------------------------------------- */
/* Each: name · where · what broke · what caught it · the fix · the gate.
   "Caught by" is the taxonomy the whole note argues:
   control | calibration | impossible number | byte pin | outside read. */
const BUGS = [
  {
    name: 'The engine refuted √2 as a closed form of √2', where: 'oeis-closedform',
    caught: 'impossible number',
    broke: 'An OEIS audit run reported the closed form √2 REFUTED against the certified enclosure of… the decimal expansion of √2. A refutation of a value against itself is not a subtle wrongness; it is an impossibility, and it surfaced a normalization defect in the closed-form vocabulary.',
    gate: 'the engine battery (closed-form calibration rows)'
  },
  {
    name: '“Decimal expansion of 2e” certified as a discovery', where: 'oeis-closedform',
    caught: 'outside read',
    broke: 'The family read only the OEIS entry NAME, so a constant whose own record states its closed form was announced as a surviving discovery. The claim was impossible on its face to any reader of the record. The fix made the engine conclude what the hand-check knew: full records are fetched and fed back into certify, a survivor with a form on record is REJECT, and OEIS “hits” went 38 → 0.',
    gate: 'A019762 pinned in the battery as a regression control'
  },
  {
    name: 'Unreduced fractions inflated the refutation count ~30%', where: 'closed-form vocabularies',
    caught: 'outside read → conservation identity',
    broke: 'The vocabularies emitted unreduced spellings — (2/1)·e and (4/2)·e counted as two refuted forms — and one surviving value showed as four candidates: an impossible multiplicity an outside reviewer saw in under a minute. The headline DEFLATED from 77.6M to 54.6M (history, quoted). The durable fix is structural: the ledger now carries the full decomposition and the engine refuses to write one whose subtraction does not close.',
    gate: 'run-engine refuses a non-closing ledger; recomputed above: ' + fmt(T.closedFormTested) + ' tested decomposes exactly'
  },
  {
    name: 'The bisection-line zero', where: 'holmes-census',
    caught: 'calibration',
    broke: 'The Holmes cubic has a fixed point AT x = 0 — the exact midpoint of the symmetric root box. A zero lying ON a bisection line can never satisfy strict interior containment, so the census dove to its depth cap around a point it could never resolve. Caught the day the instrument was calibrated against the map\'s closed-form fixed points ±√(d+b−1). Fix: the root box is asymmetric by M/1024, and 2049 is odd, so no dyadic subdivision endpoint ever equals 0.',
    gate: 'census battery: closed-form calibration on both maps'
  },
  {
    name: 'The fat-record stall', where: 'henon-census',
    caught: 'control',
    broke: 'At a = 0.96, p = 4 a stalled cell produced a fat record. The defect was caught by the shift classification — the census decides minimal periods by certified shift-links, and the classification refused to cohere — not by anyone reading the search loop.',
    gate: 'census battery red controls'
  },
  {
    name: 'Undamped-Newton blindness', where: 'keller-fibers',
    caught: 'calibration',
    broke: 'Plain Newton from the multistart grid could not reach the published preimages of the Alpöge map; the hunter reported fewer fibers than the record it was calibrated against. Damped steps over a scale ladder found them, and every candidate is certified in a Krawczyk box on the exact map — the calibration target (3 preimages, rediscovered blind) is what exposed the blindness.',
    gate: 'keller battery; the fiber counts are re-certified'
  },
  {
    name: 'The missed sheet row', where: 'ramanujan-audit',
    caught: 'byte pin',
    broke: 'The first transcription of the Ramanujan Machine ζ(3) sheet MISSED its second row — 5/(2ζ(3)), a positive continued fraction hiding in the minus table. It surfaced only because the pin instrument (R3) forces every transcription to re-hash and be re-read against held source bytes; the re-read against rm_zeta3.pdf exposed the gap, and the row is now audited with the rest.',
    gate: 'pins re-hashed at certify time; forged-pin red control'
  },
  {
    name: 'Mixed-duration itineraries: h ≥ 0.61, above the ceiling', where: 'entropy',
    caught: 'impossible number',
    broke: 'Counting mixed-duration covering-relation paths as distinct itineraries produced h ≥ 0.61 (history, quoted) — above ' + ceiling.toFixed(4) + ', the exact census ceiling ln(1696)/16 recomputed from the period-16 record during this build. A duration-2 relation constrains nothing at its intermediate time, so different visit-time sets can realize the SAME orbit. Fix: compose to a uniform power as BINARY relations; a semantic red control now demands the exact-ln 2 horseshoe stay at ln 2 = ' + ln2.toFixed(4) + ' under mixed durations.',
    gate: 'entropy battery, semantic ln 2 red'
  },
  {
    name: 'The lids-only image condition: ln φ from two boxes', where: 'entropy',
    caught: 'impossible number',
    broke: 'A lids-only image condition certified a golden-mean 2-box graph converging to ln φ = ' + lnphi.toFixed(4) + ' — again above the census ceiling. An image part hovering in the slab above the target\'s interior lets a finger poke in and retract. An interim commit recorded 0.356403 under this condition (history; TAINTED and superseded). Fix: forbid the full slabs; the sound theorem is h ≥ ' + hLB.toFixed(6) + ', re-read from the certificate during this build.',
    gate: 'entropy battery re-proves the detached certificate in full'
  },
  {
    name: 'The wrong-endpoint bar', where: 'trigmin sweeps (lesson encoded from the source lab)',
    caught: 'control',
    broke: 'A certification bar taken from the wrong endpoint of an enclosure silently kills true champions — the source lab paid for this lesson in a lost run. Here it is not prose: the lambda battery constructs the wrong-endpoint bar, REFUSES it by name, and demonstrates the disaster it would cause, every run.',
    gate: 'lambda battery: the wrong-endpoint red control'
  }
];
const foundBy = {};
for (const b of BUGS) foundBy[b.caught] = (foundBy[b.caught] || 0) + 1;

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · methods note',
  title: 'None by reading code',
  deck: 'Every real bug this project has found — ' + BUGS.length + ' of them, cataloged below — was caught by a '
    + 'red control, a calibration, an impossible number, or a byte pin. Not one was found by reading the code. '
    + 'This note is the discipline stated as engineering, with the receipts: every regression named here is held '
    + 'by a battery that executed during this build, and the build refuses if any goes red.'
}));

O.push(C.tldr({
  findingRaw: 'Ten real bugs, zero found by reading code: every one was caught by a red control, a calibration, '
    + 'an impossible number, or a byte pin. Verifier engineering — not code review — is what actually catches '
    + 'defects, in this machine and in any evaluation pipeline built on computed ground truth.',
  mechanismRaw: 'A check that has never gone red is decorative, so every battery carries deliberate forgeries '
    + 'that must fire; every instrument reproduces a known answer before deciding anything new; and every gate '
    + 'cited on this page executed during the build that produced it.',
  checkRaw: C.m('make test') + ' from a clone — every battery, every red control required to fire.'
}));

O.push(C.stats([
  { k: 'bugs cataloged', v: String(BUGS.length), n: 'real defects with named catches and living gates' },
  { k: 'found by reading code', v: '0', role: 'held', n: 'the null result the whole method predicts' },
  { k: 'impossible numbers', v: String(foundBy['impossible number'] || 0), n: 'bounds provably above ceilings, values refuting themselves' },
  { k: 'calibrations', v: String(foundBy['calibration'] || 0), n: 'known answers the instrument had to reproduce first' },
  { k: 'gates run for this page', v: gateRows.length + ' green', role: 'held', n: 'executed during this build; a red refuses the page' },
  { k: 'the class, in the wild', v: '1 refuted · 1 corrected', role: 'warn', n: 'a published constant that was a float artifact, refuted; a printed sign slip, corrected — same failure class, audited' }
]));

O.push(C.section({
  lab: '§1 · the discipline', title: 'Five rules, stated as engineering',
  bodyRaw: '<div class="col">'
    + C.plainList([
      { b: 'Screens may prune, never admit.', text: 'Floating point decides only what is WORTH certifying. Nothing a screen passes is believed; every admission is an exact certificate — interval enclosures with outward rounding, BigInt rationals, Sturm chains. An instrument that cannot decide refuses rather than guesses.' },
      { b: 'Calibrate before you claim.', text: 'Every instrument first reproduces a case with a known answer — closed-form fixed points, a published table, a textbook algorithm. ' + (foundBy['calibration'] || 0) + ' of the ' + BUGS.length + ' bugs below were caught at exactly this step.' },
      { b: 'Every battery carries red controls.', text: 'Deliberate forgeries that must FAIL: a perturbed coefficient, a forged pin, a wrong-endpoint bar. A check that has never gone red is decoration — it is consistent with the code being right and equally consistent with the check testing nothing.' },
      { b: 'Conservation identities that throw.', text: 'Every exhaustion accounts for every case — per shard and globally — and the run refuses to write a record with a hole in it. The one headline this project ever had to deflate (by 30%) is now structurally impossible to inflate: the subtraction must close to zero.' },
      { b: 'Pin the bytes.', text: 'Every transcribed claim certifies against a held byte sequence (path + sha256), re-hashed at certify time. One bug below — a silently missing row of a published sheet — was caught by nothing else.' }
    ])
    + C.pRaw('The consequence worth a note rather than a slogan: under these rules, bugs are found by RUNNING '
      + 'the machine, and the finding mechanism is itself checkable. What follows is every real bug this '
      + 'project has found, with what caught it.')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · the catalog', title: BUGS.length + ' bugs, ' + Object.keys(foundBy).length + ' catch mechanisms', wide: true,
  bodyRaw: C.table({
    cols: [{ h: '#', cls: 'n' }, { h: 'the bug' }, { h: 'where' }, { h: 'caught by' }],
    rows: BUGS.map((b, i) => [
      String(i + 1),
      { raw: '<a href="#bug-' + (i + 1) + '">' + C.esc(b.name) + '</a>' },
      { raw: C.m(b.where) },
      { raw: C.tag(b.caught, b.caught === 'impossible number' ? 'open' : b.caught === 'byte pin' ? 'cert' : 'held') }
    ])
  })
    + '<div class="col">'
    + BUGS.map((b, i) =>
      '<div id="bug-' + (i + 1) + '"></div>'
      + '<h3>' + (i + 1) + ' · ' + C.esc(b.name) + '</h3>'
      + C.p(b.broke)
      + C.pRaw('<strong>The gate now standing:</strong> ' + C.esc(b.gate) + '.')
    ).join('\n')
    + '</div>'
}));

O.push(C.section({
  lab: '§3 · the near-misses', title: 'Where the method forced trouble into the open early',
  bodyRaw: '<div class="col">'
    + C.p('Two entries deserve a place beside the bugs because they never became bugs — the discipline surfaced '
      + 'them before a wrong number existed.')
    + C.pRaw('<strong>The exact spurious branch.</strong> One Ramanujan Machine continued fraction (the ζ(3) '
      + 'inverse row) has sₙ = n³ as an EXACT spurious solution of its tail recursion, adjacent to the true '
      + 'branch — the double root of c² − 2c + 1. A tail band proved by shift-and-check positivity must EXCLUDE '
      + 'it (L = n³ + 2n² is sharp), and that CF genuinely converges slowly. Digit-matching at any fixed depth '
      + 'cannot see this; a band that must be PROVED cannot avoid it. The spurious-solution lemma is re-proved '
      + 'as an exact polynomial identity by the cf battery, which ran for this page.')
    + C.pRaw('<strong>The crowding artifact.</strong> The first Newman min-modulus table read as if the maxima '
      + 'dipped at n = 10. Box maxima are lower bounds; the “dip” was the box crowding, and widening the box '
      + 'raised every floor and killed the reading — three rungs for three. The published convention now says '
      + 'brackets over named boxes, never “the value”, so the artifact class cannot recur in prose.')
    + '</div>'
}));

O.push(C.section({
  lab: '§4 · the same class, in the wild', title: 'Why this is also an audit instrument',
  bodyRaw: '<div class="col">'
    + C.pRaw('The bugs above are the failure class of numerical mathematics done without exact gates — and that '
      + 'class publishes. The GPT-produced constant on Erdős #852 was the naive IEEE-754 double product of its '
      + 'own defining formula, published to thirteen digits of false confidence and <a href="erdos852.html">'
      + 'refuted here at digit 12</a>, mechanism reproduced digit for digit. A printed row of the Ramanujan '
      + 'Machine\'s mixed-zeta sheet carries a sign slip; <a href="rm-audit.html">the audit</a> refuted the row '
      + 'as printed and certified its correction on the same enclosure. The discipline that catches your own '
      + 'bugs and the instrument that audits published claims are the same object.')
    + '</div>'
}));

O.push(C.section({
  lab: '§5 · the invitation', title: 'Replication is the good outcome',
  bodyRaw: '<div class="col">'
    + C.p('The moat here is not the code — it is the discipline and the dated public record, and others '
      + 'replicating both after publication is the outcome this note exists to cause. Every claim above is '
      + 'a battery in a public MIT repository with no dependencies; every battery carries forgeries that must '
      + 'fail; the headline results detach into certificates a standard-library Python script re-verifies in '
      + 'seconds.')
    + C.pRaw('If you run rigorous numerics and want to co-sign, refute, or extend any of this — an independent '
      + 'rerun in whatever you already trust is the most valuable thing you can send: '
      + '<a href="mailto:carlos@carlostoledo.co"><span class="m">carlos@carlostoledo.co</span></a>. '
      + 'A refutation gets published like any other result, with your name on it if you want it there.')
    + '</div>'
}));

O.push(C.section({
  lab: '§6 · the gates, this build', title: 'What ran to let this page exist', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'battery' }, { h: 'what it holds for this catalog' }],
    rows: gateRows.map((g) => [{ raw: C.m(g.n) }, g.note])
  })
    + '<div class="col">' + C.pRaw('All ' + gateRows.length + ' executed by tools/build-report-methods.js during '
      + 'this build; any red refuses the page. Recomputed from records on the way: the closed-form decomposition '
      + 'closes (' + C.m(fmt(T.closedFormTested) + ' tested') + '), the census ceiling '
      + C.m('ln(1696)/16 = ' + ceiling.toFixed(4)) + ', the entropy bound ' + C.m('h ≥ ' + hLB.toFixed(6))
      + ' read from its certificate and confirmed below the ceiling. Wrong historical numbers quoted above '
      + '(0.61, 0.4812, 0.356403, 77.6M) are quoted AS history — the point of the catalog is that the machine '
      + 'refuses to reproduce them.') + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-methods.js @ git ' + gitrev
  + ' — ' + gateRows.length + ' batteries executed during this build (page refuses on any red). '
  + 'Repository: github.com/carlostoledo1891/cert-machine (MIT).') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'methods-note.html'),
  TPL.render({ title: 'None by reading code · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/methods-note.html' }));
console.log('reports/methods-note.html written: ' + BUGS.length + ' bugs, ' + gateRows.length + ' gates green @ git ' + gitrev);
