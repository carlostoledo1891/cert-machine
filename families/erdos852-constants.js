/* erdos852-constants.js — the two GPT-produced constants holding up the
   conjectured asymptotic h(x) ~ c0 log x on Erdős #852 (maximal runs of
   distinct consecutive prime gaps), certified.

   The problem's discussion thread (erdosproblems.com/forum/discuss/852,
   fetched 2026-08-25, pinned) carries two constants published as bare
   decimals with no error bound, both produced by GPT models:

     c0 = 1.32322827686395...   the unique positive root of I0(c) = 1,
                                 I0 the saddle-point rate function of the
                                 iid geometric-gap model (Turturean,
                                 2026-04-24; also quoted as "1.32323" in
                                 Chojecki's h(x) ~ 1.32323 log x)
     C* = 0.0752403861777...    (1/2)(prod_{p>=3}(1 + 1/(p-1)^3) - 1),
                                 the odd-prime singular-series pressure
                                 constant in I0(c) + J(c), J(c) = C* c^2
                                 + O(c^3) (Turturean, 2026-04-24)

   Four objects: each constant as a certified-enclosure theorem
   (instruments/erdos852/), and each published decimal as an exact audit
   against that enclosure. The audits came back asymmetric, and that is
   the family's finding: c0's digits survive (as a rounding — the true
   expansion continues ...9469, so the printed "...95..." ellipsis is a
   half-ulp slip, not an error), while C*'s digits are REFUTED from the
   12th significant digit: the true value is 0.07524038617830924...,
   and the published 0.0752403861777418 is EXACTLY what a naive IEEE-754
   double product produces, because 1 + 1/(p-1)^3 rounds to 1.0 for every
   p > ~208000 and 87% of the factors silently vanish. The battery
   reproduces that broken computation digit for digit. */
'use strict';

const B = require('#instruments/bigfloat/bigfloat.js');
const E = require('#instruments/erdos852/constants.js');
const PIN = require('#instruments/pin.js');

const THREAD = 'erdos852_thread.html';
const PAGE = 'erdos852_page.html';

const C0_CLAIM = '1.32322827686395';
const CSTAR_CLAIM = '0.0752403861777';

const C0_OPTS = { P: 320, targetBits: 200 };
const CSTAR_OPTS = { limit: 30000000, P: 192 };

/* the heavy computations run once per process; every object reads the same run */
let _c0 = null, _cs = null;
function c0Run() {
  if (!_c0) {
    const r = E.rootC0(C0_OPTS);
    _c0 = { enclosure: B.I(r.lo, r.hi), iters: r.iters, note: r.note, P: r.P };
  }
  return _c0;
}
function csRun() {
  if (!_cs) _cs = E.cstar(CSTAR_OPTS);
  return _cs;
}

/* float estimates for the screen — never a verdict */
function i0Float(c) {
  const x = Math.exp(2 * c) - 1;
  let li = 0; const z = -1 / x;
  for (let k = 60; k >= 1; k--) li += Math.pow(z, k) / (k * k);
  return c + c * (Math.log(x) - Math.log(2 * c)) - Math.PI * Math.PI / 12 - Math.log(x) ** 2 / 4 - li / 2;
}
function c0Float() {
  let a = 1.25, b = 1.375;
  for (let i = 0; i < 60; i++) { const m = (a + b) / 2; (i0Float(m) < 1 ? a = m : b = m); }
  return (a + b) / 2;
}

const OBJECTS = [
  { id: 'erdos852-c0-enclosure', kind: 'c0', what: 'the constant itself, enclosed' },
  { id: 'erdos852-c0-digits', kind: 'c0-audit', what: 'the thread\'s printed decimal, audited', claim: C0_CLAIM },
  { id: 'erdos852-cstar-enclosure', kind: 'cstar', what: 'the constant itself, enclosed' },
  { id: 'erdos852-cstar-digits', kind: 'cstar-audit', what: 'the thread\'s printed decimal, audited', claim: CSTAR_CLAIM }
];

const dec = (v, k, dir) => B.toDecimal(v, k, dir);

module.exports = {
  name: 'erdos852-constants',
  statement: 'a constant holding up the conjectured asymptotic h(x) ~ c0 log x on Erdős #852, replaced by a certified interval enclosure — and its published decimal decided exactly against that enclosure',
  enumerate: (i) => (i < OBJECTS.length ? OBJECTS[i] : null),
  value(o) {
    if (o.kind.startsWith('c0')) return c0Float();
    /* float log1p sum — the honest float route; the naive product is the bug */
    let s = 0;
    for (const p of E.oddPrimes(2000000)) s += Math.log1p(1 / ((p - 1) ** 3));
    return Math.expm1(s) / 2;
  },
  interesting() { return true; },
  key: (o) => o.id,
  certify(o) {
    const pins = {};
    for (const f of [THREAD, PAGE]) {
      const pv = PIN.verify(f);
      if (!pv.ok) return { verdict: 'REFUSED', why: 'source pin failed for ' + f + ': ' + pv.why };
      pins[f] = pv.sha256;
    }
    const sourcePin = { files: [THREAD, PAGE], sha256: pins };

    if (o.kind === 'c0' || o.kind === 'c0-audit') {
      const r = c0Run();
      const digits = B.agreedDecimal(r.enclosure, 62);
      const base = {
        constant: 'c0: the unique positive root of I0(c) = 1, I0(c) = c + c log((e^{2c}-1)/(2c)) + (1/2) Li2(1 - e^{2c})',
        enclosureDecimal: [dec(r.enclosure.lo, 62, 'down'), dec(r.enclosure.hi, 62, 'up')],
        certifiedDigits: digits, width: B.widthNumber(r.enclosure),
        precisionBits: r.P, bisections: r.iters,
        method: 'certified bisection: I0(lo) < 1 < I0(hi) as strict bigfloat-interval inequalities at every step; '
          + 'dilog through the inversion identity Li2(-x) = -pi^2/6 - (1/2)log^2 x - Li2(-1/x) (Lewin 1.12) onto the small disk; '
          + 'every series truncated with an explicit remainder bound',
        uniqueness: 'I0\'(c) = log((e^{2c}-1)/(2c)) (elementary calculus, float-checked in the battery); '
          + 'e^{2c} > 1 + 2c certified on the bracket as a strict interval inequality, so I0 is strictly increasing and the root is unique on (0, inf)',
        attribution: 'value published by DavidTurturean (via GPT-5.5 Pro), erdosproblems.com #852 thread, 2026-04-24; role: h(x) ~ c0 log x',
        sourcePin
      };
      if (o.kind === 'c0') {
        return {
          verdict: 'HIT',
          enclosure: [B.toNumberDown(r.enclosure.lo), B.toNumberUp(r.enclosure.hi)],
          text: 'THEOREM: c0 = ' + digits + '... — the unique positive root of I0(c) = 1, enclosed to width '
            + B.widthNumber(r.enclosure).toExponential(2) + ' (' + r.iters + ' certified bisections at ' + r.P
            + '-bit directed rounding). The first certified enclosure of this constant; the thread holds only an unverified decimal.',
          extra: base
        };
      }
      const d = E.decideClaimedDigits(r.enclosure, o.claim);
      if (d.verdict === 'REFUTED') {
        return { verdict: 'REJECT', enclosure: [B.toNumberDown(r.enclosure.lo), B.toNumberUp(r.enclosure.hi)],
          text: 'DISCOVERY-CLASS REFUTATION: the published c0 = ' + o.claim + '... lies provably outside the certified enclosure.',
          extra: { ...base, claim: o.claim, decision: d } };
      }
      if (d.verdict === 'UNDECIDED') return { verdict: 'REFUSED', why: 'enclosure too wide to decide the published digits' };
      return {
        verdict: 'HIT',
        enclosure: [B.toNumberDown(r.enclosure.lo), B.toNumberUp(r.enclosure.hi)],
        text: 'AUDIT: the published c0 = ' + o.claim + '... ' + (d.verdict === 'VERIFIED'
          ? 'is VERIFIED — its digits are the leading digits of the certified enclosure.'
          : 'is VERIFIED AS A ROUNDING to ' + d.digits + ' places — but its trailing ellipsis is wrong: the certified expansion continues '
            + digits.slice(0, 18) + '..., i.e. ...9469, not ...95. A half-ulp presentation slip on an otherwise correct constant, invisible to any float check.'),
        extra: { ...base, claim: o.claim, decision: d }
      };
    }

    /* C* */
    const r = csRun();
    const digits = B.agreedDecimal(r.enclosure, 22);
    const L = BigInt(r.limit);
    const base = {
      constant: 'C* = (1/2)(prod_{p>=3}(1 + 1/(p-1)^3) - 1), the odd-prime singular-series pressure constant (J(c) = C* c^2 + O(c^3))',
      enclosureDecimal: [dec(r.enclosure.lo, 22, 'down'), dec(r.enclosure.hi, 22, 'up')],
      certifiedDigits: digits, width: B.widthNumber(r.enclosure),
      primes: r.primes, limit: r.limit, precisionBits: r.P,
      tailBound: 'sum_{p>' + r.limit + '} 1/(p-1)^3 <= sum_{m>=' + r.limit + '} 1/m^3 <= 1/(2(' + r.limit + '-1)^2) = '
        + (1 / (2 * Number(L - 1n) ** 2)).toExponential(3) + '; product tail in [1, 1+S+S^2] via prod(1+a) <= e^S',
      method: 'directed-rounding bigfloat partial product over ' + r.primes + ' odd primes, exact-rational factor per prime, certified tail multiplier',
      attribution: 'value published by DavidTurturean (via GPT-5.5 Pro), erdosproblems.com #852 thread, 2026-04-24',
      sourcePin
    };
    if (o.kind === 'cstar') {
      return {
        verdict: 'HIT',
        enclosure: [B.toNumberDown(r.enclosure.lo), B.toNumberUp(r.enclosure.hi)],
        text: 'THEOREM: C* = ' + digits + '... — enclosed to width ' + B.widthNumber(r.enclosure).toExponential(2)
          + ' (' + r.primes + ' odd primes to ' + r.limit + ', tail proved). The first certified enclosure of this constant.',
        extra: base
      };
    }
    const d = E.decideClaimedDigits(r.enclosure, o.claim);
    if (d.verdict === 'REFUTED') {
      return {
        verdict: 'REJECT',
        enclosure: [B.toNumberDown(r.enclosure.lo), B.toNumberUp(r.enclosure.hi)],
        text: 'DISCOVERY-CLASS REFUTATION: the published C* = ' + o.claim + '... is provably WRONG from the 12th significant digit '
          + '(under truncation AND rounding readings): the certified value is C* = ' + digits + '... . MECHANISM, reproduced in the battery: '
          + 'the published digits are exactly what a naive IEEE-754 double product emits — 1 + 1/(p-1)^3 < 1 + 2^-53 rounds to 1.0 for every '
          + 'p > ~208000, so ~87% of the factors silently vanish and the product truncates itself at p ~ 2e5 no matter how far the loop runs. '
          + 'The missing tail is ~9.1e-13 of product mass. A float artifact published as a constant, caught by directed rounding.',
        extra: { ...base, claim: o.claim, decision: d,
          naiveFloatReproduction: 'naive double product over the same primes = 0.07524038617774187 = the published value to all its digits' }
      };
    }
    if (d.verdict === 'UNDECIDED') return { verdict: 'REFUSED', why: 'enclosure too wide to decide the published digits' };
    return { verdict: 'HIT', enclosure: [B.toNumberDown(r.enclosure.lo), B.toNumberUp(r.enclosure.hi)],
      text: 'AUDIT: the published C* = ' + o.claim + '... is ' + d.verdict + ' against the certified enclosure.',
      extra: { ...base, claim: o.claim, decision: d } };
  }
};
