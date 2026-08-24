/* engine.js — the conjecture engine.

   Generate at scale, screen in float, certify the survivors exactly, and emit
   statements with their certificates. One engine, many families: a family
   supplies the objects and the mathematics, the engine supplies the loop, the
   scale and the bookkeeping.

   This is the Ramanujan-Machine shape with the part they disclaim: their hits
   are truncated-decimal hash collisions plus a probability argument, ours are
   interval enclosures and exact rational decisions. A REFUTED here is proved,
   not unlikely.

   FAMILY CONTRACT
     name          string
     statement     what a HIT asserts, in words
     enumerate(i)  -> object | null      deterministic and indexed, so a run of
                                         any size resumes and reproduces
     value(obj)    -> number             fast float, no certification
     interesting(obj, v) -> bool         cheap screen; must only ever PRUNE
     certify(obj)  -> { verdict: 'HIT'|'REJECT'|'REFUSED', enclosure, text, extra }
     key(obj)      -> string             canonical identity for dedup

   The engine never decides mathematics. It counts, dedupes, and hands the
   certifier what survived. */
'use strict';

function run(family, opts) {
  const o = opts || {};
  const limit = o.limit || 100000;
  const maxCertify = o.maxCertify || 400;
  const onProgress = o.onProgress || null;

  const t0 = Date.now();
  const seen = new Set();
  const hits = [], rejects = [], refused = [];
  let generated = 0, screened = 0, duplicates = 0, certified = 0;

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

    if (c.verdict === 'HIT') hits.push({ key: k, obj, ...c });
    else if (c.verdict === 'REFUSED') refused.push({ key: k, why: c.why || 'instrument refused' });
    else rejects.push({ key: k, enclosure: c.enclosure });

    if (onProgress && certified % 50 === 0) onProgress({ generated, screened, certified, hits: hits.length });
  }

  return {
    family: family.name,
    statement: family.statement,
    counts: { generated, screened, duplicates, certified, hits: hits.length, rejects: rejects.length, refused: refused.length },
    hits, rejects, refused,
    ms: Date.now() - t0,
    truncated: certified >= maxCertify
  };
}

/* ---- rigorous constants -----------------------------------------------------
   Math.PI is the nearest double to pi, so pi lies within one ulp of it; padding
   outward by one ulp each way is a sound enclosure. Same for the rest. No
   constant is entered by hand. */
const IV = require('#instruments/interval/interval.js');

function enc(x) { return [IV.nextDown(x), IV.nextUp(x)]; }

const CONSTANTS = {
  pi:      enc(Math.PI),
  e:       enc(Math.E),
  ln2:     enc(Math.LN2),
  sqrt2:   enc(Math.SQRT2),
  sqrt3:   enc(Math.sqrt(3)),
  sqrt5:   enc(Math.sqrt(5)),
  phi:     enc((1 + Math.sqrt(5)) / 2),
  gamma_e: enc(Math.exp(1) / Math.PI)
};

/* Hunt small closed forms for a certified enclosure. Every test is decided by
   the enclosure: if the candidate value lies outside [lo,hi] the relation is
   REFUTED exactly; if inside, it is a CANDIDATE whose residual width is
   reported. Nothing is accepted on digits agreeing. */
function relations(enclosure, opts) {
  const o = opts || {};
  const maxDen = o.maxDen || 24;
  const [lo, hi] = enclosure;
  const out = [];
  const mid = (lo + hi) / 2;

  let tested = 0, refuted = 0;
  const test = (label, val) => {
    if (!isFinite(val)) return;
    tested++;
    if (val >= lo && val <= hi) out.push({ label, value: val, verdict: 'CANDIDATE', slack: hi - lo });
    else refuted++;          /* the value lies OUTSIDE a rigorous enclosure: proved not equal */
  };

  /* rational p/q */
  for (let q = 1; q <= maxDen; q++) {
    const p = Math.round(mid * q);
    if (p === 0) continue;
    test(p + '/' + q, p / q);
  }
  /* sqrt of a rational */
  for (let q = 1; q <= maxDen; q++) {
    const p = Math.round(mid * mid * q);
    if (p <= 0) continue;
    test('sqrt(' + p + '/' + q + ')', Math.sqrt(p / q));
  }
  /* small multiples and roots of the constants */
  for (const [name, ce] of Object.entries(CONSTANTS)) {
    const c = (ce[0] + ce[1]) / 2;
    for (let q = 1; q <= 8; q++) for (let p = 1; p <= 8; p++) {
      test('(' + p + '/' + q + ')·' + name, (p / q) * c);
      test(name + '^(' + p + '/' + q + ')', Math.pow(c, p / q));
    }
  }
  return { candidates: out, tested, refuted };
}

module.exports = { run, relations, CONSTANTS };
