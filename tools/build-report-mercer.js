#!/usr/bin/env node
/* build-report-mercer.js — generate reports/mercer-program.html: the whole
   certified mu/lambda program in one research note.

   Nothing on the page is remembered: every mu champion (box30 n = 9..17 and
   box40 n = 10..12) is RE-CERTIFIED during this build and must reproduce its
   recorded enclosure to the endpoint; the equality theorem M(0,1,2,6,9) = 1
   is RE-PROVED (deflation + Sturm); the mu(5) ladder record is re-checked
   rung by rung; the lambda table's row set and values are read from the
   battery-gated certificate. The build refuses on any deviation.

   FRAMING DISCIPLINE (Boyd 1986 is unread; ILL pending): every row is a
   "first CERTIFICATE over a named box", never a "first witness"; mu rows are
   BOX MAXIMA (lower bounds for the box, dips at high n are crowding, not
   mathematics); lambda rows are upper bounds on an infimum and order nothing
   across n; brackets, never values; upper bounds round UP. The word
   "anywhere" is BANNED from this page: it is a claim about the historical
   record, and this lab has not read the historical record.

   COUNTING DISCIPLINE (§6): the largest asset here is the decided NEGATIVE at
   scale, and it is published BY KIND. Sets, boxes and candidate closed forms
   are different objects; they are never summed into one headline. Within a
   kind, nested sweeps are DEFLATED before anything is printed — box 30 sits
   inside box 40 at n = 10..12, and each M = 25 lambda box sits inside its
   M = 30 successor, so a naive row sum counts the same object twice.

   PROVENANCE (§2, §3): the lambda rows carry it as structure (sourceLab +
   reproduces); the mu certificates carry NO provenance field at all, so the
   mu column is sourced from instruments/trigmin/envelope.js, the registry
   that splits ANCHORS (literature / source lab, each with a src) from
   ADOPTED (what this lab certified and promoted). That column states what
   this lab had ON FILE before the sweep — never what the literature holds.

   usage: node tools/build-report-mercer.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const N = require(path.join(ROOT, 'instruments', 'trigmin', 'newman.js'));
const S = require(path.join(ROOT, 'instruments', 'trigmin', 'sweep.js'));
const Q = require(path.join(ROOT, 'instruments', 'interval', 'rational.js'));

const die = (m) => { console.error('MERCER REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const rj = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const fmt = (n) => Number(n).toLocaleString('en-US');

/* every sweep row states a conservation identity — killed + killed + certified
   + survivors = totalSets. It is only a gate if somebody adds it up, so this
   does, on every row of every table, and the count published downstream is the
   identity's own right-hand side. */
const consClose = (r, what) => {
  const mm = /^\s*([0-9+\s]+?)\s*=\s*([0-9]+)\s*$/.exec(String(r.conservation));
  if (!mm) die('conservation identity unreadable on ' + what + ': ' + r.conservation);
  const lhs = mm[1].split('+').reduce((s, x) => s + Number(x.trim()), 0), rhs = Number(mm[2]);
  if (lhs !== rhs) die('conservation identity does not close on ' + what + ': ' + r.conservation);
  if (rhs !== r.totalSets) die('conservation total disagrees with totalSets on ' + what + ': ' + rhs + ' vs ' + r.totalSets);
  return rhs;
};

/* ---- 1 · the mu tables: every champion re-certified ----------------------- */
const MU30 = rj('certs/mu-table.json'), MU40 = rj('certs/mu-table-40.json');
let champsReproved = 0;
const muRows = [];
for (const [label, table, box] of [['box30', MU30, 30], ['box40', MU40, 40]]) {
  for (const n of Object.keys(table.rows).map(Number).sort((a, b) => a - b)) {
    const r = table.rows[n];
    const fresh = N.certifyNewman(r.champion.A, { bar: 1 });
    if (fresh.modulus[0] !== r.champion.modulus[0]) die('champion ' + label + ' n=' + n + ' no longer reproduces its floor');
    champsReproved++;
    muRows.push({ n, box, A: r.champion.A, floor: r.champion.modulus[0], sets: consClose(r, label + ' n=' + n) });
  }
}
/* certified floors round DOWN (they are lower bounds) */
const floorDown = (x) => { const q = Q.fromDouble(x); const sc = 10n ** 12n; return (Number(q.n * sc / q.d) / 1e12).toFixed(12); };

/* ---- 2 · the equality theorem, re-proved ---------------------------------- */
const EQ = S.certifyMinEqualsOne([0, 1, 2, 6, 9]);
if (EQ.verdict !== 'EQUALITY') die('M(0,1,2,6,9) = 1 no longer re-proves: ' + JSON.stringify(EQ));

/* ---- 3 · the lambda table (battery-gated record) -------------------------- */
const LAM = rj('certs/lambda-table.json');
const lamBest = {};
for (const k of Object.keys(LAM.rows)) {
  const [n, M] = k.split('@').map(Number);
  if (!lamBest[n] || M > lamBest[n].M) lamBest[n] = { M, r: LAM.rows[k] };
}
const lamNs = Object.keys(lamBest).map(Number).sort((a, b) => a - b);
if (lamNs.length !== 14 || lamNs[0] !== 4 || lamNs[13] !== 17) die('lambda table shape moved: n = ' + lamNs.join(','));
for (const k of Object.keys(LAM.rows)) consClose(LAM.rows[k], 'lambda ' + k);
const ceilUp = (x) => { const q = Q.fromDouble(x); const sc = 10n ** 12n;
  let v = q.n * sc / q.d; if (q.n * sc % q.d !== 0n) v += 1n; return (Number(v) / 1e12).toFixed(12); };

/* ---- 3a · the lambda deepening, read as a VERDICT not a clause -----------
   Nine rows were re-decided at M = 30 after a settled M = 25 answer. Each one
   carries a `vsShallower` verdict written by the run that produced it, and
   eight of them say the incumbent survived. That is a proved negative over
   most of a billion sets, and it used to be one subordinate clause. */
const keyA = (A) => A.join(',');
const lamDeepenings = Object.keys(LAM.rows).filter(k => LAM.rows[k].vsShallower)
  .map(k => ({ k, r: LAM.rows[k] })).sort((a, b) => a.r.n - b.r.n);
if (!lamDeepenings.length) die('no lambda deepening carries a vsShallower verdict');
for (const d of lamDeepenings) {
  const prev = LAM.rows[d.r.n + '@25'];
  if (!prev) die('deepening ' + d.k + ' has no M = 25 predecessor to have deepened FROM');
  d.prev = prev;
  d.same = keyA(prev.optimiser.A) === keyA(d.r.optimiser.A);
  d.confirmed = /CONFIRMED/.test(d.r.vsShallower);
  /* the recorded verdict and the recorded optimisers must agree, or one lies */
  if (d.confirmed !== d.same)
    die('lambda ' + d.k + ' verdict "' + d.r.vsShallower + '" disagrees with its own optimiser rows');
}
const lamConfirmed = lamDeepenings.filter(d => d.confirmed);
const lamImproved = lamDeepenings.filter(d => !d.confirmed);
const confSets = lamConfirmed.reduce((s, d) => s + d.r.totalSets, 0);
const confPrior = lamConfirmed.reduce((s, d) => s + d.prev.totalSets, 0);
const confNew = confSets - confPrior;                 /* sets the deepening ADDED */
const impSets = lamImproved.reduce((s, d) => s + d.r.totalSets, 0);

/* ---- 3b · lambda provenance, from the field the record actually carries ---
   `sourceLab` + `reproduces` sit on the row that did the reproducing. For
   n = 9..12 that is the M = 25 row, and the displayed M = 30 row inherits it
   only because its own vsShallower says the optimiser did not move — so the
   chain is followed, never assumed. */
function lamProv(n) {
  const shown = lamBest[n].r;
  if (shown.sourceLab) {
    if (!shown.reproduces || keyA(shown.sourceLab.A) !== keyA(shown.optimiser.A))
      die('lambda n=' + n + ' claims a source-lab reproduction its own optimiser does not match');
    return { kind: 'reproduces', text: 'reproduces source lab', via: '' };
  }
  const d = lamDeepenings.find(x => x.r.n === n);
  if (d && d.confirmed && d.prev.sourceLab && d.prev.reproduces
      && keyA(d.prev.sourceLab.A) === keyA(shown.optimiser.A))
    return { kind: 'reproduces', text: 'reproduces source lab', via: 'via M = ' + d.prev.M + ', optimiser CONFIRMED at M = ' + d.r.M };
  return { kind: 'none', text: 'no source-lab counterpart', via: '' };
}
const lamProvOf = {};
for (const n of lamNs) lamProvOf[n] = lamProv(n);
const lamRepro = lamNs.filter(n => lamProvOf[n].kind === 'reproduces');
const lamNew = lamNs.filter(n => lamProvOf[n].kind !== 'reproduces');

/* ---- 4 · the mu(5) ladder -------------------------------------------------- */
const LAD = rj('certs/mercer-mu5.json');
const rungs = Object.keys(LAD.rows).map(Number).sort((a, b) => a - b);
for (const m of rungs) if (LAD.rows[m].verdict !== 'CERTIFIED') die('ladder rung m=' + m + ' not CERTIFIED');
const topM = rungs[rungs.length - 1];
const ladderCases = rungs.reduce((s, m) => s + LAD.rows[m].conservation.distinctTuples, 0);

/* ---- 5 · mu provenance, from the only authority that carries it ----------
   THE GAP, stated plainly: certs/lambda-table.json rows carry `sourceLab` and
   `reproduces` as STRUCTURE; certs/mu-table.json and certs/mu-table-40.json
   carry neither field on any row, even though n = 9 reproduces the source
   lab's record and n = 10..17 do not. Reproduction-vs-discovery was therefore
   a structured field on one table and prose on the other, and prose is not a
   gate. The certificates are not edited here. What IS structured is the
   envelope registry — instruments/trigmin/envelope.js — which splits ANCHORS
   (literature and the source lab, each with a `src` naming where it came
   from) from ADOPTED (objects this lab certified and promoted in a dated
   edit). Every mu row's provenance below is read from that registry and every
   comparison is re-certified here. It says what this lab HAD ON FILE at that
   n before the sweep — never what the printed record holds. */
const ENV = require(path.join(ROOT, 'instruments', 'trigmin', 'envelope.js'));
{ /* two records, one object: the box-30 champions ARE the envelope's adopted
     rows, so a disagreement between the certificate and the registry that
     quotes it refuses the page. */
  const adopted = new Map(ENV.ADOPTED.filter(e => e.from === 'mu-table').map(e => [e.n, e]));
  for (const r of muRows) {
    if (r.box !== 30) continue;
    const a = adopted.get(r.n);
    if (!a || keyA(a.A) !== keyA(r.A))
      die('box30 champion n=' + r.n + ' is not the envelope ADOPTED row for its n — two records disagree');
  }
}
for (const r of muRows) {
  let p = null;
  if (r.box === 40) {                       /* the wider box's incumbent is our own narrower one */
    const b30 = muRows.find(x => x.box === 30 && x.n === r.n);
    if (b30) p = { label: 'box 30 maximum', src: 'this lab · certs/mu-table.json', A: b30.A };
  } else {
    const anc = ENV.ANCHORS.find(e => e.n === r.n);
    const ado = ENV.ADOPTED.find(e => e.n === r.n && e.from !== 'mu-table');
    if (anc) p = { label: 'anchor', src: anc.src, A: anc.A };
    else if (ado) p = { label: 'adopted', src: ado.src, A: ado.A };
  }
  if (p) {                                   /* the incumbent is re-certified, never transcribed */
    const c = N.certifyNewman(p.A, { bar: 0 });
    p.floor = c.modulus[1];                  /* compare against its UPPER end: strict */
    p.beaten = r.floor > p.floor;
    p.inBox = Math.max.apply(null, p.A) <= r.box;
  }
  r.prior = p;
}
const muNoPrior = muRows.filter(r => !r.prior);

/* ---- 6 · the exhaustive negatives, counted BY KIND -----------------------
   The largest thing this repository holds is not a hit; it is the decided
   NEGATIVE at scale. Two counting rules, both load-bearing:

   (a) NO SINGLE HEADLINE. Sets, boxes and candidate closed forms are
       different objects. Adding them would produce exactly the inflated
       number this machine exists to refuse, so each kind is listed with its
       unit named and its count read from its own record at build.
   (b) DEFLATE FIRST. Within a kind, nested sweeps re-decide the same object:
       box 30 sits inside box 40 at n = 10..12, and each M = 25 lambda box
       sits inside its M = 30 successor. A naive row sum counts those twice.
       Every figure below subtracts the overlap and names what it subtracted. */
const mu30Sets = muRows.filter(r => r.box === 30).reduce((s, r) => s + r.sets, 0);
const mu40Sets = muRows.filter(r => r.box === 40).reduce((s, r) => s + r.sets, 0);
const muNestedSets = muRows.filter(r => r.box === 30 && MU40.rows[r.n]).reduce((s, r) => s + r.sets, 0);
const muNaiveSets = mu30Sets + mu40Sets;
const muDistinctSets = muNaiveSets - muNestedSets;
if (muDistinctSets !== mu40Sets + muRows.filter(r => r.box === 30 && !MU40.rows[r.n]).reduce((s, r) => s + r.sets, 0))
  die('the mu deflation does not close');

const lamAllSets = Object.keys(LAM.rows).reduce((s, k) => s + LAM.rows[k].totalSets, 0);
const lamDeepSets = lamNs.reduce((s, n) => s + lamBest[n].r.totalSets, 0);
const lamRedecided = lamAllSets - lamDeepSets;

/* mu sets (Newman, {0} u exponents) and lambda sets (Chowla, subsets of 1..M)
   are disjoint populations of the same UNIT, so these two may be added — and
   nothing else on this page may. */
const setsExhausted = muDistinctSets + lamDeepSets;

/* the Hénon census: a different unit entirely — subdivision BOXES, each one
   either proved to contain no period-p point or resolved to a certified one */
const CENSUS = rj('certs/census-high-periods.json');
let censusBoxes = 0, censusPoints = 0; const censusPs = [];
for (const r of CENSUS) {
  if (!r.ok) die('census record p=' + r.p + ' did not complete');
  if (!r.recheck || !r.recheck.ok || r.recheck.unmatched !== 0)
    die('census p=' + r.p + ' recheck left ' + (r.recheck ? r.recheck.unmatched : '?') + ' unmatched');
  censusBoxes += r.boxes; censusPoints += r.points; censusPs.push(r.p);
}

/* and a third unit: candidate CLOSED FORMS, from the engine's ledger. The
   decomposition gate is the same one run-engine and build-site enforce. */
const LEDGER = rj('ledger.json'), T = LEDGER.totals;
{
  const parts = T.closedFormRefuted + T.closedFormRefutedExact + T.closedFormOnRecord
    + T.closedFormOpen + T.closedFormCandidates;
  if (parts !== T.closedFormTested) die('the closed-form decomposition does not close: ' + parts + ' != ' + T.closedFormTested);
}
if (LEDGER.relations.length !== T.closedFormCandidates) die('ledger relations and candidate count disagree');
const cfRefuted = T.closedFormRefuted + T.closedFormRefutedExact;

/* ---- the page -------------------------------------------------------------- */
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · every champion re-certified at build',
  title: 'The Mercer program: mu, lambda, and a 40-year bracket',
  deck: 'Chowla asked how negative a sum of n cosines must dip; Newman asked how large the minimum modulus of an '
    + 'n-term 0/1 polynomial can stay. This program certifies both landscapes with exact arithmetic: exhaustive '
    + 'box sweeps for the extremal tables (every set decided, a conservation identity per box), an equality no '
    + 'enclosure could ever decide, and a bracket on mu(5) pushed fourteen rungs past the literature — on the '
    + 'lineage Campbell–Ferguson–Forcade 1983 → Goddard 1992 → Mercer 2019 → here.'
}));

O.push(C.tldr({
  findingRaw: 'mu(5) ≤ 1 + π/20 certified — fourteen rungs past the literature on a forty-year lineage — plus '
    + 'certified mu(n) box maxima for n = 10..17, each the first CERTIFICATE over its named box (a claim about '
    + 'the certificate, not about priority — §7), and M(0,1,2,6,9) = 1 EXACTLY, by Sturm. Behind all of it, '
    + 'the part that never gets counted: ' + fmt(setsExhausted) + ' sets decided exhaustively, deflated (§6).',
  mechanismRaw: 'Exhaustive box sweeps with a conservation identity per box; every exceptional tuple closed by '
    + 'one exact rational evaluation against an exact bar; the equality decided by a Sturm chain no floating '
    + 'enclosure could ever reach.',
  checkRaw: C.m('node instruments/trigmin/mercer6-battery.js') + ' — Mercer\'s own Tables 5–7 must reproduce '
    + 'exactly before any new rung counts.'
}));

O.push(C.stats([
  { k: 'sets decided exactly', v: fmt(setsExhausted), role: 'held', n: 'DISTINCT sets across every mu and lambda box; each box carries a conservation identity that must close, and ' + fmt(muNestedSets + lamRedecided) + ' re-decided sets are subtracted, not counted twice (§6)' },
  { k: 'mu rows certified', v: muRows.length + '', role: 'held', n: 'n = 9..17 at box 30, n = 10..12 at box 40 — all ' + champsReproved + ' champions re-certified during THIS build' },
  { k: 'lambda rows', v: lamNs.length + '', role: 'held', n: 'n = 4..17; ' + lamRepro.length + ' reproduce the source lab (n=4 to the per-stage kill split), ' + lamNew.length + ' have no source-lab counterpart, all deepened to M = 30' },
  { k: 'mu(5) bracket', v: '1 ≤ mu(5) ≤ 1 + π/' + topM, sm: true, role: 'held', n: (1 + Math.PI / topM).toFixed(6) + ' — ' + rungs.length + ' certified rungs, ' + fmt(ladderCases) + ' exceptional tuples closed by exact points' },
  { k: 'one exact equality', v: 'M(0,1,2,6,9) = 1', sm: true, role: 'held', n: 're-proved this build by deflation + Sturm — a tie no interval enclosure can decide' },
  { k: 'framing', v: 'CERTIFICATES', role: 'warn', n: 'first certificates over NAMED boxes — never "first witness": Boyd 1986 remains unread, and prose stays inside what is proved' }
]));

/* ---- the ladder, drawn ---------------------------------------------------
   Each rung is a bound, and the bound is 1 + pi/m: the picture is the bracket
   closing rung by rung, with the literature's stopping point marked so the
   reader can see exactly how much of the curve is ours. */
{
  const LIT = 6;                       /* the literature's last certified rung */
  const pts = rungs.map(m => [m, 1 + Math.PI / m]);
  const top = 1 + Math.PI / rungs[0], bot = 1 + Math.PI / topM;
  const fig = CH.lines({
    w: 900, h: 320, x0: rungs[0], x1: topM, y0: 1, y1: top * 1.01,
    xTicks: rungs.filter(m => m % 2 === 1 || m === topM).map(m => ({ v: m, t: String(m) })),
    yTicks: [1, 1.2, 1.4, 1.6].filter(v => v <= top * 1.01).map(v => ({ v, t: v.toFixed(1) })),
    xLabel: 'rung m  —  each one an exhaustive exact search closing every exceptional tuple at that m',
    yLabel: 'certified upper bound on mu(5)',
    bands: [{ x0: rungs[0], x1: LIT, token: 'var(--c-grid)', t: 'the literature stops here' }],
    rules: [{ v: 1, t: 'mu(5) ≥ 1', token: 'var(--c-ctx)' }],
    series: [{ name: '1 + π/m', pts, area: true, endLabel: bot.toFixed(4) }],
    xOf: m => 'rung m = ' + m,
    vOf: v => 'mu(5) ≤ ' + v.toFixed(6),
    alt: 'The certified upper bound on mu(5), 1 + pi/m, falling from ' + top.toFixed(4) + ' at m = ' + rungs[0]
      + ' to ' + bot.toFixed(4) + ' at m = ' + topM + '. The region up to m = ' + LIT + ', where the literature '
      + 'stops, is shaded; everything to its right is certified here.'
  });
  O.push(C.section({
    lab: '§0 · the ladder', title: 'The bracket on μ(5), rung by rung',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('Every rung is a separate exhaustive claim: at that m, every exceptional tuple is closed by one '
        + 'exact rational evaluation against an exact bar. The curve is what those claims add up to.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: rungs.length + ' certified rungs, m = ' + rungs[0] + '..' + topM
        + ', closing ' + fmt(ladderCases) + ' exceptional tuples between them. The bound falls from '
        + top.toFixed(4) + ' to ' + bot.toFixed(4) + ' against a floor of exactly 1, so the bracket on μ(5) is '
        + 'now ' + (bot - 1).toFixed(4) + ' wide. The shaded region is the literature\'s reach; the '
        + (topM - LIT) + ' rungs to its right are this machine\'s, and each one is an exhaustion, not a sample.' })
  }));
}

O.push(C.section({
  lab: '§1 · the program', title: 'Two extremal landscapes, one discipline',
  bodyRaw: '<div class="col">'
    + C.pRaw('For a set A of n positive integers, write f_A(θ) = Σ cos(aθ) and λ(n) for the smallest possible '
      + 'dip −min f_A over all n-sets (Chowla\'s cosine problem asks if λ(N) ≫ √N). For nonnegative exponents, '
      + 'write M(A) = min |Σ z^a| on the unit circle and mu(n) = sup M over n-term sets (Newman polynomials; '
      + 'mu is indexed by TERMS throughout). Both are extremal quantities over infinite families, so no finite '
      + 'computation evaluates them — what a machine CAN hold is exact: exhaustive sweeps over named boxes '
      + '{exponents ≤ M}, every set decided by integer kills at roots of unity, exact dyadic Chebyshev kills, '
      + 'and full certification of survivors, with a per-box conservation identity that throws if a single set '
      + 'goes unaccounted. A mu row is a certified BOX MAXIMUM — a lower bound for the box, and the dips at '
      + 'high n are box crowding, not mathematics (box 30 → 40 raised mu(12)\'s floor by +0.135). A lambda row '
      + 'is a certified upper bound on an infimum. Neither is ever printed as "the value".')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · the mu table', title: 'Certified floors, n = 9..17 — and what wider boxes taught', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'n' }, { h: 'box' }, { h: 'certified floor (rounds DOWN)', cls: 'v' }, { h: 'champion A' },
      { h: 'sets decided' }, { h: 'prior witness ON FILE here' }],
    rows: muRows.map((r) => [String(r.n), '≤ ' + r.box, { raw: '<span class="m">mu(' + r.n + ') ≥ ' + floorDown(r.floor) + '</span>' },
      { raw: '<span class="m">{' + r.A.join(',') + '}</span>' }, fmt(r.sets),
      r.prior
        ? r.prior.label + ' — ' + r.prior.src + ' · ' + (r.prior.inBox ? 'inside this box' : 'OUTSIDE this box')
          + ', floor ' + (r.prior.beaten ? 'exceeded' : 'NOT exceeded')
        : 'none on file at this n'])
  })
  + '<div class="col">' + C.pRaw('n = 9 validates cross-lab: the six-survivor, two-orbit structure of the source '
    + 'lab\'s record reproduces with the published witness floor to the last digit — Boyd\'s anchor witness '
    + '{' + (ENV.ANCHORS.find(e => e.n === 9) || { A: [] }).A.join(',') + '} comes back as a survivor of this '
    + 'sweep, and the box maximum stands above it. For n = 10..17 this lab holds no earlier certificate at all; '
    + 'whether any printed table holds those rows is precisely the question Boyd 1986 would settle, and it is '
    + 'unread (§7). The box-extension lesson is three for three: at n ≥ 10 the box-30 maxima were crowding '
    + 'artifacts, and box 40 lifted every floor it touched — mu(10) past even mu(9)\'s, killing the "dip" '
    + 'reading. Every champion above was re-certified during this build; a champion that fails to reproduce its '
    + 'floor refuses the page.') + '</div>'
  + '<div class="col">' + C.note({ lab: 'where that last column comes from',
    bodyRaw: C.pRaw('The mu certificates carry NO provenance field — unlike the lambda rows, which record '
      + C.m('sourceLab') + ' and ' + C.m('reproduces') + ' as structure, ' + C.m('certs/mu-table.json') + ' and '
      + C.m('certs/mu-table-40.json') + ' have neither on any row, so "n = 9 is a reproduction, n = 10..17 are '
      + 'not" lived only in prose. The column is therefore sourced from ' + C.m('instruments/trigmin/envelope.js')
      + ', the registry that splits ANCHORS (literature and the source lab, each with a named ' + C.m('src') + ') '
      + 'from ADOPTED (what this lab certified and promoted). Its incumbent witness is re-certified during this '
      + 'build and compared against the champion at the strict end, and every box-30 champion must BE the '
      + 'envelope\'s adopted row for its n or the page refuses. Read it as "what this lab had on file before the '
      + 'sweep" — ' + muNoPrior.length + ' of the ' + muRows.length + ' rows had nothing — never as a statement '
      + 'about the printed record. The n = 17 incumbent reaches exponent 38 and so was never inside box 30 at '
      + 'all; the row still names it, because a comparison the sweep could not make is worth showing.') })
    + '</div>'
}));

O.push(C.section({
  lab: '§3 · the lambda table', title: 'n = 4..17, deepened to M = 30', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'n' }, { h: 'λ(n) ≤ (rounds UP)', cls: 'v' }, { h: 'witness A' }, { h: 'box M' },
      { h: 'provenance (from the record\'s own field)' }],
    rows: lamNs.map((n) => { const b = lamBest[n], p = lamProvOf[n]; return [String(n),
      { raw: '<span class="m">' + ceilUp(b.r.optimiser.lambda[1]) + '</span>' },
      { raw: '<span class="m">{' + b.r.optimiser.A.join(',') + '}</span>' }, String(b.M),
      p.text + (p.via ? ' — ' + p.via : '')]; })
  })
  + '<div class="col">' + C.pRaw('The ' + lamRepro.length + ' source-lab rows reproduce exactly — n = 4 down to '
    + 'the per-stage kill split (2818 + 2022 + 0 + 5), with proved closed forms COMPUTED, never remembered '
    + '(λ(2) = 9/8 exact; λ(3) = (17+7√7)/27 via certified square root). Rows n = ' + lamNew.join(', ')
    + ' have no counterpart in the source lab\'s record and none in any table this lab has read. The last '
    + 'column is not prose: it is the record\'s own ' + C.m('sourceLab') + ' + ' + C.m('reproduces') + ' fields, '
    + 'and where the displayed M = 30 row does not carry them the chain is FOLLOWED — the M = 25 row that does '
    + 'carry them, plus that deepening\'s own verdict that the optimiser did not move — never assumed. '
    + 'A caution priced into every row: these are upper bounds on an infimum, exact only within their named '
    + 'boxes, and rows at different n order nothing.') + '</div>'
  + '<div class="col">' + C.pRaw('<b>What the M = 30 deepening actually returned.</b> '
    + lamDeepenings.length + ' rows were re-decided in the wider box after a settled M = 25 answer. '
    + (lamImproved.length
        ? lamImproved.length + ' improved — λ(' + lamImproved.map(d => d.r.n).join(', ') + ') fell, the wider box '
          + 'finding ' + lamImproved.map(d => '{' + d.r.optimiser.A.join(',') + '}').join(' and ') + ', reaching exponent '
          + Math.max.apply(null, lamImproved[0].r.optimiser.A) + ', structurally unlike the near-interval '
          + 'shallow-box optimiser. '
        : 'Not one of them improved a bound. ')
    + 'The other ' + lamConfirmed.length + ' returned the incumbent: at n = '
    + lamConfirmed.map(d => d.r.n).join(', ') + ' the M = 25 optimiser is CONFIRMED as the M = 30 optimiser. '
    + 'That verdict cost ' + fmt(confSets) + ' sets decided exactly, ' + fmt(confNew) + ' of them never inside '
    + 'a certified box before, and the collective answer is <em>nothing beat the incumbent</em>. It is a proved '
    + 'negative over ' + fmt(confSets) + ' sets, not a search that came up empty — §6 counts it as such.') + '</div>'
}));

O.push(C.section({
  lab: '§4 · the bracket', title: 'mu(5) ≤ 1 + π/' + topM + ', ' + rungs.length + ' certified rungs',
  bodyRaw: '<div class="col">'
    + C.pRaw('Mercer proved mu(5) ≤ 1 + π/5 and SKETCHED 1 + π/6, reducing the hard cases to a finite search '
      + 'over fractions with bounded denominators plus per-tuple checks — "a finite search (aided by computer)" '
      + 'and "one can verify". This lab certified both computer-aided components at GENERAL m: the search runs '
      + 'in exact rationals (m = 5 reproduces his Table 5\'s unique quadruple; m = 6 his Tables 6 and 7, and '
      + 'the source lab\'s record row for row), and every exceptional tuple is closed by ONE exact rational '
      + 'evaluation of |f|² against the exact bar (1 + πLo/m)². The ladder now runs m = 5..' + topM + ' — '
      + fmt(ladderCases) + ' tuples across ' + rungs.length + ' rungs, every one certified — ending at '
      + 'mu(5) ≤ ' + (1 + Math.PI / topM).toFixed(6) + '. With §5\'s witness this brackets 1 ≤ mu(5) ≤ 1 + π/' + topM + '. '
      + 'Component (i), the reduction, is consumed from Mercer 2019 (his Lemma 6.2; general m stated on his '
      + 'p. 16) the way Krawczyk\'s theorem is consumed in validated numerics — named in the certificate, '
      + 'checked at its calibrations.')
    + '</div>'
}));

O.push(C.section({
  lab: '§5 · the equality', title: 'M(0,1,2,6,9) = 1 — exactly, by Sturm',
  bodyRaw: '<div class="col">'
    + C.pRaw('Mercer observed M(0,1,2,6,9) = 1 and suspected mu(5) = 1. An enclosure can never decide that tie '
      + '— the minimum SITS on the bar. The certificate that can: |f|² − 1 factors as (y+1)·H(y) exactly '
      + '(y = cos θ), H(−1) = 92 > 0, and a Sturm chain counts ZERO roots of H in [−1, 1] — so the minimum is '
      + 'EXACTLY 1, attained at z = −1 and nowhere else. Re-proved during this build in under a millisecond. '
      + 'The same tuple reappears in §4\'s ladder from m = 10 as the reversal (3,7,8,9), and its case closes '
      + 'with g(−1) = 1 ≤ bar at every rung — the two results agreeing is not a coincidence; it is the same '
      + 'exact arithmetic.')
    + '</div>'
}));

/* ---- §6 · the negatives, by kind ------------------------------------------
   One stat strip and ONE table. The stat strip never resolves into a total,
   and the table's last row says so in the table itself, because the reader
   who is going to add these up deserves to be stopped inside the artifact
   rather than in a footnote. */
{
  const KINDS = [
    { kind: 'Newman box sweep, box 40 · n = 10..12', unit: 'sets', count: mu40Sets,
      says: 'this 0/1 polynomial\'s min |f| on the circle is below the bar — or it survives and is certified',
      rec: 'certs/mu-table-40.json' },
    { kind: 'Newman box sweep, box 30 · n = 9..17', unit: 'sets', count: mu30Sets,
      says: 'the same decision in the narrower box; ' + fmt(muNestedSets) + ' of these sets lie inside box 40 too and are counted ONCE',
      rec: 'certs/mu-table.json' },
    { kind: 'Chowla box sweep · n = 4..17', unit: 'sets', count: lamDeepSets,
      says: 'this set\'s certified dip does not beat the bar — deepest box per n; the ' + fmt(lamRedecided) + ' sets re-decided at a shallower M are not counted again',
      rec: 'certs/lambda-table.json' },
    { kind: 'Hénon periodic-point census · p = ' + censusPs[0] + '..' + censusPs[censusPs.length - 1], unit: 'boxes', count: censusBoxes,
      says: 'no period-p point lies in this box — or exactly one does, certified; the plane is exhausted and the recheck leaves 0 unmatched',
      rec: 'certs/census-high-periods.json' },
    { kind: 'closed-form hunt · ' + fmt(LEDGER.conjectures.length) + ' certified enclosures', unit: 'candidate closed forms', count: T.closedFormTested,
      says: 'the certified value provably lies OUTSIDE this form — ' + fmt(cfRefuted) + ' refuted, ' + fmt(T.closedFormOnRecord) + ' already on the OEIS record, ' + T.closedFormCandidates + ' surviving',
      rec: 'ledger.json' }
  ];
  O.push(C.section({
    lab: '§6 · the negatives, by kind', title: 'What has been decided exhaustively — and why there is no single number',
    wide: true,
    bodyRaw: C.stats([
      { k: 'mu sets · box 40', v: fmt(mu40Sets), role: 'held', n: 'unit: SETS. n = 10..12, every set {0} ∪ (n−1 exponents ≤ 40), each decided against an exact bar' },
      { k: 'mu sets · box 30', v: fmt(mu30Sets), role: 'held', n: 'unit: SETS. n = 9..17; ' + fmt(muNestedSets) + ' also lie inside box 40 and are never counted twice on this page' },
      { k: 'lambda sets', v: fmt(lamDeepSets), role: 'held', n: 'unit: SETS. Deepest box per n over n = 4..17; the 23 recorded rows sum to ' + fmt(lamAllSets) + ' only by re-counting shallower boxes' },
      { k: 'Hénon boxes', v: fmt(censusBoxes), role: 'held', n: 'unit: BOXES — a different object entirely. p = ' + censusPs.join(', ') + ', plane exhausted, ' + fmt(censusPoints) + ' points found, 0 unmatched on recheck' },
      { k: 'closed forms tested', v: fmt(T.closedFormTested), role: 'held', n: 'unit: CANDIDATE CLOSED FORMS — a third object. ' + fmt(cfRefuted) + ' refuted against certified enclosures (' + fmt(T.closedFormRefuted) + ' in double, ' + T.closedFormRefutedExact + ' exactly in BigInt), ' + T.closedFormCandidates + ' surviving' },
      { k: 'the total', v: 'NOT ONE NUMBER', sm: true, role: 'warn', n: 'sets, boxes and closed forms do not add. A headline that summed them would be exactly the inflated number this machine exists to refuse' }
    ])
    + C.table({
      cols: [{ h: 'kind' }, { h: 'unit' }, { h: 'decided exhaustively', cls: 'v' }, { h: 'what ONE decision says' }, { h: 'record read at build' }],
      rows: KINDS.map(k => [k.kind, k.unit, fmt(k.count), k.says, { raw: C.m(k.rec) }]).concat([
        [{ raw: '<b>one headline figure</b>' }, '—', { raw: '<b>REFUSED</b>' },
          'three different objects; the only sum this page makes is ' + fmt(muDistinctSets) + ' + ' + fmt(lamDeepSets)
          + ' = ' + fmt(setsExhausted) + ' DISTINCT sets, because mu sets and lambda sets are the same unit and disjoint populations',
          { raw: C.m('this page') }]
      ])
    })
    + '<div class="col">' + C.pRaw('Every number above is a NEGATIVE at scale. A box sweep publishes one champion '
      + 'and quietly decides everything else against it; a census publishes a point count and quietly proves the '
      + 'rest of the plane empty; the closed-form hunt publishes zero discoveries and refutes '
      + fmt(cfRefuted) + ' forms exactly. Those refusals are the work, and each one is proved — not a '
      + 'truncated-decimal miss, not a search that timed out. They are listed here by kind and never added, '
      + 'because the units differ; the counting rule that forbids the sum is the same rule that makes each row '
      + 'worth printing.') + '</div>'
    + '<div class="col">' + C.pRaw('<b>The single largest one is the quietest.</b> ' + fmt(confSets)
      + ' sets were re-decided when the lambda table was deepened from M = 25 to M = 30 at n = '
      + lamConfirmed.map(d => d.r.n).join(', ') + ' — ' + fmt(confNew) + ' of them never inside a certified box '
      + 'before — and the collective answer was <em>the incumbent still stands</em>: at all '
      + lamConfirmed.length + ' of those n the M = 25 optimiser is CONFIRMED as the M = 30 optimiser. That is a '
      + 'proved negative over ' + fmt(confSets) + ' sets, not a failed search. Exactly '
      + lamImproved.length + ' of the ' + lamDeepenings.length + ' deepenings moved a bound (λ('
      + lamImproved.map(d => d.r.n).join(', ') + '), on ' + fmt(impSets) + ' sets), and that one improvement is '
      + 'what the page used to report — the ' + fmt(confSets) + ' sets behind the other answer were a single '
      + 'subordinate clause.') + '</div>'
    + '<div class="col">' + C.note({ lab: 'the deflation, stated',
      bodyRaw: C.pRaw('A naive row sum over the mu tables gives ' + fmt(muNaiveSets) + ' sets; box 30 sits inside '
        + 'box 40 at n = 10..12, so ' + fmt(muNestedSets) + ' sets would be counted twice and the honest figure is '
        + fmt(muDistinctSets) + '. A naive row sum over the 23 recorded lambda boxes gives ' + fmt(lamAllSets)
        + '; each M = 25 box sits inside its M = 30 successor, so ' + fmt(lamRedecided) + ' sets would be counted '
        + 'twice and the honest figure is ' + fmt(lamDeepSets) + '. Re-deciding a set in a wider box is real work '
        + 'and a real check — it is simply not a second set. Every count on this page is the right-hand side of a '
        + 'conservation identity that the build re-adds row by row and refuses if it does not close.') })
      + '</div>'
  }));
}

O.push(C.section({
  lab: '§7 · honesty', title: 'What "first certificate" claims, and what it does not',
  bodyRaw: '<div class="col">'
    + C.pRaw('Boyd\'s 1986 survey of large Newman polynomials (LMS Lecture Notes 109) is not yet read '
      + 'first-party in this lab — the volume is access-restricted and an ILL request is the operator\'s open '
      + 'action. Until those bytes are read, no sentence here claims a "first witness" or priority over the '
      + 'printed record: every row is a FIRST CERTIFICATE — an exhaustion over a named box with a conservation '
      + 'identity, re-checkable by the repository\'s batteries on every run — which is a claim about the '
      + 'certificate, not about history. Three secondary sources support the framing without the paper; the '
      + 'paper decides nothing computational either way. Where this program\'s own instruments found their '
      + 'bugs, controls found them: the wrong-endpoint bar refused BY NAME, the fabricated-decimal battery '
      + 'catch, the dilated-champion tie-break — none by reading code.')
    + C.pRaw('The same discipline governs the wording. No row on this page is called a first in the historical '
      + 'record, and none is called the only such row in existence — both would be claims about what has been '
      + 'printed, and this lab has not read what has been printed. What §2\'s last column reports is what this '
      + 'lab HAD ON FILE at that n before the '
      + 'sweep ran — ' + muNoPrior.length + ' of ' + muRows.length + ' mu rows had nothing on file — which is a '
      + 'fact about ' + C.m('instruments/trigmin/envelope.js') + ', a file anyone can open, not a fact about '
      + 'what has been printed. And §6 refuses the other tempting overstatement: the negatives are published by '
      + 'kind, never summed across units, and deflated within a kind before they are published at all.')
    + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-mercer.js @ git ' + gitrev
  + ' — ' + champsReproved + ' mu champions re-certified, the equality theorem re-proved (deflation + Sturm), the ladder re-checked rung by rung, '
  + 'the lambda record read from its battery-gated certificate, every conservation identity re-added row by row, and §6\'s counts read by kind from '
  + 'their own records with the nested boxes deflated. The build refuses on any deviation. Certificates: certs/mu-table.json, '
  + 'certs/mu-table-40.json, certs/lambda-table.json, certs/mercer-mu5.json, certs/census-high-periods.json, ledger.json; '
  + 'provenance registry: instruments/trigmin/envelope.js.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'mercer-program.html'),
  TPL.render({ title: 'The Mercer program · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/mercer-program.html',
    desc: 'Chowla’s cosine problem (Erdős #510) and Newman’s 0/1 minima certified as one landscape: exhaustive box sweeps, exact champions, the certified lambda table.' }));
console.log('reports/mercer-program.html written: ' + champsReproved + ' champions re-certified, equality re-proved, '
  + rungs.length + ' rungs checked, ' + fmt(setsExhausted) + ' distinct sets accounted @ git ' + gitrev);
console.log('  §6 by kind — mu box40 ' + fmt(mu40Sets) + ' sets · mu box30 ' + fmt(mu30Sets) + ' sets (' + fmt(muNestedSets)
  + ' nested, deflated) · lambda ' + fmt(lamDeepSets) + ' sets (' + fmt(lamRedecided) + ' re-decided, deflated) · Henon '
  + fmt(censusBoxes) + ' boxes · ' + fmt(T.closedFormTested) + ' closed forms tested, ' + fmt(cfRefuted) + ' refuted. NO TOTAL.');
console.log('  §3 deepening — ' + lamConfirmed.length + '/' + lamDeepenings.length + ' CONFIRMED the incumbent over '
  + fmt(confSets) + ' sets (' + fmt(confNew) + ' new), ' + lamImproved.length + ' improved over ' + fmt(impSets) + ' sets.');
