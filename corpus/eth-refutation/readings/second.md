# Second reading: the two claimed refutations of the Exponential Time Hypothesis

> **THIS IS A READING, NOT A VERDICT.** It says what the formal statements say, what the papers say,
> where they differ and whether the statements, *if proved*, refute ETH. It does not check that
> anything is proved: no Lean was built or run here, no proof file beyond the ones named below was read,
> and nothing downloaded was executed. Written by the second of two independent readers, 2026-10-28,
> without reading the first reader's work. Lean statements were read and accounted for before either
> paper or any author's description (`docs/378.md`, `README.md`, Appendix E, `PaperIndex.lean`).

## 0. Pins

| what | pin | sha256 of the bytes read |
|---|---|---|
| OpenAI repository | `openai/math@7ef5c0cc5ca4b0e072b7a050fca09ab24bc6fa3a` (= HEAD on 2026-10-28; previous commit `42907c9e`, 2026-10-26) | |
| `lean/ComparatorChallenges/SubexponentialSAT.lean` | same | `4183b2057cff350d66848215ff7167196dfc20e1891b598fdddea59077a76685` |
| `lean/ComparatorChallenges/SubexponentialSAT.json` | same | `debbfdc9c01104d2369be80da5180978275106df8b685f693fba7ce7da7c5b19` |
| `lean/docs/378.md` | same | `a2f7b390d6308997350b903be02c40a1227ebd2b9376982da528574500531f79` |
| `lean/OAI/Algorithms/SubexponentialSAT/SqrtLogSpace/Final.lean` | same | `040360a8465957622d934e5f1bb4f2cce8dab950e78f52033fbf70da493184f5` |
| preprint `preprints/The-Exponential-Time-Hypothesis-is-False-October-25-2026/paper.pdf` (67 pp.) | same | `5b1612dc2eebb2cad5b4cbe62d1fed2982f01ab1908c26f70010a651487e8123` |
| OpenAI toolchain | Lean `v4.34.1`, Mathlib `d13f23b723b8a846827a245b89c10fc7d3f11612` (`lean/lean-toolchain`, `lean/lake-manifest.json`) | |
| Anthropic repository | `anthropics/formal-math@16a5ce41304fcdaea4e0be7c132e1c361dc26da5` (= HEAD on 2026-10-28) | |
| `eth/MainResults.lean` | same | `47f78a9550d95b37d8718dd1ee16ae824da893a5e17c319f737e6d0a5ed24944` |
| `eth/Challenge.lean` | same | `63f54edafad0b4d1a4184c6279dc2fea4d8b3a6ef39fa04ab7fa72e86bfbb39e` |
| `eth/Solution.lean` | same | `27d304798a6ec294db7fdeee301227b70d72044cb31c85615901a8d728b0b98f` |
| `eth/comparator.json` | same | `757e5537ccf47d1946521b0b5fb91a230cdcfd8933dc9ab047710709c15ffa7e` |
| `eth/proof/PaperIndex.lean` | same | `22f1b39f4c334535e4cbd06d8516e39dd4d162e74ef7c2dd543e7d8746eb85e8` |
| `eth/README.md` | same | `844e0dd78593f728e6a6a1f52b7b3d1e162020c1746ac1f4b3c4e5f2ff7f494e` |
| `eth/paper.pdf` (49 pp.) | same | `7af518b09342c967ea371c74b8989806684c5d02aabe5763ca08554aff5025a0` |
| Anthropic toolchain | Lean `v4.33.1`, Mathlib `0df444a360eaa60ab8c11dca51a86af692955474` (`eth/lean-toolchain`, `eth/lake-manifest.json`) | |
| Impagliazzo–Paturi 2001, JCSS 62(2):367–375, doi:10.1006/jcss.2000.1727 (author copy, cseweb.ucsd.edu/~paturi/myPapers/pubs/ImpagliazzoPaturi_2001_jcss.pdf) | | `1b7d20af963735666020e844f8a454fbb64893a5f3b3c488c99d1f4bdae5c11c` |

Short names below: **OC** = `SubexponentialSAT.lean` (OpenAI challenge); **AM** = `MainResults.lean`;
**MC** = Mathlib `Mathlib/Computability/TuringMachine/Computable.lean`, **MS** = `.../StackTuringMachine.lean`,
**MT** = `.../Tape.lean`, **MP** = `.../PostTuringMachine.lean`, **MST** = `Mathlib/Computability/StateTransition.lean`
(line numbers at `0df444a3`; `MT` and `MP` lines are identical at `d13f23b7`).

**The textbook ETH used throughout** (IP01, p. 368, author copy): "For k ≥ 3, define s_k = inf{δ : there exists
O(2^{δn}) algorithm for solving k-SAT}. Define ETH (Exponential-Time Hypothesis) for k-SAT as follows: for k ≥ 3,
s_k > 0." IP01 Theorem 1 (p. 368, citing IPZ01) lists "For all k ≥ 3, s_k > 0" and "s_3 > 0" as equivalent. IP01
fixes no machine model and states no polynomial factor in the input length.

---

## 1. OpenAI — `openai/math`, family 378

### 1.1 The formal statement, unfolded (own account, formed before reading `docs/378.md` or the paper)

The challenge file imports only Mathlib (OC:1) and defines everything else itself; the comparator config
names one theorem, `OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.exact_count_and_sat`, with **no definition
holes** (`"definition_names": []`) and axioms `propext, Quot.sound, Classical.choice`, `enable_nanoda: false`
(`SubexponentialSAT.json`). Comparator guarantees that a listed solution theorem "Prove[s] the same statement as
provided in `Challenge`" and that "all declarations used in the statement … are the same as in the `Solution`
environment" (leanprover/comparator README @865edc14, lines 52–55, 190–192). The solution-side copies of the
machine and encoding definitions are textually identical to OC (`Computation.lean:20–23, 273–308`,
`Encoding.lean:18, 51–52, 87–89, 141–207`), and the solution theorem `Final.lean:74–97` restates OC:194–217
verbatim. Because OC imports only Mathlib, every name in the statement resolves either to OC itself or to
Mathlib (no namespace shadowing of `Real.log`, `Turing.Tape` is possible in the challenge environment).

**Formulas** (OC:17–38). A literal on `Fin n` is a pair (variable, `positive : Bool`); a clause is a
`Finset` of literals; a CNF is a `Finset` of clauses. So: no repeated literal inside a clause, no repeated
clause; a clause may be empty (false) or contain x and ¬x. `WidthAtMost k F` ⇔ every clause has card ≤ k (OC:38).
`count F` = number of `a : Fin n → Bool` with `F.eval a = true` (OC:44–47); clause eval = ∃ literal true;
CNF eval = ∀ clause true (OC:29–36). n is the *declared* number of variables; variables may be unused.

**Encoding and "canonical"** (OC:55–79). `encodeNat c = 1^c 0` (unary). `frame` doubles each bit b into `1 b`
and ends with `0`. `encodeList` writes `1·frame(e₁)·1·frame(e₂)…0`. A literal is the number `2·v + [positive]`
(OC:64–65); a clause is the **sorted** list of its literal numbers (OC:67–68); the formula is the **sorted**
(lexicographic, `List ℕ` order) list of clause lists (OC:70–71). `encodeCNF F = 1^n 0 · encodeList(encodeList
encodeNat)(cnfNumbers F)` (OC:73–77); `L := formulaBitLength F = |encodeCNF F|` (OC:79). "Canonical" therefore
means: the unique word that a `Finset`-formula gets by sorting; the machine owes nothing on any other word.
Length: by hand, L ≤ n + 2 + m(4 + (8n+4)k) (literal numbers in unary, framed twice); the solution proves
L + 1 ≤ (8k+7)(n+m+1)² (`SqrtLogSpace/EncodingBounds.lean:75–77`). Since clauses are distinct `Finset`s of
≤ k of the 2n literals, m ≤ Σ_{j≤k} C(2n,j) ≤ (2n+1)^k; for k = 3, **L = O(n⁴)**.

**Machine** (OC:92–124). `PrimitiveMachine`: `tapeCount, stateCount : ℕ`, an input tape, a start state,
`scan : Fin stateCount → Fin tapeCount` (each state reads exactly one tape), and
`transition : Fin stateCount → Option Bool → Bool ⊕ (Fin stateCount × Turing.TM0.Stmt (Option Bool))`.
It is a finite table. Tapes are Mathlib `Turing.Tape (Option Bool)` — bi-infinite, head cell + two
`ListBlank`s, `ListBlank` being lists modulo trailing blanks (MT:125, 408–414); blank = `none`
(core `Inhabited (Option α)` gives `none`). Alphabet: {blank, 0, 1}. `Turing.TM0.Stmt` is `move Dir | write Γ`
(MP:118–120); `Tape.move` shifts by one cell (MT:436–438), `Tape.write` replaces the head cell (MT:542–543).
One `step` (OC:107–119): in a halted state (`inl`) no step; otherwise read the head of the scanned tape, then
either halt with an answer bit (one step) or go to a new state and do one move *or* one write on that one tape.
`init` puts the input on the input tape with the head on its first symbol (`Tape.mk₁`, MT:494–495), other tapes
blank (OC:121–124). This is a deterministic multitape Turing machine that touches one tape per step — weaker per
step than the textbook machine, which reads all heads at once.

**Time** (OC:87–90, 200–202). `Trace step t a c`: exactly t successful steps from a to c. The theorem asserts a
trace of length `time` from `init (encodeCNF F)` to a configuration whose state is `inl (decide (0 < count F))`
(OC:207), i.e. halted. Deterministic, so `time` is the actual running time.

**Outputs** (OC:203–209). At halt: tape `countTape` holds exactly `countWord (count F)` (LSB-first binary,
`Nat.bits`, `[false]` for 0; OC:147) with the head on its first bit and blanks elsewhere; tape `answerTape` holds
exactly the one bit `decide (0 < count F)`; the halting state carries the same bit. Two trivial side facts
(binary value decodes; word length ≤ n+1).

**Bound** (OC:132–139, 210–211). `time ≤ C · (L+1)^d · 2^{A · ρ′(n)}` with
**ρ′(n) = n·(ln ln(n+16))² / √(ln(n+16))** (natural logs, shifted by 16 so that it is defined and positive for
all n ≥ 1, = 0 at n = 0). ρ′(n) = o(n).

**Space** (OC:149–189, 212–217). At every prefix of the run, the sum over tapes of the visited interval
lengths is ≤ S·(L+1)^e.

**Quantifiers** (OC:194–199): `∀ k ≥ 2, ∃ machine, ∃ countTape answerTape, ∃ C A S > 0, ∃ d e > 0,
∀ n, ∀ F : CNF (Fin n), WidthAtMost k F → ∃ time final, …`. One machine and one set of constants per k,
uniform in n and F; nothing depends on an ε. Not uniform in k (k is not part of the input).

**"ETH" in the file: nothing.** OC defines no ETH, no s_k, no complexity class; the bridge to ETH is entirely
outside Lean. (Solution-side names mention it — `runtimeBound_le_eth` at `SqrtLogSpace/Statement.lean:9`,
`exact_count_eth` at `Final.lean:104` — but those are bounds, not an ETH definition.)

Solution-side, not compared: `Final.lean:104–147` (`exact_count_eth`) restates the bound for n ≥ 20 as
`C·(n+m+1)^d·2^{A·ρ(n)}` with ρ(n) = n·(log₂log₂n)²/√(log₂n) (`SqrtLogSpace/Asymptotics.lean:10–11`), and
`SubexpOrderedRawMainTheorem.lean:115–124` states a *decision* result for raw lists with binary identifiers
(repeats allowed) at the scale n/log₂log₂(n+16) (`SubexpComputation.lean:29–32, 69–71`; name resolution of its
`runtimeBound` not checked with Lean). Neither is a comparator target.

### 1.2 The paper's statements, verbatim

- Abstract (p. 1): "We give a deterministic algorithm for exactly counting the satisfying assignments of an
  arbitrary k-CNF formula. For every fixed k ⩾ 2, on a formula with n variables and m clauses, our algorithm uses
  poly_k(n, m) space and runs in time (n + m)^{O_k(1)} 2^{n/(log n)^{1/2+o(1)}}. Our algorithm refutes the
  Exponential Time Hypothesis (ETH), which postulates that deciding 3-SAT on n variables requires 2^{Ω(n)} time in
  the worst case."
- Input (p. 1): F(x₁,…,xₙ) = ⋀_{e=1}^{m} [(x_{i_{e,1}} ⊕ b_{e,1}) ∨ ⋯ ∨ (x_{i_{e,k}} ⊕ b_{e,k})], "Repeating a
  literal permits clauses with fewer than k literals." "Throughout, log denotes the natural logarithm."
- **Theorem 1.1** (p. 2): "For each fixed k ⩾ 2, there exists a deterministic algorithm that, given a k-CNF F on
  n ⩾ 20 declared variables with m clauses, computes #F as defined in (1.1) in
  (n + m)^{O_k(1)} 2^{O_k(n log log n/√log n)} bit operations and (n + m)^{O_k(1)} bits of space. For each fixed
  D > 0, its running time on inputs with m ⩽ Dn is (n + m)^{O_{k,D}(1)} 2^{O_{k,D}(n/√log n)}."
- p. 2: "The rational interpolation argument in Section 6.4 gives the weaker exponent O_k(ρ(n)), where
  ρ(n) = n(log log n)²/√log n = n/(log n)^{1/2+o(1)}. Appendix D proves both bounds in Theorem 1.1 by tensor
  contraction."
- **Proposition 6.4** (p. 43): "For each fixed k ⩾ 2, the interpolation algorithm counts the satisfying assignments
  of a k-CNF on n ⩾ 20 declared variables with m clauses in (n + m)^{O_k(1)} 2^{O_k(ρ(n))} bit operations and
  (n + m)^{O_k(1)} bits of space."
- ETH as the paper states it (p. 4): "The Exponential Time Hypothesis (ETH) asserted that 3-SAT requires 2^{Ω(n)}
  deterministic time in the worst case, and hence so does k-SAT for every fixed k ⩾ 3 [IP01, Theorem 1]." And
  (p. 4): "Theorem 1.1 refutes ETH, SETH, Gap-ETH, and NSETH." (p. 7): "Taking k = 3 already refutes ETH."
- Model (§1.2, p. 7): "Space is measured in bits. Arithmetic-operation counts are distinguished from
  bit-operation counts." No machine model is named. The preprint never mentions Lean or a formalization (no
  occurrence of "Lean", "formaliz", "Mathlib", "Turing" in the extracted text).

### 1.3 Differences between the Lean statement (1.1) and the paper (1.2)

| # | Lean (OC) | Paper | Class | Matters for "ETH is false"? |
|---|---|---|---|---|
| O1 | exponent ρ′(n) = n(ln ln(n+16))²/√ln(n+16) (OC:132–134) | Thm 1.1: n log log n/√log n | **weaker bound** (by a factor log log n in the exponent); equals Prop. 6.4's ρ(n) up to constants (`Asymptotics.lean:190, 244`) | No: both o(n) |
| O2 | no density clause | Thm 1.1 second sentence: 2^{O_{k,D}(n/√log n)} when m ≤ Dn | **missing clause** | No |
| O3 | polynomial factor (L+1)^d in the canonical encoding length | (n+m)^{O_k(1)} | different parameter; equivalent up to polynomials since m, n < L+1 ≤ (8k+7)(n+m+1)² | No |
| O4 | all n ≥ 0 | n ≥ 20 | **stronger** (Lean) | No |
| O5 | steps of a one-tape-per-step multitape TM over {blank,0,1} | "bit operations", model unnamed | **different model** (Lean's is more restrictive) | No: TM steps bound RAM/bit-operation time from above |
| O6 | `Finset` of `Finset`s; canonical sorted unary word; empty and tautological clauses allowed | list of m clauses, exactly k literal slots each, repeats allowed | **different encoding**; Lean is a promise on canonical words | No: canonicalisation is poly-time (the paper's own proof of Prop. 6.4 does it, p. 43) |
| O7 | count on a tape in binary + answer bit on a tape + answer in the halting state | "computes #F" | stronger output contract | No |
| O8 | visited cells ≤ S(L+1)^e at every prefix | (n+m)^{O_k(1)} bits of space | equivalent | No |
| O9 | ∀k ∃ machine ∀n,F | "for each fixed k ⩾ 2, there exists a deterministic algorithm" | same quantifier order | No |
| O10 | no ETH in Lean | ETH: "3-SAT requires 2^{Ω(n)} deterministic time" (p. 4) | **missing clause** (the deduction is not formalised) | It is the gap the bridge (1.4) must fill |

### 1.4 Does OC imply that the textbook ETH is false?

**Answer: yes, if `exact_count_and_sat` is proved.** Step by step, for k = 3:

1. Instantiate OC at k = 3: one machine M₃ and constants C, A, d (OC:194–198).
2. Given a textbook 3-CNF G of length N on n variables in any standard encoding, compute in poly(N) time on a
   multitape TM the `Finset` formula F (delete repeated literals and repeated clauses, keep the n declared
   variables as `Fin n`, sort) and write `encodeCNF F`. G and F have the same satisfying assignments.
3. Run M₃. A `PrimitiveMachine` with T tapes is a deterministic T-tape Turing machine; one of its steps is one
   step of a standard T-tape machine (or O(1) RAM operations). Halting state = `decide (0 < count F)` (OC:207).
4. Time ≤ C(L+1)^d 2^{A ρ′(n)} with L = O(n⁴) (§1.1, `Finset` ⇒ m ≤ (2n+1)³), so the run takes
   2^{O(log n) + A ρ′(n)} = 2^{o(n)} steps. Hence for every δ > 0, time ≤ c_δ·2^{δn} for all n (finitely many
   small n absorbed in c_δ), plus the poly(N) of step 2.
5. Therefore s₃ = 0 in IP01's sense (p. 368): ETH is false. The same single machine serves every δ — stronger
   than ¬ETH needs.

Assumptions the bridge needs, none in Lean: (A1) model equivalence: a multitape TM is simulated on a word RAM with
O(1) overhead per step, and any polynomial overhead keeps 2^{o(n)} at 2^{o(n)}; (A2) the canonical encoding is
computable in poly(N); (A3) L ≤ poly(n), which holds because the formal object is a `Finset` (if repeated clauses
were representable, (L+1)^d would not be 2^{o(n)} in n); (A4) the poly(N) of step 2 — absorbed either because
IP01-style instances are sets (N = poly(n)) or under the usual poly(N)·2^{δn} convention; (A5) no sparsification
is needed, the bound is already in n; (A6) uniformity: one machine for k = 3, constants fixed before n and F.

Loophole hunt (each checked, none found): finite control and finite alphabet (OC:92–99, `Option Bool`); time is
an exact trace length to a halted state (OC:87–90, 201, 207); one tape per step (OC:111–119); output tapes are
compared as Mathlib tapes, i.e. exactly the word plus blanks (MT:125, 494); the promise is only "canonical
words" (OC:202), which is harmless by (A2); the polynomial factor is in L, harmless by (A3); the machine depends
on k only (OC:195); no definition holes (`SubexponentialSAT.json`). The one structural gap is O10: the passage
from OC to "ETH is false" is informal — short and standard, but not checked by a machine.

**Confidence: high (≈0.9).** The bridge uses nothing beyond (A1)–(A6); the residual risk is in my reading of the
Lean semantics (tape quotient, blank default), not in the mathematics. This says nothing about whether the
theorem is proved.

### 1.5 The scope note `lean/docs/378.md` (question 6)

- `docs/378.md:9` says Lean proves "(L+1)^{O_k(1)}2^{O_k(n(log log n)²/√log n)}" and `:11` that the
  manuscript gives "(n+m)^{O_k(1)}2^{O_k(n log log n/√log n)}". **Checked: correct.** OC:132–134 has
  (log log)² over √log; Theorem 1.1 (p. 2) has log log n over √log n. The Lean bound is the paper's *weaker*
  Prop. 6.4 bound O_k(ρ(n)) (p. 43), not Theorem 1.1. Both are o(n), so both refute ETH.
- **The m ≤ Dn refinement is in the paper only.** It is Theorem 1.1's second sentence (p. 2), proved in
  Appendix D.2 (p. 54) from Theorem D.1 (p. 53, Boolean tensor contraction). It is not in OC, not in the one
  `formalization.yaml` entry for this family (`lean/formalization.yaml:1683–1685`, `exact_count_and_sat` only),
  and `docs/378.md:11` attributes it to "the October 25 manuscript". In the 3,977-file solution tree I found no
  file whose name suggests Appendix D, and GitHub code search over
  `lean/OAI/Algorithms/SubexponentialSAT` for "density" returns two comments only
  (`SqrtLog/StatementCanonical.lean:20`, `InsertionInvariant.lean:394`). Not exhaustive (index-limited).
- Space: `docs/378.md:9` "(L+1)^{O_k(1)} tape cells" matches OC:212–217.

---

## 2. Anthropic — `anthropics/formal-math`, `eth/`

### 2.1 The formal statements, unfolded (own account, formed before reading README, Appendix E or the index)

`Challenge.lean` imports only `MainResults` (Challenge.lean:6), which imports only Mathlib (AM:6); it states two
theorems with `sorry`: `MainResults.ethIsFalse : MainResults.ETHIsFalse` and
`MainResults.mainTheorem : MainResults.MainTheorem` (Challenge.lean:12–17). `comparator.json`: both theorem
names, `"definition_names": []`, the three standard axioms, `"enable_nanoda": true`. `Solution.lean:40` derives
`ethIsFalse` from the Main Theorem's proof via `NamesInOrder.generalFormFollowsAsPropositions` and
`Wrap.countingBoundImpliesFailureOfETH`; `Solution.lean:44` proves `mainTheorem`. (Proofs not read.)

**Machine.** `Turing.TM2ComputableAux Bool Bool` (MC:147–153) = a `Turing.FinTM2` plus bijections from the input
and output stack alphabets to `Bool`. `FinTM2` (MC:46–70): a `Fintype` of stack indices `K`, input and output
stacks `k₀ k₁ : K` (may coincide), stack alphabets `Γ : K → Type`, a `Fintype` of block labels `Λ`, a main label,
a `Fintype` of internal states `σ` with an initial state, `Fintype (Γ k₀)` only, and a program `m : Λ → TM2.Stmt`.
AM adds `∀ i, Finite (M.tm.Γ i)` (AM:101, 178) — every stack alphabet finite; without it a stack over ℕ would let
one push carry unbounded data. `TM2.Stmt` (MS:127–134) is a finite tree of `push`, `peek`, `pop`, `load`,
`branch` ending in `goto` or `halt`; one `step` (MS:171–173) runs the current block's tree with `stepAux`
(MS:161–168) until its `goto`/`halt`. For a fixed machine that is a bounded number of stack operations, and every
`σ → …` function is a finite table because `σ` and the alphabets are finite. Stacks are `List`s (MS:144–150);
two stacks simulate a tape, so this is a standard deterministic multi-stack Turing machine.

**Time and halting.** `TM2OutputsInTime tm x (some y) t` = `EvalsToInTime tm.step (initList tm x)
(some (haltList tm y)) t` (MC:135–137): some number `steps ≤ t` of iterations reaches `haltList y` (MST:255–267).
`initList`: label `main`, state `initialState`, x on stack k₀, all other stacks empty (MC:110–115). `haltList`:
label `none` (halted; `step` of a halted configuration is `none`, MS:172), state `initialState`, y on stack k₁,
**all other stacks empty** (MC:118–123). So the machine must empty its input stack (one symbol per pop) before
halting — reading the input is part of the time.

**Formulas** (AM:59–80). `Lit n = Fin n × Bool`; `CNF n = List (List (Lit n))`. `IsKCNF k φ` ⇔ every clause
list has length ≤ k and `φ.Nodup` (AM:69): a clause may be empty, repeat a literal, contain x and ¬x; the same
literals in another order are a different clause; m ≤ Σ_{j≤k}(2n)^j ≤ (2n+1)^k. `Satisfiable φ` ⇔
∃ a : Fin n → Bool, ∀ C ∈ φ, ∃ l ∈ C, a l.1 = l.2 (AM:80). `numSat φ` = number of such a (AM:130–131).

**Encoding** (AM:73–75, 85–87, 135–139). `slot none = 0`, `slot (i, b) = 2i + 1 + [b]`. `encClauses k φ =
1^n 0`, then for each clause in list order, k slots of `Nat.log2 (2n) + 1` bits each, LSB first, slot j holding
`slot C[j]?`. The word is determined by the list — there is no canonicalisation: every list ordering is its own
input. Injective (slot of a literal ≥ 1), and 2n < 2^{⌊log₂ 2n⌋+1} so no slot overflows. For k = 3,
L = n + 1 + 3m(⌊log₂ 2n⌋+1) = O(n³ log n). `encInput k φ = 1^k 0 · encClauses k φ`; `binary n c` = the low n+1
bits of c, LSB first.

**ETH as defined in the file** (AM:92–122). `DecidesKSat k M t` ⇔ ∀ n, ∀ φ : CNF n, IsKCNF k φ → ∃ b,
(b = true ↔ Satisfiable φ) ∧ M on `encClauses k φ` outputs `[b]` within `t n` steps (AM:92–95) — t depends on n
only. `InTime k δ` ⇔ ∃ M, ∃ c : ℕ, all alphabets finite ∧ DecidesKSat k M (n ↦ ⌊c·2^{δn}⌋₊) (AM:100–102).
`s k = ⨅ (δ : ℝ≥0) (_ : InTime k δ), δ` in [0, ∞] (AM:107). **`ETH := 0 < s 3`** (AM:117);
**`ETHIsFalse := ¬ ETH`** (AM:122). Unfolded: s₃ = 0, and since `InTime 3 δ` is monotone in δ (larger floor,
`steps ≤ m` monotone), ETHIsFalse ⇔ **∀ δ > 0, ∃ M (finite), ∃ c ∈ ℕ, ∀ n, ∀ φ (3-CNF list, no repeated clause),
M decides φ within ⌊c·2^{δn}⌋ steps.** The machine may depend on δ — exactly the quantifier order of ¬ETH.

**Main Theorem** (AM:144–180). `lg = log₂` (AM:144); `expM k m = k·m/√(lg m)`; `expN k n = k²·n·lg(lg n)/√(lg n)`;
`timeMin C k m n = ⌊2^{C·min(expM, expN)}⌋₊`. `MainTheorem` ⇔ **∃ M (finite alphabets), ∃ C : ℕ, ∀ k n φ,**
1 ≤ k → IsKCNF k φ → 2 ≤ m → 4 ≤ n → AllOccur φ → M on `encInput k φ` outputs `binary n (numSat φ)` within
`timeMin C k m n` steps (AM:177–180), with m = `φ.length`, `AllOccur` = every x_i occurs (AM:127). One machine
and one constant for all k (k is part of the input).

### 2.2 The paper's statements, verbatim

- **Theorem 1** (Main Theorem, pp. 1–2): "There is a deterministic algorithm that, given a k-CNF with m clauses in
  which n variables occur, computes the number of satisfying assignments of these n variables in time
  (1) 2^{O(min{k²n log log n/√log n, km/√log m})}, where the O(·) hides an absolute constant."
- Notation (p. 4): "Throughout, log = log₂, and time is measured in the word RAM model. A conjunctive normal form
  (CNF) formula is a set of clauses (i.e. no clause is repeated, and thus a k-CNF on n variables has fewer than
  (2n+1)^k clauses)". §6 (p. 19): "a clause is a nonempty set of literals, and a 3-CNF is a finite set of clauses
  with at most 3 literals each."
- **Theorem 2** (p. 4): "(Simplified version of Theorem 1). For every δ > 0 there is a deterministic algorithm that
  computes the number of satisfying assignments of a 3-CNF on n variables, with any number of clauses, in time
  O(2^{δn})." Then: "The algorithm depends on δ."
- **Definition 6** (p. 20): "For an integer k ≥ 1, a k-CNF is a finite set of clauses with at most k literals each,
  and k-SAT is the problem of deciding whether a given k-CNF is satisfiable. Let s_k be the infimum of all δ ≥ 0
  such that some deterministic algorithm decides k-SAT on n variables in time O(2^{δn}), and let
  s_∞ = sup_{k≥3} s_k. The Exponential Time Hypothesis (ETH) is the statement that s_k > 0 for all k ≥ 3."
- **Corollary 5** (p. 20): "s_k = 0 for every k ≥ 3. Hence s_∞ = 0, and both ETH and SETH are false."
- **Corollary 11** (p. 34): "There are an absolute constant C and a deterministic algorithm that, given a k-CNF, for
  any k ≥ 1, with m ≥ 2 clauses in which n ≥ 4 variables occur, computes the number of its satisfying assignments,
  as assignments of these n variables, in time at most min{2^{C·km/√log m}, 2^{C·k²n log log n/√log n}}."
- Appendix E (pp. 40–44) prints AM. **Checked:** the printed listing (pp. 40–43) equals `MainResults.lean` at
  `16a5ce41` character for character after removing whitespace (8,754 characters each, zero differences).

### 2.3 Differences between the Lean statements (2.1) and the paper (2.2)

ETHIsFalse against Theorem 2 / Definition 6 / Corollary 5:

| # | Lean | Paper | Class | Matters? |
|---|---|---|---|---|
| E1 | decides | Thm 2 counts | **weaker** (decision form) | No: ¬ETH is about deciding |
| E2 | FinTM2 steps, input reading included | word RAM (p. 4) | **different model** (Lean's more restrictive) | No |
| E3 | `Nodup` list of lists; empty clause, repeated literal, permuted duplicates allowed | set of nonempty sets | **different representation**; Lean covers more inputs | No |
| E4 | fixed word: 1ⁿ0 + fixed-width slots | unspecified | **different encoding** | No: poly-time rewriting |
| E5 | ⌊c·2^{δn}⌋ for every n, c ∈ ℕ | O(2^{δn}) | equivalent (finitely many inputs per n) | No |
| E6 | ETH := s₃ > 0 | ETH := ∀ k ≥ 3, s_k > 0 | equivalent (s_k ≤ s_{k+1}, p. 20; IP01 Thm 1, p. 368) | No |
| E7 | x₀…x_{n−1}, n declared (may not occur) | x₁…xₙ, "on n variables" | renaming | No |
| E8 | machine per δ | "The algorithm depends on δ" (p. 4) | same quantifier order | No |

MainTheorem against Theorem 1 / Corollary 11:

| # | Lean | Paper | Class | Matters? |
|---|---|---|---|---|
| M1 | explicit C : ℕ, ranges k ≥ 1, m ≥ 2, n ≥ 4, bound for every such input | O(·), absolute constant; Cor. 11 has the ranges | **stronger** than Thm 1, = Cor. 11 | No |
| M2 | FinTM2 steps | word RAM | **different model** | No |
| M3 | input 1ᵏ0 1ⁿ0 + slots; k is input; k may exceed the longest clause | — | **different encoding** | No |
| M4 | m = list length (permuted duplicates counted); width counts repeated literals | m = number of distinct clauses | different measure of m | No (dedup first; expM is increasing for m ≥ 2) |
| M5 | output: count in exactly n+1 bits LSB-first, other stacks empty, state reset | "computes the number" | **stronger** output contract | No |
| M6 | floor of 2^{…} | 2^{O(…)} | rounding | No |
| M7 | promise: AllOccur, Nodup, m ≥ 2, n ≥ 4; nothing on other words | "in which n variables occur" | same + explicit promise | No (ETHIsFalse carries none of these) |
| M8 | one M, one C for all k | "an absolute constant", one algorithm (Cor. 11 "for any k ≥ 1") | same uniformity | No |

### 2.4 Does ETHIsFalse imply that the textbook ETH is false?

**Answer: yes, if `ethIsFalse` is proved** — and here the statement is ETH's negation itself, in a concrete model:

1. ETHIsFalse ⇔ ∀ δ > 0, `InTime 3 δ` (2.1).
2. Given a textbook 3-CNF G (length N, n variables): sort/deduplicate clauses (or merely deduplicate), pad each
   to 3 slots, write `encClauses 3 φ` — poly(N) time. Satisfiability is preserved.
3. Simulate M_δ (finite σ, Λ, K, Γ; each step ≤ a machine-dependent constant number of stack operations) on a
   word RAM in O(1) per step: O(c·2^{δn}) operations.
4. Total poly(N) + O(2^{δn}); with IP01-style set inputs N = O(n³ log n), so O(2^{δn}). Hence s₃ = 0 in IP01's
   sense and ETH is false.

Assumptions: (A1) TM2 → RAM simulation, O(1) per step for a fixed machine (MS:161–168; finiteness at MC:50, 60,
66 and AM:101); (A2) poly-time rewriting into the fixed word; (A3) no repeated clause in the textbook instance
or a poly(N) factor allowed (AM:64–69 explains why the time bound in n alone needs `Nodup`); (A4) no
sparsification needed; (A5) per-δ uniformity is what ¬ETH requires. Appendix E (p. 44) names A1 and A2 as "not
part of the Lean proof".

Loophole hunt (each checked, none found): infinite stack alphabets (closed by AM:101); unbounded work per step
(no: finite statement trees over finite tables); "halting" without halting (no: `haltList` has label `none`,
MC:119, and MS:172); output stack sharing the input stack (k₀ = k₁ allowed, but the halting configuration fixes
that stack to exactly `[b]`); vacuity (the encoding is injective, so no input forces contradictory answers); the
Main Theorem's promises (do not reach ETHIsFalse, which is stated and proved separately, Solution.lean:40).

**Confidence: high (≈0.95).** The Lean statement *is* s₃ = 0 on a Turing-machine model; only model equivalence and
input rewriting stand between it and IP01. This says nothing about whether it is proved.

### 2.5 Is Appendix E's list of differences complete? (question 5)

Appendix E (pp. 43–44, "Differences from the printed statements") lists: the named constant C; the explicit
ranges k ≥ 1, m ≥ 2, n ≥ 4; word RAM vs Mathlib's machine with input reading included and the meaning of a step;
rounding down; the fixed input word with k part of it and possibly exceeding the longest clause; x₀ vs x₁;
lists vs nonempty sets (empty clause, repeated literal, order); ETH as s₃ > 0 and its equivalence with
Definition 6; ETHIsFalse as the decision version of Theorem 2; the two steps outside Lean (encoding, RAM
simulation); the promise. Against my list (2.3) it covers E1–E4, E6–E7, M1–M3, M6–M7. **Not in the list:**

1. **Output and halting contract** (M5): the count is written in exactly n+1 bits LSB-first, every non-output
   stack must be empty and the internal state back at its initial value at halt (MC:118–123). Stated in AM's head
   comment (AM:30–32, 156–157), not among E's differences. A strengthening; harmless.
2. **O(2^{δn}) vs ⌊c·2^{δn}⌋ for every n** (E5): E discusses ranges only for the Main Theorem. The ETH side's
   "for all n with one c" is in AM:97–99 but not argued equivalent in E. Equivalent; harmless.
3. **m is the list length** (M4): E says "the same literals in another order count as another clause" but does not
   say that the Main Theorem's bound is then in terms of that (possibly larger) m, nor that `IsKCNF`'s width
   counts repeated literals. Harmless (bound monotone in m).
4. **n in ETHIsFalse is declared, not occurring** (E7): the Main Theorem requires `AllOccur`, the ETH side does
   not; E mentions `AllOccur` only through the Main Theorem's wording. Harmless (agrees with Def. 6 "on n
   variables").
5. **Uniformity in δ** (E8): AM:98–99 says "The machine and c may depend on k and on δ"; E's list is silent.
   Harmless (Theorem 2 itself says "The algorithm depends on δ", p. 4).

None of the omissions weakens the conclusion. `proof/PaperIndex.lean:188–242` adds the differences *in the proof*
(alternation at a constant power, padding strings as time budgets, Appendix B pieces working "in one step",
Lean's own sparsification analysis in place of [Cal09]) — these concern the route, not the statements, and
cannot weaken the statements because the statements count FinTM2 steps (Solution.lean:29–33).

---

## 3. The two claims side by side

| | OpenAI (family 378) | Anthropic (`eth/`) |
|---|---|---|
| Paper | "The Exponential Time Hypothesis is False", dated 17 Oct, revised 25 Oct 2026 (p. 1) | "A 2^{o(n)} Time Algorithm for 3-SAT", 26 Oct 2026 (p. 1); cites OpenAI's ETH preprint as independent and concurrent (p. 2, ref. [Ope26] p. 25) |
| Paper bound | (n+m)^{O_k(1)}·2^{O_k(n log log n/√log n)}; 2^{O_{k,D}(n/√log n)} if m ≤ Dn; poly space (Thm 1.1, p. 2) | 2^{O(min{k²n log log n/√log n, km/√log m})}, absolute constant, uniform in k (Thm 1, pp. 1–2); sparse case 2^{O(kn/√log n)} (p. 2, fn. 1); no space claim |
| Lean bound | C(L+1)^d·2^{A·n(ln ln(n+16))²/√ln(n+16)} + poly visited space, per k (OC:194–217) | ⌊2^{C·min{km/√lg m, k²n lg lg n/√lg n}}⌋ uniform in k (AM:177–180); and s₃ = 0 (AM:122) |
| Lean vs paper bound | **weaker** (Prop. 6.4's ρ(n), not Thm 1.1) | **same** (stronger in ranges) |
| ETH in Lean | absent | defined (AM:117) and its negation stated (AM:122) |
| Model in Lean | custom multitape TM on Mathlib `Turing.Tape`, one tape per step, alphabet {⊔,0,1} | Mathlib `Turing.FinTM2` multi-stack, finite alphabets |
| Model in paper | "bit operations" (p. 2, p. 7) | word RAM (p. 4) |
| Input in Lean | `Finset` formula, canonical sorted unary word | `Nodup` list formula, fixed-width binary slots, list order is input |
| Counting? | yes (Lean) | Main Theorem counts; ETHIsFalse decides |
| Comparator | 1 theorem, nanoda off | 2 theorems, nanoda on |

**Technique, as each paper describes it.**
- *Shared skeleton.* Both start from (count-preserving / disjoint) sparsification — OpenAI Lemma 6.3 (p. 43) after
  [CIP06], [Cal09], [DHM+14 App. A]; Anthropic Lemma 4 (p. 19) after [IPZ01 Cor. 1], [DHMTW14 Lemma A.1] — write
  the count as a sum over assignments of a product of local factors split into groups, and attack the information
  the groups share.
- *Anthropic* (§2, pp. 4–13): the clauses become nodes of a graph whose edges are equality tests on shared
  variables (eq. (2), p. 5); the recursion works on (K, λ)-cliques with arbitrary node tables (Def. 3, pp. 14–15).
  One level (Prop. 3, p. 18) places g² nodes on a grid; each rectangle's two diagonals form a "crossing"
  [x = v][y = u]; the **eight-square identity** (Degen 1818, Graves 1843; eq. (12) p. 9, eq. (28) p. 16) rewrites
  2[x=v][y=u] as a parity hyperedge times a row choice plus a column choice; grouping by the number of column
  choices gives t+1 functions A_i, each cheaper when rows or when columns are merged (**Lemma 2**, p. 17); merge
  rows or columns, whichever is cheaper, rebalance into K groups (**Lemma 1**, p. 15), recurse. Exponent
  recurrence e′ = (ρ + 2/K)e + 2/K with ρ = 11/12, hence e* = 0 (Prop. 3); ρ = 1/√2 with the pieces of
  Appendix B (Thm B, p. 30). Outside the one-contraction-tree tensor-network model of [AKK22] because it expands
  into a *signed* sum of networks contracted in different orders (pp. 3–4).
- *OpenAI* (§2, pp. 7–20): count = Σ_x Π_e Φ_e(x) (eq. (2.2), p. 8); replace each clause input X_v by a linear form
  ⟨P_{e,v}(T), X⟩ of degree ≤ R in an auxiliary T with P(0) restoring X_v (§2.3, p. 9); at sample points
  t = 1…Q an **(r, τ, D)-design** (Def. 2.1, pp. 9–10) makes groups interact only through few bounded integer
  measurements, so enumerating measurement tuples × group assignments computes H(t) (eq. (2.6), p. 10); H(0) = #F
  is recovered by Hermite interpolation from Taylor coefficients (§2.5, p. 11). The replacement forms come from a
  rational matrix M₀ with small rank(I − M₀), a polynomial in commuting permutation matrices interpolating (−1)^j
  (§1.1.5, p. 6; §2.7, p. 13). General k-CNF: disjoint sparsification plus Tanner/expander-code parity tests reduce to
  counting common zeros of sparse F₂ polynomial systems (**Theorem 2.2**, pp. 20–21). The sharper bound
  (Appendix D, pp. 53–) is a recursive **Boolean tensor contraction** (Thm D.1, p. 53) that "deforms the wire
  identifications so that, at a chosen interpolation node, only ports in the same group interact" with 2-adic
  "modes".
- *Key lemma.* Anthropic: Lemma 2 (p. 17) — a crossing as a sum of ⌈λ/3⌉+1 functions with
  c_row + c_col ≤ 4ρλ + 8, ρ = 11/12 — driving Prop. 3 (p. 18). OpenAI: Proposition 3.4 (p. 25), the counting
  routine examining 2Qr·C_q·(2D+1)^{2τn}·2^{2n/r} Boolean vectors, with the parameter Lemma 4.8 (p. 34:
  r = ⌊√λ/ν²⌋, Q = ⌊λ/(128ν)⌋, R = (β+3)⌈√λ⌉, exponent O(ν²/√λ) per variable, λ = ⌈log₂ n⌉, ν = ⌈log₂ λ⌉) and
  the construction Lemma 4.7 (pp. 33–34).
- *Observation.* The two sharpest bounds coincide in shape: n log log n/√log n for arbitrary formulas and
  n/√log n for bounded density (OpenAI Thm 1.1; Anthropic Thm 1 with m = O(n), and fn. 1 p. 2), and OpenAI's
  route to them (Appendix D) is a recursive tensor-network contraction, as Anthropic's is. The interpolation route
  that OpenAI formalised is the weaker one.
- Independent check of the key identity (own code, not from either repository): with
  σ(p,q) = (−1)^{φ(p,q)}, φ = Σ_{i≤j} p_i q_j + q₁p₂p₃ + p₁q₂p₃ + p₁p₂q₃ (Anthropic p. 9, p. 16), eq. (12)
  holds at all 4,096 settings and eq. (28) at all 448 admissible quadruples.

---

## 4. Prior-art leads

Opened (arXiv abstract or full text) and checked for the stated similarity; "similar" is at the level of the
abstract plus the citing paper's own description.

1. **Austrin, Kaski, Kubjas, "Tensor network complexity of multilinear maps"**, arXiv:1712.09630 — tensor networks
   as a model for evaluating multilinear maps, with a branchwidth-type bound. Anthropic calls it "the closest work
   we know" and argues its algorithm lies outside that model (pp. 3–4). Similar: evaluating a sum of products by
   contraction of a network with chosen order.
2. **Dell, Husfeldt, Marx, Taslaman, Wahlén, "Exponential time complexity of the permanent and the Tutte
   polynomial"**, arXiv:1206.1775 — introduces #ETH and "transfer[s] the sparsification lemma for d-CNF formulas to
   the counting setting". Both papers use this count-preserving sparsification (OpenAI §1.1.6 p. 6; Anthropic
   Lemma 4 p. 19, App. C). Its abstract also states ETH as "satisfiability of n-variable 3-CNF formulas cannot be
   decided in time exp(o(n))".
3. **Curticapean, Xia, "Parameterizing the permanent: genus, apices, minors, evaluation mod 2^k"**,
   arXiv:1511.02321 — "simulate certain non-existing gadgets F as linear combinations of t = O(1) existing gadgets
   … reduce G to t^k graphs". Similar to Anthropic's expansion of each crossing into t+1 cheaper functions,
   giving (t+1)^{|R|} terms (p. 12); Anthropic cites it (p. 4).
4. **Christandl, Vrana, Zuiddam, "Asymptotic tensor rank of graph tensors: beyond matrix multiplication"**,
   arXiv:1609.07476 — tensor rank of graph tensors on the complete graph K_k. Anthropic's recursion object is a
   network on K_K with λ bits per edge (Def. 3, p. 14); cited p. 4.
5. **Brand, Curticapean, Kaski, Li, Orzel, Seppelt, Wang, "Beyond bilinear complexity"**, arXiv:2602.11975 —
   rank vs circuit complexity of d-mode tensors; cited by Anthropic (p. 4) for asymptotic tensor rank.
6. **Albuquerque, Majid, "Quasialgebra structure of the octonions"**, arXiv:math/9802116 — octonions as a twisted
   group algebra of Z₂³ with a 3-cocycle; the source of the sign function σ(p,q) behind Anthropic's eight-square
   identity (p. 16 cites its Props. 3.7, 4.4).
7. **Alman, Williams, "Probabilistic rank and matrix rigidity"**, arXiv:1611.05558 — low-rank modifications of
   Walsh–Hadamard matrices; OpenAI (p. 6) says its §3 interpolates (−1)^j on an interval, as OpenAI's M₀
   construction does.
8. **Björklund, "Below all subsets for some permutational counting problems"**, arXiv:1211.0391 — reduces
   permanent / Hamiltonian-cycle counting "to relatively few smaller instances of themselves", deterministic
   o(2^n); OpenAI cites it as inclusion–exclusion plus interpolation to a weighted sum of smaller instances
   (p. 5).
9. **Bhargava, Ghosh, Kumar, Mohapatra, "Fast, algebraic multivariate multipoint evaluation in small
   characteristic"**, arXiv:2111.07572 — OpenAI (p. 6) uses "the same recovery principle" (Hasse derivatives,
   Hermite interpolation).
10. **Bodlaender, Cygan, Kratsch, Nederlof**, arXiv:1211.1505 — rank-based dynamic programming; Anthropic (p. 4)
    "also exploits low rank".
11. **Markov, Shi, "Simulating quantum computation by contracting tensor networks"**, arXiv:quant-ph/0511069 —
    contraction in exp(O(treewidth)); cited by Anthropic (p. 3) for tensor-network contraction. This is the
    fixed-contraction-order baseline; Anthropic (p. 6) explains why any fixed tree of cuts costs 2^{Ω(n)} on
    sparse expanders.
12. **Robeva, Seigal, "Duality of graphical models and tensor networks"**, arXiv:1710.01437 — the #CSP /
    tensor-network correspondence Anthropic invokes for its sums of products (p. 3).

Unverified (cited by one or both papers, not opened here): Williams, "A new algorithm for optimal 2-constraint
satisfaction", TCS 348 (2005), doi:10.1016/j.tcs.2005.09.023 (split-and-list; both papers); Koivisto, IPL 98
(2006) (sum–product 2-CSP; both); Calabro–Impagliazzo–Paturi, CCC 2006 and Calabro's 2009 thesis (sparsification
parameters; both); Sipser–Spielman 1996 and Tanner 1981 (parity tests; OpenAI); Hrubeš–Wigderson–Yehudayoff,
JAMS 24 (2011) (sum-of-squares/Hurwitz; Anthropic); Galluccio–Loebl 1999 (Anthropic); Scott–Sorkin 2009
(OpenAI).

---

## 5. What this reading did not do

- No proof was checked: no `lake build`, no comparator, no kernel. Our replay of OpenAI's challenge on 10-27 was
  refused for resources (commit `e0411db0`). Whether either theorem is *proved* is outside this reading.
- Of the solution trees (OpenAI: 3,977 files, 35.5 MB; Anthropic: 1,048 proof files, 9.2 MB) only the files named
  above were opened. GitHub code search (index-limited) over `lean/OAI/Algorithms` found 0 hits for `sorry`,
  `native_decide` and `implemented_by`; this is not an audit.
- The bridges in 1.4 and 2.4 rest on model equivalence and input rewriting argued on paper, as both authors
  also leave them outside Lean.
