/* pattern-check.js — test the 4k(k+1) law at k = 6 and its non-member controls.
 *
 * The law — for EVEN d, disc(f_d) is a perfect square iff d = 4k(k+1) — is now a THEOREM (theorem.js
 * proves it from disc(f_d) = (d+1)(2^l l! disc h)²). This file predates the proof: it was
 * the blind k = 6 test run while the law was still a five-point conjecture, and it is kept
 * as an independent numerical confirmation of the theorem's k = 6 instance, not as the
 * evidence the law rests on.
 * Prediction: d = 168 (k = 6) is a perfect square; every other even d in 122..170 is not.
 *
 * Certificates:
 *   NONSQUARE — one prime p with disc mod p a quadratic non-residue (Euler criterion).
 *   SQUARE    — exact disc by CRT + Hadamard bound, then exact integer sqrt.
 * Controls: d = 120 (known member: no non-residue may appear) and d = 118 (known
 * non-member: a non-residue must appear) anchor both directions before 122..170 is read.
 */
'use strict';
const path = require('path');
const { fdCoeffs, discModP, discExact, isqrtCheck, npowmod } = require(path.join(__dirname, 'galois-exceptions.js'));

function primesFrom(start, count) {
  const ps = [];
  for (let n = start; ps.length < count; n++) {
    let ok = n > 1;
    for (let q = 2; q * q <= n; q++) if (n % q === 0) { ok = false; break; }
    if (ok) ps.push(n);
  }
  return ps;
}
const TESTP = primesFrom(1048576, 60);

/* returns {verdict:'NONSQUARE', p} on a non-residue witness, or {verdict:'NO-WITNESS'} */
function nonsquareWitness(coeffs, cap) {
  let tried = 0;
  for (const p of TESTP) {
    if (tried >= cap) break;
    const dp = discModP(coeffs, p);
    /* undefined = p | lc (skip, no residue); 0 = p | disc (no Euler verdict either way) */
    if (dp == null || dp === 0) continue;
    tried++;
    const e = npowmod(dp, (p - 1) / 2, p);
    if (e === p - 1) return { verdict: 'NONSQUARE', p, tried };
  }
  return { verdict: 'NO-WITNESS', tried };
}

function main() {
  const t0 = Date.now();
  let fails = 0;
  const check = (name, ok) => { console.log((ok ? 'ok   ' : 'FAIL ') + name); if (!ok) fails++; };

  /* controls */
  const c120 = nonsquareWitness(fdCoeffs(120), 40);
  check('CONTROL d=120 (member): no non-residue in 40 primes', c120.verdict === 'NO-WITNESS');
  const c118 = nonsquareWitness(fdCoeffs(118), 40);
  check('CONTROL d=118 (non-member): non-residue witness found (p=' + (c118.p || '—') + ')', c118.verdict === 'NONSQUARE');

  /* the range 122..170, excluding the predicted member 168 */
  const failures = [];
  for (let d = 122; d <= 170; d += 2) {
    if (d === 168) continue;
    const r = nonsquareWitness(fdCoeffs(d), 40);
    const line = 'd=' + d + ': ' + r.verdict + (r.p ? ' at p=' + r.p : '') + ' (' + r.tried + ' primes tried)';
    console.log('  ' + line);
    if (r.verdict !== 'NONSQUARE') failures.push(d);
  }
  check('every even non-member in 122..170 certified NONSQUARE', failures.length === 0);

  /* the prediction: d = 168 exact */
  console.log('  computing disc(f_168) exactly (CRT + Hadamard)…');
  const t1 = Date.now();
  const d168 = discExact(fdCoeffs(168));
  console.log('  disc(f_168): ' + d168.toString().length + ' digits, ' + (Date.now() - t1) + ' ms');
  const sq = isqrtCheck(d168 < 0n ? -1n : d168);
  check('PREDICTION d=168 (k=6): disc(f_168) is a PERFECT SQUARE', d168 > 0n && sq);
  /* the digit count is quoted in the write-up and every post; a quoted number is an assertion */
  check('disc(f_168) has exactly 45336 decimal digits, as published', d168.toString().length === 45336);

  console.log((Date.now() - t0) + ' ms · ' + (fails === 0
    ? 'ALL PASS — the 4k(k+1) law survives its sixth data point and 24 non-member controls.'
    : fails + ' CHECK(S) FAILED — the law (or a control) broke; report it as it fell.'));
  process.exit(fails === 0 ? 0 : 1);
}
main();
