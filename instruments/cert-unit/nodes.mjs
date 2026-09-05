/**
 * nodes.mjs — this bench's instruments, as MIMO nodes.
 *
 * The four shapes certkit does not have, because certkit's instruments each
 * produce ONE verdict and ours are two-sided:
 *
 *   bracket   a primal path that CONSTRUCTS and a dual path that BOUNDS, joined
 *             at a comparator that emits the gap. Every result this bench owns
 *             has this shape, and the gap is the live number: it is what says
 *             which side is loose.
 *   concord   two independent implementations, one agreement port.
 *   perturb   the red team as a graph operation, with the DIRECTION the verdict
 *             is allowed to move asserted rather than eyeballed.
 *   screen    a float search that is structurally unable to reach a verdict.
 */

import { createRequire } from 'node:module';
import { CERTIFIED, REFUSED, REFUTED, node, VERDICT_PORTS } from './graph.mjs';
import { FLOAT, INTERVAL, Val, flt, ivl, refuseJoin } from './port.mjs';

const require = createRequire(import.meta.url);
export const IV = require('../interval/interval.js');
export const RADII = require('../interval/radii.js');
export const TR = require('../interval/transcendental.js');

const ok = (value, note) => ({ port: CERTIFIED, value, note });
const no = (value, note) => ({ port: REFUTED, value, note });
const abstain = (value, note) => ({ port: REFUSED, value, note });

/** A real computation, not an illustration: eqcert's outward-rounded arithmetic. */
export const intervalEval = ({ id = 'iv', title = 'interval evaluate', f }) => node({
  id, title, instrument: true, emits: INTERVAL,
  inputs: ['x'], outputs: VERDICT_PORTS,
  run: ({ x }) => {
    if (x.kind !== INTERVAL) return abstain(x, `needs an interval, got ${x.kind}`);
    const r = f(IV.iv(x.datum.lo, x.datum.hi));   // eqcert intervals are [lo, hi]
    return ok(ivl(r[0], r[1], x.hyp), `width ${(r[1] - r[0]).toExponential(2)}`);
  },
});

/**
 * THE NODE THIS BENCH ACTUALLY NEEDS.
 *
 * Two inputs produced by different routes that must meet. It certifies only
 * when the witness sits under the ceiling AND both are about the same problem.
 * The second half is the one that matters, and its absence cost this bench a
 * wrong headline for an afternoon.
 */
export const bracket = ({ id = 'bracket', title = 'bracket', label = 'sup' } = {}) => node({
  id, title, instrument: true, emits: INTERVAL,
  inputs: ['witness', 'ceiling'], outputs: VERDICT_PORTS,
  deciding: ['witness', 'ceiling'],
  run: ({ witness, ceiling }) => {
    const bad = refuseJoin(witness, ceiling);
    if (bad) return abstain(witness, bad.message);
    const lo = witness.datum.lo !== undefined ? witness.datum.lo : witness.datum;
    const hi = ceiling.datum.hi !== undefined ? ceiling.datum.hi : ceiling.datum;
    if (!(lo <= hi)) {
      return no(ivl(hi, lo, witness.hyp),
        `the witness exceeds the ceiling: ${lo} > ${hi}. One of the two sides is wrong.`);
    }
    const gap = hi / Math.max(lo, Number.MIN_VALUE);
    return ok(ivl(lo, hi, witness.hyp), `${label} in [${lo}, ${hi}]  gap ${gap.toFixed(2)}x`);
  },
});

/**
 * THE RADII POLYNOMIAL — this bench's actual decision procedure, wrapped.
 *
 * Given a defect Y0, a contraction Z1 and a curvature Z2, it either exhibits a
 * radius r with p(r) < 0 verified in interval arithmetic, or it does not.
 *
 * Note what it CANNOT do, and note that the graph shows it: this instrument has
 * a refuted port that can never fire. Failing to contract is not evidence that
 * no solution exists — it is evidence that this approximate inverse did not
 * prove one. Drawing a port that is permanently dark is the honest picture of a
 * one-sided method, and it is the thing a prose description always fudges.
 */
export const radiiNode = ({ id = 'radii', title = 'radii polynomial' } = {}) => node({
  id, title, instrument: true, emits: INTERVAL,
  inputs: ['Y0', 'Z1', 'Z2'], outputs: VERDICT_PORTS,
  deciding: ['Y0', 'Z1', 'Z2'],
  run: ({ Y0, Z1, Z2 }) => {
    for (const [k, v] of [['Y0', Y0], ['Z1', Z1], ['Z2', Z2]]) {
      const bad = refuseJoin(Y0, v); if (bad) return abstain(v, `${k}: ${bad.message}`);
    }
    const num = (v) => (v.datum.hi !== undefined ? v.datum.hi : v.datum);
    const res = RADII.radiiPolynomial(num(Y0), num(Z1), num(Z2));
    if (!res.ok) return abstain(ivl(0, 0, Y0.hyp), res.why);
    return ok(ivl(res.r, res.r, Y0.hyp),
      `contraction closes at r = ${res.r.toExponential(4)} (rMax ${Number(res.rMax).toExponential(2)})`);
  },
});

/** Sound interval transcendentals. Microseconds, so genuinely live in a page. */
export const encloseNode = ({ id = 'enclose', title = 'interval cos', fn = 'cos' } = {}) => node({
  id, title, instrument: true, emits: INTERVAL,
  inputs: ['x'], outputs: VERDICT_PORTS,
  run: ({ x }) => {
    if (x.kind !== INTERVAL) return abstain(x, `needs an interval, got ${x.kind}`);
    const r = TR[fn](IV.iv(x.datum.lo, x.datum.hi));
    return ok(ivl(r[0], r[1], x.hyp), `${fn} width ${(r[1] - r[0]).toExponential(2)}`);
  },
});

/** A float search. Fast, useful, and structurally unable to reach a verdict. */
export const floatScreen = ({ id = 'screen', title = 'float screen', f }) => node({
  id, title, emits: FLOAT,
  inputs: ['x'], outputs: ['pass', 'prune'],
  run: ({ x }) => {
    const keep = f(x.datum);
    return { port: keep ? 'pass' : 'prune', value: flt(x.datum, x.hyp), note: keep ? 'survives' : 'pruned' };
  },
});

/** The grader a reasonable person writes. Kept so the disagreement is countable. */
export const naiveGrader = ({ id = 'naive', title = 'tolerance grader', tol = 1e-9 }) => node({
  id, title, instrument: true, emits: FLOAT,
  inputs: ['claimed', 'actual'], outputs: VERDICT_PORTS,
  run: ({ claimed, actual }) => {
    const a = claimed.datum, b = actual.datum;
    return Math.abs(a - b) <= tol
      ? ok(flt(a, claimed.hyp), `within ${tol}`)
      : no(flt(a, claimed.hyp), `off by ${Math.abs(a - b).toExponential(2)}`);
  },
});

/** Two implementations of one decision. Disagreement is a bug in exactly one. */
export const concord = ({ id = 'concord', title = 'cross-implementation' } = {}) => node({
  id, title, instrument: true, emits: INTERVAL,
  inputs: ['a', 'b'], outputs: VERDICT_PORTS,
  run: ({ a, b }) => {
    const bad = refuseJoin(a, b);
    if (bad) return abstain(a, bad.message);
    const same = JSON.stringify(a.datum) === JSON.stringify(b.datum);
    return same ? ok(a, 'two implementations agree')
      : no(a, `disagree: ${JSON.stringify(a.datum)} vs ${JSON.stringify(b.datum)}`);
  },
});

/**
 * The red team as a graph operation. A perturbation names the DIRECTION the
 * verdict may move; a run that moves the other way is the finding. Drop a
 * telescope and a ceiling may only loosen. Widen an allowance and it may only
 * loosen. Translate a region AND its field and it may not move — translate only
 * the region and it may, which is the ill-founded version of this bench's own
 * red that produced a false alarm.
 */
export const MONOTONE = { LOOSEN: 'may only loosen', TIGHTEN: 'may only tighten', INVARIANT: 'may not move' };

export function assertMonotone({ name, before, after, direction, tol = 0.01 }) {
  let held;
  if (direction === MONOTONE.LOOSEN) held = after >= before * (1 - tol);
  else if (direction === MONOTONE.TIGHTEN) held = after <= before * (1 + tol);
  else held = Math.abs(after - before) <= tol * Math.max(Math.abs(before), 1e-30);
  return { name, direction, before, after, held };
}
