/* galois-exceptions-lean.js — the erdos290 instrument with a MEMORY-LEAN
   candidateDeltas, for l = 87..90 and beyond.

   THE WALL IT REMOVES. The lifted instrument's candidateDeltas(l)
   materializes every partition of l with per-partition class data. p(86) =
   34.3M partitions still fit in a V8 heap; p(87) = 38.9M did not — the two
   recorded OOMs that stopped the tail extension at l = 86 were this array.

   THE REPLACEMENT. The five candidate densities are sums over conjugacy
   classes weighted by 2^(−fix), and those sums have CLOSED FORMS from the
   cycle-index EGF of the symmetric group:
     Σ_{σ∈S_l} u^fix(σ)        = l!·[z^l] e^{(u−1)z}/(1−z)
                               → Σ_j (−1)^j (l!/j!) / 2^j          at u = 1/2
     Σ_{σ∈S_l} sgn(σ)·u^fix(σ) = l!·[z^l] (1+z)·e^{(u−1)z}
                               = (u−1)^l + l(u−1)^{l−1}
                               → (−1)^l (1 − 2l) / 2^l             at u = 1/2
   Even-subgroup sums are (all + signed)/2; the σ = id boost is the same
   surgical term the enumerated version applies. O(l) arithmetic replaces
   p(l) object allocations. δ(ES0)(4) = 150/384 — the instrument's own
   cross-validation value — is reproduced exactly (battery-pinned), and
   tools/erdos290-lean-battery.js proves closed-form == enumerated for
   every l ≤ 12 plus reds that must fire.

   HOW THE FORK STAYS HONEST. This file never copies the instrument: it
   READS the lifted source at require time, REFUSES unless its sha256 is
   the pinned lift hash (so the two can never drift silently), splices the
   one function, and compiles the result. Everything except candidateDeltas
   is the lifted bytes, mechanically. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'legacy', 'research', 'challenges', 'erdos290', 'galois-exceptions.js');
const PINNED_SHA = 'f3b9436c42955cb5684ddb0015bfae17f54e950544231b1006c38ca490eaf12f';

const src = fs.readFileSync(SRC, 'utf8');
const sha = crypto.createHash('sha256').update(src).digest('hex');
if (sha !== PINNED_SHA) {
  throw new Error('galois-exceptions-lean REFUSES: the lifted source moved ('
    + sha + ' != pinned ' + PINNED_SHA + ') — re-pin deliberately, never silently');
}

/* the exact span being replaced: from the δ-comment through the end of
   candidateDeltas (the brace line before the signed-solver comment) */
const START = '/* δ of the five candidates, exact.';
const END = '/* ---------- signed-type solver:';
const i0 = src.indexOf(START), i1 = src.indexOf(END);
if (i0 < 0 || i1 < 0 || i1 <= i0 || src.indexOf(START, i0 + 1) !== -1) {
  throw new Error('galois-exceptions-lean REFUSES: replacement markers not found exactly once');
}

const LEAN = `/* δ of the five candidates, exact — CLOSED FORM (lean fork; see
 * tools/galois-exceptions-lean.js for the derivation and the pin). */
function candidateDeltas(l) {
  let L = 1n; for (let i = 2; i <= l; i++) L *= BigInt(i);
  const pow2l = 2n ** BigInt(l);
  /* Anum/2^l = Σ_σ 2^{−fix(σ)} : Anum = Σ_j (−1)^j (l!/j!) 2^{l−j} */
  let Anum = 0n, fall = L, sign = 1n;
  for (let j = 0; j <= l; j++) {
    Anum += sign * fall * (2n ** BigInt(l - j));
    sign = -sign;
    if (j < l) fall = fall / BigInt(j + 1);
  }
  const A  = R(Anum, pow2l);
  const As = R((l % 2 === 0 ? 1n : -1n) * (1n - 2n * BigInt(l)), pow2l);
  const idA = R(1n, pow2l);
  const boost = l % 2 === 0 ? R(1n, pow2l / 2n) : ZERO;
  /* |ker sgn| = (Σ1 + Σsgn)/2 = l!/2 for l ≥ 2 — but sgn is TRIVIAL on
     S_0 and S_1, where the even subgroup is the whole group */
  const totalAll = R(L, 1n), totalEven = l <= 1 ? R(L, 1n) : R(L, 2n);
  const evenA = div(add(A, As), R(2n, 1n));
  const dOf = (noFix, total) => sub(ONE, div(noFix, total));
  const B   = dOf(A, totalAll);
  const FA  = dOf(evenA, totalEven);
  const ES0 = dOf(add(sub(A, idA), boost), totalAll);
  const EA0 = dOf(add(sub(evenA, idA), boost), totalEven);
  return { B, FA, ES0, ESs: ES0, EA0 };
}

`;

const patched = src.slice(0, i0) + LEAN + src.slice(i1);

const m = new Module(SRC + '#lean', module);
m.filename = SRC + '#lean';
m.paths = Module._nodeModulePaths(path.dirname(SRC));
m._compile(patched, SRC);

module.exports = m.exports;
module.exports.__lean = true;
module.exports.__pinnedSha = PINNED_SHA;
