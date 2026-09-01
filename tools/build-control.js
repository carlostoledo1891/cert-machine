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
  ['newman box sweep', ['instruments/trigmin/sweep-battery.js'], 'Goddard\'s 1992 box re-closed every run, cross-lab counts pinned; 100% kill audit · 7 red controls'],
  ['lambda sweep', ['instruments/trigmin/lambda-battery.js'], 'Mercer\'s proved closed forms computed, never remembered; the wrong-endpoint bar refused by name and shown fatal · 4 red controls'],
  ['mercer mu5 ladder', ['instruments/trigmin/mercer6-battery.js'], 'mu(5) <= 1 + pi/m certified m = 5..20; Mercer\'s Tables 5-7 reproduced, the source-lab m=6 record matched, every case point re-proved · 5 red controls'],
  ['census (henon + holmes)', ['instruments/census/battery.js'], 'closed-form calibration, two maps · 5 red controls'],
  ['keller audit + sweep', ['instruments/keller/battery.js'], 'symbolic det over Q, generator calibrated on Alpöge · 4 red controls'],
  ['cf audit', ['instruments/cf/battery.js'], 'all seven Ramanujan Machine sheets — 51 printed rows + the certified correction (e, pi, zeta(3), Catalan, pi^2, ln 2, mixed zeta orders) · 10 red controls'],
  ['entropy covering', ['instruments/entropy/battery.js'], 'certified h_top lower bounds; ln 2 calibration at the full horseshoe · 4 red controls'],
  ['strassen audit', ['instruments/strassen/battery.js'], 'fast-matmul tensor identities over Q and F2; Strassen 1969 calibrates · 3 red controls'],
  ['bigfloat layer', ['instruments/bigfloat/battery.js'], 'directed-rounding big-float intervals; pi/ln2/e to 50 literature digits · 5 red controls'],
  ['erdos852 constants', ['instruments/erdos852/battery.js'], 'certified c0 and C* enclosures; pi^2/8 product calibration · 5 red controls'],
  ['evtol energy', ['instruments/evtol/battery.js'], 'mission-energy feasibility verdicts cross-proved by 256-corner exact sweeps; dyadic closed-form calibration · 4 red controls'],
  ['forecast instrument', ['instruments/forecast/battery.js'], 'conformal coverage proved by exact rank-lemma enumeration; Winkler scores hand-computed in rationals; the ledger refuses backdating, tampering, premature and double scoring; the admission prune rule decided by exact binomial tail · 5 red controls'],
  ['fueleu penalty arithmetic', ['instruments/fueleu/battery.js'], 'Regulation (EU) 2023/1805 intensity limits, Annex IV penalty and blend-flip thresholds in exact rationals — constants transcribed from pinned OJ bytes; the 1e-9 boundary forgery flips the verdict · 4 red controls'],
  ['glide band', ['apps/glide-band/battery.js'], 'certified engine-out reach from interval inputs; geodesy calibrated on the meridian degree and JFK-LAX, 4000-draw containment, and the point-estimate method itself run as a red \u00b7 4 red controls'],
  ['design system + charts', ['design/battery.js'], 'palette validated against the dataviz checks in BOTH modes and under three CVD simulations; the token block, the figure kit and the escaped-tag scanner · 6 red controls'],
  ['wiring', ['tools/check-wiring.js'], 'the registries nobody was checking: every report builder reachable from `make reports`, the two battery lists in agreement, and no built page declaring a font outside the token block · 4 red controls'],
  ['skyaudit app', ['apps/skyaudit/battery.js'], 'segmentation and mission calibration for the pinned ADS-B day'],
  ['bilinear certifier', ['instruments/bilinear/battery.js'], 'bilinear identities over Q and F2'],
  ['slp additive circuits', ['instruments/slp/battery.js'], 'straight-line programs, additive cost'],
  ['mfg lab (box certifier)', ['labs/mfg/battery.js'], 'the box certifier for the MFG lab'],
  ['mfg2p lab (two populations)', ['labs/mfg2p/battery.js'], 'two-population equilibria'],
  ['erdos290 lean battery', ['tools/erdos290-lean-battery.js'], 'closed forms equal enumeration exactly for l <= 12; the broken-EGF red must fire'],
  ['engine + families', ['tools/test-engine.js'], 'red controls on screen and certifier']
];
const PY = [
  ['oracle claim library', ['oracle/battery.py'],
    'certify() for AI math search: Strassen calibrates, the characteristic-2 pair reproduced, the sub-float forgery refuted with its exact mechanism; red controls also run at import — a broken grader refuses to exist · 6 red controls'],
  ['keller · standalone re-verifier', ['tools/verify_keller.py', 'certs/keller-certificate.json', '--sources', 'corpus/sources'],
    'the detached certificate re-audited from scratch — stdlib fractions, no code from this repo; red control must fire'],
  ['strassen · standalone re-verifier', ['tools/verify_strassen.py', 'certs/strassen-certificate.json', '--sources', 'corpus/sources'],
    'every matmul identity re-derived in stdlib Python ints; pins re-hashed; red control must fire'],
  ['erdos852 · standalone re-verifier', ['tools/verify_erdos852.py', 'certs/erdos852-certificate.json', '--sources', 'corpus/sources'],
    'the C* refutation re-proved in exact stdlib ints (no tail, no rounding); the c0 window re-decided at 130 digits; 4 red controls must fire'],
  ['sos · global bound', ['instruments/sos/sos_verify.py'], 'stdlib fractions only'],
  ['sos · lyapunov', ['instruments/sos/lyapunov_cert.py'], 'stdlib fractions only'],
  ['sos · re-verify AI result', ['instruments/sos/reverify_ai_lyapunov.py'], 'stdlib fractions only'],
  ['llm harness — the eval\'s dry-run gate', ['tools/llm-harness.py', '--dry-run', '--n', '20', '--ledger', '/dev/null'],
    'a FAKE proposer gates the pipeline, not an LLM result; live model campaigns are separate, in the append-only certs/matmul-eval-ledger.jsonl and on reports/matmul-eval.html · aborts if a red control certifies']
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
  title: 'The machine, live',
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

B.push(C.scope('Published, not peer-reviewed, not independently rerun. Every claim below is rerunnable from the '
  + 'public repository; external reruns will be recorded here as they arrive — none has yet. Enclosures are '
  + 'proofs-of-object pending that independent verification.'));

/* ---- §1 · the machine, drawn from the ledger -------------------------------
   The drawing itself lives in tools/machine-figure.js, shared with the
   landing so the two can never drift apart. Every count is read off
   ledger.json at build time. */
{
  const { machineFlow } = require(path.join(__dirname, 'machine-figure.js'));
  B.push(C.section({
    lab: '§1 · the machine', title: 'How a conjecture becomes a certificate', wide: true,
    bodyRaw: machineFlow(ledger, { gates: { green, ran } })
  }));
  /* the record the landing reads, so the drawing is IDENTICAL on both pages:
     the battery count on the landing is this build's measurement, not a memory.
     A --no-batteries build measured nothing and writes nothing. */
  if (runBatteries) fs.writeFileSync(path.join(ROOT, 'batteries.json'),
    JSON.stringify({ green, ran, git: sh('git rev-parse --short HEAD') || 'unknown' }) + '\n');
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
      + C.pRaw('The bars at n = 10 and n = 17 MOVED in August 2026 — bar(10) to ' + C.m(fmt(Math.sqrt(ENV.barSq(10)), 4))
        + ' past Boyd\'s 1986 witness, bar(17) to ' + C.m(fmt(Math.sqrt(ENV.barSq(17)), 4)) + ' via the certified '
        + 'n = 13 box champion — because the exhaustive box30 sweeps behind ' + C.m('certs/mu-table.json')
        + ' certified minima exceeding what the literature and the source lab held. A returning reader\'s remembered '
        + 'bar is stale because the mathematics improved, not because anything drifted; the rows tagged '
        + '"adopted here" are exactly those promotions.')
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
        + '<strong>The source lab (' + C.esc(require('path').basename(rj('LIFT.json').source_root)) + ') is read-only, permanently</strong> — read anything, '
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
  TPL.render({ title: 'cert-machine · the machine, live', bodyRaw: B.join('\n\n'), footRaw: foot }));

console.log('index.html written');
console.log('  generated ' + commas(T.generated || 0) + ' · certified ' + commas(T.certified || 0)
  + ' · conjectures ' + (ledger.conjectures || []).length
  + ' · closed forms refuted ' + commas(T.closedFormRefuted || 0));
console.log('  batteries ' + green + '/' + ran + ' · drift ' + drift);
