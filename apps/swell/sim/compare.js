#!/usr/bin/env node
/* compare.js — the island model against a fuller one: Swell's breaking height beside the Boussinesq model's, case
   by case, at the beaches both cover.
   apps/swell/sim · cert-machine

   WHY. The island model (refraction, shoaling and shelter, linear, rays on a 30 m grid) carries the measured band of
   the open sea to every beach, and every decided word on /swell/ rests on it. Its own error at the shore has not been
   measured: no buoy or camera sits at a beach yet. What CAN be measured today is how far it lands from a model that
   keeps more of the physics. frontier-apps ran one: Celeris's Boussinesq solver (Madsen & Sørensen; phase-resolving,
   nonlinear, with breaking) on 10 m and 5 m grids of four stretches of coast, for a 1 m swell at 5–7 directions and
   5 periods (data/boussinesq/, lifted and pinned in data/PINS.json). In the grammar's terms this is a COMPARISON:
   a check of the island model's simplifications against fuller physics. It is neither a verification of the code
   nor a validation against the sea (design/WARRANT.md, "Models as premises").

   THE READING is the one the page uses, model/surf.js breakHeight (the crossing marched in from the deepest probe, or
   the surf-zone peak where larger): ONE DEFINITION, this script requires surf.js and calls it. The island is read at a
   1 m swell of the case's period and direction; the Boussinesq value is the case's surf-zone Hs at that beach for the
   same 1 m swell.
   CALIBRATION, 2026-10-28. frontier compared its own reading the same way (island/validate_island.py ->
   VALIDATION-ISLAND.md, read-only there). This comparison, run with frontier's probes and frontier's reading on the
   tables that file used (Joaquina's v3 grid, the others v2), reproduced it exactly: N 556, r 0.49, bias +0.25 m,
   RMSE 0.47 m; swells of 11 s and longer N 300, r 0.58, bias +0.12 m. The record below uses the current tables:
   frontier's rule takes the v3 grid wherever it holds at least as many cases, and Campeche's v3 grid was finished
   after that file was written.

   usage: node apps/swell/sim/compare.js            writes certs/swell-island-boussinesq.json
          node apps/swell/sim/compare.js --check    re-derives it and refuses on any difference (the battery's call)
   Deterministic: same inputs, same bytes.                                                                    MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const S = require(path.join(ROOT, 'apps', 'swell', 'model', 'surf.js'));
const OUT = path.join(ROOT, 'certs', 'swell-island-boussinesq.json');
const DIR = path.join(ROOT, 'apps', 'swell', 'data', 'boussinesq');

const B = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps', 'swell', 'data', 'beaches.json'), 'utf8'));
const byName = Object.fromEntries(B.beaches.map((b) => [b.name, b]));
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const readings = { swell: (b, H) => S.breakHeight(b, H).hb };

function stats(pairs) {
  const n = pairs.length, mx = pairs.reduce((s, p) => s + p.bous, 0) / n, my = pairs.reduce((s, p) => s + p.island, 0) / n;
  let sxy = 0, sxx = 0, syy = 0, se = 0;
  for (const p of pairs) { const dx = p.bous - mx, dy = p.island - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; se += (p.island - p.bous) ** 2; }
  const ratios = pairs.map((p) => p.island / Math.max(p.bous, 0.05)).sort((a, b) => a - b);
  const med = n % 2 ? ratios[(n - 1) / 2] : (ratios[n / 2 - 1] + ratios[n / 2]) / 2;
  const r3 = (x) => Math.round(x * 1000) / 1000;
  return { n, r: r3(sxy / Math.sqrt(sxx * syy)), bias: r3(my - mx), rmse: r3(Math.sqrt(se / n)), medianRatio: r3(med), meanBous: r3(mx), meanIsland: r3(my) };
}

function derive() {
  const tables = fs.readdirSync(DIR).filter((f) => /^transfer-.*\.json$/.test(f)).sort();
  const pairs = [];
  for (const f of tables) {
    const T = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    for (const c of T.cases) {
      for (const [name, kb] of Object.entries(c.beaches)) {
        const b = byName[name];
        if (kb == null || !b || !b.probes || !b.probes.length) continue;
        const H = S.probeEnergy(B, b, [{ h: 1, p: c.T, d: c.dir }]);
        pairs.push({ grid: T.scene, beach: name, T: c.T, dir: c.dir, bous: kb, swell: readings.swell(b, H) });
      }
    }
  }
  const view = (key, sel) => stats(sel.map((p) => ({ bous: p.bous, island: p[key] })));
  const out = {};
  for (const key of Object.keys(readings)) {
    const beaches = [...new Set(pairs.map((p) => p.beach))].sort();
    out[key] = {
      all: view(key, pairs),
      longSwells: view(key, pairs.filter((p) => p.T >= 11)),
      byPeriod: Object.fromEntries([...new Set(pairs.map((p) => p.T))].sort((a, b) => a - b).map((T) => [T, view(key, pairs.filter((p) => p.T === T))])),
      byBeach: Object.fromEntries(beaches.map((n) => [n, view(key, pairs.filter((p) => p.beach === n))])),
      byBeachLong: Object.fromEntries(beaches.map((n) => [n, view(key, pairs.filter((p) => p.beach === n && p.T >= 11))])),
    };
  }
  return {
    what: 'The island model (Swell, apps/swell/model/surf.js) against the Boussinesq model (frontier-apps, Celeris solver), surf-zone Hs for a 1 m swell, case by case at the beaches both cover. A COMPARISON in the grammar of design/WARRANT.md: a check of the island model\'s simplifications against fuller physics, neither a code verification nor a validation against the sea.',
    made: 'node apps/swell/sim/compare.js',
    inputs: Object.fromEntries([...tables.map((f) => ['apps/swell/data/boussinesq/' + f, sha(path.join(DIR, f))]),
      ['apps/swell/data/beaches.json', sha(path.join(ROOT, 'apps', 'swell', 'data', 'beaches.json'))],
      ['apps/swell/model/surf.js', sha(path.join(ROOT, 'apps', 'swell', 'model', 'surf.js'))]]),
    pairs: pairs.length,
    beaches: [...new Set(pairs.map((p) => p.beach))].length,
    readings: out,
    note: 'Swells of 11 s and longer are where both models resolve the waves: the 10 m Boussinesq grids drop components under about 6.8 s, so its short-period cases read low (frontier README). bias = island minus Boussinesq; medianRatio = island / max(Boussinesq, 0.05).',
  };
}

if (require.main === module) {
  const rec = derive(), text = JSON.stringify(rec, null, 1) + '\n';
  if (process.argv.includes('--check')) {
    const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (old !== text) { console.error('swell-island-boussinesq.json does not re-derive (run node apps/swell/sim/compare.js)'); process.exit(1); }
    console.log('island vs Boussinesq: re-derived identical (' + rec.pairs + ' pairs)');
  } else {
    fs.writeFileSync(OUT, text);
    const A = rec.readings;
    console.log('pairs ' + rec.pairs + ' at ' + rec.beaches + ' beaches');
    for (const k of Object.keys(A)) console.log('  ' + k.padEnd(8) + ' all r ' + A[k].all.r + ' bias ' + A[k].all.bias + ' rmse ' + A[k].all.rmse + ' · T>=11 s: n ' + A[k].longSwells.n + ' r ' + A[k].longSwells.r + ' bias ' + A[k].longSwells.bias + ' median ratio ' + A[k].longSwells.medianRatio);
  }
}
module.exports = { derive };
