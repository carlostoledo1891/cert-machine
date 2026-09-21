#!/usr/bin/env node
/* run-hseva-ledger.js — the return-level table as a certificate, on the
   benchmark's three NDBC buoys. Writes certs/hseva-ledger.json.

   For each buoy (A, B, C: 20-odd years of hourly Hs, pinned in
   corpus/ec-benchmark) and each block size (hourly, daily, monthly, annual
   maxima), five families are fitted by maximum likelihood and each fit is
   CERTIFIED — the Krawczyk operator proves a box around the candidate holds
   exactly one zero of the score — then the Anderson–Darling statistic and
   the 10-, 50- and 100-year return levels are enclosed over the box, and the
   family the statistic prefers is DECIDED or REFUSED.

   usage: node tools/run-hseva-ledger.js            (a few minutes: the hourly series are 175,320 points)
          node tools/run-hseva-ledger.js --check    re-derive and compare with the shipped ledger, write nothing
          node tools/run-hseva-ledger.js --quick    blocks daily/monthly/annual only (the battery's live run) */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BL = require(path.join(ROOT, 'instruments', 'hseva', 'blocks.js'));
const FT = require(path.join(ROOT, 'instruments', 'hseva', 'fit.js'));
const EL = require(path.join(ROOT, 'instruments', 'ecbench', 'lib.js'));
const die = (m) => { console.error('HSEVA LEDGER REFUSED: ' + m); process.exit(1); };
const CHECK = process.argv.includes('--check'), QUICK = process.argv.includes('--quick');
const OUT = path.join(ROOT, 'certs', 'hseva-ledger.json');
const FAMS = ['exponential', 'normal', 'lognormal', 'weibull', 'expweibull'];
const BLOCKS = QUICK ? ['daily', 'monthly', 'annual'] : ['hourly', 'daily', 'monthly', 'annual'];
const T = [10, 50, 100];

EL.ensureCorpus();
const t0 = Date.now();
const fmt = (v, d) => Number(v).toFixed(d);
const buoys = {};
for (const b of Object.keys(BL.BUOYS)) {
  const S = BL.series(b);
  const blocks = {};
  for (const blk of BLOCKS) {
    const BM = BL.blockMaxima(S, blk);
    const fits = {};
    const entries = [];
    for (const f of FAMS) {
      const tf = Date.now();
      const c = FT.certify(f, BM.x);
      if (!c.ok) { fits[f] = { certified: false, why: c.why, candidate: c.theta ? c.theta.map((v) => fmt(v, 6)) : null }; entries.push({ family: f }); continue; }
      const ad = FT.andersonDarling(c);
      const rl = {}; for (const yr of T) { const v = FT.returnLevel(c, yr, BM.hours); rl[yr] = v ? { lo: fmt(v[0], 4), hi: fmt(v[1], 4) } : null; }
      fits[f] = { certified: true, names: c.names, theta: c.theta.map((v) => fmt(v, 8)), box: c.box.map((iv) => [fmt(iv[0], 10), fmt(iv[1], 10)]), maxRad: c.maxRad.toExponential(3), rounds: c.rounds, newtonIters: c.newtonIters, ad: { lo: fmt(ad[0], 6), hi: fmt(ad[1], 6) }, returnLevel: rl, seconds: Number(((Date.now() - tf) / 1000).toFixed(2)) };
      entries.push({ family: f, ad });
    }
    const rk = FT.rank(entries);
    blocks[blk] = { hours: BM.hours, n: BM.n, max: fmt(BM.x.reduce((a, v) => (v > a ? v : a), 0), 4), fits, ranking: rk };
    console.log('  ' + b + ' ' + blk.padEnd(8) + ' n ' + String(BM.n).padStart(6) + '  ' + FAMS.map((f) => f.slice(0, 6) + ' ' + (fits[f].certified ? fits[f].ad.hi : 'REFUSED')).join(' · ') + '  → ' + rk.verdict + (rk.best ? ' ' + rk.best : '') + (rk.tied ? ' (tied: ' + rk.tied.join(', ') + ')' : ''));
  }
  buoys[b] = { files: S.files, n: S.n, dropped: S.dropped, years: S.years, blocks };
}
const ledger = {
  what: 'Five distribution families for significant wave height (exponential, normal, lognormal, Weibull, exponentiated Weibull) fitted by maximum likelihood to the hourly series and to the daily, monthly and annual maxima of NDBC buoys A, B and C of the environmental-contour benchmark (corpus/ec-benchmark, provided and retained years together); every fit certified by the Krawczyk operator as the unique zero of the score in a box; the Anderson–Darling statistic and the 10-, 50- and 100-year return levels enclosed over the box; the family the statistic prefers DECIDED where the enclosures separate and REFUSED where they overlap. The method of Reis, Guimarães, Farina, Paul, de Paula, Ribeiro (Ocean Eng. 359, 2026, 125841) on public data with each step certified; the generalized gamma of their six is not fitted (no certified digamma yet).',
  generated: new Date().toISOString().slice(0, 10),
  conventions: { hoursPerYear: 8766, returnLevel: 'F⁻¹(1 − b/(T·8766)) for a block of b hours; null when fewer than one block falls in the return period', ad: 'A² = −n − (1/n) Σ (2i−1)[ln F(x_(i)) + ln(1 − F(x_(n+1−i)))] on the sorted data, each F an enclosure over the parameter box', verdict: 'DECIDED when the smallest A² enclosure lies wholly below every other; REFUSED otherwise, naming the overlapping families', certificate: 'Krawczyk (instruments/interval/radii.js) on the score equations over the interval data; the box is the certificate; a family with no finite maximum, or whose box does not contract, is REFUSED and says why', data: 'each hourly literal enclosed by its neighbouring doubles; a block maximum is the largest literal in the calendar block' },
  families: FAMS, blocks: BLOCKS, returnPeriods: T, quick: QUICK,
  buoys,
  seconds: Number(((Date.now() - t0) / 1000).toFixed(1)),
};
console.log('  ' + ledger.seconds + ' s');
if (CHECK) {
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const strip = (x) => { const y = JSON.parse(JSON.stringify(x)); delete y.generated; delete y.seconds; for (const b of Object.values(y.buoys)) for (const blk of Object.values(b.blocks)) for (const f of Object.values(blk.fits)) delete f.seconds; return JSON.stringify(y); };
  if (QUICK) { for (const b of Object.values(old.buoys)) delete b.blocks.hourly; old.blocks = BLOCKS; old.quick = true; }
  if (strip(old) !== strip(ledger)) die('the re-derived ledger differs from certs/hseva-ledger.json');
  console.log('  --check: the shipped ledger re-derives identically' + (QUICK ? ' (quick: without the hourly blocks)' : ''));
} else if (QUICK) {
  console.log('  --quick: nothing written');
} else {
  fs.writeFileSync(OUT, JSON.stringify(ledger, null, 1) + '\n');
  console.log('  certs/hseva-ledger.json written');
}
