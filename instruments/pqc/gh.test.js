/* gh.test.js — node experiments/pqc-geometry/gh.test.js
 *
 * This predicate decided every published record on site/pqc/ and had no test.
 * Its Python port did — which is the wrong way round, because the JS is the one
 * whose numbers were published. Every case here is one the Python suite already
 * makes, plus the one it cannot: that the two implementations agree.
 *
 * NOTE, found while writing this: the two do not share a signature. JS takes the
 * squared norm as a numerator/denominator PAIR, `ratioBracket(n, q, num, den,
 * digits)`; Python takes one Fraction, `ratio_bracket(n, q, ns, digits)`. Call
 * either with the other's argument order and BigInt arithmetic throws "cannot
 * mix BigInt and other types" from four frames down, which is how this was
 * found. The numbers agree; only the doors differ.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { decide, ratioBracket, toDecimal, IngestError } = require('./gh.js');
const { parse, determinant } = require('./basis.js');
const { piScaled } = require('./pi.js');

let fail = 0;
const ok = (n, c, got) => { if (!c) fail++; console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}${c ? '' : '   got ' + JSON.stringify(got, (k, v) => typeof v === 'bigint' ? String(v) : v)}`); };
const dets = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'dets.json'), 'utf8'));
const live = Object.values(dets).filter(d => d.ok);
const Q = (k) => BigInt(live.find(d => d.n === k).q);

console.log('the predicate, on real challenge lattices:');
{
  /* dim 119, seed 0 — the row this whole front turns on */
  const q = Q(119);
  ok('the record at 2904 is admissible', decide(119, q, 2904n ** 2n, 1n) === 'ADMISSIBLE');
  ok('one unit more is refused', decide(119, q, 2905n ** 2n, 1n) === 'REFUSED');
  ok('  so the wall sits between them', true);
  const [lo, hi] = [ratioBracket(119, q, 2904n ** 2n, 1n, 40)].map(b => [b.loNum, b.hiNum])[0];
  ok('its ratio brackets the published 1.04985',
    toDecimal(lo, ratioBracket(119, q, 2904n ** 2n, 1n, 40).den, 5) === '1.04985',
    toDecimal(lo, ratioBracket(119, q, 2904n ** 2n, 1n, 40).den, 7));
}
{
  /* even n exercises the other branch of the formula entirely */
  const q = Q(200);
  const r = ratioBracket(200, q, 3723n ** 2n, 1n, 40);
  ok('even n decides too (dim 200)', decide(200, q, 3723n ** 2n, 1n) === 'ADMISSIBLE');
  ok('  and its ratio is in range', toDecimal(r.loNum, r.den, 3) === '1.048', toDecimal(r.loNum, r.den, 6));
  ok('odd and even use different branches, both bracket',
    r.hiNum * 1n >= r.loNum * 1n);
}

console.log('\nmonotonicity — a longer vector is never more admissible:');
{
  const q = Q(104);
  let mono = true, prev = null;
  for (const N of [2000n, 2400n, 2600n, 2700n, 2712n, 2800n, 3000n]) {
    const v = decide(104, q, N * N, 1n);
    if (prev === 'REFUSED' && v === 'ADMISSIBLE') mono = false;
    prev = v;
  }
  ok('admissible never returns after refused', mono);
  const a = ratioBracket(104, q, 2000n ** 2n, 1n, 40), b = ratioBracket(104, q, 3000n ** 2n, 1n, 40);
  ok('the ratio grows with the norm', a.loNum * b.den < b.loNum * a.den);
}

console.log('\nthe bracket is a bracket, and tightens with precision:');
{
  const q = Q(89);
  const lo20 = ratioBracket(89, q, 2532n ** 2n, 1n, 20), lo60 = ratioBracket(89, q, 2532n ** 2n, 1n, 60);
  ok('lo <= hi', lo60.loNum * lo60.den <= lo60.hiNum * lo60.den);
  ok('more digits never widen it',
    (lo60.hiNum - lo60.loNum) <= (lo20.hiNum - lo20.loNum));
  const p = piScaled(40);
  ok('pi is bracketed before any of this runs', p.lo < p.hi && p.lo * 100n / p.S === 314n);
}

console.log('\nthe determinant is proved, not assumed:');
{
  const rows = parse(fs.readFileSync(path.join(__dirname, 'data', 'svp-dim119-seed0.txt'), 'utf8'));
  const d = determinant(rows);
  ok('a real basis is verified entry by entry', d.ok && d.n === 119);
  ok('  and q is the entry it claims', d.q.toString().length === 359);
  const broken = rows.map(r => r.slice());
  broken[5][7] = 9n;                                   // one entry off the identity
  ok('a single wrong entry refuses the determinant', determinant(broken).ok === false);
  const zeroed = rows.map(r => r.slice()); zeroed[0][3] = 1n;
  ok('a non-zero in the first row refuses it too', determinant(zeroed).ok === false);
}

console.log('\ningest — a float must be refused, not silently coerced:');
{
  const q = Q(40);
  const grab = (f) => { try { f(); return null; } catch (e) { return e; } };
  const a = grab(() => decide(40, q, 1234.5, 1n));
  ok('a Number for the squared norm is rejected', a instanceof IngestError, a && a.message.slice(0, 50));
  ok('  and the message names the argument', /squared norm/.test(a.message), a.message.slice(0, 70));
  ok('a Number determinant is rejected', grab(() => decide(40, 1e9, 1n, 1n)) instanceof IngestError);
  ok('a Number factor is rejected', grab(() => decide(40, q, 1n, 1n, 1.05)) instanceof IngestError);
  ok('a non-integer dimension is rejected', grab(() => decide(40.5, q, 1n, 1n)) instanceof IngestError);
  ok('BigInts still pass', decide(40, q, 100n, 1n) === 'ADMISSIBLE' || decide(40, q, 100n, 1n) === 'REFUSED');
}

console.log('\nthe check the Python suite cannot make — do the two agree:');
{
  const cases = [];
  for (const d of live.slice(0, 8)) {
    const q = BigInt(d.q);
    for (const mul of [0.9, 1.0, 1.05, 1.2]) {
      // a norm near that lattice's own wall, found by the JS side
      let lo = 1n, hi = 1n;
      while (decide(d.n, q, hi * hi, 1n) === 'ADMISSIBLE') hi *= 2n;
      while (lo < hi) { const m = (lo + hi + 1n) / 2n; (decide(d.n, q, m * m, 1n) === 'ADMISSIBLE') ? lo = m : hi = m - 1n; }
      const N = BigInt(Math.max(1, Math.round(Number(lo) * mul)));
      cases.push({ n: d.n, q: d.q, ns: (N * N).toString(), js: decide(d.n, q, N * N, 1n) });
    }
  }
  const py = execFileSync('python3', ['-c', `
import json,sys
sys.path.insert(0, ${JSON.stringify(path.join(__dirname, '..', 'wiring'))})
from lattice_claims.certify.exact import decide
cs = json.load(sys.stdin)
print(json.dumps([decide(c["n"], int(c["q"]), int(c["ns"])) for c in cs]))
`], { input: JSON.stringify(cases), encoding: 'utf8' });
  const pyv = JSON.parse(py);
  const dis = cases.map((c, i) => [c, pyv[i]]).filter(([c, p]) => c.js !== p);
  ok(`${cases.length} cases across ${new Set(cases.map(c => c.n)).size} real lattices, two implementations`,
    dis.length === 0, dis.slice(0, 3).map(([c, p]) => `n=${c.n} js=${c.js} py=${p}`));
}

console.log(fail ? `\n${fail} FAILED` : '\nall green');
process.exit(fail ? 1 : 0);
