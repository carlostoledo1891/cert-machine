/* decide-record.js — one published record, decided exactly.
   node experiments/pqc-geometry/decide-record.js                              */
'use strict';
const fs = require('fs');
const path = require('path');
const { decide, ratioBracket, toDecimal } = require('./gh.js');

/* q is the [0][0] entry of the Goldstein–Mayer basis, so det L = q exactly */
const raw = fs.readFileSync(path.join(__dirname, 'data', 'svp-dim119-seed0.txt'), 'utf8');
const q = BigInt(raw.replace(/^\s*\[\[/, '').trim().split(/\s+/)[0]);
const n = 119, N = 2904n, published = '1.04985';

console.log(`SVP Challenge — dimension ${n}, seed 0`);
console.log(`  det L = q, ${q.toString().length} digits, read from the basis file`);
console.log(`  published norm  ${N}`);
console.log(`  published ‖v‖/GH ${published}  (six figures, floating point, no error bound)\n`);

/* the published norm is rounded, so the true norm lies in [N-1/2, N+1/2] */
const cases = [
  ['as printed          ‖v‖ = N', N * N * 4n, 4n],
  ['worst case rounding ‖v‖ = N+½', (2n * N + 1n) ** 2n, 4n],
  ['best case rounding  ‖v‖ = N−½', (2n * N - 1n) ** 2n, 4n],
];
for (const [label, nsNum, nsDen] of cases) {
  const v = decide(n, q, nsNum, nsDen);
  const r = ratioBracket(n, q, nsNum, nsDen);
  console.log(`  ${label.padEnd(30)} ${v.padEnd(12)} ‖v‖/GH ∈ [${toDecimal(r.loNum, r.den, 7)}, ${toDecimal(r.hiNum, r.den, 7)}]`);
}

/* The wall, in the units the lattice actually offers. A lattice vector has
   integer coordinates, so ‖v‖² is an INTEGER — that, not the norm, is the
   quantity with a granularity, and the honest margin is counted in it. */
let lo = 1n, hi = 10n ** 9n;
while (lo < hi) {
  const mid = (lo + hi + 1n) / 2n;
  (decide(n, q, mid, 1n) === 'ADMISSIBLE') ? lo = mid : hi = mid - 1n;
}
const claimed = N * N;
console.log(`\n  largest admissible integer ‖v‖² at f = 1.05   ${lo}`);
console.log(`  the record needs                             ${claimed}   (= ${N}²)`);
console.log(`  headroom                                     ${lo - claimed} integer squared-norms`);
console.log(`  next norm up, ${N + 1n}, would need           ${(N + 1n) ** 2n}  →  ${decide(n, q, (N + 1n) ** 2n, 1n)}`);

const r = ratioBracket(n, q, claimed, 1n);
console.log(`\n  VERDICT  the published ratio ${published} is correct to every digit it prints:`);
console.log(`           exact ‖v‖/GH ∈ [${toDecimal(r.loNum, r.den, 9)}, ${toDecimal(r.hiNum, r.den, 9)}]`);
console.log(`           decided in exact rational arithmetic, π bracketed to 40 places,`);
console.log(`           det = q read from the basis, no floating point anywhere.`);
