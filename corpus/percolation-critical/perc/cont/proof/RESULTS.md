# RESULTS — θ is continuous on [0, 1], on top of Anthropic's library (the proof author's tree, 2026-11-13)

What "PROVED" means here: in `/root/cont/percolation` on the pod (a `cp -a` of the pristine built library at
795efb86, Lean v4.32.0, Mathlib 81a5d257; no file of the lab changed, `lakefile.toml` appended), with the sealed
bytes of `Textbook.lean` (sha256 4dc732f5…e641ae) and `Continuity.lean` (sha256 d012845f…8243, as
`ContStatement.lean` = one line `import Textbook` + those bytes), the theorem builds with exit 0, no `sorry`, no
warning, and `#print axioms` prints exactly [propext, Classical.choice, Quot.sound]. It is the author's run
(C1, C2, C3, C4 of PREREG-CONT.md); the orchestrator's replay (C5) is not part of it.

Whose the ingredients are: uniqueness of the infinite cluster, the zero–one law, the label coupling, θ as a limit
of finite-box probabilities and their continuity in p, monotonicity, θ = 0 below and > 0 above p_c, and
θ(p_c) = 0 for d ≥ 2 are the LAB'S theorems. Ours: the statement, bridge A, and 340 lines in `ContProof.lean`
(+ 29 in `UnitAux.lean`) that join them.

## The four statements

| statement (`perc/cont/Continuity.lean`) | verdict | theorem | file:line |
|---|---|---|---|
| `ContinuityStatement`: ∀ d ≥ 2, `Continuous (θ d)` | **PROVED** | `theta_continuous` | `ContProof.lean:339` (script at `ContProof.lean:316`, `ContProof.theta_continuous`) |
| `RightContinuity`: every d, every p | **PROVED** | `theta_right_continuous` | `ContProof.lean:327` (script at `:283`; core `ContProof.theta_rightCont` `:67`, `theta_upper` `:55`) |
| `LeftContinuityAbovePc`: every d, every p > p_c | **PROVED** | `theta_left_continuous_above_pc` | `ContProof.lean:331` (script at `:289`; core `ContProof.exists_lt_theta` `:160`, `theta_contAt` `:239`) |
| `ContinuityIffCritical`: every d ≥ 1 | **PROVED** | `theta_continuous_iff_critical` | `ContProof.lean:335` (script at `:296`; `continuous_of_crit` `:258`, `crit_of_continuous` `:269`) |

What each does NOT claim: `RightContinuity` says nothing on the left; `LeftContinuityAbovePc` says nothing at or
below p_c; `ContinuityIffCritical` does not say which side holds (at d = 1 both sides are false); only
`ContinuityStatement` uses the lab's θ(p_c) = 0, and only through `BondPercolation.percolation_continuity`.

## Axioms (`axioms.out`, `lake env lean ContAxioms.lean`, exit 0, 9 s) — verbatim

```
'theta_continuous' depends on axioms: [propext, Classical.choice, Quot.sound]
'theta_right_continuous' depends on axioms: [propext, Classical.choice, Quot.sound]
'theta_left_continuous_above_pc' depends on axioms: [propext, Classical.choice, Quot.sound]
'theta_continuous_iff_critical' depends on axioms: [propext, Classical.choice, Quot.sound]
'TextbookPercolation.not_planted_dimOne' depends on axioms: [propext, Classical.choice, Quot.sound]
'TextbookPercolation.not_planted_constant' depends on axioms: [propext, Classical.choice, Quot.sound]
'Percolation.Literature.Grimmett1999_numInfiniteClusters_le_one_holds' depends on axioms: [propext,
 Classical.choice,
 Quot.sound]
'Percolation.Literature.Grimmett1999_prob_exists_percolatesAt_holds' depends on axioms: [propext,
 Classical.choice,
 Quot.sound]
'BondPercolation.percolation_continuity' depends on axioms: [propext, Classical.choice, Quot.sound]
```

The lab's uniqueness theorem and zero–one law, which its own axiom listing does not cover, print the same three.

## Red controls (C4)

| control | what | expected | got |
|---|---|---|---|
| `¬ Planted_dimOne` | `TextbookPercolation.not_planted_dimOne`, `ContPlanted.lean:15` (Mathlib + `DimOne` + `ThetaAnchors` + `UnitAux`; no lab import) | proved | PROVED (b01-base, exit 0) |
| `¬ Planted_constant` | `TextbookPercolation.not_planted_constant`, `ContPlanted.lean:25` | proved | PROVED (b01-base, exit 0) |
| Red0 (positive control of the harness) | the script and the term, at the TRUE statement | exit 0 | exit 0, 9 s |
| Red1a | the script of `theta_continuous` at `Planted_dimOne` | fails | exit 1: `hd : 1 ≤ d` where `2 ≤ d` is expected, in `BondPercolation.percolation_continuity d hd` |
| Red1b | the term `theta_continuous` at `Planted_dimOne` | fails | exit 1: type mismatch |
| Red2a | the script at `Planted_constant` | fails | exit 1: type mismatch (`Continuous …` against `∀ p q, θ p = θ q`) |
| Red2b | the term at `Planted_constant` | fails | exit 1: type mismatch |
| Comparator, challenge = `Planted_dimOne` | `cmp/planted.json`, `ContChallengePlanted.lean` | refused | exit 1, 86 s: "Challenge and solution theorem statement do not match: 'theta_continuous'" |
| forbidden tokens | `grep -nE "sorry\|axiom\|native_decide\|implemented_by\|unsafe\|extern\|admit" ContProof.lean UnitAux.lean ContPlanted.lean` | empty | empty (grep exit 1, 0 lines) |

(`ContAxioms.lean` holds the word "axioms" in its nine `#print axioms` lines and the two `ContChallenge*.lean`
hold `sorry` by design; none of the three is a proof file and none is imported by one.)

## C3

- **Comparator, OUR statement as the challenge** (`cmp/ours.json`: challenge module `ContChallenge` = `import
  ContStatement` + the four statements with `sorry`; solution module `ContProof`; the four theorem names; the three
  permitted axioms; nanoda on): exit 0, 239 s, "nanoda kernel accepts the solution", "Lean default kernel accepts
  the solution", "Your solution is okay!" (`cmp-logs/ours.log`). Tools at the lab script's pins
  (`cmp-logs/ours.tools.txt`): comparator 57567492, lean4export 4e791520 (release v4.32.0), nanoda 68d5ca9d,
  landrun 811cfff5. Run through `cmp/cmp.sh`, not the lab's script verbatim (see LOG.md, last section).
- **`leanchecker --fresh ContProof`**: exit 0, 1,780 s on one core (`build-logs/fresh.exit`; the log is empty, which is what
  leanchecker prints on acceptance): the whole import closure of `ContProof` (Mathlib, the lab's library, bridge A,
  the statement files, the proof) replayed in the kernel from scratch.

## Builds

See LOG.md (table) and `build-logs/` (every log, with `*.exit` = target, exit code, seconds, UTC).
The proof file took two compile attempts (one error: `zero_le _`).
