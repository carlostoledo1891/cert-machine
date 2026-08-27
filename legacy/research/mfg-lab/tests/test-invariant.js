/* test-invariant.js — the GGR §4 clearing relation VERIFIED pathwise, its ray
   shown unique within the linear ansatz, and the obstruction beyond LQ.

   WHOSE RESULT THIS IS (novelty audit 2026-07-21, FINDINGS_LIT.md): ϖ+Π+cQ = 0
   IS the paper's balance condition — GGR §3.1 states Q_t = −(1/c)(ϖ_t + Π_t)
   as an identity in t. It is NOT a conservation law found here, and the value
   is 0, not an arbitrary constant. invDrift() below even seeds Π₀ = −C·Q̄ − w̄
   from that same condition, so inv0 ≡ 0 by algebra before any step is taken.
   What this battery certifies is the SCHEME: that the discretization carries
   the clearing constraint pathwise. The deformation checks (U7/U8) are
   SENSITIVITY, not evidence of clearing-forcedness — U8's drift is exactly
   linear in ε (see U8/U9), i.e. algebra.

   Tab 06 displays it conserved at ~5e-15 along every noise path. This battery
   characterizes the ray and the failure modes:

   1. THE RAY (symbolic, not computed here) — the ansatz I = c₀ϖ + c₁Π + c₂Q
      with pathwise dI ≡ 0 forces
      (drift cancellation)     c₂ = C·c₀
      (diffusion cancellation) (c₁ − c₀)·(a₂²(t) − C·a₂³(t)) = 0  for all t,
      so the ray is unique up to scale, (1,1,C), wherever the margin
      a₂²−C·a₂³ is alive (it dies only at t = T, where the terminal conditions
      collapse both coefficients). Uniqueness is WITHIN the ansatz class:
      constant-coefficient linear functionals. Nothing here rules out
      nonlinear, time-dependent or path-functional first integrals.
      [RETRACTED 2026-07-21] This header used to claim the battery "derives c₁
      by least squares, never assumes it". It does neither: c₀ = 1 and c₂ = C
      are imposed, and the least squares is a tautology — see U1.
   2. ε-SENSITIVITY, and what it is NOT. [RETRACTED framing 2026-07-21]
      This item used to read "KNIFE-EDGE … conservation is a structural
      consequence of clearing, not a generic feature." The drift is now
      DERIVED rather than plotted (P1-3), and it is exact for every ε:
          dI^ε = −ε·(C + a₂²(t))·s_S(t)·dW          (U8, pathwise 4.7e-13)
      Being exactly LINEAR in ε (U9) with a coefficient that never mentions
      the deformation mechanism, this is an algebraic consequence of rescaling
      one diffusion coefficient. It does NOT establish clearing-forcedness —
      a₂², a₂³ here are still the UNPERTURBED LQ solutions, so nothing was
      re-derived from a perturbed clearing condition (P1-2, R1 was right).
      What the exact form DOES give, and it is stronger than the old claim:
      the increment is pure dW with no dt term, so the deformed invariant is a
      MARTINGALE with Var[I^ε(T)−I(0)] = ε²·E∫(C+a₂²)²s_S²dt.
   3. THE RANK OBSERVATION — SCOPE CORRECTED 2026-07-21 after a literature
      check, which found the previous phrasing FALSE as written.
      A SINGLE vector field always admits n−1 independent local first
      integrals near a non-equilibrium point (flow-box / straightening
      theorem), so "full rank ⇒ no first integral" is impossible for one flow.
      The argument is only valid for a FAMILY. Ours is one: X_d (drift) and
      X_σ (diffusion). For an Itô SDE, I is a first integral iff D₀(I)=0 AND
      D_α(I)=0 for every diffusion component — so the right statement is about
      functions annihilated by BOTH fields, and full bracket rank is exactly
      Hörmander's condition, giving open Stroock–Varadhan support and hence no
      nonconstant common invariant. That chain is STANDARD (Sussmann, Trans.
      AMS 180 (1973); Olver Ch.1; Hörmander), and is cited, not claimed.
      The words "no-go", "non-integrable" and "KAM" are BANNED here — each
      summons a reviewer objection this computation cannot answer (see
      docs/FINDINGS_LIT.md). For the state-dependent loading L = load(t)(1+εQ),
      a hand-edited stand-in built on UNPERTURBED a₂², a₂³, no C¹ function is
      annihilated by both fields near the tested point:
      the Lie closure {X_d, X_σ, [X_d,X_σ], [X_σ,[X_d,X_σ]]} of
      the drift/diffusion fields attains full rank on an open set, so any F
      annihilated by all of them is locally constant. At ε = 0 the closure
      is rank-deficient everywhere (the rows are ⊥ dI — that IS the
      invariant), and the determinant is the measured certificate either
      way. All brackets are computed from closed-form coefficient
      derivatives (the a-ODEs' own right-hand sides); no finite differences.

   The kernel is EXTRACTED from mfg-lab.html at run time (never a copy);
   sha256 printed. Mutants prove the gates go red. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* A MISSING SUBJECT MUST BE A SENTENCE, NOT A STACK TRACE. Guard copied from
   test-index.js (which already solved this for itself). An unguarded
   readFileSync throws ENOENT: the runner sees a node internal frame and a
   nonzero exit, and cannot tell "the gate caught something" from "the gate is
   broken". Worse, the throw aborts the module, so every check after it — and
   the PASS/FAIL summary — silently stops running. MEASURED 2026-07-28: with
   MFG_HTML pointed at a missing path this battery printed ZERO PASS lines,
   ZERO FAIL lines and a stack trace. The guard prints on stdout, where this
   battery's other FAIL lines live, so a runner grepping one stream sees it. */
function mustExist(p, what, advice) {
  if (fs.existsSync(p)) return;
  console.log('FAIL  X0 ' + what + ' is not there: ' + p);
  console.log('      This is a MISSING FILE, not a failed assertion. ' + advice);
  console.log('\ninvariant gate FAILED — subject missing, so NO check in this battery ran.');
  process.exit(1);
}

const HTML = process.env.MFG_HTML || path.resolve(__dirname, '..', 'mfg-lab.html');
mustExist(HTML, 'the artifact this battery extracts the MGG kernel from',
  'Re-point MFG_HTML (or the default beside this file) at the artifact carrying MGG; ' +
  'if MGG has moved out of mfg-lab.html, this battery must be re-pointed deliberately, not left to crash.');
const src = fs.readFileSync(HTML, 'utf8');
console.log('artifact under test : ' + HTML);
console.log('  sha256 ' + crypto.createHash('sha256').update(src).digest('hex').slice(0, 16) +
  '  (' + src.length + ' bytes)\n');

const fails = [];
function check(name, cond, detail) {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '   [' + detail + ']' : ''));
  if (!cond) fails.push(name);
}

/* ---- extract the MGG kernel (constants through simulate — DOM-free) ----
   The region is selected by its OWN anchors — the MGG IIFE opener and the
   ALPHAS constant that follows the kernel — never by a span between the first
   <script> and the last </script>. The anchors must be UNIQUE: with two
   openers the slice would silently be the wrong one, and "located" would still
   read true. MEASURED 2026-07-28: pointed at research/mfg-congest/mfg-congest.html
   the located check went red by name and then `new Function` threw
   `SyntaxError: Unexpected token '<'` as a bare node stack — with mggOpen = −1,
   `src.slice(15, -1)` handed the whole HTML document to the evaluator. A crash
   is strictly worse than a red: it aborts the file, so every check after it and
   the summary never run. */
const MGG_OPEN = 'const MGG=(()=>{';
const MGG_CUT = 'const ALPHAS=';
const nOpen = src.split(MGG_OPEN).length - 1;
const mggOpen = src.indexOf(MGG_OPEN);
const mggCut = src.indexOf(MGG_CUT, mggOpen);
check('extraction: MGG kernel region located, and its opening anchor is unique',
  mggOpen > 0 && mggCut > mggOpen && nOpen === 1,
  nOpen + ' MGG opener(s) · open@' + mggOpen + ' cut@' + mggCut);
if (!(mggOpen > 0 && mggCut > mggOpen && nOpen === 1)) {
  console.log('      This is an ABSENT or AMBIGUOUS subject, not a failed assertion. Without both');
  console.log('      anchors the "kernel region" is not a kernel — with a missing opener the slice');
  console.log('      is the whole HTML document. If MGG moved out of this artifact, re-point');
  console.log('      MFG_HTML deliberately; do not let the slice guess.');
  console.log('\ninvariant gate FAILED — no unambiguous MGG region, so NO check in this battery ran.');
  process.exit(1);
}
let K;
try {
  K = new Function(src.slice(mggOpen + MGG_OPEN.length, mggCut) +
    '\nreturn {solveODEs,makeNoise,simulate,at,T,NO,dto,NP,dtp,QBAR,C};')();
} catch (e) {
  check('extraction: kernel evaluates and exports', false, e.name + ': ' + e.message);
  console.log('      A SyntaxError here means the sliced region is not the MGG kernel. Re-point the');
  console.log('      anchors at the artifact; never paste a copy of the kernel into this battery.');
  console.log('\ninvariant gate FAILED — kernel did not evaluate, so NO check in this battery ran.');
  process.exit(1);
}
check('extraction: kernel evaluates and exports', !!K.simulate && K.C === 1 && K.QBAR === 1);

const ALPHA = 0.25, SSCALE = 1.0, C = K.C;
const coef = K.solveODEs(ALPHA);

/* ================= 1 · the ray, and why no numerics can derive it =========
   [RESTRUCTURED 2026-07-21] U1/U2/U4 used to fit c₁ by least squares over the
   coefficient flow and report c₁ = 1.00000000000000 as the derivation. That
   was unfalsifiable. With A := a₂²−a₂³·load and b := load−C, one has A ≡ b
   ALGEBRAICALLY (both equal (a₂²−C·a₂³)/(1+a₂³)), so the fit computed
   Σ(A·b)/Σ(A²) = Σ(A²)/Σ(A²) = 1. It returns 1 for white noise.

   The same algebra kills any fancier numerical route. Stacking the two
   cancellation conditions per t gives rows
       r₁ = (−C, 0, 1)                    (drift)
       r₂(t) = (−load(t), A(t), 1)        (diffusion)
   and since A ≡ load−C, r₂(t) = r₁ + (load(t)−C)·(−1, 1, 0) for ANY
   coefficients whatsoever. So the row space, hence the null space (1,1,C), is
   fixed by the MODEL'S DEFINITIONS — the price drift being −C× the supply
   drift, and the clearing loading — and does not depend on the a-ODEs at all.
   No experiment on the coefficient flow can derive it, and none should claim
   to. The ray is symbolic; see FINDINGS_LIT.md. It is also, as the novelty
   audit records, the coefficient vector of GGR's own §3.1 balance condition.

   So the checks below assert what is actually true and can actually fail. */
const n90 = Math.floor(0.9 * K.NO);
const c1 = 1;                       /* the symbolic value — NOT fitted here */

/* U1 — the identity is ALGEBRAIC, not a property of the flow. Verified the way
   that claim is falsifiable: on RANDOM coefficients, where no ODE has run. If
   this ever goes red, the definitions of load/A have drifted apart. */
let identRand = 0;
for (let i = 0; i < 20000; i++) {
  const a22 = Math.random() * 10 - 5, a23 = Math.random() * 10 - 5;
  if (Math.abs(1 + a23) < 1e-3) continue;
  const load = (C + a22) / (1 + a23);
  identRand = Math.max(identRand, Math.abs((load - C) - (a22 - a23 * load)) /
    Math.max(1, Math.abs(load - C)));
}
check('U1 (load−C) ≡ (a₂²−a₂³·load) is ALGEBRAIC: holds on random coefficients, no ODE',
  identRand < 1e-12, 'max rel dev ' + identRand.toExponential(2) + ' over 20k random pairs');

let resMax = 0, margin = Infinity, identMax = 0;
for (let n = 0; n <= n90; n++) {
  const load = (C + coef.a22[n]) / (1 + coef.a23[n]);
  const A = coef.a22[n] - coef.a23[n] * load;
  resMax = Math.max(resMax, Math.abs(-load + A * c1 + C));
  margin = Math.min(margin, Math.abs(coef.a22[n] - C * coef.a23[n]));
  identMax = Math.max(identMax, Math.abs((load - C) - A));
}
check('U2 cancellation residual at the symbolic ray, over the solved flow', resMax < 1e-10,
  'max ' + resMax.toExponential(2) + ' (transcription guard, not evidence for the ray)');
check('U3 reduction non-degenerate: |a₂²−C·a₂³| alive on [0, 0.9T]', margin > 1e-4,
  'min ' + margin.toExponential(2) + ' — this is the condition the reduction needs, NOT a uniqueness margin');
check('U4 the same identity holds on the solved coefficients', identMax < 1e-12,
  'max dev ' + identMax.toExponential(2));

/* pathwise verification with the DERIVED ray, arbitrary c₁ and loading eps */
function invDrift(c1v, eps, seed) {
  const dWs = K.makeNoise(seed);
  const { a22, a23, a11 } = coef;
  const wbar = -(a11[0] + (a22[0] + C) * K.QBAR) / (1 + a23[0]);
  let Q = K.QBAR, W = wbar, Pi = -C * K.QBAR - wbar, d = 0;
  const inv0 = W + c1v * Pi + C * Q;
  for (let n = 0; n < K.NP; n++) {
    const t = n * K.dtp, dW = dWs[n];
    const A22 = K.at(a22, t), A23 = K.at(a23, t);
    const sS = SSCALE * Q, load = (C + A22) / (1 + A23) * (1 + eps), sP = -load * sS;
    const bS = 1 - Q;
    Q += bS * K.dtp + sS * dW;
    W += -C * bS * K.dtp + sP * dW;
    Pi += (A22 * sS + A23 * sP) * dW;
    d = Math.max(d, Math.abs(W + c1v * Pi + C * Q - inv0));
  }
  return d;
}
check('U5 invariant with the derived ray conserved pathwise (seed 42)',
  invDrift(c1, 0, 42) < 1e-12, 'drift ' + invDrift(c1, 0, 42).toExponential(2));
check('U6 conserved on a second path (seed 777)', invDrift(c1, 0, 777) < 1e-12,
  'drift ' + invDrift(c1, 0, 777).toExponential(2));
check('U7 uniqueness is observable: wrong ray (c₁ = 1.5) is NOT conserved',
  invDrift(1.5, 0, 42) > 1e-4, 'drift ' + invDrift(1.5, 0, 42).toExponential(2));
/* ---- U8/U9: the deformation drift is EXACT, and that is what demotes it ----
   ADVERSARIAL_REVIEWS P1-3 asked for "breaks at O(ε)" to be promoted from a
   plot to a proposition. It is stronger than first order. With I = ϖ+Π+CQ and
   load^ε = load·(1+ε), the ϖ- and Π-increments give

       dI^ε = [ sP(1+a₂³) + sS(a₂²+C) ] dW
            = −ε·(C + a₂²(t))·s_S(t)·dW          EXACTLY, for every ε

   because sP = −load^ε·sS makes sP(1+a₂³) = −(C+a₂²)(1+ε)sS. Two consequences:
     ε = 0  → pathwise conservation. That is GGR §3.1, THEIR relation.
     ε ≠ 0  → the increment is PURE dW with no dt term, so I is a MARTINGALE,
              not merely non-conserved, with
              Var[I^ε(T) − I(0)] = ε²·E ∫ (C+a₂²)² s_S² dt.

   AND THE PROPOSITION IS WHAT CONFIRMS P1-2 (R1's charge, [VERIFIED] here).
   The drift is exactly LINEAR in ε with a coefficient that does not involve the
   deformation mechanism at all. So U8 measures an algebraic consequence of
   rescaling one diffusion coefficient — it does NOT test "clearing-forcedness".
   A genuine test must perturb the CLEARING CONDITION and re-derive the
   coefficient ODEs; a₂², a₂³ here are still the unperturbed LQ solutions.
   U8 is therefore labelled for what it is, and its old "knife-edge" framing —
   which implied a structural fact about clearing — is retracted. */
/* Compares the invariant against the closed form AT EVERY STEP, not just at T.
   (The first version of this check compared invDrift's max-over-path against a
   terminal sum and went red at 3.7e-2 — the formula was right, the comparison
   was not. Same lesson as always: find out which side is wrong before touching
   anything.) */
function driftVsFormula(eps, seed) {
  const dWs = K.makeNoise(seed);
  const { a22, a23, a11 } = coef;
  const wbar = -(a11[0] + (a22[0] + C) * K.QBAR) / (1 + a23[0]);
  let Q = K.QBAR, W = wbar, Pi = -C * K.QBAR - wbar;
  const inv0 = W + Pi + C * Q;
  let pred = 0, worst = 0, scale = 0;
  for (let n = 0; n < K.NP; n++) {
    const t = n * K.dtp, dW = dWs[n];
    const A22 = K.at(a22, t), A23 = K.at(a23, t);
    const sS = SSCALE * Q, load = (C + A22) / (1 + A23) * (1 + eps), sP = -load * sS;
    const bS = 1 - Q;
    pred += -eps * (C + A22) * sS * dW;               // the closed form
    Q += bS * K.dtp + sS * dW;
    W += -C * bS * K.dtp + sP * dW;
    Pi += (A22 * sS + A23 * sP) * dW;
    worst = Math.max(worst, Math.abs((W + Pi + C * Q - inv0) - pred));
    scale = Math.max(scale, Math.abs(pred));
  }
  return { worst, scale, pred };
}
let u8worst = 0;
for (const e of [0.01, 0.2, 1.0, -0.5]) {
  const r = driftVsFormula(e, 42);
  u8worst = Math.max(u8worst, r.worst / Math.max(r.scale, 1e-12));
}
check('U8 the deformation drift equals −ε(C+a₂²)s_S dW EXACTLY, pathwise, all orders in ε',
  u8worst < 1e-10, 'worst pathwise deviation ' + u8worst.toExponential(2) + ' over ε ∈ {0.01,0.2,1,−0.5}');
{
  const d1 = Math.abs(driftVsFormula(0.01, 42).pred), d2 = Math.abs(driftVsFormula(0.02, 42).pred);
  check('U9 the drift is exactly LINEAR in ε — which is why U8 is algebra, not clearing-forcedness',
    Math.abs(d2 / d1 - 2) < 1e-9, 'drift(0.02)/drift(0.01) = ' + (d2 / d1).toFixed(12) +
    ' (exactly 2; a dynamical effect would not be)');
}

/* ================= 2 · the obstruction beyond LQ (Lie closure) =================
   Fields on (t, Q, ϖ, Π), all coefficients functions of (t, Q) only:
     X_d = ∂_t + (1−Q)∂_Q − C(1−Q)∂_ϖ
     X_σ = sQ·(∂_Q − L∂_ϖ + M∂_Π),   L = load(t)(1+εQ),  M = a₂² − a₂³L.
   C1 = [X_d, X_σ], C2 = [X_σ, C1] — closed forms below use only FIRST time
   derivatives of the coefficients, supplied exactly by the a-ODEs' RHS.
   det₄[X_d; X_σ; C1; C2] = det₃ of the (Q,ϖ,Π) block of (X_σ, C1, C2). */
function lieDet3(tt, Qv, eps) {
  const a = 1 / (1 + 2 * (K.T - tt));
  const a22 = K.at(coef.a22, tt), a23 = K.at(coef.a23, tt);
  const a22p = (1 + 2 * a) * a22 - a23;               // f22 — the ODE RHS
  const a23p = 2 * a * (1 + a23);                      // f23
  const load = (C + a22) / (1 + a23);
  const loadp = (a22p * (1 + a23) - (C + a22) * a23p) / ((1 + a23) ** 2);
  const s = SSCALE;
  const L = load * (1 + eps * Qv), Lt = loadp * (1 + eps * Qv), LQ = load * eps, LtQ = loadp * eps;
  const M = a22 - a23 * L, Mt = a22p - a23p * L - a23 * Lt, MQ = -a23 * LQ, MtQ = -a23p * LQ - a23 * LtQ;
  const F = 1 - Qv, G = s * Qv;
  /* C1 = [X_d, X_σ] */
  const C1Q = s;
  const C1W = -Lt * G - F * (LQ * G + L * s) - C * G;
  const C1P = Mt * G + F * (MQ * G + M * s);
  /* C2 = [X_σ, C1] = G·∂_Q(C1) − s·∂_Q(X_σ)  (both t-components vanish) */
  const dQ_C1W = -LtQ * G - Lt * s + (LQ * G + L * s) - F * (2 * LQ * s) - C * s;
  const dQ_C1P = MtQ * G + Mt * s - (MQ * G + M * s) + F * (2 * MQ * s);
  const C2Q = 0 - s * s;
  const C2W = G * dQ_C1W - s * (-(LQ * G + L * s));
  const C2P = G * dQ_C1P - s * (MQ * G + M * s);
  /* det of rows (X_σ, C1, C2) on columns (Q, ϖ, Π) */
  const m = [[G, -L * G, M * G], [C1Q, C1W, C1P], [C2Q, C2W, C2P]];
  const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
    - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  let scale = 0;
  for (const r of m) scale = Math.max(scale, Math.abs(r[0]), Math.abs(r[1]), Math.abs(r[2]));
  return { det, rel: Math.abs(det) / (scale ** 3 || 1) };
}
const PTS = [[0.2, 0.7], [0.35, 0.9], [0.5, 1.1], [0.7, 0.8]];
let lqMax = 0, defMin = Infinity;
for (const [tt, Qv] of PTS) {
  lqMax = Math.max(lqMax, lieDet3(tt, Qv, 0).rel);
  defMin = Math.min(defMin, lieDet3(tt, Qv, 0.2).rel);
}
check('L1 LQ case: Lie closure rank-deficient (det ≈ 0 at every sample — the invariant exists)',
  lqMax < 1e-13, 'max |det|/scale³ = ' + lqMax.toExponential(2));
/* SCOPE AND LOGIC, both corrected 2026-07-21.
   (a) The conclusion is about functions annihilated by BOTH X_d and X_σ, i.e.
       first integrals of the SDE — not of a flow. See the header.
   (b) OPENNESS NEEDS ONE POINT, NOT A SAMPLE. det is continuous, so a single
       point with det ≠ 0 already gives an open neighbourhood. Reporting a min
       over a sample was reporting a number where a one-line argument was
       available — by this project's own standard, a weak certificate. The
       check now asserts what actually carries the conclusion (one point,
       nonzero, with its conditioning) and reports the sample only as extra
       evidence that the point is not special.
   (c) The coefficients a₂², a₂³ are ODE-solved, so this is an exact expression
       evaluated on numerical inputs — NOT a symbolic proof. A referee would
       ask for the symbolic determinant; it is unavailable here only because
       the coefficients are numerical, and that limitation is stated rather
       than papered over. */
{
  const t0 = 0.35, Q0 = 0.9;
  const one = lieDet3(t0, Q0, 0.2).rel;
  check('L2 at ONE point (t=' + t0 + ', Q=' + Q0 + ') the closure det is nonzero, hence full rank ' +
    'on an open neighbourhood — so no C¹ function is annihilated by BOTH drift and diffusion there',
    one > 1e-4, '|det|/scale³ = ' + one.toExponential(2) +
    ' (continuity ⇒ open set; the sample below is corroboration, not the argument)');
  check('L2b the sample corroborates that the point is not special',
    defMin > 1e-4, 'min over ' + PTS.length + ' samples = ' + defMin.toExponential(2));
}
/* the obstruction is continuous in ε: smaller deformation, smaller but nonzero det */
const small = lieDet3(0.35, 0.9, 0.02).rel;
check('L3 obstruction scales with ε (ε = 0.02 still full rank, smaller det)',
  small > 1e-6 && small < lieDet3(0.35, 0.9, 0.2).rel, '|det|/scale³ = ' + small.toExponential(2));
/* mutant: with the bracket C1 deliberately mis-signed the LQ det must go nonzero */
{
  const tt = 0.35, Qv = 0.9;
  const a22 = K.at(coef.a22, tt), a23 = K.at(coef.a23, tt);
  const load = (C + a22) / (1 + a23), M = a22 - a23 * load, G = SSCALE * Qv, s = SSCALE;
  const r = lieDet3(tt, Qv, 0);
  const m = [[G, -load * G, M * G], [s, +C * s * 2, 0], [0, -s * s, 0]]; // corrupted C1 row
  const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
    - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  check('L4 mutant (corrupted bracket row) is CAUGHT — the LQ rank-deficiency is not vacuous',
    Math.abs(det) > 1e-4 && r.rel < 1e-13, '|det_mut| = ' + Math.abs(det).toExponential(2));
}

/* ---- vocabulary guard (2026-07-21 literature check) ----
   Each of these summons a reviewer objection this computation cannot answer:
   "no-go" and "non-integrable" invite Morales-Ramis / differential Galois
   theory (meromorphic integrability of complex Hamiltonian systems — silent on
   C1 integrals); "KAM" is persistence of invariant TORI, not of first
   integrals, and using it is a terminology error. Correct lineage:
   non-persistence of first integrals under perturbation (Poincare, Melnikov).
   Guarded in the ARTIFACT, because that is what a reader sees. */
{
  const pageText = src.replace(/<[^>]+>/g, ' ').toLowerCase();
  const banned = ['no-go', 'non-integrable', 'nonintegrable', 'kam-adjacent'];
  const hits = banned.filter(w => pageText.includes(w));
  check('V1 banned vocabulary absent from the artifact (no-go / non-integrable / KAM)',
    hits.length === 0, hits.length ? 'FOUND: ' + hits.join(', ') : banned.length + ' phrases absent');
  check('V2 the artifact credits the balance condition rather than claiming it',
    /balance condition/i.test(src) &&
    !/we (?:found|discovered) (?:a |the )?(?:new )?(?:conservation|invariant)/i.test(src),
    'attribution present, no discovery claim');
}

console.log('\n' + (fails.length ? fails.length + ' FAILURE(S)'
  : 'ALL PASS — GGR §3.1 clearing relation carried pathwise by the scheme (the one\n  falsifiable claim); deformation drift exact and linear in ε, so U7/U8 are\n  sensitivity not clearing-forcedness; rank observation scoped to functions annihilated by BOTH\n  drift and diffusion (Hormander/Sussmann, cited not claimed), at ONE point on a\n  hand-edited loading — a stand-in, not a model class.'));
process.exit(fails.length ? 1 : 0);
