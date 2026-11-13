# Lean intake, Phase 2 — the premises of three conditional prime-gap proofs. Pre-registration, sealed 2026-11-12

Private (notes/, untracked) until the operator decides; the operator's go of 2026-11-12 ("Intake Phase 2 build"). Plan:
the targets row prime-gap-premises-2026-11-12 (public). Sealed with Verify Seal (registry + OpenTimestamps) before either
decider of step 2 is written; every change after the seal is a dated amendment below, with the text it replaces.

## Step 1 — the premise ledger
One JSON line per premise of the three proofs (OpenAI's 186: openai/PrimeGaps186 61340d0b; the 182: romyar1/prime-gaps-lean
b77bf175, NO licence: quoted, never copied; Axiom's 212: AxiomMath/BGP212 6641780b). Fields: id, proof, repository,
commit, file, Lean name, shape (one of: finite-field bound · real-inequality bundle · quoted asymptotic theorem · free
constants), the statement as quoted (≤ 300 characters), status (one of: DECIDED ON INSTANCES below P · REPRODUCED ·
READ: MATCH / MISMATCH / CANNOT READ · NOT DECIDED), and the evidence (a path + sha256). The 186's three premises are
entered from the records already pinned (cert-machine certs/prime-gaps-186.json and corpus/prime-gaps-186/), nothing
re-run. Premises not decided in this phase are entered as NOT DECIDED with the reason.

## Step 2 — the 182's rank-four premise, decided on instances
**The premise** (formal/IncidenceRankFour.lean at b77bf175, sha256 60399b10…e19e, lines 23–31, quoted):
`incidenceKloosterman4Raw c = ∑ u v w : (ZMod p)ˣ, ZMod.stdAddChar (u + v + w + c / (u * v * w))` and
`IncidenceRankFourBound p := ∀ c : ZMod p, c ≠ 0 → ‖incidenceKloosterman4Raw c‖ ≤ 4 * p * Real.sqrt p`, with
`stdAddChar j = exp(2πi·j.val/p)`. It is Deligne's bound for the rank-four Kloosterman sum, taken as a hypothesis.

**Instances**: every prime p < 2000 (303 primes) and every c ∈ (ℤ/p)ˣ: 302,000-odd instances (the record states the count).

**Decider A** (Python, exact; no floating point in a decision): the exponent-count vectors N(c)[k] of the sum, built by the
multiplicative convolution K4(c) = Σ_u ψ(u)·K3(c/u), K3(a) = Σ_v ψ(v)·K2(a/v), K2(b) = Σ_w ψ(w + b/w), in integers;
the check Σ_k N(c)[k] = (p − 1)³; the symmetry N(c)[k] = N(c)[p − k] (so the sum is real, exactly); integer trig tables
C_k with |C_k − 2^F cos(2πk/p)| ≤ 1 proved with exact rationals (the construction of the 186 audit's decider A, ours).
An instance HOLDS when (|Σ N C| + Σ N)² ≤ 2^{2F}·16p³, FAILS when (|Σ N C| − Σ N)² > 2^{2F}·16p³, else F is raised (24, then
64 in Python integers); still open: UNDECIDED.
**Decider B** (JavaScript, cert-machine's instruments/interval; shares no code with A): the same chain in complex
interval arithmetic on values (not counts); HOLDS when the upper bound of |K4(c)|² ≤ 16p³, FAILS when its lower bound >
16p³, else UNDECIDED.

**Agreement**: per instance, B's enclosure contains A's value interval (A's Σ N C / 2^F ± Σ N / 2^F) or they overlap; any
disjoint pair voids the step until explained.

**Red controls** (must behave as stated in both deciders):
(i) brute force: for every prime p ≤ 31, the direct triple sum (an independent third program, O(p³) per c) lies inside
both deciders' enclosures; (ii) the bound with 4 replaced by 3: must FAIL on at least one instance, with a witness (p, c)
reproduced by the brute-force program where p ≤ 31 or by both deciders otherwise; (iii) the bound with 4 replaced by 2:
the same.

**Verdict**: DECIDED ON INSTANCES (p < 2000) when every instance HOLDS in both deciders and the controls behave; REFUTED
when an instance FAILS in both (a witness); otherwise the undecided instances are named. Reported: per prime the largest
|K4(c)|/(p√p), and the overall largest with its (p, c).

## Step 3 — the 212's seven quoted theorems, read blind
By claimbox, run by an agent in claimbox's folder (local commits, no push): for each of the seven, the agent reads the
cited source theorem (Polymath 8b; Stadlmann) FIRST and writes what it states, then reads the Lean axiom and writes
READING: MATCH / MISMATCH / CANNOT READ with the differing clause. A reading is not a decision; the record says so.

## Step 4 — one private page
A private page (notes/, not served) from the ledger: per premise its shape, status and evidence; what stays open first.

## Already run before this seal (said, not hidden)
timing-screen.py (ours): count vectors by the convolution chain for p ∈ {101, 211, 401, 997, 1999}, the sum check, and
a float64 evaluation: max |K4|/p^1.5 ≈ 2.59, 3.04, 3.02, 3.11, 3.47; the convolution agreed with a brute-force float sum
for p ∈ {5, 7, 11, 13} (max difference 3.5e−13); p = 1999 took 20 s. Prediction: step 2 DECIDED ON INSTANCES (0.97); the
largest ratio over p < 2000 between 3.3 and 3.8 (0.8).

## What the result will NOT say
That the premise holds for all primes (Deligne's theorem says that; this decides instances, which can only refute a
mis-transcribed premise); anything about the 182's or the 212's proofs beyond their premises; anything about the 186
beyond its pinned records.

## Money and machines
The Mac, US$0 (the screen puts step 2 at about half an hour per decider).

## Amendments

### A1 — 2026-11-12 (evening), after the results seal 15c5abca (replaces "None.")

On the operator's word of 2026-11-12 ("Proceed on your suggested order. Focus is to close the open items"), for the two
premises RESULT-2026-11-12.md left NOT DECIDED with a route. Written before the release archive is downloaded anywhere,
before any pod of this step exists and before any program of the package is run. Read so far, all of it the claimant's
published text at romyar1/prime-gaps-lean b77bf175: docs/assumptions.md, docs/numerical-data.md, research/numerical_182/
README.md, METHOD.md, RUNTIME.md, asset.json, evidence/verification.json, and the first 1,800 bytes of evidence/coverage.json
(its shape: a list of {side, field, value, target, direction, pass_}).

## Step 5 — the 182's 262 numerical premises (ledger row 182-4), the claimant's package REPLAYED

**What every artifact says first.** A replay of the claimant's programs is never an independent decision. The package
computes rational bounds for majorants; that each integral of `PhysicalSourceBounds182` is on the right side of its bound
is argued in the package's source comments and is in no program and not in Lean (its own METHOD.md says so). This step
decides numbers. It does not prove the premise, and it says nothing about the bound 182.

**Pins.** The release asset `prime-gaps-external-182-verified-20260909.zip`, 244,843,318 bytes, sha256 2960729e…6f3b
(asset.json, blob ea1b4725). The Lean literals at b77bf175: formal/TrialData182.lean (blob 9caf00df), SourceData182.lean
(45d4b55d), SourceBounds182.lean (950e80bf), PhysicalTrial182.lean (3a757b72). The 182 repository carries no licence for
its own material: nothing of it is copied into a public tree; it is run privately and quoted.

**The stack.** On a rented Linux pod, never on the Mac: FLINT v3.6.0 plus exactly commit 7ad753d5 (flintlib/flint#2790)
built from source, python-flint 0.9.0 at 572c8a21 built against it (the build of the 186 audit, pg186/c1/setup.sh in the private working repository),
Python 3.12, NumPy 2.3.5. The package's bundled macOS libraries are NOT run. Every change needed to make the package's
drivers use that stack on Linux is a DEVIATION, kept as a diff and listed; a change to an integrator, an input array, a
stage definition or a comparison voids the step.

**The run.** As the package's README orders it: check_package.py, audit.py, test_rejection.py, verify.py, finish.py, in
fresh directories; wall time, peak memory and the sha256 of every receipt recorded. The archive's sha256 and
scripts/check_external_numerics.py --archive (from the repository at b77bf175) first.

**The comparison, ours** (compare182.py, written and its sha256 logged on the pod BEFORE verify.py starts): the 262 fresh
values of the run's coverage record against the rationals parsed by our script from the Lean files at b77bf175 (not
against the record's own `target` field): the five cap fields, `rootUpper` and `faceUpper` of the 60
`trialOuterCertificates`, `faceUpper` of the 137 `trialInnerCertificates`; each as exact fractions, a lower bound must be
≥ and an upper bound ≤ the Lean literal; and the count must be exactly 5 + 120 + 137.

**Red controls** (ours, on copies): one Lean literal tightened past its fresh value → the comparison must FAIL and name
the row; one row removed from the fresh record → must FAIL on the count. The package's own four rejection tests are
reported as they come out; its test that swaps in the old macOS FLINT library cannot run as shipped on Linux — on the
pod the stock python-flint 0.9.0 wheel is the control (the 186 audit's C1a), and that substitution is a named deviation.

**Words.** REPRODUCED: the acceptance receipt says PASS_COMPLETE_EXTERNAL_NUMERICAL_RECOMPUTATION and our comparison
passes on all 262 with both red controls behaving. REPRODUCED (comparison only): our comparison passes but the package's
acceptance does not complete for a reason that is the Linux stack's (each named). A failed comparison or an arithmetic
error is reported as it is and stops for the operator. REFUSED (resources): not finished when the pod's spend reaches
US$10. REFUSED (environment): the stack cannot be built or the drivers cannot be pointed at it without touching an
integrator.

**Predictions.** The stack builds (0.9). The drivers run on Linux with path-only deviations (0.6). If verify.py
finishes: our comparison passes on 262 of 262 (0.85); every fresh value EQUAL to the published one (0.6: floating
summation order across CPUs is the risk the 186 run named).

**NOT in this step**: a clean-room recomputation of the 262 numbers by programs of ours (the 186 audit's C2/C3). It is
the next step for this row and is named as open in the result.

## Step 6 — the 212's certificate (ledger row 212-Gap212Certificate): scouted, no build

`Gap212Certificate` asks for a symmetric square-integrable F on T_45 with 0 < I(F) < 45·J(F). Scout only: does the
repository at 6641780b, its README, its dependency PrimeGapsLib or a paper it cites publish a witness F (coefficients, a
basis, matrices)? If yes: the row's next step is named (a replay and an exact re-integration) and NOT run here. If no:
the row stays NOT DECIDED with the reason "no witness published", and a question to its authors is DRAFTED for the
operator (sent only on his word). Finding a witness of our own is a research computation and is not attempted.

## Money and machines (A1)
One pod, the runpod image, 16–32 vCPU, its hourly price quoted before it is created; deleted with a 404 confirmed;
stop at US$10.
