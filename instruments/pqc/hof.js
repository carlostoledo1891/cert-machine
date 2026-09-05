/* hof.js — the hall of fame as data. Parsed from the saved page, never refetched.
   node experiments/pqc-geometry/hof.js  → out/hof.json + the target list        */
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'data', 'halloffame.html'), 'utf8');
const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
const recs = [];
for (const r of rows) {
  const c = (r.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) || [])
    .map(x => x.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());
  if (c.length < 9) continue;
  const [pos, dim, norm, seed, who, , algo, date, ratio] = c;
  if (!/^\d+$/.test(dim)) continue;
  recs.push({ pos: +pos, n: +dim, norm: +norm, seed: +seed, who, algo, date, ratio: +ratio });
}

/* The wall is 1.05. Two things can move a verdict:
   — the published ratio being wrong (what the exact decision tests), and
   — the published NORM being rounded, worth ±½ / N in relative terms, which for
     these norms is around 1.7e-4 and therefore comparable to the whole margin.
   A record is UNDECIDABLE from published data when the rounding alone can carry
   it over the wall. */
for (const r of recs) {
  r.gap = 1.05 - r.ratio;                       // distance to the wall
  r.rounding = 0.5 / r.norm * r.ratio;          // what ±½ in the norm is worth
  r.undecidable = r.gap < r.rounding;
}
recs.sort((a, b) => a.gap - b.gap);

fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'out', 'hof.json'), JSON.stringify(recs));

if (require.main === module) {
  console.log(`${recs.length} records parsed`);
  console.log(`ratio range ${Math.min(...recs.map(r => r.ratio)).toFixed(5)} – ${Math.max(...recs.map(r => r.ratio)).toFixed(5)}`);
  console.log(`records at or above 1.05: ${recs.filter(r => r.ratio >= 1.05).length}`);
  console.log(`\nundecidable from the published norm alone (rounding can cross the wall): ${recs.filter(r => r.undecidable).length}`);
  for (const r of recs.filter(x => x.undecidable)) {
    console.log(`  dim ${String(r.n).padStart(3)}  norm ${String(r.norm).padStart(5)}  seed ${String(r.seed).padStart(5)}  ratio ${r.ratio.toFixed(5)}  gap ${r.gap.toExponential(2)}  rounding ±${r.rounding.toExponential(2)}`);
  }
  console.log('\nnearest the wall (top 12):');
  for (const r of recs.slice(0, 12)) {
    console.log(`  dim ${String(r.n).padStart(3)}  norm ${String(r.norm).padStart(5)}  seed ${String(r.seed).padStart(5)}  ratio ${r.ratio.toFixed(5)}  gap ${r.gap.toExponential(2)}${r.undecidable ? '   UNDECIDABLE' : ''}`);
  }
  const byDim = {};
  for (const r of recs) if (!byDim[r.n] || r.ratio > byDim[r.n].ratio) byDim[r.n] = r;
  const dims = Object.keys(byDim).map(Number).sort((a, b) => a - b);
  console.log(`\ndimensions present: ${dims.length}, from ${dims[0]} to ${dims[dims.length - 1]}`);
}
module.exports = { recs };
