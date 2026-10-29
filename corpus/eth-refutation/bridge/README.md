# The ETH bridge

OpenAI (`openai/math`, family 378) and Anthropic (`anthropics/formal-math`, `eth/`) each claim
that the Exponential Time Hypothesis is false and back the claim with a Lean proof. Two kernels
here certified both proofs (`certs/eth-kernel.json`). But each claimant proved its own statement,
not the textbook hypothesis. The step from one to the other was left to prose:

- **OpenAI's Lean defines no ETH.** Its theorem `exact_count_and_sat` is a running-time bound
  (about the paper's Prop. 6.4). The paper calls it a refutation of ETH (readings `first.md`
  §I.1, §I.3 row 12, §I.4).
- **Anthropic's `ETHIsFalse` is `¬ (0 < s 3)`.** Here s₃ is an infimum over `FinTM2` machines on
  `encClauses 3` (`first.md` §II.1, §II.4).

This folder closes that step in Lean. We wrote it ourselves, and none of it comes from either
claimant's proof. The textbook ETH is stated **once**, over an abstract model of computation. It
is then instantiated with each claimant's **own** machine model and input encoding. For each
claim, the Lean proof shows that the claim's own statement implies the textbook ETH is false in
that model.

Both statements are **counting** statements: OpenAI's machine writes the exact number of
satisfying assignments, and Anthropic's `MainTheorem` outputs it. So the counting hypothesis
**#ETH** (Dell, Husfeldt, Marx, Taslaman and Wahlén 2014) is stated once too, in the same file and
the same shape, and each claim's own statement is proved to imply that #ETH is false in that
claimant's own **counting** model, with the count read where the claimant writes it.

**Status: PROVED, 51 theorems, each checked by two kernels.** Six are generic and are built in both
projects; 29 are OpenAI's instantiation and 16 are Anthropic's. Every theorem's axioms are among
propext, Classical.choice and Quot.sound. Lean's kernel checks each one inside `lake build`; then
Comparator replays every one of them in a second, independently written kernel (nanoda) and in
Lean's kernel again, on a fresh runner (see *The second kernel* below). The run is recorded in
`certs/eth-bridge.json` (each theorem's `kernels`) and its logs are in `runs/<run-id>/`.
`tools/record-eth-bridge.js` writes that ledger from a green run only, after it has re-run every
gate on the run's logs. A theorem counts as proved only when the ledger lists it. The first 34
theorems (ETH alone, one kernel) were proved in run
[40772430556](https://github.com/carlostoledo1891/cert-machine/actions/runs/40772430556) at
commit `3220a433`; its logs stay in `runs/40772430556/`.

## The textbook hypothesis, stated once (`ETHBridge/Generic.lean`)

The source is Impagliazzo and Paturi, *Complexity of k-SAT*, CCC 1999, p. 1. They define s_k as
the infimum of the δ such that k-SAT has an O(2^{δn}) algorithm, and ETH as: s_k > 0 for every
k ≥ 3. The source names no model of computation. In Lean, a `Model` supplies one. It fixes:

- a type of machines, and the ones that count (`Admissible`);
- the formulas on x₀ … x_{n−1}, which of them are k-SAT instances (`IsKCNF k n φ`), and which are
  satisfiable;
- the input word of a formula for k-SAT (`encode k n φ : List Bool`);
- `OutputsInTime M w b t`: M, started on the word w, halts within t steps with the one-bit answer b.

With a model fixed, the four definitions read as follows. Their shape follows Anthropic's
`MainResults.lean`, so the two instantiations can be read side by side.

| Lean | mathematics |
|---|---|
| `DecidesKSat k M t` | for every n and every k-SAT instance φ on n variables, M started on `encode k n φ` halts within t(n) steps with a bit b, and b = 1 ⇔ φ is satisfiable |
| `InTime k δ` | some admissible M and some c ∈ ℕ give `DecidesKSat k M (n ↦ ⌊c·2^{δn}⌋)`; the bound holds for **every** n |
| `s k` | inf {δ ∈ ℝ≥0 : `InTime k δ`}, a number in [0, ∞] |
| `ETH` | **∀ k ≥ 3, 0 < s k** (the textbook quantifier) |

Three facts hold in every model:

- `s_eq_zero_of_forall_inTime`: if `InTime k δ` holds for every δ > 0, then s_k = 0.
- `not_eth_iff`: ¬ETH ⇔ there is a k ≥ 3 with s_k = 0.
- `not_eth_of_forall_inTime`: if, for one k ≥ 3, `InTime k δ` holds for every δ > 0, then ¬ETH.

The file is byte-identical in both projects. `tools/eth-bridge-gates.js` refuses any build in
which the two copies differ.

## The counting hypothesis #ETH, stated once (same file)

The source is Dell, Husfeldt, Marx, Taslaman and Wahlén, *Exponential time complexity of the
permanent and the Tutte polynomial*, ACM TALG 10(4), 2014: #ETH, the counting analogue of ETH. A
`CountModel` fixes the same things a `Model` does, field for field, with two changes: which
assignments satisfy a formula (`Satisfies`), so that the number of satisfying assignments is
defined once, here; and `OutputsCountInTime M n w c t`: M, started on the word w of a formula on n
variables, halts within t steps with the number c written on its output, in the model's own
convention. Its machines, instances and input words are the claimant's own for counting, so they
may differ from the same claimant's ETH model (below, each says how).

| Lean | mathematics |
|---|---|
| `numSat n φ` | the number of a : {x₀ … x_{n−1}} → Bool that satisfy φ (`Nat.card`) |
| `CountsKSat k M t` | for every n and every #k-SAT instance φ on n variables, M started on `encode k n φ` halts within t(n) steps with `numSat n φ` on its output |
| `CountInTime k δ` | some admissible M and some c ∈ ℕ give `CountsKSat k M (n ↦ ⌊c·2^{δn}⌋)` for **every** n |
| `sharpS k` | s#_k = inf {δ ∈ ℝ≥0 : `CountInTime k δ`}, in [0, ∞] |
| `SharpETH` | **∀ k ≥ 3, 0 < s#_k** |

A polynomial factor changes no infimum, so 2^{δn} and 2^{δn}·poly(n) give the same s#_k; and
s#_3 = 0, which both bridges prove, refutes the k = 3 form too. The three generic facts mirror
ETH's: `sharpS_eq_zero_of_forall_countInTime`, `not_sharpEth_iff`,
`not_sharpEth_of_forall_countInTime`.

## Instantiation O: OpenAI (`openai/`, Lean v4.34.1, Mathlib `d13f23b7`)

**The challenge, copied.** `ETHBridge/OpenAIChallenge.lean` holds the pinned bytes of
`lean/ComparatorChallenges/SubexponentialSAT.lean` (sha256 `4183b205…a76685`) under a header
comment. The bytes carry **one** declared change. The challenge ends with the theorem
`exact_count_and_sat`, whose proof it leaves open. Here that theorem becomes the proposition it
states:

```lean
def OpenAIClaim : Prop :=
  ∀ (k : ℕ) (hk : 2 ≤ k),
    <the 23 statement lines, unchanged>
```

The gate rebuilds the original file from the copy and checks its sha256 against
`corpus/eth-refutation/pins.json`.

**The model** (`ETHBridge/OpenAI.lean`, `model`) is OpenAI's own:

- **machines:** a machine is a `PrimitiveMachine`. Every machine counts, since it is finite by
  construction.
- **formulas:** a formula is a `Finset` of clauses, and each clause is a `Finset` of literals.
- **instances:** the k-SAT instances are `WidthAtMost k`.
- **input:** the word is `encodeCNF`.
- **halting:** "halts within t steps with answer b" means that `Trace step` reaches, in at most t
  steps from `init w`, a configuration whose state is the halting state `inl b`. This is the
  machine's own convention.
- **satisfiable:** some a : Fin n → Bool makes a literal of every clause true. This definition is
  ours, and it is related to OpenAI's `count` by (ii) below.

**The theorems.** In each, L is the length of the input word.

| theorem | mathematics |
|---|---|
| `count_pos_iff` | (ii) #F > 0 ⇔ F is satisfiable. So the halting answer `decide (0 < count F)` decides satisfiability. |
| `monitor_config`, `locatedStep_config`, `trace_config` | The challenge's runs carry head positions (`LocatedCfg`, `locatedStep`). Each located trace projects to a trace of `PrimitiveMachine.step` of the same length. |
| `frame_length`, `encodeNat_length`, `encodeList_length_le`, `literalCode_lt`, `clauseNumbers_length_le`, `lt_of_mem_clauseNumbers`, `clauseWord_length_le`, `cnfNumbers_length_le` | The exact sizes of the pieces of the word. A clause of at most k literals has a word of at most 1 + k(4n+2) bits. |
| `formulaBitLength_le` | L ≤ n + 2 + m·(2(1 + k(4n+2)) + 2), where m = #clauses. |
| `card_literal`, `clauseCount_le` | There are 2n literals. The clauses of a width-k formula are distinct subsets of at most k of them, so m ≤ (k+1)(2n+1)^k. |
| `bitLength_succ_le` | (i) L + 1 ≤ (3 + (k+1)·2^k·(4+8k))·(n+1)^{k+1}. The input is polynomial in n. |
| `tendsto_logsq_div_sqrt`, `tendsto_ratio`, `tendsto_log_div` | (ln u)²/√u → 0, (ln ln(n+16))²/√ln(n+16) → 0, and ln(n+1)/n → 0. |
| `eventually_le` | For every δ > 0 and every A and p, from some n on: (n+1)^p·2^{A·n(ln ln(n+16))²/√ln(n+16)} ≤ 2^{δn}. |
| `bound_le` | (iii) For every δ > 0 there is one c ∈ ℕ with B·(n+1)^p·2^{A·n(ln ln(n+16))²/√ln(n+16)} ≤ c·2^{δn} for **every** n. The finitely many small n go into c. |
| `inTime_of_claim` | If `OpenAIClaim` holds, then `InTime model k δ` holds for every k ≥ 2 and every δ > 0. The witness is the challenge's own machine for k. |
| `s_eq_zero_of_claim` | If `OpenAIClaim` holds, then s_k = 0 for every k ≥ 2. |
| **`not_eth_of_claim`** | **If `OpenAIClaim` holds, then ¬ETH in OpenAI's model.** |

The constants follow the claim's quantifier order, ∀k ∃M ∃C,A,d ∀n ∀F. The proof takes the
machine and the constants for k = 3. It bounds (L+1)^d by (K(n+1)^{k+1})^d using (i). It reads the
answer from the halting state using (ii). It absorbs everything into c·2^{δn} using (iii).

**#ETH, OpenAI's counting model** (`countModel`). OpenAI's convention for the count, followed
exactly: a counting machine is a `PrimitiveMachine` **with its count tape** (`Counter`), chosen
together before the constants and the formulas, as `exact_count_and_sat` chooses them. It halts
(a state `inl b`) within t steps with the count tape exactly `Tape.mk₁ ((countWord c).map some)`:
the binary digits of c, lowest first (`Nat.bits`; the single digit 0 for c = 0). Formulas,
instances (`WidthAtMost k`, every formula) and input word (`encodeCNF`) are those of `model`.

| theorem | mathematics |
|---|---|
| `numSat_eq_count` | the generic count is OpenAI's `SAT.count` |
| `runtime_le_floor` | (i) and (iii) together: one c ∈ ℕ bounds every run that keeps the claimed time by ⌊c·2^{δn}⌋ |
| `countInTime_of_claim`, `sharpS_eq_zero_of_claim` | the claim gives `CountInTime countModel k δ` for every k ≥ 2 and δ > 0, so s#_k = 0 |
| **`not_sharpEth_of_claim`** | **If `OpenAIClaim` holds, then ¬#ETH in OpenAI's counting model.** |

## Instantiation A: Anthropic (`anthropic/`, Lean v4.33.1, Mathlib `0df444a3`)

**The trusted file, copied.** `MainResults.lean` holds the pinned bytes of `eth/MainResults.lean`
(sha256 `47f78a95…ed24944`), unchanged, under a header comment.

**The model** (`ETHBridge/Anthropic.lean`, `model`):

- **machines:** a machine is `Turing.TM2ComputableAux Bool Bool`. The admissible ones have every
  stack alphabet finite.
- **formulas:** a formula is `MainResults.CNF n`.
- **instances:** the k-SAT instances are `MainResults.IsKCNF k`.
- **input:** the word is `MainResults.encClauses k`.
- **halting:** "halts within t steps with answer b" means `Turing.TM2OutputsInTime` with output `[b]`.

**The theorems:**

| theorem | mathematics |
|---|---|
| `decidesKSat_iff`, `inTime_iff`, `s_eq` | In this model the generic `DecidesKSat`, `InTime` and `s` **are** Anthropic's, by definition (`Iff.rfl`, `rfl`). So the generic definition specializes to theirs. |
| `eth_three_iff` | Anthropic's `ETH` is 0 < s₃, the k = 3 instance of the textbook quantifier. |
| `ethIsFalse_iff` | `ETHIsFalse` ⇔ s₃ = 0. |
| `eth_of_eth` | The textbook ETH (every k ≥ 3) implies Anthropic's `ETH` (k = 3). |
| **`not_eth_of_ethIsFalse`** | **`ETHIsFalse` implies ¬ETH in Anthropic's model.** |

**#ETH, Anthropic's counting model** (`countModel`). Anthropic's convention for `MainTheorem`,
followed exactly: the input word is `encInput k φ` (1ᵏ 0, then `encClauses k φ`); the output is
`TM2OutputsInTime` with output `binary n c`, the lowest n + 1 bits of c, lowest bit first, through
the output alphabet; the machines are those of `model`. **The #k-SAT instances are the formulas
`MainTheorem` speaks of**: `IsKCNF k φ`, at least two clauses, at least four variables, every
variable occurring (`AllOccur`). `MainResults.lean` says nothing about any other input word, so
#ETH here is #ETH on that class (see *What is not proved*).

| theorem | mathematics |
|---|---|
| `numSat_eq` | the generic count is Anthropic's `numSat` |
| `countsKSat_iff` | the generic `CountsKSat` in this model is Anthropic's `CountsWithin` on that class |
| `tendsto_lg_div_sqrt`, `tendsto_lg_ratio` | lg u/√u → 0, and lg lg n/√(lg n) → 0 |
| `eventually_expN_le` | for every δ > 0, from some n on, C·k²·n·lg lg n/√(lg n) ≤ δn |
| `bound_le` | one c ∈ ℕ with 2^{C·expN k n} ≤ c·2^{δn} for **every** n |
| `countInTime_of_mainTheorem`, `sharpS_eq_zero_of_mainTheorem` | `timeMin C k m n` ≤ ⌊2^{C·expN k n}⌋ ≤ ⌊c·2^{δn}⌋, so s#_k = 0 for every k ≥ 1 |
| **`not_sharpEth_of_mainTheorem`** | **`MainTheorem` implies ¬#ETH in Anthropic's counting model.** |

## The second kernel

The `kernels` job of `.github/workflows/eth-bridge.yml` replays **every** theorem of both projects
in two kernels with Comparator, the tool the eth-kernel and eth-tsavo lanes use, at their versions:
Comparator `d03acab1` built with Lean v4.34.1, lean4export of each project's toolchain, landrun,
and nanoda `3a240721` with lane K's build. Comparator needs a challenge with the statements; ours is
**generated** (`tools/eth-bridge-gates.js challenge`): the project's two bridge files as one module
`BridgeChallenge`, every proof replaced by `sorry` and nothing else changed, plus one lakefile block
so Lake can build it. The solution is the project's own `ETHBridge`. Comparator builds both in its
sandbox on a fresh runner (nothing has built the bridge there before), checks every statement
matches, checks the axioms, and replays the solution's export in nanoda and in Lean's kernel. The
workflow's header declares every setting that differs from the tools' defaults. The kernel gates
then refuse unless the files the run used are exactly what the checkout builds, both kernels
print that they accept, and every theorem is in the export. The record lists, per theorem,
`kernels: ["lean-build", "lean-comparator", "nanoda"]`.

## What is not proved, and why

- **The cross-model bridges stay prose, here as for both claimants.** One is that a
  `PrimitiveMachine` (OpenAI) or a `FinTM2` machine (Anthropic) can be simulated by a word RAM, or
  by a multitape Turing machine, with polynomial overhead (`first.md` B1, B1′). The other is that
  a textbook 3-CNF can be rewritten as `encodeCNF` / `encClauses` in time polynomial in its length
  (B2, B2′). Both are standard facts, and neither is formalized here. So ETH is proved false
  **in each claimant's own model**, not in a model-free sense. These bridges were out of scope by
  design.
- **The converse of `eth_of_eth`, `MainResults.ETH → ETHBridge.ETH`, is not proved.** It needs
  s₃ ≤ s_k for k ≥ 3. Anthropic's word depends on k (k slots per clause), so a machine for 3-SAT
  does not run on a k-SAT word without a re-encoding machine. The bridge does not need it.
- **Anthropic's #ETH is #ETH on the formulas `MainTheorem` speaks of** (at least two clauses,
  at least four variables, every variable occurring). The other k-CNFs reduce to that class by
  standard steps (a finite table for fewer than four variables and k fixed; a closed form for
  fewer than two clauses; a variable that occurs nowhere doubles the count), which are not
  formalized. OpenAI's #ETH has no such restriction.
- **ETH and #ETH are separate consequences.** ETH → #ETH (counting is at least as hard as
  deciding) is not proved in either model, and neither refutation is derived from the other.
- **The Comparator challenge comes from our own text**, so its statement match is a consistency
  check; the claimants' statements enter only through the pinned copies. leanchecker was not run.
- **The claimants' proofs are not re-checked here.** That is the kernel lane (`certs/eth-kernel.json`).

## Rerun

```sh
node tools/eth-bridge-gates.js sources            # copies vs pins, generic file identical, nothing forbidden
git push origin HEAD:eth-bridge                   # or: gh workflow run eth-bridge.yml --ref eth-bridge
node tools/record-eth-bridge.js <run-id>          # a green run only → certs/eth-bridge.json
```

You can also build locally, with elan:

```sh
cd corpus/eth-refutation/bridge/openai            # or anthropic
lake update && lake exe cache get && lake build && lake env lean Axioms.lean
```

## Licenses

Both copied files are Apache-2.0: OpenAI's `openai/math` and Anthropic's `formal-math` (`eth/LICENSE`,
pinned). Each header comment names its source and states the change, as that license requires.
Everything else here is this repository's MIT.
