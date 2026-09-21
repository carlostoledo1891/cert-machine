/* instruments/hseva/blocks.js — the hourly Hs series of the benchmark's
   buoys, and their block maxima.

   The data are the ec-benchmark datasets already pinned in corpus/ec-benchmark
   (NDBC buoys A, B, C: ten provided years and ten retained years each, hourly
   significant wave height to four decimals). Each literal is read by the
   ecbench reader (the literal's double is what the families see, enclosed by
   its neighbours in the interval path). A block maximum is the largest
   literal in a calendar block — day, month or year of the timestamp — which
   is exact because distinct four-decimal literals map to distinct, ordered
   doubles. Hours whose Hs is not a number are dropped and counted. */
'use strict';
const path = require('path');
const EL = require(path.join(__dirname, '..', 'ecbench', 'lib.js'));

const BUOYS = { A: ['datasets/A.txt', 'datasets-retained/Ar.txt'], B: ['datasets/B.txt', 'datasets-retained/Br.txt'], C: ['datasets/C.txt', 'datasets-retained/Cr.txt'] };
const BLOCKS = { hourly: { hours: 1, key: (t) => t }, daily: { hours: 24, key: (t) => t.slice(0, 10) }, monthly: { hours: 730.5, key: (t) => t.slice(0, 7) }, annual: { hours: 8766, key: (t) => t.slice(0, 4) } };

function series(buoy) {
  const parts = BUOYS[buoy].map((rel) => EL.readDataset(rel));
  const t = [], h = [], hs = []; let dropped = 0;
  for (const p of parts) for (let i = 0; i < p.n; i++) { if (!Number.isFinite(p.h[i]) || !(p.h[i] > 0)) { dropped++; continue; } t.push(p.t[i]); h.push(p.h[i]); hs.push(p.hs[i]); }
  return { buoy, files: parts.map((p) => ({ rel: p.rel, sha256: p.sha256, n: p.n })), n: h.length, dropped, t, h, hs, years: new Set(t.map((x) => x.slice(0, 4))).size };
}
function blockMaxima(S, block) {
  const B = BLOCKS[block]; if (!B) throw new Error('unknown block ' + block);
  if (block === 'hourly') return { block, hours: 1, n: S.n, x: S.h, keys: null };
  const m = new Map();
  for (let i = 0; i < S.n; i++) { const k = B.key(S.t[i]); const v = S.h[i]; if (!m.has(k) || v > m.get(k)) m.set(k, v); }
  const keys = [...m.keys()].sort();
  return { block, hours: B.hours, n: keys.length, x: keys.map((k) => m.get(k)), keys };
}

module.exports = { BUOYS, BLOCKS, series, blockMaxima };
