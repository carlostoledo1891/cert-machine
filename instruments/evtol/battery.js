/* battery.js — the eVTOL energy certifier's test battery.
   instruments/evtol · cert-machine

   Green: a closed-form calibration the certifier must reproduce exactly;
   the monotone-corner structure PROVED by exhaustive exact-rational corner
   sweeps (256 corners), never assumed; all three verdicts exercised and
   cross-checked against the exact sweep. Red: forged inputs that must
   throw, a refutation whose witness must be exactly negative, and verdicts
   that must flip when the inputs change — a check that cannot go red is
   decoration. */
'use strict';

const E = require('#instruments/evtol/energy.js');
const Q = require('#instruments/interval/rational.js');

let n = 0, bad = 0;
const ok = (cond, msg, note) => {
  n++;
  if (!cond) { bad++; console.log('FAIL  ' + msg); }
  else console.log('PASS  ' + msg + (note ? '   [' + note + ']' : ''));
};
const red = (fn, msg) => {
  n++;
  try { fn(); bad++; console.log('FAIL  RED did not fire: ' + msg); }
  catch (e) { console.log('       RED ok  ' + msg + '   [' + e.message.slice(0, 70) + ']'); }
};

/* ---- fixtures ------------------------------------------------------------ */
/* thin boxes: the calibration instance with a hand-computable answer.
   EVERY number here is exactly representable as a double (dyadic), so the
   closed form holds in the exact-rational path with no representation
   slack — the first version used eta 0.9, which is NOT a dyadic, and the
   battery correctly refused to call 100/9 the answer to a different
   question. 1800 s at 120 kW / eta 0.5 = 120 kWh; reserve 1200 s at
   60 kW / 0.5 = 40; usable 200. margin = 200 − 120 − 40 = 40 exactly. */
const thin = (x) => [x, x];
const CAL_M = { segments: [{ name: 'cruise', t_s: thin(1800), p_kw: thin(120) }] };
const CAL_B = { usable_kwh: thin(200), eta: thin(0.5), reserve: { t_s: thin(1200), p_kw: thin(60) } };

/* a representative 2-segment mission with genuine boxes (hover + cruise) */
const M2 = {
  segments: [
    { name: 'hover', t_s: [90, 150], p_kw: [400, 550] },
    { name: 'cruise', t_s: [900, 1200], p_kw: [110, 150] }
  ]
};
const B_OK = { usable_kwh: [140, 160], eta: [0.88, 0.95], reserve: { t_s: [1200, 1200], p_kw: [80, 100] } };
const B_TIGHT = { usable_kwh: [72, 80], eta: [0.88, 0.95], reserve: { t_s: [1200, 1200], p_kw: [100, 120] } };
const B_DOOMED = { usable_kwh: [40, 44], eta: [0.88, 0.95], reserve: { t_s: [1800, 1800], p_kw: [100, 120] } };

/* every corner of (2 segments × 2 + 4) = 8 boxes, exact margins */
function cornerSweep(mission, battery) {
  const k = mission.segments.length * 2 + 4;
  const out = [];
  for (let mask = 0; mask < (1 << k); mask++) {
    const sel = [];
    for (let i = 0; i < k; i++) sel.push((mask >> i) & 1);
    out.push(E.exactMargin(mission, battery, sel));
  }
  return out;
}
const minQ = (xs) => xs.reduce((a, b) => (Q.cmp(b, a) < 0 ? b : a));
const maxQ = (xs) => xs.reduce((a, b) => (Q.cmp(b, a) > 0 ? b : a));

/* ---- calibration: the closed form, exactly ------------------------------- */
{
  const r = E.certify(CAL_M, CAL_B);
  const exact = Q.R(40n, 1n);                        /* 40 kWh, by hand, all dyadic */
  const sel = new Array(2 * 1 + 4).fill(0);
  const got = E.exactMargin(CAL_M, CAL_B, sel);
  ok(Q.cmp(got, exact) === 0, 'calibration margin is EXACTLY 40 kWh in rationals', Q.toString(got));
  ok(r.verdict === 'CERTIFIED', 'calibration instance is CERTIFIED');
  ok(Math.abs(r.margin_kwh - Q.toDouble(exact)) < 1e-12, 'interval margin matches the closed form to rounding',
    r.margin_kwh.toExponential(3));
}

/* ---- the monotone-corner structure, PROVED by sweep ---------------------- */
{
  for (const [name, B] of [['feasible', B_OK], ['marginal', B_TIGHT], ['doomed', B_DOOMED]]) {
    const sweep = cornerSweep(M2, B);
    const lo = Q.toDouble(minQ(sweep)), hi = Q.toDouble(maxQ(sweep));
    const r = E.certify(M2, B);
    /* recompute BOTH interval bounds from the enclosure, independent of
       which one the verdict chose to report */
    const enc = r.enclosure;
    const w = enc.usable_kwh[0] - enc.used_kwh[1] - enc.reserve_kwh[1];
    const b = enc.usable_kwh[1] - enc.used_kwh[0] - enc.reserve_kwh[0];
    ok(w <= lo + 1e-12, name + ': interval worst-margin is a SOUND lower bound on all 256 exact corners',
      w.toFixed(6) + ' <= ' + lo.toFixed(6));
    ok(b >= hi - 1e-12, name + ': interval best-margin is a SOUND upper bound on all 256 exact corners',
      b.toFixed(6) + ' >= ' + hi.toFixed(6));
    if (r.verdict === 'REFUTED') {
      ok(hi < 0, name + ': REFUTED cross-checked — even the best exact corner is negative', hi.toFixed(6));
    }
    ok(Math.abs(w - lo) < 1e-9 * (1 + Math.abs(lo)) && Math.abs(b - hi) < 1e-9 * (1 + Math.abs(hi)),
      name + ': both bounds are TIGHT (corner-achieving, not padded)',
      Math.abs(w - lo).toExponential(2) + ' · ' + Math.abs(b - hi).toExponential(2));
  }
}

/* ---- the three verdicts, each exercised and cross-checked ---------------- */
{
  const r = E.certify(M2, B_OK);
  const sweep = cornerSweep(M2, B_OK);
  ok(r.verdict === 'CERTIFIED', 'feasible mission: CERTIFIED', 'margin ' + r.margin_kwh.toFixed(3) + ' kWh');
  ok(Q.sign(minQ(sweep)) >= 0, 'CERTIFIED cross-check: all 256 exact corners are non-negative');
}
{
  const r = E.certify(M2, B_DOOMED);
  ok(r.verdict === 'REFUTED', 'doomed mission: REFUTED, universally');
  ok(r.witness && Q.sign(r.witness.margin) < 0,
    'the falsifying witness is the exact best corner, negative in BigInt rationals', r.witness.margin_str);
}
{
  const r = E.certify(M2, B_TIGHT);
  const sweep = cornerSweep(M2, B_TIGHT);
  ok(r.verdict === 'REFUSED', 'straddling mission: REFUSED — no universal verdict exists');
  ok(Q.sign(minQ(sweep)) < 0 && Q.sign(maxQ(sweep)) > 0,
    'REFUSED cross-check: exact corners of BOTH signs exist', 'the refusal is the true state');
}

/* ---- the reserve rule discriminates -------------------------------------- */
{
  const usable = [130, 135];                                   /* marginal on purpose */
  const r20 = E.certify(M2, { usable_kwh: usable, eta: [0.88, 0.95],
    reserve: { t_s: [1200, 1200], p_kw: [100, 120] } });       /* 20-min rule */
  const r30 = E.certify(M2, { usable_kwh: usable, eta: [0.88, 0.95],
    reserve: { t_s: [1800, 1800], p_kw: [100, 120] } });       /* 30-min rule */
  ok(r20.verdict === 'CERTIFIED' && r30.verdict !== 'CERTIFIED',
    'the 20-min vs 30-min reserve rule flips the verdict on a marginal battery',
    r20.verdict + ' -> ' + r30.verdict);
}

/* ---- reds ---------------------------------------------------------------- */
red(() => E.certify(M2, { ...B_OK, eta: [0.9, 1.1] }), 'an efficiency above 1 is refused at the door');
red(() => E.certify(M2, { ...B_OK, eta: [0, 0.9] }), 'a zero efficiency is refused (division by nothing)');
red(() => E.certify({ segments: [{ name: 'x', t_s: [-5, 10], p_kw: [1, 2] }] }, B_OK),
  'a negative duration is refused');
red(() => E.certify({ segments: [] }, B_OK), 'an empty mission is refused');
{
  /* the verdict must RESPOND: widening usable on the doomed instance until
     the best corner clears must move the verdict off REFUTED */
  const revived = E.certify(M2, { ...B_DOOMED, usable_kwh: [40, 110] });
  ok(revived.verdict !== 'REFUTED', 'RED-adjacent: the refutation is not sticky — widening the box moves the verdict',
    'REFUTED -> ' + revived.verdict);
}

console.log('');
console.log(bad === 0 ? 'ALL PASS — ' + n + ' checks, verdicts cross-proved by 256-corner exact sweeps'
  : bad + ' of ' + n + ' FAILED');
process.exit(bad === 0 ? 0 : 1);
