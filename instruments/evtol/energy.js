/* energy.js — the eVTOL mission-energy feasibility certifier.
   instruments/evtol · cert-machine

   THE CLAIM SHAPE. An electric VTOL mission is a sequence of segments
   (hover-climb, transition, cruise, descent, hover-land …), each with a
   duration and an electrical power draw known only to lie in a BOX — the
   honest state of pre-flight knowledge. The battery's usable energy and
   the reserve requirement (the SFAR's 20-minute VFR / 30-minute IFR rule,
   expressed as reserve time at a reserve power) are boxes too. The
   question a regulator actually asks is universally quantified:

       for EVERY parameter point in the boxes, does the mission end with
       terminal energy at or above the reserve floor?

   Today that question is answered by Monte Carlo. This instrument decides
   it: interval arithmetic with outward rounding gives a rigorous enclosure
   of used and required energy over the whole box, and the verdict is

       CERTIFIED  worst case clears — usable.lo − used.hi ≥ reserve.hi:
                  every point in the box lands at or above the floor;
       REFUTED    best case fails — usable.hi − used.lo < reserve.lo:
                  EVERY point violates the floor, and the certificate
                  carries the most favorable corner, re-evaluated in EXACT
                  RATIONAL arithmetic, as the falsifying witness (if even
                  that corner fails, all do — the monotone structure makes
                  the corner the witness for the universal refutation);
       REFUSED    the box straddles the floor: some points pass, some
                  fail, and no interval verdict exists. The margin is
                  reported; deciding needs tighter boxes, not tolerance.

   SCOPE, honestly. The model is energy accounting — Σ duration·power /
   efficiency against usable capacity — not electrochemistry: no voltage
   sag, no temperature dynamics, no aging model beyond what the usable-
   capacity and efficiency boxes absorb. That is exactly why parameters
   are BOXES: widen them to cover what the model does not resolve, and the
   verdict stays sound. Monotonicity (used energy increases in duration
   and power, decreases in efficiency) is what makes corners witnesses;
   the battery proves it by exact corner sweeps, never assumes it. */
'use strict';

const IV = require('#instruments/interval/interval.js');
const Q = require('#instruments/interval/rational.js');

/* a box is [lo, hi] with lo <= hi, finite, and (where required) positive */
function box(x, name, opts) {
  if (!Array.isArray(x) || x.length !== 2 || !isFinite(x[0]) || !isFinite(x[1]) || x[0] > x[1]) {
    throw new Error('evtol: ' + name + ' is not a box [lo, hi]: ' + JSON.stringify(x));
  }
  if ((opts && opts.positive) && x[0] <= 0) throw new Error('evtol: ' + name + ' must be strictly positive');
  if ((opts && opts.nonneg) && x[0] < 0) throw new Error('evtol: ' + name + ' must be non-negative');
  return IV.iv(x[0], x[1]);
}

/* mission: { segments: [{name, t_s: [lo,hi] seconds, p_kw: [lo,hi]}, ...] }
   battery: { usable_kwh: [lo,hi], eta: [lo,hi] in (0,1],
              reserve: { t_s: [lo,hi], p_kw: [lo,hi] } }                    */
function certify(mission, battery) {
  if (!mission || !Array.isArray(mission.segments) || mission.segments.length === 0) {
    throw new Error('evtol: mission needs a non-empty segments list');
  }
  const eta = box(battery.eta, 'battery.eta', { positive: true });
  if (eta[1] > 1) throw new Error('evtol: battery.eta must lie in (0, 1] — an efficiency above 1 is not a battery');
  const usable = box(battery.usable_kwh, 'battery.usable_kwh', { nonneg: true });
  const rT = box(battery.reserve.t_s, 'reserve.t_s', { nonneg: true });
  const rP = box(battery.reserve.p_kw, 'reserve.p_kw', { nonneg: true });

  /* used energy at the battery terminal, kWh: Σ (t/3600)·p / eta */
  const H = IV.iv(3600, 3600);
  let used = IV.iv(0, 0);
  const perSeg = [];
  for (const s of mission.segments) {
    const t = box(s.t_s, 'segment "' + s.name + '" t_s', { nonneg: true });
    const p = box(s.p_kw, 'segment "' + s.name + '" p_kw', { nonneg: true });
    const e = IV.div(IV.mul(IV.div(t, H), p), eta);
    perSeg.push({ name: s.name, kwh: e });
    used = IV.add(used, e);
  }
  const reserve = IV.div(IV.mul(IV.div(rT, H), rP), eta);

  /* the two one-sided comparisons that decide the universal statement */
  const worstMargin = usable[0] - used[1] - reserve[1];   /* ≥ 0 ⇒ every point clears */
  const bestMargin = usable[1] - used[0] - reserve[0];    /* < 0 ⇒ every point fails  */

  const enclosure = { used_kwh: used, reserve_kwh: reserve, usable_kwh: usable, perSeg };

  if (worstMargin >= 0) {
    return { verdict: 'CERTIFIED', enclosure, margin_kwh: worstMargin,
      text: 'for EVERY parameter point in the stated boxes the mission terminates at least '
        + worstMargin.toFixed(3) + ' kWh above the reserve floor' };
  }
  if (bestMargin < 0) {
    /* the universal refutation: even the most favorable corner fails.
       Re-prove that corner in EXACT rationals — the falsifying witness. */
    const w = witnessCorner(mission, battery);
    if (Q.sign(w.margin) >= 0) {
      throw new Error('evtol: interval refutation contradicted by the exact corner — instrument defect');
    }
    return { verdict: 'REFUTED', enclosure, margin_kwh: bestMargin, witness: w,
      text: 'EVERY parameter point in the boxes violates the reserve floor; the most favorable corner '
        + '(min durations/powers, max capacity/efficiency) fails by ' + Q.toDouble(Q.abs(w.margin)).toFixed(3)
        + ' kWh, proved in exact rational arithmetic' };
  }
  return { verdict: 'REFUSED', enclosure,
    margin_kwh: { worst: worstMargin, best: bestMargin },
    text: 'the boxes straddle the reserve floor (worst-case margin ' + worstMargin.toFixed(3)
      + ' kWh, best-case ' + bestMargin.toFixed(3) + ' kWh): some parameter points pass and some fail — '
      + 'no universal verdict exists, and this instrument refuses rather than guesses. Tighten the boxes.' };
}

/* the most favorable corner, evaluated with BigInt rationals: minimum
   durations and powers, maximum usable energy and efficiency, minimum
   reserve. If the mission fails HERE it fails everywhere in the box. */
function witnessCorner(mission, battery) {
  const r = (x) => Q.fromDouble(x);
  const H = r(3600);
  let used = Q.ZERO;
  const etaHi = r(battery.eta[1]);
  for (const s of mission.segments) {
    used = Q.add(used, Q.div(Q.mul(Q.div(r(s.t_s[0]), H), r(s.p_kw[0])), etaHi));
  }
  const reserve = Q.div(Q.mul(Q.div(r(battery.reserve.t_s[0]), H), r(battery.reserve.p_kw[0])), etaHi);
  const margin = Q.sub(Q.sub(r(battery.usable_kwh[1]), used), reserve);
  return { corner: 'min t, min p, max usable, max eta, min reserve',
    used_kwh: Q.toString(used), reserve_kwh: Q.toString(reserve), margin,
    margin_str: Q.toString(margin) };
}

/* exact rational evaluation at an arbitrary corner selector — the battery
   uses this to PROVE the monotone-corner structure by exhaustive sweep on
   small instances instead of assuming it. sel maps each box to 0 (lo) or
   1 (hi) in the fixed order: [each segment t, each segment p], usable,
   eta, reserve t, reserve p. Returns the exact terminal margin. */
function exactMargin(mission, battery, sel) {
  const r = (x) => Q.fromDouble(x);
  const H = r(3600);
  let k = 0;
  const pick = (b) => r(b[sel[k++]]);
  let used = Q.ZERO;
  const parts = [];
  for (const s of mission.segments) parts.push([pick(s.t_s), pick(s.p_kw)]);
  const usable = pick(battery.usable_kwh);
  const eta = pick(battery.eta);
  for (const [t, p] of parts) used = Q.add(used, Q.div(Q.mul(Q.div(t, H), p), eta));
  const reserve = Q.div(Q.mul(Q.div(pick(battery.reserve.t_s), H), pick(battery.reserve.p_kw)), eta);
  return Q.sub(Q.sub(usable, used), reserve);
}

module.exports = { certify, witnessCorner, exactMargin };
