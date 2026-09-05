/**
 * replay.mjs — a shipped theorem, re-derived through the graph.
 *
 * TERRA's certified sigma-band is 39 closed cells on disk, each carrying its own
 * Y0, Z1, Z2 and the radius r that was accepted. This reads that record and
 * pushes every cell back through the radii node, so the certificate re-derives
 * itself rather than being quoted. Disagreement is the headline, not the pass
 * rate — a replay that agrees 39 times says something; a replay that reports
 * "39 certified" says nothing at all.
 *
 * node replay.mjs            re-derive every cell
 * node replay.mjs --reds     and then break it on purpose
 */
import { createRequire } from 'node:module';
import { CERTIFIED, REFUSED, graph } from './graph.mjs';
import { hyp, ivl } from './port.mjs';
import { radiiNode } from './nodes.mjs';

const require = createRequire(import.meta.url);
const BAND = require('../../playground/plates/data/band-sigma-0.0008-0.008.json');

const cells = BAND.cells.filter(c => c.ok);
console.log(`TERRA sigma-band: ${BAND.cells.length} cells on disk, ${cells.length} certified, N = ${BAND.N}`);

let agree = 0, disagree = 0, refusedN = 0;
const rel = [];
for (const c of cells) {
  const H = hyp({ instrument: 'TERRA congestion MFG', N: BAND.N, sigma: c.sig, gamma: '1/100', A1: '3/1000', A2: '3/5000' });
  const g = graph('cell').add(radiiNode({ id: 'p' }));
  g.push('p', 'Y0', ivl(c.Y0, c.Y0, H));
  g.push('p', 'Z1', ivl(c.Z1, c.Z1, H));
  const out = g.push('p', 'Z2', ivl(c.Z2, c.Z2, H)).fired[0];
  if (out.port !== CERTIFIED) { refusedN++; console.log(`  REFUSED at sigma ${c.sig[0]}: ${out.note}`); continue; }
  const r = out.value.datum.lo;
  const d = Math.abs(r - c.r) / c.r;
  rel.push(d);
  if (d < 1e-12) agree++; else { disagree++; console.log(`  DISAGREE at sigma ${c.sig[0]}: replay ${r.toExponential(6)} vs stored ${c.r.toExponential(6)} (rel ${d.toExponential(2)})`); }
}
console.log(`\nre-derived ${agree} cells identically, ${disagree} disagreed, ${refusedN} refused`);
console.log(`worst relative difference: ${rel.length ? Math.max(...rel).toExponential(2) : 'n/a'}`);

if (process.argv.includes('--reds')) {
  console.log('\nnow break it on purpose:');
  const c = cells[0];
  const H = hyp({ instrument: 'TERRA congestion MFG', N: BAND.N, sigma: c.sig });
  const run = (Y0, Z1, Z2, what) => {
    const g = graph('x').add(radiiNode({ id: 'p' }));
    g.push('p', 'Y0', ivl(Y0, Y0, H)); g.push('p', 'Z1', ivl(Z1, Z1, H));
    const o = g.push('p', 'Z2', ivl(Z2, Z2, H)).fired[0];
    console.log(`  ${what.padEnd(46)} ${o.port}${o.port === REFUSED ? ' — ' + o.note : ''}`);
    return o;
  };
  run(c.Y0, 1.0000001, c.Z2, 'Z1 pushed past 1 (no contraction anywhere)');
  run(c.Y0 * 1e12, c.Z1, c.Z2, 'defect inflated by 1e12 (discriminant dies)');
  const a = run(c.Y0, c.Z1, c.Z2, 'untouched');
  const b = run(c.Y0 * 10, c.Z1, c.Z2, 'defect x10 — the radius may only grow');
  const grew = b.value.datum.lo >= a.value.datum.lo;
  console.log(`  monotone in the defect: ${grew ? 'HELD' : '**VIOLATED**'} (${a.value.datum.lo.toExponential(3)} -> ${b.value.datum.lo.toExponential(3)})`);
  console.log('\n  and the port that can never fire:');
  console.log('  the radii polynomial has a REFUTED output that no input reaches. Failing to');
  console.log('  contract is not evidence that no solution exists. The graph draws that port');
  console.log('  dark, which is the honest picture of a one-sided method.');
}
