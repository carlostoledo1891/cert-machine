/* keller-fibers.js — certified fiber counts for Keller maps: non-injectivity
   found BLIND, not transcribed.

   keller-audit verifies witnesses somebody supplies. This family consumes no
   witnesses: for each (map, rational target) cell the fiber instrument hunts
   preimages with damped multistart Newton, certifies every candidate in a
   Krawczyk box on the EXACT map (interval-enclosed rational coefficients),
   and dedups by certified box disjointness. A HIT asserts

       F has AT LEAST k preimages of w, each in a certified uniqueness box,
       the boxes pairwise disjoint

   — and k >= 2 is an independent proof of non-injectivity, rediscovered by
   the machine. The count is a LOWER bound by construction: the float hunter
   reaches what it reaches; more preimages can exist, fewer cannot. On
   Alpöge's map over (-1/4, 0, 0) the hunt finds all three known rational
   preimages without being told any of them (the battery pins this), and on
   the generated d=3 sweep it finds a THIRD preimage beyond the two the
   secant construction wrote down — the hunter exceeding its own input. */
'use strict';

const Q = require('#instruments/interval/rational.js');
const SW = require('#instruments/keller/sweep.js');
const AUD = require('#families/keller-audit.js');
const { certifiedFiber } = require('#instruments/keller/fibers.js');

/* the corpus: every 3-dimensional map this repo certifies, targeted at its
   own collision image — the fiber the literature (or our generator) claims
   is multiple, now recounted blind */
function cells() {
  const out = [];
  const alp = AUD.enumerate(0);
  out.push({ tag: 'alpoge', F: alp.claim.F, w: alp.claim.image, expectAtLeast: 3 });
  for (const d of [3, 4, 5]) {
    const g = SW.generate(d);
    if (g.ok) out.push({ tag: 'sweep-d' + d, F: g.claim.F, w: g.claim.image, expectAtLeast: 2 });
  }
  for (const d of [2, 3, 4]) {
    const g = SW.fromSeed({ pCoeffs: SW.gallagherSeed(d) });
    if (g.ok) out.push({ tag: 'gallagher-d' + d, F: g.claim.F, w: g.claim.image, expectAtLeast: 2 });
  }
  const dm = SW.fromSeed({ pCoeffs: [Q.R(1n), Q.ZERO, Q.R(-2n)], b: Q.R(-1n) });
  if (dm.ok) out.push({ tag: 'gallagher-distinct', F: dm.claim.F, w: dm.claim.image, expectAtLeast: 2 });
  return out;
}
let CELLS = null;

module.exports = {
  name: 'keller-fibers',
  statement: 'a Keller map and a rational target with AT LEAST k certified preimages — pairwise-disjoint Krawczyk boxes found by blind multistart Newton on the exact map; k >= 2 re-proves non-injectivity with no witnesses consumed',
  enumerate(i) {
    if (!CELLS) CELLS = cells();
    return i < CELLS.length ? CELLS[i] : null;
  },
  /* float screen: how many distinct Newton sinks does a cheap hunt see? */
  value(o) {
    const f = certifiedFiber(o.F, o.w, { starts: 60 });
    return f.preimages;
  },
  interesting() {
    return true;
  },
  key: (o) => 'fiber|' + o.tag,
  certify(o) {
    const f = certifiedFiber(o.F, o.w);
    if (f.preimages === 0) return { verdict: 'REFUSED', why: 'the hunt certified no preimage at all — the target may have none real, or the starts missed; absence of proof' };
    if (f.preimages === 1) return { verdict: 'REJECT', enclosure: [1, 1],
      text: o.tag + ': one certified preimage — consistent with injectivity over this target, nothing more proved' };
    return {
      verdict: 'HIT',
      enclosure: [f.preimages, f.preimages],
      text: o.tag + ': AT LEAST ' + f.preimages + ' preimages of one rational point, each in a certified '
        + 'Krawczyk box, boxes pairwise disjoint — non-injectivity re-proved BLIND, no witnesses consumed'
        + (f.preimages > o.expectAtLeast ? ' (MORE than the ' + o.expectAtLeast + ' constructed witnesses)' : ''),
      extra: {
        tag: o.tag, target: o.w.map(Q.toString),
        preimages: f.preimages,
        boxes: f.boxes.map(b => ({ center: b.center, maxRad: b.maxRad })),
        starts: f.starts,
        note: f.note
      }
    };
  }
};
