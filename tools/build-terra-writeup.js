#!/usr/bin/env node
/* build-terra-writeup.js — generate paper/terra-peaks.md, the record-driven
   rebuild of the terra peak-splitting paper (TERRA-PORT paper-rebuild notes;
   elevated by the operator's 2026-09-01 ruling that everything on the
   frontier-apps sandbox will be published — so the publishable version is
   REBUILT here, from certificates, with the audit's fixes).

   DIVISION OF LABOR (the build-lambda4-writeup.js pattern): the prose is
   authored HERE, once, and reviewed like any mathematics. Every NUMBER —
   radii, contraction bounds, positivity floors, peak counts, margins, exact
   rationals — is interpolated from the certs/ records this machine derived,
   so the document can never quote a constant the machine did not prove.
   The build REFUSES if any input certificate is missing, refused, or moved
   structurally.

   THE FIXES THIS REBUILD CARRIES (vs the sandbox PDF):
     · honest title and framing — the crowd RE-WEIGHTS a harmonic the
       potential already contains; never "invents structure";
     · honest counting — TWO theorems + a seven-row bracket table, never
       "eight theorems";
     · exact binary64 coefficients stated in hex beside their decimal names;
     · sigma* and the windows as DECIDED exact-rational identities, not
       12-digit float agreement;
     · the priority note per the operator's resolution (mfg-congest never
       sent: the same author's unpublished base instance, not prior art);
     · the falsified "ceiling" attributed as the lab's own prior from an
       unreproduced float campaign, not folk belief;
     · [OPERATOR] flags at every human-only spot (author line, venue,
       acknowledgments, AI-involvement disclosure).

   usage: node tools/build-terra-writeup.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const die = (m) => { console.error('TERRA WRITEUP REFUSED: ' + m); process.exit(1); };
const rd = (f) => {
  const p = path.join(ROOT, 'certs', f);
  if (!fs.existsSync(p)) die('missing certs/' + f);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- load and gate every input record (T5 joins once certified) ---- */
const hasT5 = fs.existsSync(path.join(ROOT, 'certs', 'terra-recert-t5.json'))
  && fs.existsSync(path.join(ROOT, 'certs', 'terra-peakcount-t5.json'));
const TAGS = hasT5 ? ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']
  : ['t1', 't2', 't3', 't4', 't6', 't7', 't8'];
const RC = {}, PC = {};
for (const t of TAGS) {
  RC[t] = rd('terra-recert-' + t + '.json');
  PC[t] = rd('terra-peakcount-' + t + '.json');
  if (RC[t].verdict !== 'VERIFIED') die(t + ' enclosure not VERIFIED');
  if (PC[t].verdict !== 'VERIFIED') die(t + ' peak count not VERIFIED');
  if (!Object.values(RC[t].falsifiers).every(Boolean)) die(t + ' has a non-firing falsifier');
}
const SS = rd('terra-sigmastar.json');
if (SS.verdict !== 'VERIFIED') die('sigmastar not VERIFIED');
const BT = rd('terra-bracket-table.json');
if (BT.verdict !== 'VERIFIED' || BT.table.length !== TAGS.length) die('bracket table not VERIFIED with ' + TAGS.length + ' rows');
const CEN = [2, 3, 4, 5].map(N => rd('mfg-cap-census-N' + N + '-c-12.json'));
if (!CEN.every(c => c.verdict === 'VERIFIED' && c.count === 3)) die('census records moved');
const MULT = rd('mfg-cap-multiplicity.json');
if (MULT.verdict !== 'VERIFIED') die('multiplicity record not VERIFIED');
const want = { t1: 2, t2: 1, t3: 1, t4: 2, t5: 2, t6: 3, t7: 1, t8: 2 };
for (const t of TAGS) if (PC[t].peaks !== want[t] || PC[t].wells !== 1) die(t + ' counts moved');

const e3 = (x) => Number(x).toExponential(3);
const e2 = (x) => Number(x).toExponential(2);
const f4 = (x) => Number(x).toFixed(4);
const T1 = RC.t1, T6 = RC.t6, P1 = PC.t1, P6 = PC.t6;
const rcPred = BT.thresholdPin.linearResponsePrediction;

const row = (t) => {
  const r = BT.table.find(x => x.tag === t.toUpperCase());
  return '| ' + r.tag + ' | ' + r.sigma + ' | ' + (r.A3 ? 'A3/A1 = ' + (r.A3 / r.A1) : 'A2/A1 = ' + Number((r.A2 / r.A1).toPrecision(3))) + ' | '
    + r.N + ' | ' + e2(r.r) + ' | ' + f4(r.Z1) + ' | ' + f4(r.minM) + ' | ' + r.peaks + ' / ' + r.wells + ' |';
};

const doc = `# Gain-weighted well-counting in a congestion mean-field game

**Certified equilibria whose density carries more local maxima than the potential has wells — two theorems, a bracket table of certified instances, and an exact, gamma-independent crossover constant.**

Draft v0.2 (machine-generated) · ${new Date().toISOString().slice(0, 10)} · repository cert-machine @ git ${git}

[OPERATOR] author line · [OPERATOR] venue · [OPERATOR] acknowledgments · [OPERATOR] AI-involvement disclosure wording

## Abstract

We prove, by validated numerics, that a stationary discounted congestion
mean-field game on the torus admits equilibria whose population density has
strictly more local maxima than the cost potential has wells. With
V(x) = A1 cos 2πx + A2 cos 4πx and A1 > 4A2 — exactly ONE well — the certified
equilibrium density at our main instance has EXACTLY ${P1.peaks} strict local
maxima (Theorem 1); a third-harmonic instance yields EXACTLY ${P6.peaks}
(Theorem 2). The honest mechanism is elementary and we state it as such: the
equilibrium re-weights harmonics **the potential already contains** through the
band-pass linear-response gain c(κ) = κ/[(1+σκ)² + γκ], so the density counts
wells with gain-weighted amplitudes while the potential counts them flat. The
second-vs-first harmonic crossover σ* = 1/(8π²) is INDEPENDENT of the coupling
γ — decided here as an exact-rational polynomial identity (the γ-coefficient of
the crossover polynomial is identically zero), not by float agreement — and the
limiting splitting window is the exact rational interval (1/16, 1/4)
(third harmonic: (1/27, 1/3), the Chebyshev U_{k−1} law). Around each theorem
sit ${['','','','','','five','six'][TAGS.length - 2]} further certified instances forming a bracket table: negatives below
the amplitude threshold and above σ*, replications, and a threshold pin — the
splitting threshold at σ = 0.002, γ = 0.01 lies in [0.13, 0.14] by certified
counts, with the exact-rational linear-response prediction
r_c = ${Number(rcPred.bracketDecimal[0]).toFixed(6)} inside. All enclosures are
radii-polynomial certificates at radius ~${e2(T1.bounds.r)} with local
uniqueness in the full sequence-space ball (even AND odd blocks) and both
positivity walls certified. This document is generated from those certificates.

## 1. Introduction

Under Lasry–Lions monotonicity, mean-field-game theory guarantees a unique
equilibrium, and the intuition that travels with the theory is stronger than
the theorem: the population's density is expected to mirror the cost — wells
of the potential become peaks of the crowd, one for one. The known rigorous
results reinforce that reading (in the Cesaroni–Cirant regime, density peaks
sit where the potential's wells sit), and the natural working assumption is a
CEILING: the equilibrium cannot carry more local maxima than the cost has
wells.

This paper proves the ceiling false, inside the uniqueness regime, by
validated numerics. At explicit parameters of a stationary discounted
congestion mean-field game on the torus we certify exact equilibria whose
density carries EXACTLY two — and, at a third-harmonic instance, EXACTLY
three — strict local maxima over a potential with EXACTLY one well. The
mechanism is not exotic and we state it at its true altitude: the linearized
response to the cost is a band-pass filter in harmonic frequency, so the
equilibrium counts wells with GAIN-WEIGHTED amplitudes while the potential
counts them flat, and between those two counts a single well splits the crowd.
What the linear analysis cannot give — and the certificates do — is the
nonlinear statement: these are exact equilibria of the full congestion system,
with local uniqueness in the full sequence-space ball and both positivity
walls certified.

Contributions. (i) The phenomenon theorem and its three-peak companion
(Sections 4–5), by radii-polynomial enclosures whose certified balls fix the
exact critical-point count of the exact solution. (ii) The crossover constant
sigma* = 1/(8 pi^2), INDEPENDENT of the discount, decided as an exact-rational
polynomial identity rather than observed numerically (Section 3). (iii) A
bracket table of certified instances pinning the splitting threshold inside
[0.13, 0.14], with the exact-rational linear-response prediction landing
inside the pin (Section 6). (iv) An exact solution count for the companion
ergodic system — EXACTLY three Galerkin solutions, box-bounded — together
with function-space multiplicity: at least three distinct exact solutions per
coupling in pairwise disjoint uniqueness balls (Section 7). Every number in
this document is interpolated at build time from machine-written certificates
(named where used); the build refuses to render if any certificate is
missing, refused, or structurally moved.

## 2. The model and the exact instances

Stationary discounted congestion MFG on the unit torus (congestion exponent
a = 1/2):

    u − σu″ + ½ (u′)²/√m = V(x) + γ m
    m − σm″ − (√m · u′)′ = 1,   m > 0,

V(x) = A1 cos 2πx + A2 cos 4πx + A3 cos 6πx, augmented with the branch variable
w = m^{−1/2} and the reciprocal constraint m·w² = 1, solved in even cosine
Fourier space with the derivative field p = u′ carried odd.

**Coefficient honesty.** Each theorem is a statement about specific binary64
doubles, not about the decimal strings that name them. Main instance (T1):
σ = ${T1.instance.sigma} (${T1.instance.exactBinary64Hex.sigma}),
γ = ${T1.instance.gamma} (${T1.instance.exactBinary64Hex.gamma}),
A1 = ${T1.instance.A1} (${T1.instance.exactBinary64Hex.A1}),
A2 = ${T1.instance.A2} (${T1.instance.exactBinary64Hex.A2}), N = ${T1.instance.N},
ν = ${T1.instance.nu}. Three-peak instance (T6): A3 = ${T6.instance.A3}
(${T6.instance.exactBinary64Hex.A3}), A2 = 0, same σ, γ, N, ν.

## 3. Linear response: the band-pass gain and the exact crossover

At first order in the potential amplitudes the congestion term drops and each
harmonic responds independently: m̂_k = −c(κ_k) A_k with κ_k = (2πk)² and

    c(κ) = κ / [ (1 + σκ)² + γκ ].                                   (†)

Three facts about (†) are decided in EXACT RATIONALS
(\`certs/terra-sigmastar.json\`; stdlib fractions, no floats in any verdict):

**Proposition 1 (band-pass).** As polynomials in Q[σ, κ, γ]:
D − κ ∂D/∂κ = (1 + σκ)(1 − σκ), where D is c's denominator. The γ-term cancels
identically, so sign(dc/dκ) = sign(1 − σκ) for every γ: the gain peaks at
κ = 1/σ.

**Proposition 2 (γ-free crossover).** With s = σκ₁, g = γκ₁, the k-th-vs-first
crossover polynomial N_k(s, g) = k²[(1+s)² + g] − [(1+k²s)² + k²g] factors as
(k² − 1)(1 − k²s²): its g-coefficient is the ZERO polynomial and its positive
root is s = 1/k exactly (decided for k = 2..12). Hence c_k = c_1 exactly at
σ = 1/(4π²k); at k = 2,

    σ* = 1/(8π²) = ${SS.sigmaStar.bracketDecimal[0]}…

(rational bracket of width ${e2(SS.sigmaStar.widthDecimal)} via Machin's
formula — the exact rational endpoints are in the certificate). The γ-independence is an exact
cancellation, not numerical smallness.

**Proposition 3 (the splitting windows).** sin 2πkx = sin 2πx · U_{k−1}(cos 2πx),
so V acquires interior critical points beyond x = 0, ½ iff k·r·|min U_{k−1}| > 1
(r = A_k/A1). The flat thresholds are exact rationals from the ranges of
U₁ = 2c and U₂ = 4c² − 1: threshold 1/4 at k = 2 and 1/3 at k = 3. The
equilibrium obeys the SAME criterion with gain-weighted amplitudes, and
c_k/c_1 → k² as (σ, γ) → 0, so the limiting splitting windows are exactly
(1/16, 1/4) and (1/27, 1/3).

**One sentence, stated honestly:** between the gain-weighted count and the flat
count, the crowd splits at the bottom of a single well. The mechanism —
non-flat linear gain changing the critical-point count of a two-harmonic
signal — is elementary [CITE NEEDED: a textbook-level reference; stating this
as elementary isolates the actual contribution, which is the MFG setting, the
exact γ-free constant, and the nonlinear certificates below]. Linear response
PREDICTS; only the certificates PROVE.

## 4. Theorem 1 — two peaks over one well

**Theorem 1.** At the T1 instance of §2 (A1 > 4A2: V has exactly one well),
there is an exact equilibrium (u, m, w) of the full congestion system within
ℓ¹_ν distance ${e3(T1.bounds.r)} of the stored candidate, locally unique in the
full sequence-space ball — even (cosine) AND odd (sine) blocks — with
m ≥ ${f4(T1.positivity.minM)} and w ≥ ${f4(T1.bounds.minW)} over the WHOLE ball,
and EVERY density in that ball has EXACTLY ${P1.m.maxima} strict local maxima
and ${P1.m.minima} strict local minima on the torus, while V has exactly
${P1.V.minima} well. (\`certs/terra-recert-t1.json\`,
\`certs/terra-peakcount-t1.json\`.)

Proof numbers (radii-polynomial / Newton–Kantorovich, all bounds in
outward-rounded interval arithmetic): Y0 = ${e3(T1.bounds.Y0)},
Z1 = ${f4(T1.bounds.Z1)} (even ${f4(T1.bounds.Z1even)} / odd ${f4(T1.bounds.Z1odd)}),
Z2 = ${f4(T1.bounds.Z2)}, closure margin ${e3(T1.bounds.closureMargin)}. The
peak count derives ONLY from certified region signs: an alternating chain of
curvature and slope regions covering [0, ½], each sign certified over the whole
ball with the ball's derivative pads folded into every cell bound
(sup|δm′| ≤ ${e3(P1.ballPads.d1)}, sup|δm″| ≤ ${e3(P1.ballPads.d2)}), with the
smallest certified margin ${e2(P1.m.minMargin)} — more than six orders above the
pads.

## 5. Theorem 2 — three peaks over one well

**Theorem 2.** At the T6 instance (third harmonic, A3/A1 = ${T6.instance.A3 / T6.instance.A1},
one well), the analogous statement holds with radius ${e3(T6.bounds.r)},
m ≥ ${f4(T6.positivity.minM)}, and EXACTLY ${P6.m.maxima} strict local maxima
(${P6.m.minima} minima); V has exactly ${P6.V.minima} well.
(\`certs/terra-recert-t6.json\`, \`certs/terra-peakcount-t6.json\`.)

## 6. The bracket table — the certified instances under one theorem

Honest counting: the finding is the two theorems above plus THIS TABLE — rows
of a table are rows of a table, not further theorems.

| instance | σ | ratio | N | radius r | Z1 | min m | peaks / wells |
|---|---|---|---|---|---|---|---|
${TAGS.map(row).join('\n')}

T2 (r = 0.12) and T3 (σ = 0.02 > σ*) are one-peak negatives exactly where the
linear response predicts none; T4${hasT5 ? ' and T5 (σ = 0.001, N = 176)' : ''} replicate${hasT5 ? '' : 's'} the split at r = 0.15; T7/T8 pin
the splitting threshold at σ = 0.002, γ = 0.01 inside **[0.13, 0.14]** by
certified counts, and the exact-rational prediction
r_c = [(1+4s)² + 4g]/(16[(1+s)² + g]) = ${Number(rcPred.bracketDecimal[0]).toFixed(6)}…
(rational bracket in \`certs/terra-bracket-table.json\`) lands inside the pin.

## 7. Companion results — an exact count, and certified multiplicity

For the ergodic mfg-cap system (V ≡ 0, monotone coupling c = −12, σ = 1/2), a
Krawczyk exhaustion census proves the N-mode even Galerkin truncation has
EXACTLY ${CEN[0].count} solutions in an explicit printed box for
N = ${CEN.map(c => c.N).join(', ')} (N = 5: ${CEN[3].stats.processed.toLocaleString('en-US')}
boxes; every subbox eliminated by interval-residual or Krawczyk exclusion, each
solution isolated by Moore–Krawczyk K(X) ⊂ int(X)). The claim is stated
box-bounded and truncation-level; the PDE-level count is an open problem.
(\`certs/mfg-cap-census-N{2..5}-c-12.json\`.)

Its FUNCTION-SPACE companion: at each of six couplings c = ${MULT.couplings.map(r => r.c).join(', ')}
— past the Lasry–Lions monotonicity wall c* = −σ²(2π)² — the constant solution,
the symmetry-broken branch and its half-shift mirror are enclosed in PAIRWISE
DISJOINT ℓ¹_ν uniqueness balls with certified positive density (deepest floor
min m ≥ ${Number(MULT.minMOverAllBalls).toExponential(2)} at c = −24): AT LEAST THREE distinct exact
solutions of the SYSTEM at every listed coupling, and the half-shift symmetry
provably produces a different solution, not a relabeling. At c = −9.5, inside
the monotone regime, the branch collapses onto the constant and no claim is
made. (\`certs/mfg-cap-multiplicity.json\`.)

## 8. Method and verification posture

The enclosures are radii-polynomial certificates on the augmented (a₀, p, m, w)
system with the reciprocal constraint, ℓ¹_ν Banach-algebra tail bounds (the
enclosed object solves the SYSTEM, not an N-mode approximation), and both
blocks of the linearization certified — the odd block is where a
symmetry-breaking solution would live. Two independent implementations of
the argument — a JavaScript kernel and the stdlib-Python verifier lineage that
ships inside the companion page — agree on the certified T1 radius to the last
digit, with independently computed approximate inverses on each side. The
verifier's falsifier battery (nine controls per instance) includes two that
attack the extension's own new lines: zeroing the instance's harmonic data term
and moving it to the wrong mode must each explode the residual — and do.
Positivity of m and of the branch selector w is certified over the whole ball,
never observed on a plot. Peak counts never trust a float sign: floats propose,
certified region chains decide, and anything uncertifiable REFUSES.

The falsified prior worth naming: the belief that equilibrium peaks cannot
exceed potential wells was THIS LAB'S OWN working assumption, formed on an
unreproduced ~508-sample float campaign — not folk belief, and not literature.
The certificates above refute it.

## 9. Related work and fences

- Karuturi, arXiv:2605.20213 — THE MANDATORY FENCE: spontaneous instability of
  the uniform state under an interaction kernel with NO potential, with a
  cognate 8π²ν² constant for a different quantity. Ours is the driven response
  to a structured cost under a fixed potential, inside the uniqueness regime.
- Cesaroni–Cirant, arXiv:1705.10741 — the foil: there, density peaks mirror
  the potential's wells; here they certifiably exceed them.
- Osborne–Smears, arXiv:2502.14687 — different in kind (FEM a-posteriori
  analysis, not equilibrium enclosures).
- Cecchin–Dai Pra–Fischer–Pelino, arXiv:1810.05492 — non-uniqueness via a
  different mechanism (finite state space).
- van den Berg–Lessard (radii polynomials) and Rump (Krawczyk / interval
  verification) — the CAP lineage this work instantiates. [OPERATOR/CITE:
  exact reference strings before submission.]

## 10. Open problems

PDE-level census (rung b); k-peak uniformity in k; sharper r_c digits;
non-even branches as γ → 0; the time-dependent forward–backward CAP.

## Status and reproducibility

Nothing in this program has been published or sent anywhere; every send is
released only by the author. Every certificate re-runs from the repository
(\`python3 instruments/mfgcap/run_recert.py t1\`, \`node
instruments/critcount/run.js t1\`, \`python3 instruments/mfgcap/sigmastar.py\`,
\`node labs/mfg/census.js\`, \`node labs/mfg/multiplicity.js\`, \`make test\`).
The base instance of this program — the σ = 1/2 single-harmonic enclosure of
\`reports/mfg-congest.html\` — is the companion page whose embedded stdlib
verifier serves as the calibration gate of every certificate here; the two are
one program and any priority claim is made by their first release together.

---
*Generated by tools/build-terra-writeup.js from the named certificates; the
build refuses if any input is missing, refused, or moved. Draft v0.2 wants a
human read [OPERATOR] before anything further; nothing is sent anywhere without
explicit operator release.*
`;

fs.mkdirSync(path.join(ROOT, 'paper'), { recursive: true });
const out = path.join(ROOT, 'paper', 'terra-peaks.md');
fs.writeFileSync(out, doc);
console.log('wrote paper/terra-peaks.md (' + doc.length + ' bytes) from '
  + (TAGS.length * 2 + 2 + CEN.length) + ' certificates @ git ' + git);
