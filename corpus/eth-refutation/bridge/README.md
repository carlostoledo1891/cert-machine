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

**Status: PROVED, 34 theorems.** Three are generic and are built in both projects; 24 are
OpenAI's instantiation and 7 are Anthropic's. They were proved in run
[40772430556](https://github.com/carlostoledo1891/cert-machine/actions/runs/40772430556) at
commit `3220a433`, and every theorem's axioms are among propext, Classical.choice and Quot.sound.
The run is recorded in `certs/eth-bridge.json` and its logs are in `runs/40772430556/`.
`tools/record-eth-bridge.js` writes that ledger from a green run only, after it has re-run every
gate on the run's logs. A theorem counts as proved only when the ledger lists it.

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
- **The claimants' proofs are not re-checked here.** That is the kernel lane (`certs/eth-kernel.json`).
- **Only Lean's own kernel checks the bridge** (inside `lake build`). No second kernel was run
  for these files.

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
