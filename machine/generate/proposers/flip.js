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

   The walk never asks what the target MEANS. It is handed a seed scheme and
   moves that preserve whatever tensor that scheme sums to, so pointing it at
   a polynomial product instead of a matrix product costs nothing here — the
   target arrives in `ctx` and is passed straight through.

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
 * walk({target, seed, steps, start, plateauLimit})
 *   -> { best, bestRank, found: [{scheme, rank, atStep}], steps, restarts }
 *
 * `found` holds one entry per NEW record rank, in the order reached — each
 * is a proposal the controller will hand to the certifier.
 */
function walk(opts) {
  const target = opts.target;
  const steps = opts.steps || 200000;
  const plateauLimit = opts.plateauLimit || 1200;
  /* how far above the best rank the walk is allowed to climb before it gives
     up and restarts. Zero disables the plus transition entirely, which is how
     the "does it still stall?" calibration is run. */
  const slack = opts.slack === undefined ? 2 : opts.slack;
  const rand = rng(opts.seed === undefined ? 1 : opts.seed);
  const wid = F.widths(target);

  let cur = F.reduce(opts.start ? opts.start.map(t => t.slice()) : F.naive(target));
  let best = cur.map(t => t.slice()), bestRank = cur.length;
  const found = [];
  let sincePlateau = 0, restarts = 0, pluses = 0, step = 0;

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

    /* A WALK THAT HAS STOPPED FINDING ANYTHING HAS TWO WAYS OUT, and taking
       only the second one is what made this walk stall above the published
       ranks from P5 upward:
         CLIMB    spend a unit of rank on a plus transition and keep going,
                  while still within `slack` of the best — the escape that
                  makes the low-rank regions reachable at all;
         RESTART  fall back to the best scheme once the climb budget is used
                  up, so a run cannot wander off and never come back. */
    if (++sincePlateau > plateauLimit) {
      sincePlateau = 0;
      if (slack > 0 && cur.length < bestRank + slack) {
        const i = Math.floor(rand() * cur.length);
        const pos = Math.floor(rand() * 3);
        /* the new factor is drawn over the whole coordinate space. Drawing it
           instead from inside the support of the factor being split — keeping
           both halves local — was tried and measured: identical ranks on T7
           and T8 at equal budget, so the simpler draw stays and the option
           did not earn a config flag. */
        const mask = Math.floor(rand() * (1 << wid[pos]));
        const climbed = F.split(cur, i, pos, mask);
        if (climbed !== cur) { cur = climbed; pluses++; continue; }
      }
      cur = best.map(t => t.slice());
      restarts++;
    }
  }

  return { best, bestRank, found, steps: step, restarts, pluses };
}

/* the proposer interface the controller calls (SPEC-GENERATION.md §2) */
async function propose(ctx) {
  const target = ctx.target.tensor;
  const seed = ctx.seed === undefined ? 1 : ctx.seed;
  const start = ctx.best && ctx.best.length ? ctx.best[0].scheme : null;
  const r = walk({ target, seed, steps: ctx.budget.steps || 200000, start });
  return r.found.map(f => ({
    obj: { scheme: f.scheme, target },
    claim: [1, 2],            /* half of what it reports should certify */
    rationale: 'flip-graph walk, seed ' + seed + ', new record rank at step ' + f.atStep,
    proposer: 'flip@v1'
  }));
}

module.exports = { walk, propose, rng };
