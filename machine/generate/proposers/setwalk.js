/* proposers/setwalk.js — the free proposer for Chowla's cosine problem.

   Same rule as proposers/flip.js: the first proposer costs nothing. No model,
   no API call, no tokens. It is a hill climb on integer sets with restarts,
   and it exists to be the honest baseline every paid proposer has to beat.

   IT SEARCHES IN FLOAT AND PROPOSES; IT NEVER DECIDES. The objective it climbs
   is `sampleC`, which can lie in exactly one direction — an undersampled
   minimum reads too high and makes a set look better than it is. That is fine
   here and only here, because nothing this file returns is a result: the
   runner certifies every record with instruments/trigmin before it is written
   anywhere. Search cheap, decide exactly.

   WHY A HILL CLIMB AND NOT SOMETHING CLEVERER. The flip-graph walk had moves
   that preserve correctness, so it could wander freely. Here every set is
   admissible and the landscape is what is hard, so the honest first proposer
   is the simplest thing that can be beaten: steepest descent over one-element
   swaps, restarted when it stalls. If a model proposer cannot beat this, it is
   not worth its invoice, and the board will say so.

   MIT. Part of cert-machine. */
'use strict';

const CH = require('../chowla.js');

/* the same deterministic PRNG the flip walk uses — a run is replayable */
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/** a random n-subset of [1..maxA], sorted */
function randomSet(n, maxA, rand) {
  const s = new Set();
  while (s.size < n) s.add(1 + Math.floor(rand() * maxA));
  return [...s].sort((a, b) => a - b);
}

/**
 * walk({ n, maxA, seed, evals, width, plateau, start })
 *   -> { best, bestC, found: [{A, c, atEval}], evals, restarts }
 *
 * `found` holds one entry per NEW record, in the order reached — each is a
 * candidate the runner will hand to the certifier.
 */
function walk(opts) {
  const n = opts.n, maxA = opts.maxA;
  const evalsBudget = opts.evals || 200000;
  const width = opts.width || 24;          /* neighbours sampled per step */
  const plateau = opts.plateau || 40;      /* stalled steps before a restart */
  const rand = rng(opts.seed === undefined ? 1 : opts.seed);

  let cur = opts.start ? opts.start.slice() : randomSet(n, maxA, rand);
  let curC = CH.sampleC(cur);
  let best = cur.slice(), bestC = curC;
  const found = [{ A: best.slice(), c: bestC, atEval: 0 }];
  let evals = 1, stalled = 0, restarts = 0;

  while (evals < evalsBudget) {
    let bestNb = null, bestNbC = Infinity;
    for (let k = 0; k < width && evals < evalsBudget; k++) {
      const nb = CH.neighbour(cur, maxA, rand);
      if (!nb) continue;
      const c = CH.sampleC(nb);
      evals++;
      if (c < bestNbC) { bestNbC = c; bestNb = nb; }
    }
    if (bestNb && bestNbC < curC) {
      cur = bestNb; curC = bestNbC; stalled = 0;
      if (curC < bestC) {
        bestC = curC; best = cur.slice();
        found.push({ A: best.slice(), c: bestC, atEval: evals });
      }
    } else if (++stalled > plateau) {
      /* a stalled climb is restarted from a fresh random set rather than
         nudged from the best — measured on this landscape, restarting wins:
         the basins are shallow and returning to the record just re-walks the
         same one. (The flip walk needed the opposite; different landscape.) */
      cur = randomSet(n, maxA, rand);
      curC = CH.sampleC(cur);
      evals++; stalled = 0; restarts++;
    }
  }
  return { best, bestC, found, evals, restarts };
}

module.exports = { walk, randomSet, rng };
