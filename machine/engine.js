/* engine.js — the conjecture engine.

   Generate at scale, screen in float, certify the survivors exactly, and emit
   statements with their certificates. One engine, many families: a family
   supplies the objects and the mathematics, the engine supplies the loop, the
   scale and the bookkeeping.

   This is the Ramanujan-Machine shape with the part they disclaim: their hits
   are truncated-decimal hash collisions plus a probability argument, ours are
   interval enclosures and exact rational decisions. A REFUTED here is proved,
   not unlikely — and since 2026-10-09 that sentence is checked rather than
   asserted: see THE GRAMMAR and relations() below.

   FAMILY CONTRACT
     name          string
     statement     the predicate a CERTIFIED object satisfies, in words
     enumerate(i)  -> object | null      deterministic and indexed, so a run of
                                         any size resumes and reproduces
     value(obj)    -> number             fast float, no certification
     interesting(obj, v) -> bool         cheap screen; must only ever PRUNE
     certify(obj)  -> { verdict, enclosure, text, extra, why }
                      verdict is one of the three words of instruments/verdict.js:
                        CERTIFIED  the statement is proved for this object
                        REFUTED    the statement is proved FALSE for this object
                                   (the text says which clause, with the witness)
                        REFUSED    nothing is proved either way: the enclosure
                                   straddles the bar, a budget ran out, the
                                   instrument declined (why says which)
     key(obj)      -> string             canonical identity for dedup

   THE GRAMMAR (2026-10-09). Until this date the contract read HIT | REJECT |
   REFUSED, REJECT meaning "did not clear the bar" — which included the case where
   the enclosure STRADDLES the bar and nothing is proved — and the loop below sent
   ANY string that was not HIT or REFUSED, a typo included, to the rejects. The
   ledger then quoted rejects as decisions. Now: a verdict word outside the three
   is REFUSED and counted apart as `unknown`; a family that has a bar decides it
   with verdict.decide(), which is the one predicate in the tree.

   The engine never decides mathematics. It counts, dedupes, and hands the
   certifier what survived. */
'use strict';

const IV = require('#instruments/interval/interval.js');
const T = require('#instruments/interval/transcendental.js');
const Q = require('#instruments/interval/rational.js');
const ALG = require('#instruments/interval/algebraic.js');
const V = require('#instruments/verdict.js');

function run(family, opts) {
  const o = opts || {};
  const limit = o.limit || 100000;
  const maxCertify = o.maxCertify || 400;
  const onProgress = o.onProgress || null;

  const t0 = Date.now();
  const seen = new Set();
  const hits = [], refuted = [], refused = [];
  let generated = 0, screened = 0, duplicates = 0, certified = 0, unknown = 0;

  for (let i = 0; i < limit; i++) {
    const obj = family.enumerate(i);
    if (obj === null || obj === undefined) break;
    generated++;

    const v = family.value(obj);
    if (!isFinite(v)) continue;
    if (!family.interesting(obj, v)) continue;
    screened++;

    const k = family.key(obj);
    if (seen.has(k)) { duplicates++; continue; }
    seen.add(k);

    if (certified >= maxCertify) continue;
    let c;
    try { c = family.certify(obj); }
    catch (e) { refused.push({ key: k, why: e.message }); certified++; continue; }
    certified++;

    const w = c && c.verdict;
    if (w === V.CERTIFIED) hits.push({ key: k, obj, ...c });
    else if (w === V.REFUTED) refuted.push({ key: k, enclosure: c.enclosure, text: c.text, extra: c.extra });
    else if (w === V.REFUSED) refused.push({ key: k, why: c.why || 'instrument refused', extra: c.extra });
    else {
      /* a word outside the vocabulary is not a decision; it is counted so it cannot hide */
      unknown++;
      refused.push({ key: k, why: 'unknown verdict word ' + JSON.stringify(w) + ' — refused, not counted as decided', unknown: true, extra: c && c.extra });
    }

    if (onProgress && certified % 50 === 0) onProgress({ generated, screened, certified, hits: hits.length });
  }

  return {
    family: family.name,
    statement: family.statement,
    counts: { generated, screened, duplicates, certified, hits: hits.length, refuted: refuted.length, refused: refused.length, unknown },
    hits, refuted, refused,
    ms: Date.now() - t0,
    truncated: certified >= maxCertify
  };
}

/* ---- rigorous constants -----------------------------------------------------
   Each is an ENCLOSURE from the series module or a verified algebraic bracket;
   none is a padded Math.* value. Until 2026-10-09 these were enc(Math.PI) and the
   like — one ulp around a double — which is sound for a correctly rounded
   constant (Math.PI, Math.E, Math.LN2, Math.SQRT2 are) and NOT a proof for
   composite expressions: `(1 + Math.sqrt(5)) / 2` carries two roundings and
   `Math.exp(1) / Math.PI` carried an unbounded one and the wrong name (it was
   e/π, labelled gamma_e). Both happened to be inside; neither was proved. The
   e/π entry is gone: it was a quotient of two constants, not a form. */
const SQRT5 = ALG.sqrtRational(5, 1).iv;
const CONSTANTS = {
  pi:    T.PI,
  e:     T.exp(IV.ONE),
  ln2:   T.LN2,
  sqrt2: ALG.sqrtRational(2, 1).iv,
  sqrt3: ALG.sqrtRational(3, 1).iv,
  sqrt5: SQRT5,
  phi:   IV.div(IV.add(IV.ONE, SQRT5), IV.iv(2))
};

/* Hunt small closed forms for a certified enclosure. Every test is decided by
   DISJOINTNESS: the candidate is itself an exact rational or an enclosure, and
   the relation is REFUTED only when the two cannot meet; if they intersect it is
   a CANDIDATE whose residual width is reported. Nothing is accepted on digits
   agreeing, and nothing is refuted on a float falling outside.

   Until 2026-10-09 the candidate was a DOUBLE — Math.sqrt(p/q), (p/q)·c with c
   the midpoint of a constant's enclosure, Math.pow(c, p/q) — and a miss was
   counted as a refutation. For p/q that is exact (round-to-nearest is monotone,
   so fl(p/q) > hi implies p/q > hi); for the others it is not, and the control
   page counted them as "refuted in double". tools/test-engine.js records that
   the same mechanism once refuted sqrt(2) as a closed form for sqrt(2), repaired
   then at the enclosure; this repairs it at the comparison. Rational powers of
   a constant, c^(p/q) with q > 1, are now REFUSED — not tested — rather than
   evaluated by Math.pow; integer powers go through interval pow.

   REDUCED FRACTIONS ONLY. The first version tested (2/1)·e, (4/2)·e, (6/3)·e
   and (8/4)·e as four forms: the refuted count was inflated by duplicates and a
   single surviving value showed up as four candidates. Skipping gcd(p,q) > 1
   loses nothing — if p = round(mid·q) has gcd g > 1, then p/g = round(mid·q/g)
   (|mid·q/g − p/g| ≤ 1/(2g) ≤ 1/2), so the reduced spelling is already tested
   at the smaller denominator. */
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }

function relations(enclosure, opts) {
  const o = opts || {};
  const maxDen = o.maxDen || 24;
  IV.wf(enclosure, 'relations');
  const [lo, hi] = enclosure;
  const out = [];
  const mid = (lo + hi) / 2;            /* a PROPOSER of which forms to test; never a verdict */

  let tested = 0, refuted = 0, refusedForms = 0;
  const candidate = (label, value, cand) => out.push({ label, value, verdict: 'CANDIDATE', slack: hi - lo, candidate: cand });
  /* an exact rational candidate: disjoint iff r < lo or r > hi, decided in rationals */
  const testRational = (label, r) => {
    tested++;
    if (ALG.rationalDisjoint(r, lo, hi)) refuted++; else candidate(label, Q.toDouble(r), [Q.toDouble(r), Q.toDouble(r)]);
  };
  /* an enclosure candidate [a, b]: disjoint iff b < lo or a > hi */
  const testInterval = (label, c) => {
    IV.wf(c, 'relations candidate ' + label);
    tested++;
    if (c[1] < lo || c[0] > hi) refuted++; else candidate(label, (c[0] + c[1]) / 2, [c[0], c[1]]);
  };

  /* rational p/q */
  for (let q = 1; q <= maxDen; q++) {
    const p = Math.round(mid * q);
    if (p === 0 || gcd(p, q) !== 1) continue;
    testRational(p + '/' + q, Q.R(p, q));
  }
  /* sqrt of a rational — SKIPPING PERFECT SQUARES: with gcd(p,q) = 1,
     sqrt(p/q) is rational iff p and q are both squares, and that spelling is
     already tested by the rational loop above (sqrt(2209/1) is 47/1 wearing a
     radical — counting both made one surviving value two candidates). The
     comparison is exact: sqrt(p/q) > hi iff p/q > hi², and so on. */
  for (let q = 1; q <= maxDen; q++) {
    const p = Math.round(mid * mid * q);
    if (p <= 0 || gcd(p, q) !== 1) continue;
    const sp = Math.round(Math.sqrt(p)), sq = Math.round(Math.sqrt(q));
    if (sp * sp === p && sq * sq === q) continue;
    tested++;
    if (ALG.sqrtRationalDisjoint(p, q, lo, hi)) refuted++;
    else { const c = ALG.sqrtRational(p, q).iv; candidate('sqrt(' + p + '/' + q + ')', (c[0] + c[1]) / 2, c); }
  }
  /* small multiples and integer powers of the constants. An even integer power of a square
     root is a RATIONAL in disguise (sqrt2^(2/1) is 2), already covered by the rational loop
     when it is near the enclosure; as an enclosure it would survive beside '2/1' as a second
     spelling of one value, which is the duplicate the reduced-fraction rule exists to stop.
     Skipped, like the perfect squares above. */
  const ROOTS = { sqrt2: true, sqrt3: true, sqrt5: true };
  for (const [name, C] of Object.entries(CONSTANTS)) {
    for (let q = 1; q <= 8; q++) for (let p = 1; p <= 8; p++) {
      if (gcd(p, q) !== 1) continue;
      testInterval('(' + p + '/' + q + ')·' + name, IV.mul(IV.div(IV.iv(p), IV.iv(q)), C));
      if (q === 1) { if (!(ROOTS[name] && p % 2 === 0)) testInterval(name + '^(' + p + '/1)', IV.pow(C, p)); }
      else refusedForms++;              /* c^(p/q), q > 1: no enclosure here; refused, not tested */
    }
  }
  return { candidates: out, tested, refuted, refusedForms };
}

module.exports = { run, relations, CONSTANTS };
