/* mercer6.js — Mercer's §6 program at GENERAL m: mu(5) <= 1 + pi/m, the two
   computer-aided components certified exact.

   THE REDUCTION (Mercer, INTEGERS 19 (2019) #A4, §6, read first-party from the
   pinned PDF): for (0,a,b,c,d) in N''_5, six applications of his Lemma 6.2
   give |1+z^a+z^b+z^c+z^d| <= 1 + pi*g_i/d (or /c) at some |z| = 1, with
   g_1..g_6 the gcds of {d or c} with the six inner differences. If any ratio
   g_i/d, g_i/c is <= 1/m the bound 1 + pi/m holds outright; otherwise ALL of
       r = (b-a)/d,  s = (c-b)/d,  t = (c-a)/d,
       u = (b-a)/c,  v = (d-b)/c,  w = (d-a)/c
   are fractions with reduced denominator < m satisfying, exactly,
       r+s = t in (0,1),   u+v = w in (0,1],   r < u,   s < v,
       r(1+v) = u(1+s),
   and each eligible (r,s,u,v) pins the tuple up to scale: (a,b,c,d) is the
   unique primitive integer multiple of (r/u - r - s, r/u - s, r/u, 1) — his
   row reduction, p. 17. He states the m-generalization on p. 16 ("the
   possible values ... are fractions between 0 and 1 whose denominators are
   less than m") and executes m = 5 by hand (Tables 2-5), m = 6 by sketch
   (Tables 6-7, "a finite search (aided by computer)" + "one can verify").

   WHAT THIS FILE CERTIFIES, for any m:
   (ii)  the finite search, run in EXACT RATIONAL arithmetic over the full
         domain (all reduced fractions in (0,1) with denominator < m) — no
         floats anywhere in the decision;
   (iii) each case check: min|f| <= 1 + pi/m established by ONE exact rational
         evaluation of G(y) = |f|^2 (y = cos theta) at a candidate point —
         an attainable value IS an upper bound on the minimum — against the
         exact bar (1 + piLo/m)^2, piLo a dyadic rational strictly below pi
         (pi is irrational, a dyadic cannot equal it; the bigfloat Machin
         enclosure supplies it outward-rounded). Fallback for a point-shy
         case: the full certified min enclosure (certifyNewman). A case whose
         certified LOWER bound clears the bar is reported CASE-FAILS — that
         is the method's honest boundary, and (since the bar exceeds 1) would
         simultaneously exhibit a 5-term Newman polynomial with min modulus
         above 1, i.e. a mu(5) > 1 witness. Nothing here can silently pass.

   Component (i) — that the reduction itself is sound — stays Mercer's proved
   prose (his Lemma 6.2 + §6 derivations); the record names it as the one
   consumed external theorem, used the way Krawczyk's theorem is elsewhere.

   Derivation guard the m = 6 code path never needed: a row whose
   a = (r/u - r - s) <= 0 derives NO N''_5 element and is DISCARDED with its
   reason (never thrown: it is data, not a bug). The battery exercises it.
   Non-primitivity after lcm scaling is provably impossible for reduced
   fractions and throws as a bug tripwire.

   CONVENTION: mu indexed by NUMBER OF TERMS (Mercer/Goddard), never degree.

   MIT licensed. Part of cert-machine. */
'use strict';

const N = require('./newman.js');
const C = require('./cheb.js');
const B = require('#instruments/bigfloat/bigfloat.js');
const F = require('#instruments/bigfloat/functions.js');
const Q = require('#instruments/interval/rational.js');

const ONE = Q.R(1n);

function bgcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; }
function blcm(a, b) { return a / bgcd(a, b) * b; }

/* dyadic bigfloat value {m, e} -> exact rational, no rounding */
function dyadicToQ(v) {
  return v.e >= 0 ? Q.R(v.m << BigInt(v.e), 1n) : Q.R(v.m, 1n << BigInt(-v.e));
}

/* ---------------- the fraction pool: reduced p/q in (0,1), q < m ------------ */
function fractionPool(m) {
  if (!Number.isInteger(m) || m < 3) throw new Error('mercer6: m must be an integer >= 3');
  const out = [];
  for (let q = 2; q < m; q++)
    for (let p = 1; p < q; p++)
      if (bgcd(BigInt(p), BigInt(q)) === 1n) out.push(Q.R(BigInt(p), BigInt(q)));
  return out.sort((a, b) => Q.cmp(a, b));
}

/* ---------------- component (ii): the search, exact ------------------------ */
/* Constraints verbatim from Mercer p. 19 (the m = 6 instance) with 6 -> m:
   0 < r,s,t,u,v < 1, 0 < w <= 1, all with reduced denominator < m, and
   r+s = t, u+v = w, r < u, s < v, r(1+v) = u(1+s). The sabotage hook exists
   so the battery can prove the printed-table comparison has teeth. */
function search(m, opts) {
  const o = opts || {};
  const pool = fractionPool(m);
  const mB = BigInt(m);
  const denomOK = (x) => x.d < mB;
  const rows = [];
  let examined = 0;
  for (const r of pool) for (const u of pool) {
    if (!(Q.cmp(r, u) < 0)) continue;                       /* r < u */
    for (const s of pool) for (const v of pool) {
      examined++;
      if (!(Q.cmp(s, v) < 0)) continue;                     /* s < v */
      const t = Q.add(r, s);
      if (!(t.n > 0n && Q.cmp(t, ONE) < 0 && denomOK(t))) continue;
      const w = Q.add(u, v);
      if (!(w.n > 0n && Q.cmp(w, ONE) <= 0 && denomOK(w))) continue;
      if (o.sabotage !== 'drop-uv-identity') {
        if (Q.cmp(Q.mul(r, Q.add(ONE, v)), Q.mul(u, Q.add(ONE, s))) !== 0) continue;
      }
      rows.push({ r, s, u, v, t, w });
    }
  }
  return { rows, poolSize: pool.length, examined };
}

const rowKey = (row) => [row.r, row.s, row.u, row.v].map(Q.toString).join(' ');

/* ---------------- the tuple: (r/u - r - s, r/u - s, r/u, 1) -> primitive ---- */
function deriveTuple(row) {
  const ru = Q.div(row.r, row.u);                           /* = c/d */
  const fr = [Q.sub(Q.sub(ru, row.r), row.s), Q.sub(ru, row.s), ru, ONE];
  if (!(fr[0].n > 0n)) {
    return { discarded: 'a = r/u - r - s = ' + Q.toString(fr[0]) + ' <= 0 — no N\'\'_5 element derives from this row' };
  }
  let L = 1n;
  for (const f of fr) L = blcm(L, f.d);
  const ints = fr.map((f) => f.n * (L / f.d));
  /* lcm scaling of REDUCED fractions is provably primitive: a common factor g
     of the scaled integers would put every reduced denominator inside L/g,
     contradicting L = lcm of those denominators. A gcd > 1 here is a bug. */
  let g = 0n;
  for (const x of ints) g = bgcd(g, x);
  if (g > 1n) throw new Error('mercer6: lcm scaling produced a non-primitive tuple (impossible for reduced fractions): ' + ints.join(','));
  const [a, b, c, d] = ints;
  /* construction invariants — a violation here is a bug, not data */
  if (!(0n < a && a < b && b < c && c < d)) throw new Error('mercer6: derived tuple not increasing: ' + ints.join(','));
  if (!(c >= d - a)) throw new Error('mercer6: derived tuple violates c >= d - a (w <= 1 should encode it): ' + ints.join(','));
  const eq = (x, D, diff) => Q.cmp(Q.mul(x, Q.R(D, 1n)), Q.R(diff, 1n)) === 0;
  if (!eq(row.r, d, b - a) || !eq(row.s, d, c - b) || !eq(row.u, c, b - a) || !eq(row.v, c, d - b)) {
    throw new Error('mercer6: consistency identities failed for ' + ints.join(','));
  }
  if (d > (1n << 40n)) throw new Error('mercer6: tuple entries exceed the sanity ceiling: ' + ints.join(','));
  return { tuple: ints.map(Number), lcm: Number(L) };
}

/* ---------------- the bar: (1 + piLo/m)^2, exact, provenance pinned -------- */
function bar(m, opts) {
  const o = opts || {};
  const P = o.sabotagePi || F.pi(96);
  const piLoQ0 = dyadicToQ(P.lo), piHiQ = dyadicToQ(P.hi);
  const sane = Q.cmp(piLoQ0, piHiQ) < 0
    && Q.cmp(Q.sub(piHiQ, piLoQ0), Q.R(1n, 1n << 40n)) < 0
    && Q.cmp(piLoQ0, Q.R(223n, 71n)) > 0                    /* Archimedes floor */
    && Q.cmp(piHiQ, Q.R(22n, 7n)) < 0;                      /* pi < 22/7 */
  if (!sane) throw new Error('PI-ENCLOSURE-INSANE: the pi enclosure failed the sanity sandwich 223/71 < pi < 22/7 (or is not narrow)');
  let piLo = piLoQ0;
  if (o.piLoOverride !== undefined) {
    const ov = Q.fromDouble(o.piLoOverride);
    if (Q.cmp(ov, piLoQ0) > 0) throw new Error('PI-LO-ABOVE-ENCLOSURE: override ' + o.piLoOverride + ' exceeds the certified lower bound');
    piLo = ov;
  }
  const onePlus = Q.add(ONE, Q.div(piLo, Q.R(BigInt(m), 1n)));
  const barQ = Q.mul(onePlus, onePlus);
  return {
    m, piLo, piLoExact: Q.toString(piLo),
    onePlusExact: Q.toString(onePlus), onePlusFloat: Q.toDouble(onePlus),
    barQ, barExact: Q.toString(barQ), barFloat: Q.toDouble(barQ),
    provenance: 'instruments/bigfloat/functions.pi(96), Machin, outward-rounded; piLo = the exact rational of the dyadic lower end; pi is irrational and piLo dyadic, so piLo < pi STRICTLY'
  };
}

/* ---------------- component (iii): one exact point beats the bar ----------- */
/* G(y) = |f|^2 on the REDUCED differences (reduceByGcd reparametrizes theta;
   the set of attained values is unchanged, so a point value of the reduced G
   is an attainable value of |f|^2 — a sound upper bound on its minimum). */
function gPolyFor(abcd) {
  const A = [0].concat(abcd);
  N.validateSet(A);
  const raw = N.differenceCounts(A);
  const { counts, g } = N.reduceByGcd(raw);
  return { A, counts, gcdOfDiffs: g, G: N.polyForCounts(counts, A.length, 2) };
}

/* argmin of the reduced g over a theta grid — float ROUTING only */
function sampleReducedArgmin(counts, n, K) {
  const k = K || 4096;
  let best = Infinity, at = 0;
  for (let j = 0; j <= k; j++) {
    const th = Math.PI * j / k;
    let s = n;
    for (const [d, mult] of counts) s += 2 * mult * Math.cos(d * th);
    if (s < best) { best = s; at = th; }
  }
  return { sampledMin: best, atTheta: at };
}

/* Deterministic candidates: the rational-cosine points of the roots of unity
   of order 2,4,6,3 (the stage-W wisdom: y in {-1, 0, 1/2, -1/2}), dyadic
   snaps near the sampled argmin, then y = +1. */
function candidatePoints(counts, n) {
  const cands = [
    { n: -1n, d: 1n, label: 'y=-1 (z=-1)' },
    { n: 0n, d: 1n, label: 'y=0 (z=i)' },
    { n: 1n, d: 2n, label: 'y=1/2 (z=e^{i pi/3})' },
    { n: -1n, d: 2n, label: 'y=-1/2 (z=e^{2 i pi/3})' }
  ];
  const s = sampleReducedArgmin(counts, n);
  const YDEN = 1n << 20n;
  const y = Math.cos(s.atTheta);
  for (const off of [0n, -1n, 1n]) {
    let num = BigInt(Math.round(y * Number(YDEN))) + off;
    if (num > YDEN) num = YDEN;
    if (num < -YDEN) num = -YDEN;
    if (!cands.some((c) => c.n * YDEN === num * c.d)) cands.push({ n: num, d: YDEN, label: 'dyadic near sampled argmin' });
  }
  cands.push({ n: 1n, d: 1n, label: 'y=+1 (z=1)' });
  return cands;
}

function caseCheck(abcd, barQ, opts) {
  const o = opts || {};
  const { A, counts, gcdOfDiffs, G } = gPolyFor(abcd);
  for (const c of candidatePoints(counts, A.length)) {
    const g = C.evalExact(G, Q.R(c.n, c.d));
    if (Q.cmp(g, barQ) <= 0) {
      return {
        A, gcdOfDiffs, verdict: 'CERTIFIED', how: 'exact-point',
        at: { y: Q.toString(Q.R(c.n, c.d)), label: c.label },
        gExact: Q.toString(g), gFloat: Q.toDouble(g)
      };
    }
  }
  /* point-shy: the full certified enclosure decides */
  const enc = N.certifyNewman(A, { bar: 0, tol: o.tol === undefined ? 1e-10 : o.tol });
  const hiQ = Q.fromDouble(enc.modSq[1]), loQ = Q.fromDouble(Math.max(0, enc.modSq[0]));
  if (Q.cmp(hiQ, barQ) <= 0) {
    return { A, gcdOfDiffs, verdict: 'CERTIFIED', how: 'min-enclosure', modSq: enc.modSq, modulus: enc.modulus };
  }
  if (Q.cmp(loQ, barQ) > 0) {
    return {
      A, gcdOfDiffs, verdict: 'CASE-FAILS', how: 'min-enclosure', modSq: enc.modSq, modulus: enc.modulus,
      note: 'certified min STRICTLY ABOVE the bar — the 1 + pi/m route cannot close this tuple; since the bar exceeds 1, this is simultaneously a certified min|f| > 1 on five terms'
    };
  }
  return { A, gcdOfDiffs, verdict: 'REFUSED', how: 'min-enclosure', modSq: enc.modSq, modulus: enc.modulus, note: 'enclosure straddles the bar at tol' };
}

/* ---------------- the full pipeline for one m (deterministic) -------------- */
function runM(m, opts) {
  const o = opts || {};
  const t0 = Date.now();
  const theBar = bar(m, o);
  const s = search(m, o);
  const derived = [], discarded = [];
  for (const row of s.rows) {
    const d = deriveTuple(row);
    const rowOut = { r: Q.toString(row.r), s: Q.toString(row.s), u: Q.toString(row.u), v: Q.toString(row.v), t: Q.toString(row.t), w: Q.toString(row.w) };
    if (d.discarded) discarded.push({ row: rowOut, why: d.discarded });
    else derived.push({ row: rowOut, tuple: d.tuple, lcm: d.lcm });
  }
  if (derived.length + discarded.length !== s.rows.length) {
    throw new Error('mercer6: row conservation failed: ' + derived.length + ' + ' + discarded.length + ' != ' + s.rows.length);
  }
  /* distinct rows can derive the same tuple; the case is checked once */
  const byTuple = new Map();
  for (const d of derived) {
    const k = d.tuple.join(',');
    if (!byTuple.has(k)) byTuple.set(k, { tuple: d.tuple, rows: [] });
    byTuple.get(k).rows.push(d.row);
  }
  const cases = [];
  for (const { tuple, rows } of byTuple.values()) {
    const check = caseCheck(tuple, theBar.barQ, o);
    const enc = N.certifyNewman([0].concat(tuple), { bar: 0, tol: 1e-10 });
    const cc = N.crossCheckModSq([0].concat(tuple), enc.modSq, 200000);
    cases.push({
      tuple, fromRows: rows, caseCheck: check,
      minEnclosure: { modSq: enc.modSq, modulus: enc.modulus },
      crossCheck: { ok: cc.ok, sampledGMin: cc.sampledMin, K: cc.K }
    });
  }
  const certified = cases.filter((c) => c.caseCheck.verdict === 'CERTIFIED').length;
  const failed = cases.filter((c) => c.caseCheck.verdict === 'CASE-FAILS').length;
  const refused = cases.filter((c) => c.caseCheck.verdict === 'REFUSED').length;
  if (certified + failed + refused !== cases.length) throw new Error('mercer6: case conservation failed');
  const verdict = cases.length === 0
    ? 'VACUOUS — the search found no exceptional rows; the six gcd bounds alone prove mu(5) <= 1 + pi/' + m
    : (failed === 0 && refused === 0 ? 'CERTIFIED' : (failed > 0 ? 'FAILS at ' + failed + ' case(s)' : 'REFUSED at ' + refused + ' case(s)'));
  return {
    m, statement: 'mu(5) <= 1 + pi/' + m + ' = ' + (1 + Math.PI / m)
      + ' — component (i), the reduction to this finite list, is Mercer 2019 §6 (general m stated p. 16; his Lemma 6.2), CONSUMED; '
      + 'components (ii) the finite search and (iii) the case checks are certified here in exact arithmetic.',
    bar: {
      piLoExact: theBar.piLoExact, onePlusExact: theBar.onePlusExact, onePlusFloat: theBar.onePlusFloat,
      barExact: theBar.barExact, barFloat: theBar.barFloat, provenance: theBar.provenance
    },
    search: { poolSize: s.poolSize, examined: s.examined, rows: s.rows.map(rowKey) },
    discarded, cases,
    conservation: {
      rows: s.rows.length, derived: derived.length, discarded: discarded.length,
      distinctTuples: cases.length, certified, failed, refused
    },
    verdict, elapsedMs: Date.now() - t0
  };
}

/* ---------------- Mercer's printed tables (transcribed from the pinned PDF) -
   Table 5's conclusion (m = 5, p. 18-19): exactly one eligible quadruple.
   Tables 6-7 (m = 6, p. 20): six rows, six tuples. The battery holds the
   search output to these as SET equality, and a sabotaged search must break
   the match. */
const PRINTED_M5 = { rows: [['1/4', '1/4', '1/3', '2/3']], tuples: [[1, 2, 3, 4]] };
const PRINTED_TABLE6 = [
  ['1/3', '1/3', '2/5', '3/5'],
  ['1/4', '1/4', '1/3', '2/3'],
  ['1/5', '1/5', '1/4', '1/2'],
  ['1/5', '2/5', '1/4', '3/4'],
  ['2/5', '1/5', '1/2', '1/2'],
  ['3/5', '1/5', '2/3', '1/3']
];
const PRINTED_TABLE7 = [[1, 3, 5, 6], [1, 2, 3, 4], [2, 3, 4, 5], [1, 2, 4, 5], [1, 3, 4, 5], [1, 7, 9, 10]];

/* the pinned source of the transcriptions above — lifted bytes (LIFT.json:
   research/probes/mercer-program/fetch_mercer2019_integers.pdf), held
   repo-relative so no machine path ever enters a certificate */
const SOURCE_PDF = {
  file: 'corpus/sources/mercer2019_integers.pdf',
  sha256: '1f648ff3aff79991fdf57213a0a0a270b83db64eefe1f4477739cb9ea7f10749'
};

module.exports = {
  fractionPool, search, rowKey, deriveTuple, bar, gPolyFor, candidatePoints,
  caseCheck, runM, dyadicToQ,
  PRINTED_M5, PRINTED_TABLE6, PRINTED_TABLE7, SOURCE_PDF,
  Q, N, C
};
