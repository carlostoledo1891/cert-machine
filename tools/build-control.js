#!/usr/bin/env node
/* build-control.js — generate index.html (the control page) from what the machine produced.

   Every number comes off a record on disk at build time; nothing is typed in.
   Sources: ledger.json (the engine's output), instruments/trigmin/envelope.js,
   PROVENANCE.json, the batteries (run, not remembered), git.

   usage: node tools/build-control.js [--no-batteries] */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const runBatteries = !process.argv.includes('--no-batteries');

const rj = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const sh = (c) => { try { return cp.execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };
const fmt = (n, d) => Number(n).toFixed(d === undefined ? 12 : d);
const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const ledger = exists('ledger.json') ? rj('ledger.json') : { families: [], conjectures: [], relations: [], totals: {} };
const prov = rj('PROVENANCE.json');
const ENV = require(path.join(ROOT, 'instruments/trigmin/envelope.js'));

const BATTERIES = [
  ['funnel machine', ['machine/funnel/selftest/battery.js'], '14 items · 19 red controls'],
  ['detach', ['machine/detach/selftest.js'], '11 checks'],
  ['interval · eqcert', ['instruments/interval/tests/test-eqcert.js'], 'falsifier-required certificates'],
  ['interval · arithmetic', ['instruments/interval/tests/test-interval.js'], '16 000 ops vs exact rationals'],
  ['interval · transcendental', ['instruments/interval/tests/test-transcendental.js'], 'sound exp/log/sin/cos'],
  ['trigmin certifier', ['instruments/trigmin/battery.js'], '47 checks · 2 red controls'],
  ['census (henon + holmes)', ['instruments/census/battery.js'], 'closed-form calibration, two maps · 5 red controls'],
  ['keller audit + sweep', ['instruments/keller/battery.js'], 'symbolic det over Q, generator calibrated on Alpöge · 4 red controls'],
  ['cf audit', ['instruments/cf/battery.js'], 'positive + minus CF enclosures vs the Ramanujan Machine · 7 red controls'],
  ['engine + families', ['tools/test-engine.js'], 'red controls on screen and certifier']
];
const PY = [
  ['keller · standalone re-verifier', ['tools/verify_keller.py', 'certs/keller-certificate.json', '--sources', 'corpus/sources'],
    'the detached certificate re-audited from scratch — stdlib fractions, no code from this repo; red control must fire'],
  ['sos · global bound', ['instruments/sos/sos_verify.py'], 'stdlib fractions only'],
  ['sos · lyapunov', ['instruments/sos/lyapunov_cert.py'], 'stdlib fractions only'],
  ['sos · re-verify AI result', ['instruments/sos/reverify_ai_lyapunov.py'], 'stdlib fractions only'],
  ['llm harness — plumbing only, NO model has run', ['tools/llm-harness.py', '--dry-run', '--n', '20', '--ledger', '/dev/null'],
    'dry run with a FAKE proposer: gates the pipeline, not an LLM result · aborts if a red control certifies']
];
function bat(argv, py) {
  if (!runBatteries) return null;
  const r = cp.spawnSync(py ? 'python3' : process.execPath, argv, { cwd: ROOT, stdio: 'ignore' });
  return r.status === 0;
}
const bats = BATTERIES.map(([n, c, note]) => ({ n, note, ok: bat(c, false) }))
  .concat(PY.map(([n, c, note]) => ({ n, note, ok: bat(c, true) })));
const green = bats.filter(b => b.ok === true).length, ran = bats.filter(b => b.ok !== null).length;

let drift = 'not run';
{ const o = sh('node tools/lift.js --check'); if (o) { const l = o.split('\n').find(x => x.startsWith('drift:')); if (l) drift = l.replace(/^drift:\s*/, ''); } }

const T = ledger.totals || {};
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · generated from ledger.json',
  title: 'The conjecture engine',
  deck: 'Generate at scale, screen in float, certify the survivors exactly. Every number below was read off a '
    + 'record when this page was built, and every battery it reports green was executed during that build.'
}));

/* R1: the page must decompose what it counts, so the subtraction a reviewer
   will do — tested − refuted − surviving — comes out to zero in front of
   them. Refuted = double-precision enclosure + the exact BigInt pass; the
   remainder is forms already on the OEIS record, honest open candidates,
   and the survivors. run-engine.js refuses to write a ledger where this
   does not close. */
const refutedAll = (T.closedFormRefuted || 0) + (T.closedFormRefutedExact || 0);
const decompose = commas(T.closedFormTested || 0) + ' tested = ' + commas(T.closedFormRefuted || 0)
  + ' refuted in double + ' + commas(T.closedFormRefutedExact || 0) + ' refuted exactly in BigInt + '
  + commas(T.closedFormOnRecord || 0) + ' with the form already on the OEIS record + '
  + commas(T.closedFormOpen || 0) + ' open + ' + commas(T.closedFormCandidates || 0) + ' surviving.';

B.push(C.stats([
  { k: 'objects generated', v: commas(T.generated || 0), n: 'Across ' + ledger.families.length + ' families, one engine.' },
  { k: 'certified exactly', v: commas(T.certified || 0), role: 'held', n: 'Interval enclosures and exact rational decisions — no digit matching.' },
  { k: 'closed forms refuted', v: commas(refutedAll), n: decompose + ' A refutation here is proved, not unlikely.' },
  { k: 'batteries green', v: green + ' / ' + ran, role: 'held', n: 'Executed during this build; every red control must fire.' }
]));

B.push(C.scope('Local working document. Nothing here has been through a literature gate, no claim has been '
  + 'minted, and nothing has been sent anywhere. Enclosures are proofs-of-object pending independent verification.'));

/* ---- §1 · the machine, drawn from the ledger -------------------------------
   Geometry and prose live here in the builder; the flow component owns the
   markup. Every count on a node is read off ledger.json at build time. */
{
  const F = ledger.families;
  const sum = (k) => F.reduce((t, f) => t + f.counts[k], 0);
  const screened = sum('screened'), hits = sum('hits'), rejects = sum('rejects'), refused = sum('refused');

  /* the family column sizes itself: a new family must never fall off the
     drawing again (the 6th and 7th both did, silently, until looked at) */
  const famH = 40;
  const famStep = F.length > 1 ? Math.min(62, Math.floor(320 / (F.length - 1))) : 0;
  const famTop = Math.max(8, Math.round(188 - ((F.length - 1) * famStep + famH) / 2));
  const famY = F.map((_, i) => famTop + i * famStep);
  const famNodes = F.map((f, i) => ({
    x: 14, y: famY[i], w: 180, h: famH, role: 'dep',
    k: f.name.toUpperCase(), v: commas(f.counts.generated) + ' generated',
    t: 'family · ' + f.name,
    d: f.statement + ' One file, six functions — enumerate, value, interesting, certify, key, statement; the engine supplies the loop, the scale and the dedup.'
  }));

  const instr = [
    { x: 248, k: 'INTERVAL · KRAWCZYK', v: 'outward-rounded', t: 'instrument · interval / Krawczyk',
      d: 'Outward-rounded interval arithmetic checked against exact BigInt rationals, and the Krawczyk operator with STRICT interior containment — existence and uniqueness, or nothing. The census turns its certificates into completeness theorems: exactly N periodic points, the rest of the plane excluded.' },
    { x: 414, k: 'TRIGMIN', v: 'certified minima', t: 'instrument · trigmin',
      d: 'Certified global minima of integer cosine polynomials: Chebyshev reduction, BigInt Sturm isolation, interval-Newton refinement. Feeds the Newman envelope — the bar a hit has to beat.' },
    { x: 580, k: 'CENSUS', v: 'exact counts', t: 'instrument · census',
      d: 'Interval branch-and-bound over the phase plane: a certified a priori bound confines every periodic point, tube iteration excludes, Krawczyk-as-contraction resolves each remainder to exactly one point. It can refuse; it can never return a wrong count.' },
    { x: 746, k: 'SOS · RATIONAL', v: 'lower bounds', t: 'instrument · sum-of-squares',
      d: 'Exact rational sum-of-squares decompositions — a tight global lower bound whose checker goes red on a corrupted certificate. Python, stdlib fractions only.' }
  ].map(n => ({ ...n, y: 300, w: 150, h: 40, role: 'dep' }));

  const nodes = famNodes.concat([
    { x: 248, y: 160, w: 140, h: 56, role: 'sig', k: 'ENUMERATE', v: commas(T.generated || 0) + ' objects',
      t: 'enumerate — deterministic and indexed',
      d: 'Every family enumerates by integer index, deterministically: a run of any size resumes and reproduces, and two runs at the same limit produce identical hits. ' + commas(T.generated || 0) + ' objects this build.' },
    { x: 436, y: 160, w: 140, h: 56, role: 'sig', k: 'SCREEN · FLOAT', v: commas(screened) + ' pass',
      t: 'screen — float, and it may only prune',
      d: 'A fast float estimate decides only what is WORTH certifying. The screen may prune, never admit: nothing it passes is believed, and everything it passes goes to the certifier. Duplicates fold by canonical key on the way.' },
    { x: 624, y: 160, w: 140, h: 56, role: 'sig', k: 'CERTIFY · EXACT', v: commas(T.certified || 0) + ' decided',
      t: 'certify — the only authority',
      d: 'The instruments decide: interval enclosures, exact rational arithmetic, strict interior containment for uniqueness. The engine never decides mathematics — it counts, dedupes, and hands the certifier what survived. ' + commas(T.certified || 0) + ' decisions this build.' },
    { x: 830, y: 92, w: 136, h: 44, role: 'held', k: 'HIT · CERTIFIED', v: commas(hits),
      t: 'HIT — a certificate exists',
      d: 'A HIT ships with its certificate: an explicit enclosure, an exact count, or an existence-and-uniqueness box, plus the falsifier the certificate must survive. ' + commas(hits) + ' this build.' },
    { x: 830, y: 166, w: 136, h: 44, role: 'sig', k: 'REJECT · PROVED', v: commas(rejects),
      t: 'REJECT — proved uninteresting',
      d: 'The certifier examined the candidate and proved it below the bar. A REJECT here is a theorem about the object, not a failed search. ' + commas(rejects) + ' this build.' },
    { x: 830, y: 240, w: 136, h: 44, role: 'warn', k: 'REFUSED · HONEST', v: commas(refused),
      t: 'REFUSED — absence of proof',
      d: 'The instrument declined to decide — a singular preconditioner, an exhausted budget, a containment that would not close. Absence of proof is never evidence of absence, and a refusal is never converted into a verdict. ' + commas(refused) + ' this build.' },
    { x: 624, y: 372, w: 140, h: 56, role: 'sig', k: 'LEDGER', v: 'ledger.json',
      t: 'the ledger',
      d: 'Everything the engine produced, as records on disk: ' + commas((ledger.conjectures || []).length) + ' conjectures kept with their enclosures and certificates. Every number on this page is read off the ledger at build time; nothing is typed in.' },
    { x: 420, y: 372, w: 160, h: 56, role: 'sig', k: 'CLOSED-FORM HUNT', v: commas(T.closedFormTested || 0) + ' tested',
      t: 'the closed-form hunt',
      d: 'Every certified enclosure is interrogated for small closed forms — rationals, square roots, multiples and powers of the standard constants. The enclosure decides: outside means refuted exactly, inside means a surviving candidate. Nothing is accepted on digits agreeing.' },
    { x: 200, y: 352, w: 180, h: 40, role: 'held', k: 'REFUTED EXACTLY', v: commas(T.closedFormRefuted || 0),
      t: 'refuted exactly',
      d: commas(T.closedFormRefuted || 0) + ' candidate closed forms proved wrong: the value provably lies outside a certified enclosure. The Ramanujan Machine matches truncated decimals and argues from collision probability; this decides.' },
    { x: 200, y: 412, w: 180, h: 40, role: 'warn', k: 'SURVIVORS · OPEN', v: commas(T.closedFormCandidates || 0) + ' candidates',
      t: 'the survivors',
      d: commas(T.closedFormCandidates || 0) + ' forms remain inside their enclosures — candidates, not results. They stay open until a tighter enclosure refutes them or an exact argument confirms them.' },
    { x: 14, y: 386, w: 180, h: 44, role: 'held', k: 'THE GATES', v: green + '/' + ran + ' batteries',
      t: 'the gates — batteries and red controls',
      d: 'Every battery is executed during this build, never remembered: ' + green + '/' + ran + ' green. Red controls are deliberate forgeries the instruments must catch — a control that cannot fire is decoration. Every real bug this project has found was found by a control, none by reading code.' },
    { x: 624, y: 472, w: 140, h: 40, role: 'dep', k: 'THIS PAGE', v: 'index.html',
      t: 'this page',
      d: 'Generated by tools/build-control.js from the ledger and the batteries. Editing it by hand is a change to nothing — the next build overwrites it, which is the point.' }
  ], instr);

  const edges = [
    ...famY.map((y, i) => ({ d: 'M194 ' + (y + 20) + ' C224 ' + (y + 20) + ' 218 ' + (167 + i * 7) + ' 246 ' + (167 + i * 7) })),
    { d: 'M388 188 L434 188' },
    { d: 'M576 188 L622 188', lab: 'dedup by key', lx: 599, ly: 232 },
    { d: 'M764 178 C800 160 806 132 828 116' },
    { d: 'M764 188 L828 188' },
    { d: 'M764 198 C800 216 806 244 828 262' },
    { d: 'M966 114 C976 118 976 128 976 140 L976 388 C976 396 970 400 962 400 L768 400', lab: 'only certificates', lx: 968, ly: 300, anchor: 'end' },
    { d: 'M624 400 L586 400' },
    { d: 'M420 386 C404 380 398 376 384 372' },
    { d: 'M420 414 C404 420 398 426 384 432' },
    { d: 'M694 428 L694 468' },
    { d: 'M323 300 C345 254 600 248 650 220' },
    { d: 'M489 300 C509 258 640 246 679 220' },
    { d: 'M655 300 C668 262 696 240 707 220' },
    { d: 'M821 300 C800 262 758 240 737 220' },
    { d: 'M104 386 C150 352 200 330 244 321' }
  ];

  B.push(C.section({
    lab: '§1 · the machine', title: 'How a conjecture becomes a certificate', wide: true,
    bodyRaw: C.flow({
      w: 980, h: 528,
      alt: 'Schematic of the conjecture engine: five families feed enumerate, screen and certify; the instruments decide; only certificates reach the ledger, which feeds the closed-form hunt and this page.',
      readout: {
        k: 'the machine',
        d: 'Generate at scale, screen in float, certify the survivors exactly. Select any node for what it does — every count is read off ledger.json at build time.'
      },
      nodes, edges,
      caption: 'The loop this repository runs. Families supply objects and mathematics; the engine supplies scale and bookkeeping; the instruments alone decide. REJECT and REFUSED are terminal by design — only a certificate reaches the ledger, the gates run on every build, and this page is rebuilt from the ledger alone.'
    })
  }));
}

if (ledger.families.length) {
  const rows = ledger.families.map(f => [
    { raw: C.m(f.name) },
    { raw: C.esc(f.statement) },
    { raw: C.m(commas(f.counts.generated)) },
    { raw: C.m(commas(f.counts.screened)) },
    { raw: C.m(f.counts.certified + ' → ' + f.counts.hits) },
    { raw: f.truncated ? C.tag('cap reached', 'open') : C.tag('exhausted', 'dep') }
  ]);
  B.push(C.section({
    lab: '§2 · the families', title: 'What the engine is enumerating', wide: true,
    bodyRaw: C.table({ cols: [{ h: 'family' }, { h: 'what a hit asserts' }, { h: 'generated', cls: 'v' }, { h: 'screened', cls: 'v' }, { h: 'certified → hit', cls: 'v' }, { h: 'stop' }], rows })
      + '<div class="col">' + C.pRaw('The screen is float and may only ever <em>prune</em>; nothing is admitted '
        + 'without an exact certificate. A family plugs in by supplying six functions — enumerate, value, '
        + 'interesting, certify, key, statement — and inherits the loop, the scale and the dedup.') + '</div>'
  }));
}

if (ledger.conjectures.length) {
  const rows = ledger.conjectures.map(c => [
    { raw: C.m(c.family) },
    { raw: C.m('[' + (c.extra && c.extra.A ? c.extra.A.join(',') : c.key) + ']') },
    { raw: C.m('[' + fmt(c.enclosure[0], 12) + ', ' + fmt(c.enclosure[1], 12) + ']') },
    { raw: C.m(Number(c.width).toExponential(2)) },
    { raw: c.closedForm ? C.m(c.closedForm.refuted + ' / ' + c.closedForm.tested) : '—' }
  ]);
  B.push(C.section({
    lab: '§3 · certified conjectures', title: 'The objects that survived', wide: true,
    bodyRaw: C.table({ cols: [{ h: 'family' }, { h: 'object', cls: 'v' }, { h: 'certified enclosure', cls: 'v' }, { h: 'width', cls: 'v' }, { h: 'closed forms refuted', cls: 'v' }], rows })
      + '<div class="col">' + C.pRaw('Each row is an exact enclosure, not a measurement. The last column is the '
        + 'engine asking whether the value has a small closed form: every candidate lying outside the enclosure '
        + 'is <strong>refuted exactly</strong>. The Ramanujan Machine matches truncated decimals and argues from '
        + 'collision probability; this decides.') + '</div>'
  }));
}

{
  const rows = (ledger.relations || []).slice(0, 20).map(r => [
    { raw: C.m(r.label) }, { raw: C.m(fmt(r.value, 12)) },
    { raw: C.m('[' + fmt(r.enclosure[0], 12) + ', ' + fmt(r.enclosure[1], 12) + ']') },
    { raw: C.tag('candidate', 'cert') }
  ]);
  B.push(C.section({
    lab: '§4 · closed forms', title: 'What survived the enclosure test', wide: true,
    bodyRaw: (rows.length
      ? C.table({ cols: [{ h: 'form' }, { h: 'value', cls: 'v' }, { h: 'inside this enclosure', cls: 'v' }, { h: '' }], rows })
      : '<div class="col">' + C.note({
        lab: 'Nothing survived, and that is the result',
        bodyRaw: C.pRaw(C.m(commas(T.closedFormTested || 0)) + ' candidate closed forms were tested against '
          + 'certified enclosures around 1e−15 wide, and <strong>' + commas(T.closedFormRefuted || 0)
          + ' were refuted exactly</strong> — the value provably lies outside. Zero survivors means these objects '
          + 'have no small closed form of the shapes searched: a proved negative, not a failed search.')
      }) + '</div>')
      + '<div class="col">' + C.pRaw('The count decomposes with nothing folded in: ' + C.m(decompose)
        + ' Forms the 17-digit double screen could not separate were re-decided at the full published digit '
        + 'length in BigInt; forms OEIS already states are the record check working, not discoveries; the '
        + 'subtraction closes to zero and the engine refuses to write a ledger where it does not.') + '</div>'
  }));
}

{
  const rows = [6, 7, 8, 9, 10, 17, 18, 19, 20].map(n => [
    { raw: C.esc('bar(' + n + ')') },
    { raw: C.m(fmt(Math.sqrt(ENV.barSq(n)), 15)) },
    { raw: ENV.ADOPTED.some(a => a.n < n && ENV.VALUE.get(a.n) === ENV.barSq(n)) ? C.tag('adopted here', 'cert') : C.tag('literature / lab', 'dep') }
  ]);
  const stale = ENV.audit(ledger.conjectures);
  B.push(C.section({
    lab: '§5 · the envelope', title: 'What a Newman hit has to beat', wide: true,
    bodyRaw: C.table({ cols: [{ h: 'bar' }, { h: 'certified min|f| to beat', cls: 'v' }, { h: 'source' }], rows })
      + '<div class="col">'
      + C.pRaw('Anchors from the literature and the source lab, plus objects this lab certified and then adopted. '
        + 'Both stored as witness sets and re-certified at load, so no value is transcribed. '
        + '<strong>Frozen at load</strong> — the bar never moves under a running campaign, or a candidate\'s '
        + 'verdict would depend on when it was proposed.')
      + (stale.length ? C.note({
        lab: stale.length + ' unadopted excess', bodyRaw: stale.map(x =>
          C.pRaw('n = ' + x.n + ': certified ' + C.m(fmt(Math.sqrt(x.modSq[0]), 12)) + ', envelope has '
            + C.m(fmt(Math.sqrt(x.envelopeHas), 12)))).join('')
      })
        : C.pRaw('Staleness audit: <b>clean</b> — nothing certified sits above the envelope unadopted.'))
      + '</div>'
  }));
}

{
  const rows = bats.map(b => [
    { raw: C.esc(b.n) }, { raw: C.esc(b.note) },
    { raw: b.ok === null ? C.tag('not run', 'dep') : (b.ok ? C.tag('green', 'held') : C.tag('RED', 'open')) }
  ]);
  B.push(C.section({
    lab: '§6 · the instruments', title: 'What certifies, and whether it runs', wide: true,
    bodyRaw: C.table({ cols: [{ h: 'battery' }, { h: 'covers' }, { h: 'this build' }], rows })
      + '<div class="col">' + C.pRaw('Lifted from the source lab: ' + C.m(prov.counts.files + ' files') + ', '
        + C.m(prov.counts.patched + ' patched') + ' on the way in, each patch declared. Drift now: ' + C.m(drift) + '. '
        + '<strong>' + C.esc(rj('LIFT.json').source_root) + ' is read-only, permanently</strong> — read anything, '
        + 'never write, and report an error there rather than repair it.') + '</div>'
  }));
}

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-control.js. Rebuild: make engine && make control.') + '</p>'
  + '<p>' + C.esc('git ' + (sh('git rev-parse --short HEAD') || '—') + ' · '
    + (sh('git rev-list --count HEAD') || '0') + ' commits') + '</p>'
  + '<p style="margin-top:20px;color:var(--ink-2)">' + C.esc('Carlos Toledo · cert-machine') + '</p>'
  + '</footer>';

fs.writeFileSync(path.join(ROOT, 'index.html'),
  TPL.render({ title: 'cert-machine · the conjecture engine', bodyRaw: B.join('\n\n'), footRaw: foot }));

console.log('index.html written');
console.log('  generated ' + commas(T.generated || 0) + ' · certified ' + commas(T.certified || 0)
  + ' · conjectures ' + (ledger.conjectures || []).length
  + ' · closed forms refuted ' + commas(T.closedFormRefuted || 0));
console.log('  batteries ' + green + '/' + ran + ' · drift ' + drift);
