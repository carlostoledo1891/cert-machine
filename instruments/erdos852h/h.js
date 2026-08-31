/* erdos852h — h(x) for Erdős #852, computed exactly in integers.

   #852 (erdosproblems.com/852, pinned in corpus/sources/erdos852_page.html):
   let d_n = p_{n+1} - p_n; let h(x) be maximal such that for some n < x the
   numbers d_n .. d_{n+h(x)-1} are all distinct. Estimate h(x).

   The thread conjectures h(x) ~ c0 log x, on a constant this repo certified to
   61 digits (certs/erdos852-certificate.json). This instrument computes the
   OTHER half — the data — so the two can finally be compared.

   NO FLOATS ANYWHERE. A run is a window of integer gaps with no repeat; a
   record is the first index whose window beats every earlier one. Both are
   integer comparisons, so a record here is a fact about the integers.

   ALGORITHM. Longest-repeat-free-window by two pointers: for each j, `left`
   is the smallest start such that gaps[left..j] are pairwise distinct. When a
   gap repeats, `left` jumps past its previous occurrence. Each gap is visited
   O(1) times and only a 1024-entry last-seen table is held, so the scan
   STREAMS — memory is independent of the limit, which is what lets this run
   past the published records instead of stopping where RAM does.

   usage: node instruments/erdos852h/h.js [limit] [--json out.json] */
'use strict';
const fs = require('fs');

const SEG = 1 << 22;                            /* segment span, in integers */

/* base odd primes for the segmented sieve, up to sqrt(limit) */
function basePrimes(bound) {
  const n = (bound >> 1) + 1;
  const c = new Uint8Array(n);
  const out = [];
  for (let i = 1; i < n; i++) {
    if (c[i]) continue;
    const p = 2 * i + 1;
    if (p * p <= bound) for (let j = (p * p - 1) >> 1; j < n; j += p) c[j] = 1;
    out.push(p);
  }
  return out;
}

/* stream every prime <= limit, in order, to cb(p) */
function eachPrime(limit, cb) {
  cb(2);
  const root = Math.floor(Math.sqrt(limit));
  const base = basePrimes(root + 1);
  const mark = new Uint8Array(SEG >> 1);
  for (let lo = 3; lo <= limit; lo += SEG) {
    const hi = Math.min(lo + SEG - 1, limit);
    const cnt = ((hi - lo) >> 1) + 1;
    mark.fill(0, 0, cnt);
    for (const p of base) {
      if (p * p > hi) break;
      let s = Math.max(p * p, Math.ceil(lo / p) * p);
      if ((s & 1) === 0) s += p;
      for (let m = s; m <= hi; m += 2 * p) mark[(m - lo) >> 1] = 1;
    }
    for (let i = 0; i < cnt; i++) if (!mark[i]) cb(lo + 2 * i);
  }
}

/* the record scan */
function records(limit, onRecord) {
  /* Float64Array, NOT Int32Array: these hold GAP INDICES, which pass 2^31
     around the 2.1-billionth prime. In an Int32Array the stored index wraps
     negative there, `last >= left` silently goes false, the window stops
     being cut at repeats and the run length explodes — observed as a bogus
     "record" of length 14,730,343 at index 2147483648 exactly. Float64 is
     exact on integers to 2^53, which is far past any reachable prime index. */
  const seen = new Float64Array(1024).fill(-1);  /* gap value -> last index seen */
  const out = [];
  let prev = 0, idx = 0;                        /* idx = index of the gap d_idx */
  let left = 1, best = 0;
  /* to report a record's STARTING PRIME we keep only the primes still inside
     the live window — at most ~40 of them, so this stays O(1) memory */
  const ring = new Map();                       /* gap index -> prime opening it */

  eachPrime(limit, (p) => {
    if (prev === 0) { prev = p; return; }
    idx++;
    const g = p - prev;
    ring.set(idx, prev);
    if (g < 1024) {
      const last = seen[g];
      if (last >= left) {
        for (let k = left; k <= last; k++) ring.delete(k);
        left = last + 1;
      }
      seen[g] = idx;
    }
    const len = idx - left + 1;
    if (len > best) {
      best = len;
      const rec = { n: left, p: ring.get(left), len };
      out.push(rec);
      if (onRecord) onRecord(rec);
    }
    prev = p;
  });
  return out;
}

if (require.main === module) {
  const LIMIT = Number(process.argv[2] || 3e8);
  const ji = process.argv.indexOf('--json');
  const t0 = Date.now();
  const R = records(LIMIT, (r) =>
    console.log('  record len ' + String(r.len).padStart(3) + '  index ' + String(r.n).padStart(13)
      + '  prime ' + String(r.p).padStart(16) + '   +' + ((Date.now() - t0) / 1000).toFixed(1) + 's'));
  const secs = (Date.now() - t0) / 1000;
  console.log('limit ' + LIMIT + ' · ' + R.length + ' records · ' + secs.toFixed(1) + ' s');
  if (ji > 0) {
    fs.writeFileSync(process.argv[ji + 1], JSON.stringify({
      limit: LIMIT, seconds: Number(secs.toFixed(1)),
      records: R.map(r => ({ n: r.n, p: r.p, len: r.len }))
    }, null, 2) + '\n');
    console.log('written: ' + process.argv[ji + 1]);
  }
}

module.exports = { records, eachPrime, basePrimes };
