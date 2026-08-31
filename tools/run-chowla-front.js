#!/usr/bin/env node
/* run-chowla-front.js — point the generation front at Chowla's cosine problem.

   For each requested n: run the free set-walk, CERTIFY its best set exactly,
   certify the best classical set at the same n, and record both. Only what
   certifies is written.

   THE COMPARISON IS PER n, AND THAT IS NOT A DETAIL. c at small n says
   nothing about Chowla's problem, which asks for c bounded as n -> infinity.
   Reading a low c at one n as progress on the open problem is the error this
   runner is shaped to prevent: every row states its n, every row names the
   classical set it beat at THAT n, and the summary reports the TREND in n
   rather than a champion.

   usage: node tools/run-chowla-front.js --n 10,20,30 [--evals 40000]
                                         [--seeds 3] [--maxmult 3] */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CH = require(path.join(ROOT, 'machine', 'generate', 'chowla.js'));
const W = require(path.join(ROOT, 'machine', 'generate', 'proposers', 'setwalk.js'));

const CERT = path.join(ROOT, 'certs', 'chowla-records.json');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };

function load() {
  if (!fs.existsSync(CERT)) return {
    what: 'Certified Chowla merits c(A) = -min_x sum_{a in A} cos(ax) / sqrt(|A|), one row per set size n. '
      + 'Every c is an UPPER bound proved by instruments/trigmin: c(A) <= hi, for the set stored beside it. '
      + 'A row says nothing about the infimum over all sets of that size, and nothing about the asymptotic '
      + 'question Chowla actually asked.',
    instrument: 'instruments/trigmin/certify-min.js',
    caution: 'SMALL n IS EASY AND MEANS NOTHING ASYMPTOTICALLY. Chowla\'s problem asks for a construction whose '
      + 'c stays bounded as n grows; a low c at one n is a fact about that n. The trend across n is the only '
      + 'part of this file that speaks to the problem, and it is not a proof of anything either.',
    landmarks: { known_since_1960s: 1.0, unreached: 0.05 },
    rows: []
  };
  return JSON.parse(fs.readFileSync(CERT, 'utf8'));
}

/** merge one row against disk — two campaigns on different n are normal */
function commit(row) {
  const doc = load();
  const prev = doc.rows.find((r) => r.n === row.n);
  if (prev && prev.certifiedC <= row.certifiedC) return false;
  if (prev) doc.rows[doc.rows.indexOf(prev)] = row; else doc.rows.push(row);
  doc.rows.sort((a, b) => a.n - b.n);
  doc.generated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(CERT, JSON.stringify(doc, null, 2) + '\n');
  return true;
}

function bestClassical(n) {
  let best = null;
  for (const s of CH.classical(n)) {
    if (s.pastWall) continue;
    const c = CH.certifyC(s.A);
    if (!c || c.refused) continue;
    if (!best || c.hi < best.hi) best = { name: s.name, A: s.A, hi: c.hi };
  }
  return best;
}

function main() {
  const ns = String(arg('n', '20')).split(',').map(Number).filter((x) => x >= 2);
  const evals = Number(arg('evals', 40000));
  const seeds = Number(arg('seeds', 3));
  const mult = Number(arg('maxmult', 3));
  let wrote = 0;

  for (const n of ns) {
    const maxA = Math.min(CH.DEGREE_WALL, Math.max(2 * n, Math.round(mult * n)));
    const t0 = Date.now();

    let best = null, bestFloat = Infinity;
    for (let seed = 1; seed <= seeds; seed++) {
      const r = W.walk({ n, maxA, seed, evals });
      if (r.bestC < bestFloat) { bestFloat = r.bestC; best = r.best; }
    }

    /* THE AUTHORITY. The float number above never reaches the record. */
    const c = CH.certifyC(best);
    if (!c || c.refused) {
      console.error('REFUSED n=' + n + ': ' + (c ? c.refused : 'the certifier returned nothing'));
      process.exitCode = 1;
      continue;
    }
    const cls = bestClassical(n);
    const secs = (Date.now() - t0) / 1000;

    const row = {
      n, maxA, certifiedC: c.hi, enclosure: [c.lo, c.hi], degree: c.degree, set: best,
      classical: cls ? { name: cls.name, certifiedC: cls.hi } : null,
      beatsClassical: cls ? c.hi < cls.hi : null,
      belowUnitLandmark: c.hi < 1,
      search: { proposer: 'setwalk@v1', seeds, evals, maxA, seconds: Number(secs.toFixed(1)), costUsd: 0 }
    };
    if (commit(row)) wrote++;

    console.log('n=' + String(n).padStart(3)
      + '  certified c <= ' + c.hi.toFixed(6)
      + '  | classical ' + (cls ? cls.name + ' ' + cls.hi.toFixed(6) : '   —   ')
      + '  | ' + (row.beatsClassical ? 'BEATS' : 'above') + ' classical'
      + '  | ' + (row.belowUnitLandmark ? 'below' : 'above') + ' the c=1 landmark'
      + '  (' + secs.toFixed(0) + 's)');
  }

  const doc = load();
  console.log('\ncerts/chowla-records.json: ' + doc.rows.length + ' rows, ' + wrote + ' new or improved.');
  if (doc.rows.length > 1) {
    const f = doc.rows[0], l = doc.rows[doc.rows.length - 1];
    console.log('TREND, which is the only part that speaks to the open problem: c = '
      + f.certifiedC.toFixed(4) + ' at n=' + f.n + '  ->  ' + l.certifiedC.toFixed(4) + ' at n=' + l.n
      + (l.certifiedC > f.certifiedC ? '  (rising with n)' : '  (not rising with n)'));
  }
}

main();
