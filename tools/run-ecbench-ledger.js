#!/usr/bin/env node
/* run-ecbench-ledger.js — every contour submitted to the environmental-contour
   benchmark, re-decided against the hourly data it was tested on, exactly.
   Writes certs/ecbench-ledger.json.

   For each submitted contour (11 methods × 6 datasets × the return periods
   each author supplied): the polygon's own diagnostics (closed? simple? its
   closing edge), and every hourly observation of the provided, retained and
   full datasets classified INSIDE / OUTSIDE / ON under the even-odd rule the
   benchmark's script used (nonzero winding beside it), with the count above
   the paper's severity threshold. The preprint's Tables 5 and 6 are then read
   against the exact counts: a printed integer AGREES when it lies in
   [outside, outside + on] — the boundary points are the ones a float test may
   put on either side — and a printed mean agrees when it is the mean of the
   three exact counts to the digit printed.

   usage: node tools/run-ecbench-ledger.js            (about a minute)
          node tools/run-ecbench-ledger.js --check    re-derive and compare with the shipped ledger, write nothing */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const L = require(path.join(ROOT, 'instruments', 'ecbench', 'lib.js'));
const D = require(path.join(ROOT, 'instruments', 'ecbench', 'decide.js'));
const X = require(path.join(ROOT, 'instruments', 'ecbench', 'expected.js'));
const die = (m) => { console.error('ECBENCH LEDGER REFUSED: ' + m); process.exit(1); };
const CHECK = process.argv.includes('--check');
const OUT = path.join(ROOT, 'certs', 'ecbench-ledger.json');

/* ---- the pins ---- */
const meta = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'meta.json'), 'utf8'));
const claims = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'claims.json'), 'utf8'));
L.ensureCorpus();
for (const [rel, m] of Object.entries(meta.files)) {
  const p = path.join(L.CORPUS, rel);
  if (!fs.existsSync(p)) die('corpus/ec-benchmark/' + rel + ' is absent after the fetch — run: node tools/fetch-ec-benchmark.js');
  if (crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') !== m.sha256) die('corpus/ec-benchmark/' + rel + ' does not hash to its pin');
}

/* ---- the data: provided, retained, full per dataset letter ---- */
const t0 = Date.now();
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const data = {};
for (const ch of LETTERS) {
  const p = L.readDataset('datasets/' + ch + '.txt'), r = L.readDataset('datasets-retained/' + ch + 'r.txt');
  if (p.kind !== r.kind) die('dataset ' + ch + ': provided and retained disagree on their variables');
  const full = { kind: p.kind, n: p.n + r.n, u: Float64Array.from([...p.u, ...r.u]), h: Float64Array.from([...p.h, ...r.h]), us: p.us.concat(r.us), hs: p.hs.concat(r.hs), t: p.t.concat(r.t) };
  /* the observed maximum of Hs in each part, exactly (a literal compared as a literal), with its hour */
  const maxOf = (ds) => { let k = 0; for (let i = 1; i < ds.n; i++) if (D.cmpLit({ s: ds.hs[k], v: ds.h[k] }, { s: ds.hs[i], v: ds.h[i] }) > 0) k = i; return { hs: ds.hs[k], u: ds.us[k], t: ds.t ? ds.t[k] : null }; };
  const mp = maxOf(p), mr = maxOf(r);
  data[ch] = { provided: p, retained: r, full, kind: p.kind, maxHs: { provided: mp, retained: mr, full: D.cmpLit({ s: mp.hs, v: Number(mp.hs) }, { s: mr.hs, v: Number(mr.hs) }) > 0 ? mr : mp } };
}
console.log('  datasets read: ' + LETTERS.map((c) => c + ' ' + data[c].provided.n + '+' + data[c].retained.n).join(', ') + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');

/* ---- the contours ---- */
const rows = [];
const mean1 = (xs) => (xs.reduce((a, b) => a + b, 0) / xs.length);
const fmt1 = (x) => x.toFixed(1);
for (const c of claims.contributions) {
  const dir = path.join(L.CORPUS, 'contours', c.folder);
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(c.prefix + '_dataset_') && f.endsWith('.txt')).sort();
  const folderNo = Number(c.folder.split('-')[1]);
  for (const f of files) {
    const m = /_dataset_([A-Fa-f])_(\d+)\.txt$/.exec(f);
    if (!m) die('unrecognised contour file name ' + f);
    const ch = m[1].toUpperCase(), T = Number(m[2]);
    const rel = 'contours/' + c.folder + '/' + f;
    const K = L.readContour(rel);
    const expectKind = 'ABC'.includes(ch) ? 'tz' : 'wind';
    if (K.kind !== expectKind) die(rel + ': header names ' + K.kind + ' for dataset ' + ch);
    /* the organizers' assumed column order for this participant, from their scripts */
    const orgHsCol = 'ABC'.includes(ch) ? (claims.organizersColumnOrder.abc_hsSecond.includes(folderNo) ? 1 : 0)
      : (claims.organizersColumnOrder.def_hsFirst.includes(folderNo) ? 0 : 1);
    const P = D.polygon(K.pts);
    const diag = D.diagnostics(P);
    const counts = {};
    for (const part of ['provided', 'retained', 'full']) {
      const r = D.count(P, data[ch][part], { windThreshold: expectKind === 'wind' });
      counts[part] = { n: r.n, in: r.in, out: r.out, on: r.on, outAboveThreshold: r.outAboveThreshold, outWinding: r.outWinding, rulesDisagree: r.rulesDisagree };
      if (part === 'full') counts.full.onSample = r.onIdx.slice(0, 5).map((i) => ({ u: data[ch].full.us[i], h: data[ch].full.hs[i], t: data[ch].full.t[i], part: i < data[ch].provided.n ? 'provided' : 'retained' }));
    }
    const row = {
      id: c.prefix + '/' + ch + '/' + T, contribution: c.key, method: c.method, class: c.class, authors: c.authors,
      dataset: ch, variables: expectKind === 'tz' ? 'Hs, Tz' : 'u10, Hs', returnPeriod: T, file: rel, sha256: K.sha256,
      header: K.header, hsColumn: K.hsCol, organizersHsColumn: orgHsCol, columnOrderAgrees: K.hsCol === orgHsCol,
      polygon: diag, counts,
      maxHsAboveObserved: D.cmpLit({ s: data[ch].maxHs.full.hs, v: Number(data[ch].maxHs.full.hs) }, { s: diag.maxHs, v: Number(diag.maxHs) }) > 0,
    };
    rows.push(row);
    process.stdout.write('  ' + row.id.padEnd(40) + ' n=' + String(diag.vertices).padStart(5) + (diag.simple ? '  simple ' : '  NOT simple (' + diag.selfCrossings + ' crossings, ' + diag.touches + ' touches, ' + diag.backtracks + ' backtracks)') + '  full: out ' + counts.full.out + ', on ' + counts.full.on + ', above ' + counts.full.outAboveThreshold + '\n');
  }
}
console.log('  ' + rows.length + ' contours decided in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s; ' + D.exactCount() + ' predicates fell to exact arithmetic');

/* ---- the printed tables against the exact counts ---- */
const comparisons = [];
for (const [tab, letters] of [['table5', ['A', 'B', 'C']], ['table6', ['D', 'E', 'F']]]) {
  const T = claims[tab];
  for (const [key, pr] of Object.entries(T.rows)) {
    const c = claims.contributions.find((x) => x.key === key);
    const get = (ch, rp) => rows.find((r) => r.contribution === key && r.dataset === ch && r.returnPeriod === rp);
    /* the long return period: three integers printed */
    for (let i = 0; i < 3; i++) {
      const r = get(letters[i], T.returnPeriods.long);
      if (!r) die('no contour for ' + key + ' ' + letters[i] + ' ' + T.returnPeriods.long);
      const printed = pr.long.each[i], printedAbove = pr.long.aboveEach[i];
      const lo = r.counts.full.out, hi = r.counts.full.out + r.counts.full.on;
      const loA = r.counts.full.outAboveThreshold, hiA = r.counts.full.outAboveThreshold + r.counts.full.on;
      comparisons.push({ table: tab, contribution: key, dataset: letters[i], returnPeriod: T.returnPeriods.long, quantity: 'outside',
        printed, exact: lo, onBoundary: r.counts.full.on, agrees: printed >= lo && printed <= hi, exactlyEqual: printed === lo, difference: printed - lo });
      comparisons.push({ table: tab, contribution: key, dataset: letters[i], returnPeriod: T.returnPeriods.long, quantity: 'outsideAboveThreshold',
        printed: printedAbove, exact: loA, onBoundary: r.counts.full.on, agrees: printedAbove >= loA && printedAbove <= hiA, exactlyEqual: printedAbove === loA, difference: printedAbove - loA });
    }
    /* the 1-yr row: means to one decimal */
    const r1 = letters.map((ch) => get(ch, 1));
    if (r1.some((x) => !x)) die('a 1-yr contour is missing for ' + key);
    const outs = r1.map((r) => r.counts.full.out), ons = r1.map((r) => r.counts.full.on), abv = r1.map((r) => r.counts.full.outAboveThreshold);
    const mo = mean1(outs), moHi = mean1(outs.map((o, i) => o + ons[i]));
    const ma = mean1(abv), maHi = mean1(abv.map((o, i) => o + ons[i]));
    const p1 = Number(pr.yr1.outside), pa = Number(pr.yr1.above);
    comparisons.push({ table: tab, contribution: key, dataset: letters.join(''), returnPeriod: 1, quantity: 'meanOutside',
      printed: p1, exact: Number(fmt1(mo)), each: outs, onBoundaryEach: ons, agrees: p1 >= Number(fmt1(mo)) - 0.05 && p1 <= Number(fmt1(moHi)) + 0.05, exactlyEqual: fmt1(mo) === fmt1(p1), difference: Number((p1 - mo).toFixed(1)) });
    comparisons.push({ table: tab, contribution: key, dataset: letters.join(''), returnPeriod: 1, quantity: 'meanOutsideAboveThreshold',
      printed: pa, exact: Number(fmt1(ma)), each: abv, onBoundaryEach: ons, agrees: pa >= Number(fmt1(ma)) - 0.05 && pa <= Number(fmt1(maHi)) + 0.05, exactlyEqual: fmt1(ma) === fmt1(pa), difference: Number((pa - ma).toFixed(1)) });
  }
}
const nAgree = comparisons.filter((c) => c.agrees).length, nExact = comparisons.filter((c) => c.exactlyEqual).length;
console.log('  printed numbers read against the exact counts: ' + comparisons.length + ', ' + nAgree + ' agree (' + nExact + ' to the integer), ' + (comparisons.length - nAgree) + ' do not');
for (const c of comparisons.filter((x) => !x.agrees)) console.log('    DISAGREES ' + c.contribution + ' ' + c.dataset + ' ' + c.returnPeriod + '-yr ' + c.quantity + ': printed ' + c.printed + ', exact ' + c.exact + (c.onBoundary ? ' (+' + c.onBoundary + ' on the boundary)' : ''));

/* ---- Table 1's expected numbers, certified ---- */
const expected = [];
for (const [tab, letters, Tl] of [['table5', ['A', 'B', 'C'], 20], ['table6', ['D', 'E', 'F'], 50]]) {
  for (const T of [1, Tl]) {
    for (const ch of letters) {
      const n = data[ch].full.n;
      const e = X.expectedOutside(n, T);
      expected.push({ table: tab, dataset: ch, returnPeriod: T, n, alpha: e.alpha, total: e.total, iform: e.iform, beta: e.beta });
    }
  }
}
for (const e of expected) console.log('  expected outside ' + e.dataset + ' ' + e.returnPeriod + '-yr on n=' + e.n + ': total ' + e.total.decimal + ' · IFORM [' + e.iform.lo + ', ' + e.iform.hi + '] (β ∈ [' + e.beta.lo + ', ' + e.beta.hi + '])');

/* the out-of-sample expectation: n_retained × α for the long return period, exactly */
const retainedExpected = {};
for (const ch of LETTERS) { const T = 'ABC'.includes(ch) ? 20 : 50; const e = X.expectedOutside(data[ch].retained.n, T); retainedExpected[ch] = { returnPeriod: T, n: data[ch].retained.n, total: e.total, iform: e.iform }; }

const ledger = {
  what: 'The environmental-contour benchmark (Haselsteiner et al. 2021), Exercise 1, re-decided exactly: every submitted contour as a polygon, every hourly observation classified INSIDE / OUTSIDE / ON in exact arithmetic under the even-odd rule the benchmark used, the preprint\'s printed counts read against the exact ones, and Table 1\'s expected numbers certified.',
  generated: new Date().toISOString().slice(0, 10), corpus: { repo: meta.repo, commit: meta.commit, files: Object.keys(meta.files).length, paperSha256: meta.paper.sha256 },
  datasets: Object.fromEntries(LETTERS.map((c) => [c, { variables: data[c].kind === 'tz' ? 'Hs, Tz' : 'u10, Hs', provided: data[c].provided.n, retained: data[c].retained.n, full: data[c].full.n, maxHs: data[c].maxHs }])),
  rule: 'even-odd crossing number on the polygon closed from the last vertex to the first (matplotlib Path.contains_points\' convention), decided exactly; nonzero winding kept beside it',
  rows, comparisons, summary: { contours: rows.length, comparisons: comparisons.length, agree: nAgree, exactlyEqual: nExact, disagree: comparisons.length - nAgree,
    notSimple: rows.filter((r) => !r.polygon.simple).length, notClosed: rows.filter((r) => !r.polygon.closed).length,
    withBoundaryPoints: rows.filter((r) => r.counts.full.on > 0).length, boundaryPointsTotal: rows.reduce((a, r) => a + r.counts.full.on, 0),
    columnOrderDisagreements: rows.filter((r) => !r.columnOrderAgrees).length, rulesDisagreeTotal: rows.reduce((a, r) => a + r.counts.full.rulesDisagree, 0),
    exactPredicates: D.exactCount(), predicates: D.predicateCount(), seconds: Number(((Date.now() - t0) / 1000).toFixed(1)) },
  expected, retainedExpected,
};

if (CHECK) {
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const strip = (l) => JSON.stringify({ rows: l.rows, comparisons: l.comparisons, expected: l.expected });
  if (strip(old) !== strip(ledger)) die('the re-derived ledger differs from certs/ecbench-ledger.json');
  console.log('  --check: the shipped ledger re-derives identically');
} else {
  fs.writeFileSync(OUT, JSON.stringify(ledger, null, 1) + '\n');
  console.log('  certs/ecbench-ledger.json written: ' + rows.length + ' rows, ' + comparisons.length + ' comparisons');
}
