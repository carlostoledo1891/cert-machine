#!/usr/bin/env node
/* build-report-erdos852.js — generate reports/erdos852.html: the two GPT
   constants on Erdős #852, certified — one survives as a rounding, one is
   refuted at its 12th significant digit and turns out to BE the float bug
   that computed it.

   Nothing on the page is remembered: the family re-certifies all four
   objects at build time (root re-bisected, product re-multiplied, sources
   re-hashed), the naive double product is re-run live and must reproduce
   the published digits, and the build fails if any verdict or digit moves.

   usage: node tools/build-report-erdos852.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const FAM = require(path.join(ROOT, 'families', 'erdos852-constants.js'));
const E = require(path.join(ROOT, 'instruments', 'erdos852', 'constants.js'));
const B = require(path.join(ROOT, 'instruments', 'bigfloat', 'bigfloat.js'));

const sh = (c) => { try { return cp.execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };
const die = (m) => { console.error('ERDOS852 REPORT REFUSED: ' + m); process.exit(1); };

/* ---- re-certify all four objects ----------------------------------------- */
const certs = {};
for (let i = 0; ; i++) {
  const o = FAM.enumerate(i); if (!o) break;
  certs[o.id] = { obj: o, cert: FAM.certify(o) };
}
const c0enc = certs['erdos852-c0-enclosure'], c0aud = certs['erdos852-c0-digits'];
const csenc = certs['erdos852-cstar-enclosure'], csaud = certs['erdos852-cstar-digits'];
if (!c0enc || !c0aud || !csenc || !csaud) die('expected 4 family objects');
if (c0enc.cert.verdict !== 'HIT' || c0aud.cert.verdict !== 'HIT') die('c0 verdicts moved');
if (csenc.cert.verdict !== 'HIT' || csaud.cert.verdict !== 'REJECT') die('C* verdicts moved');
if (c0aud.cert.extra.decision.verdict !== 'VERIFIED_ROUNDED') die('c0 audit is no longer VERIFIED_ROUNDED');
if (csaud.cert.extra.decision.verdict !== 'REFUTED') die('C* audit is no longer REFUTED');
const c0digits = c0enc.cert.extra.certifiedDigits;
const csdigits = csenc.cert.extra.certifiedDigits;
if (!c0digits.startsWith('1.3232282768639494')) die('c0 digits moved: ' + c0digits);
if (!csdigits.startsWith('0.075240386178309')) die('C* digits moved: ' + csdigits);

/* ---- the mechanism, re-run live ------------------------------------------ */
const LIM = 2000000;
const primes = E.oddPrimes(LIM);
let naive = 1, dropped = 0, logsum = 0;
for (const p of primes) {
  const a = 1 / ((p - 1) ** 3);
  const f = 1 + a;
  if (f === 1) dropped++;
  naive *= f;
  logsum += Math.log1p(a);
}
const naiveC = (naive - 1) / 2;
const log1pC = Math.expm1(logsum) / 2;
if (Math.abs(naiveC - 0.0752403861777418) > 1e-15) die('the naive product no longer reproduces the published digits: ' + naiveC);
const cs2e6 = E.cstar({ limit: LIM, P: 192 });
if (E.decideClaimedDigits(cs2e6.enclosure, '0.0752403861777').verdict !== 'REFUTED') die('refutation no longer holds at limit 2e6');
const dropPct = (100 * dropped / primes.length).toFixed(1);

/* ---- the page ------------------------------------------------------------- */
const O = [];

O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: 'The constant that was a rounding error',
  deck: 'Erdős problem #852 asks how long a run of consecutive prime gaps can stay pairwise distinct. Its '
    + 'discussion thread conjectures h(x) ~ c0 · log x, held up by two constants produced by GPT models and '
    + 'published as bare decimals. This page replaces both with certified interval enclosures. One survives — '
    + 'as a rounding. The other is refuted at its 12th significant digit, and the wrong digits are not near '
    + 'the truth by accident: they are EXACTLY what an IEEE-754 double-precision product emits, because 87% '
    + 'of its factors round to 1.0 and silently vanish. The published constant is the bug, printed.'
}));

O.push(C.stats([
  { k: 'c0 certified digits', v: '61', role: 'held', n: 'Unique positive root of I0(c) = 1, existence and uniqueness certified; the thread held an unverified decimal.' },
  { k: 'C* enclosure width', v: csenc.cert.extra.width.toExponential(1), role: 'held', n: csenc.cert.extra.primes.toLocaleString() + ' odd primes to ' + csenc.cert.extra.limit.toLocaleString() + ', tail multiplier proved.' },
  { k: 'published C*', v: 'REFUTED', role: 'warn', n: 'Wrong from significant digit 12, under truncation AND rounding readings — decided in exact integer arithmetic.' },
  { k: 'factors the float dropped', v: dropPct + '%', n: dropped.toLocaleString() + ' of ' + primes.length.toLocaleString() + ' factors at limit 2·10⁶ round to exactly 1.0 — re-measured during this build.' }
]));

O.push(C.scope('Local working document. The certified enclosures are theorems (every series truncated with an '
  + 'explicit remainder bound, every rounding directed outward, tail sums bounded by elementary integrals). '
  + 'The audits of the published decimals are exact-integer comparisons against those enclosures. One external '
  + 'identity is consumed for c0 — the dilog inversion formula (Lewin, Polylogarithms, eq. 1.12) — and one '
  + 'elementary-calculus fact, I0\'(c) = log((e^{2c}−1)/2c); both are independently cross-checked in the battery.'));

{
  const t = [
    [{ raw: C.m('c0') },
     { raw: C.m('1.32322827686395…') },
     { raw: C.m(c0digits.slice(0, 20) + '…') },
     { raw: C.esc('root of I0(c) = 1 · ' + c0enc.cert.extra.bisections + ' certified bisections') },
     { raw: C.tag('VERIFIED (as a rounding)', 'held') }],
    [{ raw: C.m('C*') },
     { raw: C.m('0.0752403861777…') },
     { raw: C.m(csdigits + '…') },
     { raw: C.esc('Euler product over ' + csenc.cert.extra.primes.toLocaleString() + ' odd primes + proved tail') },
     { raw: C.tag('REFUTED at digit 12', 'open') }]
  ];
  O.push(C.section({
    lab: '§1 · the verdicts', title: 'Two constants, decided', wide: true,
    bodyRaw: C.table({
      cols: [{ h: 'constant' }, { h: 'the thread says', cls: 'v' }, { h: 'certified value', cls: 'v' },
        { h: 'method' }, { h: 'verdict' }],
      rows: t
    })
    + '<div class="col">' + C.pRaw('Transcribed from the pinned bytes of the problem page and discussion thread '
      + '(erdosproblems.com/852, fetched 2026-08-25; sha256 re-hashed during this build — a drifted source refuses '
      + 'the audit). Both values were published by DavidTurturean on 2026-04-24, produced via GPT-5.5 Pro; the '
      + 'thread\'s conjectured asymptotic h(x) ~ 1.32323 · log x rests on c0, and the conditional lower-bound '
      + 'argument ruling out h(x) = o(log x) rests on the combined rate (1/2 + C*)c² + O(c³).') + '</div>'
  }));
}

{
  O.push(C.section({
    lab: '§2 · the mechanism', title: 'Why the published C* is wrong — exactly, and reproducibly',
    bodyRaw: '<div class="col">'
      + C.pRaw('C* = (1/2)(∏_{p≥3}(1 + 1/(p−1)³) − 1). In IEEE-754 double precision, ' + C.m('1 + 1/(p−1)³')
        + ' rounds to exactly ' + C.m('1.0') + ' as soon as ' + C.m('1/(p−1)³ < 2⁻⁵³') + ' — that is, for every '
        + 'prime p beyond ≈ 208,000. A naive float loop over any prime limit therefore computes the product '
        + 'only to p ≈ 2·10⁵ and silently discards everything after; the discarded mass is '
        + C.m('Σ_{p>208064} 1/(p−1)³ ≈ 9.1·10⁻¹³') + ' of log-product — which is precisely the size of the error '
        + 'in the published digits. Re-measured live during this build, over the odd primes to 2·10⁶:')
      + C.table({
        cols: [{ h: 'computation' }, { h: 'result', cls: 'v' }, { h: 'status' }],
        rows: [
          [{ raw: C.esc('naive double product (drops ' + dropPct + '% of factors)') }, { raw: C.m(naiveC.toFixed(16)) }, { raw: C.tag('= the published value, digit for digit', 'open') }],
          [{ raw: C.esc('double log1p sum (keeps every factor)') }, { raw: C.m(log1pC.toFixed(16)) }, { raw: C.esc('float-honest, still uncertified') }],
          [{ raw: C.esc('certified enclosure at the same limit') }, { raw: C.m('[' + B.toDecimal(cs2e6.enclosure.lo, 16, 'down') + ', ' + B.toDecimal(cs2e6.enclosure.hi, 16, 'up') + ']') }, { raw: C.tag('the authority', 'held') }]
        ]
      })
      + C.pRaw('The published ' + C.m('0.0752403861777418') + ' matches the naive float product to every printed '
        + 'digit and lies provably BELOW the certified enclosure. The constant was not approximately right with '
        + 'unlucky digits — it is the float artifact itself, published with 13 digits of confidence when only 11 '
        + 'were real. No amount of raising the prime limit would have fixed it; the loop was already ignoring '
        + 'every prime past 2·10⁵. This is the impostor-catalog failure mode inverted: there, true constants '
        + 'impersonate closed forms past every float screen; here, a float screen impersonated a constant.')
      + '</div>'
  }));
}

{
  O.push(C.section({
    lab: '§3 · the surviving constant', title: 'c0, and the half-ulp asterisk',
    bodyRaw: '<div class="col">'
      + C.pRaw('c0 is the unique positive root of I0(c) = 1, where the rate function of the iid geometric-gap '
        + 'model is')
      + C.eq(C.esc('I0(c) = c + c·log((e^{2c}−1)/(2c)) + (1/2)·Li2(1 − e^{2c})'))
      + C.pRaw('The dilog argument 1 − e^{2c} ≈ −13.1 sits far outside the series disk, so the certificate routes '
        + 'through the inversion identity Li2(−x) = −π²/6 − (1/2)log²x − Li2(−1/x), leaving only Li2 at '
        + '−1/x ≈ −0.076, where the defining series converges with a geometric tail bound. Everything else is '
        + 'exp, log and π at ' + c0enc.cert.extra.precisionBits + '-bit directed rounding. The root is then '
        + 'bisected ' + c0enc.cert.extra.bisections + ' times, each step a certified strict inequality '
        + 'I0(m) < 1 or I0(m) > 1. Uniqueness is free: the derivative collapses to')
      + C.eq(C.esc('I0\'(c) = log((e^{2c}−1)/(2c))  >  0   for c > 0,   since  e^{2c} > 1 + 2c'))
      + C.pRaw('and the strict inequality e^{2c} > 1 + 2c is itself certified on the bracket. The certified value:')
      + C.eq(C.m('c0 = ' + c0digits + '…'))
      + C.pRaw('The thread\'s printed ' + C.m('1.32322827686395…') + ' is a correct ROUNDING to 14 places — but '
        + 'its trailing ellipsis is a half-ulp slip: the true expansion continues …9469, not …95. Harmless here, '
        + 'but exactly the kind of slip a truncated-decimal culture cannot see, and an enclosure culture cannot miss.')
      + '</div>'
  }));
}

{
  O.push(C.section({
    lab: '§4 · the certificate', title: 'How a 1.9-million-factor product carries a proof',
    bodyRaw: '<div class="col">'
      + C.pRaw('Doubles cannot certify C* (they cannot even compute it, §2), and exact rationals cannot afford it '
        + '— the exact partial product over primes to 3·10⁷ has a denominator of ~10⁷ digits. The instrument '
        + 'built for this report (instruments/bigfloat/) is the missing middle: BigInt mantissa · 2^e with '
        + 'DIRECTED rounding, so every partial product is an interval [lo, hi] that provably brackets the exact '
        + 'rational product at ' + csenc.cert.extra.precisionBits + ' bits. The infinite tail is a certified multiplier:')
      + C.eq(C.esc('Σ_{p>L} 1/(p−1)³ ≤ Σ_{m≥L} 1/m³ ≤ ∫_{L−1}^∞ dt/t³ = 1/(2(L−1)²) = S,'
        + '    ∏(1+a_p) ≤ e^S ≤ 1 + S + S²'))
      + C.pRaw('using only p ≥ L+1 ⇒ p−1 ≥ L. At L = 3·10⁷ the tail is ≤ 5.6·10⁻¹⁶ and the whole enclosure is '
        + C.m(csenc.cert.extra.width.toExponential(2)) + ' wide. The same product engine is calibrated in the '
        + 'battery against a case with a known answer — ∏_{p≥3}(1 + 1/(p²−1)) = π²/8 (Euler) — and the tail '
        + 'check has a mutation red control: zero the tail bound and the calibration enclosure must EXCLUDE π²/8. '
        + 'It does. A tail that cannot be missed is not being checked.')
      + '</div>'
  }));
}

{
  O.push(C.section({
    lab: '§5 · check it', title: 'What a skeptic runs',
    bodyRaw: '<div class="col">'
      + C.pRaw(C.m('make test') + ' re-runs all of it: the bigfloat layer against exact rationals on random '
        + 'operands with π, ln 2 and e certified to 50 literature digits (14 checks, 5 red controls), and the '
        + 'erdos852 battery (22 checks, 5 red controls) — the π²/8 calibration with its mutation red, the '
        + 'derivative identity, the dilog inversion against direct quadrature, the bracket re-certification, '
        + 'the forged-pin refusal, and the naive-float reproduction of the published digits, live, every run. '
        + 'This page itself refuses to build if any verdict, digit, or the mechanism reproduction moves.')
      + '</div>'
  }));
}

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-erdos852.js — all four certificates re-derived, the naive float product re-run, sources re-hashed at build time; the build fails if any of it does not hold.') + '</p>'
  + '<p>' + C.esc('git ' + (sh('git rev-parse --short HEAD') || '—') + ' · cert-machine · Carlos Toledo') + '</p>'
  + '</footer>';

fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'erdos852.html'),
  TPL.render({ title: 'The constant that was a rounding error · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot }));

console.log('reports/erdos852.html written');
console.log('  c0  ' + c0digits.slice(0, 24) + '…  (' + c0enc.cert.extra.bisections + ' bisections, width ' + c0enc.cert.extra.width.toExponential(2) + ')');
console.log('  C*  ' + csdigits + '…  (' + csenc.cert.extra.primes + ' primes, width ' + csenc.cert.extra.width.toExponential(2) + ')');
console.log('  published C* REFUTED · naive float reproduces it: ' + naiveC.toFixed(16) + ' · dropped ' + dropPct + '% of factors');
