/* ENVS — lib.js: the shared core under all three environments.  MIT, clean-room.
   instruments/envs · cert-machine

   PORTED 2026-09-03 from the operator's own frontier-apps bench (crossed with sha —
   instruments/envs/PROVENANCE.json).  The only edit to the bench source is the require path:
   the bench's lib/eqcert/{interval,transcendental}.js are BYTE-IDENTICAL to
   instruments/interval/, so the certifier was already ours.  The FACT CORPUS below is the
   part that GROWS here: the bench had five facts, this machine holds a certificate shelf.

   ONE IDEA UNDERNEATH BOTH ENVIRONMENTS: a *certified enclosure* is a canary factory.

   If a quantity q is certified to lie in [lo, hi] with hi − lo = 4e-13, and a grader accepts any
   submission within tol = 1e-9 of its stored reference, then EVERY value in
        (hi, hi + tol − width)      and      (lo − tol + width, lo)
   is simultaneously (a) provably NOT q — it is outside a certificate — and (b) guaranteed to pass
   that grader.  The band is ~2500 times wider than the enclosure itself.  So adversarial submissions
   do not have to be invented one at a time by a person: they are MINTED, without limit, from facts we
   already hold.  That is the difference between a corpus and a generator, and it is the whole moat.

   The same primitive plants needles for the uniformity environment: a claim that is true at every
   point of any grid coarser than w, and false on an interval of width w.

   HONESTY RULE ENFORCED HERE: canaries are minted only from facts marked `certified`.  A fact that is
   float-grade can seed a *task* but must never seed a claim that a submission is "provably wrong" —
   we would be asserting a falsehood with the same confidence we are selling.  mintCanaries() throws
   on a non-certified fact rather than quietly degrading. */
'use strict';
const path = require('path');
const EQ = path.join(__dirname, '..', 'interval');   /* PORT: was ../../lib/eqcert on the bench — byte-identical files */
const I = require(path.join(EQ, 'interval.js'));
const T = require(path.join(EQ, 'transcendental.js'));

const { iv, add, sub, mul, div, neg, sqr, abs, mag, width, ONE, ZERO } = I;

/* ---------------------------------------------------------------------------------------------
   THE FACT CORPUS — real certified enclosures produced on this bench.
   Every entry cites where it came from so a ported version keeps provenance.
   `certified: true` means an outward-rounded interval certificate exists on disk and was verified.
--------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------
   THE FACT CORPUS.

   PORT PATCH (cert-machine, 2026-09-03).  On the bench the five entries were hand-typed lo/hi
   pairs with a prose source line.  Here every fact is READ OUT OF A RECORD on this machine and
   the record is sha256-PINNED beside it.  The reason is the honesty rule two paragraphs up: a
   canary asserts that a value is PROVABLY WRONG, and that assertion may not rest on a decimal
   somebody re-typed.  A fact that cannot be read from a certificate here does not enter the
   corpus — which is why the bench's `ember.mu1` is absent: this machine holds the band audit but
   not a two-sided mu1 enclosure in machine-readable form, and its role (a legitimately WIDE,
   range-valued quantity, where any decimal answer key is wrong by construction) is filled by
   `erdos1038.inf` instead, which we can read.

   Two conversions, both OUTWARD, both here so they are auditable in one place:
     · decimal strings from a record are parsed and then widened by one ulp on each side, because
       a decimal literal in a file is not exactly a double;
     · exact rationals are converted through the rational library and widened the same way.
   Widening can only make an enclosure weaker, never falser, which is the only direction a canary
   generator may be wrong in.
--------------------------------------------------------------------------------------------- */
const fs = require('fs');
const crypto = require('crypto');
const Q = require(path.join(EQ, 'rational.js'));
const CERTS = path.join(__dirname, '..', '..', 'certs');

const _pins = new Map();
function readRecord(rel) {
  const p = path.join(CERTS, rel);
  if (!_pins.has(rel)) {
    const bytes = fs.readFileSync(p);
    _pins.set(rel, crypto.createHash('sha256').update(bytes).digest('hex'));
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
const pinOf = rel => _pins.get(rel);
const outward = (lo, hi) => [I.nextDown(Number(lo)), I.nextUp(Number(hi))];
const qOut = (loStr, hiStr) => {
  const q = (t) => { const m = String(t).split('/'); return Q.R(BigInt(m[0]), BigInt(m[1] || 1)); };
  return [I.nextDown(Q.toDouble(q(loStr))), I.nextUp(Q.toDouble(q(hiStr)))];
};

const FACTS = [];
function fact(o) {
  if (!(o.lo <= o.hi)) throw new Error(`fact ${o.id}: enclosure is not an interval`);
  if (!Number.isFinite(o.lo) || !Number.isFinite(o.hi)) throw new Error(`fact ${o.id}: non-finite endpoint`);
  FACTS.push(o);
}

/* Erdos #1038, the infimum side — our own record */
{
  const R = readRecord('erdos1038-inf.json'), T = R.theorems.T1_upper, pin = pinOf('erdos1038-inf.json');
  const src = 'certs/erdos1038-inf.json (T1_upper) · sha256:' + pin.slice(0, 16);
  const [ulo, uhi] = outward(T.lenLo, T.lenUp);
  fact({ id: 'erdos1038.upper', what: 'L(mu*) for the conjectured minimiser of Erdos #1038 (an upper bound for the infimum)',
    lo: ulo, hi: uhi, certified: true, source: src, record: 'erdos1038-inf.json', sha256: pin });
  const [xLlo, xLhi] = outward(T.xL[0], T.xL[1]);
  fact({ id: 'erdos1038.xL', what: 'left endpoint x_L of {U_mu* > 0}',
    lo: xLlo, hi: xLhi, certified: true, source: src, record: 'erdos1038-inf.json', sha256: pin });
  const [xRlo, xRhi] = outward(T.xR[0], T.xR[1]);
  fact({ id: 'erdos1038.xR', what: 'right endpoint x_R of {U_mu* > 0}',
    lo: xRlo, hi: xRhi, certified: true, source: src, record: 'erdos1038-inf.json', sha256: pin });
  /* the WIDE one: the infimum itself is bracketed, not pinned. Any decimal answer key for this
     quantity is wrong by construction, and a grader that rejects the endpoints is rejecting the
     theorem. This is the range-valued case the suite must keep exercising. */
  const [ilo, ihi] = outward(R.bracket.lower, R.bracket.upper);
  fact({ id: 'erdos1038.inf', what: 'the Erdos-Herzog-Piranian infimum itself — bracketed unconditionally, not pinned',
    lo: ilo, hi: ihi, certified: true, source: 'certs/erdos1038-inf.json (bracket) · sha256:' + pin.slice(0, 16),
    record: 'erdos1038-inf.json', sha256: pin });
}

/* Erdos #852 — and the value that was actually published for it */
{
  const R = readRecord('erdos852-certificate.json'), pin = pinOf('erdos852-certificate.json');
  const e = R.cstar.enclosure;
  const [lo, hi] = outward(e.lo, e.hi);
  fact({ id: 'erdos852.cstar', what: 'C* = (1/2)(prod_{p>=3}(1 + 1/(p-1)^3) - 1), the Erdos #852 constant',
    lo, hi, certified: true,
    publishedWrong: Number(R.cstar.published.value),
    publishedNote: 'the value published in the problem thread, REFUTED by this enclosure',
    source: 'certs/erdos852-certificate.json (cstar.enclosure) · sha256:' + pin.slice(0, 16),
    record: 'erdos852-certificate.json', sha256: pin });
  const b = R.c0.bracket40;
  const [c0lo, c0hi] = outward(b.lo, b.hi);
  fact({ id: 'erdos852.c0', what: 'c0, the unique positive root of I0(c) = 1 (Erdos #852) — bracketed to 40 decimals',
    lo: c0lo, hi: c0hi, certified: true,
    source: 'certs/erdos852-certificate.json (c0.bracket40) · sha256:' + pin.slice(0, 16),
    record: 'erdos852-certificate.json', sha256: pin });
}

/* Chowla's cosine dip: the two exact values this machine proved. The records hold L, the
   MINIMUM of the cosine sum, which is negative; lambda = -L, so the enclosure is negated and its
   ends swap. Negation is exact in rationals and the widening afterwards is outward, so the result
   is still a true enclosure. */
{
  const qOf = (t) => { const m = String(t).split('/'); return Q.R(BigInt(m[0]), BigInt(m[1] || 1)); };
  const negOut = (loStr, hiStr) => [I.nextDown(Q.toDouble(Q.neg(qOf(hiStr)))), I.nextUp(Q.toDouble(Q.neg(qOf(loStr))))];
  const R4 = readRecord('lambda4-campaign.json'), pin4 = pinOf('lambda4-campaign.json');
  const T4 = typeof R4.targets.L4 === 'string' ? JSON.parse(R4.targets.L4) : R4.targets.L4;
  const [lo4, hi4] = negOut(T4.lo, T4.hi);
  fact({ id: 'chowla.lambda4', what: "lambda(4) = -L(1,2,3,4), the third exact value of Chowla's cosine dip",
    lo: lo4, hi: hi4, certified: true,
    source: 'certs/lambda4-campaign.json (targets.L4, negated) · sha256:' + pin4.slice(0, 16),
    record: 'lambda4-campaign.json', sha256: pin4 });
  const R5 = readRecord('lambda56-campaign.json'), pin5 = pinOf('lambda56-campaign.json');
  const T5 = typeof R5.stages.targets.L5 === 'string' ? JSON.parse(R5.stages.targets.L5) : R5.stages.targets.L5;
  const [lo5, hi5] = negOut(T5.lo, T5.hi);
  fact({ id: 'chowla.lambda5', what: 'lambda(5) = -L(1,2,4,5,6), the fourth exact value — algebraic of degree exactly 5',
    lo: lo5, hi: hi5, certified: true,
    source: 'certs/lambda56-campaign.json (targets.L5, negated) · sha256:' + pin5.slice(0, 16),
    record: 'lambda56-campaign.json', sha256: pin5 });
}

/* sigma* = 1/(8 pi^2), the TERRA mode-selection threshold — ENCLOSED rather than typed, so the
   corpus never carries a hand-copied decimal (the "hand-typed constants differ at margin scale"
   lesson from the 1038 chase). This is the one fact with no record to read: it is a closed form,
   and enclosing it from an enclosure of pi is stronger than reading a decimal out of a file. */
function sigmaStar() { return div(ONE, mul(iv(8), sqr(T.PI))); }
fact((() => {
  const s = sigmaStar();
  return {
    id: 'terra.sigmaStar',
    what: 'sigma* = 1/(8 pi^2), the viscosity at which the second harmonic stops being attenuated',
    lo: s[0], hi: s[1], certified: true,
    source: 'closed form, enclosed here from an enclosure of pi — never a typed decimal '
      + '(certs/terra-sigmastar.json decides the same constant in exact rationals)',
    relatedRecord: 'terra-sigmastar.json',   /* related, NOT read from: this fact is computed here,
                                                so it carries no sha pin and the gates must not
                                                expect one — a record field means "read from". */
  };
})());

const factById = id => FACTS.find(f => f.id === id);

/* ---------------------------------------------------------------------------------------------
   CANARY MINTING
--------------------------------------------------------------------------------------------- */

/* The core family.  Returns a value that is OUTSIDE [lo,hi] — so provably not the quantity — yet
   within `tol` of every point of [lo,hi], so any |submitted - reference| < tol grader accepts it.
   side = +1 pushes above hi, -1 below lo.  Returns null when the enclosure is not narrow enough
   relative to tol for the trick to be sound (we never ship a canary we cannot justify). */
function toleranceInterior(fact, tol, side = 1) {
  const w = fact.hi - fact.lo;
  if (!(w < tol * 0.5)) return null;              // need room: the value must clear the enclosure
  const push = (tol - w) * 0.5;                   // outside the enclosure, inside tol of all of it
  const v = side > 0 ? fact.hi + push : fact.lo - push;
  const worst = side > 0 ? v - fact.lo : fact.hi - v;   // distance to the far end of the enclosure
  if (!(worst < tol)) return null;
  return { value: v, gapFromEnclosure: push, worstDistanceToEnclosure: worst };
}

/* The #852 family: the naive IEEE-754 evaluation of an expression differs from its true value.
   We synthesise a genuine instance rather than asserting one — build a sum whose terms cancel, then
   report the float result alongside a certified enclosure of the truth.  The float answer is the
   canary; it is what an unvalidated pipeline actually emits, which is what makes this family the
   realistic one rather than the clever one. */
function cancellationCanary(n) {
  // S = sum_{k=1}^{n} ( (k + 1/3) - k ) - n/3 , which is exactly 0 in the reals.
  let naive = 0;
  for (let k = 1; k <= n; k++) naive += (k + 1 / 3) - k;
  naive -= n / 3;
  let exact = ZERO;
  for (let k = 1; k <= n; k++) exact = add(exact, sub(add(iv(k), div(ONE, iv(3))), iv(k)));
  exact = sub(exact, div(iv(n), iv(3)));
  return { value: naive, truthEnclosure: exact, isZeroTruth: true, terms: n };
}

/* Mint the full canary set for one fact at one tolerance. */
function mintCanaries(fact, tol) {
  if (!fact.certified) throw new Error(`refusing to mint canaries from non-certified fact ${fact.id}`);
  const out = [];
  for (const side of [1, -1]) {
    const c = toleranceInterior(fact, tol, side);
    if (c) out.push({
      family: 'tolerance-interior', factId: fact.id, value: c.value, tol,
      why: `outside the certified enclosure [${fact.lo}, ${fact.hi}] by ${c.gapFromEnclosure.toExponential(3)}, ` +
           `but within ${c.worstDistanceToEnclosure.toExponential(3)} < tol of every point of it`,
    });
  }
  // a value one ulp outside the enclosure: passes anything, wrong by the smallest possible amount
  for (const side of [1, -1]) {
    const v = side > 0 ? I.nextUp(fact.hi) : I.nextDown(fact.lo);
    out.push({
      family: 'ulp-outside', factId: fact.id, value: v, tol,
      why: `one ulp outside the certified enclosure — provably not the quantity, indistinguishable to any tolerance`,
    });
  }
  // truncation: the enclosure rounded to fewer digits than it determines
  const digits = Math.max(1, Math.floor(-Math.log10(Math.max(fact.hi - fact.lo, 1e-300))) - 2);
  const trunc = Number(fact.lo.toPrecision(Math.max(1, digits - 3)));
  if (trunc < fact.lo || trunc > fact.hi) out.push({
    family: 'over-truncated', factId: fact.id, value: trunc, tol,
    why: `quoted to ${Math.max(1, digits - 3)} significant digits, which lands outside the enclosure`,
  });
  /* PORT ADDITION (cert-machine): the value a real publication actually carried for this
     quantity, when the record holds one. Every other family here is SYNTHESISED — this one is
     not. It is the decimal that appeared in an Erdos problem thread, and it is simultaneously
     outside our certificate and inside any ordinary tolerance. The suite stops being a clever
     argument at this row and becomes a reproduction of something that happened. */
  if (fact.publishedWrong !== undefined && Number.isFinite(fact.publishedWrong)) {
    const v = fact.publishedWrong;
    if (v < fact.lo || v > fact.hi) {
      const off = v < fact.lo ? fact.lo - v : v - fact.hi;
      out.push({
        family: 'published-wrong', factId: fact.id, value: v, tol,
        why: `the value actually published for this quantity, outside the certified enclosure by `
           + `${off.toExponential(3)} — not synthesised${off < tol ? `, and within tol of it` : ''}`,
      });
    }
  }
  return out;
}

/* Control submissions: values that ARE inside the certified enclosure.  A grader that rejects these
   is not conservative, it is broken — and without controls "reject everything" would score perfectly.
   This is the part a naive false-accept benchmark leaves out. */
function mintControls(fact) {
  const mid = (fact.lo + fact.hi) / 2;
  return [
    { family: 'control', factId: fact.id, value: mid, truth: true, why: 'midpoint of the certified enclosure' },
    { family: 'control', factId: fact.id, value: fact.lo, truth: true, why: 'lower end of the certified enclosure' },
    { family: 'control', factId: fact.id, value: fact.hi, truth: true, why: 'upper end of the certified enclosure' },
  ];
}

/* ---------------------------------------------------------------------------------------------
   NEEDLE PLANTING (used by the uniformity environment)

   f(t) = base(t) - depth / (1 + ((t - t0)/w)^2)

   base is a positive trig polynomial; the second term is a Lorentzian notch of width w.  Rational
   and smooth, so interval arithmetic encloses it exactly as well as it encloses anything, while a
   grid of spacing h >> w steps over it with probability ~1 - w/h.  Sampling and interval methods
   give different answers, which is precisely the behaviour the environment is built to expose.
--------------------------------------------------------------------------------------------- */
function makeProblem({ a1 = 0.3, a2 = 0.15, depth = 0, t0 = 0.371, w = 1e-5, base = 1 } = {}) {
  return { a1, a2, depth, t0, w, base };
}

/* float evaluation (what a sampling grader uses) */
function fFloat(P, t) {
  const z = (t - P.t0) / P.w;
  return P.base + P.a1 * Math.cos(2 * Math.PI * t) + P.a2 * Math.cos(4 * Math.PI * t)
    - P.depth / (1 + z * z);
}

/* interval evaluation over a whole subinterval [lo,hi] — the certified path */
function fIv(P, lo, hi) {
  const t = iv(lo, hi);
  const twoPi = mul(iv(2), T.PI);
  const c1 = T.cos(mul(twoPi, t));
  const c2 = T.cos(mul(mul(iv(2), twoPi), t));
  const z = div(sub(t, iv(P.t0)), iv(P.w));
  const lor = div(iv(P.depth), add(ONE, sqr(z)));   // sqr floors at 0 on a straddling interval
  return sub(add(add(iv(P.base), mul(iv(P.a1), c1)), mul(iv(P.a2), c2)), lor);
}

/* the true minimum of the base part, so an instance can be built above or below the failure line */
function baseMin(P) {
  let m = Infinity;
  for (let i = 0; i <= 200000; i++) {
    const t = i / 200000;
    const v = P.base + P.a1 * Math.cos(2 * Math.PI * t) + P.a2 * Math.cos(4 * Math.PI * t);
    if (v < m) m = v;
  }
  return m;
}

module.exports = {
  I, T, iv, add, sub, mul, div, sqr, abs, mag, width, ONE, ZERO,
  FACTS, factById, sigmaStar,
  toleranceInterior, cancellationCanary, mintCanaries, mintControls,
  makeProblem, fFloat, fIv, baseMin,
};
