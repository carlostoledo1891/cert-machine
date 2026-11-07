#!/usr/bin/env node
/* decide-p4.js — P4 of PREREG-488.md, the JavaScript decider (BigInt, no dependencies). Written apart from the Python
   decider (decide_p4.py, by another author, no shared code) and without reading the claim's proofs: the facts are the
   pre-registration's list, each re-derived from first principles.
   usage: node decide-p4.js [--controls]                                                                              */
'use strict';
const primesBelow = (n) => { const s = new Uint8Array(n).fill(1); s[0] = s[1] = 0; for (let i = 2; i * i < n; i++) if (s[i]) for (let j = i * i; j < n; j += i) s[j] = 0; const o = []; for (let i = 2; i < n; i++) if (s[i]) o.push(i); return o; };
const P = primesBelow(257), O = P.filter((p) => p !== 2);
const Q = O.reduce((a, p) => a * BigInt(p), 1n), PHI = O.reduce((a, p) => a * BigInt(p - 1), 1n);
/* φ from the factorisation over the primes below 257 (the cofactor must be 1), without assuming Q squarefree */
function totientSmooth(n, ps) { let r = n, m = n; for (const p0 of ps) { const p = BigInt(p0); if (m % p === 0n) { while (m % p === 0n) m /= p; r -= r / p; } } if (m !== 1n) throw new Error('not 256-smooth'); return r; }
const gap = (N, b, e) => 2n ** BigInt(N) * BigInt(b) ** BigInt(e) < 3n ** BigInt(N);
const bits = (x) => x.toString(2).length;
const facts = [
  { id: 'oddPrimes_card', what: '|{odd primes < 257}| = 53', ok: O.length === 53, n: O.length },
  { id: 'totient_Q', what: 'φ(Q) = ∏(p − 1) over the odd primes below 257 (φ computed from the factorisation)', ok: totientSmooth(Q, P) === PHI, Qbits: bits(Q) },
  { id: 'Q_large', what: '128 < Q', ok: 128n < Q },
  { id: 'constant_ratio', what: '3·Q < 16·φ(Q)', ok: 3n * Q < 16n * PHI, ratioPhiOverQ: Number((PHI * 10n ** 12n) / Q) / 1e12 },
  { id: 'endpoint_gap', what: '2^4096 · (8·4096 + 1)^53 < 3^4096', ok: gap(4096, 8 * 4096 + 1, 53), lhsBits: bits(2n ** 4096n * 32769n ** 53n), rhsBits: bits(3n ** 4096n) },
];
const out = { decider: 'decide-p4.js', Q: Q.toString(), phi: PHI.toString(), facts, allTrue: facts.every((f) => f.ok) };
if (process.argv.includes('--controls')) {
  out.controls = [
    { id: 'endpoint_gap_1000', what: '2^1000 · (8·1000 + 1)^53 < 3^1000 (must be false)', caught: !gap(1000, 8 * 1000 + 1, 53) },
    { id: 'constant_ratio_tighter', what: '3·Q < 14·φ(Q) (must be false: it needs φ/Q > 3/14 ≈ 0.2143)', caught: !(3n * Q < 14n * PHI) },
    { id: 'oddPrimes_card_54', what: '|odd primes < 257| = 54 (must be false)', caught: O.length !== 54 },
  ];
  out.controlsCaught = out.controls.every((c) => c.caught);
}
console.log(JSON.stringify(out, null, 1));
process.exit(out.allTrue && (out.controlsCaught !== false) ? 0 : 1);
