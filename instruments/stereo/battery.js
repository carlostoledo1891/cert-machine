#!/usr/bin/env node
/* instruments/stereo/battery.js — the stereo error budget calibrated on cases
   with known answers, red controls that must fire, and the facts the
   instrument page states about the Leme 2020 rig re-derived.

   Prints: "stereo battery: N pass, 0 fail, R/R red controls fired". */
'use strict';
const path = require('path');
const IV = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const TR = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { makeBudget } = require('./budget.js');
const Bd = makeBudget(IV);
const PRESETS = require('./presets.js');

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.error('FAIL ' + name); } };
const red = (fired, name) => { reds++; if (fired) { redsFired++; pass++; } else { fail++; console.error('RED DID NOT FIRE ' + name); } };
const throws = (f) => { try { f(); return false; } catch (e) { return true; } };
const within = (a, x) => a[0] <= x && x <= a[1];

/* ---- literals ---- */
ok(Bd.lit('0')[0] === 0 && Bd.lit('0')[1] === 0 && Bd.lit('3')[0] === 3, 'integers are their own doubles');
ok(Bd.lit('0.1')[0] < 0.1 && Bd.lit('0.1')[1] > 0.1 && within(Bd.lit('0.98'), 0.98), 'a decimal fraction is enclosed by its neighbouring doubles');
red(throws(() => Bd.box('2', '1')), 'a box with lo > hi is refused');
red(throws(() => Bd.lit('abc')), 'a non-number is refused');

/* ---- an exact 3-4-5 geometry: camera 3 up, point 4 out, slant 5 ---- */
const thin = { B: IV.iv(1), Hc: IV.iv(3), f: IV.iv(0.004), p: IV.iv(1e-12), dd: IV.iv(0), dt: IV.iv(0), utex: IV.iv(0), T: IV.iv(10), H: IV.iv(1), g: IV.iv(9.8), PI: TR.PI };
{
  const c = Bd.cell(thin, IV.iv(4));
  ok(within(c.slant, 5) && IV.width(c.slant) < 1e-12, 'the slant range is 5');
  ok(within(c.sin, 0.6) && within(c.cos, 0.8), 'sin θ = 3/5, cos θ = 4/5 are inside their enclosures');
  /* the tight cell has the analytic width (Z/f)·p·cosθ = 1250 × 1e-12 × 0.8 = 1e-9 exactly */
  ok(within(c.quantization.eta, 0) && IV.width(c.quantization.eta) > 0.999e-9 && IV.width(c.quantization.eta) < 1.001e-9, 'the elevation cell contains 0 and has the analytic width (Z/f)·p·cosθ = 1e-9 (' + IV.width(c.quantization.eta).toExponential(4) + ')');
  ok(within(c.quantization.r, 4) && IV.width(c.quantization.r) < 1e-9, 'and the range cell closes on 4');
  ok(within(c.disparityPx, 0.004 * 1 / 5 / 1e-12), 'the disparity is fB/Z in pixels');
  ok(c.terms.velocity < 1e-300 && c.terms.slope < 1e-9, 'no lag: the velocity term is zero to the width of a denormal (the arithmetic widens even 0·x outward) and the slope term is the cell\'s width times the slope');
}
/* ---- the exact cell is never narrower than the textbook linearisation ---- */
{
  const inp = Object.assign({}, thin, { p: IV.iv(2e-6), dd: IV.iv(0.5) });
  for (const R of [4, 10, 30]) {
    const c = Bd.cell(inp, IV.iv(R));
    const Z = Math.hypot(3, R), e = 0.5 * 2e-6, lin = 2 * (3 / Z) * (Z * Z * e / (0.004 * 1));   /* 2·sinθ·Z²δ/(fB) */
    ok(c.terms.cell >= lin * (1 - 1e-9), 'at R = ' + R + ' the exact vertical cell (' + c.terms.cell.toExponential(3) + ') is at least the linearised 2·sinθ·Z²δ/(fB) (' + lin.toExponential(3) + ')');
  }
}
/* ---- the cell grows with range ---- */
{
  const inp = Object.assign({}, thin, { p: IV.iv(2e-6), dd: IV.iv(0.5), dt: IV.iv(0.01), utex: IV.iv(1) });
  let prev = 0, mono = true;
  for (const R of [2, 4, 8, 16, 32, 64, 128]) { const t = Bd.cell(inp, IV.iv(R)).total[1]; if (t <= prev) mono = false; prev = t; }
  ok(mono, 'the total bound increases with range on a doubling grid');
}
/* ---- the reach is a prefix of the grid ---- */
{
  const inp = Object.assign({}, thin, { p: IV.iv(2e-6), dd: IV.iv(0.5) });
  const grid = [2, 4, 8, 16, 32, 64, 128, 256].map((x) => IV.iv(x));
  const r = Bd.reach(inp, IV.iv(0.1), grid);
  const okRows = r.rows.filter((x) => x.ok).length;
  ok(r.reach !== null && r.firstFailure !== null && r.rows.slice(0, okRows).every((x) => x.ok) && !r.rows[okRows].ok, 'the reach is the last of an unbroken run of in-tolerance ranges, and the row after it fails');
  red(Bd.reach(inp, IV.iv(1e-9), grid).reach === null, 'an impossible tolerance gives no reach at all, not the first grid point');
}
/* ---- reds on the inputs ---- */
red(throws(() => Bd.cell(Object.assign({}, thin, { B: IV.iv(0) }), IV.iv(4))), 'a zero baseline is refused');
red(throws(() => Bd.cell(Object.assign({}, thin, { dt: IV.iv(-0.01) }), IV.iv(4))), 'a negative lag is refused');
red(throws(() => Bd.cell(thin, IV.iv(0))), 'a zero range is refused');
{
  /* a lag so large the disparity box reaches zero: the far side is unbounded and the cell is REFUSED, not clamped */
  const c = Bd.cell(Object.assign({}, thin, { p: IV.iv(2e-6), dd: IV.iv(0.5), dt: IV.iv(10), utex: IV.iv(1) }), IV.iv(100));
  red(c.withSync === null && c.total === null && /reaches zero/.test(c.refused), 'a disparity box that reaches zero is refused with the reason');
}
/* ---- the sync term vanishes exactly at zero lag ---- */
{
  const inp = Object.assign({}, thin, { p: IV.iv(2e-6), dd: IV.iv(0.5), dt: IV.iv(0), utex: IV.iv(3) });
  const c = Bd.cell(inp, IV.iv(20));
  ok(Math.abs(c.terms.cell - c.terms.cellWithSync) <= 1e-12 * c.terms.cell && c.terms.velocity < 1e-300, 'with δt = 0 the sync-widened cell is the quantization cell to a relative 1e-12 and the velocity term is a denormal');
  const c2 = Bd.cell(Object.assign({}, inp, { dt: IV.iv(0.01) }), IV.iv(20));
  red(c2.terms.cellWithSync > c.terms.cell && c2.terms.velocity > 0, 'a 10 ms lag widens the cell and adds a velocity term');
}

/* ---- the Leme 2020 rig, as the page states it ---- */
{
  const P = PRESETS.leme2020;
  const inp = PRESETS.toIntervals(P, Bd, TR.PI);
  const best = Object.assign({}, inp, { p: Bd.lit(P.best.p), dd: Bd.lit(P.best.dd), dt: Bd.lit('0') });
  const worst = Object.assign({}, inp, { p: Bd.lit(P.worst.p), dd: Bd.lit(P.worst.dd) });
  const gauge = Bd.lit(P.gaugeRange);
  const cb = Bd.cell(best, gauge), cw = Bd.cell(worst, gauge), cx = Bd.cell(inp, gauge);
  ok(cb.total[1] < cw.total[1] && cx.total[1] >= cw.total[1] * (1 - 1e-12), 'best corner < worst corner ≤ the box enclosure at the gauge');
  const facts = PRESETS.lemeFacts(Bd, TR.PI);
  ok(facts.bestAtGauge > 0.02 && facts.bestAtGauge < 0.04, 'best-case certified cell at the gauge is a few centimetres (' + facts.bestAtGauge.toFixed(4) + ' m)');
  ok(facts.worstAtGauge > 0.2 && facts.worstAtGauge < 0.5, 'worst-corner bound at the gauge is tens of centimetres (' + facts.worstAtGauge.toFixed(4) + ' m)');
  ok(P.observed.rmse.every((x) => x >= facts.bestAtGauge && x <= facts.worstAtGauge), 'every observed RMSE of Table 1 lies between the best and worst corners');
  ok(facts.bestAtNear > P.quoted.zQuantization, 'the paper\'s quoted z-quantization (' + P.quoted.zQuantization + ' m) is below the best-case cell even at the near edge (' + facts.bestAtNear.toFixed(4) + ' m)');
  red(!(facts.bestAtNear > 0.1), 'and the best-case near cell is not tens of centimetres either — the claim is bounded on both sides');
}

console.log('stereo battery: ' + pass + ' pass, ' + fail + ' fail, ' + redsFired + '/' + reds + ' red controls fired');
process.exit(fail ? 1 : 0);
