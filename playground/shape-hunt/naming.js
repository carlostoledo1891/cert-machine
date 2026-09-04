/* naming.js — say what the group element IS.

   The symmetry test reports the permutation it recovered by its index inside a
   generated list: "reflection 9", "reflection 11", "reflection 7". Those are
   three labels and one fact. On ten ordered items, i -> 9 - i; on twelve,
   i -> 11 - i; on eight, i -> 7 - i. Every one of them is REVERSE THE SEQUENCE,
   which is the only symmetry a line has — and the index hides it, so a result
   found three times reads as three different results.

   So each element gets named twice: in words, with the items it actually moves,
   and by a CANONICAL KEY that survives a change of n. Then agreement can be
   counted.

   THE ONE DISTINCTION THAT MATTERS. i -> r - i is taken modulo n. It is a plain
   reversal of the list only when r = n - 1, where no index wraps; every other
   reflection joins the two ends of the list and is a symmetry a RING has and a
   line does not. That is the difference between "these items are ordered" and
   "these items are ordered in a circle", and it is decidable by looking.
*/
'use strict';

const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };
const nm = (items, i) => String(items[i]);

/* the cycle decomposition, as index lists */
function cycles(perm) {
  const n = perm.length, seen = Array(n).fill(false), out = [];
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    const c = [];
    let j = i;
    while (!seen[j]) { seen[j] = true; c.push(j); j = perm[j]; }
    out.push(c);
  }
  return out;
}
const orderOf = (perm) => cycles(perm).reduce((a, c) => (a * c.length) / gcd(a, c.length), 1);

/* parse the generated label back into its arithmetic, then say it in English */
function describe(kind, perm, items, shape) {
  const n = perm.length;
  const cyc = cycles(perm);
  const moved = perm.filter((p, i) => p !== i).length;
  const fixed = perm.map((p, i) => i).filter((i) => perm[i] === i);
  const invol = perm.every((p, i) => perm[p] === i);
  const pairs = invol ? cyc.filter((c) => c.length === 2) : [];

  const rot = /^rotation by (\d+)$/.exec(kind);
  const ref = /^reflection (\d+)$/.exec(kind);
  let canon = kind, words = kind, family = 'other';

  if (rot) {
    const r = +rot[1];
    family = 'rotation';
    if (2 * r === n) {
      canon = 'antipodal';
      words = `the antipodal map — every item swapped for the one opposite it (${nm(items, 0)}↔${nm(items, r)})`;
    } else if (r === 1 || r === n - 1) {
      canon = 'successor';
      words = r === 1 ? `the successor map — every item sent to the next one (${nm(items, 0)}→${nm(items, 1)}→${nm(items, 2)}…)`
                      : `the predecessor map — every item sent to the previous one`;
    } else {
      canon = `shift ${r}/${n}`;
      words = `shift every item ${r} places round the ring (${cyc.length} cycles of length ${n / gcd(n, r)})`;
    }
  } else if (ref) {
    const r = +ref[1];
    family = 'reflection';
    /* i -> r - i mod n wraps unless r = n-1 */
    const wraps = perm.some((p, i) => r - i < 0 || r - i > n - 1 ? true : p !== r - i);
    const wrapFree = r === n - 1;
    if (wrapFree) {
      canon = 'reverse';
      words = `reverse the order — ${nm(items, 0)}↔${nm(items, n - 1)}, ${nm(items, 1)}↔${nm(items, n - 2)}, and so on inwards`;
    } else if (fixed.length) {
      canon = `reflect (${fixed.length} fixed)`;
      words = `reflect the ring about ${fixed.map((i) => nm(items, i)).join(' and ')} — ${pairs.length} swapped pairs, ${fixed.length} held`;
    } else {
      canon = 'reflect (0 fixed)';
      words = `reflect the ring between items — ${pairs.length} swapped pairs, nothing held fixed`;
    }
    void wraps;
  }
  return {
    kind, canon, words, family,
    order: orderOf(perm), moved, fixedCount: fixed.length,
    fixed: fixed.map((i) => nm(items, i)),
    pairs: pairs.map(([a, b]) => [nm(items, a), nm(items, b)]),
    involution: invol,
    lineLegal: canon === 'reverse',      /* the only symmetry an ordered list has */
    shape,
  };
}

/* what a set of this SHAPE should be symmetric under, decided before looking */
const PREDICTED = {
  line: { canon: 'reverse', words: 'reverse the order' },
  cycle: { canon: 'successor', words: 'the successor map (rotate by one)' },
};
function predictedFor(shape) { return PREDICTED[shape] || null; }
/* the permutation that canonical key names, on n items */
function permFor(canon, n) {
  if (canon === 'reverse') return Array.from({ length: n }, (_, i) => n - 1 - i);
  if (canon === 'successor') return Array.from({ length: n }, (_, i) => (i + 1) % n);
  if (canon === 'antipodal') return n % 2 ? null : Array.from({ length: n }, (_, i) => (i + n / 2) % n);
  return null;
}

module.exports = { describe, cycles, orderOf, predictedFor, permFor, PREDICTED };
