# First reading of the two statements (2026-11-17, written before the second reader's notes were seen)

Reader: the main session. Read: `SubNLogN/Challenge.lean` (release A, lockqueue/intmul @ 4738aeff), the full paper
pages 1–3 and its Section 8 text, `MathlibTM2/Statement.lean` and `Theorem.lean` (release B, platypii @ aaf10926),
Mathlib `Computability/TuringMachine/Computable.lean` @ 0df444a3, and the community page that hosts OpenAI's preprint
(its abstract only). Not read: Section 3 of the paper, OpenAI's manuscript beyond the abstract, release B's README
beyond its first screen.

## A. Release A against its paper

Informal (paper p. 1, Theorem 1): "Algorithm 1 (Section 2.1), implemented on a deterministic multitape Turing machine
with a fixed finite alphabet and a fixed finite number of tapes, multiplies two n-bit integers exactly in worst-case
time O(n (log n)^(1−2^-46))." Theorem 2 (p. 2) says the bound "is formally proved in Lean 4 in Mathlib's
finite-alphabet multi-stack Turing machine model over ℕ (statement SubNLogN.Challenge.IntMulSubNLogN)".

Formal (`Challenge.lean`, the definition `IntMulSubNLogN`): there is `M : Turing.TM2ComputableInTime encNatPair.encode
encodingNatBool.encode (fun p => p.1 * p.2)` with `∀ k, Finite (M.tm.Γ k)` and `∃ C N₀, 0 < C ∧ ∀ L ≥ N₀,
(M.time L)^(2^46) ≤ (C·L)^(2^46)·(Nat.log2 L)^(2^46 − 1)`.

| Clause | Paper | Lean | Reading |
|---|---|---|---|
| machine | deterministic multitape, finite alphabet, finitely many tapes | Mathlib `FinTM2`: finitely many stacks, finite states and labels, one step = one loop-free statement; every stack alphabet finite by the extra conjunct | DIFFERENT model, same class: two stacks make a tape and a stack is a restricted tape, at constant factor. Not formalized; the paper says so (Section 8, point (a)) |
| one fixed machine | "a fixed" machine | `∃ M`, outside every quantifier over inputs | SAME |
| input | two n-bit integers | `bits(a) ++ sep :: bits(b)`, LSB first, no high zeros, three symbols | DIFFERENT presentation: lengths vary and high zeros are not inputs. By hand: (5,3) ↦ `[1,0,1,sep,1,1]` (the file's own `#guard`), (0,0) ↦ `[sep]`. The fixed-width wrapper is linear time and not formalized (the paper says so) |
| output | the exact product | `encodingNatBool.encode (a*b)`, LSB first, on the output stack, every other stack empty, state back to the initial one (`haltList`) | SAME or STRONGER |
| time | worst case over all inputs of a size | `outputsFun : ∀ a, TM2OutputsInTime … (time (ea a).length)`, so `M.time L` bounds every input of encoded length L | SAME (in L, the encoded length, not n) |
| bound | O(n (log n)^(1−2^-46)) | `time(L)^K ≤ (C·L)^K·⌊log2 L⌋^(K−1)`, K = 2^46, all L ≥ N₀ | SAME after K-th roots; the paper derives the n-bit bound from it in Section 8 (b). C and N₀ are only asserted to exist |
| constants | κ = 2^-46 | the literal 2^46 | SAME |

Nothing in the statement is a hypothesis: it is a bare existence claim, so it cannot be vacuous by an unsatisfiable
assumption.

## B. Release B against what it formalizes

Its file says it states "Integer multiplication below n log n on multitape Turing machines"; the source is OpenAI's
preprint, whose abstract (as hosted by the community page) claims κ = 2^-182 "on one fixed finite-alphabet Turing
machine with a fixed finite number of one-dimensional tapes". Release B proves a different, larger saving:
`mulInTime : MulInTime (4222422970 / 2^46)`, about 2^-14.02, and `statement : ∃ κ > 0, MulInTime κ`.

Formal (`Statement.lean`): `MulInTime κ := ∃ M : TM2ComputableInTime pairEnc encodingNatBool.encode (fun p => p.1 * p.2),
(fun n => (M.time n : ℝ)) =O[atTop] fun n => (n : ℝ) * Real.log n ^ (1 − κ)`.

| Clause | Source | Lean | Reading |
|---|---|---|---|
| machine | finite-alphabet multitape | `FinTM2` with NO clause on the work stacks' alphabets (Mathlib asks finiteness of the input stack only) | WEAKER as written. I believe it is harmless (section D, point 1), and the machine the proof builds has finite alphabets by my reading of `Stack.lean` and `Host/Core.lean` (not kernel-checked) |
| input | two n-bit integers | Mathlib's `encodingProd`: a's bits tagged `inl`, then b's bits tagged `inr`; by hand (5,3) ↦ `[inl 1, inl 0, inl 1, inr 1, inr 1]`, (0,0) ↦ `[]` | DIFFERENT presentation, as in A; one symbol shorter than A's |
| output, time | as A | as A | SAME |
| bound | O(n (lg n)^(1−κ)) | `=O[atTop]` over ℝ with the natural logarithm | SAME: a change of base is a constant factor |
| constants | κ = 2^-182 | κ = 4222422970/2^46 | STRONGER than the source's number; the proof is the community's own refinement, not OpenAI's construction |

## C. A against B

1. **Encoding.** Separator against tags. Each converts to the other by one pass. A proof that either statement
   implies the other needs that converter composed with the machine, in Lean. Not done by either release.
2. **Form of the bound.** An inequality in ℕ against `=O` in ℝ. For one and the same time function I expect them
   equivalent at equal κ, and B's κ to give A's (2^-46 is smaller). To be proved, not assumed.
3. **Finiteness.** A requires every stack alphabet finite, B does not. So B's proposition does not give A's by a
   change of encoding alone, even with point 2: one also needs that B's machine has finite alphabets.
4. **κ.** B's is larger (a stronger theorem) and is also offered existentially.

## D. Could either proposition be met by something that is not a Turing machine in that time?

1. *Infinite work alphabets (B).* A push writes `f(state)` and the state set is finite, and the input alphabet is
   finite, so only finitely many symbols can ever stand on any stack. An infinite alphabet buys nothing. My argument;
   I have not found it proved in Mathlib.
2. *A step.* One step runs a loop-free statement: a bounded number of pushes, pops and branches for a fixed machine.
3. *Arbitrary functions in statements.* `load`, `branch`, `pop` take arbitrary functions, but on the finite state set
   (and into it), so each is a finite table.
4. *The time function.* `time : ℕ → ℕ` need not be computable; it only has to dominate the real running time, and the
   statement bounds it. Lengths below N₀ (A) or below the O's threshold (B) are finitely many.
5. *Malformed inputs.* Nothing is asked on strings that are not encodings. Usual.
6. *Halting.* `haltList` asks the output stack to hold exactly the answer, the others to be empty and the state to be
   the initial one. Stronger than "halts with the answer somewhere".

I found no way to satisfy either proposition short of a machine a complexity theorist would accept, given point 1.

## E. Not checked

The paper's Section 3 conventions; OpenAI's theorem beyond its abstract; whether release B pins the same Mathlib
definitions (it pins a later Mathlib, d13f23b7); anything about either proof.
