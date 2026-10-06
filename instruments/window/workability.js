/* workability.js — how often the sea lets an operation run, counted exactly.
   instruments/window · cert-machine

   An operation needs a WINDOW: a stretch of TR hours in which the sea state
   stays inside its limit (DNV's reference period TR = TPOP + TC). Over a
   hindcast, the question "how often does month m offer such a window?" is
   a COUNT, and this module answers it as one: every start time is either
   workable or not, and the workability of a month is workable/determined,
   an exact fraction of integers. Nothing is fitted, nothing is smoothed,
   no float decides.

   Definitions (stated once, used by every consumer — the page, the alpha
   audit, the battery):
     samples      an integer series x_k on a regular step of `stepH` hours,
                  value = x_k / scale (the hindcast's own packing), `fill`
                  for a missing sample;
     window(k)    the samples k, k+1, ..., k + TR/stepH (both ends included:
                  a 12 h window on a 3 h series is five samples);
     workable(k)  every sample in window(k) is present and x <= limit,
                  compared as integers: x * den <= num * scale for a limit
                  num/den (metres) — exact;
     determined   window(k) lies inside the series and has no missing sample
                  (a window with a gap is UNDETERMINED, counted, never guessed);
     wait(k)      hours from k to the first workable start j >= k; a start
                  with no workable start before the series ends is CENSORED
                  (counted, excluded from the mean).
   A start belongs to the calendar month of its own time stamp.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const Q = require('./q.js');
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const frac = (n, d) => { n = BigInt(n); d = BigInt(d); if (d === 0n) return null; const g = gcd(n, d) || 1n; return (n / g) + '/' + (d / g); };

/* limits parse through q.js: decimal strings or [num, den]; a float is REFUSED */
const q = (v) => Q.parse(v);

/* workability(series, opts)
   series: { x: int[], times: ISO 'YYYY-MM-DDTHH'[], stepH, scale, fill }
   opts:   { limit: decimal string (m) or [num,den], TR: hours (multiple of stepH) }
   -> { months: [12 × {starts, workable, undetermined, fraction, waitSumH, waited, censored, meanWaitH}], all: {...} } */
function workability(series, opts) {
  const { x, times, stepH, scale, fill } = series;
  if (x.length !== times.length) throw new Error('REFUSED: series and times differ in length');
  const TR = Number(opts.TR);
  if (!(TR >= 0) || TR % stepH !== 0) throw new Error('REFUSED: TR must be a non-negative multiple of the ' + stepH + ' h step');
  const [num, den] = q(opts.limit);
  const S = BigInt(scale);
  const span = TR / stepH;
  const n = x.length;
  const ok = new Uint8Array(n);                    /* sample inside the limit, present */
  const miss = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    if (x[k] === fill || x[k] === null || x[k] === undefined) { miss[k] = 1; continue; }
    ok[k] = BigInt(x[k]) * den <= num * S ? 1 : 0;
  }
  /* run lengths from each k forward: how many consecutive ok samples start at k */
  const run = new Int32Array(n + 1);
  for (let k = n - 1; k >= 0; k--) run[k] = ok[k] ? run[k + 1] + 1 : 0;
  /* any missing sample in [k, k+span]? prefix count of missing */
  const pm = new Int32Array(n + 1);
  for (let k = 0; k < n; k++) pm[k + 1] = pm[k] + miss[k];
  const state = new Int8Array(n);                  /* 1 workable, 0 not, -1 undetermined */
  for (let k = 0; k < n; k++) {
    if (k + span >= n || pm[k + span + 1] - pm[k] > 0) { state[k] = -1; continue; }
    state[k] = run[k] >= span + 1 ? 1 : 0;
  }
  /* next workable start at or after k */
  const next = new Int32Array(n + 1); next[n] = -1;
  for (let k = n - 1; k >= 0; k--) next[k] = state[k] === 1 ? k : next[k + 1];
  const blank = () => ({ starts: 0, workable: 0, undetermined: 0, waitSum: 0n, waited: 0, censored: 0 });
  const months = Array.from({ length: 12 }, blank);
  const all = blank();
  for (let k = 0; k < n; k++) {
    const m = Number(times[k].slice(5, 7)) - 1;
    for (const b of [months[m], all]) {
      if (state[k] === -1) { b.undetermined++; continue; }
      b.starts++;
      if (state[k] === 1) b.workable++;
      if (next[k] === -1) b.censored++;
      else { b.waitSum += BigInt((next[k] - k) * stepH); b.waited++; }
    }
  }
  const out = (b) => ({
    starts: b.starts, workable: b.workable, undetermined: b.undetermined,
    fraction: frac(b.workable, b.starts), waited: b.waited, censored: b.censored,
    waitSumH: String(b.waitSum), meanWaitH: frac(b.waitSum, b.waited),
  });
  return { limit: num + '/' + den, TR, stepH, scale, rule: 'window = samples k..k+TR/step inclusive; workable iff all present and x*den <= num*scale',
    months: months.map(out), all: out(all) };
}

/* a fraction "n/d" as a decimal string with `places` digits, rounded half up — for display only */
function decimal(f, places) {
  if (f === null) return null;
  let [n, d] = f.split('/').map(BigInt); d = d || 1n;
  const neg = n < 0n; if (neg) n = -n;
  const p = 10n ** BigInt(places);
  const r = (n * p * 2n + d) / (2n * d);
  const s = r.toString().padStart(places + 1, '0');
  return (neg ? '-' : '') + (places ? s.slice(0, -places) + '.' + s.slice(-places) : s);
}

module.exports = { workability, decimal, q, frac };
