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
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('METHODS NOTE REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const fmt = (n) => n.toLocaleString('en-US');

/* ---- the gates: the batteries that HOLD the catalog's regressions --------
   Every one RUNS here and a red refuses the page. Their stdout is captured
   rather than discarded, because one of them — the funnel battery — is not
   only a gate but the SOURCE of §5: that section's counts and every line in
   its table are read out of the run that just happened. */
const FUNNEL_GATE = 'funnel anti-hacking';
const GATES = [
  ['census (henon + holmes)', ['instruments/census/battery.js'], 'holds the bisection-line fix and the shift classification'],
  ['entropy covering', ['instruments/entropy/battery.js'], 'holds the semantic ln 2 red and the slab condition'],
  ['lambda sweep', ['instruments/trigmin/lambda-battery.js'], 'refuses the wrong-endpoint bar by name'],
  ['cf audit', ['instruments/cf/battery.js'], 're-proves the spurious-solution lemma'],
  ['keller audit + fibers', ['instruments/keller/battery.js'], 'holds the pin-drift and forged-pin reds'],
  ['engine + families', ['tools/test-engine.js'], 'pins A019762 and the decomposition closure'],
  [FUNNEL_GATE, ['machine/funnel/selftest/battery.js'], 'runs every reward-hacking red control in §5 — sabotaged certifier, gamed score, forged record, eaten hit, broken cover']
];
const gateRows = GATES.map(([n, argv, note]) => {
  const r = cp.spawnSync(process.execPath, argv, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = String(r.stdout || '') + String(r.stderr || '');
  if (r.status !== 0) die('gate went red during this build: ' + n + '\n' + out.slice(-1200));
  return { n, note, out };
});

/* ---- §5's material: the funnel battery's own lines, from this build ------
   Nothing in §5 is typed by hand. The item count, the red-control count, the
   numbers and every “what it caught” line are parsed out of the battery run
   above; if the battery's shape changes, this parse dies and no page is
   written. That is the same rule the page argues for everything else. */
const funnelGate = gateRows.find((g) => g.n === FUNNEL_GATE);
if (!funnelGate) die('the funnel battery is not in the gate list');
const funnelOut = funnelGate.out;
if (!/^BATTERY GREEN\b/m.test(funnelOut)) die('the funnel battery did not report GREEN:\n' + funnelOut.slice(-1200));

const funnelItems = [];
const funnelReds = [];
for (const line of funnelOut.split('\n')) {
  const it = /^(ITEM \d+ [^—]*?)\s+(PASS|FAIL) — (.+)$/.exec(line);
  if (it) { funnelItems.push({ name: it[1].trim(), pass: it[2] === 'PASS', detail: it[3].trim() }); continue; }
  const rd = /^\s+RED \(([a-z])\) (.+?)\s+(FIRED|DID NOT FIRE) — (.+)$/.exec(line);
  if (rd) funnelReds.push({ id: rd[1], label: rd[2].trim(), fired: rd[3] === 'FIRED', detail: rd[4].trim() });
}
if (funnelItems.length < 5 || funnelReds.length < 5)
  die('could not parse the funnel battery output (' + funnelItems.length + ' items, ' + funnelReds.length + ' red controls)');
for (const i of funnelItems) if (!i.pass) die('a funnel battery item did not pass: ' + i.name);
for (const r of funnelReds) if (!r.fired) die('a funnel red control did not fire: (' + r.id + ') ' + r.label);

/* Numbers quoted in §5, each read back out of the line that produced it. */
const fnum = (re, what) => { const m = re.exec(funnelOut); if (!m) die('the funnel battery output lost the ' + what + ' line'); return m; };
const F_RECALL = fnum(/(\d+)\/(\d+) enumerated, (\d+)\/(\d+) planted hits found\+certified \(recall ([^)]+)\)/, 'planted recall');
const F_EMPTY = fnum(/(\d+)\/(\d+) elements certified REJECT/, 'certified-empty box');
const F_CASC = fnum(/all (\d+) hits admitted/, 'cascade conservation');
const F_DIVERGE = fnum(/counters diverge as defined \(certified (\d+), new-to-board (\d+)\)/, 'counter divergence');
const F_WINDOWS = fnum(/empty box exhausted in (\d+) windows/, 'sharded cover');
const F_COVER = fnum(/\((\d+)\/(\d+) checked, conservation exact\)/, 'cover conservation');
const F_RESUME = fnum(/killed after (\d+) batches/, 'kill-and-resume');

/* The plain-language half of §5: what each attack actually IS, in the words a
   reader who does not know this codebase would use. Keyed by the battery's own
   red-control letter, and the keying is a gate both ways — a control this page
   does not describe, or a description whose control is gone, refuses the page.
   The page can never quietly fall behind the battery it is reporting. */
const CHEATS = {
  a: { cheat: 'Replace the certifier with one that stamps HIT on everything.', refuses: 'CERTIFIER-INTEGRITY' },
  b: { cheat: 'Raise the score by inflating the candidate instead of improving it.', refuses: 'SCORE-BATTERY' },
  c: { cheat: 'Edit a result line after it was written.', refuses: 'CHAIN-BROKEN' },
  d: { cheat: 'Let the proposer reach outside its return value and write to disk.', refuses: 'FENCE-VIOLATION' },
  e: { cheat: 'Announce “the best one found so far” without saying what was searched.', refuses: 'claim guard' },
  f: { cheat: 'Record a metric with no run attached to it.', refuses: 'MEMO-UNPROVENANCED' },
  g: { cheat: 'Append a number to the stats log by hand, going around the writer.', refuses: 'MEMO-REFUSED' },
  h: { cheat: 'Mint a new metric without defining it, so its meaning can drift later.', refuses: 'MEMO-METRIC-UNDEFINED' },
  i: { cheat: 'Report the flattering counter and drop the other one.', refuses: 'checkSessionSummary' },
  j: { cheat: 'Rewrite the prompt in the log after seeing which answer worked.', refuses: 'promptSha' },
  k: { cheat: 'Board one object twice under a different ordering to double the count.', refuses: 'canonical-duplicate' },
  l: { cheat: 'Flood one corner of the space with weak hits to run the board up.', refuses: 'refused-region-floor' },
  m: { cheat: 'Stop early enough to hide what was never searched — or never stop at all.', refuses: 'bingo, both ways' },
  n: { cheat: 'Add a cheap pre-filter that quietly drops the hard cases.', refuses: 'RECALL, by stage name' },
  o: { cheat: 'Have the evolved search program allocate a million-element candidate.', refuses: 'DSL step + size caps' },
  p: { cheat: 'Change the statement of what is being searched so the result matches it.', refuses: 'STATEMENT-MISMATCH' },
  q: { cheat: 'Edit one window’s certificate inside a finished exhaustion record.', refuses: 'window sha re-hash' },
  r: { cheat: 'Leave a one-integer gap between windows — or overlap them — and call the box covered.', refuses: 'tiling geometry' },
  s: { cheat: 'Publish the cover when one window came back with a hit still in it.', refuses: 'SHARD-INCOMPLETE' }
};
for (const r of funnelReds)
  if (!CHEATS[r.id]) die('the funnel battery grew a red control this page does not describe: (' + r.id + ') ' + r.label);
for (const id of Object.keys(CHEATS))
  if (!funnelReds.some((r) => r.id === id)) die('a red control this page describes is gone from the battery: (' + id + ')');

/* ---- numbers recomputed from records ------------------------------------- */
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'ledger.json'), 'utf8'));
const T = ledger.totals;
{
  const parts = T.closedFormRefuted + T.closedFormRefutedExact + T.closedFormOnRecord
    + T.closedFormOpen + T.closedFormCandidates;
  if (parts !== T.closedFormTested) die('the decomposition does not close: ' + parts + ' != ' + T.closedFormTested);
}
const census16 = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'census-high-periods.json'), 'utf8')).find((r) => r.p === 16);
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
    + 'by a battery that executed during this build, and the build refuses if any goes red. §5 is the same '
    + 'discipline under attack: ' + funnelReds.length + ' ways to cheat the machine, and the gate that caught each.'
}));

O.push(C.tldr({
  findingRaw: 'Ten real bugs, zero found by reading code: every one was caught by a red control, a calibration, '
    + 'an impossible number, or a byte pin. Verifier engineering — not code review — is what actually catches '
    + 'defects, in this machine and in any evaluation pipeline built on computed ground truth.',
  mechanismRaw: 'A check that has never gone red is decorative, so every battery carries deliberate forgeries '
    + 'that must fire; every instrument reproduces a known answer before deciding anything new; and every gate '
    + 'cited on this page executed during the build that produced it.',
  checkRaw: C.m('make test') + ' from a clone — every battery, every red control required to fire. For the '
    + 'reward-hacking battery in §5 on its own: ' + C.m('node machine/funnel/selftest/battery.js')
    + ' (' + funnelItems.length + ' items, ' + funnelReds.length + ' red controls, about a second).'
}));

O.push(C.stats([
  { k: 'bugs cataloged', v: String(BUGS.length), n: 'real defects with named catches and living gates' },
  { k: 'found by reading code', v: '0', role: 'held', n: 'the null result the whole method predicts' },
  { k: 'impossible numbers', v: String(foundBy['impossible number'] || 0), n: 'bounds provably above ceilings, values refuting themselves' },
  { k: 'calibrations', v: String(foundBy['calibration'] || 0), n: 'known answers the instrument had to reproduce first' },
  { k: 'gates run for this page', v: gateRows.length + ' green', role: 'held', n: 'executed during this build; a red refuses the page' },
  { k: 'cheats refused', v: String(funnelReds.length), role: 'held', n: 'deliberate attacks on the search machine’s reward signal (§5) — every one caught by a named control, this build' },
  { k: 'the class, in the wild', v: '1 refuted · 1 corrected', role: 'warn', n: 'a published constant that was a float artifact, refuted; a printed sign slip, corrected — same failure class, audited' }
]));

/* ---- the page's own title, measured -------------------------------------
   "None by reading code" is a claim about a distribution, so draw the
   distribution — including the bar that is empty, because the empty bar is
   the whole point and a chart that omits it would be arguing rather than
   reporting. */
{
  const cats = Object.entries(foundBy).map(([k, n]) => ({ k, v: n }))
    .sort((a, b) => b.v - a.v);
  cats.push({ k: 'reading the code', v: 0 });
  const maxN = Math.max.apply(null, cats.map(c => c.v));
  const fig = CH.bars({
    w: 900, rowH: 30, max: maxN + 0.6, padL: 268, padR: 120,
    rows: cats.map(c => ({ k: c.k, v: c.v, lab: c.v === 0 ? 'none' : String(c.v),
      hover: c.v + ' of ' + BUGS.length + ' defects surfaced this way',
      token: c.v === 0 ? 'var(--c-ctx)' : undefined })),
    xTicks: [0, 1, 2, 3].filter(v => v <= maxN + 0.6).map(v => ({ v, t: String(v) })),
    xLabel: 'defects in this repository surfaced that way',
    alt: 'How each of ' + BUGS.length + ' real defects was caught. Impossible numbers, outside reads, '
      + 'calibration runs, red controls and byte pins each account for some; reading the code accounts for none.'
  });
  O.push(C.section({
    lab: '§0 · the count', title: 'How ' + BUGS.length + ' real defects were actually caught',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('Every defect below is one this repository shipped and then found. The bar at the bottom is the '
        + 'one the title is about, and it is empty on purpose: not one of them was caught by re-reading the '
        + 'code that contained it.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: BUGS.length + ' defects, each counted once under the mechanism that '
        + 'actually surfaced it. An impossible NUMBER — a value refuted against itself, a count that cannot be '
        + 'that large — did the most work; an outside reader and a red control did the rest. Reading the code '
        + 'found none, which is why the gates in this repository are arranged to produce impossible numbers '
        + 'loudly rather than to encourage careful reading.' })
  }));
}

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

/* ---- §5 · the reward-hacking battery ---------------------------------------
   The one section on this page that DEMONSTRATES rather than argues. Every
   number and every right-hand cell below is parsed from the battery run at the
   top of this file; the left-hand cells are the only prose, and they are keyed
   to the battery's own control letters so they cannot drift away from it. */
O.push(C.section({
  lab: '§5 · reward hacking', title: funnelReds.length + ' ways to cheat this machine', wide: true,
  bodyRaw: '<div class="col">'
    + C.p('The catalog above is about honest code that turned out to be wrong. This section is about the other '
      + 'failure, the one that gets worse as the machinery gets more capable: code that is optimizing. Anything '
      + 'that proposes candidates and scores them has a reward signal, and a reward signal that can be gamed '
      + 'eventually is gamed — by an evolutionary loop that finds the gap, by a language model that finds the '
      + 'shortcut, or by a maintainer who nudges a threshold until the number looks right. So the campaign '
      + 'runner in this repository ships with a battery whose whole job is to cheat it: ' + funnelReds.length
      + ' attacks, each one written to work, each one caught by a named control.')
    + C.p('What that demonstrates, and what it does not. The battery runs the full machine against a synthetic '
      + 'target whose answer is completely known — ' + F_RECALL[1] + ' integer vectors, exactly ' + F_RECALL[3]
      + ' hits, the property decided exactly in BigInt, one provably empty sub-box — because a gate’s teeth '
      + 'cannot be measured on a problem whose answer nobody has. Each row below therefore proves one thing '
      + 'precisely: that this control fires on this attack, with nothing written and no claim minted. It is not '
      + 'a proof that no attack exists. The honest claim is that these ' + funnelReds.length + ' do not work, and '
      + 'that this table is where the next one gets added the day somebody finds it.')
    + C.pRaw('<strong>Each row is one way to cheat this machine and the gate that caught it.</strong> The last '
      + 'column is not a description of what should happen — it is the line the battery printed during this build.')
    + '</div>'
    + C.table({
      cols: [{ h: '#', cls: 'n' }, { h: 'the cheat' }, { h: 'refused by' }, { h: 'what fired, this build' }],
      rows: funnelReds.map((r) => [
        { raw: C.m(r.id) },
        CHEATS[r.id].cheat,
        { raw: C.m(CHEATS[r.id].refuses) },
        r.detail
      ])
    })
    + '<div class="col">'
    + C.pRaw('<strong>And what passes when nothing is cheating.</strong> A battery of refusals proves only that '
      + 'the machine says no; these are the same run saying yes, with the numbers read from the same output.')
    + C.plainList([
      { b: 'Planted recall.', text: 'Enumerating the whole box: ' + F_RECALL[1] + '/' + F_RECALL[2]
        + ' candidates enumerated, ' + F_RECALL[3] + '/' + F_RECALL[4] + ' known hits found and certified, recall '
        + F_RECALL[5] + '. A screen may prune and may never admit, so the run refuses to start until the known '
        + 'answers have survived it.' },
      { b: 'A certified-empty box.', text: F_EMPTY[1] + '/' + F_EMPTY[2] + ' elements certified REJECT, one RECORD '
        + 'claim carrying an exhaustion certificate, zero hit-shaped claims. “We looked and there is nothing '
        + 'there” is a claim with a certificate behind it here, not an absence of output.' },
      { b: 'The cover, tiled.', text: 'The same box exhausted in ' + F_WINDOWS[1] + ' windows, each window carrying '
        + 'its own certificate and the record their mechanical conjunction — ' + F_COVER[1] + '/' + F_COVER[2]
        + ' checked, conservation exact. A third party re-verifies one window without trusting the other two.' },
      { b: 'A pre-filter that is allowed to exist.', text: 'The staged screens satisfy in = rejected + passed at '
        + 'every stage, checked when the record is written and re-derived afterwards by the battery, with all '
        + F_CASC[1] + ' hits still admitted.' },
      { b: 'Kill it and resume.', text: 'Killed after ' + F_RESUME[1] + ' batches with a torn half-written line '
        + 'left on the end, then resumed: the run file and the leaderboard came back byte-identical to the '
        + 'uninterrupted run.' },
      { b: 'Two counters, never one.', text: 'On one run the machine certified ' + F_DIVERGE[1] + ' hits and added '
        + F_DIVERGE[2] + ' to the board. Those count different things — decided this run, versus new to the '
        + 'board — and a summary printing only the flattering one is refused by name.' }
    ])
    + C.note({ lab: 'the 159x line, credited', bodyRaw: C.p('One row above is not this lab’s discovery and should '
      + 'not read like one. RED (b), the gamed score, exists because a published LLM-for-science project reported '
      + 'in its own paper that its early runs scored around 60 by feeding in initial conditions carrying 159x the '
      + 'background power — the metric was rewarding amplitude rather than physics — and that the same runs '
      + 'scored 3 to 8 once the harness normalized the input away. That number reaches this page second-hand, '
      + 'through an internal audit note dated 2026-08-20, and has not been re-verified at source here: it is '
      + 'quoted as history, exactly like the wrong bounds in the catalog above. What is ours is the gate. Before '
      + 'any campaign starts, the score function is handed a deliberately scale-inflated candidate and must not '
      + 'reward it, or the run refuses to start — their incident, self-reported; our permanent control, run every '
      + 'build. This page claims nothing about anyone else’s system beyond what that system published about '
      + 'itself.') })
    + C.pRaw('The battery is ' + C.m('machine/funnel/selftest/battery.js') + ': ' + funnelItems.length + ' items, '
      + funnelReds.length + ' red controls, no dependencies, about a second, deterministic enough that two runs '
      + 'produce byte-identical output. It runs inside ' + C.m('make test') + ' and it ran during this build — '
      + 'every count and every quoted line above was read out of that run rather than typed here. If an item goes '
      + 'red, if a red control stops firing, or if the battery grows a control this page does not describe, the '
      + 'build refuses and this page is not written.')
    + '</div>'
}));

O.push(C.section({
  lab: '§6 · the invitation', title: 'Replication is the good outcome',
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
  lab: '§7 · the gates, this build', title: 'What ran to let this page exist', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'battery' }, { h: 'what it holds for this catalog' }],
    rows: gateRows.map((g) => [{ raw: C.m(g.n) }, g.note])
  })
    + '<div class="col">' + C.pRaw('All ' + gateRows.length + ' executed by tools/build-report-methods.js during '
      + 'this build; any red refuses the page. The last one is also READ rather than only run: §5 is built out of '
      + 'its ' + funnelItems.length + ' item lines and ' + funnelReds.length + ' red-control lines, so a control '
      + 'that stops firing — or one this page has no description for — refuses the build by name. Recomputed '
      + 'from records on the way: the closed-form decomposition '
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
  TPL.render({ title: 'None by reading code · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/methods-note.html' }));
console.log('reports/methods-note.html written: ' + BUGS.length + ' bugs, ' + gateRows.length + ' gates green @ git ' + gitrev);
