#!/usr/bin/env node
/* run-lambda-table.js — the certified lambda(n) upper-bound table:
   (1) REPRODUCE all nine rows of the source lab's table (n = 4..12 at
       their box sizes, seeded with their optimisers — the bar starts at
       the certified value and the sweep decides whether anything in the
       box beats it; the record carries reproduces: true/false);
   (2) EXTEND to n = 13..17 at M = 25 — rows no table anywhere holds;
   (3) DEEPEN n = 9..12 to M = 30 (their table used M = 25 there) — a
       wider box can only confirm or improve an UPPER bound.
   Rows are keyed "n@M". Every record is an exhaustion with a conservation
   identity and the infimum caveat in its own text.

   usage: node tools/run-lambda-table.js [phase]   phase in {repro, extend, deepen, all} */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const L = require(path.join(ROOT, 'instruments', 'trigmin', 'lambda.js'));
const CM = require(path.join(ROOT, 'instruments', 'trigmin', 'certify-min.js'));

const OUT = path.join(ROOT, 'certs', 'lambda-table.json');
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const phase = process.argv[2] || 'all';

/* the source lab's table (research/probes/mercer-program/NOTES.md, 2026-08-21) */
const REPRO = [
  { n: 4, M: 20, A: [1, 2, 3, 4], lambda: 1.519557881643 },
  { n: 5, M: 60, A: [1, 2, 4, 5, 6], lambda: 1.627460664467 },
  { n: 6, M: 50, A: [1, 2, 4, 6, 7, 8], lambda: 1.591832329324 },
  { n: 7, M: 30, A: [1, 2, 3, 5, 6, 7, 8], lambda: 1.893455418992 },
  { n: 8, M: 30, A: [2, 3, 4, 5, 7, 8, 10, 12], lambda: 1.956787693633 },
  { n: 9, M: 25, A: [2, 3, 4, 5, 7, 9, 10, 12, 14], lambda: 2.069282587092 },
  { n: 10, M: 25, A: [1, 2, 3, 5, 6, 7, 8, 10, 11, 13], lambda: 2.057447274608 },
  { n: 11, M: 25, A: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 14], lambda: 2.102381279243 },
  { n: 12, M: 25, A: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15], lambda: 2.213895922406 }
];

const table = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {
  what: 'the certified lambda(n) table: exhaustive box sweeps, optimiser certified. lambda(n) is an INFIMUM — '
    + 'every row is a certified UPPER bound on lambda(n) plus completeness over its named box, never a value; '
    + 'rows at different n order NOTHING (a box gives no lower bound).',
  rows: {}
};

function save(key, rec) {
  if (fs.existsSync(OUT)) {
    const fresh = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    for (const k of Object.keys(fresh.rows)) if (!(k in table.rows)) table.rows[k] = fresh.rows[k];
  }
  table.rows[key] = rec;
  fs.writeFileSync(OUT, JSON.stringify(table, null, 1) + '\n');
}

function runBox(n, M, seed, note) {
  console.log('lambda(' + n + ') box' + M + ': seed [' + seed.join(',') + ']' + (note ? '  (' + note + ')' : ''));
  let rec = L.sweepLambdaBox({ n, M, seed, log: (m) => console.log('  ' + m) });
  if (rec.survivors.length > 60) {
    console.log('  ' + rec.survivors.length + ' survivors — re-sweeping with the optimiser as seed');
    rec = L.sweepLambdaBox({ n, M, seed: rec.optimiser.A, log: (m) => console.log('  ' + m) });
    rec.reseeded = true;
  }
  rec.generatedBy = 'tools/run-lambda-table.js @ git ' + git;
  console.log('  optimiser [' + rec.optimiser.A.join(',') + ']  lambda <= ' + rec.optimiser.lambda[1]
    + '  survivors ' + rec.survivors.length + '  ' + (rec.elapsedMs / 1000).toFixed(1) + ' s  (' + rec.conservation + ')');
  return rec;
}

/* float hill-climb for seeds on new rows (routing only; the seed is certified by the sweep) */
function sampleMinF(A, K) {
  let best = Infinity;
  for (let j = 0; j <= K; j++) { const th = Math.PI * j / K; let s = 0; for (const a of A) s += Math.cos(a * th); if (s < best) best = s; }
  return best;
}
function seedByClimb(prevOpt, n, M) {
  let best = null, bestV = -Infinity;
  for (let x = 1; x <= M; x++) {
    if (prevOpt.includes(x)) continue;
    const A = prevOpt.concat([x]).sort((a, b) => a - b);
    const v = sampleMinF(A, 1024);
    if (v > bestV) { bestV = v; best = A; }
  }
  for (let iter = 0; iter < 40; iter++) {
    let improved = false;
    for (let i = 0; i < best.length; i++) for (let x = 1; x <= M; x++) {
      if (best.includes(x)) continue;
      const Bm = best.slice(); Bm[i] = x; Bm.sort((a, b) => a - b);
      const v = sampleMinF(Bm, 1024);
      if (v > bestV) { best = Bm; bestV = v; improved = true; }
    }
    if (!improved) break;
  }
  return best;
}

if (phase === 'repro' || phase === 'all') {
  for (const row of REPRO) {
    const key = row.n + '@' + row.M;
    const rec = runBox(row.n, row.M, row.A, 'reproduction, seeded with the source-lab optimiser');
    rec.sourceLab = { A: row.A, lambda12dp: row.lambda };
    rec.reproduces = JSON.stringify(rec.optimiser.A) === JSON.stringify(row.A)
      && Math.abs(rec.optimiser.lambda[0] - row.lambda) < 1e-11;
    if (!rec.reproduces) console.log('  *** DOES NOT REPRODUCE the source-lab row — investigate before trusting either ***');
    save(key, rec);
  }
}

if (phase === 'extend' || phase === 'all') {
  let prev = (table.rows['12@25'] || table.rows['12@25']) ? table.rows['12@25'].optimiser.A : REPRO[8].A;
  for (let n = 13; n <= 17; n++) {
    const seed = seedByClimb(prev, n, 25);
    const rec = runBox(n, 25, seed, 'NEW ROW — no published table extends past n = 12');
    save(n + '@25', rec);
    prev = rec.optimiser.A;
  }
}

if (phase === 'deepen' || phase === 'all') {
  for (let n = 9; n <= 12; n++) {
    const base = table.rows[n + '@25'];
    const seed = base ? base.optimiser.A : REPRO.find(r => r.n === n).A;
    const rec = runBox(n, 30, seed, 'deepened box (source lab stopped at M = 25)');
    const prevOpt = base && JSON.stringify(base.optimiser.A);
    rec.vsShallower = prevOpt === JSON.stringify(rec.optimiser.A)
      ? 'M=25 optimiser CONFIRMED as the M=30 optimiser'
      : 'the wider box found a better set — upper bound improved';
    console.log('  ' + rec.vsShallower);
    save(n + '@30', rec);
  }
}

/* deepenN (e.g. "deepen13"): ONE row n@30, written to a per-row sidecar so five
   detached processes can run in parallel with ZERO writers on the shared table;
   "merge" folds the sidecars in serially afterwards. */
const single = /^deepen(\d+)$/.exec(phase);
if (single) {
  const n = Number(single[1]);
  const base = table.rows[n + '@25'];
  if (!base) { console.error('deepen' + n + ': no ' + n + '@25 row to seed from'); process.exit(1); }
  const rec = runBox(n, 30, base.optimiser.A, 'deepened box (the M=25 row was itself the first table past n=12)');
  rec.vsShallower = JSON.stringify(base.optimiser.A) === JSON.stringify(rec.optimiser.A)
    ? 'M=25 optimiser CONFIRMED as the M=30 optimiser'
    : 'the wider box found a better set — upper bound improved';
  console.log('  ' + rec.vsShallower);
  const sidecar = path.join(ROOT, 'certs', 'lambda-row-' + n + '-M30.json');
  fs.writeFileSync(sidecar, JSON.stringify({ key: n + '@30', rec }, null, 1) + '\n');
  console.log('sidecar ' + path.relative(ROOT, sidecar) + ' written — merge with: node tools/run-lambda-table.js merge');
  process.exit(0);
}

if (phase === 'merge') {
  const dir = path.join(ROOT, 'certs');
  for (const f of fs.readdirSync(dir).filter((f) => /^lambda-row-.*\.json$/.test(f)).sort()) {
    const { key, rec } = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    save(key, rec);
    console.log('merged ' + key + ' from ' + f);
  }
}

console.log('certs/lambda-table.json written (rows ' + Object.keys(table.rows).sort().join(', ') + ')');
