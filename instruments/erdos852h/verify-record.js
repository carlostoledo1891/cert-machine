/* erdos852h/verify-record — re-prove a record run from nothing.

   h.js finds records by streaming a segmented sieve through a two-pointer
   window. That is fast, and it is exactly the kind of code whose bug does not
   announce itself: the first deep run produced a "record" of length 14,730,343
   because an Int32Array holding gap indices wrapped at the 2^31-st prime.

   So the exhibits are re-proved HERE, by a path that shares no line with the
   scan: deterministic Miller-Rabin in BigInt for primality, next-prime by
   stepping, and a set for distinctness. It cannot confirm that a record is the
   SMALLEST index achieving its length — that is a statement about everything
   below it, and only the exhaustive scan can speak to it. What it certifies is
   the existence claim, which is the half a stranger can check in a minute:

     THIS prime opens THIS many consecutive gaps, and they are pairwise
     distinct, and the next gap repeats one of them so the run is exactly
     that long and not longer.

   usage: node instruments/erdos852h/verify-record.js <prime> <length> */
'use strict';

/* deterministic for n < 3.3e24 on these bases */
const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

function isPrime(n) {
  if (n < 2n) return false;
  for (const p of BASES) { if (n === p) return true; if (n % p === 0n) return false; }
  let d = n - 1n, r = 0n;
  while (d % 2n === 0n) { d /= 2n; r++; }
  const powMod = (a, e, m) => { let x = 1n; a %= m; while (e > 0n) { if (e & 1n) x = x * a % m; a = a * a % m; e >>= 1n; } return x; };
  for (const a of BASES) {
    let x = powMod(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let witness = true;
    for (let i = 1n; i < r; i++) { x = x * x % n; if (x === n - 1n) { witness = false; break; } }
    if (witness) return false;
  }
  return true;
}

const nextPrime = (n) => { let m = n + 1n; if (m % 2n === 0n) m++; while (!isPrime(m)) m += 2n; return m; };

/* Re-prove one record. Returns the exhibit, or throws with the reason. */
function verify(primeStr, len) {
  const p0 = BigInt(primeStr);
  if (!isPrime(p0)) throw new Error(primeStr + ' is not prime');
  const gaps = [], primes = [p0];
  let cur = p0;
  for (let i = 0; i < len; i++) { const nx = nextPrime(cur); gaps.push(Number(nx - cur)); primes.push(nx); cur = nx; }
  const seen = new Set(gaps);
  if (seen.size !== gaps.length) throw new Error('the ' + len + ' gaps are NOT pairwise distinct (' + seen.size + ' distinct)');
  /* the run must be exactly this long: the next gap has to repeat one already
     used, or the claimed length understates the run and the record is wrong */
  const nx = nextPrime(cur);
  const g = Number(nx - cur);
  const exact = gaps.includes(g);
  return {
    prime: p0.toString(), len, gaps,
    spans: [primes[0].toString(), primes[primes.length - 1].toString()],
    nextGap: g, exact
  };
}

module.exports = { isPrime, nextPrime, verify };

if (require.main === module) {
  const [p, l] = process.argv.slice(2);
  if (!p || !l) { console.error('usage: verify-record.js <prime> <length>'); process.exit(2); }
  const r = verify(p, Number(l));
  console.log('prime      ' + r.prime);
  console.log('length     ' + r.len + (r.exact ? '  (exact — the next gap ' + r.nextGap + ' repeats)' : '  WARNING: the run continues past ' + r.len));
  console.log('spans      ' + r.spans[0] + ' .. ' + r.spans[1]);
  console.log('gaps       ' + r.gaps.join(', '));
  console.log('distinct   ' + (new Set(r.gaps).size) + ' of ' + r.gaps.length);
  if (!r.exact) process.exit(1);
}
