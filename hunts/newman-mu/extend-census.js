/* extend-census.js — the exact certified census of ONE-EXPONENT EXTENSIONS of
   every board entry.

   THE GAP THIS CLOSES. `subsets-hj.js` answered "can fewer terms hold the bar"
   completely, over all 5035 subsets of the Hare-Jankauskas witness. It could
   not answer the opposite question, because every object it looked at was a
   SUBSET of HJ. An 18-term set built by ADDING an exponent to our certified
   17-term champion is not a subset of HJ — the added exponent can be any
   integer at all — so it lies entirely outside the census box.

   That matters here specifically. The census found the landscape is NOT
   monotone: the 17-term object (HJ minus {16,22}, certified min|f| >=
   1.41414) beats the best 18-term subset (HJ minus {35}, 1.35965). Putting
   either 16 or 22 back LOWERS the minimum. So the natural question is whether
   some OTHER single exponent raises it instead — and no subset census can ask
   that.

   THE BOX, declared so the RECORD can name it: for each board entry A, every
   integer e in [-W, 2*span(A) + W] with e not already in A, giving A + {e},
   canonicalised by translation to a_0 = 0 and division by the gcd. Duplicates
   after canonicalisation are collapsed, so the count is DISTINCT OBJECTS.
   Complete over that window; an extension by an exponent outside it is not
   covered and the record says so.

   TWO BARS ARE REPORTED, and the difference between them is a defect of this
   hunt made concrete:

     bar         — the envelope as target.js computes it: ANCHORS plus ADOPTED,
                   frozen at load.
     bar_board   — what the envelope WOULD be if the board were absorbed
                   automatically.

   These were 1.856060676 and 1.999803577 apart when this file was written, and
   the gap was the defect: target.js could not learn, so its n=18 bar was Boyd's
   9-term value while this lab held a certified 1.41414 at 17 terms. The owner
   ruled on 2026-08-24 — the envelope learns by explicit adoption and freezes for
   the run — and the 17-term object was adopted, so the two now AGREE. Both are
   still printed, because two numbers that agree are evidence and one number is
   an assertion.

   usage: node hunts/newman-mu/extend-census.js [window]   (default 40) */
'use strict';

const N = require('#instruments/trigmin/newman.js');
const T = require('./target.js');
const fs = require('fs');
const path = require('path');

const W = Number(process.argv[2] || 40);

function canon(A) {
  const s = A.slice().sort((a, b) => a - b);
  const t = s.map(x => x - s[0]);
  let d = 0;
  for (const a of t) { let x = a, y = d; while (y) { const r = x % y; x = y; y = r; } d = x; }
  return d > 1 ? t.map(a => a / d) : t;
}

/* what the bar WOULD be if the board were absorbed automatically. Kept as a
   second opinion now that target.js learns by adoption: when the two agree the
   envelope is current, and when they diverge somebody owes an adoption. */
function learnedBarSq(n, board) {
  let best = T.barSq(n);
  for (const e of board) {
    const c = e.certificate;
    if (c.n < n && c.modSq[0] > best) best = c.modSq[0];
  }
  return best;
}

const board = JSON.parse(fs.readFileSync(path.join(__dirname, 'best.json'), 'utf8')).entries || [];
if (!board.length) { console.log('board is empty — nothing to extend'); process.exit(0); }

console.log('one-exponent extension census · window ±' + W);
console.log('');

const results = [];
for (const entry of board.slice().sort((a, b) => b.certificate.n - a.certificate.n)) {
  const A = entry.certificate.A;
  const n1 = A.length + 1;
  const span = A[A.length - 1];
  const barS = T.barSq(n1);
  const barL = learnedBarSq(n1, board);

  const seen = new Set();
  let count = 0, best = null, hitsStatic = 0, hitsLearned = 0, refused = 0;
  const t0 = Date.now();

  for (let e = -W; e <= 2 * span + W; e++) {
    if (A.indexOf(e) >= 0) continue;
    const B = canon(A.concat([e]));
    if (B.length !== n1) continue;
    const key = JSON.stringify(B);
    if (seen.has(key)) continue;
    seen.add(key);
    count++;
    let c;
    try { c = N.certifyNewman(B, { bar: 0 }); }
    catch (err) { refused++; continue; }
    if (c.modSq[0] > barS) hitsStatic++;
    if (c.modSq[0] > barL) hitsLearned++;
    if (!best || c.modSq[0] > best.c.modSq[0]) best = { B, c, added: e };
  }

  const ms = Date.now() - t0;
  results.push({ from: A, fromN: A.length, n: n1, count, refused, barS, barL, best, hitsStatic, hitsLearned, ms });

  console.log('extending the ' + A.length + '-term entry  [' + A.join(',') + ']');
  console.log('  distinct extensions certified   ' + count + ', ' + refused + ' REFUSED, ' + ms + ' ms');
  console.log('  best min|f|                     [' + best.c.modulus[0] + ', ' + best.c.modulus[1] + ']');
  console.log('  attained by adding              e = ' + best.added);
  console.log('  set                             [' + best.B.join(',') + ']');
  console.log('  vs bar(' + n1 + ')        = ' + Math.sqrt(barS).toFixed(12) + '   ' +
    (best.c.modSq[0] > barS ? '*** ABOVE ***' : 'below by ' + (Math.sqrt(barS) - best.c.modulus[0]).toExponential(4)));
  console.log('  vs bar_board(' + n1 + ')  = ' + Math.sqrt(barL).toFixed(12) + '   ' +
    (best.c.modSq[0] > barL ? '*** ABOVE ***' : 'below by ' + (Math.sqrt(barL) - best.c.modulus[0]).toExponential(4)));
  console.log('  extensions clearing them        ' + hitsStatic + ' (envelope), ' + hitsLearned + ' (board-implied), of ' + count);
  if (barS === barL) console.log('  the two bars AGREE — the envelope is current (adoption is up to date)');
  console.log('');
}

fs.writeFileSync(path.join(__dirname, 'results-extensions.json'), JSON.stringify({
  kind: 'certified-extension-census',
  box: 'for each board entry A, every integer e in [-' + W + ', 2*span(A)+' + W + '] not in A, '
     + 'canonicalised by translation and gcd; duplicates collapsed, so counts are DISTINCT OBJECTS',
  complete: true,
  note: 'Two bars are reported. barSq is target.js\'s envelope (ANCHORS + ADOPTED, frozen at load); '
      + 'barBoardSq is what it would be if the board were absorbed automatically. They AGREE when adoption '
      + 'is current, and two numbers that agree are evidence where one is an assertion. '
      + 'No literature gate has run on anything here.',
  windows: W,
  entries: results.map(r => ({
    fromSet: r.from, fromTerms: r.fromN, n: r.n,
    distinctExtensionsCertified: r.count, refused: r.refused,
    barSq: r.barS, barBoardSq: r.barL, barsAgree: r.barS === r.barL,
    bestSet: r.best.B, addedExponent: r.best.added,
    bestModSq: r.best.c.modSq, bestModulus: r.best.c.modulus,
    clears: r.best.c.modSq[0] > r.barS, clearsBoardImplied: r.best.c.modSq[0] > r.barL,
    hits: r.hitsStatic, hitsBoardImplied: r.hitsLearned
  }))
}, null, 1) + '\n');

console.log('--- verdict ---');
const anyStatic = results.some(r => r.hitsStatic > 0);
const anyLearned = results.some(r => r.hitsLearned > 0);
for (const r of results) {
  console.log('  ' + String(r.fromN) + ' -> ' + r.n + ' terms: ' + String(r.count).padStart(4) + ' extensions · '
    + r.hitsStatic + ' clear the envelope bar · ' + r.hitsLearned + ' clear the board-implied bar');
}
console.log('');
if (!anyStatic && !anyLearned) {
  console.log('  NO one-exponent extension of any board entry clears its bar. Complete over the');
  console.log('  declared window — a certified negative, not a failed search.');
} else {
  console.log('  An extension clears a bar. It is a certified enclosure and nothing more:');
  console.log('  no literature gate has run, and the object is one exponent from a published witness.');
}
