# Riemann Hypothesis Machine (`120 -> 104` States)

* **Domain:** `riemann` (2-symbol deterministic Turing machine halting if and only if the Riemann Hypothesis is false, starting from Joseph M. Shunia's September 2026 120-state machine [`baselines/tables/riemann_120.txt`](../../baselines/tables/riemann_120.txt), [`arXiv:2609.30306`](https://arxiv.org/abs/2609.30306))
* **State Reduction:** `120 -> 104` states (`-16` states, `-13.33%`; non-halting transitions `238 -> 207`, `-31` transitions, `-13.03%`)
* **Runtime Steps:** `-99.9899%` bootstrap step reduction (`9,934.23x` faster initialization: `9,037` candidate steps vs. `89,775,610` baseline steps to canonical root entry `main.0`) and `-97.7260%` post-bootstrap execution reduction over the first `1,000` abstract register instructions (`489,345` candidate steps vs. `21,518,736` baseline steps, `43.97x` post-bootstrap speedup; cumulative `498,382` vs. `111,294,346` steps, `223.31x` total speedup)
* **Machine SHA-256:** `ac0c7e8a76679ba2a3f2c1814166b392c8301e51110a08bcd2c06624be35f25d` ([`machine.txt`](machine.txt))
* **Formal Equivalence Proof:** [`Cryptids/Riemann104.lean`](../../Cryptids/Riemann104.lean) (Lean 4 kernel, standard axioms `{propext, Classical.choice, Quot.sound}`)

## Mathematical Mechanism

Across a five-link chain of forward/backward simulation theorems (`Halts candidate ↔ Halts edited121 ↔ RhRegHaltsOf true ↔ RhRegHaltsOf false ↔ Halts riemann121 ↔ Halts reference`), this reduction removes 16 states (`-13.33%`) and 31 non-halting transitions (`-13.03%`) from Joseph M. Shunia's 120-state machine (`riemann_120`, [`arXiv:2609.30306`](https://arxiv.org/abs/2609.30306)).

The formal proof ([`Cryptids/Riemann104.lean`](../../Cryptids/Riemann104.lean)) factors through a de-merged 121-state intermediate machine (`riemann121`) and an optimized 121-state sparse machine (`edited121`) whose 104 reachable states embed injectively into `Fin 121` via `embed104To121 : Fin 104 → Fin 121`:

1. **5-Cell Local Window De-Merging (`reference <-> riemann121`, `+1` intermediate state):**
   - State `32` of `riemann_120` merges two functionally distinct scanner states (`N24` on bit `0` and `6.continue.2` on bit `1`). Using 32-bit 5-cell local neighborhood masks (`win5Masks` and `Win5Inv`), `halts_reference_iff_halts_riemann121` splits state `32` back into separate states `32` (`N24`) and `97` (`6.continue.2`) in `riemann121` (`121` states, `239` non-halting transitions), proving that state `32` only ever reads `0` from `N24` contexts and `1` from `6.continue.2` contexts.
2. **Self-Bootstrapping Root Header & Dynamic Stack Padding (`-9` bootstrap states):**
   - `riemann_120` expends `9` dedicated bootstrap states (`0, 1, 2, 3, 5` in `0a.boot1` and `22, 25, 26, 28` in `0b.boot2`/root dispatch) and `89,775,610` steps to pre-allocate `padTotal = 3,821` stack-padding zeros and `1,909` zeroed unary/binary registers before entering `main.0` (`State 27`).
   - `riemann_104` eliminates both bootstrap phases entirely (`initial = 0`, mapped via `embed104To121 0 = 11` directly into `2b.reg.-2.inc`). Starting on the blank tape, it self-constructs a compact root configuration (`rootLeftOf true = [1]`, `padTotal = 21`, `5` active registers `[0, 0, 0, 0, 0]`, and `12` trailing zero registers) in `9,037` steps (`boot_ed_runPrefix`). Whenever a `break0` return exhausts the current zero padding (`zeros = 0`), the single left sentinel `[1]` redirects through states `24 -> 18 -> 32 -> 4 -> 17 -> 11 -> 27`, dynamically incrementing `padTotal -> padTotal + 1` on demand (`break0_cleanup_to_root_tm`).
3. **Return Scanner Consolidation & `mapStack` Call-Stack Re-Encoding (`-8` control-flow states):**
   - Redirecting `6.continue.1/2` (`37, 97`) through the shared left-return scanner (`24, 32`), merging leaf increment entry (`regIncStage3 4 = 70`), and replacing the early halt transition on `State 6` with `0R57` eliminates 8 additional control-flow and scanner states (`37, 85, 90, 91, 96, 97, 107, 112`), leaving exactly `104` active states in `edited121`.
   - Under this control-flow pruning, binary return-stack frames in `edited121` relate to those of `riemann121` via an injective prefix map `mapStack : List Bool → List Bool` (inserting a `0` separator into all `11..1` prefixes of length `≥ 2` with `2` or `3` leading ones, plus `4+` leading ones). On the compare-loop stack `[1, 1, 1, 1, 1, 0, 1, 1]`, `jumpLeft` steps through `[1, 1, 1, 1]` before reaching `[1, 1, 1, 1, 1]`; `rhRegHalts_true_iff_false` discharges this 2-for-1 abstract step using the inductive register invariant `RhRegInv` (`regs[1] = 0` throughout `inCompare`).

## Synchronized Runtime Benchmarks

Both machines execute the exact same sequence of 5-register states `[m, j, x, f, v]` at every canonical root/instruction checkpoint `k`:

| Abstract Checkpoint `k` | Register State `[m, j, x, f, v]` | `riemann_120` Steps | `riemann_104` Steps | Total Speedup | Post-Boot Speedup |
| :--- | :--- | ---: | ---: | ---: | ---: |
| `0` (bootstrap end) | `[0, 0, 0, 0, 0]` | `89,775,610` | `9,037` | `9,934.23x` | — |
| `100` | `[1, 0, 0, 0, 0]` | `91,965,528` | `26,093` | `3,524.53x` | `128.40x` |
| `116` (`stack = []`) | `[0, 0, 0, 0, 0]` | `92,295,002` | `28,934` | `3,189.85x` | `126.62x` |
| `500` | `[4, 1, 22, 0, 1]` | `100,693,638` | `165,200` | `609.53x` | `69.91x` |
| `1,000` | `[7, 0, 0, 1, 2]` | `111,294,346` | `498,382` | `223.31x` | `43.97x` |
