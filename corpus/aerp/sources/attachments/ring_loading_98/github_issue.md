**Title:** Problem 61 (Ring Loading): new lower bound C ≥ 9/8, exact certificate with m = 14

---

Following up on #11 by @VividhDesign (exact certificate for 47/42): here is an explicit instance that gives

**C ≥ 9/8 = 1.125 > 47/42 ≈ 1.1190.**

### Certificate (m = 14, all values are multiples of 1/16)

| i | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|----|----|----|----|----|
| 16·u_i | 6 | 3 | 12 | 8 | 2 | 11 | 4 | 5 | 12 | 8 | 2 | 13 | 2 | 12 |
| 16·v_i | 2 | 13 | 2 | 8 | 12 | 5 | 4 | 11 | 2 | 8 | 12 | 3 | 6 | 4 |

All u_i, v_i ≥ 0 and u_i + v_i ≤ 1. For every one of the 2^14 choices z_i ∈ {v_i, −u_i} some
k ∈ {1,…,m} has |Σ_{i≤k} z_i − Σ_{i>k} z_i| ≥ 9/8, and 52 choices attain exactly 9/8.

### Verify (exact arithmetic, a few seconds)

```python
import itertools
from fractions import Fraction as F
P = [(6,2),(3,13),(12,2),(8,8),(2,12),(11,5),(4,4),
     (5,11),(12,2),(8,8),(2,12),(13,3),(2,6),(12,4)]
u = [F(a,16) for a,b in P]; v = [F(b,16) for a,b in P]; m = len(P)
assert all(a + b <= 1 for a, b in zip(u, v))
alpha = min(max(abs(sum(z[:k]) - sum(z[k:])) for k in range(1, m+1))
            for z in itertools.product(*[(v[i], -u[i]) for i in range(m)]))
print(alpha, alpha > F(47, 42))   # 9/8 True
```

**Note on the notebook convention.** `compute_alpha_exact` in the notebook takes k = 1..m−1.
With a (0,0) pair added at both ends (m = 16) the two conventions coincide, and the notebook's
`compute_alpha_exact`, copied verbatim, returns `1.125` on the padded instance (on the unpadded one it
gives 0.75, as expected under k = 1..m−1):

```
u = [0, 6, 3, 12, 8, 2, 11, 4, 5, 12, 8, 2, 13, 2, 12, 0]   # divide by 16
v = [0, 2, 13, 2, 8, 12, 5, 4, 11, 2, 8, 12, 3, 6, 4, 0]    # divide by 16
```

(One of the `get_score` versions in the notebook also contains search heuristics such as
`min(u) < 0.05 → −1`, which reject the padded instance; `compute_alpha_exact` is the actual evaluation.)

The value was also confirmed by an integer brute force and an exact dynamic program (both in C, included in the attached zip).

### How it was found

Simulated annealing over palindromic instances on the grid 1/84 (exact DP evaluation)
reached 94/84 = 47/42 for m = 17–21. Refining the best annealing outputs in continuous variables
by sequential linear programming lifted several of them to exactly 9/8. This value is
94.5/84 and so is not on that grid. Rationalizing and deleting redundant pairs gave the
m = 14 instance above (its first 13 pairs are palindromic). A trust-region MILP suggests
(numerically, not a proof) that the instance is locally optimal within ℓ∞-radius 0.02.

A short write-up (PDF) and a zip with the certificate files and code are attached.

If useful, I can open a PR updating `status.json` and the comments on `problems/61.html`.

*Disclosure: the search code and write-up were produced with the help of an AI assistant (Claude, Anthropic); the result was verified by exact computation as described above.*
