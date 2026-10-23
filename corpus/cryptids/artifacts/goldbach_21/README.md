# 21-State Goldbach Machine (`goldbach_21`)

* **Instance:** `goldbach`
* **Reference Machine:** `25` states, `2` symbols, `40` core non-halting transitions (`49` non-halting cells in table; [`baselines/tables/goldbach_25.txt`](../../baselines/tables/goldbach_25.txt), SHA-256: `da5bdb63c1ad0d0e3e97f8ca75addc2b6622dea483b3e3cdfbd2fc55363a5a67`)
* **Candidate Machine:** `21` states, `2` symbols, `37` core non-halting transitions (`41` non-halting cells in table; [`machine.txt`](machine.txt), SHA-256: `b248827bd190d5aedcc9ed6eae5e85f58ed43df8208b0406a9f477fdb2607602`)
* **Runtime Steps (`n = 4..40`):** `339,411` candidate steps vs. `170,966` reference steps through completion of `n = 40` (`1.99x` cumulative ratio; `125` vs. `49` bootstrap steps to enter `n = 4`)
* **Formal Equivalence Proof:** [`Cryptids/Goldbach21.lean`](../../Cryptids/Goldbach21.lean) (`0` axioms beyond `{propext, Classical.choice, Quot.sound}`)
* **End-to-End Semantics Proof:** [`Cryptids/Semantics/Goldbach.lean`](../../Cryptids/Semantics/Goldbach.lean) (`Halts candidate ↔ ¬ GoldbachConjecture`)

## Mathematical Overview of the `25 -> 21` State Reduction

The published 25-state Goldbach reference machine (`goldbach_25`, `40` non-halting core
transitions across `25` states) searches successive even integers `n = 2w + 4`
(`n = 4, 6, 8, ...`) for a counterexample to Goldbach's conjecture by enumerating
additive partitions `q + p = n` in unary on the binary tape and testing each summand for
primality by trial division.

The 21-state candidate machine (`goldbach_21`, `37` non-halting core transitions across
`21` states, `41` non-halting table cells) eliminates **4 states** (`states 1, 8, 10, 17`
in the 25-state numbering) by restructuring both the control flow and the orientation of
the partition search (`edited` in [`Cryptids/Goldbach21.lean`](../../Cryptids/Goldbach21.lean)):

1. **Eliminating State `8` (`return_0_to_check_even_loop`):**
   Redirecting `(7, 1): 1L8 -> 1L22` merges the leftward divisor-reset scan into state `22`
   (`(22, 1) -> 0L22`), sharing the unary erasure pass with the `B = 0` trial-division
   reset.
2. **Eliminating State `10` (Trial-Division Dispatch Node):**
   Redirecting `(0, 0): 1R1 -> 0R11`, `(9, 0): 1R10 -> 1R0`, and `(22, 0): 0R10 -> 0R0`
   routes every divisor-reset return directly through state `0` (`candM` state `1`) into
   the `counterTape` inner loop at state `11`, removing state `10` completely.
3. **Eliminating State `17` & Relocating the Halt Transition to `(3, 0)`:**
   Redirecting `(3, 0): 0L16 -> ---`, `(16, 0): 1L17 -> 1L18`, `(18, 0): 1L17 -> 0R2`,
   `(18, 1): 1R18 -> 0L19`, `(19, 0): --- -> 0R0`, and `(19, 1): 1R2 -> 1L19` folds the
   two-state turnaround `17 <-> 18` into states `18` and `19`, while shifting the unique
   halting transition `---` from `(19, 0)` to `(3, 0)`.
4. **Eliminating State `1` via `L`-First Partition Enumeration & Entry Swap (`0 <-> 2`):**
   Reversing `(5, 1): 1L5 -> 1R5` with `(2, 0) -> 1L11`, `(2, 1) -> 0R5`, `(6, 0) -> 0R7`,
   and `(15, 0) -> 1L16` eliminates the dedicated summand-merging state `1`. Under the
   injective embedding `embed : Fin 21 → Fin 25` (`embed 0 = 2`, `embed 1 = 0`,
   `embed 2 = 23`, `embed q = q` for `3 ≤ q < 8`, `embed 8 = 9`, `embed q = q + 2` for
   `9 ≤ q < 15`, `embed 15 = 24`, and `embed q = q + 2` for `16 ≤ q < 21`), starting
   `candM` at state `0` corresponds to starting `edited` at `⟨2, default⟩`, reaching the
   initial stage checkpoint `stageCfgE 0 = cfg0E false 2 2` after `125` steps
   (`boot_edited_125`), compared to `49` steps (`boot_chk0_ref`) in `goldbach_25`.

### Reversed (`L`-First) Partition Invariant (`stageCfgE w = cfg0E false 2 (2w + 2)`)

Whereas `goldbach_25` starts stage `w` (`n = 2w + 4`) in configuration
`stageCfg w = cfg0 true (2w + 2) 1` and tests candidate summands in ascending order
`p = 1, 2, 3, ...`, `goldbach_21` starts stage `w` in configuration
`stageCfgE w = cfg0E false 2 (2w + 2)` (`LBaseE false 2 = B0` on the left, `2w + 3` ones
at the head representing `p = 2w + 2`, separator `0`, and `REndE false 2` with `q + 1 = 3`
ones on the right representing `q = 2`):

* On each failed summand pair `(p, q)` with `p + q = 2w + 4`, `cfg0E_partner_fail_succ`
  decrements `p` and increments `q`, advancing from `cfg0E false q (p0 + 2)` to
  `cfg0E false (q + 1) (p0 + 1)`.
* If a prime pair `(p, q)` is found, `cfg0E_partner_pass` merges both blocks via state `6`
  (`nSteps_state6_merge_to_16_edit`), rejects the even sum `2w + 6` (`IsPrime (2w + 6)`
  false), skips `q = 1`, and lands cleanly at `stageCfgE (w + 1)` (`n = 2w + 6`).
* If all partitions fail down to `p = 1`, `cfg0E_partner_fail_one` transitions via
  `cfg0E false (q + 1) 0` to `state 3` reading `0`, where transition `(3, 0) = ---` halts.

## Runtime Overhead vs. `goldbach_25` (`n = 4..40`)

Because `goldbach_21` tests the larger summand `p = n - 2, n - 3, ...` first and routes
trial-division acceptance (`sim_state6_accept_edit`) through an extra pass of the
`counterTape` scanner loop rather than a dedicated return state, its cumulative step count
over `n = 4..40` is approximately `1.89x–2.99x` that of `goldbach_25`:

| Even `n` | `goldbach_25` Entry Step | `goldbach_21` Entry Step | Entry Ratio | `goldbach_25` Completion Step | `goldbach_21` Completion Step | Completion Ratio |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `4` | `49` | `125` | `2.55x` | `136` | `365` | `2.68x` |
| `6` | `136` | `365` | `2.68x` | `305` | `895` | `2.93x` |
| `8` | `305` | `895` | `2.93x` | `600` | `1,545` | `2.58x` |
| `10` | `600` | `1,545` | `2.58x` | `1,105` | `3,189` | `2.89x` |
| `12` | `1,105` | `3,189` | `2.89x` | `1,992` | `5,963` | `2.99x` |
| `14` | `1,992` | `5,963` | `2.99x` | `3,267` | `8,151` | `2.49x` |
| `16` | `3,267` | `8,151` | `2.49x` | `5,164` | `13,761` | `2.66x` |
| `18` | `5,164` | `13,761` | `2.66x` | `7,809` | `21,695` | `2.78x` |
| `20` | `7,809` | `21,695` | `2.78x` | `11,526` | `27,171` | `2.36x` |
| `22` | `11,526` | `27,171` | `2.36x` | `16,501` | `40,733` | `2.47x` |
| `24` | `16,501` | `40,733` | `2.47x` | `22,734` | `51,205` | `2.25x` |
| `26` | `22,734` | `51,205` | `2.25x` | `31,049` | `62,413` | `2.01x` |
| `28` | `31,049` | `62,413` | `2.01x` | `42,236` | `90,841` | `2.15x` |
| `30` | `42,236` | `90,841` | `2.15x` | `55,477` | `125,453` | `2.26x` |
| `32` | `55,477` | `125,453` | `2.26x` | `71,280` | `145,571` | `2.04x` |
| `34` | `71,280` | `145,571` | `2.04x` | `90,353` | `172,019` | `1.90x` |
| `36` | `90,353` | `172,019` | `1.90x` | `112,136` | `227,903` | `2.03x` |
| `38` | `112,136` | `227,903` | `2.03x` | `139,447` | `263,673` | `1.89x` |
| `40` | `139,447` | `263,673` | `1.89x` | `170,966` | `339,411` | `1.99x` |

## Guide to Reading [`Cryptids/Goldbach21.lean`](../../Cryptids/Goldbach21.lean)

1. **`edited` and `candidate_iff_edited`:**
   Defines the 25-state intermediate machine `edited` and injective embedding
   `embed : Fin 21 → Fin 25` (`embed 0 = 2`), proving
   `candidate_iff_edited : Halts candM ↔ (eval (step edited) ⟨2, default⟩).Dom` via
   `StateTransition.tr_eval_dom` and `transition_embed` (`by revert q a; decide`).
2. **Parametric Scanner Inductions & Counter Tape Arithmetic:**
   Establishes symbolic multi-step transitions over `ListBlank (Fin 2)` for both `refM`
   and `edited` (`nSteps_mkL_left_scan`, `nSteps_mk'_right_scan`, `nSteps_pass_11_b0`,
   `nSteps_pass_11_bsucc`, `nSteps_pass_11_to_6_*`, `nSteps_pass_11_to_16_*`).
3. **Reference Semantics (`halts_reference_iff_exists_counterexample`):**
   Proves directly from first principles (`IsPrime`, `HasGoldbachPair`) that
   `Halts refM ↔ ∃ w : ℕ, ¬ HasGoldbachPair (2 * w + 4)` starting from `stageCfg 0`.
4. **`L`-First Candidate Semantics (`halts_edited_iff_exists_counterexample`):**
   Proves `(eval (step edited) ⟨2, default⟩).Dom ↔ ∃ w : ℕ, ¬ HasGoldbachPair (2 * w + 4)`
   starting from `stageCfgE 0`, yielding `candidate_fewer_states : candidate.states < reference.states`
   and `candidate_equivalent : Halts candidate ↔ Halts reference`.
