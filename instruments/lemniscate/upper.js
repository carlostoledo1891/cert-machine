/* ERDOS-1038 — CERTIFIED upper bound for the infimum (chase item 1a).

   THEOREM (this certificate): for the probability measure
     μ = A·δ₋₁ + f(y)dy on I = [a,1],
     f(y) = [1 − A√(2(1+a))/(1+y)]/(π√((y−a)(1−y))),
   with the RATIONAL parameters a, A below (A chosen ≥ A(a) so the
   on-I level c = log((1−a)/4) + A·g(−1) is certified ≥ 0),
     |{x : U_μ(x) < 0}| = x_R − x_L ≤ [certified].
   Hence inf_μ |{U_μ < 0}| ≤ [certified] — the conjectured-minimizer
   value, previously known only as careful numerics (1.8344…1.8345).

   Analytic inputs (classical, quoted — the certificate's two literature
   identities, bridged numerically in lab-min.js to 1e-9..1e-16):
   (L1) arcsine potential: ∫_I log|x−y| dy/(π w(y)) = log((1−a)/4) for
        x ∈ I, = log((1−a)/4) + g(x) for x ∉ I  (w = √((y−a)(1−y)),
        g = Green's function of C∖I with pole ∞). [Saff–Totik Ch. I–II]
   (L2) balayage of δ₋₁ onto I has density √(2(1+a))/(π(1+y)w(y)) and
        potential log|x+1| − g(−1) on I; off I its potential is
        log|x+1| + g_Ω(x,−1) − g(−1) (two-pole Green's function).
        [Saff–Totik II.4; bridged]
   Consequences used (derived in CHASE/lab): mass(f) = 1 − A;
   U ≡ c on I;  U(x) = c + g(x) − A·g_Ω(x,−1) off I.
   Structure lemmas (one-line calculus, no computation):
   (S1) x < −1 ⇒ U′(x) = A/(x+1) + ∫ f/(x−y) < 0  (every term < 0)
        ⇒ at most one root left of −1; U → +∞ (x→−∞), → −∞ (x→−1⁻).
   (S2) −1 < x < a ⇒ U″(x) = −A/(x+1)² − ∫ f/(x−y)² < 0 (concavity)
        ⇒ with U(−1⁺) = −∞ and U(x_R) = 0 ≤ U(a) = c: U < 0 on
        (−1, x_R), U ≥ 0 on [x_R, a] — exactly one root.
   (S3) x > 1 ⇒ U′(x) > 0 (every term > 0), U(1) = c ≥ 0 ⇒ U > 0.
   So {U < 0} = (x_L, x_R) ∖ {−1} and the length is x_R − x_L.

   Everything below is outward-rounded interval arithmetic (lib/eqcert).
   Usage: node cert-min.js */
'use strict';

const fs = require('fs');
const path = require('path');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const T = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { iv, add, sub, mul, div, neg } = I;

let failures = 0;
function check(name, cond, detail) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!cond) failures++;
}
function sqrtIv(a) {
  if (a[0] < 0) throw new Error('sqrtIv: negative interval');
  return [I.nextDown(Math.sqrt(a[0])), I.nextUp(Math.sqrt(a[1]))];
}

/* rational parameters (exact doubles): a near the optimum (length(a) is
   flat to ~1e-8 within ±1e-4 of a*), A a hair above A(a) so c ≥ 0 */
const A_PARAM = 0.82452180;
const a = 0.804462;
const aI = iv(a), AI = iv(A_PARAM);

/* ζ(x) on the |ζ|>1 branch, interval x strictly outside [a,1] */
function zetaIv(x) {
  const phi = div(sub(mul(iv(2), x), add(aI, I.ONE)), sub(I.ONE, aI));
  const s2 = sub(mul(phi, phi), I.ONE);
  if (!(s2[0] > 0)) throw new Error('zetaIv: x not strictly outside I');
  const s = sqrtIv(s2);
  return phi[0] > 0 ? add(phi, s) : sub(phi, s);
}
const ZC = zetaIv(iv(-1));            // ζ(−1) < −1
const G_C = T.log(neg(ZC));           // g(−1) = log|ζ(−1)| > 0
const C_LEVEL = add(T.log(div(sub(I.ONE, aI), iv(4))), mul(AI, G_C));
check('on-I level c = log((1−a)/4) + A·g(−1) ≥ 0 (certified)', C_LEVEL[0] >= 0,
  `c ∈ [${C_LEVEL[0].toExponential(3)}, ${C_LEVEL[1].toExponential(3)}]`);

/* f ≥ 0 on I: smooth part 1 − A√(2(1+a))/(1+y) is increasing in y ⇒
   min at y = a (lemma); certified check there */
{
  const fmin = sub(I.ONE, div(mul(AI, sqrtIv(mul(iv(2), add(I.ONE, aI)))), add(I.ONE, aI)));
  check('f ≥ 0 on I (min at y=a, certified)', fmin[0] > 0, `min smooth part ≥ ${fmin[0].toFixed(6)}`);
}

/* U(x) off I: c + g(x) − A·g_Ω(x,−1), g_Ω(x,−1) = log|(ζζc−1)/(ζ−ζc)| */
function Uoff(x) {
  const z = zetaIv(x);
  const g1 = T.log(I.abs(z));
  const num = I.abs(sub(mul(z, ZC), I.ONE));
  const den = I.abs(sub(z, ZC));
  if (!(num[0] > 0 && den[0] > 0)) throw new Error('Uoff: degenerate Green');
  const g2 = sub(T.log(num), T.log(den));
  return add(C_LEVEL, sub(g1, mul(AI, g2)));
}

/* certified bisection: [lo,hi] with sign(U(lo)) = −sNeed…  keep
   endpoints where the interval evaluation is SIGN-DEFINITE */
function certRoot(lo, hi, name) {
  let ulo = Uoff(iv(lo)), uhi = Uoff(iv(hi));
  if (!(ulo[1] < 0 || ulo[0] > 0) || !(uhi[1] < 0 || uhi[0] > 0) ||
      (ulo[1] < 0) === (uhi[1] < 0)) throw new Error(name + ': bad bracket');
  for (let it = 0; it < 80; it++) {
    const mid = (lo + hi) / 2;
    if (mid === lo || mid === hi) break;
    const um = Uoff(iv(mid));
    if (um[1] < 0) { if (ulo[1] < 0) { lo = mid; ulo = um; } else { hi = mid; uhi = um; } }
    else if (um[0] > 0) { if (ulo[0] > 0) { lo = mid; ulo = um; } else { hi = mid; uhi = um; } }
    else break; // interval evaluation no longer sign-definite: stop, enclosure stands
  }
  console.log(`${name} ∈ [${Math.min(lo, hi)}, ${Math.max(lo, hi)}] (width ${Math.abs(hi - lo).toExponential(2)})`);
  return [Math.min(lo, hi), Math.max(lo, hi)];
}

/* brackets: (S1) U decreasing on (−∞,−1): U(−1.9) > 0 > U(−1.75);
   (S2) concave on (−1,a): U(−0.5) < 0 < U(0.4) */
const XL = certRoot(-1.9, -1.75, 'x_L');
const XR = certRoot(0.4, -0.5, 'x_R');   // hi-side first arg order handled by sign logic
const LEN_UP = I.nextUp(XR[1] - XL[0]);
const LEN_LO = I.nextDown(XR[0] - XL[1]);
check('length enclosure sane', LEN_LO > 1.834 && LEN_UP < 1.835, `[${LEN_LO}, ${LEN_UP}]`);

console.log(JSON.stringify({ a, A: A_PARAM, cLevel: C_LEVEL, xL: XL, xR: XR, len: [LEN_LO, LEN_UP] }));
if (!failures) {
  fs.writeFileSync(path.join(__dirname, 'cert-min.json'), JSON.stringify({
    statement: 'inf over probability measures on [-1,1] of |{U_mu < 0}| <= lenUp; witness mu = A*delta_{-1} + f dy on [a,1]',
    a, A: A_PARAM, cLevel: C_LEVEL, xL: XL, xR: XR, lenLo: LEN_LO, lenUp: LEN_UP,
    literatureInputs: ['arcsine potential identity (L1)', 'balayage of a point mass onto an interval (L2)'],
    builtAt: new Date().toISOString(),
  }, null, 1));
  console.log(`\nALL PASS — CERTIFIED: inf ≤ ${LEN_UP} (witness at a=${a}); |{U<0}| ∈ [${LEN_LO}, ${LEN_UP}]`);
}
process.exit(failures ? 1 : 0);
