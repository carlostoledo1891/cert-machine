#!/usr/bin/env node
/* compare-hseva-ledgers.js — "no certified result lost": the working tree's certs/hseva-atlas.json and certs/hseva-ledger.json
   against the same files at a git ref (default HEAD), before a re-run is committed. The paper's six — every fit record,
   the rankings, the threshold fitter, the block sizes and maxima — must come back byte-identical unless the change was
   meant to move them; a fit certified before and refused now is LOST and fails the run. New fields (the GEV, `seven`,
   `stat`) are not compared. Written 2026-09-28 for the A7 re-run (0 lost of 40,778 and of 353).
   usage: node tools/compare-hseva-ledgers.js [ref]      exit 1 when anything certified was lost */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..'), REF = process.argv[2] || 'HEAD';
const old = (rel) => JSON.parse(cp.execSync('git show ' + REF + ':' + rel, { cwd: ROOT, maxBuffer: 1 << 30 }).toString());
const now = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const strip = (x) => JSON.stringify(x, (k, v) => (k === 'seconds' ? undefined : v));
let lostAll = 0;
{
  const O = old('certs/hseva-atlas.json'), N = now('certs/hseva-atlas.json'), nm = new Map(N.cells.map((c) => [c.id, c]));
  let same = 0, lost = 0, gained = 0, cert = 0; const diff = [];
  for (const c of O.cells) {
    const n = nm.get(c.id); if (!n) { diff.push(c.id + ' missing'); continue; }
    for (const blk of Object.keys(c.blocks)) {
      const a = c.blocks[blk], b = n.blocks[blk];
      for (const f of Object.keys(a.fits)) { if (a.fits[f].c) { cert++; if (!b.fits[f].c) lost++; } else if (b.fits[f].c) gained++; if (JSON.stringify(a.fits[f]) === JSON.stringify(b.fits[f])) same++; else diff.push(c.id + ' ' + blk + ' ' + f); }
      for (const k of ['rank', 'naive', 'n', 'h', 'max']) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) diff.push(c.id + ' ' + blk + ' ' + k);
    }
  }
  lostAll += lost;
  console.log('atlas: ' + O.cells.length + ' cells; six-family fits identical ' + same + ', differing ' + diff.length + '; certified at ' + REF + ' ' + cert + ', lost ' + lost + ', newly certified ' + gained + (diff.length ? '\n  ' + diff.slice(0, 40).join('\n  ') : ''));
}
{
  const O = old('certs/hseva-ledger.json'), N = now('certs/hseva-ledger.json');
  let same = 0, lost = 0, cert = 0; const diff = [];
  const walk = (label, A, B) => { for (const blk of Object.keys(A.blocks)) { const a = A.blocks[blk], b = B.blocks[blk];
    for (const f of Object.keys(a.fits)) { if (a.fits[f].certified) { cert++; if (!b.fits[f].certified) lost++; } if (strip(a.fits[f]) === strip(b.fits[f])) same++; else diff.push(label + ' ' + blk + ' ' + f); }
    if (strip(a.rankings) !== strip(b.rankings)) diff.push(label + ' ' + blk + ' rankings'); } };
  for (const b of Object.keys(O.buoys)) walk('buoy ' + b, O.buoys[b], N.buoys[b]);
  if (O.ww3) for (const p of Object.keys(O.ww3.points)) walk(p, O.ww3.points[p], N.ww3.points[p]);
  for (const k of ['printed', 'scipy', 'findings']) if (strip(O[k]) !== strip(N[k])) diff.push('section ' + k);
  lostAll += lost;
  console.log('report ledger: six-family fits identical ' + same + ', differing ' + diff.length + '; certified at ' + REF + ' ' + cert + ', lost ' + lost + (diff.length ? '\n  ' + diff.slice(0, 40).join('\n  ') : ''));
}
process.exit(lostAll ? 1 : 0);
