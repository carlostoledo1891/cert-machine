# Pre-registration — θ(p_c) = 0, two labs' proofs bridged to one hand-written statement (2026-11-12)

Sealed (seal 18) before any third-party Lean of either lab is built by us, and before any bridge code is written.
Target and pins: TARGET-PERCOLATION.md. Every change after the seal is a dated amendment at the end, with the text it
replaces.

## The statement (ours)

`perc/Textbook.lean` (copied here at the seal; sha256 in the seal's manifest): Mathlib only, written by hand from
Grimmett (1999) §1.3–1.4 after reading the two labs' statement files and none of their proofs. `TextbookPercolation.Statement`
(every d ≥ 2) and `Statement3` (d = 3). P0 passes when the file elaborates UNCHANGED at both Mathlib pins (v4.32.0 /
81a5d257 and v4.34.1 / d13f23b7) with no `sorry` and no axiom of its own. A file that needs any change to elaborate is
changed before the seal, never after.

## P1 — Anthropic's development, replayed (a pod)

Built from the pinned tarball (sha256 10f3e6b9…) by its own lakefile; outputs recorded per step (log, exit, seconds).
- **Passes** when: `lake build` exits 0; `#print axioms` of the seven theorems of its AUDIT.md is exactly
  [propext, Classical.choice, Quot.sound]; Comparator on its comparator.json accepts; nanoda accepts the export of
  `Solution` (or its stop is named); leanchecker --fresh accepts the Solution module.
- **Red controls** (must be refused, or P1 is void): Comparator with Challenge.lean changed to `1 ≤ d`; with
  `PercolationContinuity` changed to `= 1`.

## P2 — bridge A (Anthropic → ours, every d ≥ 2), in Anthropic's toolchain

One new module `Bridge/Anthropic.lean`, importing their library and our `Textbook` (a copy of the same bytes):

```
theorem bridgeA (h : ∀ d, 2 ≤ d → BondPercolation.PercolationContinuity d) : TextbookPercolation.Statement
theorem statement_from_anthropic : TextbookPercolation.Statement   -- bridgeA applied to their compared theorem
```

- **Passes** when both elaborate without `sorry`; `#print axioms statement_from_anthropic` is the standard three;
  leanchecker --fresh and nanoda accept; and every red control below is refused.
- Any lemma of their library may be used in the proof (it is kernel-checked); our statement file may not change.
- **Red controls**: the same bridge script against (i) a copy of Textbook.lean with `θ d ⟨pc d, h⟩ = 1`, (ii) with
  `2 ≤ d` replaced by `1 ≤ d`, (iii) with `pc` as the junk-convention `sInf {p | θ p > 0}` over ℝ and the d = 1 case
  added. Each must fail to elaborate (a bridge that also proves a planted statement proves nothing).

## P3 — bridge O (OpenAI → ours, d = 3), in OpenAI's toolchain

`Bridge/OpenAI.lean` inside openai/math at 4eaee875 (their lakefile, their pins):

```
theorem bridgeO (h : CriticalZ3 bond part as stated) : TextbookPercolation.Statement3
theorem statement3_from_openai : TextbookPercolation.Statement3
```

Passes and red controls as in P2, with Statement3. If θ's monotonicity is not in their library, it is proved by us
(a coupling); that proof is recorded as ours.

## P4 — the seam

The Mathlib source of each definition `Textbook.lean` uses — `MeasureTheory.Measure.infinitePi`, `PMF.bernoulli`,
`PMF.toMeasure`, `Sym2`, `Sym2.lift`, `Set.Infinite`, `Real.sSup` / `sSup` on ℝ, `Relation.ReflTransGen`,
`unitInterval` — compared as text at 81a5d257 and d13f23b7. IDENTICAL, or each difference named and classified
(proof only / statement). This is a reading, and the record says so.

## P5 — anchors (proved by us, Mathlib only, in both toolchains)

`θ d 1 = 1` and `θ d 0 = 0` for every d ≥ 1. With them, Statement forces p_c(d) < 1 (non-vacuity), proved as a
corollary. Optional, recorded as such: ¬ (the statement at d = 1).

## P6 — kernels and the record

The final environment of P2 and of P3: Lean's kernel, leanchecker --fresh, nanoda; lean4lean where it runs; Comparator
with OUR Textbook.lean as the challenge and the bridge as the solution. Every stop is named. One record per bridge.

## Money and machines

One pod at a time, the runpod image, 16 vCPU / 64–128 GB, its price quoted to the operator before it is created;
deleted with a 404 confirmed after each session; the lane's cap US$25 unless the operator raises it.

## What the result will NOT say

Not that we proved θ(p_c) = 0 (the labs did, by Kozma–Nitzan's reduction); not that the labs' informal papers are
right; not that the Kozma–Nitzan conjectures as printed are what either Lean states (out of scope here).

## Amendments

### A1 — 2026-11-12, after seal 19 (replaces "None.")

Written after P5's anchors were proved on the Mac and before any pod run of what follows. The operator's choice of
2026-11-12: close P5 and a false-p_c control now; the one-Lean port (P4 decided) is NOT attempted.

- **P5, done before this amendment** (perc/anchors/ThetaAnchors.lean, Anchors.lean; Mathlib only, the same bytes at both
  pins, `#print axioms` = [propext, Classical.choice, Quot.sound] for each): `theta_zero d` (θ_d(0) = 0, every d),
  `theta_one` (θ_d(1) = 1, d ≥ 1), `pc_mem d` (p_c(d) ∈ [0, 1] with no hypothesis: the supremum is never junk),
  `pc_lt_one_of_statement` and `pc3_lt_one_of_statement3` (Statement ⇒ p_c(d) < 1 for d ≥ 2; Statement3 ⇒ p_c(3) < 1).
- **Red control R4 replaces R3 as the p_c control** (R3 planted a true statement; its run stays on record). The plant,
  perc/anchors/Textbook.R4.lean, changes one line of the sealed file: p_c's body becomes
  `sSup {p : ℝ | ∃ h : p ∈ Set.Icc (0 : ℝ) 1, 0 < θ d ⟨p, h⟩}` (the supremum of the SUPERCRITICAL set, a plausible slip).
  It is FALSE, proved: perc/anchors/PlantedFalse.lean (`planted_statement_false`, `planted_statement3_false`) builds
  against it at both pins on the Mac, on the standard three axioms. **Passes** when, in each lab's environment rebuilt
  from the pins on a pod: `lake build Bridge` against the planted file FAILS with its first error in Bridge.lean;
  `lake build PlantedFalse` against the same file in the same environment exits 0 on the standard three axioms; the
  sealed file restored (sha256 4dc732f5…41ae) rebuilds exit 0.
- **The anchors inside each lab's environment**: ThetaAnchors, Anchors and a one-line corollary per bridge
  (`pc_lt_one_from_anthropic`: p_c(d) < 1 for every d ≥ 2; `pc3_lt_one_from_openai`) build exit 0 next to the bridge, on
  the standard three axioms.
- **Inputs and run**: perc/anchors/INPUTS.sha256 (15 files; the bridges at their sealed hashes ab8be23f… and 030bf61f…,
  the tarball 10f3e6b9…), checked on the pod before anything runs; the script perc/anchors/pod-r4.sh. One pod, 32 vCPU
  cpu3g, about US$1.28 an hour, expected under an hour; deleted with a 404 confirmed. Everything else in this file
  stands, including what the result will not say.

### A2 — 2026-11-12 (evening), after seal 21 and after the reveal

On the operator's word of 2026-11-12 ("Proceed on your suggested order. Focus is to close the open items"): the two
items NEXT.md left open, both attempted now. This replaces A1's sentence "the one-Lean port (P4 decided) is NOT
attempted" and P5's "Optional, recorded as such". Written before any pod of this amendment exists and before a line of
either build is written. Everything the sealed file says the result will NOT say still stands.

- **P5′ — the statement is false at d = 1** (`perc/anchors/DimOne.lean`, Mathlib only, importing the sealed
  Textbook.lean unchanged, sha256 4dc732f5…41ae; the same bytes at both pins). To prove:
  `theta_dim_one_eq_zero : ∀ p : unitInterval, (p : ℝ) < 1 → θ 1 p = 0`, `pc_dim_one : pc 1 = 1`, and
  `statement_body_false_at_dim_one : ¬ ∃ h : pc 1 ∈ Set.Icc (0 : ℝ) 1, θ 1 ⟨pc 1, h⟩ = 0` (the body of `Statement`
  at d = 1, word for word). **Passes** when the file builds at both pins with no `sorry`, no warning, and
  `#print axioms` of the three is exactly [propext, Classical.choice, Quot.sound]. It shows that `2 ≤ d` in our
  statement is load-bearing: red control R2 (`1 ≤ d`) planted a statement that is now PROVED false, not only refused.
  If only part is proved, the part is named and the word is PARTIAL. Prediction: all three proved (0.7).

- **P4′ — one Lean.** Goal: ONE environment (one toolchain, one Mathlib commit) holding the sealed Textbook.lean
  (unchanged bytes), both labs' developments and both bridges, with one module `OneLean.lean` stating
  `statement_from_anthropic : TextbookPercolation.Statement` and `statement3_from_openai :
  TextbookPercolation.Statement3` about the SAME constants. Route: one lab's development is ported to the other's pin;
  the direction is chosen after measuring both (the default: Anthropic's library to v4.34.1 / Mathlib d13f23b7, inside
  openai/math at 4eaee875) and recorded with the reason.
  **Rules of the port.** Proofs may change where the newer (or older) Mathlib requires. The ported lab's STATEMENT
  files — Anthropic's Challenge.lean and every definition it reaches in its own library; OpenAI's
  ComparatorChallenges/CriticalZ3.lean and what it reaches — stay byte-identical, or every changed line is listed with
  its reason and the word becomes CERTIFIED (statement edited: listed). No `sorry`, no new axiom, no `native_decide`
  added. The bridges may be edited only as the changed Mathlib forces; their diffs are kept.
  **Passes** when, in the one environment: a clean `lake build` exits 0; `#print axioms` of both theorems of
  OneLean.lean is exactly the standard three; Comparator accepts with OUR statement as the challenge (both theorems
  as `sorry`) and OneLean as the solution — nanoda and Lean's kernel both; Comparator accepts the ported lab's own
  compared theorem against ITS unchanged challenge file in the new environment; leanchecker --fresh on OneLean exits
  0; and red controls R1 (θ = 1) and R4 (the planted false p_c, with PlantedFalse building next to it) are refused
  there. **Words**: CERTIFIED (one Lean): all of it. PARTIAL: the modules not ported are counted and named, and the
  seam stays a reading. REFUSED (resources): the amendment's spend reaches US$15.
  Prediction: the port completes (0.55); inside US$10 (0.45).

- **Money and machines.** One pod at a time, the runpod image, 32 vCPU, about US$1.3–1.5 an hour, quoted before it is
  created; deleted with a 404 confirmed. The lane's cap stays US$25 (≈ US$3.06 spent); this amendment stops at US$15.
  P5′ needs no pod if the Mac's Mathlib caches at both pins are still on disk.
