/* gen-n18.js — local search at exactly 18 terms, seeded from the near-miss.

   THE QUESTION. The subset census settled that no single-exponent deletion from
   the Hare-Jankauskas 19-term witness clears the fewer-terms envelope: the best
   is HJ minus {35} at certified min|f| >= 1.359653840579, short of Boyd's
   1.362373178133 by 2.7e-3. That is close enough that the next question is not
   "does a subset work" — the census answered that, completely — but "does
   anything NEAR it work". This generator asks that and only that.

   WHY A THIRD GENERATOR RATHER THAN A WIDER ONE. `gen-terms.js` roams n = 6..18
   and spends most of its budget far from any champion; measured, its best n=18
   score came from exactly this object and it reached it by luck of the shrink
   move. Pinning n = 18 and starting from the near-miss spends the whole budget
   in the one neighbourhood the census identified. Narrow on purpose: a
   generator that searches everywhere measures nothing about anywhere.

   THE MOVES, all length-preserving so n stays 18:
     SLIDE    move one exponent by a small amount (the local move)
     SWAP     replace one exponent with an unused one in range
     REBUILD  re-drop a different single exponent from HJ, then slide
     JITTER   several slides at once, to escape a local basin

   Runs inside the write-fence: no require, no fs, no process. */
'use strict';

var HJ = [0, 4, 6, 7, 8, 10, 11, 12, 15, 16, 17, 22, 24, 25, 26, 29, 32, 35, 38];
var TERMS = 18;
var MAX_EXP = 64;          /* the schema's ceiling on a single gap; span stays modest */

function toGaps(A) {
  var g = [];
  for (var i = 1; i < A.length; i++) g.push(A[i] - A[i - 1]);
  return g;
}

function fromGaps(g) {
  var A = [0], s = 0;
  for (var i = 0; i < g.length; i++) { s += g[i]; A.push(s); }
  return A;
}

/* every one-exponent deletion of HJ, as exponent sets — the census's own n=18
   row, restated as a seed bank rather than a result */
function seedBank() {
  var out = [];
  for (var k = 0; k < HJ.length; k++) {
    var A = [];
    for (var i = 0; i < HJ.length; i++) if (i !== k) A.push(HJ[i]);
    var t = [];
    for (var j = 0; j < A.length; j++) t.push(A[j] - A[0]);
    out.push(t);
  }
  return out;
}

function ok(A) {
  if (A.length !== TERMS) return false;
  for (var i = 1; i < A.length; i++) if (A[i] <= A[i - 1]) return false;
  if (A[0] !== 0) return false;
  for (var j = 1; j < A.length; j++) if (A[j] - A[j - 1] > MAX_EXP) return false;
  return true;
}

function normalise(A) {
  var s = A.slice().sort(function (x, y) { return x - y; });
  var out = [s[0]];
  for (var i = 1; i < s.length; i++) if (s[i] !== s[i - 1]) out.push(s[i]);
  var t = [];
  for (var j = 0; j < out.length; j++) t.push(out[j] - out[0]);
  return t;
}

function slide(A, rng, howMany) {
  var reps = howMany || 1;
  for (var r = 0; r < reps; r++) {
    var v = A.slice();
    var i = 1 + Math.floor(rng() * (v.length - 1));      /* never move the 0 */
    var step = (rng() < 0.5 ? -1 : 1) * (1 + Math.floor(rng() * 3));
    v[i] = v[i] + step;
    if (v[i] < 1) v[i] = 1;
    var n = normalise(v);
    if (n.length === TERMS && ok(n)) A = n;
  }
  return A;
}

function swap(A, rng) {
  var v = A.slice();
  var i = 1 + Math.floor(rng() * (v.length - 1));
  var span = v[v.length - 1];
  var used = {};
  for (var k = 0; k < v.length; k++) used[v[k]] = 1;
  for (var tries = 0; tries < 24; tries++) {
    var cand = 1 + Math.floor(rng() * (span + 6));
    if (used[cand]) continue;
    var w = v.slice(); w[i] = cand;
    var n = normalise(w);
    if (n.length === TERMS && ok(n)) return n;
  }
  return A;
}

module.exports = {
  name: 'n18-local',

  init: function (ctx) {
    return { draws: 0, bank: seedBank() };
  },

  next: function (state, rng) {
    var lb = state.leaderboard || [];
    var bank = state.bank;
    var A, hypothesis, roll = rng();

    /* prefer a boarded 18-term champion when one exists; otherwise the bank */
    var base = null, from = '';
    for (var i = 0; i < lb.length; i++) {
      var c = lb[i] && lb[i].candidate && lb[i].candidate.g;
      if (c && c.length === TERMS - 1) { base = fromGaps(c); from = 'a boarded 18-term champion'; break; }
    }
    if (!base || roll < 0.35) {
      base = bank[Math.floor(rng() * bank.length)].slice();
      from = 'HJ minus one exponent (census seed bank)';
    }

    if (roll < 0.45) {
      A = slide(base, rng, 1);
      hypothesis = 'slide one exponent of ' + from + ' by 1-3';
    } else if (roll < 0.70) {
      A = swap(base, rng);
      hypothesis = 'swap one exponent of ' + from + ' for an unused value in span';
    } else if (roll < 0.88) {
      A = slide(base, rng, 2 + Math.floor(rng() * 3));
      hypothesis = 'jitter ' + from + ' with several simultaneous slides — basin escape';
    } else {
      A = slide(swap(bank[Math.floor(rng() * bank.length)].slice(), rng), rng, 1);
      hypothesis = 'rebuild from a different single deletion of HJ, then swap and slide';
    }

    if (!ok(A)) { A = bank[Math.floor(rng() * bank.length)].slice(); hypothesis = 'fallback to an unmutated census seed (a move produced an invalid set)'; }

    return {
      candidate: { g: toGaps(A) },
      state: { draws: (state.draws || 0) + 1, bank: bank },
      hypothesis: hypothesis
    };
  }
};
