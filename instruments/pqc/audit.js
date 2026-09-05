/* audit.js — decide every record we hold a determinant for, exactly.
 *   node experiments/pqc-geometry/audit.js
 *
 * For each record: the published ratio ‖v‖/GH is a six-figure float with no
 * error bound. The exact ratio is computed by bisecting the acceptance factor
 * with an exact predicate, so it inherits the proof and needs no n-th root.
 * The question is whether the published figure is right in the digits it prints,
 * and whether the record clears 1.05·GH once the rounding of the published norm
 * is taken seriously. */
'use strict';
const fs = require('fs');
const path = require('path');
const { decide, ratioBracket, toDecimal } = require('./gh.js');
const { recs } = require('./hof.js');

const dets = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'dets.json'), 'utf8'));
const have = r => dets[`${r.n}:${r.seed}`] && dets[`${r.n}:${r.seed}`].ok;
const targets = recs.filter(have);

const dec = (num, den, p) => toDecimal(num, den, p);
const num = (num, den) => Number(toDecimal(num, den, 12));

/* THE COMPARISON HAS TO ACCOUNT FOR THE ROUNDING, or it reports a discrepancy
   that is entirely our own doing. The hall of fame prints the norm as a whole
   number; whoever computed the ratio used the true norm, which we do not have.
   So the published ratio must be tested for CONSISTENCY with some true norm that
   displays as N — not for equality with the ratio at N exactly. Half a unit of
   norm is worth about 1.7e-4 in ratio here, which is the scale of every apparent
   disagreement, so this distinction decides the entire result. */
const out = [];
console.log(`auditing ${targets.length} records against proved determinants\n`);
console.log('  dim  seed   norm  published   ratio at N     consistent window            verdict');
console.log('  ' + '-'.repeat(94));

for (const r of targets) {
  const q = BigInt(dets[`${r.n}:${r.seed}`].q);
  const t0 = Date.now();
  const N = BigInt(r.norm);
  const at = (nsNum, nsDen) => { const b = ratioBracket(r.n, q, nsNum, nsDen); return { lo: num(b.loNum, b.den), hi: num(b.hiNum, b.den), s: dec(b.loNum, b.den, 9) }; };
  const rN = at(N * N, 1n);
  const rLo = at((2n * N - 1n) ** 2n, 4n);        // ‖v‖ = N − ½
  const rHi = at((2n * N + 1n) ** 2n, 4n);        // ‖v‖ = N + ½
  const rUp = at((N + 1n) ** 2n, 1n);             // ‖v‖ = N + 1  (truncation hypothesis)
  const eps = 5e-6;                                // the published figure is itself 5 dp
  const roundOK = r.ratio >= rLo.lo - eps && r.ratio <= rHi.hi + eps;
  const truncOK = r.ratio >= rN.lo - eps && r.ratio <= rUp.hi + eps;
  const vN = decide(r.n, q, N * N, 1n);
  const vHi = decide(r.n, q, (2n * N + 1n) ** 2n, 4n);
  out.push({ ...r, atN: rN.s, window: [rLo.s, rHi.s], roundOK, truncOK, vN, vHi, ms: Date.now() - t0 });
  const tag = roundOK ? 'consistent' : (truncOK ? 'trunc only' : 'INCONSISTENT');
  console.log(`  ${String(r.n).padStart(3)} ${String(r.seed).padStart(5)} ${String(r.norm).padStart(6)}  ${r.ratio.toFixed(5)}   ${rN.s.padEnd(12)}  [${rLo.s}, ${rHi.s}]  ${tag.padEnd(13)} ${vN === 'ADMISSIBLE' && vHi !== 'ADMISSIBLE' ? 'needs N exactly' : ''}`);
}

fs.writeFileSync(path.join(__dirname, 'out', 'audit.json'), JSON.stringify(out, null, 1));
const bad = out.filter(o => !o.roundOK && !o.truncOK);
const flip = out.filter(o => o.vN === 'ADMISSIBLE' && o.vHi !== 'ADMISSIBLE');
console.log(`\n  ${out.length} decided`);
console.log(`  ${out.filter(o => o.roundOK).length} published ratios consistent with a true norm that rounds to the printed one`);
console.log(`  ${bad.length} inconsistent with any true norm consistent with the printed figure`);
console.log(`  ${flip.length} whose admissibility depends on the true norm not exceeding the printed one`);
if (bad.length) for (const b of bad) console.log(`    dim ${b.n} seed ${b.seed} norm ${b.norm}: published ${b.published}, window [${b.window[0]}, ${b.window[1]}]`);
if (flip.length) for (const f of flip) console.log(`    dim ${f.n} seed ${f.seed} norm ${f.norm}: ${f.vN} at N, ${f.vHi} at N+1/2`);
console.log(`  slowest record ${Math.max(...out.map(o => o.ms))} ms`);
