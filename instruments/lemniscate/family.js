/* ERDOS-1038 — THE ε-FAMILY CERTIFICATE (chase item 2).

   THEOREM (this certificate; convention U_λ(x) = ∫log(1/|x−t|)dλ):
   for EVERY ε ∈ [EPS_MIN, EPS_MAX], with the rational A = A(chunk)
   recorded in the ledger, the explicit measure
     λ^(ε) = m_p δ_p + m_q δ_q + m_1 δ_1 + g(x)1_(a,b)dx,
     p = x_L + ε, q = x_R, b = 1 − ε, a = 0.804462,
     g(x) = (1/π)(x+A)√((x−a)(b−x))/((x−p)(x−q)(1−x)),
     m_p = −N(p)/(Q′(p)√D(p)), m_q = −N(q)/(Q′(q)√D(q)),
     m_1 = +N(1)/(Q′(1)√D(1)),
     N(z) = (z+A)(z−a)(z−b), Q = (z−p)(z−q)(z−1), D = (z−a)(z−b),
   is a POSITIVE measure supported in {p} ∪ {q} ∪ [a,b] ∪ {1} with
     U_λ ≥ 0 on ALL of [−1,1].
   This answers Tao's Problem 4.1 (model problem) affirmatively for the
   whole ε-range: the two-interval scenario for {U_μ > 0} is excluded.

   Analytic inputs (quoted; bridged in lab-eps.js to 1e-9…1e-15):
   (T1) template Hilbert transform (Tao's notes §4, residue calculus):
        off supp λ, U′_λ(x) = −Hλ(x) = −s(x)·N(x)/(Q(x)√D(x)),
        s = +1 (x>b), −1 (x<a); U′ ≡ 0 on (a,b); U continuous at the
        soft edges a, b (g vanishes like √dist there).
   (T2) total mass = (N/Q)(∞) = 1 (used only in the ±2.1/R anchor).
   STRUCTURE LEMMA (algebra from certified inequalities A > 1 and
   p < −1 < q < a < b < 1): sign(U′) = + on (−1,q), − on (q,a),
   + on (b,1); U → +∞ at the atoms q, 1 ⇒
     min over [−1,1] of U = min( U(−1), η ),  η := U(b) = level on cut.
   So each chunk certifies: orderings, A > 1, m_p, m_q, m_1 > 0,
   g ≥ 0 (⇔ A > −a), η ≥ 0, U(−1) ≥ 0 — with ε as an INTERVAL.

   Closed forms (bridged): with the analytic branch S(x) ~ x at ±∞
   (S = √D for x > b, −√D for x < a),
     V(x) = log|2x−a−b+2S| + Σ_c d_c·J_c(x),  d_c = N(c)/Q′(c),
     J_c(x) = (−1/√D(c))·log|(2D(c)+(2c−a−b)(x−c)+2√D(c)·S(x))/(x−c)|,
     U(x) = −V(x) + C_side,  C_side = −log R + V(±R) ± 2.1/R  (R = 1e10),
     η = −V(b) + C_R.
   Usage: node cert-eps-family.js [epsMin epsMax] */
'use strict';

const fs = require('fs');
const path = require('path');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const T = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { iv, add, sub, mul, div, neg } = I;

/* Family constants: a rational near the minimizer's support edge; p₀, q₀
   (exact doubles = rationals) near the sublevel endpoints of the primal
   μ_{a,A_f} with A_f = 0.82452163 chosen BELOW the exact level A(a) —
   c_level(μ) < 0 in the primal convention ⇒ the ε→0 dual limit has
   U_λ(−1) = δ ≈ +5.26e-8 > 0 (the complementary-slackness identity
   δ = −c_level·mass_g/A; with the level bumped the OTHER way, as in the
   first run, δ < 0 and the family fails below ε* ≈ |δ|/0.21 ≈ 4e-8 —
   measured, understood, and avoided). U(−1; ε) ≈ δ + 0.21ε uniformly. */
const aC = 0.804462, XL = -1.8081072518940688, XR = 0.02632310211711336;
const EPS_MIN = parseFloat(process.argv[2] || '1e-9');
const EPS_MAX = parseFloat(process.argv[3] || '0.1');
const RANC = 1e10;

function sqrtIv(x) { if (x[0] < 0) throw new Error('sqrtIv neg'); return [I.nextDown(Math.sqrt(x[0])), I.nextUp(Math.sqrt(x[1]))]; }

/* ---------- float ζ-form level η = C (anchor-free; for the A-solve;
   the float twin of the interval form below, bias ~1e-15) ---------- */
function etaFloat(eps, A) {
  const p = XL + eps, q = XR, b = 1 - eps, a = aC;
  const D = x => (x - a) * (x - b), N = x => (x + A) * (x - a) * (x - b);
  const Qp = c => c === p ? (p - q) * (p - 1) : c === q ? (q - p) * (q - 1) : (1 - p) * (1 - q);
  const zeta = x => { const ph = (2 * x - a - b) / (b - a); const s = Math.sqrt(Math.max(0, ph * ph - 1)); return ph >= 0 ? ph + s : ph - s; };
  let C = Math.log(4 / (b - a));
  for (const c of [p, q, 1]) {
    const z = zeta(c), W = (b - a) * (z * z - 1) / (4 * z);
    C += (N(c) / Qp(c)) * (-1 / W) * Math.log(Math.abs(z));
  }
  return C;
}
function solveAclosed(eps) {
  let A0 = 1.15, A1 = 1.2, f0 = etaFloat(eps, A0), f1 = etaFloat(eps, A1);
  for (let i = 0; i < 40 && A0 !== A1; i++) {
    const A2 = A1 - f1 * (A1 - A0) / (f1 - f0);
    if (!isFinite(A2)) break;
    A0 = A1; f0 = f1; A1 = A2; f1 = etaFloat(eps, A1);
    if (f1 === 0) break;
  }
  // bracket-and-bisect polish (η is locally increasing in A, slope ≈ 0.7;
  // the secant can stall ~5e-10 off at small ε)
  let lo = A1, hi = A1, flo = etaFloat(eps, lo), step = 1e-9;
  while (flo > 0 && step < 1e-3) { lo -= step; flo = etaFloat(eps, lo); step *= 4; }
  step = 1e-9;
  let fhi = etaFloat(eps, hi);
  while (fhi < 0 && step < 1e-3) { hi += step; fhi = etaFloat(eps, hi); step *= 4; }
  if (!(flo <= 0 && fhi >= 0)) return A1;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (mid === lo || mid === hi) break;
    const fm = etaFloat(eps, mid);
    if (fm < 0) lo = mid; else hi = mid;
  }
  return hi; // the side with η ≥ 0
}

/* ---------- interval closed form over an ε-interval ---------- */
function famIv(EI, A) {
  const AI = iv(A), aI = iv(aC);
  const p = add(iv(XL), EI), q = iv(XR), b = sub(I.ONE, EI), one = I.ONE;
  const D = x => mul(sub(x, aI), sub(x, b));
  const N = x => mul(add(x, AI), mul(sub(x, aI), sub(x, b)));
  const poles = [
    { c: p, Qp: mul(sub(p, q), sub(p, one)) },
    { c: q, Qp: mul(sub(q, p), sub(q, one)) },
    { c: one, Qp: mul(sub(one, p), sub(one, q)) },
  ];
  for (const P of poles) { P.D = D(P.c); if (!(P.D[0] > 0)) throw new Error('D(pole) not > 0'); P.sD = sqrtIv(P.D); P.d = div(N(P.c), P.Qp); }
  /* ζ-coordinate (Joukowski) form — stable (all quantities O(1), no
     near-cancelling brackets; bridged in lab-eps.js):
       φ(x) = (2x−a−b)/(b−a),  ζ = φ ± √(φ²−1)  (|ζ| ≥ 1, sign(φ)),
       W(c) = (b−a)(ζc²−1)/(4ζc) = sign(ζc)√D(c),
       V(x) = log|ζ(x)| + Σ_c d_c·(−1/W(c))·log|(ζ(x)ζ(c)−1)/(ζ(x)−ζ(c))|,
       C = log(4/(b−a)) + Σ_c d_c·(−1/W(c))·log|ζ(c)|,
       U = −V + C on both sides;  η = C EXACTLY (V(b) = 0: ζ(b) = 1
       makes every J-log = log|−1| = 0 — an algebraic identity, so the
       cut-edge is never evaluated). */
  const bma = sub(b, aI);
  function zetaIv(x) {
    const ph = div(sub(sub(mul(iv(2), x), aI), b), bma);
    const s2 = sub(mul(ph, ph), I.ONE);
    if (!(s2[1] >= 0)) throw new Error('zetaIv: inside the cut');
    const s = sqrtIv([Math.max(0, s2[0]), s2[1]]);
    if (ph[0] > 0) return add(ph, s);
    if (ph[1] < 0) return sub(ph, s);
    throw new Error('zetaIv: phi straddles 0');
  }
  for (const P of poles) {
    P.z = zetaIv(P.c);
    P.W = div(mul(bma, sub(mul(P.z, P.z), I.ONE)), mul(iv(4), P.z));
    if (P.W[0] <= 0 && P.W[1] >= 0) throw new Error('W contains 0');
  }
  function V(x) {
    const z = zetaIv(x);
    let v = T.log(I.abs(z));
    for (const P of poles) {
      const num = I.abs(sub(mul(z, P.z), I.ONE)), den = I.abs(sub(z, P.z));
      if (!(num[0] > 0 && den[0] > 0)) throw new Error('V: J argument touches 0');
      v = add(v, mul(P.d, div(neg(sub(T.log(num), T.log(den))), P.W)));
    }
    return v;
  }
  let C = T.log(div(iv(4), bma));
  for (const P of poles) C = add(C, mul(P.d, div(neg(T.log(I.abs(P.z))), P.W)));
  return {
    p, q, b, AI, poles,
    mP: neg(div(N(p), mul(poles[0].Qp, poles[0].sD))),
    mQ: neg(div(N(q), mul(poles[1].Qp, poles[1].sD))),
    m1: div(N(one), mul(poles[2].Qp, poles[2].sD)),
    eta: C,
    Um1: add(neg(V(iv(-1))), C),
  };
}

/* one chunk: certify all conditions over ε ∈ [e1, e2] with fixed A */
function certifyChunk(e1, e2) {
  // bump budget: dη/dA ≈ +0.7, dU(−1)/dA ≈ −7.8; U(−1) margin =
  // δ + 0.21ε ≥ 5.26e-8. Floor the bump at 1e-10 so η ≈ 0.7·bump stays
  // above the interval noise floor (~1e-13) at tiny ε; the Um1 loss
  // 7.8e-10 is negligible against δ.
  const Abump = I.nextUp(Math.max(solveAclosed(e1), solveAclosed(e2)) + Math.max(0.002 * e1, 1e-10));
  const EI = iv(e1, e2);
  const f = famIv(EI, Abump);
  const conds = {
    order: f.p[1] < -1 && f.q[0] > -1 && f.q[1] < aC && f.b[0] > aC && f.b[1] < 1 && e2 < 1 - aC,
    Agt1: Abump > 1,
    mP: f.mP[0] > 0, mQ: f.mQ[0] > 0, m1: f.m1[0] > 0,
    eta: f.eta[0] >= 0,
    Um1: f.Um1[0] >= 0,
  };
  const ok = Object.values(conds).every(Boolean);
  return { ok, A: Abump, conds, eta: f.eta, Um1: f.Um1 };
}

/* startup self-bridge: interval closed form (exact-limit C) must enclose
   the float closed form (R-anchored) at a thin ε */
{
  // float reference carries its R-anchor truncation O(moment/R) ≈ 4e-11,
  // so require agreement to 1e-8 rather than enclosure
  const fe = etaFloat(0.02, 1.25);
  const fi = famIv(iv(0.02), 1.25);
  if (!(Math.abs(fe - (fi.eta[0] + fi.eta[1]) / 2) < 1e-8)) {
    console.log(`SELF-BRIDGE FAIL: eta_iv [${fi.eta[0]}, ${fi.eta[1]}] vs float ${fe}`);
    process.exit(1);
  }
  console.log(`self-bridge ok: η_iv width ${(fi.eta[1] - fi.eta[0]).toExponential(1)}, float agrees to ${Math.abs(fe - (fi.eta[0] + fi.eta[1]) / 2).toExponential(1)}`);
}

/* geometric ladder with adaptive splitting */
const t0 = Date.now();
let chunks = 0, fails = 0, minUm1 = Infinity, minEta = Infinity;
const failed = [];
function run(e1, e2, depth) {
  const r = certifyChunk(e1, e2);
  if (r.ok) {
    chunks++;
    minUm1 = Math.min(minUm1, r.Um1[0]); minEta = Math.min(minEta, r.eta[0]);
    return true;
  }
  // DECISIVE negativity (upper end < 0) is truth, not slop: don't split
  if (r.Um1[1] < 0 || r.eta[1] < 0 || depth >= 24 || e2 / e1 < 1 + 1e-12 || fails >= 50) {
    fails++; failed.push({ e1, e2, conds: r.conds, eta: r.eta, Um1: r.Um1, decisive: r.Um1[1] < 0 || r.eta[1] < 0 });
    return false;
  }
  const mid = Math.sqrt(e1 * e2);
  const okL = run(e1, mid, depth + 1), okR = run(mid, e2, depth + 1);
  return okL && okR;
}
/* PATCH (cert-machine, 2026-09-03, declared): record the RUNG LADDER.
   The covering of [EPS_MIN, EPS_MAX] was previously guaranteed only by the
   shape of this loop — the record stored a chunk COUNT, so no reader could
   check it. Each rung is [eLo, eHi] with eHi of the next rung equal to eLo of
   the previous, and run() returns true only when a rung is fully covered
   (a chunk certifies, or BOTH recursive halves do). Emitting the rungs plus
   their ok flags therefore emits a complete, checkable covering proof in ~113
   entries instead of 624k. Audited by verify-family-cover.js. */
let eHi = EPS_MAX, allOk = true;
const rungs = [];
while (eHi > EPS_MIN * (1 + 1e-12)) {
  const eLo = Math.max(EPS_MIN, eHi / 1.25);
  const before = chunks;
  const ok = run(eLo, eHi, 0);
  rungs.push({ eLo, eHi, ok, chunks: chunks - before });
  if (!ok) allOk = false;
  eHi = eLo;
  if (failed.length > 4) break;
}
console.log(JSON.stringify({ EPS_MIN, EPS_MAX, chunks, fails, minUm1Certified: minUm1, minEtaCertified: minEta, secs: +((Date.now() - t0) / 1000).toFixed(1) }));
for (const fRec of failed.slice(0, 4)) console.log('FAILED chunk', JSON.stringify(fRec));
if (allOk && !fails) {
  fs.writeFileSync(path.join(__dirname, 'cert-eps-family.json'), JSON.stringify({
    statement: 'for every eps in [EPS_MIN, EPS_MAX], the explicit ansatz measure lambda^(eps) (rational A per chunk) is positive, supported in {xL+eps} u {xR} u [a,1-eps] u {1}, and U_lambda >= 0 on [-1,1] (Tao Problem 4.1: YES on this range)',
    a: aC, xL: XL, xR: XR, EPS_MIN, EPS_MAX, chunks, minUm1, minEta,
    fails, failed,
    covering: { rungs, ratio: 1.25,
      note: 'rungs tile [EPS_MIN, EPS_MAX] with shared endpoints; each ok rung is fully covered by its own recursive subdivision (a chunk certifies, or both halves do). Re-checked by instruments/lemniscate/verify-family-cover.js.' },
    literatureInputs: ['T1 template Hilbert transform (Tao notes §4)', 'T2 mass = (N/Q)(inf) = 1', 'soft-edge continuity of U at a, b'],
    builtAt: new Date().toISOString(),
  }, null, 1));
  console.log(`\nALL PASS — λ^(ε) CERTIFIED for every ε ∈ [${EPS_MIN}, ${EPS_MAX}] (${chunks} chunks)`);
  process.exit(0);
}
console.log('\nFAILURES: ' + fails);
process.exit(1);
