# Exactness in the loop — amendment 1

**2026-10-25, approved by the operator ("go", after "A1 and A2"). Written after the pilot and before any confirmatory
run.** It amends protocol/exactness.md (sha256 ac38172e2335f0097a3d4a236a8b804952e021e4a8ea60077cb20b871c574a8f),
whose bytes do not change; every record names both files' sha256.

## What the pilot showed

`exactness-pilot` (strata/exactness-pilot.json, 246 s on 4 workers) ran the three arms from PM-1 with the hidden
hexagonal gene for 100 generations. No arm ever selected a parent that decision/2 does not certify (0 false parents,
largest violation 0), so the three arms bred the same 919 children and reached the same champion (training
0.2157476, panel 0.2051557); none found the hexagonal step. Two consequences:

1. **The repair made a verdict out of nothing.** §3's repair takes τ from every radius, certified or not, so T's
   champion lost about 5 × 10⁻⁶ on the panel against an identical X champion. Sixteen identical runs would each give
   dᵢ ≈ −5 × 10⁻⁶: whenever the guard on "some arm gained δ" held, the interval would lie below 0 and §6 would read
   "exactness helps", a verdict made by the repair's constant, not by the search.
2. **The tolerance was out of reach.** PM-1's `fit()` checks every condition exactly, in integers, before a candidate
   leaves the program. To send a candidate that only the tolerant reading accepts, a child needs two changes at once:
   the check removed and the radii enlarged. So the founder certifies itself, and the question of §1 (what a tolerant
   checker does to a search whose candidates are not self-checked, as in the systems §1 names) is not asked.

## A1 — the repair touches only what decision/2 refuses

§3's repair is replaced by: **a candidate is repaired (every radius less τ) only when its digits do not satisfy the
niche's conditions exactly as written; a candidate that does is left as it is.** The proof of §3 holds unchanged for
every repaired candidate that T accepted. Identical searches now give dᵢ = 0 exactly. It applies to every arm-T
panel score in every run, the pilot excepted (the pilot is reported as run, under §3).

## A2 — a second founder, whose program does not check itself

Every run of §4 is also run from **PM-1u**: PM-1 with the hidden hexagonal gene, identical except that `fit()` sends
its first scaling (1 − 10⁻⁹) without the exact check, i.e. the lines

    for shrink in (1e-9, 1e-6, 1e-3):
        R = [math.floor(lam * (1 - shrink) * r * D) for _, _, r in p]
        if feasible(X, Y, R, h):
            return [X, Y, R]
    return None

become

    for shrink in (1e-9, 1e-6, 1e-3):
        R = [math.floor(lam * (1 - shrink) * r * D) for _, _, r in p]
        return [X, Y, R]
    return None

derived from organisms/pm-1/main.py by that one replacement (tools/exactness.py asserts it) and pinned by the
sha256 of the result. PM-1u's own output is the same as PM-1's (its first scaling always certifies on the grid); one
mutation of the scaling now reaches the tolerance.

- **Runs:** `exactness-u-pilot` (inspected, never tested) and `exactness-u-1` to `exactness-u-16`, named here, with
  the same training sets and seeds as `exactness-1` to `exactness-16` (each run's training set and seed come from its
  index: `exactness-u-k` uses `exactness-k`'s).
- **Analysis:** §5 and §6 are applied to each founder separately, PM-1 (the self-checking founder) and PM-1u (the
  unchecked one), each with its own primary, S1, S2 and existence, each read once. No test pools the two founders.
  Descriptively, the two founders' S2 rates are reported side by side: what the founder's own exact check is worth.
- **Expected (written before data):** under PM-1u, T admits false parents early and its unrepaired champion is false
  in most runs; X is unaffected by the change except that children that break the scaling now die; D rarely differs
  from X. Whether the repaired T champion trails X depends, as before, on discovery of the hexagonal step.

## Nothing else changes

τ, the arms, the budget, δ, the tests, the red controls (plus one for A1: a certified candidate passes the repair
unchanged) and the disclosed limits are §§3–9's. Cost: about 2.2 h on this Mac's CPU at 4 workers, US$ 0.
