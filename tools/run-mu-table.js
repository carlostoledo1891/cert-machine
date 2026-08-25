#!/usr/bin/env node
/* run-mu-table.js — the certified mu(n) table, n = 9..17, exponents <= 30:
   for each term count, an exhaustive sweep of every n-term Newman exponent
   set inside the box, every set decided exactly, the champion certified.
   n = 9 is the VALIDATION row (it must reproduce the sin-mfg record's
   structure: six survivors, two orbits, the published witness confirmed at
   its exact floor); n = 10..16 are rows nobody has ever run; n = 17 is the
   first term count with no printed demonstration of mu > 1 anywhere.

   SEEDING. Each box's bar comes from a certified witness: the previous
   champion with one exponent inserted (float-scored over all insertions,
   then certified — the float only picks the candidate; the bar is exact).
   A weak seed only costs survivors, never correctness; if a box returns
   more than 40 survivors the sweep is re-run once with its own champion
   as the seed, and the record says so.

   usage: node tools/run-mu-table.js [nLo] [nHi]   (default 9 17)
   writes certs/mu-table.json (merging over existing rows) */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const S = require(path.join(ROOT, 'instruments', 'trigmin', 'sweep.js'));
const N = require(path.join(ROOT, 'instruments', 'trigmin', 'newman.js'));

const MAXA = 30;
const nLo = Number(process.argv[2] || 9), nHi = Number(process.argv[3] || 17);
const OUT = path.join(ROOT, 'certs', 'mu-table.json');
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* the mu(9) box-30 champion (validated against the sin-mfg record) anchors
   the seeding chain; n = 9's own seed is the PUBLISHED witness, so the
   validation row reproduces the six-survivor structure of the source lab */
const PUBLISHED_MU9 = [0, 1, 2, 3, 4, 7, 8, 10, 12];
let prevChampion = PUBLISHED_MU9;

/* float hill-climb (routing only — the seed is CERTIFIED before it becomes a
   bar): from several starts, repeatedly replace one exponent by any unused
   value if the sampled min improves. A weak seed cannot corrupt anything
   (the sweep's bar is dynamic), it only costs time; a strong one saves it. */
let rngState = 0x9E3779B9;
const rng = () => { rngState ^= rngState << 13; rngState ^= rngState >>> 17; rngState ^= rngState << 5; rngState >>>= 0; return rngState / 4294967296; };
function hillClimb(A0) {
  let A = A0.slice(), v = N.sampleModSqMin(A, 1024).sampledMin;
  for (let iter = 0; iter < 60; iter++) {
    let improved = false;
    for (let i = 1; i < A.length; i++) {
      for (let x = 1; x <= MAXA; x++) {
        if (A.includes(x)) continue;
        const B = A.slice(); B[i] = x; B.sort((a, b) => a - b);
        if (B[0] !== 0) continue;
        const w = N.sampleModSqMin(B, 1024).sampledMin;
        if (w > v) { A = B; v = w; improved = true; }
      }
    }
    if (!improved) break;
  }
  return { A, v };
}
function seedFor(n) {
  if (n === 9) return PUBLISHED_MU9;
  const starts = [];
  /* previous champion + best single insertion */
  let ins = null, insV = -1;
  for (let x = 1; x <= MAXA; x++) {
    if (prevChampion.includes(x)) continue;
    const A = prevChampion.concat([x]).sort((a, b) => a - b);
    const v = N.sampleModSqMin(A, 1024).sampledMin;
    if (v > insV) { insV = v; ins = A; }
  }
  starts.push(ins);
  for (let s = 0; s < 4; s++) {                      /* random starts */
    const pool = new Set([0]);
    while (pool.size < n) pool.add(1 + Math.floor(rng() * MAXA));
    starts.push([...pool].sort((a, b) => a - b));
  }
  let best = null;
  for (const st of starts) { const r = hillClimb(st); if (!best || r.v > best.v) best = r; }
  return best.A;
}

const table = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {
  what: 'the certified mu(n) table over the box {0} u (n-1 exponents <= ' + MAXA + '): exhaustive exact verdicts, champion certified. '
    + 'TERMS convention. A box maximum is a certified LOWER bound on mu(n) plus completeness over the named box — not a value for mu(n).',
  rows: {}
};

/* resume: the seeding chain continues from the highest stored row below nLo */
for (const k of Object.keys(table.rows).map(Number).sort((a, b) => a - b)) {
  if (k < nLo) prevChampion = table.rows[k].champion.A;
}

for (let n = nLo; n <= nHi; n++) {
  const seed = seedFor(n);
  console.log('mu(' + n + ') box' + MAXA + ': seed [' + seed.join(',') + ']');
  let rec = S.sweepBox({ n, maxA: MAXA, seed, log: (m) => console.log('  ' + m) });
  let reseeded = false;
  if (rec.survivors.length > 40) {
    console.log('  ' + rec.survivors.length + ' survivors — re-sweeping with the champion as seed');
    rec = S.sweepBox({ n, maxA: MAXA, seed: rec.champion.A, log: (m) => console.log('  ' + m) });
    reseeded = true;
  }
  rec.reseeded = reseeded;
  rec.generatedBy = 'tools/run-mu-table.js @ git ' + git;
  table.rows[n] = rec;
  prevChampion = rec.champion.A;
  console.log('  champion [' + rec.champion.A.join(',') + ']  min|f| >= ' + rec.champion.modulus[0]
    + '  survivors ' + rec.survivors.length + '  ' + (rec.elapsedMs / 1000).toFixed(1) + ' s'
    + '  (' + rec.conservation + ')');
  fs.writeFileSync(OUT, JSON.stringify(table, null, 1) + '\n');   /* checkpoint per row */
}
console.log('certs/mu-table.json written (rows ' + Object.keys(table.rows).join(',') + ')');
