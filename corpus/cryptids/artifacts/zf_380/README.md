# ZF Set Theory Consistency Machine (`393 -> 380` States)

* **Domain:** `zf` (2-symbol deterministic Turing machine halting if and only if Zermelo-Fraenkel set theory is inconsistent, starting from Andrew Wade's 2026 393-state machine [`baselines/tables/zf_393.txt`](../../baselines/tables/zf_393.txt))
* **State Reduction:** `393 -> 380` states (`-13` states, `-3.31%`; reducing `785` non-halting transitions to `759` non-halting transitions)
* **Runtime Steps:** `+0.0930%` step overhead at `1,000,000` baseline steps (`1,000,930` candidate steps vs. `1,000,000` baseline steps, `1.000930x`; `+0.1581%` / `1.001581x` at `10,000,000` baseline steps with `10,015,814` candidate steps, preserving 100% bit-exact tape equality after every macro-step)
* **Machine SHA-256:** `c3b8b166f41bd731e6de552a0f9cf7bfa15938fa5165cb4ccd19ead3206b8784` ([`machine.txt`](machine.txt))
* **Formal Equivalence Proof:** [`Cryptids/Zf380.lean`](../../Cryptids/Zf380.lean) (Lean 4 kernel, standard axioms `{propext, Classical.choice, Quot.sound}`)

## Mathematical Mechanism

This reduction eliminates `13` states (`65, 68, 266, 278, 322, 335, 341, 353, 359, 361, 379, 387, 389`) from the 393-state baseline (`785` non-halting transitions -> `759` non-halting transitions) by combining an exact 39,753-step bootstrap execution with a 5-cell local sliding-window invariant `validState(q, l2, l1, l0, h, r0)` and non-destructive leftward head-bounce excursions (`Reaches₁`).

1. **Exact Bootstrap Synchronization (`init -> step 39,753`):**
   - States `0..4` and `68` (mapped to `65` in `zf_380`) initialize the tape from the blank initial configuration `init` without entering any merged states.
   - Using the fast tape representation `cfgOfFast` and checked 5,000-step checkpoints (`boot_chk_0` through `boot_chk_7`, followed by `boot_fast_19_ref` and `boot_fast_19_cand`), both `zf_393` (`boot_ref`) and `zf_380` (`boot_cand`) reach the identical configuration `cfgOfFast 64 [] 0 bootR_39753` in exactly `39,753` steps (`0` step overhead during bootstrap).

2. **5-Cell Sliding-Window State Invariant (`validState` & `mapState`):**
   - For all configurations reachable from `cfgOfFast 64 [] 0 bootR_39753`, `q >= 5` and `q != 68` hold, and the machine satisfies the finite boolean invariant `validState(q, l2, l1, l0, h, r0)` tracking three cells to the left of the head (`l2, l1, l0`), the head symbol (`h`), and one cell to the right (`r0`).
   - Contextual state routing `mapState(q, l0, h) : Fin 393 -> Fin 380` merges reachable state-symbol slots whose local tape context (`l0`, `h`) guarantees non-conflicting transitions (`67 -> 292`, `66 -> 350 | 338`, `65 -> 45 | 342`, `(21, 1) -> 17`, `266 -> 272`, `278 -> 252 | 270`, `322 -> 280`, `341 -> 46`, `347 -> 80`, `353 -> 82`, `359 -> 356`, `379 -> 376`, `334 -> 385`, `335 -> 337`, `370 -> 371`, `389 -> 388`, `361 -> 76`, `387 -> 345`).

3. **Non-Destructive Left-Bounce Macro-Steps (`Respects` in 1, 3, 5, 7, or 9 Steps):**
   - Where merging states redirects an entry `(q, h)` into a short leftward excursion that leaves tape symbols unchanged before returning to the head cell and executing `expectedTransition(q, l1, l0, h, r0)`, `zf_380` simulates one step of `zf_393` via `StateTransition.Respects`:
     - **1-step direct transition (`transition_oneStep`):** `99.92%` of post-bootstrap steps (`9,952,350` of `9,960,247` post-bootstrap steps up to `t = 10,000,000`).
     - **3-step `L -> R -> step` bounce (`isThreeStep`):** `7,887` occurrences up to `t = 10,000,000` (`+2` candidate steps per bounce).
     - **5-step `L -> R -> L -> R -> step` (`isFiveStepLRLR`) and `L -> L -> R -> R -> step` (`isFiveStepLLRR`):** `10` occurrences up to `t = 10,000,000` (`+4` candidate steps per excursion).
     - **7-step `L^3 -> R^3 -> step` (`isSevenStepLLLRRR`) and 9-step `L -> R -> L^3 -> R^3 -> step` (`isNineStepLRLLLRRR`):** verified exhaustively across all reachable `(l2, l1, l0, h, r0)` window combinations by `decide`.
   - Lifting `respects` from `rel_boot` via `StateTransition.tr_eval_dom` yields `candidate_equivalent : Halts candidate ↔ Halts reference` using only the standard Lean 4 axioms `{propext, Classical.choice, Quot.sound}`.
