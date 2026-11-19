# A pack for one outside reader — the two theorems behind the lower bound

STATUS (2026-11-19): DRAFT, nothing sent. The operator chooses the reader and sends it. The reader should know
stochastic thermodynamics or convex duality, should NOT have seen this work, and should not be an AI model of either
family that wrote it. A second reading of Theorems D and C is what would move the lower end of the interval from
READ ONCE to READ TWICE. Nothing else on the page depends on them.

---

## The message (to adapt; first person, mine)

Subject: two short proofs to check — a lower bound on hidden dissipation from snapshot correlations

I would be grateful for an hour of your reading on two short proofs.

A. V. Dobrynin and A. Stroujkova (arXiv:2611.24898, 18 November 2026) showed that a binary record that looks the same
forwards and backwards in time can still force any finite Markov model behind it to dissipate, and left the least
dissipation open. In a narrower version of that question, the observer reads the lamp at the times of a Poisson clock
and knows only two correlations, C1 = E[f(X0) f(X1)] and C2 = E[f(X0) f(X2)]. Two AI models (OpenAI's GPT and
Anthropic's Claude), working together under my direction, bounded the least dissipation for (C1, C2) = (3/10, 2/25):
0.36572 ≤ σ/r ≤ 0.37713. The upper end is a 156-state network checked in exact interval arithmetic. The lower end comes
from a certificate whose conditions I checked in exact rational arithmetic, but it is a lower bound only if two
theorems hold. One model proved them and the other re-derived them. No person has read them.

> **Theorem D (weak duality).** If functions ψ, β, γ on the labels Ω = [−1,1]² × {±1} and numbers l1, l2, μ satisfy
> a pointwise inequality (D1) and a pair condition (D2), then every finite network has σ/r ≥ l1 C1 + l2 C2 + μ.
>
> **Theorem C (locality).** For continuous, piecewise-smooth ψ, β, γ, the pair condition (D2) follows from a 2×2
> matrix inequality at each single point, by cutting an edge into a chain of massless states (Lemma S).

They take about four pages together (two short notes, attached). Do they hold, and if not, where do they break?

If they hold, the lower bound needs nothing else: the certificate's finite conditions are checked by a program written
from these notes alone, and agree with two other programs. If you find a gap, that is an answer too.

Thank you for considering it. I did this with Claude (Anthropic's AI model), which wrote the programs and drafted this
note under my direction.

Carlos Toledo

---

## What to attach or link (all public once the record is pushed)

- The two notes: `corpus/blinking-light/run/claude/lifting.md` (Theorem D is its section 3; sections 1–2 are the
  lifting, which the bound does not use) and `corpus/blinking-light/run/claude/locality.md` (Lemma S and Theorem C).
- The other model's readings: messages g19 (Theorem D) and g39 (Theorem C) in `corpus/blinking-light/run/CHAT.md`.
- The certificate and its checker: `corpus/blinking-light/run/claude/cert222g.json`, `instruments/blinking-light/lower.py`
  and its account, limits first, `instruments/blinking-light/CHECKERS.md`.
- The report: https://carlostoledo.co/reports/blinking-light.html

## What each step rests on

| Step | Where | Standing |
|---|---|---|
| F1, F2, F3: the resolvent identities for w = Kf, v = K*f and the two correlations | lifting.md §1 | on paper, one line each; tested on random networks in floats in the run (k17) |
| (a − b) ln(a/b) ≥ a t + b t′ for (t, t′) in K0, and its quadratic sufficient form | lifting.md §3 | on paper |
| Theorem D: the summation over edges | lifting.md §3 | on paper; re-derived by GPT (g19); the summation tested in floats (k18) |
| Lemma S: an edge cut into n edges through massless states, at no cost | locality.md | on paper; re-derived by GPT (g39) |
| Theorem C: Taylor at the chain's midpoints, the crossing edges bounded | locality.md | on paper; re-derived by GPT (g39) |
| (D1) and the matrix inequality for cert222g over the whole diamond | the certificate | DECIDED here in exact arithmetic (L1), by a checker written from the notes |
