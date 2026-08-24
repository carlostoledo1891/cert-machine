/* aim.js — choose where to point, and measure whether choosing beat guessing.

   The source lab measured its own frontier and wrote the sentence this file
   exists to act on: "box placement dominated engine choice." Three campaigns,
   three engines, and the finding was that AIM beat SEARCH. Nothing in the
   machine chose a box until now; a human did, four times.

   WHAT IT DOES. Given candidate boxes and a cheap probe, it spends a small
   fixed budget sampling each box, and returns them ranked by measured expected
   yield per unit cost. No model, no prior, no cleverness: it looks.

     yieldRate  = fraction of probes whose cheap score clears the box's bar
     headroom   = mean distance of the best probes from that bar (negative =
                  short). Distinguishes "nothing clears" from "nothing is close",
                  which are different situations and want different decisions.
     costPer    = measured milliseconds per certification in that box
     expected   = yieldRate / costPer, hits per second of certifier time

   AND THE PART THAT MAKES IT A MACHINE RATHER THAN A HUNCH: aim() returns its
   own control. `chooseRandom` picks a box with the same probe budget spent
   uniformly, so a campaign can report what aim bought over guessing at equal
   cost. If it buys nothing, that is a measurement and it should be published as
   one — the source lab's most useful number was its dumb baseline beating its
   LLM 37:24.

   No gate. It reports a ranking; the caller points wherever it likes. */
'use strict';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function mean(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }

/* probe(box, rng) -> { score, bar }  cheap, float, no certification
   cost(box, rng)  -> ms per certification (optional; sampled a few times) */
function aim(boxes, opts) {
  const o = opts || {};
  const probes = o.probes || 200;
  const costSamples = o.costSamples || 3;
  const seed = o.seed === undefined ? 1 : o.seed;

  const rows = boxes.map((box, bi) => {
    const rng = mulberry32(seed * 1000 + bi);
    const scores = [], gaps = [];
    let cleared = 0;
    for (let i = 0; i < probes; i++) {
      const p = o.probe(box, rng);
      if (!p || !isFinite(p.score)) continue;
      scores.push(p.score);
      gaps.push(p.score - p.bar);
      if (p.score > p.bar) cleared++;
    }
    scores.sort((a, b) => b - a);
    gaps.sort((a, b) => b - a);
    const top = gaps.slice(0, Math.max(1, Math.floor(gaps.length * 0.05)));

    let costPer = null;
    if (o.cost) {
      const cs = [];
      for (let i = 0; i < costSamples; i++) cs.push(o.cost(box, rng));
      cs.sort((a, b) => a - b);
      costPer = cs[Math.floor(cs.length / 2)];        /* median, not mean */
    }

    const yieldRate = scores.length ? cleared / scores.length : 0;
    return {
      box,
      probes: scores.length,
      cleared,
      yieldRate,
      headroom: mean(top),                            /* how close the best get */
      bestGap: gaps.length ? gaps[0] : null,
      costPerMs: costPer,
      expected: costPer ? (yieldRate / (costPer / 1000)) : yieldRate
    };
  });

  /* Rank by expected yield; break ties toward the box whose best probes are
     closest to the bar, because "nothing cleared but three probes came within
     1e-3" is a better place to spend than "nothing came near". */
  const ranked = rows.slice().sort((a, b) =>
    (b.expected - a.expected) || (b.headroom - a.headroom));

  return {
    ranked,
    pick: ranked[0],
    /* the equal-budget control: what a coin would have chosen */
    control: rows[Math.floor(mulberry32(seed ^ 0x5f3759df)() * rows.length)],
    budget: { probes, boxes: boxes.length, totalProbes: probes * boxes.length }
  };
}

/* Report what aim bought, after the fact. Given the ranked boxes and the actual
   outcome per box, says whether the pick beat the random control — the only
   number that makes aim worth its cost. */
function scoreAim(result, outcomeByBoxLabel) {
  const pick = result.pick && outcomeByBoxLabel[result.pick.box.label];
  const ctrl = result.control && outcomeByBoxLabel[result.control.box.label];
  if (pick === undefined || ctrl === undefined) return { verdict: 'INCOMPLETE', pick, ctrl };
  return {
    verdict: pick > ctrl ? 'AIM-BEAT-CONTROL' : (pick === ctrl ? 'TIE' : 'CONTROL-BEAT-AIM'),
    pickedBox: result.pick.box.label, pickedOutcome: pick,
    controlBox: result.control.box.label, controlOutcome: ctrl,
    delta: pick - ctrl
  };
}

module.exports = { aim, scoreAim, mulberry32 };
