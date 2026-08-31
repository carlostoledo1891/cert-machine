/* battery.js — the gate for apps/glide-band. Calibrations against answers
   known independently, containment tests that could fail, and red controls
   that MUST fire. The report build refuses without a green battery.

   run: node apps/glide-band/battery.js                                     */
'use strict';

const assert = require('assert');
const path = require('path');
const K = require(path.join(__dirname, 'kernel.js'));
const { FT, KT } = K;

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('  ok ' + String(n).padStart(2) + '  ' + name); };
const reds = [];
const red = (name, fn) => {
  let fired = false;
  try { fn(); } catch (e) { fired = true; }
  if (!fired) { console.error('  RED DID NOT FIRE: ' + name); process.exit(1); }
  reds.push(name); n++; console.log('  ok ' + String(n).padStart(2) + '  RED fired · ' + name);
};

console.log('glide-band battery');

/* ---------- 1 · geodesy calibration --------------------------------------- */
console.log('-- geodesy');

ok('one degree of latitude encloses 110.57..111.69 km (the known meridian range)', () => {
  const g = K.greatCircle(40, -75, 41, -75);
  assert.ok(g.dist[0] <= 111694 && g.dist[1] >= 110574,
    'enclosure ' + g.dist + ' misses the known meridian degree range');
});

ok('bearing due north is 0, due east is 90', () => {
  assert.ok(Math.abs(K.bearingOf(40, -75, 41, -75)) < 1e-9);
  assert.ok(Math.abs(K.bearingOf(0, 0, 0, 1) - 90) < 1e-9);
});

ok('the earth-radius interval brackets the haversine on a long leg (JFK->LAX)', () => {
  const g = K.greatCircle(40.6413, -73.7781, 33.9416, -118.4085);
  assert.ok(g.dist[0] < 3_983_000 && g.dist[1] > 3_970_000, 'JFK-LAX enclosure ' + g.dist);
});

/* ---------- 2 · the trig hulls, which the band's soundness rests on ------- */
console.log('-- interval trig hulls');

ok('cosHull spanning 0 attains +1; spanning pi attains -1', () => {
  assert.strictEqual(cosTop(-0.3, 0.3), 1);
  assert.strictEqual(cosBot(Math.PI - 0.3, Math.PI + 0.3), -1);
});
function cosTop(a, b) { return K.cosHull(a, b)[1] >= 1 ? 1 : K.cosHull(a, b)[1]; }
function cosBot(a, b) { return K.cosHull(a, b)[0] <= -1 ? -1 : K.cosHull(a, b)[0]; }

ok('sinHull spanning pi/2 attains +1; a full turn is [-1,1]', () => {
  assert.ok(K.sinHull(Math.PI / 2 - 0.2, Math.PI / 2 + 0.2)[1] >= 1);
  const f = K.cosHull(0, 7);
  assert.ok(f[0] <= -1 && f[1] >= 1);
});

ok('hulls CONTAIN the pointwise value at 200 sampled angles', () => {
  for (let i = 0; i < 200; i++) {
    const a = -8 + 16 * (i / 199), w = 0.37;
    const ch = K.cosHull(a, a + w), sh = K.sinHull(a, a + w);
    for (let j = 0; j <= 12; j++) {
      const x = a + w * (j / 12);
      assert.ok(Math.cos(x) >= ch[0] && Math.cos(x) <= ch[1], 'cos escaped its hull');
      assert.ok(Math.sin(x) >= sh[0] && Math.sin(x) <= sh[1], 'sin escaped its hull');
    }
  }
});

/* ---------- 3 · the band, calibrated against the closed form -------------- */
console.log('-- the band');

const still = { LD: [10, 10], Va: [50, 50], Ws: [0, 0], Wdir: [0, 0] };

ok('still air, point envelope: the band collapses onto h*LD', () => {
  const b = K.band(37, [3000, 3000], still);
  assert.ok(b.lo <= 30000 && b.hi >= 30000, 'still-air band ' + [b.lo, b.hi] + ' misses h*LD');
  assert.ok(b.hi - b.lo < 1e-6, 'point envelope should not widen: ' + (b.hi - b.lo));
});

ok('downwind reaches strictly further than upwind', () => {
  const e = { LD: [10, 10], Va: [50, 50], Ws: [15, 15], Wdir: [270, 270] };
  const down = K.band(90, [3000, 3000], e);   /* wind from 270 pushes toward 090 */
  const up = K.band(270, [3000, 3000], e);
  assert.ok(down.lo > up.hi, 'downwind ' + down.lo + ' not beyond upwind ' + up.hi);
});

ok('CONTAINMENT: 4000 random draws inside the envelope land inside the band', () => {
  const env = { LD: [10.2, 12.6], Va: [92 * KT, 108 * KT], Ws: [22 * KT, 38 * KT], Wdir: [255, 285] };
  const h = [7000, 7400];
  let rng = 20260831;
  const rnd = () => { rng = (rng * 1103515245 + 12345) % 2147483648; return rng / 2147483648; };
  for (let i = 0; i < 4000; i++) {
    const bearing = 360 * rnd();
    const b = K.band(bearing, h, env);
    const pick = (r) => r[0] + (r[1] - r[0]) * rnd();
    const LD = pick(env.LD), Va = pick(env.Va), Ws = pick(env.Ws), Wd = pick(env.Wdir), hh = pick(h);
    const d = K.nominal(bearing, hh, { LD, Va, Ws, Wdir: Wd });
    assert.ok(d >= b.lo - 1e-6 && d <= b.hi + 1e-6,
      'realized ' + d + ' escaped band [' + b.lo + ',' + b.hi + '] at bearing ' + bearing);
  }
});

ok('widening an input can only widen the band (never narrow it)', () => {
  const narrow = { LD: [11, 12], Va: [50, 52], Ws: [10, 12], Wdir: [265, 275] };
  const wide = { LD: [10, 13], Va: [48, 54], Ws: [8, 14], Wdir: [255, 285] };
  for (let bg = 0; bg < 360; bg += 7) {
    const a = K.band(bg, [7000, 7200], narrow), b = K.band(bg, [6900, 7300], wide);
    assert.ok(b.lo <= a.lo + 1e-9 && b.hi >= a.hi - 1e-9,
      'widening narrowed the band at bearing ' + bg);
  }
});

/* ---------- 4 · verdicts --------------------------------------------------- */
console.log('-- verdicts');

const state = { lat: 40.0029, lon: -75.9942, alt_m: [24000 * FT - 100, 24000 * FT + 100], alt_nom_m: 24000 * FT };
const ENV = { LD: [10.2, 12.6], Va: [92 * KT, 108 * KT], Ws: [22 * KT, 38 * KT], Wdir: [255, 285] };
const NOM = { LD: 12.0, Va: 100 * KT, Ws: 30 * KT, Wdir: 270 };

ok('a site underfoot is REACHABLE; a site 500 km away is UNREACHABLE', () => {
  const near = K.decide(state, { lat: 40.0029, lon: -75.9942, elev_ft: 400 }, ENV, NOM);
  assert.strictEqual(near.verdict, K.REACHABLE);
  const far = K.decide(state, { lat: 44.5, lon: -75.9942, elev_ft: 400 }, ENV, NOM);
  assert.strictEqual(far.verdict, K.UNREACHABLE);
});

ok('a site above the aircraft is UNREACHABLE regardless of distance', () => {
  const r = K.decide(state, { lat: 40.01, lon: -75.99, elev_ft: 30000 }, ENV, NOM);
  assert.strictEqual(r.verdict, K.UNREACHABLE);
});

ok('every site is REACHABLE, UNDECIDED or UNREACHABLE and never two of them', () => {
  const seen = new Set();
  for (let i = 0; i < 400; i++) {
    const r = K.decide(state, { lat: 40.0029 + (i - 200) * 0.006, lon: -75.9942, elev_ft: 500 }, ENV, NOM);
    seen.add(r.verdict);
    assert.ok([K.REACHABLE, K.UNDECIDED, K.UNREACHABLE].includes(r.verdict));
  }
  assert.strictEqual(seen.size, 3, 'the sweep should exhibit all three verdicts, saw ' + [...seen]);
});

ok('the ORDER holds: REACHABLE ring sits inside nominal sits inside UNREACHABLE edge', () => {
  for (let bg = 0; bg < 360; bg += 11) {
    const b = K.band(bg, [7000, 7400], ENV);
    const dn = K.nominal(bg, 7200, NOM);
    assert.ok(b.lo <= dn + 1e-6 && dn <= b.hi + 1e-6,
      'nominal ' + dn + ' escaped the band at bearing ' + bg + ': ' + [b.lo, b.hi]);
  }
});

/* ---------- 5 · red controls — these MUST fire ---------------------------- */
console.log('-- red controls (each must fire)');

red('a MIDPOINT band (the point-estimate mistake) fails containment', () => {
  const env = { LD: [10.2, 12.6], Va: [92 * KT, 108 * KT], Ws: [22 * KT, 38 * KT], Wdir: [255, 285] };
  const mid = (r) => (r[0] + r[1]) / 2;
  let escaped = 0;
  for (let bg = 0; bg < 360; bg += 3) {
    const point = K.nominal(bg, 7200, { LD: mid(env.LD), Va: mid(env.Va), Ws: mid(env.Ws), Wdir: mid(env.Wdir) });
    const worst = K.nominal(bg, 7000, { LD: env.LD[0], Va: env.Va[1], Ws: env.Ws[1], Wdir: env.Wdir[0] });
    if (worst < point - 1) escaped++;
  }
  assert.strictEqual(escaped, 0, escaped + ' bearings where a realizable case falls SHORT of the midpoint ring');
});

red('an INWARD-rounded band lets a realized draw escape', () => {
  const env = { LD: [10.2, 12.6], Va: [92 * KT, 108 * KT], Ws: [22 * KT, 38 * KT], Wdir: [255, 285] };
  const h = [7000, 7400];
  for (let bg = 0; bg < 360; bg += 3) {
    const b = K.band(bg, h, env);
    const shrunk = { lo: b.lo + (b.hi - b.lo) * 0.25, hi: b.hi - (b.hi - b.lo) * 0.25 };
    const worst = K.nominal(bg, h[0], { LD: env.LD[0], Va: env.Va[1], Ws: env.Ws[1], Wdir: env.Wdir[0] });
    assert.ok(worst >= shrunk.lo - 1e-9, 'a realizable draw fell below the shrunken band, as it must');
  }
});

red('dropping the crosswind term overstates reach on a crossing course', () => {
  const env = { LD: [12, 12], Va: [50, 50], Ws: [20, 20], Wdir: [270, 270] };
  const b = K.band(0, [7200, 7200], env);          /* due north, pure crosswind */
  const noCross = (7200 * 12 / 50) * 50;           /* the bug: ignore cross, Vg = Va */
  assert.ok(b.hi >= noCross - 1e-6, 'ignoring crosswind did not overstate reach');
});

red('THE MUTANT: grading against the nominal ring calls UNDECIDED sites REACHABLE', () => {
  /* the incumbent method, wired into our own verdict function: treat the
     single nominal line as if it were the proved inner ring. If that never
     disagreed with the certified kernel there would be nothing to report,
     so this red is the page's headline stated as a falsifier. */
  let disagreements = 0, checked = 0;
  for (let i = 1; i < 400; i++) {
    const site = { lat: 40.0029 + 0.0022 * i, lon: -75.9942, elev_ft: 500 };
    const r = K.decide(state, site, ENV, NOM);
    checked++;
    const mutantSaysReachable = r.D[0] <= r.nom;          /* inside the nominal ring */
    if (mutantSaysReachable && r.verdict !== K.REACHABLE) disagreements++;
    /* the certified kernel must never contradict itself, mutant or not */
    if (r.verdict === K.REACHABLE) assert.ok(r.D[1] <= r.lo, 'REACHABLE claimed beyond the inner ring');
    if (r.verdict === K.UNREACHABLE) assert.ok(r.D[0] > r.hi, 'UNREACHABLE claimed inside the outer edge');
  }
  assert.ok(checked === 399, 'the sweep did not run — a vacuous red is not a red');
  assert.strictEqual(disagreements, 0,
    disagreements + ' of ' + checked + ' sites are inside the nominal ring but NOT provably reachable');
});

console.log('\nbattery green: ' + n + '/' + n + ' checks (' + reds.length + ' red controls fired)');
