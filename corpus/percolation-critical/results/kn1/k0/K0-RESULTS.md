# K0-RESULTS — our own files, before anything of theirs is on the pod (2026-11-13)

Author: the bridge's author (an agent, a Claude model). Rules: `PREREG-KN1.md` (sealed), section K0. Private.
Nothing below was replayed by a second party; every line names the file where the orchestrator can re-read it.
Pod clock, UTC: brief received 13:23; environment ready 13:35:56 (`env/k0env.out`: tools 0, cache 0, build 0,
639 s); first full run done 13:41:43; final run from the sealed bytes done 13:54:29; record gathered 13:55.
Lean 4.32.0 (commit 8c9756b2), Mathlib 81a5d257, working tree `/root/kn1/percolation`.

**In one line: all 41 sealed definitions elaborate with the sealed bytes, no repair, nothing dropped; every
REQUIRED proof closed; all eleven false planted variants are proved false; Planted 12 is proved TRUE.**

## Step 1 — elaboration

Sealed bytes checked on the pod before use (`run-final/sealed.check`): Printed.lean 161411bd…, Printed1.lean
f168a013…, Planted1.lean 2ea564da…, and the sibling's fragments Check.lean 5e337e96…, Planted.lean 70b4f0bd…,
PlantedCheck.lean 849cf561… — all OK. They sit in the tree unchanged (`cmp`, `run-final/paste.check`).

Whole files, as modules of the lab's tree (`lake build`, `run-final/logs/lib-*.log`):
`KN3Printed` (Printed.lean) exit 0, 13 s · `KN1Printed` (Printed1.lean) exit 0, 13 s · `KN1Planted`
(Planted1.lean) exit 0, 12 s. No error, no warning.

One verdict per definition, each ALONE in a module (`src/split.py`: `import Mathlib`, `import Printed`, the file's
`namespace` and `open` lines, the definition's bytes unchanged, `end`; the cut is checked lossless against the
sealed file; `lake env lean` on each; `run-final/split/*.{lean,log,exit}`, table `run-final/definitions.tsv`).
The modules of Planted1's definitions do not import Printed1: no definition of Planted1.lean uses a name of it.

| file | definitions | ELABORATES | FAILS |
|---|---|---|---|
| Printed1.lean | 12: Conjecture1 · _existsForm · _minimiser · _lowerBound · _emptyMinIs · _distinct · _properSubset · _onFin · _isLeast · _sInf · _iInf · _ennreal | 12 | 0 |
| Planted1.lean | 29: Planted1 … Planted17 · Neighbour1 … Neighbour12 | 29 | 0 |

Every one of the 41 logs is empty (exit 0, 0 bytes). The ten forms the clean-room author marked UNVERIFIED
(`IsLeast`, `sInf`, `⨅ a : A`, `⨅ a ∈ A` in ℝ≥0∞ and in ℝ, `Finset` with `∑`/`∏`, `min`, the event written in
place, the edge named in the statement, `∉`, the set written in place) all elaborate as written.
The lab's lakefile sets `autoImplicit = false`; it applies to our libraries and nothing needed it.

Negative control of this test (`control/`): the module of `Conjecture1` with `prob` misspelt `probb` once →
exit 1, `Unknown identifier`. REFUSED, as it must be.

**Repairs: none. Dropped: none.** The primary and the three required readings elaborate; step 2 went ahead.

## Step 2 — proofs, Mathlib only

Modules `KN1.K0.*` (sources `src/KN1/K0/`, in the tree `tree/KN1/K0/`). Import lines, all of them: `Mathlib`,
`Printed`, `Printed1`, `Planted1`, `KN1.K0.*` — no `Percolation.*`. Every module imports the SEALED statement
files; there is no repaired copy. `KN1.K0.Frag` = `import Mathlib` / `import Printed` / blank line (31 bytes) ++
the sealed Check.lean ++ Planted.lean ++ PlantedCheck.lean, byte-exact (`run-final/paste.check`: Planted.lean,
sha256 70b4f0bd68319005ce4250fc4a42fec93e885f393e6da2b250ab16c6b0357848, at offset 11456, 8826 bytes). All three
fragments are pasted, not Planted.lean alone, because the proofs use the sealed lemmas of the other two
(`prob_nonneg`, `prob_connEvent_of_eq`, `joined_bot`, `prob_connEvent_bot`, …).

Final build, every module compiled again from the sealed bytes (`run-final/logs/k0-*.{log,exit,seconds}`):
Frag 14 s, Basic 12 s, Required 12 s, PlantedFalse 13 s, Planted12 12 s, Readings 13 s, Weakenings 13 s,
PlantedFalse10 13 s, PlantedFalse11 14 s, Axioms 12 s — all exit 0, no warning.

### REQUIRED

| | statement | theorem (namespace `KN1K0`) | file:line | result |
|---|---|---|---|---|
| a | `Conjecture1 ↔ Conjecture1_existsForm` | `conjecture1_iff_existsForm` | Required.lean:20 | **PROVED** |
| b | `Conjecture1 ↔ Conjecture1_lowerBound` | `conjecture1_iff_lowerBound` | Required.lean:33 | **PROVED** |
| c | `Conjecture1 → Conjecture1_onFin` | `onFin_of_conjecture1` | Required.lean:49 | **PROVED** |
| d | `Conjecture1_existsForm ↔ KN3Planted.Neighbour1_Conjecture1` | `existsForm_iff_sealedNeighbour1 := Iff.rfl` | Required.lean:55 | **PROVED** (by `Iff.rfl`) |
| e | `¬ Planted1_maxInPlaceOfMin` | `planted1_false` | PlantedFalse.lean:15 | **PROVED** |
| e | `¬ Planted2_forAllAInPlaceOfMin` | `planted2_false` | PlantedFalse.lean:25 | **PROVED** |
| e | `¬ Planted3_inequalityReversed` | `planted3_false` | PlantedFalse.lean:34 | **PROVED** |
| e | `¬ Planted4_strictInequality` | `planted4_false` | PlantedFalse.lean:43 | **PROVED** |
| e | `¬ Planted5_sumInPlaceOfMin` | `planted5_false` | PlantedFalse.lean:53 | **PROVED** |
| e | `¬ Planted6_existsWithoutNonempty` | `planted6_false` | PlantedFalse.lean:63 | **PROVED** |
| e | `¬ Planted7_factorDropped` | `planted7_false` | PlantedFalse.lean:69 | **PROVED** |
| e | `¬ Planted8_minOverWrongEvent` | `planted8_false` | PlantedFalse.lean:78 | **PROVED** |
| e | `¬ Planted9_constantTwo` | `planted9_false` | PlantedFalse.lean:88 | **PROVED** |
| e | `¬ Planted10_sumInPlaceOfSetEvent` | `planted10_false` | PlantedFalse10.lean:34 | **PROVED** |
| e | `¬ Planted11_minOfTheTwoFactors` | `planted11_false` | PlantedFalse11.lean:79 | **PROVED** |
| f | `Planted12_realIInfOverMembership` | `planted12_true` | Planted12.lean:53 | **PROVED TRUE** |

Eleven of eleven planted variants believed false are proved false (three were required). Each uses the instance
of OBLIGATIONS1.md §2; no instance there was wrong.
- 2.1–2.9: exactly the instances given (`Bool` or `Unit`, `⊥`).
- 2.10: as given (`Bool`, `⊤`, every edge probability 1, A = `Finset.univ`, o = b = false, m = 1), through
  `prob_connEvent_of_adj_of_one` (PlantedFalse10.lean:15).
- 2.11: the SECOND form given there (the path 0 — 1 — 2 on `Fin 3`, both edges 1/2, A = {1}, m = P(1 ↔ 2)). The
  three "exact values" 1/2, 1/2, 1/4 are NOT proved; what is proved is what the refutation needs:
  P(0 ↔ 1) ≥ 1/2, P(1 ↔ 2) ≥ 1/2, P(0 ↔ 2) ≤ 1/4 (`prob_allOpen`, `le_prob_connEvent_of_adj`,
  `joined_mem_of_closed`). Two facts about `Fin 3` are closed by `decide` (kernel evaluation; not `native_decide`).

Planted 12, what it reduces to (sanity lemmas, Planted12.lean): `planted12_iInf_eq_zero` — the real
`⨅ a ∈ A, P(a ↔ b)` IS 0 as soon as A is not the whole vertex set; `planted12_iInf_le` — it is ≤ P(o ↔ b) for
every vertex o, in A or not. `planted12_true` uses of the model only 0 ≤ P ≤ 1: no percolation argument, and no
finiteness either (the proof never uses `[Finite V]`).

### OPTIONAL (about 15 minutes of the 40 allowed)

PROVED — the other sealed readings, each `Conjecture1 ↔ …` (Readings.lean): `_minimiser` (:15), `_emptyMinIs c`
for every real c (:24), `_distinct` (:36), `_properSubset` (:52), `_isLeast` (:64), `_sInf` (:74), `_iInf` (:103),
`_ennreal` (:119).

PROVED — one-way implications of OBLIGATIONS1 §3–§4 (Weakenings.lean): 3.3 `planted13_of_harris`, 3.4
`planted15_of_harris`, 4.1 `conjecture3_of_conjecture1` (to the sealed `KN3Printed.Conjecture3`, δ = min (ε/2) 1),
4.2 `harris_of_conjecture1`, 4.3 `planted13_of_conjecture1`, 4.4 `planted14_of_conjecture1`, 4.5
`planted15_of_conjecture1`, 4.6 `planted16_…`, `neighbour8_…`, `neighbour9_…`, `neighbour10_…`, `neighbour11_…`,
`neighbour12_of_conjecture1`, 4.7 `planted17_of_conjecture1`, 4.8 `conjecture1_of_neighbour7`, 4.9
`neighbour2_of_neighbour3`.

NOT PROVED — none of these was attempted:
- 1.8 (←) `Conjecture1_onFin → Conjecture1`. So RF is NOT a reading "whose equivalence with R0 was PROVED in K0":
  K2 may not pass through RF in the direction RF → R0 unless the relabelling is proved then (the sibling's
  Transport.lean relabels along any `V ≃ W` and is the place to start).
- 3.2 `Neighbour1_HarrisFKG`, 3.5 `Planted14_productInPlaceOfMin`, 4.10 `Neighbour2 → Conjecture1`, 4.11
  `Neighbour4 → Conjecture1`: each needs the Harris–FKG inequality for this product measure.
- Hence the status of Planted 13, 14, 15 ("true, by Harris–FKG") is NOT decided here; only that each follows
  from `Conjecture1` (4.3–4.5) and that 13 and 15 follow from the three-vertex Harris form (3.3, 3.4).

## Axioms and the grep

`KN1/K0/Axioms.lean` prints `#print axioms` for all 58 theorems of our proof files (`run-final/theorems-ours.txt`
= `run-final/theorems-printed.txt`). `run-final/axioms-verdict.txt`: 58 commands, 58 printed, **0 outside
[propext, Classical.choice, Quot.sound]** (55 depend on exactly these three; `path3_adj`, `path3_from0`, `path3_to2` on [propext, Quot.sound] only). Output: `run-final/axioms.txt`,
`run-final/logs/k0-Axioms.log`.

`grep -nE "sorry|axiom|native_decide|implemented_by|unsafe|extern|admit"`:
- over the files that carry OUR proofs (Basic, Required, PlantedFalse, PlantedFalse10, PlantedFalse11, Planted12,
  Readings, Weakenings): **0 lines** (`run-final/grep-proof-files.txt`, empty);
- over the others (`run-final/grep-other-files.txt`, 77 lines): `KN1/K0/Axioms.lean` 59 = 58 `#print axioms`
  commands + its title line; `KN1/K0/Frag.lean` 18 = the 17 `#print axioms` commands of the sealed Check.lean and
  PlantedCheck.lean + one line of Check.lean's prose ("axioms printed at the end"); Printed.lean, Printed1.lean,
  Planted1.lean: none. Every match is the word "axioms"; none is a `sorry`, an `axiom` declaration or one of the
  other five.

## Beliefs of the clean-room author

Checked by proof and RIGHT: every equivalence of OBLIGATIONS1 §1 except the converse of 1.8 (not attempted);
every "PROVABLY FALSE" of Planted 1–11 with its instance; "Planted 12 is trivially TRUE"; the remark in
`Conjecture1_iInf`'s docstring that the real `⨅ a ∈ A` is 0 whenever A is not everything; the one-way
implications listed above. Wrong: **none found.**
Not checked: the beliefs resting on Harris–FKG (Planted 13–15, Neighbour 1), the unknowns, the prose arguments for
the converses of §5, and "Planted 2 says the same as Planted 1" (both are proved false, which makes them
equivalent as propositions and says nothing about the remark).
Small things, none a defect of the sealed files: Mathlib names recalled from memory in OBLIGATIONS1 were right
where used (`IsLeast.csInf_eq`, `Real.iInf_of_isEmpty`, `Real.iInf_nonneg`, `Fintype.sum_bool`);
`exists_minimiser` closed with `Set.exists_min_image`; Planted 12's docstring argues "there are finitely many
vertices" — not needed.

A consequence the orchestrator may want before K2: Planted 1–11 are now all proved false, so any two of them are
provably equivalent, and a target equivalent to one of them would be a theorem proving `False`.

## What happened that was not a clean first pass

- While the lab's build was still running I compiled ONE combined scratch file (Printed ++ the three fragments ++
  Printed1 and Planted1 without their import lines ++ my modules without theirs) three times in
  `/root/k0stage-*`, with `lean` and `LEAN_PATH` pointing at the Mathlib build under `/root/k1` — READ only;
  nothing was written under `/root/k1`. `stage/*.scratch.out`: run 1, 2 errors, both in my optional proofs
  (`zero_le _` no longer takes an argument; an `ω` left implicit in `prob_connEvent_of_adj_of_one`) and 2
  deprecation warnings (`mul_le_mul_left'`); run 2, clean; run 3 (with 4.4 and Planted 11 added), 4 errors, all
  one cause in 4.4 (`DecidableEq V` for `Finset.erase`; fixed with `classical`). No sealed definition and no
  REQUIRED proof ever failed to compile.
- `k0-all.sh` stopped once at its own byte-exactness check: I had written the header's length as 29 bytes; it is
  31. Corrected; the check then passed.
- Run 1 (`run1/`) is the first full run in the tree: everything exit 0, but `Axioms.lean` then listed 49 of the
  58 theorems (the 9 helper lemmas were reached only through the others). The file was completed, the build
  outputs of our modules were MOVED aside (`/root/kn1/attic/run1`, not deleted) and the final run compiled
  everything again.
- A command of mine that began with `rm -rf` of a scratch folder on the pod was refused by the desk's safety
  check and never ran. Nothing is removed on the pod by `rm`; `k0-all.sh` deletes only its own stale `*.lean`
  under `KN1/K0` and its own split outputs before rewriting them.
- The pod's SSH stalled for several minutes around 13:42–13:49; nothing was lost.

Not opened, not listed, not copied: `perc/kn1/thirdparty/`, the third party's repository or any page about it,
the closed arXiv papers. No web use of any kind. On the pod I did not open `/root/up` or `/root/kn1up.tar`.
`ls /root` at 13:55Z: formal-math-795efb86.tar.gz, k0env.out, k0src.tar, k0stage-133116, k0stage-133156,
k0stage-133555, k1, kn1, kn1up.tar, sealed, sealed-kn3, up.

## Proposed amendments

None. No rule of K0 had to be bent. Two things done under the rules that the orchestrator should know as choices:
the per-definition modules import `Mathlib` and `Printed` only (above), and Planted 11 is refuted with bounds, not
with the three exact values that OBLIGATIONS1 2.11 lists as "the work".

## Rebuild from the sealed bytes

On the pod, with `/root/sealed`, `/root/sealed-kn3` and the sources `/root/kn1/k0src` (= the desk's
`perc/kn1/k0/`):

    bash /root/kn1/k0src/k0-fresh.sh <label> && bash /root/kn1/k0src/k0-all.sh all

(`k0-fresh.sh` only moves the previous run and our modules' build outputs to `/root/kn1/attic/<label>` so that
every module is compiled again; `k0-all.sh all` alone rebuilds what changed.) About 3.5 minutes.

## The record

`results/kn1/k0/` on the desk = `/root/kn1/k0record` on the pod: `run-final/`, `run1/`, `stage/`, `tree/`, `src/`,
`env/`, `control/`, this file, and `SHA256SUMS` over every file, computed on the pod.
