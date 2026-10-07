/* battery.js — the window instrument's gate: workability counted by hand on
   series small enough to check on paper, the decider's four verdicts on
   hand-built bands, units converted exactly, and reds that must fire.
   Run: node instruments/window/battery.js   (exit != 0 on any failure)
   instruments/window · cert-machine                                      */
'use strict';

const assert = require('assert');
const W = require('./workability.js');
const D = require('./decide.js');
const Q = require('./q.js');

let n = 0, reds = 0;
const ok = (name, fn) => { fn(); n++; console.log('PASS ' + name); };
const red = (name, fn) => { fn(); reds++; console.log('PASS ' + name + ' (RED ok)'); };
const throwsRefused = (fn) => assert.throws(fn, /REFUSED/);

/* a tiny 3-hourly series in metres*500 (the hindcast's own packing) */
const T = (k) => { const d = new Date(Date.UTC(2020, 0, 31, 12) + k * 3 * 3600e3); return d.toISOString().slice(0, 13); };
const series = (xs, fill = -32767) => ({ x: xs, times: xs.map((_, k) => T(k)), stepH: 3, scale: 500, fill });

/* ---- workability: counts by hand ------------------------------------------ */
ok('hand count: limit 2.0 m, TR 6 h (3 samples) on [1,1,3,1,1,1] m -> 1 workable start of 4 determined', () => {
  const s = series([500, 500, 1500, 500, 500, 500]);          /* metres 1,1,3,1,1,1 */
  const r = W.workability(s, { limit: '2.0', TR: 6 });
  /* starts k=0..3 have a full window; k=0,1 hit the 3 m sample; k=2 starts on it; k=3 = [1,1,1] workable */
  assert.strictEqual(r.all.starts, 4);
  assert.strictEqual(r.all.workable, 1);
  assert.strictEqual(r.all.undetermined, 2);                   /* k=4,5 run past the end */
  assert.strictEqual(r.all.fraction, '1/4');
  /* waits: k0 -> 9 h, k1 -> 6 h, k2 -> 3 h, k3 -> 0 h; mean 18/4 = 9/2 h */
  assert.strictEqual(r.all.meanWaitH, '9/2');
});

ok('the limit is inclusive and exact: a sample of exactly 2.000 m is inside "<= 2.0", 2.002 m is not', () => {
  assert.strictEqual(W.workability(series([1000]), { limit: '2.0', TR: 0 }).all.workable, 1);
  assert.strictEqual(W.workability(series([1001]), { limit: '2.0', TR: 0 }).all.workable, 0);
  assert.strictEqual(W.workability(series([1001]), { limit: [1001, 500], TR: 0 }).all.workable, 1);
});

ok('a missing sample makes every window touching it UNDETERMINED, never workable or not', () => {
  const r = W.workability(series([500, -32767, 500, 500, 500]), { limit: '2.0', TR: 3 });
  /* windows (k,k+1): k0 has the gap, k1 has the gap, k2 and k3 are workable, k4 runs off the end */
  assert.strictEqual(r.all.undetermined, 3);
  assert.strictEqual(r.all.starts, 2);
  assert.strictEqual(r.all.workable, 2);
});

ok('starts are binned by their own month: a series crossing 31 Jan -> 1 Feb splits 4 + rest', () => {
  const r = W.workability(series([500, 500, 500, 500, 500, 500, 500, 500]), { limit: '2.0', TR: 0 });
  assert.strictEqual(r.months[0].starts, 4);                    /* 12,15,18,21 h on 31 Jan */
  assert.strictEqual(r.months[1].starts, 4);
});

red('RED: a TR that is not a multiple of the step is REFUSED', () => {
  throwsRefused(() => W.workability(series([500, 500]), { limit: '2.0', TR: 4 }));
});
red('RED: a float limit is REFUSED (limits are decimal strings as printed)', () => {
  throwsRefused(() => W.workability(series([500]), { limit: 2.0000001, TR: 0 }));
});

/* ---- units: exact -------------------------------------------------------- */
ok('knots are exact: 1 kn = 1852/3600 m/s = 463/900, and 22 kn round-trips with no residue', () => {
  assert.strictEqual(Q.str(Q.KN), '463/900');
  const ms = Q.toMs(Q.parse('22'));
  assert.strictEqual(Q.str(ms), '5093/450');
  assert.strictEqual(Q.str(Q.toKnots(ms)), '22');
});
ok('sqrt enclosure exact at any size: a 61-digit rational enclosed within 1e-6, lo^2 <= a <= hi^2', () => {
  const a = [10n ** 61n + 12345n, 7n];
  const [lo, hi] = Q.sqrtEnc(a);
  assert.ok(Q.cmp(Q.mul(lo, lo), a) <= 0 && Q.cmp(Q.mul(hi, hi), a) >= 0);
  assert.ok(Q.cmp(Q.sub(hi, lo), Q.parse('0.000001')) <= 0);
  assert.deepStrictEqual(Q.sqrtEnc([49n, 4n]), [[7n, 2n], [7n, 2n]]);
});
ok('outward display rounding: 2.001 shown up is 2.01, down is 2.00; half-up default 2.00', () => {
  assert.strictEqual(Q.dec(Q.parse('2.001'), 2, 'up'), '2.01');
  assert.strictEqual(Q.dec(Q.parse('2.001'), 2, 'down'), '2.00');
  assert.strictEqual(Q.dec(Q.parse('2.001'), 2), '2.00');
  assert.strictEqual(Q.dec(Q.parse('-2.001'), 2, 'up'), '-2.00');
});

/* ---- the decider: four verdicts on hand-built bands ------------------------ */
const rule = { id: 'test-terminal', limits: [
  { var: 'hs', op: '<', value: '2.0', unit: 'm' },
  { var: 'wind_sustained', op: '<', value: '22', unit: 'kn' },
] };
const fc = (bands) => ({ unit: { hs: 'm', wind_sustained: 'kn' }, coverage: '9/10', proposer: 'test',
  steps: bands.map((b, k) => ({ t: '2026-10-0' + (k + 1) + 'T00', vars: { hs: { lo: b[0], hi: b[1] }, wind_sustained: { lo: b[2], hi: b[3] } } })) });
const W3 = ['2026-10-01T00', '2026-10-03T00'];

ok('LIBERADA: every unfavourable edge inside both limits at all three steps', () => {
  const v = D.decide(rule, fc([['1.0', '1.9', '10', '21'], ['1.2', '1.99', '8', '15'], ['0.8', '1.5', '5', '12']]), W3);
  assert.strictEqual(v.verdict, 'LIBERADA');
  assert.strictEqual(v.en, 'CLEARED');
});
ok('VETADA with its witness: the favourable edge already breaks Hs < 2.0 at step 2', () => {
  const v = D.decide(rule, fc([['1.0', '1.9', '10', '21'], ['2.0', '2.6', '8', '15'], ['0.8', '1.5', '5', '12']]), W3);
  assert.strictEqual(v.verdict, 'VETADA');
  assert.strictEqual(v.witness.t, '2026-10-02T00');
  assert.strictEqual(v.witness.var, 'hs');
});
ok('INDEFINIDA with the flip threshold: Hs band [1.6, 2.3] needs its upper edge 0.30 m lower', () => {
  const v = D.decide(rule, fc([['1.0', '1.9', '10', '21'], ['1.6', '2.3', '8', '15'], ['0.8', '1.5', '5', '12']]), W3);
  assert.strictEqual(v.verdict, 'INDEFINIDA');
  assert.strictEqual(v.flip.length, 1);
  assert.strictEqual(v.flip[0].var, 'hs');
  assert.strictEqual(v.flip[0].gap, '3/10');
  assert.strictEqual(v.flip[0].t, '2026-10-02T00');
});
ok('the edge is exact: an upper edge of exactly 2.0 under a strict "< 2.0" is INDEFINIDA, not LIBERADA', () => {
  const v = D.decide(rule, fc([['1.0', '2.0', '10', '21']]), ['2026-10-01T00', '2026-10-01T00']);
  assert.strictEqual(v.verdict, 'INDEFINIDA');
  assert.strictEqual(v.flip[0].gap, '0');
});
ok('SEM DADOS: Hs and wind clear, but the rule also limits current, which the feed does not forecast', () => {
  const r2 = { id: 'with-current', limits: [...rule.limits, { var: 'current', op: '<', value: '1.2', unit: 'kn' }, { var: 'draft', op: '<=', value: '13.2', unit: 'm' }] };
  const v = D.decide(r2, fc([['1.0', '1.9', '10', '21']]), ['2026-10-01T00', '2026-10-01T00']);
  assert.strictEqual(v.verdict, 'SEM DADOS');
  assert.deepStrictEqual(v.notForecast, ['current']);
  assert.deepStrictEqual(v.vesselLimits, ['draft <= 13.2 m']);
});
ok('a refutation outranks a missing variable: VETADA stands even when current is not forecast', () => {
  const r2 = { id: 'with-current', limits: [...rule.limits, { var: 'current', op: '<', value: '1.2', unit: 'kn' }] };
  const v = D.decide(r2, fc([['2.1', '2.5', '10', '21']]), ['2026-10-01T00', '2026-10-01T00']);
  assert.strictEqual(v.verdict, 'VETADA');
});
ok('a ">" limit (visibility) uses the lower edge as the unfavourable one', () => {
  const r3 = { id: 'vis', limits: [{ var: 'visibility', op: '>', value: '1.0', unit: 'NM' }] };
  const f = { unit: { visibility: 'NM' }, steps: [{ t: '2026-10-01T00', vars: { visibility: { lo: '1.5', hi: '8' } } }] };
  assert.strictEqual(D.decide(r3, f, ['2026-10-01T00', '2026-10-01T00']).verdict, 'LIBERADA');
  f.steps[0].vars.visibility.lo = '0.5';
  assert.strictEqual(D.decide(r3, f, ['2026-10-01T00', '2026-10-01T00']).verdict, 'INDEFINIDA');
});

red('RED: a unit mismatch (wind forecast in m/s against a limit in knots) is REFUSED, never silently compared', () => {
  const f = fc([['1.0', '1.9', '10', '21']]); f.unit.wind_sustained = 'm/s';
  throwsRefused(() => D.decide(rule, f, ['2026-10-01T00', '2026-10-01T00']));
});
red('RED: a float band edge is REFUSED', () => {
  throwsRefused(() => D.decide(rule, fc([[1.0, 1.9, '10', '21']]), ['2026-10-01T00', '2026-10-01T00']));
});
red('RED: a rule limiting an unknown variable is REFUSED', () => {
  throwsRefused(() => D.decide({ id: 'x', limits: [{ var: 'swell_mood', op: '<', value: '1', unit: '' }] }, fc([['1', '1', '1', '1']]), W3));
});
red('RED: a window with no forecast step is RECUSADA, not LIBERADA', () => {
  assert.strictEqual(D.decide(rule, fc([['1.0', '1.9', '10', '21']]), ['2027-01-01T00', '2027-01-02T00']).verdict, 'RECUSADA');
});

/* ---- campaign.js: N operations back to back from a start date, every year of the series ---- */
const CP = require('./campaign.js');
/* two "years" of a daily-start toy series: 3-hourly, starting each 1 March 00 UTC */
const yearSeries = (vals) => {
  const x = [], times = [];
  for (const [y, xs] of vals) xs.forEach((v, k) => { x.push(v); times.push(new Date(Date.UTC(y, 2, 1) + k * 3 * 3600e3).toISOString().slice(0, 13)); });
  return { x, times, stepH: 3, scale: 500, fill: -32767 };
};
ok('campaign by hand: two 6 h operations under 2.0 m on [1,3,1,1,1,1,1] m from 1 March -> the first window at 06h, the second at 12h, done at 18h (18 h)', () => {
  const s = yearSeries([[2021, [500, 1500, 500, 500, 500, 500, 500]]]);
  const r = CP.campaign(s, { limit: '2.0', TR: 6, N: 2, start: '03-01' });
  assert.deepStrictEqual(r.years[0], { year: 2021, start: '2021-03-01T00', end: '2021-03-01T18', hours: 18, waitH: 6, ops: 2, censored: false });
});
ok('campaign: one operation is the first workable start plus TR — and workability.js agrees which start that is, slice by slice', () => {
  const xs = [1500, 1500, 500, 1500, 500, 500, 500, 500, 1500, 500];
  const s = yearSeries([[2021, xs]]);
  const r = CP.campaign(s, { limit: '2.0', TR: 6, N: 1, start: '03-01' });
  assert.strictEqual(r.years[0].waitH, 12);                    /* the first window [k=4..6] starts 12 h in */
  assert.strictEqual(r.years[0].hours, 18);
  /* workability.js on each 3-sample slice: the first workable one is the campaign's start, and none before it */
  const slice = (k) => ({ x: s.x.slice(k, k + 3), times: s.times.slice(k, k + 3), stepH: 3, scale: 500, fill: -32767 });
  const firstK = r.years[0].waitH / 3;
  assert.strictEqual(W.workability(slice(firstK), { limit: '2.0', TR: 6 }).all.workable, 1);
  for (let j = 0; j < firstK; j++) assert.strictEqual(W.workability(slice(j), { limit: '2.0', TR: 6 }).all.workable, 0, 'slice ' + j);
});
ok('campaign quantiles are order statistics: 4 years finishing in 6, 9, 12, 30 h -> median the 2nd (9 h), q90 the 4th (30 h), worst 30 h', () => {
  const ok6 = [500, 500, 500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500];
  const ok9 = [1500, 500, 500, 500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500];
  const ok12 = [1500, 1500, 500, 500, 500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500];
  const ok30 = [1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 500, 500, 500, 1500, 1500, 1500];
  const r = CP.campaign(yearSeries([[2021, ok6], [2022, ok9], [2023, ok12], [2024, ok30]]), { limit: '2.0', TR: 6, N: 1, start: '03-01' });
  assert.deepStrictEqual([r.finished, r.q50, r.q90, r.worst, r.worstYear, r.best], [4, 9, 30, 30, 2024, 6]);
});
red('RED: a campaign the series cannot finish is CENSORED, never given the end of the record as its finish', () => {
  const r = CP.campaign(yearSeries([[2021, [1500, 1500, 500, 500, 500, 1500]]]), { limit: '2.0', TR: 6, N: 2, start: '03-01' });
  assert.deepStrictEqual([r.years[0].censored, r.years[0].ops, r.finished, r.q50], [true, 1, 0, null]);
});
red('RED: 29 February, a float limit and a TR off the 3 h grid are REFUSED', () => {
  const s = yearSeries([[2021, [500, 500, 500]]]);
  throwsRefused(() => CP.campaign(s, { limit: '2.0', TR: 6, N: 1, start: '02-29' }));
  throwsRefused(() => CP.campaign(s, { limit: 2.5, TR: 6, N: 1, start: '03-01' }));
  throwsRefused(() => CP.campaign(s, { limit: '2.0', TR: 5, N: 1, start: '03-01' }));
});

console.log('ALL PASS: ' + n + ' checks, ' + reds + ' reds fired');
