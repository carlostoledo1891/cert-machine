/* instruments/intake/erdos-488.js — Erdős #488 read from its INFORMAL statement only, for the Lean intake's F2
   (instance agreement). Written from the sentence erdosproblems.com prints (as quoted in DeepMind's docstring):

     Let A be a finite set and B = {n ≥ 1 : a ∣ n for some a ∈ A}. Is it true that, for every m > n ≥ max(A),
     |B ∩ [1,m]| / m < 2 |B ∩ [1,n]| / n ?

   No Lean, no formal-conjectures file and no claimant code was read to write it. Exact integers only: the conclusion is
   decided as |B∩[1,m]|·n < 2·|B∩[1,n]|·m, and is UNDEFINED (null) when n = 0 or m = 0 — the sentence divides by them.
   a ∣ x with a = 0 holds only for x = 0, which B excludes (x ≥ 1).

   instances(): the enumeration the spec pre-registers — every nonempty A ⊆ {0..5} (by bitmask 1..63, bit i ↦ i ∈ A),
   n in 0..5, m in 0..7, in that order (mask, then n, then m).                                                     MIT */
'use strict';

function instances() {
  const out = [];
  for (let mask = 1; mask < 64; mask++)
    for (let n = 0; n < 6; n++)
      for (let m = 0; m < 8; m++) out.push([[0, 1, 2, 3, 4, 5].filter((i) => (mask >> i) & 1), n, m]);
  return out;
}

const inB = (A, x) => x >= 1 && A.some((a) => (a === 0 ? x === 0 : x % a === 0));
const count = (A, k) => { let c = 0; for (let x = 1; x <= k; x++) if (inB(A, x)) c++; return c; };

/* the informal statement's parts on one instance: its two hypotheses and its conclusion (null where undefined) */
function informal([A, n, m]) {
  const cm = count(A, m), cn = count(A, n);
  return {
    'm > n': m > n,
    'n ≥ max(A)': n >= Math.max(...A),
    conclusion: n === 0 || m === 0 ? null : BigInt(cm) * BigInt(n) < 2n * BigInt(cn) * BigInt(m),
  };
}

module.exports = { instances, informal };
