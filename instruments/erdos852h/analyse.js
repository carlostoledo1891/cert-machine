/* erdos852h/analyse — the comparison nobody had made.

   Erdős #852 has two halves that have never been in the same room:

     the CONSTANT  the discussion thread conjectures h(x) ~ c0 log x, and this
                   repo certified c0 to 61 digits in certs/erdos852-certificate.json
     the DATA      A053597 / A078515 / A079007 / A079889 have held the exact
                   record runs since 2002, computed by other people

   The problem page cites the sequences in its OEIS box and the thread states
   the constant; neither does anything with the other. This module crosses
   them, and the crossing turns on a reading of the problem statement.

   THE READING. As published, #852 says: "let h(x) be maximal such that for
   some n < x the numbers d_n .. d_{n+h(x)-1} are all distinct." The bound is
   on n, and n INDEXES a prime — so x counts primes, not size. Read the other
   way (x as the prime bound) the same data gives a visibly different answer,
   so the two readings are carried side by side and the data is left to say
   which one the conjecture belongs to.

   THE BIAS THAT HAD TO BE REMOVED. h is a step function and its records are
   exactly its jumps, so sampling h/log x AT the records reads only the tops
   of the steps and flatters the ratio. Every plateau is therefore reported as
   a BAND — the ratio at the step's start and at its end — and the honest
   question is whether c0 lies inside the bands, not whether it matches a
   cherry-picked corner. */
'use strict';

/* c0, the unique positive root of I0(c) = 1, certified in this repo to 61
   digits. Only the leading digits are needed to compare against integers this
   size; the certificate is the authority and is re-read by the report. */
const C0 = 1.3232282768639494690289693932974634613586;

/* ---- the pinned OEIS terms, parsed from corpus/sources/oeis_*.txt --------- */
function parseOEIS(text) {
  const rows = text.split('\n').filter(l => /^%[STU]/.test(l));
  if (!rows.length) throw new Error('no %S/%T/%U data rows in the pinned OEIS file');
  return rows.map(l => l.replace(/^%[STU]\s+A\d+\s+/, '').trim())
    .join('').split(',').filter(Boolean).map(s => Number(s.trim()));
}

/* ---- records -> h as a step function ------------------------------------- */
/* Our scan emits one record per LENGTH, and a single index can set two
   lengths at once (index 19205 sets both 14 and 15, which is exactly why
   A079007 carries a duplicate there). A078515 lists DISTINCT indices, so
   collapsing on the index is what makes the two comparable. */
function distinctIndices(records) {
  const out = [];
  for (const r of records) if (!out.length || out[out.length - 1].n !== r.n) out.push({ n: r.n, p: r.p, len: r.len });
    else out[out.length - 1].len = Math.max(out[out.length - 1].len, r.len);
  return out;
}

/* h(x) under the INDEX reading: the largest run that has fully closed by x.
   A run of length L opening at index n occupies gaps n .. n+L-1, so it is
   available to h(x) only once x reaches n + L - 1. */
const hAtIndex = (recs, x) => {
  let v = 0;
  for (const r of recs) if (r.n + r.len - 1 <= x) v = Math.max(v, r.len);
  return v;
};

/* h under the PRIME reading: the run must close below the prime bound. The
   closing prime is not stored, so the opening prime is used — this makes the
   prime reading if anything slightly GENEROUS, and it still falls short. */
const hAtPrime = (recs, x) => {
  let v = 0;
  for (const r of recs) if (r.p <= x) v = Math.max(v, r.len);
  return v;
};

/* ---- the plateau bands --------------------------------------------------- */
/* Between one record closing and the next one closing, h is constant. Over
   that whole interval log x grows, so h/log x FALLS from a high at the step's
   start to a low at its end. Both ends are reported. */
function bands(recs) {
  const R = distinctIndices(recs);
  const out = [];
  for (let i = 0; i < R.length; i++) {
    const start = R[i].n + R[i].len - 1;
    if (start < 200) continue;                     /* log x is a poor guide this low */
    const end = (i + 1 < R.length) ? R[i + 1].n + R[i + 1].len - 2 : null;
    out.push({
      len: R[i].len, n: R[i].n, p: R[i].p, start, end,
      hi: R[i].len / Math.log(start),
      lo: end ? R[i].len / Math.log(end) : null
    });
  }
  return out;
}

/* ---- decade sampling ----------------------------------------------------- */
function decades(recs, maxX) {
  const out = [];
  for (let e = 3; e <= 12; e++) {
    const x = Math.pow(10, e);
    if (x > maxX) break;
    const h = hAtIndex(recs, x);
    if (!h) continue;
    out.push({ x, h, logx: Math.log(x), ratio: h / Math.log(x), pred: C0 * Math.log(x) });
  }
  return out;
}

/* ---- the verdict --------------------------------------------------------- */
/* The claim this module is willing to make, and no more: across the covered
   range, does c0 lie inside the plateau band? That is a statement about
   consistency, not a proof of the asymptotic — #852 is explicitly not
   finitely resolvable and this module never pretends otherwise. */
function consistency(bs) {
  const closed = bs.filter(b => b.lo !== null);
  const inside = closed.filter(b => C0 <= b.hi && C0 >= b.lo);
  return {
    plateaus: closed.length,
    inside: inside.length,
    outsideHigh: closed.filter(b => C0 > b.hi).length,
    outsideLow: closed.filter(b => C0 < b.lo).length
  };
}


/* ---- structural validation ----------------------------------------------
   A prefix check against OEIS is not enough on its own: the OEIS terms cover
   only the head of a deep run, so corruption ARRIVING LATER passes a prefix
   comparison untouched. That is not hypothetical — an Int32Array holding gap
   indices wrapped at the 2^31-st prime and produced a "record" of length
   14,730,343 at index 2147483648, sitting harmlessly past the last OEIS term.
   These are the checks that catch that class without needing a reference. */
function validate(records) {
  const R = distinctIndices(records);
  const bad = [];
  if (!R.length) bad.push('no records at all');
  for (let i = 0; i < R.length; i++) {
    const r = R[i];
    if (!Number.isSafeInteger(r.n) || r.n < 1) bad.push('record ' + i + ': index ' + r.n + ' is not a positive safe integer');
    if (!Number.isSafeInteger(r.len) || r.len < 1) bad.push('record ' + i + ': length ' + r.len + ' is not a positive safe integer');
    /* a run of L distinct gaps needs L distinct gap VALUES; below 10^13 the
       gaps are small enough that a run of 200 is not merely unseen but
       wildly outside anything the record curve could reach. A genuine one
       would be a finding, and a finding must stop a build, not decorate it. */
    if (r.len > 200) bad.push('record ' + i + ': implausible run length ' + r.len + ' at index ' + r.n);
    if (i > 0) {
      if (r.n <= R[i - 1].n) bad.push('record ' + i + ': index did not increase');
      if (r.len <= R[i - 1].len) bad.push('record ' + i + ': length did not increase');
      if (r.len - R[i - 1].len > 3) bad.push('record ' + i + ': length jumped by ' + (r.len - R[i - 1].len));
      if (r.p !== undefined && R[i - 1].p !== undefined && r.p <= R[i - 1].p) bad.push('record ' + i + ': start prime did not increase');
    }
  }
  return bad;
}

module.exports = { C0, parseOEIS, distinctIndices, hAtIndex, hAtPrime, bands, decades, consistency, validate };
