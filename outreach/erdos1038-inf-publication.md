# STAGED — Erdős #1038 infimum results, two venues (post only on the operator's word)

Tone note, deliberate: the #1038 forum currently has an open question about
announcement etiquette (tdarv, on the proof-claims page, asking what the norms
are for claiming a proof). Both drafts are therefore written to be *useful and
non-competitive*: we claim no proof, we take no priority, we verify other
people's constructions, and we disclose AI involvement explicitly.

---

## A. erdosproblems.com forum, thread 1038 — OPERATOR POSTS (needs the account)

**Title:** Certified bounds on the infimum, and Problem 4.1 answered for all ε

Some machine-checked results on the infimum side, offered as verification
infrastructure rather than as a competing claim. Everything below is
outward-rounded interval arithmetic with certificates you can re-run; nothing is
decided in floating point, and none of it assumes any of the three proof claims
now listed for this problem.

**1. An unconditional bracket.**

    1.828 ≤ inf ≤ 1.8344304971959906

The upper end is an explicit measure (a point mass at −1 plus an arcsine-type
density on [a,1], a = 0.804462), with the set structure settled by three
one-line lemmas. The lower end is a pure forcing argument: no tail estimate, no
assumed minimizer, no argument by contradiction. Its only analytic input beyond
interval arithmetic is the symmetry of the mutual energy. It costs 86 boxes and
265 seconds, and a second checker that shares no code with the certifier
re-derives the tiling and hunts counterexamples in doubles.

**2. Problem 4.1 (Tao's notes) — answered affirmatively for every ε ∈ (0, 0.1].**
624,275 certified ε-chunks cover [1e-12, 0.1], and a separate sliver lemma
closes (0, 1e-12] using the substitution t = ζ₁ − 1, under which the ε → 0
singular pole cancels algebraically rather than numerically. The two-interval
scenario is therefore excluded across the whole range.

**3. The three λ^(ε) duals posted in this thread are certified.** They had been
validated by sampling, which cannot decide positivity of a potential with poles.
All three have every weight positive and U_λ ≥ 0 on all of [−1,1], proved by
adaptive tangent envelopes on each gap between support points — no quadrature,
no grid. Certified off-atom minima 1.243e-5, 2.653e-6, 3.959e-6.

**4. A warning that may save someone a week.** As ε → 0 the margin at x = −1
tends to a constant δ fixed by the level defect of the primal constants. With
rounded constants δ can land on either side of zero, and if it lands negative
the family *provably fails* below roughly |δ|/0.21 — for us that was ε ≈ 4.3e-8.
We did not predict this; the certifier returned a decisively negative window and
the mechanism was worked out afterwards. Anyone building small-ε duals from
midpoint decimals will hit it. Every construction posted here sits far above it.

Page, certificates and instrument: https://carlostoledo.co/reports/erdos1038-inf.html
Write-up: https://carlostoledo.co/paper/erdos1038-inf.pdf

On the three claimed proofs: I have not audited any of their analytic cores and
make no judgement about them. I did separately re-verify the *computational
appendix* of the Darvas–Peng–Tao manuscript — existence and local uniqueness of
the extremal triple by an interval Krawczyk operator, and all thirty printed
decimals of D. That says nothing about the rest of the argument. My bracket
contains D, which is corroboration and not confirmation.

*AI-involvement disclosure, since the norm here is under discussion:* this work
was produced with heavy AI assistance in a certified-verification setup — the
mathematics is proposed by a model and every quantitative claim is decided by
interval-arithmetic certificates with adversarial controls that must fire. The
certificates, not the model, are the evidence, and they are public and
re-runnable.

---

## B. GitHub teorth/erdosproblems issue #179 — MACHINE CAN POST

Context: #179 is the "Beat the AI" thread on #1038 and already carries our
supremum-side comment. This is a short pointer to the other end, not a re-post.

**Command on approval:**

```
gh issue comment 179 --repo teorth/erdosproblems --body-file <the body below>
```

**Body:**

Following up on the supremum side above with the other end of the same problem,
in case it is useful here: a certified unconditional bracket on the **infimum**,

    1.828 ≤ inf ≤ 1.8344304971959906,

both ends in outward-rounded interval arithmetic. The lower bound is a pure
forcing argument — no tail, no assumed minimizer, no contradiction — whose only
analytic input beyond the arithmetic is the symmetry of the mutual energy; it
runs in 265 s over 86 boxes and is re-checked by an independent verifier that
shares no code with the certifier.

Two by-products that may matter more to this thread than the bound: **Tao's
Problem 4.1 is answered affirmatively for every ε ∈ (0, 0.1]** (624,275
certified chunks plus a sliver lemma for the singular limit), and the three
λ^(ε) dual measures posted on the erdosproblems forum thread are now certified
rather than sampled (tangent envelopes, no grid).

Nothing here assumes or adjudicates any of the three claimed proofs of this
problem; the bracket contains their common value D, which is corroboration, not
confirmation. Machine-derived, not peer-reviewed. Page, certificates and
instrument: https://carlostoledo.co/reports/erdos1038-inf.html
