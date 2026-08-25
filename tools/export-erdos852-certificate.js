#!/usr/bin/env node
/* export-erdos852-certificate.js — detach the Erdős #852 constant
   certificates as explicit exact data (the R7 pattern): everything a
   standalone verifier needs to re-decide both constants with no code from
   this repo. tools/verify_erdos852.py is that verifier — Python stdlib
   only, exact integers for the C* refutation, correctly-rounded decimal
   for the c0 bracket.

   The exported c0 bracket is deliberately COARSER than the instrument's:
   the 40-decimal window (truncate, truncate+1e-40) straddles the root with
   ~5e-41 margins on both sides (asserted here against the 2^-200 bracket),
   so an independent 130-digit evaluation of I0 decides both signs with
   ~60 digits to spare. The C* refutation is exported as a RECIPE in exact
   integers: the partial product over odd primes <= 400000 is a strict
   lower bound that already exceeds the published claim's window — no tail
   bound, no rounding, one integer inequality. */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const B = require(path.join(ROOT, 'instruments', 'bigfloat', 'bigfloat.js'));
const E = require(path.join(ROOT, 'instruments', 'erdos852', 'constants.js'));
const PIN = require(path.join(ROOT, 'instruments', 'pin.js'));

const die = (m) => { console.error('erdos852 export REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- c0 ---- */
const r = E.rootC0({ P: 320, targetBits: 200 });
const enc = B.I(r.lo, r.hi);
const digits = B.agreedDecimal(enc, 62);
if (!digits.startsWith('1.3232282768639494')) die('c0 digits moved: ' + digits);

/* the 40-decimal window: truncations of lo and hi must agree, and the root
   must be STRICTLY inside (margins are what the Python verifier lives on) */
const lo40s = B.toDecimal(enc.lo, 40, 'down');
if (lo40s !== B.toDecimal(enc.hi, 40, 'down')) die('40-decimal truncations of the bracket ends disagree');
const lo40num = BigInt(lo40s.replace('.', ''));
const den40 = 10n ** 40n;
if (!(B.cmpRat(enc.lo, lo40num, den40) > 0)) die('c0 does not strictly exceed its 40-decimal truncation');
if (!(B.cmpRat(enc.hi, lo40num + 1n, den40) < 0)) die('c0 does not sit strictly below truncation + 1e-40');
const hi40s = (() => {  /* lo40 + 1e-40 as a decimal string */
  const n = (lo40num + 1n).toString().padStart(41, '0');
  return n.slice(0, n.length - 40) + '.' + n.slice(n.length - 40);
})();

const dC0 = E.decideClaimedDigits(enc, '1.32322827686395');
if (dC0.verdict !== 'VERIFIED_ROUNDED') die('c0 claim verdict moved: ' + dC0.verdict);

/* ---- C* ---- */
const cs = E.cstar({ limit: 30000000, P: 192 });
const csLo = B.toDecimal(cs.enclosure.lo, 22, 'down');
const csHi = B.toDecimal(cs.enclosure.hi, 22, 'up');
if (!csLo.startsWith('0.075240386178309')) die('C* enclosure moved: ' + csLo);
const dCs = E.decideClaimedDigits(cs.enclosure, '0.0752403861777');
if (dCs.verdict !== 'REFUTED') die('C* claim verdict moved: ' + dCs.verdict);

/* ---- pins ---- */
const sourcePins = {};
for (const f of ['erdos852_page.html', 'erdos852_thread.html']) {
  const pv = PIN.verify(f);
  if (!pv.ok) die('pin failed for ' + f + ': ' + pv.why);
  sourcePins[f] = pv.sha256;
}

const cert = {
  what: 'Detached certificates for the two constants of Erdős problem #852 (erdosproblems.com/852): '
    + 'c0, the unique positive root of I0(c) = 1 with I0(c) = c + c·log((e^{2c}-1)/(2c)) + Li2(1-e^{2c})/2, '
    + 'and C* = (1/2)(prod_{p>=3}(1 + 1/(p-1)^3) - 1). Both were published in the problem thread '
    + '(2026-04-24) as bare decimals with no error bound. The claims here: c0 lies strictly inside '
    + 'bracket40 (so its first 40 decimals are as stated), the published c0 decimal is correct only as a '
    + 'rounding, and the published C* decimal is REFUTED — the true value differs from the 12th '
    + 'significant digit on. Verify with tools/verify_erdos852.py — Python stdlib only, no code from this repo.',
  generatedBy: 'tools/export-erdos852-certificate.js @ git ' + git,
  sourcePins,
  c0: {
    definition: 'the unique positive root of I0(c) = 1, I0(c) = c + c·log((e^{2c}-1)/(2c)) + Li2(1-e^{2c})/2; '
      + 'for c in the bracket use Li2(-x) = -pi^2/6 - log(x)^2/2 - Li2(-1/x) with x = e^{2c}-1 > 1 (Lewin 1.12)',
    certifiedDigits: digits,
    bracket40: { lo: lo40s, hi: hi40s,
      claim: 'I0(lo) < 1 < I0(hi), both margins ~5e-41 — decidable by any 100+ digit evaluation of I0' },
    uniqueness: 'I0\'(c) = log((e^{2c}-1)/(2c)) (elementary calculus) > 0 for c > 0 since e^{2c} > 1 + 2c; '
      + 'so the bracket contains THE root',
    published: { value: '1.32322827686395', verdict: dC0.verdict,
      note: 'correct as a rounding to 14 places; its trailing ellipsis is wrong — the expansion continues ...9469' },
    instrument: { precisionBits: r.P, bisections: r.iters }
  },
  cstar: {
    definition: '(1/2)(prod over primes p>=3 of (1 + 1/(p-1)^3) - 1)',
    enclosure: { lo: csLo, hi: csHi,
      method: 'directed-rounding partial product over ' + cs.primes + ' odd primes to ' + cs.limit
        + ' at ' + cs.P + ' bits; tail: sum_{p>L} 1/(p-1)^3 <= 1/(2(L-1)^2) = S, prod(1+a_p) <= e^S <= 1+S+S^2' },
    published: { value: '0.0752403861777', verdict: dCs.verdict,
      mechanism: 'the published decimal equals the naive IEEE-754 double product: 1 + 1/(p-1)^3 rounds to 1.0 '
        + 'once (p-1)^3 >= 2^53 (p-1 >= 208064), so ~87% of the factors vanish and the float product '
        + 'self-truncates at p ~ 2e5 regardless of the loop bound' },
    refutation: {
      limit: 400000,
      statement: 'the EXACT partial product N/D = prod_{3<=p<=400000, p prime}((q^3+1)/q^3), q = p-1, '
        + 'is a strict lower bound of the full product and already satisfies (N/D - 1)/2 > 752403861778/10^13, '
        + 'the upper edge of the published claim\'s window under BOTH truncation and rounding readings. '
        + 'One integer inequality: 5·(N-D)·10^12 > 752403861778·D. No tail bound, no rounding, no trust.'
    }
  }
};

fs.mkdirSync(path.join(ROOT, 'certs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'certs', 'erdos852-certificate.json'), JSON.stringify(cert, null, 1) + '\n');
console.log('certs/erdos852-certificate.json: c0 bracket40 + C* refutation recipe detached');
