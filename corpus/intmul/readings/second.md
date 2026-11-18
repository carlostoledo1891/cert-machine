# Second reading: do the two formal statements say what their papers say?

Second reader, 2026-11-17. A reading of statements only. Nothing was built, run, installed or posted, and no proof was judged.

## Files and how they are cited

| Tag | File | Note |
|---|---|---|
| A-L | `scratchpad/reading/gcmu_Challenge.lean` | Byte-identical to `intmul-src/google-cmu/lean/SubNLogN/Challenge.lean` (diff empty). Its sha256 is `7aa50930…61fb5`, the digest the paper prints on p. 51. |
| A-P | `intmul-src/google-cmu/IntMul_main_paper.pdf` | Cited by printed page number (PDF index = printed + 1). Text lines refer to `scratchpad/reading/main_paper.txt`. |
| B-S | `scratchpad/reading/community_Statement.lean` | Byte-identical to `intmul-src/community/IntegerMultBounds/MathlibTM2/Statement.lean`. |
| B-T | `scratchpad/reading/community_Theorem.lean` | Byte-identical to the repository's `Theorem.lean`. |
| B-R | `intmul-src/community/README.md` | |
| B-N | `intmul-src/community/docs/mathlib-tm2/mathlib-tm2.tex` | The note B-R line 115 says "explains the statement". |
| M-C | `scratchpad/reading/mathlib_Computable_0df444a3.lean` | |
| M-E | `scratchpad/reading/mathlib_Encoding_0df444a3.lean` | |
| M-S | `Mathlib/Computability/TuringMachine/StackTuringMachine.lean` at `0df444a3` | Not in the reading folder. Fetched from raw.githubusercontent.com (see section 5). |
| M-T | `Mathlib/Computability/StateTransition.lean` at `0df444a3` | Fetched the same way. |
| O | OpenAI, "Integer multiplication below n log n", `paper.pdf` | Fetched from the mathcommunity URL. Its sha256 `834f644c…f7129` equals the `paper.pdf` digest release B pins (`docs/sharper-bound-source.json` line 34). |

## Differences found, before the detail

1. **Neither proposition is the paper theorem as written.** Both state a bound for Mathlib's multi-stack machine `FinTM2`, on canonical least-significant-bit-first words, measured in total encoded length. The papers state a bound for a multitape machine, on fixed-width `x#y`, measured in bits per operand. The bridge between the two is argued in prose in both releases and formalized in neither (A-P p. 52 (a): "these routine model translations are not formalized").
2. **A's proposition is existential over the machine.** Theorem 1 is about "Algorithm 1" and carries a "Structure" clause. Neither is in the formal proposition. The paper says so (A-P pp. 52–53).
3. **A requires every stack alphabet to be finite; B does not.** Mathlib requires it only for the input stack (M-C 67–68). I argue in section 4 that this is not exploitable.
4. **The exponents differ.** A fixes κ = 2⁻⁴⁶ in the statement (A-L 75). B's `Statement` says only ∃ κ > 0 (B-S 39). B's headline theorem `mulInTime` is at κ = 4222422970/2⁴⁶ ≈ 6.0004 × 10⁻⁵ ≈ 2⁻¹⁴·⁰² (B-T 29), about 2³² times A's κ. So B's theorem is the stronger bound, and A's proposition does not imply it.
5. **The input encodings differ.** A uses a separator symbol over 3 symbols; B uses tagged halves over 4 symbols. A's length is B's length plus one.
6. I found nothing in the Mathlib definitions that I believe lets either proposition be met by something that is not, up to a constant factor, a multitape Turing machine running in the stated time.

---

## 1. Release A (Cui, Liu, Woodruff)

### 1.1 The informal claim

A-P p. 1 (text lines 75–87), Theorem 1, quoted in full:

> **Theorem 1.** Algorithm 1 (Section 2.1), implemented on a deterministic multitape Turing machine with a fixed finite alphabet and a fixed finite number of tapes, multiplies two n-bit integers exactly in worst-case time O(n(log n)^{1−2^{−46}}).
> Structure. The outer algorithm uses only power-of-two DFTs on one grid, one fixed convolution kernel per spread axis, and one two-term cyclic recurrence per spread axis; it uses no Chinese remainder map, prime transform length, coprime-length resampling, Fourier-grid expansion, Bluestein chirp, or polynomial-ring convolution. Ordinary products of O((log n)²) bits (and inputs below a fixed threshold n∗) are delegated to any independent multiplier with M(N) = N(log N)^{O(1)} (for instance that of Schönhage and Strassen [SS71]), with no recursive call to Algorithm 1 itself.

A-P p. 2 (text lines 94–100), Theorem 2:

> **Theorem 2 (Formally verified bound).** The O(n(log n)^{1−2^{−46}}) multiplication bound of Theorem 1 is formally proved in Lean 4 [dMU21, mC20] in Mathlib's finite-alphabet multi-stack Turing machine model over ℕ (statement `SubNLogN.Challenge.IntMulSubNLogN` in [Lean26], available in our github repository; Section 8), depending only on Lean's three standard logical axioms (`propext`, `Classical.choice`, `Quot.sound`) and assuming no result of [OAI26].

The machine conventions, A-P p. 13, §3.2 (text lines 763–768):

> Our complexity bounds refer to the standard deterministic multitape Turing machine model of [SS71, HvdH21, OAI26] with one fixed finite alphabet and a fixed finite number of one-dimensional tapes. In each step the machine reads and writes at most one cell per tape and moves each head by at most one cell. The running time is the total number of steps, so every scan, head movement, rewind, counter update, and workspace cleanup is charged. The input is x#y with x, y ∈ {0, 1}ⁿ, and the output is the 2n-bit binary representation of their product [OAI26, §1].

### 1.2 The formal proposition

A-L lines 70–75:

```lean
def IntMulSubNLogN : Prop :=
  ∃ M : Turing.TM2ComputableInTime encNatPair.encode encodingNatBool.encode
      (fun p : ℕ × ℕ => p.1 * p.2),
    (∀ k, Finite (M.tm.Γ k)) ∧
    ∃ C N₀ : ℕ, 0 < C ∧ ∀ L ≥ N₀,
      (M.time L) ^ (2 ^ 46) ≤ (C * L) ^ (2 ^ 46) * (Nat.log2 L) ^ (2 ^ 46 - 1)
```

with the input encoding at A-L 29–30:

```lean
def encodeNatPair (p : ℕ × ℕ) : List PairSym :=
  (encodeNat p.1).map PairSym.bit ++ PairSym.sep :: (encodeNat p.2).map PairSym.bit
```

The paper's own listing on p. 50 matches A-L character for character in the parts it quotes. I compared them by eye.

### 1.3 The encodings, worked by hand

From M-E 83–95: `encodePosNum one = [true]`, `bit0 n ↦ false :: …`, `bit1 n ↦ true :: …`, `encodeNum zero = []`, and `encodeNat n = encodeNum n`. The first list element is the least significant bit, and the last element of a nonempty word is always `true`.

| Pair | Operand words | A's input word | Length L | Output word for a·b |
|---|---|---|---|---|
| (5, 3) | 5 = `bit1 (bit0 one)` → `[true, false, true]`; 3 = `bit1 one` → `[true, true]` | `[bit true, bit false, bit true, sep, bit true, bit true]` | 6 | 15 → `[true, true, true, true]` |
| (0, 0) | `[]` and `[]` | `[sep]` | 1 | 0 → `[]` |
| (0, 3) | `[]` and `[true, true]` | `[sep, bit true, bit true]` | 3 | `[]` |

The (5, 3) row agrees with the `#guard` at A-L 77. I did not execute that guard.

So L = |bits a| + |bits b| + 1. No input has length 0, and every L ≥ 1 has at least one input.

Where the word sits: `initList` puts the word on stack k₀ and leaves every other stack empty (M-C 110–115). A stack's top is the head of its list, because push is `f v :: S k` and pop reads `(S k).head?` (M-S 162, 164). So the first symbol the machine can read is the least significant bit of a. At the end, `haltList` (M-C 118–123) requires the output stack to hold exactly the output word with its least significant bit on top.

### 1.4 Clause by clause

**(1) What is asserted to exist: WEAKER than Theorem 1.**
Theorem 1 says "Algorithm 1 … implemented on …". The proposition says `∃ M` (A-L 71): some machine. The "Structure" paragraph has no formal counterpart. The paper concedes both points: "Although `IntMulSubNLogN` quantifies existentially over the machine M, inspecting the definitions shows that the witness implements our Walsh route" (A-P p. 52) and "Syntactic absence of Chinese remainder maps is a property of the construction rather than part of the formal proposition" (A-P p. 53 by the text file's page breaks, text lines 3106–3107; I did not open that page image). As a statement about the complexity of multiplication nothing is lost. As a statement about Algorithm 1 the proposition is weaker: a formalization of any other sufficiently fast multiplier would prove the same proposition.

**(2) Machine model: DIFFERENT, equivalent up to a constant factor by an argument that is not formalized.**

- *Kind of machine.* The paper says multitape, "reads and writes at most one cell per tape and moves each head by at most one cell" (p. 13). The proposition uses `FinTM2`, a multi-stack machine (M-C 46–70; M-S 82–84: "replacing it with an arbitrary (finite) collection of stacks"). DIFFERENT. The direction needed to read the proposition as a multitape bound is stack → tape, which is the easy one: a stack is a tape whose head sits at the top. The paper states this (p. 52 (a): "therefore costs O(1) standard multitape Turing machine steps") and does not formalize it.
- *Deterministic.* SAME. `step` is a function `Cfg → Option Cfg` (M-S 171–173).
- *Fixed finite number of tapes.* SAME. `[kFin : Fintype K]` (M-C 49–50).
- *Finite control.* SAME. `[ΛFin : Fintype Λ]` (M-C 59–60) and `[σFin : Fintype σ]` (M-C 65–66).
- *Fixed finite alphabet.* SAME, but only because of A's extra conjunct. Mathlib has `[Γk₀Fin : Fintype (Γ k₀)]` (M-C 67–68), the input stack alone. The docstring on that field reads "Each internal stack is finite", which is not what the field says. A-L 73 adds `(∀ k, Finite (M.tm.Γ k))`. The paper explains this correctly (p. 52 (a): "Mathlib itself requires finiteness only for the input alphabet").
- *What one step is.* DIFFERENT, coarser by a machine constant. One `step` runs the whole statement attached to the current label (M-S 171–173 and `stepAux` 161–168), which may contain several pushes, pops and peeks on several stacks. Mathlib says so at M-C 27–31: "Each step executes a statement … generally contains multiple 'fundamental' steps … this execution time is up to multiplication by a constant the amount of fundamental steps". So T steps of this machine are at most D·T tape-machine steps, with D fixed by the machine.

**(3) Input: DIFFERENT.**
The paper says "x#y with x, y ∈ {0, 1}ⁿ" (p. 13), citing [OAI26, §1], where the leftmost bit is most significant (O p. 3). So: two words of the same length n, leading zeros allowed, most significant bit first. The proposition uses bits(a) `sep` bits(b), least significant first, with no high-order zeros and independent lengths (A-L 29–30; section 1.3 above). Four differences:

- Bit order is reversed.
- Widths are canonical, not fixed. A formal input never has a high-order zero. The paper's inputs with leading zeros are not inputs of the formal function at all.
- The two operand lengths are independent.
- The machine is constrained only on words of the form `encodeNatPair (a, b)` (the `∀ a` at M-C 172–175 ranges over ℕ × ℕ, not over words).

As sets of *values* the two cover the same pairs of naturals. As sets of *words* they do not. The bridge is a linear-time wrapper (strip or pad zeros, reverse), which the paper names and does not formalize (p. 52 (a) and (b)).

**(4) Output: DIFFERENT, and STRONGER on the halting condition.**
The paper says "the 2n-bit binary representation of their product" (p. 13), which is fixed width and padded. The proposition says `encodingNatBool.encode (a * b)` (A-L 71–72), the canonical word, least significant bit first, empty for 0. The halting configuration must equal `haltList` exactly: label `none`, `var := tm.initialState`, the output word on k₁ and `[]` on every other stack (M-C 118–123). The paper's model does not ask for a reset state or empty work tapes at the end. That is a stronger demand, and it costs at most a constant factor, since anything left on a stack was pushed in counted steps.

**(5) What "time" means and over which inputs it is a worst case: SAME notion, DIFFERENT parameter.**

- `TM2ComputableInTime` carries `time : ℕ → ℕ` and requires, for every pair a, that the machine reach the halting configuration within `time (ea a).length` steps (M-C 166–175).
- `EvalsToInTime` is "`(flip bind f)^[steps] a = b`" with "`steps ≤ m`" (M-T 255–267). The target is `some (haltList …)`, a configuration with label `none`, on which `step` returns `none` (M-S 172). So `steps` is the exact number of steps to halting: one more application gives `none`, not `some`. I worked this out from the definitions; it is not a quoted Mathlib lemma.
- Hence `M.time L` is at least the largest halting time over all pairs (a, b) with |bits a| + |bits b| + 1 = L. That is a worst case over every input of length L. `time` is chosen by the witness and is only bounded from above by the proposition, so choosing it cleverly cannot help.
- The parameter is L, the total symbol count including the separator. The paper's is n, the bits per operand. For n-bit operands L runs from 1 to 2n + 1. The paper does this conversion on p. 52 (b). Unbalanced pairs (one long operand, one short) are in the worst case at length L; the paper covers them by padding, at n = the longer length. I see no gap either way beyond constants.

**(6) The bound and its constants: SAME exponent, equivalent form.**
`(M.time L) ^ (2 ^ 46) ≤ (C * L) ^ (2 ^ 46) * (Nat.log2 L) ^ (2 ^ 46 - 1)` (A-L 75).

- Since x ↦ x^(2⁴⁶) is increasing on nonnegative numbers, this is exactly T(L) ≤ C · L · (log2 L)^{(2⁴⁶−1)/2⁴⁶} = C · L · (log2 L)^{1−2⁻⁴⁶}, with `Nat.log2` in place of log2. The natural-number subtraction `2 ^ 46 - 1` is not truncated.
- `Nat.log2` is the floor of the binary logarithm, with `Nat.log2 0 = 0` and `Nat.log2 1 = 0` (Lean core `Init/Data/Nat/Log2.lean` at v4.33.1, lines 34–42, and `log2_def` line 62). The floor makes the formal inequality slightly stronger than the same inequality with a real logarithm, at the same C.
- The exponent κ = 2⁻⁴⁶ is the paper's. SAME.
- Theorem 1 writes "log" with no base. §3.1 (p. 13) says "Logarithms are natural, written ln, unless written log2", so the theorem's "log" is, by the paper's own convention, neither. Under O(·) the base does not matter. I list it only as a loose end in the paper's notation.
- `0 < C` is redundant: with C = 0 the right side is 0, which would force `M.time L = 0`, impossible because the start configuration has label `some tm.main` (M-C 111) and the halting one has `none`.
- No bound is asked for L < N₀. Correctness is still asked for every pair. That matches an asymptotic O(·) with exact multiplication at all sizes.

**(7) Quantifier order: SAME.**
∃ machine (with its time function), then ∃ C N₀, then ∀ L ≥ N₀ (A-L 71–75). Inside the machine: ∀ pair (M-C 172). One machine and one pair of constants are fixed before any input. That is "a fixed finite alphabet and a fixed finite number of tapes" and a uniform O(·).

**(8) Integers against naturals: WEAKER, trivially.**
Theorem 1 says "n-bit integers"; the proposition is over ℕ × ℕ. The paper notes it (p. 52 (d): "a linear-time sign-and-magnitude wrapper, which is not formalized").

**(9) Theorem 2 against the proposition.**
Theorem 2 claims the bound "in Mathlib's finite-alphabet multi-stack Turing machine model over ℕ". That is what the proposition is about, so Theorem 2 is the more accurate description of what Lean checked. Theorem 1 is reached from the proposition only through the unformalized items in (2), (3), (4) and (8), and through reading the witness for (1).

**(10) A note on the trust list.**
A-P p. 51 lists "the seven Mathlib definitions named in the statement" (`Turing.FinTM2`, `Turing.TM2ComputableInTime`, `Computability.encodeNat`, `Computability.decodeNat`, `encodingNatBool`, `Encoding`, `Finite`). The meaning of the proposition also rests on definitions those depend on and that are not in the list: `TM2ComputableAux` (M-C 147), `TM2OutputsInTime` (M-C 135), `initList` and `haltList` (M-C 110, 118), `EvalsTo` and `EvalsToInTime` (M-T 255, 265), `TM2.Stmt`, `stepAux`, `step` and `Cfg` (M-S 127, 161, 171, 144), and `encodeNum`, `encodePosNum` (M-E 83, 89). The list is literally true ("named in the statement"). A reader who checks only the seven has not read what a step is.

### 1.5 Release A against the OpenAI theorem

O p. 3, Theorem 1:

> There is one deterministic Turing machine A, with a fixed finite alphabet and a fixed finite number of one-dimensional tapes, that computes this exact product for every n ≥ 1 and every pair of n-bit inputs. Its worst-case running time satisfies T_A(n) = O(n(lg n)^{1−κ}), κ = 2^{−182}.

with, just above it: "on input x#y, with x, y ∈ {0, 1}ⁿ, the output must be bin_{2n}(val(x) val(y)). Write lg n = max{⌈log2 n⌉, 1}."

Release A does not claim to formalize this theorem (Theorem 2: "assuming no result of [OAI26]"). Its exponent 2⁻⁴⁶ is larger than 2⁻¹⁸², so A's bound is STRONGER than OpenAI's in the exponent, and the model, input and output clauses differ from OpenAI's exactly as they differ from A's own Theorem 1 in 1.4.

---

## 2. Release B (platypii/integer-mult-bounds-lean)

### 2.1 What it says it formalizes

B-R line 3: "**Integer multiplication below `n log n` is proved in Lean on Mathlib's finite Turing machines.**"

B-R lines 7–12:

> `IntegerMultBounds.MathlibTM2.statement` is unconditional: one fixed `Turing.FinTM2` machine multiplies every pair of natural numbers, with standard binary input/output encodings, in worst-case time `O(n (log n)^(1-kappa))`. The construction proves the positive saving `kappa = 4222422970/2^46` (about `2^-14.02`), exposed by `MathlibTM2.mulInTime`, where `n` is the total encoded input length.

B-R lines 191–197 name the primary sources: Colkitt's research draft "A sharper exponent for integer multiplication" and "Its pinned OpenAI manuscript". B-R lines 96–104 describe a separate "historical native-machine target" on one-dimensional tapes and call it "a proposition to be proved, not a theorem". So release B does not present its Mathlib statement as OpenAI's Theorem 1 word for word. I compare against (i) B's own README claim and (ii) OpenAI's Theorem 1 (quoted in 1.5).

### 2.2 The formal proposition

B-S lines 29–39:

```lean
abbrev pairEnc : ℕ × ℕ → List (Bool ⊕ Bool) :=
  (encodingProd encodingNatBool encodingNatBool).encode

def MulInTime (κ : ℝ) : Prop :=
  ∃ M : TM2ComputableInTime pairEnc encodingNatBool.encode (fun p : ℕ × ℕ => p.1 * p.2),
    (fun n : ℕ => (M.time n : ℝ)) =O[atTop] fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - κ)

def Statement : Prop := ∃ κ : ℝ, 0 < κ ∧ MulInTime κ
```

and the headline theorems, B-T lines 29–36:

```lean
theorem mulInTime : MulInTime (4222422970 / 2 ^ 46 : ℝ) :=
  Fast.Main.compactR_mulInTime_final
…
theorem statement : Statement :=
  ⟨_, by positivity, mulInTime⟩
```

There are two propositions here. `Statement` has an existential exponent. `MulInTime (4222422970 / 2 ^ 46)` has an explicit one. Which of the two one calls "the statement" changes the comparison, so I treat both.

Arithmetic I checked by hand calculation: 4222422970 / 2⁴⁶ = 6.000424 × 10⁻⁵, and log2 of it is −14.0246, agreeing with "about 2⁻¹⁴·⁰²". Also ⌊(31/64) · (12387972/10¹¹) · 2⁴⁶⌋ = 4222422970, agreeing with the docstring at B-T 26–28 ("the layer margin `ε (1-λ')` rounded down").

### 2.3 The encodings, worked by hand

`encodingProd` encodes x as `(ea.encode x.1).map .inl ++ (eb.encode x.2).map .inr` (M-E 203–205).

| Pair | B's input word | Length n | Output word |
|---|---|---|---|
| (5, 3) | `[inl true, inl false, inl true, inr true, inr true]` | 5 | `[true, true, true, true]` |
| (0, 0) | `[]` | 0 | `[]` |
| (0, 3) | `[inr true, inr true]` | 2 | `[]` |
| (6, 1) | `[inl false, inl true, inl true, inr true]` | 4 | `[false, true, true]` |

The (6, 1) row agrees with the `example` at B-S 42, which I did not execute. So n = |bits a| + |bits b|, as B-S line 17 says ("Its length `n` is `Nat.size a + Nat.size b`"). I did not read `Nat.size`. Every n ≥ 0 has an input, and (0, 0) is the only one of length 0.

### 2.4 Clause by clause, against B's README claim

Each README clause is close to a paraphrase of the Lean text, so most are SAME.

- "one fixed `Turing.FinTM2` machine": SAME (`∃ M : TM2ComputableInTime …`, B-S 35; the machine is `M.tm : FinTM2`, M-C 149).
- "multiplies every pair of natural numbers": SAME (`fun p : ℕ × ℕ => p.1 * p.2`, with the `∀ a` of M-C 172).
- "standard binary input/output encodings": SAME if "standard" means Mathlib's own, which is how B-S 9 puts it ("Everything in this file is Mathlib vocabulary"). The pair encoding is the tagged one worked out above, not `x#y`.
- "worst-case time": SAME, by the same reading of `time` as in 1.4 (5). B-S 18–19 says it: "The time function bounds the number of steps on every input of length `n`, so it is a worst-case bound."
- "`O(n (log n)^(1-kappa))` … `kappa = 4222422970/2^46` … exposed by `MathlibTM2.mulInTime`": SAME as `mulInTime` (B-T 29). `Statement` itself is WEAKER than this sentence, because it forgets the value of κ.
- "where `n` is the total encoded input length": SAME (`time (ea a).length`, M-C 175).
- B-R line 3, "on Mathlib's finite Turing machines": slightly loose. Mathlib's `FinTM2` does not require the work-stack alphabets to be finite (M-C 67–68) and B adds no conjunct. B-S lines 10–11 are accurate about it: "finitely many stacks, a finite control state, a finite label set and a finite input alphabet".
- B-S line 38, docstring of `Statement`: "Integer multiplication below `n log n` on multitape Turing machines." DIFFERENT from the definition under it, which is about multi-stack machines. The file bridges the two in prose at B-S 12–13: "Two stacks simulate one tape with constant overhead and a stack is a restricted tape, so time on `FinTM2` agrees with multitape Turing machine time up to a constant factor." That sentence is not a Lean statement.

### 2.5 Clause by clause, against OpenAI's Theorem 1

**Machine model: DIFFERENT, equivalent up to a constant factor by an unformalized argument.** Same analysis as 1.4 (2): multi-stack against multitape, deterministic SAME, finitely many stacks SAME, finite control SAME, one step is one label's whole statement.

**Fixed finite alphabet: WEAKER on its face.** OpenAI: "a fixed finite alphabet". B: only the input alphabet is `Fintype` (M-C 67–68) and the output alphabet is finite because it is in bijection with `Bool` (M-C 153). Work-stack alphabets are unconstrained types. I argue in section 4 (a) that this cannot be used.

**Input: DIFFERENT.** OpenAI: `x#y`, x, y ∈ {0,1}ⁿ, leftmost bit most significant (O p. 3). B: canonical least-significant-first words, tagged `inl`/`inr`, no separator, independent lengths. The same four differences as in 1.4 (3), plus tagging in place of a separator.

**Output: DIFFERENT, and STRONGER on the halting condition.** OpenAI: bin_{2n}(val(x) val(y)), 2n bits padded on the left. B: the canonical word, with `haltList`'s clean stacks and reset state. B-N lines 90–92 states this correctly: "The machine must halt with the least-significant-first binary word of ab, without leading zeroes, on its output stack, every other stack empty, and its local state reset."

**Time and worst case: SAME notion, DIFFERENT parameter.** n is |bits a| + |bits b|, against OpenAI's bits per operand. For n-bit operands B's length runs from 0 to 2n.

**The bound.**
- `f =O[atTop] g` unfolds to ∃ c : ℝ, eventually ‖f n‖ ≤ c · ‖g n‖ (Mathlib `Analysis/Asymptotics/Defs.lean` at B's pin, lines 73–74, 85–86, 96). That is an ordinary eventual O(·), SAME as the paper's O.
- `Real.log` is the natural logarithm, with `log 0 = 0` (Mathlib `Analysis/SpecialFunctions/Log/Basic.lean` at B's pin, lines 39–45). OpenAI's lg n is max{⌈log2 n⌉, 1}. Under O(·) and for large n these differ by a constant factor. SAME up to the constant.
- `Real.log n ^ (1 - κ)` is a real power of the logarithm (function application binds tighter than `^`). I did not read `Real.rpow`. I assumed it is the usual power for a nonnegative base.
- Exponent, for `Statement`: ∃ κ > 0. OpenAI names κ = 2⁻¹⁸². In form `Statement` is WEAKER than OpenAI's theorem: it asserts a saving and does not say how much. It is what the title "below n log n" says, no more.
- Exponent, for `mulInTime`: κ ≈ 6.0 × 10⁻⁵, larger than 2⁻¹⁸². STRONGER than OpenAI's bound.
- κ is not bounded above in `Statement`. A larger κ is a stronger claim once log n ≥ 1, so this opens nothing.

**Quantifier order: SAME.** ∃ κ, ∃ machine and time function, ∃ c, eventually in n; inside the machine, ∀ pair.

**"for every n ≥ 1 and every pair of n-bit inputs": SAME in values.** B covers every pair of naturals, including 0, in canonical form only.

**Against Colkitt's draft:** not compared. I did not read the draft. From `docs/sharper-bound-source.json` (lines 5–8) I can only report that the source's own target is recorded there as `"target_decimal": "0.001672660197076918"` with `"status": "Maintainer-reviewed conditional finite construction …"` and `"scope": "… Not a full Lean multiplication theorem."` B-R lines 134–137 likewise say a larger κ "is not proved here". So B's proved κ is its own figure and smaller than its source's target.

---

## 3. A against B

Every difference I found between `IntMulSubNLogN` (A-L 70–75) and `MulInTime κ` / `Statement` (B-S 34–39).

**D1. Pair encoding and input alphabet.**
A: 3 symbols, `bits(a) ++ sep :: bits(b)` (A-L 18–20, 29–30). B: 4 symbols `Bool ⊕ Bool`, tagged halves, no separator (B-S 29–30, M-E 205). L_A = n_B + 1.
*Does it matter?* Not mathematically. Either word is turned into the other by a machine that pops the input onto a scratch stack while relabelling, then pops it back onto the stack the other machine reads from. That is 2L + O(1) steps before the other machine starts. But it is a real composition of machines, and Mathlib has no theorem for it: at A's pin the composition statement is a `proof_wanted` (M-C 276–288), and at B's pin that block is gone. So neither proposition follows from the other by a one-line Lean argument.

**D2. Finiteness of all stack alphabets.**
A: `(∀ k, Finite (M.tm.Γ k))` (A-L 73). B: absent.
*Does it matter?* On its face A is stronger. I believe not in substance (section 4 (a)): a machine can only ever push finitely many distinct symbols, so each alphabet can be cut down to a finite one. To derive A's conjunct from a B witness one must either do that cutting-down construction or inspect B's concrete machine. I did neither.

**D3. The exponent.**
A: κ = 2⁻⁴⁶, written into the proposition. B `Statement`: ∃ κ > 0. B `mulInTime`: κ = 4222422970 / 2⁴⁶.
*Does it matter?* Yes. This is the one difference with mathematical content. The ratio is 4222422970 ≈ 2³¹·⁹⁸.
- B's `mulInTime` gives a strictly smaller bound than A's for large inputs. With D1, D2, D4 and D5 handled, B's `mulInTime` implies A's `IntMulSubNLogN`, because x^{1−κ_B} ≤ x^{1−2⁻⁴⁶} for x ≥ 1.
- A's proposition does not imply B's `mulInTime`. It implies `MulInTime (2⁻⁴⁶)`, hence B's `Statement`, again after D1, D4 and D5.
- B's `Statement` alone does not imply A's proposition: its κ could be smaller than 2⁻⁴⁶.
- A consequence for reading A's paper, which I report without judging priority: A-P p. 1 says "the exponent κ improves from 2⁻¹⁸² to 2⁻⁴⁶", and B's formal theorem at commit aaf10926 has the larger κ ≈ 2⁻¹⁴·⁰².

**D4. The logarithm.**
A: `Nat.log2 L`, floor of log2, a natural number. B: `Real.log n`, natural log, a real.
*Does it matter?* No, constants only. For L ≥ 2: ln L < log2 L < ⌊log2 L⌋ + 1 ≤ 2⌊log2 L⌋, and ⌊log2 L⌋ ≤ ln L / ln 2.

**D5. The shape of the inequality.**
A: explicit natural C and N₀, both sides raised to the 2⁴⁶-th power, all in ℕ. B: `=O[atTop]` with a real constant and a real power.
*Does it matter?* No. A's form is exactly T ≤ C·L·⌊log2 L⌋^{1−2⁻⁴⁶} for L ≥ N₀ (1.4 (6)); B's unfolds to the same shape with a real constant. A real constant is bounded by a natural one. A's form needs no real analysis to read; B's needs `IsBigO`, `Real.log` and `Real.rpow`.

**D6. The parameter the time is a function of.**
Both use total encoded length, not bits per operand. They differ by the separator: A's time at L corresponds to B's at L − 1. No consequence beyond D1.

**D7. `0 < C`.**
A has it (A-L 74); B's constant c is any real. Redundant in A (1.4 (6)), and in B a nonpositive c would force the time to be 0 eventually, which is impossible. No consequence.

**D8. Vocabulary of the statement file.**
A defines its own inductive type, encoder, decoder and three lemmas (A-L 18–63) in an 80-line file. B's file has one `abbrev` over Mathlib's `encodingProd` and nothing else of its own (B-S 29–30). A's decoder plays no part in the proposition, which uses only `encNatPair.encode` (A-L 71). So A asks the reader to check one more small definition; B asks the reader to trust more of Mathlib (asymptotics and real powers).

**D9. Toolchain.**
A: Lean 4.33.1, Mathlib `0df444a3…` (`lean/lean-toolchain`, `lean/lake-manifest.json`). B: Lean v4.34.1, Mathlib `d13f23b7…` (`lean-toolchain`, `lake-manifest.json`). I diffed the four Mathlib files between the two pins: `Computable.lean` differs only by the removed `proof_wanted` block; `Encoding.lean` by two proof lines (118, 126); `StackTuringMachine.lean` by one proof line (591); `StateTransition.lean` by three import lines. No definition differs.

**D10. Lean module keywords.**
B's files start with `module`, `public import` and `@[expose] public section` (B-S 1–4, 22). A's file uses plain `import`. I am unsure of the exact effect of `@[expose]`; I assumed it does not change what the proposition means.

**D11. What each is a formalization of.**
A formalizes A's own algorithm and says it uses nothing of OpenAI's as a hypothesis (Theorem 2). B formalizes a route built on Colkitt's draft and the OpenAI manuscript (B-R 191–197). This is a difference of provenance, not of the propositions.

**Summary of implications, with what each needs.**

| From | To | Extra argument needed | Holds? |
|---|---|---|---|
| B `mulInTime` | A `IntMulSubNLogN` | re-encoding machine (D1); finite alphabets (D2); κ monotonicity (D3); log and constant conversion (D4, D5) | Yes, none of it formalized |
| A `IntMulSubNLogN` | B `MulInTime (2⁻⁴⁶)` and `Statement` | re-encoding machine (D1); log and constant conversion (D4, D5); drop the finiteness conjunct | Yes, none of it formalized |
| A `IntMulSubNLogN` | B `mulInTime` | — | No. The exponent is genuinely larger in B. |
| B `Statement` | A `IntMulSubNLogN` | — | No. κ is not pinned. |

---

## 4. Could the Mathlib definitions be satisfied by something that is not a multitape machine in that time?

For each point: what the definition does, and whether I believe it can be exploited.

**(a) Only the input stack's alphabet must be finite.**
`[Γk₀Fin : Fintype (Γ k₀)]` (M-C 67–68). Mathlib says of its own parameters: "All of these variables denote 'essentially finite' types, but for technical reasons it is convenient to allow them to be infinite anyway" (M-S 36–38). A closes this (A-L 73); B does not.
*Exploitable? I believe not.* Every stack but the input starts empty (M-C 113–115). A symbol reaches a stack only through `push k (f : σ → Γ k)` (M-S 128, 162), which pushes `f v` for the current state v. σ is finite (M-C 66), there are finitely many labels (M-C 60), and each label's statement is a finite term with finitely many `push` nodes (M-S 127–134: the recursive arguments are plain `Stmt`, not functions into `Stmt`). So at most |σ| × (number of push nodes) distinct symbols can ever appear on a stack, whatever the size of its type. The `peek`/`pop` functions `σ → Option (Γ k) → σ` (M-S 129–130) may be arbitrary on an infinite type, but they are only ever applied to those finitely many symbols. An infinite alphabet is unusable beyond a finite part.

**(b) One step runs a whole statement.**
`step` applies `stepAux` to the entire statement of the current label (M-S 161–173).
*Exploitable? No.* A statement is a finite tree and there are finitely many labels, so the number of stack operations per step is bounded by a machine constant. Mathlib's own note says this (M-C 27–31). The time is that of a multitape machine up to this constant.

**(c) Arbitrary functions in the program.**
`load : (σ → σ)`, `branch : (σ → Bool)`, `goto : (σ → Λ)` take arbitrary, possibly noncomputable, functions (M-S 131–133).
*Exploitable? No.* σ and Λ are finite, so each is a finite table, which is a finite control.

**(d) The time function is arbitrary.**
`time : ℕ → ℕ` (M-C 169) need not be computable, monotone or tight.
*Exploitable? No.* It is constrained from below by every input of each length (M-C 172–175, M-T 267) and from above by the proposition. Both statements bound it at every large length, and every length has an input (L ≥ 1 for A, n ≥ 0 for B). A length with no input would be unconstrained from below, but that only lets `time` be small there, which proves nothing false.

**(e) The step count is exact.**
`EvalsTo` asks that iterating `step` exactly `steps` times gives `some` of the halting configuration (M-T 255–258), which has label `none` (M-C 119).
*Exploitable? No.* Once the label is `none`, `step` returns `none` (M-S 172), so a run cannot pass through the target early and continue, and `steps` cannot undercount. A run of 0 steps is excluded because the start label is `some tm.main` (M-C 111).

**(f) Malformed inputs.**
The machine is constrained only on `ea a` for a : ℕ × ℕ (M-C 172–175). On other words it may do anything, including not halt. For A these are words with no separator, with more than one, or with an operand ending in `bit false`. For B they are words with an `inr` before an `inl`, or with an operand ending in `false`.
*Exploitable? I believe not.* The well-formed words are recognizable in one linear pass and the promise carries no information about the product. What it does mean: neither proposition says anything about the paper's inputs with leading zeros. Those must be stripped by a wrapper first, and stripping only shortens the input, so the bound in L or n transfers. A's decoder `decodeNatPair` accepts some malformed words (`splitSep` drops later separators, A-L 33–36), and so does `encodingProd`'s (M-E 206–207). Neither decoder occurs in either proposition.

**(g) The encodings are parameters of the definition.**
`TM2ComputableInTime` takes any `ea`, `eb` (M-C 166). An encoding that already contained the product would make the proposition trivial.
*Exploitable here? No.* A's encoder is the two binary words and a separator (A-L 29–30). B's is the two binary words, tagged (M-E 205). The output encoder in both is `encodeNat` (M-E 94, 133–134). None does any arithmetic. The function is `fun p : ℕ × ℕ => p.1 * p.2` in both, and neither statement file declares an instance that could change the meaning of `*`.

**(h) The alphabet bijections are chosen by the witness.**
`inputAlphabet : tm.Γ tm.k₀ ≃ Γ₀`, `outputAlphabet : tm.Γ tm.k₁ ≃ Γ₁` (M-C 151–153).
*Exploitable? No.* They are fixed bijections between the machine's symbols and the abstract ones, applied symbol by symbol (`List.map`, M-C 173–174). A relabelling cannot carry computation.

**(i) Stacks, not tapes.**
A stack cannot be read without being consumed below the top.
*Exploitable? No, it is a restriction.* A k-stack machine is simulated step for step by a k-tape machine with the constant of (b). The converse (two stacks per tape) is the direction a prover needs, not a reader.

**(j) Uniformity.**
*Exploitable? No.* The machine, its alphabets, its stacks and its constants are bound before the input (1.4 (7)). The work stacks start empty (M-C 115), so there is no advice.

**(k) The halting condition is stricter than usual.**
All non-output stacks empty and `var := tm.initialState` (M-C 118–123).
*Exploitable? No. It is a burden on the prover.* Note that when k₀ ≠ k₁ the input must have been fully consumed.

**(l) The lower end of the bound.**
In A, at L ≤ 1 the right side is 0 (`Nat.log2` is 0), which is why N₀ is there. In B, `Real.log 0 = 0` and `Real.log 1 = 0`, which `atTop` discards.
*Exploitable? No.*

I found no point I believe is exploitable. The one I would have listed as open, (a), is closed by the push-counting argument, and A closes it in the statement as well.

---

## 5. What I could not check, and what I assumed

**Not done, by instruction.** Nothing was built or run. The `#guard` lines (A-L 77–78) and the `example … by decide` lines (B-S 41–42) were not executed; my hand encodings agree with them. I did not check that either headline theorem typechecks, nor its axioms, nor any proof.

**Read only in part.**
- A's paper: printed pp. 1–2, 13, 50–52 as page images, and the text of §3.1–3.2 and §8 (text lines 742–880, 2940–3190). Not read: Algorithm 1, Sections 4–7, the appendices, the short paper, the companion paper, `IntMulTM/Spec.lean` (which A-L 7–8 says is "identical in model and input/output encodings").
- OpenAI's paper: pp. 1–3 and 8–9 only (abstract, contents, Theorem 1, the start of §2). The HTML page at the given URL returned only the abstract; the theorem and the model come from `paper.pdf` linked from that page. Its sha256 matches release B's pin, as noted in the table at the top. I did not compare it with the copy release A cites.
- Release B: `Statement.lean`, `Theorem.lean`, `README.md`, `docs/mathlib-tm2/mathlib-tm2.tex`, the first 40 lines of `docs/sharper-bound-source.json`, a few theorem headers of `docs/fast-mult/fast-mult.tex`, `lean-toolchain`, `lakefile.toml`, `lake-manifest.json`. Not read: Colkitt's draft (not on disk), and the proof files.
- The byline of B's note reads "Dan Brown" with the footnote "Author of *The Da Vinci Code*" (B-N 32–34). I draw nothing from it and treated the note as the repository's own description.

**Mathlib.** The task said to assume B's Mathlib definitions equal A's. I did not need to assume it: I fetched `Computable.lean`, `Encoding.lean`, `StackTuringMachine.lean` and `StateTransition.lean` at both pins from raw.githubusercontent.com and diffed them (result in D9). The two files in the reading folder are byte-identical to what GitHub serves at `0df444a3`. I also fetched `Analysis/Asymptotics/Defs.lean` and `Analysis/SpecialFunctions/Log/Basic.lean` at B's pin and Lean core's `Init/Data/Nat/Log2.lean` at v4.33.1. This rests on GitHub serving the right bytes for those revisions. The copies are in `<scratch>/second-reader-mathlib/`, which is temporary.

**Assumed without reading the definition.** `Real.rpow`; `Filter.atTop` and the norm on ℝ; `Finite`; `Num`, `PosNum` and the cast ℕ → `Num` inside `encodeNat`; `Nat.size`; `List.head?`, `List.tail`, `Function.update`; `Option.bind` and `Nat.iterate` inside `EvalsTo`. I assumed each has its usual meaning.

**My own arguments, formal in neither release.** The stack-to-tape simulation and its constant; the fixed-width wrappers; the re-encoding machine of D1; the cutting-down of alphabets in 4 (a); the claim that `steps` is the exact halting time in 1.4 (5); the inequalities of D3 and D4. Each is elementary, and each is an argument, not a checked proof. B's note says the tape-to-stack direction is formalized inside B's proof (B-N 105–134); I read that only in the note.

**Not checked.** Whether B's concrete machine happens to have finite work-stack alphabets. Whether A's witness is in fact Algorithm 1 (the paper says to see it "by inspecting the definitions"; I did not inspect them).

**Unsure.** The semantic effect of `@[expose] public section` and `module` in B's files (D10).

**Disclosure.** When creating this file I listed the entries of `notes/intmul-2026-11-17/` and saw the names `PLAN.md`, `bridge` and `readings`. I opened none of them and did not list inside `readings`.
