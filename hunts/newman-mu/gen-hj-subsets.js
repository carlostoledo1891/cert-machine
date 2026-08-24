/* gen-hj-subsets.js — enumerate every subset of the Hare-Jankauskas 19-term
   witness at sizes 18 and 17, deterministically and exhaustively.

   WHY A SECOND GENERATOR. `subsets-hj.js` answered this question as a
   standalone script, and a standalone script's stdout is not evidence: it has
   no chained record, no independent recompute on admission, no canonical
   dedup, no board, and no claim shape. This generator asks the machine the same
   question so that the answer arrives as records — every candidate certified
   through `certify()`, every admission re-verified through
   `recheckCertificate()`, every line hash-chained, and the superlative emitted
   as a RECORD naming its box.

   It is `enum`-shaped in spirit but not in name, so the machine fires its
   equal-budget dumb baseline against it automatically. That comparison is
   uninformative here by construction — this generator enumerates a fixed
   190-element box and the baseline enumerates n=6 gap vectors — and saying so
   is cheaper than letting someone read the session summary as a duel.

   The box: all C(19,18) + C(19,17) = 19 + 171 = 190 subsets, deduplicated by
   the machine's canonical key (translation + gcd + reversal), enumerated in
   lexicographic index order. Runs inside the write-fence. */
'use strict';

/* Hare-Jankauskas arXiv:1910.13994 Eq. (2.1). battery.js asserts this equals
   target.js's n=19 anchor — the generator cannot require it across the fence. */
var HJ = [0, 4, 6, 7, 8, 10, 11, 12, 15, 16, 17, 22, 24, 25, 26, 29, 32, 35, 38];
var SIZES = [18, 17];

/* index lists of every k-subset of 0..n-1, lexicographic */
function subsetsOf(n, k) {
  var out = [];
  var idx = [];
  (function rec(start) {
    if (idx.length === k) { out.push(idx.slice()); return; }
    for (var i = start; i < n; i++) { idx.push(i); rec(i + 1); idx.pop(); }
  })(0);
  return out;
}

function buildPlan() {
  var plan = [];
  for (var s = 0; s < SIZES.length; s++) {
    var subs = subsetsOf(HJ.length, SIZES[s]);
    for (var i = 0; i < subs.length; i++) plan.push({ size: SIZES[s], idx: subs[i] });
  }
  return plan;
}

/* exponents -> gap vector, after translating the first element to 0 */
function toGaps(A) {
  var g = [];
  for (var i = 1; i < A.length; i++) g.push(A[i] - A[i - 1]);
  return g;
}

module.exports = {
  name: 'hj-subsets',

  init: function (ctx) {
    return { i: 0, plan: buildPlan() };
  },

  next: function (state, rng) {
    if (state.i >= state.plan.length) {
      return { candidate: null, done: true, state: state, hypothesis: 'hj-subsets exhausted: all ' + state.plan.length + ' subsets enumerated' };
    }
    var item = state.plan[state.i];
    var A = [];
    for (var j = 0; j < item.idx.length; j++) A.push(HJ[item.idx[j]]);
    var dropped = [];
    for (var h = 0; h < HJ.length; h++) if (item.idx.indexOf(h) < 0) dropped.push(HJ[h]);

    return {
      candidate: { g: toGaps(A) },
      state: { i: state.i + 1, plan: state.plan },
      hypothesis: 'HJ 19-term witness minus {' + dropped.join(',') + '} — ' + item.size + ' terms; does removing ' + dropped.length + ' exponent(s) keep it above the fewer-terms envelope'
    };
  }
};
