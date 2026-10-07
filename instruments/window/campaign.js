/* campaign.js — how long a campaign of N operations takes from a start date, in every year of a hindcast, counted.
   instruments/window · cert-machine

   The decommissioning engineer's question is not "how often does March offer a window" (workability.js
   answers that) but "if we mobilise on 1 March for ten lifts, each needing 48 h under Hs 1.5 m, when are
   we done?" Over a hindcast the answer is not a model's: it is what each year's own sea would have done.
   For every year of the series the campaign is RUN, operation after operation:

     window(k)   the samples k .. k + TR/stepH all present and inside the limit (both ends included —
                 workability.js's definition, re-checked against it by the battery, never shared code:
                 workability.js is pinned by the record it wrote);
     operation   starts at the first k >= the cursor with a window, occupies the window, and the next
                 operation searches from the end of it (back to back: no transit, no weather standby rule);
     duration    hours from the start date's 00 UTC to the end of the N-th window — an integer;
     censored    a year whose campaign is not finished before the series ends (counted, never guessed).

   The durations of the years are then read as ORDER STATISTICS, exactly: the q-quantile is the
   ceil(q·n)-th smallest of the n finished years (n = 32 for 1993-2024), the worst is the largest.
   A limit is compared as integers (x · den <= num · scale), so no float decides a window.

   Planning, not forecasting: the hindcast is a model of the past sea (here WAVEWATCH III forced by
   ERA5); the counts are exact over it, and that is all they claim.

   Pure; runs in Node and in the reader's tab. MIT licensed. Part of cert-machine.                   */
'use strict';

const Q = require('./q.js');

/* campaign(series, { limit, TR, N, start: 'MM-DD' })
   series: { x: int[], times: 'YYYY-MM-DDTHH'[], stepH, scale, fill }
   -> { years: [{ year, start, end, hours, waitH, ops, censored }], finished, censored, q50, q80, q90, worst, best } */
function campaign(series, opts) {
  const { x, times, stepH, scale, fill } = series;
  if (x.length !== times.length) throw new Error('REFUSED: series and times differ in length');
  const TR = Number(opts.TR), N = Number(opts.N);
  if (!(TR >= 0) || TR % stepH !== 0) throw new Error('REFUSED: TR must be a non-negative multiple of the ' + stepH + ' h step');
  if (!Number.isInteger(N) || N < 1) throw new Error('REFUSED: N must be a positive integer');
  if (!/^\d\d-\d\d$/.test(String(opts.start)) || String(opts.start) === '02-29') throw new Error('REFUSED: start is MM-DD (not 29 February: not every year has one)');
  const [num, den] = Q.parse(opts.limit);
  const S = BigInt(scale), span = TR / stepH, n = x.length;
  const run = new Int32Array(n + 1);
  for (let k = n - 1; k >= 0; k--) {
    const v = x[k];
    const ok = v !== fill && v !== null && v !== undefined && BigInt(v) * den <= num * S;
    run[k] = ok ? run[k + 1] + 1 : 0;
  }
  const index = new Map(times.map((t, k) => [t, k]));
  const yearsOf = [...new Set(times.map((t) => t.slice(0, 4)))];
  const years = [];
  for (const y of yearsOf) {
    const s0 = index.get(y + '-' + opts.start + 'T00');
    if (s0 === undefined) continue;                      /* the start date is outside the series this year */
    let cur = s0, wait = 0, censored = false;
    const ops = [];
    for (let i = 0; i < N; i++) {
      let k = cur;
      while (k < n && run[k] < span + 1) k++;
      if (k >= n || k + span >= n) { censored = true; break; }
      wait += (k - cur) * stepH;
      ops.push(times[k]);
      cur = k + span;
    }
    years.push(censored ? { year: Number(y), start: times[s0], censored: true, ops: ops.length }
      : { year: Number(y), start: times[s0], end: times[cur], hours: (cur - s0) * stepH, waitH: wait, ops: ops.length, censored: false });
  }
  const done = years.filter((r) => !r.censored).map((r) => r.hours).sort((a, b) => a - b);
  const os = (q) => (done.length ? done[Math.max(1, Math.ceil(q * done.length)) - 1] : null);
  return { years, finished: done.length, censored: years.length - done.length, q50: os(0.5), q80: os(0.8), q90: os(0.9),
    worst: done.length ? done[done.length - 1] : null, best: done.length ? done[0] : null,
    worstYear: done.length ? years.find((r) => !r.censored && r.hours === done[done.length - 1]).year : null };
}

module.exports = { campaign };
