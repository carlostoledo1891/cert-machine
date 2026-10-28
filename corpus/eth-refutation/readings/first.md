# The two claimed refutations of ETH: first reading

**This is a READING. It is not a verdict.** It decides nothing, certifies nothing, and refutes
nothing. No kernel was run for it, and no proof was checked. It reads two Lean statements
against the papers they come with and against the textbook hypothesis, and it names every
difference it found. One model (Claude Opus 5.5) wrote it on 2026-10-28 as the first of two
independent readers. The second reading (`second.md`) was not opened.

Reference keys, used everywhere below:

| key | source | pin |
|---|---|---|
| OAI-C | `openai/math` `lean/ComparatorChallenges/SubexponentialSAT.lean` | commit `7ef5c0cc5ca4b0e072b7a050fca09ab24bc6fa3a`, sha256 `4183b205…a76685` |
| OAI-J | same, `SubexponentialSAT.json` | sha256 `debbfdc9…7c5b19` |
| OAI-D | same, `lean/docs/378.md` | sha256 `a2f7b390…531f79` |
| OAI-F | same, `lean/OAI/Algorithms/SubexponentialSAT/SqrtLogSpace/Final.lean` (solution side, untrusted) | sha256 `040360a8…84f5` |
| OAI-P | same, `preprints/The-Exponential-Time-Hypothesis-is-False-October-25-2026/paper.pdf` (67 pp.) | sha256 `5b1612dc…8123` |
| ANT-M | `anthropics/formal-math` `eth/MainResults.lean` | commit `16a5ce41304fcdaea4e0be7c132e1c361dc26da5`, sha256 `47f78a95…ed24944` |
| ANT-C / ANT-S / ANT-J | same, `eth/Challenge.lean` / `eth/Solution.lean` / `eth/comparator.json` | `63f54eda…bb39e` / `27d30479…b98f` / `757e5537…ffa7e` |
| ANT-I | same, `eth/proof/PaperIndex.lean` | sha256 `22f1b39f…e85e8` |
| ANT-R | same, `eth/README.md` | sha256 `844e0dd7…494e` |
| ANT-P | same, `eth/paper.pdf` (49 pp.) | sha256 `7af518b0…25a0` |
| ML-O | `leanprover-community/mathlib4` `Mathlib/Computability/…`, OpenAI's pin (Lean v4.34.1) | `d13f23b723b8a846827a245b89c10fc7d3f11612` |
| ML-A | the same files, Anthropic's pin (Lean v4.33.1) | `0df444a360eaa60ab8c11dca51a86af692955474` |

**HEAD check, 2026-10-28.** `openai/math` HEAD = `7ef5c0cc` (2026-10-26T21:18Z) and
`anthropics/formal-math` HEAD = `16a5ce41` (2026-10-27T03:07Z), the two pins. Neither has a newer
commit. OpenAI pins Lean `v4.34.1` with Mathlib `d13f23b7` ("bump toolchain to v4.34.1",
2026-09-24). Anthropic pins Lean `v4.33.1` with Mathlib `0df444a3` ("bump toolchain to v4.33.1",
2026-08-21), the commit ANT-P p. 40 names.

**Proof status (not part of this reading).** Our replay of OAI-C on 2026-10-27 was REFUSED: the
runner killed the job with exit 143 (`certs/openai-math-kernel-7ef5c0cc.json`, row
`SubexponentialSAT`). OAI-J:13 has `"enable_nanoda": false`, and ANT-J:14 has
`"enable_nanoda": true`. Anthropic's proof has not been replayed by us. A text scan found no
`sorry`, `axiom`, `native_decide`, `implemented_by` or `@[extern]` in the 3,977 files of
`lean/OAI/Algorithms/SubexponentialSAT/` or in the 1,047 files of `eth/proof/`. A text scan is not
a kernel check.

---

## Part I: OpenAI, family 378

### I.1 The formal statement, unfolded to Mathlib

OAI-C imports `Mathlib` alone (OAI-C:1). It defines every notion it uses itself, in the
namespaces of the solution, and leaves no definition holes (OAI-J:7, `"definition_names": []`).
Comparator checks that the solution proves "the same statement as provided in Challenge"
([comparator README](https://github.com/leanprover/comparator), "All theorems in Solution …").
A textual spot check found the solution's definitions equal to the challenge's:
`Computation.lean:273–302`, `Encoding.lean:18,51,141,200–207`, `SAT.lean:19–20,45–49,83,241`,
`SqrtLog/StatementScale.lean:18–20`.

**Formulas.** A literal is a record (`variable : V`, `positive : Bool`) (OAI-C:19–22). A
clause is a `Finset` of literals, and a CNF is a `Finset` of clauses (OAI-C:24–25). So clauses
are sets: there are no repeated clauses and no repeated literals, tautologies are allowed, and so
is the empty clause. The variables are `Fin n`, so n counts the *declared* variables, and a
declared variable need not occur. An assignment `a` satisfies a literal when `a v == positive`
(OAI-C:29–30). Clauses are evaluated by ∃ (OAI-C:32–33) and the CNF by ∀ (OAI-C:35–36).
`WidthAtMost k F` means every clause has `card ≤ k` (OAI-C:38). `count F` is the number of
assignments `Fin n → Bool`, among all 2ⁿ, that satisfy F (OAI-C:44–47).

**The canonical encoding.** This is the input word.
- A number c is written in unary as `1^c 0` (`encodeNat`, OAI-C:55).
- `frame` doubles a bit string: `b₁…b_r ↦ 1 b₁ 1 b₂ … 1 b_r 0` (OAI-C:57–58). A list is written
  as `1·frame(enc a₁) 1·frame(enc a₂) … 0` (OAI-C:60–62).
- A literal has code `2·v + [positive]` (OAI-C:64–65). A clause is the sorted list of its codes
  (OAI-C:67–68), and the formula is the sorted list (lexicographic on `List ℕ`) of its clause
  lists (OAI-C:70–71).
- The whole word is `encodeNat n ++ encodeList (encodeList encodeNat) (cnfNumbers F)`
  (OAI-C:73–77).
- `L := formulaBitLength F` is the length of this word (OAI-C:79).

"Canonical" means the word is a function of the `Finset` alone: the sorting removes order, and
the `Finset` removes duplicates. Every number in the word is unary. From OAI-C:55–79,
|clause word| = 1 + Σᵢ(2(cᵢ+1)+2) ≤ 1 + k(4n+2), so

  n + 2 + 4m ≤ L ≤ n + 2 + m·(4 + 2k(4n+2)),  where m = `F.card`.

For width ≤ k there are m ≤ Σ_{i≤k} C(2n,i) ≤ (2n+1)^k distinct clauses. Hence L = O_k(n^{k+1}),
and for k = 3, L = O(n⁴). The solution side proves a conversion of this kind,
`(L+1)^e ≤ (8k+7)^e (n+m+1)^{2e}` (`encoding_pow_le_declaredSize`, used at OAI-F:144–146). That
proof is not comparator-checked.

**The machine (not a Mathlib machine).** OAI-C defines `PrimitiveMachine` itself (OAI-C:92–99).
It has:
- `tapeCount` tapes and `stateCount` states, both natural numbers;
- an `inputTape`, a `start` state, and `scan : state → tape`;
- `transition : Fin stateCount → Option Bool → Bool ⊕ (Fin stateCount × Turing.TM0.Stmt (Option Bool))`.

It borrows two pieces from Mathlib:
- `Turing.Tape (Option Bool)`, a two-way tape: head, plus left and right `ListBlank`s
  (ML-O `TuringMachine/Tape.lean:408–414`). `ListBlank` is the quotient of lists up to trailing
  blanks (Tape.lean:80, 119, 125–126). The blank is `none` (Lean core
  `src/Init/Prelude.lean@v4.34.1:2937–2938`, `Inhabited (Option α)` default `none`). The alphabet
  is therefore {□, 0, 1}.
- `Turing.TM0.Stmt`, which is `move Dir | write Γ` (ML-O `TuringMachine/PostTuringMachine.lean:118–120`).
  `move` and `write` are Tape.lean:436–438 and 542–543.

One step works as follows (OAI-C:107–119). In state q, read the head symbol of tape `scan q`.
Then either halt with a Boolean answer (state `inl answer`), or go to a new state and perform one
move or one write on that tape. The input is placed with `Tape.mk₁ (input.map some)`, head on its
first symbol, and every other tape is blank (OAI-C:121–124; `Tape.mk₁` is Tape.lean:494–495). The
machine is deterministic and has finite control, a fixed finite number of tapes, a 3-letter
alphabet and one local action per step. **It is a standard multitape Turing machine.**

**Time and space.** `Trace step t a b` means that b is reached from a in exactly t applications of
`step` (OAI-C:87–90). The final state is `inl …` (OAI-C:207), and a halted state has no successor
(OAI-C:109), so t is the exact halting time, including the reading of the input. `LocatedCfg`
keeps the lowest and highest head positions seen on each tape (OAI-C:149–186). `visitedSpace` is
the sum, over the tapes, of (upper − lower + 1) (OAI-C:188–189).

**Bound.** `runtimeScale n = n·(ln ln(n+16))²/√ln(n+16)`, with the natural log `Real.log`
(OAI-C:132–134). `runtimeBound C A d L n = C·(L+1)^d·2^{A·runtimeScale n}` (OAI-C:136–139).

**The theorem** `exact_count_and_sat` (OAI-C:194–217), in plain mathematics. For every k ≥ 2
there exist a `PrimitiveMachine` M, two of its tapes c and a, reals C, A, S > 0 and naturals
d, e > 0 such that, for every n and every set F of clauses over x₀…x_{n−1} with at most k literals
per clause, the run of M on `encodeCNF F` has the following properties:
1. It halts after exactly T steps, in state `inl [#F > 0]` (OAI-C:200–202, 207).
2. Tape c holds `Nat.bits (#F)` (lowest bit first, and `[0]` for zero), with nothing else on it
   (OAI-C:147, 203–204). Tape a holds the single bit `[#F > 0]` (OAI-C:205–206).
3. The code decodes to #F and has length ≤ n+1 (OAI-C:208–209).
4. T ≤ C(L+1)^d·2^{A·n(ln ln(n+16))²/√ln(n+16)} (OAI-C:210–211).
5. At every step up to T, the visited cells number at most S(L+1)^e (OAI-C:212–217).

**Quantifier order:** ∀k≥2 ∃M ∃tapes ∃C,A,S,d,e ∀n ∀F. The machine and every constant depend on
k only. The statement is uniform in n and F, and not uniform in k. Nothing is said about input
words that are not of the form `encodeCNF F` (a promise problem).

**"ETH" in the file.** It does not appear: OAI-C defines no ETH, no s₃ and no reduction. The step
from this theorem to "ETH is false" is made only in prose (OAI-P p. 1 abstract; p. 7 §2: "Taking
k = 3 already refutes ETH").

### I.2 The paper's main theorem, verbatim

OAI-P p. 2:
> **Theorem 1.1.** For each fixed k ⩾ 2, there exists a deterministic algorithm that, given a k-CNF
> F on n ⩾ 20 declared variables with m clauses, computes #F as defined in (1.1) in
> (n + m)^{O_k(1)} 2^{O_k(n log log n/√log n)} bit operations and (n + m)^{O_k(1)} bits of space.
> For each fixed D > 0, its running time on inputs with m ⩽ Dn is (n + m)^{O_{k,D}(1)} 2^{O_{k,D}(n/√log n)}.
>
> The rational interpolation argument in Section 6.4 gives the weaker exponent O_k(ρ(n)), where
> ρ(n) = n(log log n)²/√log n = n/(log n)^{1/2+o(1)}. Appendix D proves both bounds in Theorem 1.1
> by tensor contraction.

OAI-P p. 43:
> **Proposition 6.4.** For each fixed k ⩾ 2, the interpolation algorithm counts the satisfying
> assignments of a k-CNF on n ⩾ 20 declared variables with m clauses in (n + m)^{O_k(1)} 2^{O_k(ρ(n))}
> bit operations and (n + m)^{O_k(1)} bits of space.

OAI-P p. 1, the abstract: "… runs in time (n + m)^{O_k(1)} 2^{n/(log n)^{1/2+o(1)}}. Our algorithm
refutes the Exponential Time Hypothesis (ETH), which postulates that deciding 3-SAT on n variables
requires 2^{Ω(n)} time in the worst case."

The input form (p. 1): F is a conjunction over e = 1..m of clauses with exactly k literal slots,
and "Repeating a literal permits clauses with fewer than k literals". Logarithms (p. 1, p. 7):
"Throughout, log denotes the natural logarithm." The model (p. 7): "Space is measured in bits.
Arithmetic-operation counts are distinguished from bit-operation counts." No machine model is
named.

### I.3 Differences between I.1 and I.2

| # | Paper (OAI-P) | Lean (OAI-C) | Class | Matters for "ETH false"? |
|---|---|---|---|---|
| 1 | Thm 1.1 exponent n log log n/√log n (p. 2) | n(ln ln(n+16))²/√ln(n+16) (OAI-C:132–134): Prop 6.4's ρ(n) (p. 43) | **weaker bound** (by a factor Θ(log log n) in the exponent) | no: still o(n) |
| 2 | m ≤ Dn ⇒ 2^{O_{k,D}(n/√log n)} (p. 2; proof p. 54 §D.2) | absent | **missing clause** | no |
| 3 | polynomial factor (n+m)^{O_k(1)} | (L+1)^d, where L is the unary-coded length | different parameter | no: n+m < L ≤ O_k((n+1)(m+1)) (§I.1) |
| 4 | "bit operations", no machine named (p. 2, p. 7) | steps of the `PrimitiveMachine` defined in the file (OAI-C:92–124) | **different model** (more concrete; a TM-step bound gives a bit-operation bound) | no (see §I.4) |
| 5 | F a list of m clauses, each with k slots; duplicates possible (p. 1); normalized away in the proof of Prop 6.4 (p. 43) | `Finset (Finset Literal)`, canonical sorted unary word (OAI-C:19–25, 55–79); m = `F.card` | **different encoding** + the input is promised canonical | no: poly-time canonicalization |
| 6 | n ≥ 20 (p. 2) | every n (`+16` inside the logs) | stronger (Lean) | no |
| 7 | "computes #F" | #F in binary on one tape, the decision bit on another, and the halting state = decision (OAI-C:203–209) | stronger (Lean) | no |
| 8 | (n+m)^{O_k(1)} bits of space | visited cells ≤ S(L+1)^e at every prefix (OAI-C:212–217) | equivalent up to polynomials | no |
| 9 | ∀k ∃algorithm | ∀k ∃M ∃constants ∀n ∀F (OAI-C:194–199) | same order | — |
| 10 | Thm 1.1 proved by tensor contraction (App. D, p. 53 ff.) | the interpolation route of §6.4, compiled to a 1,220-tape machine (OAI-F:11, 100) | different proof route | no |
| 11 | Cor. 1.2–1.4 (p. 2–3) | absent | missing | no |
| 12 | "refutes ETH" (p. 1) | no ETH in Lean | **missing clause** (the bridge is informal) | yes: the bridge is §I.4 |

### I.4 Does OAI-C imply that the textbook ETH is false?

Textbook form: "Define s_k (for k ≥ 3) to be the infimum of {δ : there exists an O(2^{δn})
algorithm for solving k-SAT}. Define ETH … as follows: for k ≥ 3, s_k > 0." (Impagliazzo–Paturi,
CCC 1999, p. 1, [PDF](https://cseweb.ucsd.edu/~paturi/myPapers/pubs/ImpagliazzoPaturi_1999_ccc.pdf);
the JCSS 2001 version, [doi:10.1006/jcss.2000.1727](https://doi.org/10.1006/jcss.2000.1727), was not
opened: HTTP 403.) The source names no model and does not say deterministic or randomized.

The argument, step by step, assuming OAI-C is proved:
1. Take k = 3. This gives one machine M₃ and constants C, A, d (OAI-C:194–199).
2. For a set F of 3-clauses on n variables, L = O(n⁴) (§I.1). So (L+1)^d ≤ 2^{O(d log n)}, and
   T ≤ 2^{O(log n) + A·n(ln ln(n+16))²/√ln(n+16)} = 2^{o(n)}.
3. **Bridge B1 (model).** A `PrimitiveMachine` step reads one head and performs one write or one
   move on one tape. An ordinary p-tape Turing machine, or a RAM holding the tapes as arrays, does
   the same in O(1) per step. A one-tape TM does it in O(T²) (standard fact; not opened here). T²
   is still 2^{o(n)}. *Not in Lean.*
4. **Bridge B2 (encoding).** A standard 3-CNF instance (n, then clauses with binary indices, of
   length N) is turned into `encodeCNF F` in poly(N) time: drop repeated literals and clauses,
   sort, write in unary. For a set of 3-clauses, N = poly(n). *Not in Lean.*
5. Hence, for every δ > 0, 3-SAT is solved deterministically in O(2^{δn}) for all large n. Small n
   are finitely many instances and go into the constant. So s₃ = 0, and ETH is false.
6. Sparsification is not needed in the bridge: the bound is in n (and L), not in m. Uniformity
   holds: one machine for k = 3, and in fact one machine for all δ.

**Loophole checks (none found).**
- *Padding*: the factor (L+1)^d with d existential would trivialize the bound if L could be
  exponential in n. It cannot, because clauses form a `Finset` and width ≤ k gives L = O_k(n^{k+1})
  (OAI-C:24–25, 38, 55–79).
- *The model is defined in the challenge, not in Mathlib* (OAI-C:92–124). It was read line by
  line: it is finite, deterministic and local, with a 3-letter alphabet.
- *Promise*: only canonical words are covered (OAI-C:199–202). That is harmless for an upper
  bound.
- *Exact halting time*: yes (OAI-C:87–90, 109, 207).
- *Unary n*: the input length is ≥ n+1, polynomial, so it gives no advantage.
- *The `+16` shift*: harmless, since ln(n+16) ≥ 2 (`two_le_log_shift`, `SqrtLog/StatementScale.lean:22`).

**Answer:** yes. The Lean statement, if proved, implies ¬ETH under B1 and B2 alone, both
textbook. Confidence ≈ 0.95. The 5% is that this is a reading by eye. B1 and B2 are not
machine-checked, and the proof itself has not been replayed by us (REFUSED, resources).

### I.5 Question 6: check of OAI-D (the scope note)

- OAI-D:9 says that Lean proves time (L+1)^{O_k(1)} 2^{O_k(n(log log n)²/√log n)} and that at
  every step at most (L+1)^{O_k(1)} cells have been visited. **Confirmed** against OAI-C:132–139
  and 210–217. The `+16` shift is not mentioned in the note and changes nothing asymptotically.
- OAI-D:11 says the manuscript gives the sharper (n+m)^{O_k(1)} 2^{O_k(n log log n/√log n)}.
  **Confirmed** (OAI-P p. 2). The Lean exponent is larger by the factor ln ln(n+16), which goes to
  ∞, so Lean is weaker, as the note says. It is the paper's own "weaker exponent O_k(ρ(n))" (p. 2,
  Prop. 6.4 p. 43).
- **The m ≤ Dn refinement is in the paper only.** It is proved in App. D.2 (p. 54) through
  Theorem D.1 (p. 53), Boolean tensor contraction. It has no counterpart in Lean:
  - OAI-C has no density hypothesis.
  - OAI-D:11 attributes the refinement to "the October 25 manuscript".
  - OAI-F's five theorems (OAI-F:10, 74, 104, 149, 184) carry no clause-density hypothesis.
  - Of the 3,977 Lean files, none matches `density`, `Theorem D.` or `Appendix D`. The `tensor`
    matches are tensor-product Lagrange interpolation (e.g. `GlobalPolynomial.lean:358`,
    `SubexpTableInterpolation.lean:246`), not App. D's network contraction.
- Also off the comparator: OAI-F:104–128 (`exact_count_eth`, the (n+m+1)^d·2^{A·rho n} form for
  n ≥ 20, with `rho` at `SqrtLogSpace/Asymptotics.lean:10–11` in log₂) is not among the checked
  `theorem_names` (OAI-J:4–6). Its definitions are not in the challenge.

---

## Part II: Anthropic, `eth/`

### II.1 The formal statements, unfolded to Mathlib

ANT-M imports `Mathlib` alone (ANT-M:6). ANT-C imports ANT-M alone (ANT-C:6) and states the two
theorems with `sorry` (ANT-C:12–17). ANT-S proves them (ANT-S:40, 44), and comparator compares
them (ANT-J).

**Formulas.**
- A literal is `Fin n × Bool` (ANT-M:59). A CNF is `List (List (Lit n))` (ANT-M:62).
- `IsKCNF k φ` means every clause has `length ≤ k` and `φ.Nodup` (ANT-M:69). So clauses are lists:
  they may be empty, may repeat a literal, and the same literals in another order make another
  clause. No clause *list* is repeated, so m ≤ (2n+1)^k (ANT-M:64–68).
- `Satisfiable φ`: ∃a, ∀C∈φ, ∃l∈C, a l.1 = l.2 (ANT-M:80).
- `numSat` counts over all 2ⁿ assignments (ANT-M:130–131).
- `AllOccur`: every xᵢ occurs (ANT-M:127).

**Encodings.**
- `slot`: 0 for an empty position, 2i+1 for ¬xᵢ, 2i+2 for xᵢ (ANT-M:73–75).
- `encClauses k φ = 1ⁿ0` followed, for each clause, by k slots of ⌊log₂ 2n⌋+1 bits each, lowest
  bit first (ANT-M:85–87). Its length is n+1 + m·k·(⌊log₂ 2n⌋+1): polynomial in n for fixed k.
- `encInput k φ = 1ᵏ0 · encClauses k φ` (ANT-M:138–139).
- `binary n c` = the lowest n+1 bits of c, lowest first (ANT-M:135).

**The machine: Mathlib's `Turing.FinTM2`.** At ML-A `TuringMachine/Computable.lean:46–70` it has:
- a finite type K of stacks, with input stack k₀ and output stack k₁;
- an alphabet `Γ k` for each stack, of which Mathlib requires only `Γ k₀` to be finite (line 68);
- finite labels Λ and finite internal states σ (lines 60, 66);
- a program `m : Λ → TM2.Stmt`.

`Stmt` is `push | peek | pop | load | branch | goto | halt` (ML-A `StackTuringMachine.lean:127–134`).
One `step` runs the current label's statement to its `goto` or `halt` (lines 161–173). That is a
bounded number of stack operations for a fixed machine (Computable.lean:27–31).
`TM2ComputableAux Bool Bool` adds bijections from the input and output alphabets to Bool
(Computable.lean:147–153). ANT-M additionally requires `∀ i, Finite (M.tm.Γ i)` (ANT-M:101, 178).
The result is a finite deterministic multi-stack machine. With ≥ 2 stacks it simulates a tape at
constant cost, and the converse also holds.

**Time.** `TM2OutputsInTime tm l l' t` is `EvalsToInTime tm.step (initList tm l)
(Option.map (haltList tm) l') t` (Computable.lean:135–137). That is, there exists s ≤ t with
`(flip bind step)^[s] (some init) = some halt` (ML-A `StateTransition.lean:255–267`).
- `initList`: the input on stack k₀, the other stacks empty, internal state = `initialState`
  (Computable.lean:110–115).
- `haltList`: label `none`, internal state back to `initialState`, the output on k₁, every other
  stack empty (Computable.lean:118–123).

A halted configuration steps to `none` (StackTuringMachine.lean:172), so s is the exact halting
time, and the reading of the input is counted.

**ETH.**
- `DecidesKSat k M t`: ∀n ∀φ, `IsKCNF k φ` → ∃b, (b ↔ Satisfiable φ) ∧ M on `encClauses k φ`
  outputs `[b]` within `t n` steps (ANT-M:92–95).
- `InTime k δ`: ∃M ∃c∈ℕ, all alphabets finite ∧ `DecidesKSat k M (n ↦ ⌊c·2^{δn}⌋)`
  (ANT-M:100–102). The machine and c may depend on k and δ.
- `s k := ⨅_{δ:ℝ≥0, InTime k δ} δ` in [0, ∞] (ANT-M:107).
- `ETH := 0 < s 3` (ANT-M:117), and `ETHIsFalse := ¬ETH` (ANT-M:122).

In plain mathematics: **for every δ > 0 there are a finite multi-stack TM and a c ∈ ℕ that
decide every duplicate-free 3-CNF list on x₀…x_{n−1}, for every n and with any number of
clauses, within ⌊c·2^{δn}⌋ steps.** (`InTime` is monotone in δ, so s₃ = 0 is equivalent to
∀δ>0 `InTime 3 δ`.)

**Main Theorem.**
- `lg = Real.logb 2` (ANT-M:144).
- expM = k·m/√lg m (ANT-M:147). expN = k²·n·lg lg n/√lg n (ANT-M:150).
- timeMin = ⌊2^{C·min(expM, expN)}⌋ (ANT-M:153–154).
- `CountsWithin M k φ t`: M on `encInput k φ` outputs `binary n (numSat φ)` within t steps
  (ANT-M:158–160).

`MainTheorem` (ANT-M:177–180) reads: ∃M ∃C∈ℕ, all alphabets finite ∧ ∀k ∀n ∀φ, k ≥ 1 →
`IsKCNF k φ` → m ≥ 2 → n ≥ 4 → `AllOccur φ` → `CountsWithin M k φ (timeMin C k m n)`. **One
machine and one absolute C, chosen before k.** n = the declared variables = the occurring ones. m
= `φ.length`. L (the input length) does not appear, and no polynomial factor is added. Nothing is
said outside these hypotheses (ANT-M:174–176).

### II.2 The paper's theorems, verbatim

ANT-P pp. 1–2:
> **Theorem 1** (Main Theorem). There is a deterministic algorithm that, given a k-CNF with m
> clauses in which n variables occur, computes the number of satisfying assignments of these n
> variables in time 2^{O(min{k²n log log n/√log n, km/√log m})}, where the O(·) hides an absolute
> constant.

ANT-P p. 4:
> **Theorem 2** (Simplified version of Theorem 1). For every δ > 0 there is a deterministic
> algorithm that computes the number of satisfying assignments of a 3-CNF on n variables, with
> any number of clauses, in time O(2^{δn}).

ANT-P p. 4, Notation: "log = log₂, and time is measured in the word RAM model. A conjunctive
normal form (CNF) formula is a *set* of clauses …"

ANT-P p. 20, Definition 6: "Let s_k be the infimum of all δ ≥ 0 such that some deterministic
algorithm decides k-SAT on n variables in time O(2^{δn}) … ETH is the statement that s_k > 0 for
all k ≥ 3." p. 20, Corollary 5: "s_k = 0 for every k ≥ 3. Hence s∞ = 0, and both ETH and SETH are
false."

ANT-P p. 34, Corollary 11: "There are an absolute constant C and a deterministic algorithm that,
given a k-CNF, for any k ≥ 1, with m ≥ 2 clauses in which n ≥ 4 variables occur, computes the
number of its satisfying assignments … in time at most min{2^{C·km/√log m}, 2^{C k² n log log n/√log n}}."

ANT-P p. 2, footnote 1: on sparse input "the runtime is 2^{O(kn/√log n)}".

### II.3 Differences between II.1 and II.2

| # | Paper | Lean | Class | Matters for "ETH false"? |
|---|---|---|---|---|
| 1 | word RAM (p. 4) | FinTM2 steps, one step = one block (ANT-M:23–34) | **different model** | no (§II.4) |
| 2 | a set of nonempty sets of literals (p. 4, p. 19) | a duplicate-free list of lists; empty clauses and repeated literals allowed; order counts (ANT-M:61–69) | different encoding, wider input class | no |
| 3 | x₁…xₙ | x₀…x_{n−1} (ANT-M:58–59) | renaming | no |
| 4 | no input word | `encClauses` / `encInput`; k in unary in the Main Theorem (ANT-M:85–87, 138–139) | **different encoding** | no |
| 5 | Thm 1: no ranges | k ≥ 1, m ≥ 2, n ≥ 4 (ANT-M:179) | **extra hypothesis** (Thm 1 is undefined at m = 1, ANT-M:170–172) | no: `ETHIsFalse` has no range |
| 6 | O(·), absolute | one C ∈ ℕ for every such k, m, n (ANT-M:178) | stronger (non-asymptotic) | no |
| 7 | real-valued bounds | floor (ANT-M:102, 154) | equivalent | no |
| 8 | Thm 2 **counts** | `ETHIsFalse` **decides** (ANT-M:92–95) | weaker (decision) | no: ETH is about deciding |
| 9 | O(2^{δn}), "large n" | ⌊c·2^{δn}⌋ for **every** n, c ∈ ℕ (ANT-M:100–102) | equivalent: finitely many small instances | no |
| 10 | Def 6 ETH: ∀k≥3 s_k>0 (p. 20) | s₃ > 0 (ANT-M:117) | equivalent (s_k nondecreasing, p. 20) | no |
| 11 | IP: deterministic or randomized unstated (p. 20) | deterministic machines only | a stronger refutation | no |
| 12 | "computes the number" | `binary n (numSat φ)` (ANT-M:135, 160); halting with internal state reset and other stacks empty (Computable.lean:118–123) | stronger output convention | no |
| 13 | "universal 2^{o(n)} algorithm" for 3-SAT (p. 2) | in the trusted file only as `MainTheorem` under `AllOccur`, n ≥ 4, m ≥ 2; the general form exists only in the untrusted development (ANT-S:23–28) | **missing clause** (in the trusted file) | no |
| 14 | Thm 2 proof: §6, Calabro's sparsification thresholds | Lean's own sparsification analysis, "not checked against the dissertation" (ANT-P p. 44; ANT-I:205–243) | different proof route | no |

### II.4 Does ANT-M's `ETHIsFalse` imply that the textbook ETH is false?

`ETHIsFalse` is literally "s₃ = 0" (ANT-M:107, 117, 122), with s₃ taken over deterministic FinTM2
machines on `encClauses 3`. The argument:
1. Fix δ > 0. `InTime 3 δ` gives M_δ and c (ANT-M:100–102).
2. **B1′ (model).** A word RAM, or a multitape TM, simulates M_δ at O(1) per step: stacks become
   arrays, and one step is a bounded number of stack operations (Computable.lean:27–31;
   ANT-M:36–37). *Not in Lean.*
3. **B2′ (encoding).** A textbook 3-CNF on x₁…xₙ, which is a set, has length poly(n). Writing it
   as `encClauses 3` (renaming x_{i+1} → xᵢ) takes poly(n) time (ANT-M:36–43). *Not in Lean.*
4. The total time poly(n) + O(c·2^{δn}) is O(2^{δ′n}) for any δ′ > δ. So the textbook s₃ ≤
   Lean's s₃ = 0, which is the textbook s₃ = 0. Since Lean's machines are deterministic, both the
   deterministic and the randomized readings are refuted (ANT-P p. 20; ANT-M:114–116).
5. Sparsification is not needed in the bridge: the bound is in n, and any number of clauses is
   allowed (ANT-M:90–91). Uniformity: the machine may depend on δ (ANT-M:99), exactly as s₃ = 0
   demands. The universal machine is `MainTheorem`.

**Loophole checks (none found).**
- *Padding*: the input length is n+1 + 3m(⌊log₂ 2n⌋+1) with m ≤ (2n+1)³ (ANT-M:66–67, 85–87):
  polynomial, so the input cannot pay for the time.
- *Hidden power in the model*: σ, Λ and K are finite by FinTM2 (Computable.lean:50, 60, 66), and
  every Γ is finite by ANT-M:101. A step is a finite `Stmt` term.
- *Vacuity*: the encoding carries the formula only. Nothing in it reveals satisfiability.
- *`IsKCNF` `Nodup`* (ANT-M:69): it excludes repeated clauses, which a textbook instance (a set)
  does not have anyway.
- *`AllOccur` / n ≥ 4 / m ≥ 2* (ANT-M:179) restrict only `MainTheorem`, not `ETHIsFalse`.

**Answer:** yes. Confidence ≈ 0.95, on B1′ and B2′, which ANT-M:36–48 states and Lean does not
prove. In one respect this bridge is shorter than OpenAI's: the passage from the counting theorem
to ¬ETH is itself done in Lean (ANT-S:40), so only the model and the encoding stay informal. The
proof has not been replayed by us.

### II.5 Is Appendix E's list of differences complete?

The listing printed on ANT-P pp. 40–43 equals ANT-M token for token. (A diff of the `pdftotext`
output against the file gave only page headers and the spacing in "k²·n".) The "Differences from
the printed statements" paragraph (pp. 43–44) covers rows 1–7 and 10 of §II.3, row 8 ("the
decision version of Theorem 2"), the two informal steps (B1′, B2′) and the promise. **It misses,
or leaves only to the code comments:**
1. Row 9: for `ETHIsFalse`, the bound must hold for *every* n with c ∈ ℕ, against the textbook O(·).
   The paragraph says this only of the Main Theorem's O(·). Equivalent, harmless.
2. Row 11: deterministic only. It is in the listing comment (ANT-M:114–116) and on p. 20, not in
   the differences paragraph. Harmless (a stronger refutation).
3. Row 12: the output convention (n+1 bits, lowest first) and Mathlib's halting convention
   (internal state reset, every other stack empty). It is in the comments (ANT-M:30–32, 133–135),
   not in the list. Stronger, harmless.
4. Row 13: the paper's "universal 2^{o(n)} algorithm" for all 3-CNFs (p. 2) is not one of the two
   trusted propositions. Only `MainTheorem` is, with `AllOccur`, n ≥ 4 and m ≥ 2. Harmless for ETH.
5. Theorem 2 as printed (counting) has no trusted Lean statement. The index says so (ANT-I:333–338:
   "No Lean statement states the printed, counting sentence on its own"); Appendix E says only
   "the decision version".

None of these matters for "ETH is false". The list is complete as to what weakens the claim.

---

## Part III: Side by side

| | OpenAI (OAI-C / OAI-P) | Anthropic (ANT-M / ANT-P) |
|---|---|---|
| Lean bound | C(L+1)^d·2^{A·n(ln ln(n+16))²/√ln(n+16)}, constants per k | ⌊2^{C·min(km/√lg m, k²n lg lg n/√lg n)}⌋, one absolute C |
| Paper bound | (n+m)^{O_k(1)}·2^{O_k(n log log n/√log n)}; m ≤ Dn: 2^{O_{k,D}(n/√log n)} (p. 2) | 2^{O(min{k²n log log n/√log n, km/√log m})} (pp. 1–2) |
| Lean = paper's headline? | no: Lean is Prop. 6.4 (p. 43), weaker by log log n | yes, up to the ranges, model and encoding |
| Model in Lean | its own `PrimitiveMachine` on Mathlib `Tape`/`TM0.Stmt` (OAI-C:92–124) | Mathlib `FinTM2` + `TM2OutputsInTime` (ANT-M:101, 159) |
| Encoding | unary everything, canonical sorted `Finset`s (OAI-C:55–79) | unary n (and k); clauses in fixed-width binary slots (ANT-M:85–87) |
| Uniform in k | no (∀k ∃M) | yes (∃M ∀k) |
| Space | proved polynomial (OAI-C:212–217) | not stated |
| ETH in Lean | absent | `ETH`, `ETHIsFalse`, proved from the Main Theorem's proof (ANT-S:40) |
| Comparator 2nd kernel | off (OAI-J:13) | on (ANT-J:14) |

**Technique, as each paper describes it.**
- **OpenAI** (§2, pp. 7–21). The method is algebraic interpolation.
  - Clause polynomials get *replacement linear forms* that depend on a parameter T. At T = 0 they
    restore the variables. At T = 1…Q, an (r, τ, D)-*design* lets fixed integer *measurements*
    separate the variables into small groups (Def. 2.1, p. 9).
  - #F = H(0) is recovered from Taylor coefficients at those points, by inclusion–exclusion over
    sets of size ≤ q and Hermite interpolation (§2.5, pp. 11–12).
  - The forms come from M₀ = V₀ f(W₀), a low-degree polynomial in commuting swap permutations
    (§2.7, pp. 13–15; Lemmas 4.1–4.3, pp. 28–29).
  - General k-CNF goes through counting-preserving sparsification, then either Tovey's
    3-occurrence copying (2^{o(n)}, §2.8 p. 18), or F₂ parity tests from Tanner/expander codes
    with Beigel–Tarui-type polynomials modulo 2^ℓ (§2.9, Thm 2.2 pp. 20–21; Lemma 5.1 p. 36),
    which gives ρ(n).
  - The sharp bound (App. D) contracts Boolean tensor networks recursively (Thm D.1, p. 53).
- **Anthropic** (§2, pp. 4–13). The method is a tensor network on a complete graph.
  - #CSP is the contraction Z of equality tests between clause clusters (eq. (2), p. 5).
  - Instances are (K, λ)-cliques (Def. 3, p. 14). Nodes go on a g×g grid. The two diagonals of
    each rectangle are rewritten by the **eight-square identity** (12) (p. 9) into a row term and a
    column term. Rows or columns are merged, and the total number of edge bits falls by ρ = 11/12
    per level (Lemma 2(c), p. 17).
  - Balancing: groupings are found by brute force, after existence by a probabilistic argument
    (Lemma 1, p. 15).
  - The recursion's exponents eₗ → 0 (Prop. 3, p. 18). The pieces with ρ = 1/√2 (Thm B, p. 30) and
    App. D (p. 34) give the sharp bounds.

**The key lemma.**
- OpenAI: the replacement-form/design construction (Lemmas 4.1–4.3), and Theorem 2.2 (counting
  common zeros of sparse low-degree F₂ systems in 2^{O(n(log log n)²/√log n)}).
- Anthropic: Lemma 2 (A₀+…+A_t = 2^t[x=v][y=u], c_row + c_col ≤ 4ρλ+8), built on identity (12).

An independent exhaustive check, written from the printed formula, found that (12) holds at all
4,096 settings with φ as printed. The control with k < k′ fails at 256 of them, so the check is
not vacuous (Appendix A below).

**Convergence.** Both papers do the following:
- use the counting-preserving sparsification of Dell et al. (OAI-P p. 6, p. 18; ANT-P p. 19, Lemma 4);
- reach exponent n log log n/√log n for general k-CNF, and n/√log n for linearly many clauses;
- obtain their sharp bound by a recursion on Boolean tensor-network contraction (OAI-P App. D,
  p. 53; ANT-P §2).

ANT-P p. 2 cites the OpenAI result as concurrent ("[Ope26]"). OAI-P is dated "17 October 2026,
revised 25 October 2026" (p. 1). ANT-P gives October 16 as the date the core algorithm was found
(p. 2). **The two Lean developments follow different routes:** OpenAI's formalizes the
interpolation route, not its tensor appendix, while Anthropic's formalizes the tensor/eight-square
route.

---

## Part IV: Prior-art leads

**Verified by opening the source:**
1. Austrin, Kaski, Kubjas, *Tensor network complexity of multilinear maps*,
   [arXiv:1712.09630](https://arxiv.org/abs/1712.09630).
   - What it does: tensor networks as a model of arithmetic computation. An execution is a
     sequence of contractions with a cost, with upper bounds via branchwidth and an
     Ω(2^{0.918n}) lower bound for the permanent in that model (abstract; pp. 1–5 of the PDF).
   - Similar: Anthropic's object Z (eq. (2)) is such a contraction. ANT-P pp. 3–4 places its
     algorithm *outside* this model, because it contracts a signed sum of networks in different
     orders. OpenAI's App. D (p. 53) also contracts Boolean tensor networks.
2. Dell, Husfeldt, Marx, Taslaman, Wahlén, *Exponential Time Complexity of the Permanent and the
   Tutte Polynomial*, [arXiv:1206.1775](https://arxiv.org/abs/1206.1775) (TALG 10(4), 2014).
   - Appendix A, Lemma A.1 with condition (1′): "every satisfying assignment of β satisfies exactly
     one γᵢ", hence #Sat adds (arXiv PDF p. 33).
   - Similar: both papers use exactly this (OAI-P p. 6, §1.1.6; ANT-P p. 19, Lemma 4).
3. Alman, Williams, *Probabilistic Rank and Matrix Rigidity*,
   [arXiv:1611.05558](https://arxiv.org/abs/1611.05558).
   - Lemma 3.1/3.2 (PDF p. 6): an integer polynomial of low degree equal to (−1)^{|z|} on an
     interval of Hamming weights, used to show Walsh–Hadamard is not rigid.
   - Similar: OAI-P p. 6 (§1.1.5) says its M₀ "also interpolates (−1)^j on a short interval, now
     to obtain a polynomial in commuting permutation matrices".
4. Björklund, Kaski, Williams, *Generalized Kakeya Sets for Polynomial Evaluation and Faster
   Computation of Fermionants*, IPEC 2017,
   [doi:10.4230/LIPIcs.IPEC.2017.6](https://doi.org/10.4230/LIPIcs.IPEC.2017.6) (abstract opened).
   - What it does: it recovers polynomial values from tabulated values on Kakeya-type curves and
     gives permanents of bounded integer matrices in 2^{m−Ω(√(m/log log m))}.
   - Similar: OAI-P pp. 5–6, "Our polynomial replacements serve a similar purpose".
5. Williams, *A new algorithm for optimal constraint satisfaction and its implications*, ECCC
   [TR04-032](https://eccc.weizmann.ac.il/report/2004/032) (abstract opened; the journal version,
   TCS 348 (2005), [doi:10.1016/j.tcs.2005.09.023](https://doi.org/10.1016/j.tcs.2005.09.023), was
   not opened).
   - What it does: it counts optima of 2-CSPs in O(m³2^{ωn/3}).
   - Cited by both: OAI-P p. 5 (split-and-list); ANT-P p. 3 ("Passing from a formula to such a sum
     on a small dense graph follows Williams's algorithm for 2-CSP"). The split-and-list mechanics
     were not verified from the source.
6. Baez, *The Octonions*, [arXiv:math/0105155](https://arxiv.org/abs/math/0105155), §1.
   - Content: Graves's "eight squares theorem" (December 1843) and its earlier discovery "by
     C. F. Degen in 1818".
   - Similar: this is the identity behind ANT-P eq. (12) (p. 9 cites [Bae02, Section 1]).
7. Impagliazzo, Paturi, *Complexity of k-SAT*, CCC 1999, p. 1
   ([PDF](https://cseweb.ucsd.edu/~paturi/myPapers/pubs/ImpagliazzoPaturi_1999_ccc.pdf)). This is
   the textbook s_k and ETH used in §I.4 and §II.4. It names no model and no determinism.

**Unverified (cited by the papers or recalled; not opened):**
- IPZ01 sparsification (JCSS 63, [doi:10.1006/jcss.2001.1774](https://doi.org/10.1006/jcss.2001.1774));
- IP01 (JCSS 62; 403 to our fetch);
- Beigel–Tarui, "On ACC" (OAI-P Lemma 5.1);
- Sipser–Spielman expander codes and Tanner codes (OAI-P Lemma 6.1);
- Calabro's dissertation and CIP06 (sparsification constants; Anthropic says its Lean uses its own
  thresholds, p. 44);
- Tovey 1984 (3-occurrence reduction, OAI-P p. 18);
- Koivisto 2006 (sum–product 2-CSP);
- Bhargava–Ghosh–Kumar–Mohapatra (Hasse-derivative evaluation, OAI-P p. 6);
- Curticapean–Xia 2015 and Galluccio–Loebl (gadget expansion, ANT-P p. 4);
- partition/slice rank (ANT-P p. 4);
- Williams 2013/2014 (ETH-false ⇒ E^NP lacks linear-size circuits; both papers claim it);
- holographic algorithms / matchgates (our own association with signed gadget rewriting; not
  checked at all).

---

## Appendix A: the check of identity (12) (ANT-P p. 9)

Our own code, written from the printed statement. No claimant code was used. It was run with
`python3 -I`.

```python
from itertools import product
def bits(i): return (i&1, i>>1&1, i>>2&1)
def make_sigma(rel):
    def phi(p,q):
        s = sum(p[a]*q[b] for a in range(3) for b in range(3) if rel(a,b))
        return s + q[0]*p[1]*p[2] + p[0]*q[1]*p[2] + p[0]*p[1]*q[2]
    return lambda p,q: -1 if phi(p,q)%2 else 1
def check(sig):
    bad = 0
    for x,y,u,v in product(range(8), repeat=4):
        lhs = 2*(x==v)*(y==u); par = 1 if x^y^u^v==0 else 0
        X,Y,U,V = map(bits,(x,y,u,v))
        bad += lhs != par*(sig(X,Y)*sig(V,U) + sig(X,U)*sig(V,Y))
    return bad
check(make_sigma(lambda a,b: a<=b))   # printed phi: 0 of 4096
check(make_sigma(lambda a,b: a<b))    # control:   256 of 4096
```

## What this reading did not do

- It did not build either development, run any kernel, or read any proof file beyond the text
  scans and the definitional spot checks named above.
- It did not open the JCSS version of IP01.
- B1/B1′ (model simulation) and B2/B2′ (encoding) are argued, not proved.
- The second reading was not consulted.
