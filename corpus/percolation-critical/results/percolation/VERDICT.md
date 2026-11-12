# Percolation — results (2026-11-12; PREREG-PERCOLATION.md, seal 18)

## What stays open (read first)
- The two bridges live in two Leans (v4.32.0 for Anthropic's, v4.34.1 for OpenAI's). The statement file is the same bytes
  in both, and its surface definitions print identically; of the 2,488 constants the statement reaches in both, 2,032 are
  identical by hash and the rest differ by Mathlib's own refactors (perc/seam/READING.md). That the statement MEANS the same
  in both Leans is a reading, not a kernel fact.
- Red control R3 (p_c as an infimum over {θ > 0}) planted a statement that is still TRUE (θ(1) = 1 puts 1 in that set), so
  its failure shows the bridges depend on how p_c is written, not that they refuse a false claim. R1 and R2 are false
  statements and both bridges refuse them. CLOSED by amendment A1 (below): R4 plants a p_c that is PROVED false, and both
  bridges refuse it.
- Nothing here checks the labs' informal papers, nor that Kozma–Nitzan's conjectures as printed are what either Lean states.
- Anthropic's development is not on formal-math's main branch; its commit is reachable only by hash (pinned here by sha256).

## A1 — the anchors (P5) and red control R4 (2026-11-12; amendment A1, seal 20; the pod run results/percolation/a1/)

**P5, on the Mac, Mathlib only, the same bytes at both pins** (perc/anchors/; results/percolation/p5/mac-builds.log): θ_d(0) = 0
(every d), θ_d(1) = 1 (d ≥ 1), p_c(d) ∈ [0, 1] with no hypothesis (the supremum is never junk), Statement ⇒ p_c(d) < 1 for
d ≥ 2, Statement3 ⇒ p_c(3) < 1 — each on [propext, Classical.choice, Quot.sound], no warning.

**In each lab's environment, rebuilt from the pins on a pod** (perc/anchors/pod-r4.sh, inputs checked against INPUTS.sha256
first; openai/math at 4eaee875, `lake update` left the manifest unchanged):

| | bridge A (v4.32.0) | bridge O (v4.34.1) |
|---|---|---|
| bridge + anchors + corollary, clean build | exit 0 (515 s, with Anthropic's library) | exit 0 (354 s, with OpenAI's ℤ³ closure) |
| corollary, on the standard three axioms | `pc_lt_one_from_anthropic`: p_c(d) < 1, every d ≥ 2 | `pc3_lt_one_from_openai`: p_c(3) < 1 |
| R4: `lake build Bridge` against Textbook.R4.lean | **exit 1**, first error Bridge.lean:266 (the planted set where the sealed one was expected) | **exit 1**, first error bridge/Bridge.lean:273 (`θ = 0` where the plant needs `0 < θ`) |
| R4: `lake build PlantedFalse`, same file, same environment | exit 0; `planted_statement_false`, `planted_statement3_false` on the standard three | exit 0; the same |
| the sealed file restored (sha256 4dc732f5… OK) and rebuilt | exit 0; axioms unchanged | exit 0; axioms unchanged |

R4's plant (p_c = sup of the SUPERCRITICAL set) is false, and that is a theorem in the very environment where each bridge
refuses it: a bridge that accepted it would have proved a false statement. With the anchors, the bridged result is also
not vacuous: p_c = 1 (where θ = 1) does not satisfy it, kernel-checked next to each lab's proof. OpenAI's environment
prints "repository has local changes" for 23 dependencies: its own post_update compatibility patches, as in P3.

## P0 — the statement (seal 18)
perc/Textbook.lean (sha256 4dc732f5…41ae), Mathlib only, written from Grimmett §1.3–1.4: builds unchanged at both pins.

## P1 — Anthropic's development replayed (pod xim7c7qjmugr39, the orchestrator's script perc/pod-p1.sh)
Tarball sha256 10f3e6b9… OK · `lake build Percolation Solution` exit 0 (547 s, 8,905 jobs) · Challenge builds with its two
deliberate `sorry` · the seven theorems of their AUDIT.md: exactly [propext, Classical.choice, Quot.sound] · Comparator
(Palomar pins, nanoda 68d5ca9d) "Your solution is okay!" — nanoda and Lean's kernel accept (350 s) · red controls: the
challenge at `1 ≤ d` REFUSED ("statement do not match"), `θ = 1` REFUSED ("Const does not match … PercolationContinuity").
leanchecker --fresh on `Solution` (the whole environment, Mathlib included, replayed from scratch): exit 0 (2,163 s).

## P2 — bridge A: Anthropic's theorem ⇒ our Statement, every d ≥ 2
perc/bridgeA/Bridge.lean (299 lines, sha256 ab8be23f…; written by an agent on the pod, ~1 h). `bridgeA (h : ∀ d, 2 ≤ d →
BondPercolation.PercolationContinuity d) : TextbookPercolation.Statement`; `statement_from_anthropic`. The orchestrator's
replay (perc/pod-p6.sh): Textbook.lean sha OK; clean rebuild exit 0 (23 s); both on [propext, Classical.choice,
Quot.sound]. Route: ℓ¹ adjacency = hasse; our product measure pushed to `setBernoulli` (Measure.eq_infinitePi on boxes;
off-edge coordinates a.s. False); clusters equal; θ equal for every p; Grimmett's sup = their inf via their
`theta_mono_holds` and `theta_bot`. Red controls (agent's run): R1 θ(p_c) = 1 exit 1; R2 `1 ≤ d` exit 1; R3 exit 1 (see above).

## P3 — bridge O: OpenAI's ℤ³ theorem ⇒ our Statement3
perc/bridgeO/Bridge.lean (306 lines, sha256 030bf61f…; agent, ~25 min), openai/math 4eaee87548250b2682affda7d05d947c05554bae.
`bridgeO (h : ∀ᵐ ω ∂bondLaw bondCritical, ∀ x, (bondCluster ω x).Finite) : TextbookPercolation.Statement3`;
`statement3_from_openai := bridgeO critical_no_infinite.1`. MONOTONICITY IS OURS: OpenAI's ℤ³ library does not state it;
proved in the bridge by the uniform-label coupling (79 lines). Red controls R1 (= 1) and R2 (pc 1) exit 1; R3 exit 1 (see above).

## P4 — the seam: perc/seam/READING.md.

## P6 — the orchestrator's replay of both bridges, with OUR statement as the challenge (pod-p6.sh, pod-p6o.sh, p6o-cmp2.sh)

| | bridge A (v4.32.0) | bridge O (v4.34.1) |
|---|---|---|
| Textbook.lean sha256 4dc732f5… in the environment | OK | OK |
| Bridge.lean as handed back | ab8be23f… | 030bf61f… |
| clean rebuild of Textbook + Bridge | exit 0 (23 s) | exit 0 (32 s) |
| `#print axioms` of the bridge and its corollary | [propext, Classical.choice, Quot.sound] both | [propext, Classical.choice, Quot.sound] both |
| Comparator, challenge = `OurChallenge` (our statement, `sorry`), solution = Bridge, nanoda on | "nanoda kernel accepts", "Lean default kernel accepts", "Your solution is okay!" (264 s; Palomar pins) | the same three lines (comparator d03acab1 with its toolchain raised to v4.34.1 and lean4export 076e8e57, as lane K ran OpenAI's release; Anthropic's script refuses v4.34.1 for want of a lean4export tag) |
| leanchecker --fresh on the Bridge module | exit 0 (1,892 s) | exit 0 (2,164 s) |

Two independent kernels (Lean's and nanoda) accept, in each Lean, a proof of the statement WE wrote — from Anthropic's
development for every d ≥ 2, and from OpenAI's for d = 3.

## Amendments and deviations (dated 2026-11-12; PREREG-PERCOLATION.md is not edited)
1. The OpenAI pin's full id is 4eaee87548250b2682affda7d05d947c05554bae (the brief to the agent mistyped its tail; the
   agent used the commit behind the short id, HEAD of main).
2. Bridge O's Comparator ran with lane K's tool pins, not the Palomar script's (above).
3. Red control R3 did not plant a false statement (see "What stays open").
4. The bridges were written by two agents working on the pod; the orchestrator re-built, re-audited and re-checked them
   (this table) but did not write them.
5. The seam (P4) is measured, not decided; P5's anchors (θ(0) = 0, θ(1) = 1 in our encoding) are NOT yet proved here —
   bridge A uses their `theta_bot` and θ(1) through the bridge, not a standalone anchor file. (Superseded by A1: the
   anchors are proved; the seam stays measured, the one-Lean port not attempted by the operator's choice.)
