/* proposers/flip.js — the free proposer: a random walk on the flip graph.

   The spec's first rule is that `propose` is ADDITIVE and must earn its
   place against a systematic scan. So the first proposer costs nothing: no
   API call, no model, no tokens. It walks the flip graph — the moves that
   preserve the tensor identity exactly — and reports every scheme it reaches
   whose rank is lower than anything seen before.

   That makes it the honest baseline for every paid proposer that follows.
   A model that cannot beat a random walk over free moves is not worth its
   invoice, and the admission arithmetic will say so in public.

   Correctness is not checked during the walk and does not need to be: a flip
   is an identity over F2 and a reduce is a merge of equal factors, so every
   scheme on the walk decomposes the same tensor by construction. The walk
   SCREENS by rank; the instrument CERTIFIES. That is the engine's existing
   split, and it is what makes a walk of millions of steps affordable.

   MIT. Part of cert-machine. */
'use strict';

const F = require('../f2scheme.js');

/* a small deterministic PRNG: a run is reproducible from its seed, which is
   what lets a proposal in the ledger be replayed by someone else */
function rng(seed) {
  let s = seed >>> 0;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/**
 * walk({n,m,p, seed, steps, start, plateauLimit})
 *   -> { best, bestRank, found: [{scheme, rank, atStep}], steps, restarts }
 *
 * `found` holds one entry per NEW record rank, in the order reached — each
 * is a proposal the controller will hand to the certifier.
 */
function walk(opts) {
  const { n, m, p } = opts;
  const steps = opts.steps || 200000;
  const plateauLimit = opts.plateauLimit || 8000;
  const rand = rng(opts.seed === undefined ? 1 : opts.seed);

  let cur = F.reduce(opts.start ? opts.start.map(t => t.slice()) : F.naive(n, m, p));
  let best = cur.map(t => t.slice()), bestRank = cur.length;
  const found = [];
  let sincePlateau = 0, restarts = 0, step = 0;

  for (; step < steps; step++) {
    const sites = F.flipSites(cur);
    if (!sites.length) break;
    const [i, j, pos] = sites[Math.floor(rand() * sites.length)];
    cur = F.flip(cur, i, j, pos);

    /* reducing is cheap relative to a flip only when something could have
       become reducible, and a flip can always create that, so try every step */
    const red = F.reduce(cur);
    if (red.length < cur.length) {
      cur = red;
      if (cur.length < bestRank) {
        bestRank = cur.length;
        best = cur.map(t => t.slice());
        found.push({ scheme: best.map(t => t.slice()), rank: bestRank, atStep: step });
        sincePlateau = 0;
        continue;
      }
    }

    /* a walk that has stopped finding anything is restarted from the best
       scheme so far — the standard escape, and it is what makes long runs
       productive rather than drifting */
    if (++sincePlateau > plateauLimit) {
      cur = best.map(t => t.slice());
      sincePlateau = 0;
      restarts++;
    }
  }

  return { best, bestRank, found, steps: step, restarts };
}

/* the proposer interface the controller calls (SPEC-GENERATION.md §2) */
async function propose(ctx) {
  const { n, m, p } = ctx.target.dims;
  const seed = ctx.seed === undefined ? 1 : ctx.seed;
  const start = ctx.best && ctx.best.length ? ctx.best[0].scheme : null;
  const r = walk({ n, m, p, seed, steps: ctx.budget.steps || 200000, start });
  return r.found.map(f => ({
    obj: { scheme: f.scheme, n, m, p },
    claim: [1, 2],            /* half of what it reports should certify */
    rationale: 'flip-graph walk, seed ' + seed + ', new record rank at step ' + f.atStep,
    proposer: 'flip@v1'
  }));
}

module.exports = { walk, propose, rng };
