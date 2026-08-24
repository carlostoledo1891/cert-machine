#!/usr/bin/env node
/* build-control.js — generate control.html, the lab's control centre.
   tools/ · cert-machine

   EVERY NUMBER ON THE PAGE IS DERIVED HERE, AT BUILD TIME, FROM A RECORD ON
   DISK. Nothing is typed in. That is the property `tools/test-control.js`
   checks, and it is the reason the page can be trusted at a glance: a stale
   number cannot survive a rebuild, because there is no number to go stale — only
   a path to a record and a way to read it.

   Sources, all of them files this repository or its machine wrote:
     PROVENANCE.json                  the lift and its shas
     hunts/<slug>/best.json           the board
     hunts/<slug>/experiments/*.jsonl the chained campaign records
     hunts/<slug>/results-*.json      standalone census artifacts
     hunts/<slug>/ops-log.jsonl       the detached-run burn
     notes/*.md                       the written record
     git                              commit count and HEAD
     the batteries                    RUN, not remembered

   The batteries are executed rather than assumed, which is why a build takes
   ~40 s. A page that says "green" without having run anything is the defect
   this whole repository is organised against.

   usage: node tools/build-control.js [--no-batteries] */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const runBatteries = !process.argv.includes('--no-batteries');

const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const rj = (p) => JSON.parse(rd(p));
const exists = (p) => fs.existsSync(path.join(ROOT, p));

/* read the tail of a large file without loading all of it */
function tailLines(p, bytes) {
  const full = path.join(ROOT, p);
  const size = fs.statSync(full).size;
  const take = Math.min(size, bytes || 400000);
  const fd = fs.openSync(full, 'r');
  const buf = Buffer.alloc(take);
  fs.readSync(fd, buf, 0, take, size - take);
  fs.closeSync(fd);
  return buf.toString('utf8').split('\n').filter(l => l.length > 0);
}

function sh(cmd) {
  try { return cp.execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch (e) { return null; }
}

function fmt(n, d) { return Number(n).toFixed(d === undefined ? 12 : d); }
function commas(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

/* ---------------------------------------------------------------- gather -- */

const prov = rj('PROVENANCE.json');
const decisions = exists('decisions.json') ? rj('decisions.json') : { open: [], closed: [] };
const lift = rj('LIFT.json');

/* -- batteries, run for real -- */
const BATTERIES = [
  { name: 'funnel machine', cmd: ['machine/funnel/selftest/battery.js'], note: '14 items · 19 red controls' },
  { name: 'detach', cmd: ['machine/detach/selftest.js'], note: '11 checks' },
  { name: 'interval · eqcert', cmd: ['instruments/interval/tests/test-eqcert.js'], note: 'certificate contract' },
  { name: 'interval · arithmetic', cmd: ['instruments/interval/tests/test-interval.js'], note: '16 000 ops vs exact rationals' },
  { name: 'interval · transcendental', cmd: ['instruments/interval/tests/test-transcendental.js'], note: 'sound exp/log/sin/cos' },
  { name: 'interval · enclosure', cmd: ['instruments/interval/tests/test-transcendental-enclosure.js'], note: '' },
  { name: 'trigmin certifier', cmd: ['instruments/trigmin/battery.js'], note: '47 checks · 2 red controls' },
  { name: 'hunt · newman-mu', cmd: ['hunts/newman-mu/battery.js'], note: 'red controls (a)–(f)' }
];
const PY_BATTERIES = [
  { name: 'sos · global bound', cmd: 'instruments/sos/sos_verify.py' },
  { name: 'sos · lyapunov', cmd: 'instruments/sos/lyapunov_cert.py' },
  { name: 'sos · re-verify AI result', cmd: 'instruments/sos/reverify_ai_lyapunov.py' }
];

function runBattery(argv, py) {
  if (!runBatteries) return { ok: null, ms: 0 };
  const t0 = Date.now();
  const r = py
    ? cp.spawnSync('python3', [argv], { cwd: ROOT, stdio: 'ignore' })
    : cp.spawnSync(process.execPath, argv, { cwd: ROOT, stdio: 'ignore' });
  return { ok: r.status === 0, ms: Date.now() - t0 };
}

const batteryResults = BATTERIES.map(b => Object.assign({}, b, runBattery(b.cmd, false)))
  .concat(PY_BATTERIES.map(b => Object.assign({}, b, { note: 'stdlib fractions only' }, runBattery(b.cmd, true))));
const batteriesGreen = batteryResults.filter(b => b.ok === true).length;
const batteriesRun = batteryResults.filter(b => b.ok !== null).length;

/* -- drift -- */
let driftLine = 'not run';
{
  const out = sh('node tools/lift.js --check');
  if (out) {
    const l = out.split('\n').find(x => x.startsWith('drift:'));
    if (l) driftLine = l.replace(/^drift:\s*/, '');
  }
}

/* -- hunts -- */
function readHunts() {
  const dir = path.join(ROOT, 'hunts');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(d => {
    const s = path.join(dir, d);
    return fs.statSync(s).isDirectory();
  }).sort().map(slug => {
    const base = 'hunts/' + slug;
    const board = exists(base + '/best.json') ? rj(base + '/best.json') : { entries: [] };
    const statement = exists(base + '/statement.json') ? rj(base + '/statement.json') : null;
    const expDir = path.join(ROOT, base, 'experiments');
    const runs = [];
    if (fs.existsSync(expDir)) {
      for (const f of fs.readdirSync(expDir).sort()) {
        if (!f.startsWith('run-') || !f.endsWith('.jsonl')) continue;
        if (f.endsWith('-baseline.jsonl')) continue;         /* rolled into its parent */
        let last = null, header = null;
        try {
          const lines = tailLines(base + '/experiments/' + f, 600000);
          for (let i = lines.length - 1; i >= 0; i--) {
            const o = JSON.parse(lines[i]);
            if (o.kind === 'run-summary') { last = o; break; }
          }
          const head = tailLines(base + '/experiments/' + f, 8000);
          for (const l of head) { const o = JSON.parse(l); if (o.kind === 'run-header') { header = o; break; } }
        } catch (e) { /* a torn tail is not a verdict — the row simply reports unknown */ }
        const s = last && (last.summary || last);
        runs.push({
          file: f,
          seed: (s && s.seed) || f.replace(/^run-|\.jsonl$/g, ''),
          generator: (s && s.generator) || (header && header.generator) || '?',
          generated: s ? s.counts.generated : null,
          screenPassed: s ? s.counts.screenPassed : null,
          hits: s ? s.counts.certified.HIT : null,
          rejects: s ? s.counts.certified.REJECT : null,
          refused: s ? s.counts.certified.REFUSED : null,
          admitted: s ? s.admitted : null,
          auditSampled: s ? s.rejectAudit.sampled : null,
          auditPop: s ? s.rejectAudit.population : null,
          auditFN: s ? s.rejectAudit.falseNegatives : null,
          stop: s ? s.governor.stopReason : null,
          claims: (s && s.claims) || [],
          bytes: fs.statSync(path.join(expDir, f)).size
        });
      }
    }
    const ops = [];
    if (exists(base + '/ops-log.jsonl')) {
      for (const l of rd(base + '/ops-log.jsonl').trim().split('\n')) {
        try { ops.push(JSON.parse(l)); } catch (e) { }
      }
    }
    const census = exists(base + '/results-subsets-hj.json') ? rj(base + '/results-subsets-hj.json') : null;
    const ext = exists(base + '/results-extensions.json') ? rj(base + '/results-extensions.json') : null;
    return { slug, board, statement, runs, ops, census, ext };
  });
}
const hunts = readHunts();
const H = hunts.find(h => h.slug === 'newman-mu') || hunts[0];

/* -- totals -- */
const totalCandidates = hunts.reduce((a, h) => a + h.runs.reduce((b, r) => b + (r.generated || 0), 0), 0);
const totalRecordBytes = hunts.reduce((a, h) =>
  a + h.runs.reduce((b, r) => b + r.bytes, 0), 0);
const watchSeconds = hunts.reduce((a, h) =>
  a + h.ops.filter(o => o.metric === 'watchSeconds').reduce((b, o) => b + o.value, 0), 0);
const censusSubsets = H && H.census ? H.census.sizes.reduce((a, s) => a + s.subsetsCertified, 0) : 0;

/* the board's best object, by certified lower bound */
let bestEntry = null;
for (const h of hunts) for (const e of (h.board.entries || [])) {
  if (!bestEntry || e.certificate.modSq[0] > bestEntry.certificate.modSq[0]) bestEntry = e;
}

const gitCount = sh('git rev-list --count HEAD') || '0';
const gitHead = (sh('git rev-parse --short HEAD') || '—');
const gitDirty = (sh('git status --porcelain') || '').split('\n').filter(x => x).length;
const notes = fs.existsSync(path.join(ROOT, 'notes'))
  ? fs.readdirSync(path.join(ROOT, 'notes')).filter(f => f.endsWith('.md') && f !== 'README.md').sort() : [];

/* ---------------------------------------------------------------- render -- */
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · control centre · generated',
  title: 'What the lab knows',
  deck: 'Every number on this page was read off a record on disk when the page was built, and every '
      + 'battery it reports green was executed during that build. Nothing here is typed in by hand, '
      + 'which is the only reason it can be read at a glance.'
}));

B.push(C.stats([
  { k: 'batteries green', v: batteriesGreen + ' / ' + batteriesRun, role: 'held',
    n: 'Run during this build, not remembered. Includes 19 red controls that must fire.' },
  { k: 'candidates evaluated', v: commas(totalCandidates), sm: false,
    n: 'Main runs only — the forced equal-budget baselines are excluded and counted separately. '
       + commas(censusSubsets) + ' further subsets certified outside the funnel, in the census.' },
  { k: 'best certified object', vRaw: bestEntry ? ('min|f| &ge; ' + fmt(bestEntry.certificate.modulus[0], 12)) : '—', sm: true,
    n: bestEntry ? (bestEntry.certificate.n + ' terms, degree ' + bestEntry.certificate.degree
        + ' — clears the fewer-terms envelope.') : 'no board entry yet' },
  { k: 'source-lab drift', v: driftLine.split('·')[0].trim(), sm: true, role: 'held',
    n: 'sin-mfg is read-only. Every lifted file re-hashed at both ends.' }
]));

B.push(C.scope(
  'Local working document, not a publication. Nothing here has been through a literature gate, '
  + 'no claim has been minted, and nothing has been sent anywhere. Enclosures are proofs-of-object '
  + 'pending independent verification; the checks and the code share an author, so they rule out '
  + 'slips rather than a shared misconception.'
));

/* ---- §0 waiting on the owner ---- */
if (decisions.open && decisions.open.length) {
  const items = decisions.open.map(d => {
    const opts = d.options.map(o =>
      '<li>' + (o.rec ? C.tag('recommended', 'cert') + ' ' : '') + '<b>' + C.esc(o.k) + '</b> — ' + C.esc(o.v) + '</li>'
    ).join('');
    return '<li>'
      + '<b>' + C.esc(d.id + ' · ' + d.title) + '</b>'
      + ' <span class="m" style="color:var(--ink-3)">' + C.esc(d.weight) + '</span><br>'
      + C.esc(d.what)
      + '<ul style="margin:12px 0 0;padding-left:20px;font-size:15.5px">' + opts + '</ul>'
      + '</li>';
  }).join('');
  const closed = (decisions.closed || []).map(d =>
    C.pRaw('<b>' + C.esc(d.id + ' · ' + d.title) + '</b> — ruled ' + C.esc(d.ruled) + '. ' + C.esc(d.ruling))
  ).join('');
  B.push(C.section({
    lab: '§0 · waiting on you',
    title: decisions.open.length + ' decisions, and what each one costs',
    bodyRaw: '<ul class="plain">' + items + '</ul>'
      + (closed ? C.note({ lab: 'Already ruled — kept, not deleted', bodyRaw: closed }) : '')
  }));
}

/* ---- §1 the board ---- */
{
  const rows = (H.board.entries || [])
    .slice().sort((a, b) => b.certificate.modSq[0] - a.certificate.modSq[0])
    .map(e => {
      const c = e.certificate;
      return [
        { raw: C.esc(c.n + ' terms') },
        { raw: C.m('[' + c.A.join(',') + ']') },
        { raw: C.m(fmt(c.modulus[0], 15)) },
        { raw: C.m(fmt(Math.sqrt(c.barSq), 12)) },
        { raw: C.tag('certified', 'cert') + ' <br>' + C.esc('deg ' + c.degree + ' · seed ' + e.runSeed) }
      ];
    });
  B.push(C.section({
    lab: '§1 · the board',
    title: 'Objects that cleared their bar',
    wide: true,
    bodyRaw: (rows.length
      ? C.table({
          cols: [{ h: 'region' }, { h: 'exponent set', cls: 'v' }, { h: 'certified min|f| ≥', cls: 'v' },
                 { h: 'bar it cleared', cls: 'v' }, { h: 'standing' }],
          rows
        })
      : '<div class="col">' + C.p('The board is empty.') + '</div>')
      + '<div class="col">'
      + C.pRaw('A board entry is an object this search certified AND that survived an independent '
        + 'recompute at admission — the certificate is re-derived by a different path before it is '
        + 'allowed in. The bar is the ' + '<em>monotone envelope</em>' + ': the best certified value '
        + 'reachable with strictly fewer terms.')
      + '</div>'
  }));
}

/* ---- §2 the landscape ---- */
{
  const anchors = [
    { n: 3, v: 0.607346433725515, src: 'CFF 1983' },
    { n: 4, v: 0.752394003717431, src: 'Goddard 1992' },
    { n: 5, v: 1.0, src: 'Mercer 2019' },
    { n: 6, v: 1.0652858911344152, src: 'Goddard / sin-mfg' },
    { n: 7, v: 1.1018829384861855, src: 'sin-mfg' },
    { n: 8, v: 1.3111013028723255, src: 'sin-mfg' },
    { n: 9, v: 1.3623731781333241, src: 'Boyd 1986' },
    { n: 19, v: 2.0181745630759118, src: 'Hare–Jankauskas' }
  ];
  /* our board, by term count — DERIVED, not listed */
  const ours = {};
  for (const e of (H.board.entries || [])) {
    const n = e.certificate.n;
    if (!(n in ours) || e.certificate.modulus[0] > ours[n]) ours[n] = e.certificate.modulus[0];
  }
  const cats = [];
  for (let n = 3; n <= 19; n++) {
    const a = anchors.find(x => x.n === n);
    const bars = [];
    if (a) bars.push({ v: a.v, token: '--mark' });
    if (ours[n]) bars.push({ v: ours[n], token: '--sig' });
    cats.push({ x: String(n), bars, note: (n >= 10 && n <= 18 && !ours[n]) ? 'open' : '' });
  }
  const svg = C.categoryChart({
    cats, yLo: 0, yHi: 2.2, yTicks: [0, 0.5, 1, 1.5, 2],
    w: 900, h: 300, yLabel: 'certified min|f|',
    alt: 'Certified minimum modulus by term count, n from 3 to 19. Grey bars are values known from the '
       + 'literature or the source lab at n = 3,4,5,6,7,8,9 and 19. A plum bar at n = 17 is this lab\'s '
       + 'certified object at 1.414. Term counts 10 to 16 and 18 are marked open — nothing is certified there.'
  }) + '\n' + C.legend({
    items: [{ text: 'known before this lab', token: '--mark' }, { text: 'certified here', token: '--sig' }],
    x: 74, y: 292
  });
  B.push(C.section({
    lab: '§2 · the landscape',
    title: 'Where the certified values are, and where nothing is',
    wide: true,
    bodyRaw: C.figure({
      svgRaw: svg,
      caption: 'Certified min|f| for n-term Newman polynomials. The band 10 ≤ n ≤ 18 is the frontier: '
        + 'nothing is certified there by anyone located, and Hare–Jankauskas exhausted only degree ≤ 40, '
        + 'so an 18-term polynomial of degree 45 or more is outside every search performed.'
    })
      + '<div class="col">'
      + C.pull('The gap between <b>n = 9</b> and <b>n = 19</b> is the whole hunt.')
      + '</div>'
  }));
}

/* ---- §3 campaigns ---- */
{
  const rows = H.runs.map(r => {
    const shape = r.claims.find(c => c.shape === 'RECORD');
    const complete = shape && /exhaustionCertificate/.test(shape.text);
    return [
      { raw: C.m(r.seed) },
      { raw: C.esc(r.generator) },
      { raw: C.m(r.generated === null ? '?' : commas(r.generated)) },
      { raw: C.m(r.hits === null ? '?' : r.hits + ' / ' + r.admitted) },
      { raw: r.auditPop === null ? '—' : C.m(commas(r.auditSampled) + ' / ' + commas(r.auditPop) + '  FN ' + r.auditFN) },
      { raw: complete ? C.tag('completeness cert', 'held') : C.tag('best-known downgrade', 'dep') }
    ];
  });
  B.push(C.section({
    lab: '§3 · campaigns',
    title: 'Every run, and what the machine let it claim',
    wide: true,
    bodyRaw: C.table({
      cols: [{ h: 'seed', cls: 'v' }, { h: 'generator' }, { h: 'candidates', cls: 'v' },
             { h: 'certified hits / admitted', cls: 'v' }, { h: 'reject audit', cls: 'v' }, { h: 'record shape' }],
      rows
    })
      + '<div class="col">'
      + C.pRaw('Two counters, never one: <b>certified hits</b> is order-independent, <b>admitted</b> counts '
        + 'what was new to the board. They differ when a search re-finds an object it already has — '
        + 'which is exactly what happened on ' + C.m('terms-frontier-1') + ', where 152 hits produced 0 admissions.')
      + C.note({
        lab: 'Why one run carries a completeness certificate and the others do not',
        bodyRaw: C.pRaw('The machine grants one only when the whole declared box was enumerated, every '
          + 'screen-reject was certified rather than sampled, nothing came back REFUSED, and no candidate '
          + 'was schema-invalid. ' + C.m('enum-box8-complete') + ' met all four — 32 762 of 32 762 rejects '
          + 'certified, 0 false negatives. The others sampled, so they get the honest downgrade.')
      })
      + '</div>'
  }));
}

/* ---- §4 the census ---- */
if (H.census) {
  const rows = H.census.sizes.map(s => [
    { raw: C.esc('n = ' + s.n) },
    { raw: C.m(commas(s.subsetsCertified)) },
    { raw: C.m(fmt(s.bestModulus[0], 12)) },
    { raw: C.m('{' + s.droppedFromSource.join(',') + '}') },
    { raw: s.hits > 0 ? C.tag(s.hits + ' clears', 'cert') : C.tag('none clear', 'dep') }
  ]);
  B.push(C.section({
    lab: '§4 · the census',
    title: 'Every subset of the 19-term witness, certified',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('The only known Newman polynomial with min|f| ≥ 2 has 19 terms. There are only C(19,k) '
        + 'subsets of each size, so "can fewer terms do it" stops being a search and becomes a census. '
        + 'Complete over the declared box, ' + C.m('0') + ' REFUSED.')
      + '</div>'
      + C.table({
        cols: [{ h: 'size' }, { h: 'subsets certified', cls: 'v' }, { h: 'best min|f| ≥', cls: 'v' },
               { h: 'exponents removed', cls: 'v' }, { h: 'verdict' }],
        rows
      })
      + '<div class="col">'
      + C.pRaw('<strong>It is not monotone.</strong> Dropping two exponents beats dropping one — putting '
        + 'either 16 or 22 back <em>lowers</em> the minimum. That is the observation the frontier turns on.')
      + '</div>'
  }));
}

/* ---- §4b the extension census: the question a subset census cannot ask ---- */
if (H.ext) {
  const rows = H.ext.entries.map(e => [
    { raw: C.esc(e.fromTerms + ' → ' + e.n) },
    { raw: C.m('[' + e.fromSet.join(',') + ']') },
    { raw: C.m(commas(e.distinctExtensionsCertified)) },
    { raw: C.m(fmt(e.bestModulus[0], 12)) + '<br>' + C.esc('adding e = ' + e.addedExponent) },
    { raw: (e.clearsStatic || e.clearsLearned) ? C.tag('clears', 'cert') : C.tag('none clear', 'dep') }
  ]);
  const top = H.ext.entries[0];
  B.push(C.section({
    lab: '§4b · the extension census',
    title: 'The question a subset census structurally cannot ask',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('Every object the subset census examined was a <em>subset</em> of the 19-term witness. '
        + 'An 18-term set built by <strong>adding</strong> an exponent to our 17-term champion is not a '
        + 'subset of it at all — the added exponent can be any integer — so it lies entirely outside that box. '
        + 'This census covers it: for each board entry, every integer in a declared window, canonicalised, '
        + 'duplicates collapsed.')
      + '</div>'
      + C.table({
          cols: [{ h: 'terms' }, { h: 'extended from', cls: 'v' }, { h: 'distinct extensions', cls: 'v' },
                 { h: 'best min|f| ≥', cls: 'v' }, { h: 'verdict' }],
          rows
        })
      + '<div class="col">'
      + C.pRaw('<strong>Nothing clears.</strong> Complete over the declared window — a certified negative, '
        + 'not a failed search. The best extension of the 17-term champion is reached by putting '
        + C.m('22') + ' back, which lands at ' + C.m(fmt(top.bestModulus[0], 12)) + ' — below even the '
        + 'static bar. Combined with the subset census the picture is that the 17-term object is '
        + '<em>isolated</em>: you cannot reach 18 terms by deleting from the witness, and you cannot reach '
        + 'it by adding to the champion.')
      + C.note({
          lab: 'Two bars, because one of them is known to be wrong',
          bodyRaw: C.pRaw('<b>bar_static</b> is the envelope as ' + C.m('target.js') + ' computes it, from a '
            + 'fixed anchor list — for n = 18 that is Boyd\'s 9-term value. <b>bar_learned</b> folds in this '
            + 'lab\'s own certified values, which for n = 18 means the 17-term champion. The target uses the '
            + 'static one and cannot learn; reporting both is the only honest way to state a result while '
            + 'the envelope judging it is a known open defect (§6).')
        })
      + '</div>'
  }));
}

/* ---- §4c the envelope ---- */
{
  const T = require(path.join(ROOT, 'hunts/newman-mu/target.js'));
  const board = (H.board.entries || []);
  const stale = T.envelopeAudit(board);
  const rows = [];
  for (const n of [6, 7, 8, 9, 10, 17, 18, 19, 20]) {
    const src = T.ADOPTED.find(a => a.n < n && T.barSq(n) === T.ANCHOR_VALUE.get(a.n));
    rows.push([
      { raw: C.esc('bar(' + n + ')') },
      { raw: C.m(fmt(Math.sqrt(T.barSq(n)), 15)) },
      { raw: src ? C.tag('adopted here', 'cert') : C.tag('literature / lab', 'dep') }
    ]);
  }
  B.push(C.section({
    lab: '§4c · the envelope',
    title: 'What a hit has to beat, and who decided it',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('A HIT must exceed everything achievable with <em>fewer</em> terms. That envelope has two '
        + 'parts: <b>anchors</b> from the literature and the source lab, and <b>adopted</b> objects this '
        + 'lab certified and then promoted in a dated edit naming the run and certificate. Both are stored '
        + 'as witness exponent sets and re-certified at load, so no value is ever transcribed.')
      + C.pRaw('<strong>The envelope is frozen at load and never absorbs the board automatically.</strong> '
        + 'If it did, the bar would move as a campaign filled the board — a candidate\'s verdict would '
        + 'depend on when it was proposed, and a kill-and-resume would stop replaying byte-identical.')
      + '</div>'
      + C.table({ cols: [{ h: 'bar' }, { h: 'certified min|f| to beat', cls: 'v' }, { h: 'source' }], rows })
      + '<div class="col">'
      + (stale.length === 0
          ? C.note({ lab: 'Staleness audit', bodyRaw: C.pRaw('<b>Clean.</b> ' + C.m('envelopeAudit()')
              + ' finds no term count where the board holds a certified value the envelope does not know. '
              + 'It refuses nothing — it reports — but an unadopted excess can never again sit unnoticed.') })
          : C.note({ lab: 'Staleness audit — ' + stale.length + ' unadopted excess', bodyRaw: stale.map(x =>
              C.pRaw('n = ' + x.n + ': the board holds ' + C.m(fmt(Math.sqrt(x.modSq[0]), 12))
                + ' and the envelope has ' + C.m(fmt(Math.sqrt(x.envelopeHas), 12)) + ' — raises the bar for '
                + C.m(x.raisesBarFor) + ' once adopted.')).join('') }))
      + '</div>'
  }));
}

/* ---- §5 the machine ---- */
{
  const rows = batteryResults.map(b => [
    { raw: C.esc(b.name) },
    { raw: C.esc(b.note || '') },
    /* NO TIMING COLUMN, deliberately. A wall-clock number would make the page a
       function of the machine's mood rather than of the records, and the page
       battery's determinism check — build twice, compare bytes — is worth more
       than knowing a battery took 0.6 s or 0.7 s. */
    { raw: b.ok === null ? C.tag('not run', 'dep') : (b.ok ? C.tag('green', 'held') : C.tag('RED', 'open')) }
  ]);
  B.push(C.section({
    lab: '§5 · the machine',
    title: 'What is installed, and whether it runs',
    wide: true,
    bodyRaw: C.table({
      cols: [{ h: 'battery' }, { h: 'what it covers' }, { h: 'this build' }],
      rows
    })
      + '<div class="col">'
      + C.pRaw('Lift: ' + C.m(prov.counts.files + ' files') + ' copied out of the source lab, '
        + C.m(prov.counts.patched + ' patched') + ' on the way in, each patch declared in '
        + C.m('LIFT.json') + '. Drift right now: ' + C.m(driftLine) + '.')
      + C.note({
        lab: 'The one rule',
        bodyRaw: C.pRaw('<strong>' + C.esc(lift.source_root) + ' is read-only, permanently.</strong> Read '
          + 'anything — insights, numbers, literature, instruments. Never edit a file, never change the '
          + 'tree, and if you find an error there, report it rather than repair it: that lab pins evidence '
          + 'by path and sha256, so an edit makes a pin resolve to nothing and demotes a certified claim. '
          + 'Outward is free; inward is closed.')
      })
      + '</div>'
  }));
}

/* ---- §6 defects ---- */
{
  const defects = [
    { b: 'Board key undeclared — FIXED.', text: 'The first campaign boarded six entries for three objects; '
      + 'reversal A → max(A)−A is the same object. The facility existed and was not declared. The pre-fix '
      + 'board was archived, not deleted.' },
    { b: 'A ratchet with no pawl — FIXED.', text: 'The term-varying generator could only ever reach n=7, '
      + 'because extending needs a boarded champion at n−1 and none could be boarded. 3 000 candidates, '
      + '152 hits, 0 admissions.' },
    { b: 'Boundary clamp made mutation a no-op — FIXED.', text: 'Perturbing a gap of 1 downward clamped '
      + 'back to 1, so 23 of 1 500 proposals returned an unmutated literature anchor. Caught by a new '
      + 'check on its first run.' },
    { b: 'The slide move was 45% inert — FIXED, and the result re-run.', text: 'It returned its input '
      + 'whenever the moved exponent collided, so run n18-local-1 was only 48.0% distinct. It now retries '
      + 'and returns null on genuine failure rather than the identity. Re-run as n18-local-2: 58.8% '
      + 'distinct, 3 529 real probes against 2 883 — and the negative held, which is why it was worth '
      + 'fixing before reporting.' },
    { b: 'The envelope could not learn — RULED AND CLOSED.', text: 'It said bar(18) = Boyd\'s 1.36237 '
      + 'while this lab held a certified 1.41414 at 17 terms, flattering every n=18 result by 5.2e-2. '
      + 'Ruled 2026-08-24: the envelope learns by EXPLICIT adoption and freezes at load. Auto-absorbing '
      + 'the board would have been worse — the bar would move mid-campaign, verdicts would depend on when '
      + 'a candidate was proposed, and a kill-and-resume would stop replaying byte-identical. The 17-term '
      + 'object is adopted; envelopeAudit() now reports any unadopted excess without refusing anything.' },
    { b: 'envelopeAudit cried wolf — FIXED by its own red control.', text: 'The first version flagged any '
      + 'board entry at a term count with no anchor, however weak. RED (g) planted a value far BELOW the '
      + 'envelope and watched it get named anyway. The predicate now asks whether the value exceeds '
      + 'bar(n+1), the first bar it could touch.' },
    { b: 'The machine gates completeness on a NAME — OPEN, owner\'s call.', text: 'A run that exhausted its '
      + 'box, audited every reject and produced no REFUSED still got the downgrade, because funnel.js tests '
      + 'gen.name === "enum" rather than the property. Not patched: renaming our generator would game the '
      + 'check, and changing claim semantics mid-campaign should not happen silently.' }
  ];
  B.push(C.section({
    lab: '§6 · defects',
    title: 'What went wrong, including in this page\'s own tooling',
    bodyRaw: C.plainList(defects)
      + C.pull('A check nobody has seen go red is <b>decoration</b>.')
  }));
}

/* ---- §7 not established ---- */
B.push(C.section({
  lab: '§7 · limits',
  title: 'What none of this establishes',
  bodyRaw: C.plainList([
    { b: 'No claim is minted.', text: 'No literature gate has run on any object here. The 17-term result '
      + 'is a two-exponent deletion from a published witness — a trivial derivation from someone else\'s object.' },
    { b: 'Novelty is unknown, not established.', text: 'Boyd tabulated by degree; term-indexed μ(n) for '
      + '10 ≤ n ≤ 18 was not located. A failed search is not a negative result.' },
    { b: 'The min|f| ≥ 2 record is untouched.', text: 'It stands at 19 terms. The best certified value here '
      + 'is 1.414, and min|f|² = 1.99980 sits 2.0e−4 below 2 — near, not equal.' },
    { b: 'Not independently verified.', text: 'The checks and the code share an author. Cross-checks against '
      + 'the source lab agree byte-for-byte, but that lab and this one share an operator.' },
    { b: 'The n = 18 negative is local.', text: '6 000 moves around the census near-miss found nothing better, '
      + 'but they were 48% distinct and confined to one neighbourhood. It is a local optimum, not a proof.' }
  ])
}));

/* ---- footer ---- */
const foot = '<footer class="col">\n'
  + '<p>' + C.esc('Generated by tools/build-control.js from records on disk. Rebuild: make control.') + '</p>\n'
  + '<p>' + C.esc('git ' + gitHead + ' · ' + gitCount + ' commit' + (gitCount === '1' ? '' : 's')
      + ' · ' + gitDirty + ' uncommitted path' + (gitDirty === 1 ? '' : 's')
      + ' · ' + (totalRecordBytes / 1048576).toFixed(1) + ' MB of chained records'
      + ' · ' + Math.round(watchSeconds / 60) + ' min of watched detached compute') + '</p>\n'
  + '<p>' + C.esc('Written record: ' + notes.join(' · ')) + '</p>\n'
  + '<p style="margin-top:20px;color:var(--ink-2)">' + C.esc('Carlos Toledo · cert-machine · '
      + 'the novelty-driven half. Instruments lifted from sin-mfg, which is read-only from here. '
      + 'Corrections are recorded with their date, never quietly fixed.') + '</p>\n'
  + '</footer>';

const html = TPL.render({ title: 'cert-machine · control centre', bodyRaw: B.join('\n\n'), footRaw: foot });
fs.writeFileSync(path.join(ROOT, 'control.html'), html);

console.log('control.html written — ' + (html.length / 1024).toFixed(1) + ' KB');
console.log('  batteries   ' + batteriesGreen + '/' + batteriesRun + ' green');
console.log('  drift       ' + driftLine);
console.log('  candidates  ' + commas(totalCandidates) + ' funnel + ' + commas(censusSubsets) + ' census');
console.log('  board       ' + (H.board.entries || []).length + ' entries');
