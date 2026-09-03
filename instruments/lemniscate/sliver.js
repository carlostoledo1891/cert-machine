/* ERDOS-1038 — THE SLIVER LEMMA: λ^(ε) for ALL ε ∈ (0, EPS0].
   Together with cert-eps-family.js ([EPS0, 0.1]) this closes Tao's
   Problem 4.1 for every ε ∈ (0, 0.1].

   Same family, ONE rational A_s for the whole sliver. All conditions
   are certified over the closed interval ε ∈ [0, EPS0] (valid a
   fortiori on (0, EPS0]; at ε = 0 itself the family degenerates —
   never claimed). The single ε→0-singular pole is c = 1:
   d₁ → 0 like ε, W₁ → 0 like √ε, ζ₁ → 1. SUBSTITUTION: t := ζ₁ − 1.
   Exactly (Joukowski):  φ₁ = 1 + t²/(2(1+t)),
     ε(t) = (1−a)(φ₁−1)/(φ₁+1) = (1−a)t²/(4 + 4t + t²),
     d₁/W₁ = 4(1+A)(1−a)²·t(1+t) / ((4+4t+t²)(t+2)·Q′(1)·(b−a))
   — the 0/0 cancels ALGEBRAICALLY, leaving t·(smooth), and
   t ∈ [0, t_up(EPS0)]. The two c=1 log-factors are O(t):
     in C:      log ζ₁ = log(1+t) ∈ [0, t]
     in V(−1):  log|(zζ₁−1)/(z−ζ₁)| = log(1 + t(z+1)/((z−1)−t))
   so both c=1 contributions are (t·smooth)·O(t) = O(ε) — enclosed by
   intervals with no division by a 0-containing quantity. Everything
   else (p- and q-pole terms, log(4/(b−a)), ζ(−1)) is evaluated directly
   over ε ∈ [0, EPS0] (widths ~1e-11 ≪ the δ ≈ 5.26e-8 margin).
   Structure lemma & conventions: as cert-eps-family.js.
   Usage: node cert-eps-sliver.js [EPS0] */
'use strict';

const fs = require('fs');
const path = require('path');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const T = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { iv, add, sub, mul, div, neg } = I;

const aC = 0.804462, XL = -1.8081072518940688, XR = 0.02632310211711336;
const EPS0 = parseFloat(process.argv[2] || '1e-12');
const A_S = 1.1833541845;   // rational: solveA(≈0) + ~1e-9 bump (checked below via η ≥ 0)

function sqrtIv(x) { if (x[0] < 0) throw new Error('sqrtIv neg'); return [I.nextDown(Math.sqrt(x[0])), I.nextUp(Math.sqrt(x[1]))]; }
let failures = 0;
function check(name, cond, detail) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!cond) failures++;
}

const EI = iv(0, EPS0);
const AI = iv(A_S), aI = iv(aC);
const p = add(iv(XL), EI), q = iv(XR), b = sub(I.ONE, EI), one = I.ONE;
const bma = sub(b, aI);

/* t_up: t(ε) is increasing; at ε = EPS0: φ₁ − 1 = 2ε/((1−a)−ε), and
   t = (φ₁−1) + √((φ₁−1)(φ₁+1)) — evaluate at thin EPS0, round up */
let T_UP;
{
  const e0 = iv(EPS0);
  const ph1m1 = div(mul(iv(2), e0), sub(sub(I.ONE, aI), e0));
  const t0 = add(ph1m1, sqrtIv(mul(ph1m1, add(ph1m1, iv(2)))));
  T_UP = t0[1];
}
const TI = iv(0, T_UP);
console.log(`sliver ε ∈ (0, ${EPS0}], t_up = ${T_UP.toExponential(3)}, A_s = ${A_S}`);

/* smooth poles p, q over EI (as cert-eps-family) */
function zetaIv(x) {
  const ph = div(sub(sub(mul(iv(2), x), aI), b), bma);
  const s2 = sub(mul(ph, ph), I.ONE);
  if (!(s2[1] >= 0)) throw new Error('zetaIv: inside cut');
  const s = sqrtIv([Math.max(0, s2[0]), s2[1]]);
  if (ph[0] > 0) return add(ph, s);
  if (ph[1] < 0) return sub(ph, s);
  throw new Error('zetaIv: phi straddles 0');
}
const D = x => mul(sub(x, aI), sub(x, b));
const N = x => mul(add(x, AI), mul(sub(x, aI), sub(x, b)));
const polesPQ = [
  { c: p, Qp: mul(sub(p, q), sub(p, one)) },
  { c: q, Qp: mul(sub(q, p), sub(q, one)) },
];
for (const P of polesPQ) {
  P.z = zetaIv(P.c);
  P.W = div(mul(bma, sub(mul(P.z, P.z), I.ONE)), mul(iv(4), P.z));
  P.d = div(N(P.c), P.Qp);
}
const Qp1 = mul(sub(one, p), sub(one, q));

/* c=1 in t-form: d1/W1 = 4(1+A)(1−a)²·t(1+t)/((4+4t+t²)(t+2)·Q′(1)(b−a)) */
const D1W1 = div(
  mul(mul(iv(4), mul(add(I.ONE, AI), mul(sub(I.ONE, aI), sub(I.ONE, aI)))), mul(TI, add(I.ONE, TI))),
  mul(mul(add(add(iv(4), mul(iv(4), TI)), mul(TI, TI)), add(TI, iv(2))), mul(Qp1, bma)));

/* ---------- η = C over the sliver ---------- */
let C_PQ = T.log(div(iv(4), bma));
for (const P of polesPQ) C_PQ = add(C_PQ, mul(P.d, div(neg(T.log(I.abs(P.z))), P.W)));
// c=1 term of C: −(d1/W1)·log(1+t), log(1+t) ∈ [0, t] (log(1+t) ≤ t, ≥ 0)
const H1C = neg(mul(D1W1, iv(0, T_UP)));
const ETA = add(C_PQ, H1C);
check('η(ε, A_s) ≥ 0 for all ε ∈ (0, EPS0]', ETA[0] >= 0, `η ∈ [${ETA[0].toExponential(3)}, ${ETA[1].toExponential(3)}]`);

/* ---------- U(−1) = C − V(−1) over the sliver ---------- */
const z1 = zetaIv(iv(-1));
let Vm1_PQ = T.log(I.abs(z1));
for (const P of polesPQ) {
  const num = I.abs(sub(mul(z1, P.z), I.ONE)), den = I.abs(sub(z1, P.z));
  if (!(num[0] > 0 && den[0] > 0)) throw new Error('V(−1): J arg touches 0');
  Vm1_PQ = add(Vm1_PQ, mul(P.d, div(neg(sub(T.log(num), T.log(den))), P.W)));
}
// c=1 term of V(−1): −(d1/W1)·log(1 + t(z+1)/((z−1)−t));  u := t(z+1)/((z−1)−t)
const u = div(mul(TI, add(z1, I.ONE)), sub(sub(z1, I.ONE), TI));
if (!(u[0] > -0.5)) throw new Error('u too large for log(1+u) enclosure');
const log1u = T.log(add(I.ONE, u));
const H1V = neg(mul(D1W1, log1u));
const UM1 = sub(add(C_PQ, H1C), add(Vm1_PQ, H1V));
check('U(−1; ε, A_s) ≥ 0 for all ε ∈ (0, EPS0]', UM1[0] >= 0, `U(−1) ∈ [${UM1[0].toExponential(4)}, ${UM1[1].toExponential(4)}]`);

/* ---------- positivity of the measure & structure inputs ---------- */
const mP = neg(div(N(p), mul(polesPQ[0].Qp, sqrtIv(D(p)))));
const mQ = neg(div(N(q), mul(polesPQ[1].Qp, sqrtIv(D(q)))));
check('m_p > 0', mP[0] > 0, `≥ ${mP[0].toFixed(6)}`);
check('m_q > 0', mQ[0] > 0, `≥ ${mQ[0].toFixed(6)}`);
// m_1 = (d1/W1-type positive smooth)·t·(√-normalization) > 0 for t > 0:
// m1 = N(1)/(Q′(1)√D(1)); N(1) = (1+A)(1−a)ε > 0, Q′(1) > 0, √D(1) > 0 for ε > 0
check('m_1 > 0 for ε > 0 (sign factors certified)', add(I.ONE, AI)[0] > 0 && sub(I.ONE, aI)[0] > 0 && Qp1[0] > 0, 'N(1), Q′(1) > 0');
check('density ≥ 0 (A_s > 1 ≥ −a) and A_s > 1', A_S > 1);
check('orderings for ε ∈ (0, EPS0]: p < −1 < q < a < b < 1', p[1] < -1 && q[0] > -1 && q[1] < aC && b[0] > aC && EPS0 < 1 - aC);

console.log(failures ? `\nFAILURES: ${failures}` : `\nALL PASS — λ^(ε) certified for every ε ∈ (0, ${EPS0}]; with cert-eps-family.json, Problem 4.1 holds for ALL ε ∈ (0, 0.1].`);
if (!failures) fs.writeFileSync(path.join(__dirname, 'cert-eps-sliver.json'), JSON.stringify({
  statement: 'for every eps in (0, EPS0], lambda^(eps) with A = A_S is positive with U >= 0 on [-1,1]; composes with cert-eps-family.json to all eps in (0, 0.1]',
  a: aC, xL: XL, xR: XR, A_S, EPS0, tUp: T_UP, eta: ETA, Um1: UM1,
  builtAt: new Date().toISOString(),
}, null, 1));
process.exit(failures ? 1 : 0);
