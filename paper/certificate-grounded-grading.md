# Certificate-grounded grading: a construction manual

*Carlos Toledo · cert-machine · DRAFT, sections 2 and 3 only*

> **Status.** Machine-assisted draft, not peer-reviewed, not submitted. Every number in this
> document was read from `certs/envs-record.json` at build time (2026-09-03, git `6750a59`); the living version of each is at <https://carlostoledo.co/reports/envs.html>, where it is
> recomputed on every build. Sections 1 and 4-11 are outlined and unwritten; this file does not
> pretend otherwise.

**Thesis.** Verifier false-accept rates are measured today against labels, behavioural diffs and human
adjudicators. Where a certificate exists the negative set can be *proved* instead, generated in closed
form rather than mutated — and the field's standard remedy for numeric grading, tightening the
tolerance, provably does not close the hole.

---

## 2 · What "wrong" means, and why it is usually a comparison

Three recent studies measure how often a verifier accepts an incorrect submission. They agree that the
rate is large, they disagree about almost everything else, and they establish *incorrectness* in three
different ways — none of which is a proof. Each says so about itself.

| study | what it measures | how it establishes that a submission is wrong |
|---|---|---|
| Ray, *Fuzzing RLVR Verifiers* (arXiv:2606.01066) | buggy math / tool-call / code verifiers at false-positive rates 0.832, 0.869, 0.557; a `math-verify` replay at 10/60 | a **label supplied by the workload design**, with a stricter verifier as an operational proxy |
| Rajan, *Auditing Reward Hackability in Code RL* (arXiv:2606.16062) | 28.5% of a SWE-bench Verified sample and 25.0% of an R2E-Gym sample accept an incorrect patch; hackable tasks inflate Pass@1 by +14.14 pp across 134 models | an **LLM-generated patch that changes observable behaviour** and still passes, executed in Docker |
| Zhang, *When the Reward Suite Is Leaky* (arXiv:2607.11022) | a preregistered causal contrast on MBPP; leak-stratum false-positive share +43.8 pt; 47.57% of rewarded false positives are genuinely wrong code | **signed, human-adjudicated rules** — a person read each one |

The first is the most explicit about the limitation, and states it better than a critic would:

> "Throughout the paper, T(c) is the intended semantic label supplied by the workload design. The strict
> verifier is an operational proxy for T(c), not a formal proof of correctness. Accordingly, a strict
> false-positive rate of zero means zero on the generated cases in this controlled evaluation, not zero
> for all possible completions or deployments."

That paragraph is the opening this paper walks through. When wrongness is a label, a measured
false-accept rate is a **disagreement between two graders**, and it can be attacked by attacking the
reference. When wrongness is a behavioural diff, the rate inherits whatever the diff missed. When it is
a human adjudication, the rate inherits the adjudicator. In each case the number is an estimate of a
quantity nobody can exhibit.

### 2.1 What a certificate changes

Let *q* be a quantity and let a **certificate** for *q* be a pair of exact rationals `[lo, hi]` with a
machine-checkable proof that `lo ≤ q ≤ hi`, produced by outward-rounded interval arithmetic. Call
`w = hi − lo` the **width**.

A submitted value *v* is **refuted by the certificate** when `v < lo` or `v > hi`. This is not a
comparison against a reference answer: it is a theorem, and it holds against every possible reference
answer at once. There is no key to attack, no proxy to out-strict, and no adjudicator to disagree with.

The consequence for measurement is the whole point of this paper. If a grader accepts a value that a
certificate refutes, the false accept is **a proof about the grader**, not evidence about it. The rate
stops being an estimate.

### 2.2 Four grader shapes

Fix a stored reference `k ∈ [lo, hi]` — a correct decimal, as an answer key is supposed to be — and a
tolerance `tol > 0`. The shapes measured here are the ones deployed in practice:

- **absolute tolerance** — accept `v` iff `|v − k| < tol`;
- **relative tolerance** — accept `v` iff `|v − k| / |k| < tol`;
- **exact match** — accept `v` iff `v = k` as a literal;
- **certificate-grounded** — accept `v` iff `lo ≤ v ≤ hi`.

Only the last consults the proof. The first two consult a decimal and a slack; the third consults a
decimal and nothing else.

## 3 · The acceptance band

### 3.1 The band, and its width

Write `A = (k − tol, k + tol)` for the values an absolute-tolerance grader accepts and
`Rc = (−∞, lo) ∪ (hi, ∞)` for the values the certificate refutes. The **acceptance band** is
`B = A ∩ Rc`: the values that are simultaneously accepted by the grader and proved wrong.

**Proposition 1.** *If `k` is the midpoint of `[lo, hi]` and `tol > w/2`, then*

```
    |B| = 2·tol − w,
```

*and `B` is empty precisely when `tol ≤ w/2`.*

*Proof.* `B = (k − tol, lo) ∪ (hi, k + tol)`. With `k = (lo + hi)/2` each part has length
`tol − w/2`, which is positive exactly when `tol > w/2`; the two are disjoint. ∎

Define the **band ratio**

```
    ρ = |B| / w = 2·tol/w − 1,
```

the number of certificate-widths of wrongness the grader will accept. It is the single tuning number of
this paper, and it depends on the *ratio* of tolerance to certificate width — not on either alone.

### 3.2 The remedy that does not work

The bug taxonomy in Ray (2606.01066) lists the failure mode directly — *"Math · Loose tolerance ·
accepts nearby wrong value"* — and prescribes the obvious fix: **"uses tight numeric tolerance."**

Proposition 1 says that fix is insufficient in a specific and quantitative way. Tightening `tol` shrinks
`|B|` linearly and closes it only at `tol = w/2` — at which point the grader accepts a *sub-interval* of
the certificate and has become a certificate-grounded grader with gratuitous false rejects. For every
tolerance above that threshold the band is non-empty, and for the widths this lab actually holds it is
enormous: a typical certificate here has `w ≈ 4e-15`, so a routine `tol = 1e-9`
gives `ρ ≈ 562,949` — the grader accepts a band
roughly 562,949 times wider than the proof.

The narrowest non-degenerate certificate in the corpus has `w = 1.56e-17`; at the same tolerance its ratio is `ρ ≈ 128,102,388`.

### 3.3 The measurement

The band is not an argument about what *could* happen; it is a generator. Every value in `B` is a
submission that is provably wrong and guaranteed to pass, so the adversarial set is enumerated rather
than mutated, and it is unbounded.

Corpus: **104 certified facts**, each read from a record in this repository and
sha256-pinned to it — 52 of them exact integers (width zero: a tensor rank, a contact
count, a period count). Tolerances probed: `1e-3`, `1e-4`, `1e-6`, `1e-8`, `1e-9`, `1e-10`, `1e-12`, `1e-14`, `1e-15`.
Submissions: **4,418**, of which **4,000 are provably wrong**
and 418 are provably right — the second half matters, because a false-accept
benchmark with no controls is passed perfectly by a grader that rejects everything.

| grader | false-accept | false-reject | soundness `(1−FA)(1−FR)` |
|---|---|---|---|
| absolute-tolerance (\|v - key\| < tol) | 89.5% | 0.5% | 10.4% |
| relative-tolerance (\|v - key\|/\|key\| < tol) | 90.3% | 0.5% | 9.6% |
| exact-match (v === key) | 0.0% | 24.4% | 75.6% |
| enclosure (v in certified [lo,hi]) | 0.0% | 0.0% | 100.0% |

And the curve that carries §3.2 — absolute-tolerance false-accept as the tolerance tightens:

`1e-3` → 99.4% · `1e-4` → 99.4% · `1e-6` → 99.4% · `1e-8` → 95.3% · `1e-9` → 93.6% · `1e-10` → 92.1% · `1e-12` → 88.9% · `1e-14` → 77.5% · `1e-15` → 44.4%

It declines, and Proposition 1 says exactly why: the band closes **fact by fact**, as `tol` drops below
half that fact's width. The aggregate reaches zero only when the tolerance is under half the width of
*every* certificate in the corpus — at which point the grader has become certificate-grounded for all of
them, and has paid for it in false rejects. At `1e-15`, a
tolerance at the edge of what a double can carry, it still accepts 44.4% of submissions that are proved wrong —
those whose certificates are wider than 2e-15.

### 3.4 The strictness tradeoff is not fundamental

Ray reports the cost of strictness as an operational fact: a SymPy-backed replacement removes the
measured false positives, but acceptance falls from 0.500 to 0.400 and coverage from 0.900 to 0.760.
Narrowing the accepted *language* buys soundness and pays in rejection.

The exact-match row above reproduces that shape — 0.0% false-accept at
24.4% false-reject — and the certificate-grounded row breaks it: 0.0% and 0.0%. The tradeoff is an artifact of grading against a
decimal. A certificate does not narrow the accepted language heuristically; it *defines* it, and the
definition is exactly the set of values not yet refuted.

### 3.5 One canary that is not synthetic

Every family above is constructed. One is not. The corpus fact `erdos852.cstar` carries the value a real
problem thread published for the quantity, `0.0752403861777`, which lies outside this
lab's certificate by `6.09e-13` and inside any ordinary tolerance of it. It is a member of the acceptance band that nobody had to mint:
it was printed, in public, as a result.

---

*Sections 1 and 4-11 are outlined and unwritten. Generated by `tools/build-paper-grading.js` from
`certs/envs-record.json`; git `6750a59`.*
