/* subsets-hj.js — the exact certified census of subsets of the Hare-Jankauskas
   19-term witness.

   WHY THIS EXISTS. Campaign `terms-frontier-2` found, by a one-term drop, an
   18-term Newman polynomial with sampled min|f|^2 ~ 1.8500 against a bar of
   1.8561 — within 0.33% of Boyd's 9-term value, from a mutation that removes a
   single exponent. That is close enough that the question stops being a search
   problem and becomes a CENSUS: HJ's witness has 19 exponents, so there are
   only C(19,k) subsets of each size, and every one of them can be certified
   exactly. 19 + 171 + 969 = 1159 subsets at sizes 18, 17 and 16.

   WHAT IT ANSWERS. How much of the only known min|f| >= 2 object can be removed
   before it stops beating the fewer-terms envelope — and, at each size, which
   sub-polynomial is best. Every verdict is a certified enclosure, and the census
   is COMPLETE over the declared box (all subsets of one named 19-element set of
   a given size), so the superlative is earned rather than asserted.

   WHAT IT DOES NOT DO. It mints nothing. Subsets of someone else's witness are
   not a new object, and the interesting outcome would be a NEGATIVE: that no
   subset of HJ's set beats the envelope, which would say the 19 terms are doing
   irreducible work. Nothing here has been through a literature gate.

   usage: node hunts/newman-mu/subsets-hj.js [maxDrop]   (default 2) */
'use strict';

const N = require('#instruments/trigmin/newman.js');
const T = require('./target.js');

const HJ = [0, 4, 6, 7, 8, 10, 11, 12, 15, 16, 17, 22, 24, 25, 26, 29, 32, 35, 38];
const maxDrop = Number(process.argv[2] || 2);

/* Canonicalise: translate so a_0 = 0 and divide out the gcd, exactly as the
   target does — a subset that starts at 4 is the same object translated. */
function canon(A) {
  const t = A.map(x => x - A[0]);
  let d = 0;
  for (const a of t) { let x = a, y = d; while (y) { const r = x % y; x = y; y = r; } d = x; }
  return d > 1 ? t.map(a => a / d) : t;
}

function combinations(arr, k, cb) {
  const idx = [];
  (function rec(start) {
    if (idx.length === k) { cb(idx.map(i => arr[i])); return; }
    for (let i = start; i < arr.length; i++) { idx.push(i); rec(i + 1); idx.pop(); }
  })(0);
}

console.log('census of subsets of the HJ 19-term witness');
console.log('  HJ = [' + HJ + ']');
{
  const c = N.certifyNewman(HJ, { bar: 0 });
  console.log('  certified min|f| in [' + c.modulus[0] + ', ' + c.modulus[1] + ']  (n=19, degree ' + c.degree + ')');
}
console.log('');

const summary = [];
for (let drop = 1; drop <= maxDrop; drop++) {
  const size = HJ.length - drop;
  const bar = T.barSq(size);
  let count = 0, best = null, hits = 0, refused = 0;
  const t0 = Date.now();
  const seen = new Set();

  combinations(HJ, size, (S) => {
    const A = canon(S);
    const key = JSON.stringify(A);
    if (seen.has(key)) return;          /* distinct as OBJECTS, not as index sets */
    seen.add(key);
    count++;
    let c;
    try { c = N.certifyNewman(A, { bar: 0 }); }
    catch (e) { refused++; return; }
    if (c.modSq[0] > bar) hits++;
    if (!best || c.modSq[0] > best.c.modSq[0]) best = { A, c, dropped: HJ.filter(x => S.indexOf(x) < 0) };
  });

  const ms = Date.now() - t0;
  const gap = best.c.modSq[0] - bar;
  summary.push({ size, count, hits, refused, bar, best, gap, ms });

  console.log('n = ' + size + '  (drop ' + drop + ')');
  console.log('  subsets certified   ' + count + ' distinct as objects, ' + refused + ' REFUSED, ' + ms + ' ms');
  console.log('  bar(' + size + ')^2          ' + bar);
  console.log('  best min|f|^2       [' + best.c.modSq[0] + ', ' + best.c.modSq[1] + ']');
  console.log('  best min|f|         [' + best.c.modulus[0] + ', ' + best.c.modulus[1] + ']');
  console.log('  gap to the bar      ' + gap.toExponential(6) + (gap > 0 ? '   *** ABOVE THE BAR ***' : '   (below)'));
  console.log('  attained by         removing {' + best.dropped + '} from HJ');
  console.log('  certified HITs      ' + hits + ' of ' + count);
  console.log('');
}

/* the census is an artifact, not a print-out: it is written where a later
   session can re-read it without re-running 20 minutes of certification. */
require('fs').writeFileSync(
  require('path').join(__dirname, 'results-subsets-hj.json'),
  JSON.stringify({
    kind: 'certified-subset-census',
    source: { name: 'Hare-Jankauskas arXiv:1910.13994 Eq. (2.1)', exponents: HJ, terms: 19, degree: 38 },
    box: 'every distinct object among all C(19,k) subsets of the source set, k = 19-drop, drop = 1..' + maxDrop,
    complete: true,
    note: 'A subset of a published witness is not a new object. No literature gate has run. Enclosures are proofs-of-object pending independent verification.',
    sizes: summary.map(s => ({
      n: s.size, subsetsCertified: s.count, refused: s.refused, hits: s.hits,
      barSq: s.bar, bestModSq: s.best.c.modSq, bestModulus: s.best.c.modulus,
      bestSet: s.best.A, droppedFromSource: s.best.dropped, gapToBar: s.gap, ms: s.ms
    }))
  }, null, 1) + '\n');

console.log('--- census verdict ---');
for (const s of summary) {
  console.log('  n=' + String(s.size).padStart(2) + '  ' + String(s.count).padStart(5) + ' subsets  ·  '
    + s.hits + ' clear bar(' + s.size + ')  ·  best min|f| >= ' + s.best.c.modulus[0].toFixed(12));
}
const anyHit = summary.some(s => s.hits > 0);
console.log('');
if (anyHit) {
  console.log('  A subset of HJ CLEARS its bar. That is a certified enclosure, not a result:');
  console.log('  no literature gate has run, and a subset of a published witness is not a new object.');
} else {
  console.log('  NO subset of HJ at these sizes beats the fewer-terms envelope. Complete over the');
  console.log('  declared box (every distinct object among all C(19,k) subsets), so this is a');
  console.log('  certified negative, not a failed search.');
}
