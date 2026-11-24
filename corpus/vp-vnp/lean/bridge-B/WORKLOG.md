# WORKLOG — bridge B (BlindB ← Solution), VP ≠ VNP lane, row F2

Author: a Claude agent (Claude Opus 5.5), as Author B of corpus/vp-vnp/prompts/bridge.md.
Workspace: /home/tester/ws-B on the lane's pod (Lean v4.33.1, Mathlib 0df444a3, the release built).
All times UTC (from `date -u`).

## 00:20 start
- Read the brief, PREREG rows F2–F4, BlindB.lean + NOTES.md, the release's Statement.lean, Solution.lean,
  Challenge.lean, comparator.json.
- Checked the sealed file: sha256 of corpus/vp-vnp/blind/B/BlindB.lean =
  f8b5af56a0f4f01ca3cdd10b0eaa13e7cfb5b4a8774b6664fb74f63d273ee892, equal to SEAL-1B.
- Copied it unchanged to ws-B/CertMachine/BlindB.lean.

## 00:22 BlindB elaborates as sealed — no repairs
- `lake env lean CertMachine/BlindB.lean`: no error, no warning (26.9 s).
- Workspace lakefile change (the only one): appended
  ```
  [[lean_lib]]
  name = "CertMachine"
  globs = ["CertMachine.+"]
  ```
  to ws-B/lakefile.toml so `lake build CertMachine.BlindB` produces the olean the bridge imports.
  `lake build CertMachine.BlindB`: "Build completed successfully (8706 jobs)", nothing else rebuilt.

## 00:26 plan (from reading both files)
- B → release: a BlindB circuit (DAG in topological order, every vertex counted) of size s computing f is a
  release gate list of length s (l k := value k for k < s, 0 beyond). Same count: no constant lost.
- release → B: a gate list of length s is a BlindB circuit with s vertices (choose a gate kind per index).
  Needed because BlindB's VNP asks for BlindB circuits for the witness family.
- PERM: BlindB ∏ X(i, σ i), release ∏ X(σ i, i): equal by σ ↦ σ⁻¹, every m.
- HC: BlindB "∃ i, ∀ j, SameCycle i j", release `IsCycleOn univ`: same for m ≥ 1. At m = 0 they differ
  (BlindB HC 0 = 0, release hc 0 = 1): irrelevant for "m ≥ m₀" once m₀ ≥ 1.
- Approximation: BlindB's q = ι(map C f + C ε · g) satisfies the release's coefficient condition.
- Families: BlindB arity ℕ → ℕ, bounds a (n+1)^d; release vars ℕ → Type (Fintype), bounds n^a + a.
  Both conversions of the bounds proved (a(n+1)^d ≤ n^A + A with A = a·2^d + d + a).
- Separation (BlindB): VP_B ⊆ VNP_B directly (witness width 0); ¬ VNP_B ⊆ VP_B by contradiction through
  the release: f ∈ VNP_R ⇒ toB f ∈ VNP_B ⇒ toB f ∈ VP_B ⇒ f ∈ VP_R, contradicting Solution.separation.
  BlindB's VNP also asks the family itself to be a p-family: degree of a Boolean sum ≤ degree of the
  witness (proved: aeval by degree-≤1 substitutions does not raise total degree).
- SeparationClosure: the same through VPBar.

## 00:26–00:28 circuit conversions, PERM/HC identities, approximation lemma
- First compile: 4 small errors (rcases pattern syntax, an unreduced beta, a rw under a lambda, the lemma
  is `PowerSeries.coeff_coe` not `LaurentSeries.coeff_coe`). Fixed; second compile clean.
- (At this point the file held the two circuit conversions, gate-list padding, renaming, the approximation
  lemma, PERM_eq for every m, HC_eq for m ≥ 1.)

## 00:28–00:29 the three bounds (mainTheorem, mainTheoremApprox, permanentOverReal)
- Each: take the release's c and m₀ (universe 0), raise m₀ to max m₀ 1, convert the BlindB circuit to a
  gate list of the same size, rewrite HC/PERM into hc/perm, apply. `gateBound c m` and `Beyond c m s` are
  the same real expression (`Real.rpow` written out vs `^`): accepted by `exact` with no unfolding.
- Compiled first time.

## 00:29–00:31 bounds a(n+1)^d ↔ n^a + a, renaming, families
- `pbounded_of_le`: n^a + a ≤ (a+1)(n+1)^a. `le_of_pbounded`: a(n+1)^d ≤ n^A + A, A = a·2^d + d + a
  (cases n = 0, n = 1, n ≥ 2 using k < 2^k ≤ n^k).
- `totalDegree_aeval_le` (substitutions of degree ≤ 1 do not raise total degree; via `as_sum`,
  `aeval_monomial`, `le_totalDegree`). Mathlib at this pin has no such lemma under a name I could find.
- `mem_VP_of_toB`, `mem_VPBar_of_toB`: back from BlindB's classes to the release's for a renumbered family.
- One failed compile: the n = 0 case (`simp` left `a ≤ 0 ^ _ + _`) and a `rw` stuck on
  `Fin ((toB f).arity n)` vs `Fin (Fintype.card _)` (defeq, not syntactic). Fixed by a closed lemma
  `approximates_of_circuit_rename` stated over a generic equivalence. Clean on the next compile.

## 00:31–00:32 VNP transfer and the two separations
- `toB_mem_VNP`: release VNP family ⇒ renumbered family in BlindB's VNP. Witness width r, witness
  `rename ψ (g n)` with ψ = finSumFinEquiv ∘ (equivFin ⊕ id); its BlindB circuits from the release's gate
  lists (`circuit_of_computes`); the family's own degree bound from `totalDegree_aeval_le`; the Boolean
  sum identity by `comp_aeval_apply`, `eval₂_rename`, `Fin.append_left/right`.
- `VP_sub_VNP` (BlindB's own classes, witness width 0, `Fin.append_right_nil`, `eval₂_eta`).
- `separation`: ⟨VP_sub_VNP, ¬VNP_B ⊆ VP_B via Solution.separation⟩; `separationClosure` likewise via
  Solution.separationClosure.
- Compiled first time. `lake build CertMachine.BridgeB`: clean, no warning from CertMachine files.

## 00:32 axioms
- AxiomsB.lean: all five depend on [propext, Classical.choice, Quot.sound] (axioms.out).

## 00:33–00:36 challenge, differences, final checks
- ChallengeB.lean (imports CertMachine.BlindB only), the five theorems with `sorry`, names as in BridgeB;
  builds with exactly five "declaration uses `sorry`" warnings. comparator-B.json mirrors the release's
  comparator.json with our modules and names (not run by me: the control room runs Comparator).
- DiffsB.lean: Lean tests of the differences named in the report: BlindB.HC K 0 = 0, Statement.hc K 0 = 1,
  so they differ at m = 0; the size measures agree exactly (`sizes_agree`).
- Removed my probe file (CertMachine/Probe.lean, used only to look up Mathlib names).

## 00:36–00:39 clean rebuild and kernel replay
- Deleted the CertMachine oleans, rebuilt BlindB, ChallengeB, BridgeB: success (22.7 s).
- `lake env leanchecker CertMachine.BridgeB CertMachine.BlindB`: exit 0 (38 s).
- Token grep (sorry|axiom|native_decide|implemented_by|extern|admit) over BlindB, BridgeB, DiffsB: one hit,
  the English word "admit" in a BlindB docstring (line 40); nothing in the proof files.

Total: about 20 minutes of work from first read to all five proved; about 40 minutes with the checks and
files. No theorem needed a second approach.
