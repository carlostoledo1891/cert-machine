# instruments/lonelyrunner — a clean-room decider for the prime gates of the lonely runner proofs

Written from the TEXT of J. Allikvere, *Fifteen lonely runners* (arXiv:2609.02604 v2; pinned in
`corpus/lonely-runner/lrc14-allikvere/`), Sections 2 and 4, and the definitions it recalls from Sungkawichai and
Trakulthongchai (arXiv:2604.23906). The author's programs were not opened before this decider's results were recorded
(`corpus/lonely-runner/preregistration.json`). Nothing here is derived from them.

## What one gate decides

Fix `k` speeds (`k = 14` for fifteen runners) and a prime `p`. Write `K1 = k + 1`, `d_N(x) = min(x mod N, N - x mod N)`.

- A vector `w` of `k` residues modulo `lp` with no coordinate divisible by `p` is **proper at level `l`** if
  (a) for some `i`, `gcd(l, w_j : j != i) > 1`, or (b) some time `t = c/(lp)` is a **witness**:
  `K1 * d_{lp}(c * w_i) >= lp` for every `i`. Otherwise it is **improper**.
- The **lifts** of `w` from level `l` to level `f*l` are the `f^k` vectors `w_i + a_i*l*p`, `a_i` in `0..f-1`.
- A level-1 vector `r` is **eventually proper** if at some level all its lifts are proper. A gate is **CLOSED** when
  every level-1 vector is eventually proper (then `J(k,p)` is empty and `p` divides the product of the speeds of any
  primitive counterexample), or — the paper's Lemma `lem:gate`(ii) with `lem:neargcd` — when the vectors left at the
  terminal level are all handled by the few-exception shift lemma.

## The four stages, and why each is complete

**Classes and covering.** The classes are `Z_p^x / {+1,-1}`, represented by `1..n`, `n = (p-1)/2`. At level 1 the
witness test reads: time class `c` is *covered* by speed class `v` when `K1 * d_p(c*v) < p`. A level-1 vector is
improper exactly when every time class is covered by one of its coordinates. Units (`v -> u*v mod p`) and sign
changes preserve eventual properness, so rows are multisets of classes taken up to units.

**Stage 1 — every improper level-1 row, up to units.** An improper row `M` is a `k`-multiset whose support covers
every time class. Its support contains a *minimal* cover `T` (remove classes while the rest still covers); every class
of `T` then covers some time no other class of `T` covers (its *private* times). So
`M = T + E` with `E` a multiset of size `k - |T|`.

- *Minimal covers.* Counting incidences: if `n_1` times are covered once and the rest at least twice, then
  `n_1 + 2(n - n_1) <= |T| * m`, where `m = floor((p-1)/K1)` is the number of time classes one speed class covers.
  So `n_1 >= 2n - |T| m`, and some class of `T` owns at least `q = ceil(max(0, 2n - k m)/k)` private times (the bound
  for `|T| = k`; it is smaller than the bound for any smaller `|T|`). A unit moves that class to `1`.
- *The search.* A depth-first search over sets containing class `1`: at each node it picks the uncovered time class
  with the fewest admissible covering classes and branches on them in increasing order, forbidding in branch `j`
  the candidates `1..j-1` of the same node — every cover that contains the chosen set and avoids the forbidden
  classes contains exactly one first candidate, so every such set is reached exactly once. It prunes a node when a
  chosen class has no private time left (adding classes never restores one), when class `1` has fewer than `q`
  private times, when no class can cover the chosen uncovered time, or when the uncovered times exceed
  `(slots left) * m`. A leaf is a cover with `<= k` classes in which every class owns a private time.
- *One representative per orbit.* A found cover `T` is kept only if it equals the lexicographic minimum of the sorted
  sets `x^{-1} T` over the classes `x` of `T` that own at least `q` private times. These normalisations are exactly
  the sets in `T`'s orbit that the search reaches, so each orbit is kept once.
- *Rows.* For a kept `T` with `|T| = s`, every multiset `E` of size `k - s` over all `n` classes gives the row
  `T + E`. Every improper row is a unit image of one of these. Rows may repeat across different `T`; repeats cost
  time, never completeness. Rows are counted before and after merging by orbit.

**Stage 2 — binary lifting.** For each row, the improper lifts at levels 2, 4, 8, 16, 32. Only times new at the
level can be witnesses (a time of the previous level gives the same distance for every lift, and the vector was
improper there), so the test runs over the new times only: a depth-first search over the `k` digits keeps the set of
new times still good for every digit chosen so far, drops a subtree as proper as soon as one of those times is good
for every remaining digit of every remaining coordinate, and emits a lift as improper only if no time survives and
the gcd condition fails. The row is eventually proper when its improper set becomes empty.

**Stage 3 — the terminal level.** For rows that survive level 32, the level `L = k+1` is examined (`15 = 3*5` for
`k = 14`): the witness-free lifts at each prime-power factor `f` of `L` are found by the same search, combined
digit by digit by the Chinese remainder theorem, and each candidate is tested on the times of level `L` new with
respect to both factors, then by the gcd condition `gcd(L, w_j : j != i) > 1`. A witness-free lift at level `L`
reduces to witness-free lifts at its factors (a witness at a factor level is a witness at `L`), so no lift is missed.

**Stage 4 — the few-exception shift lemma.** A lift left improper by the gcd condition is handled when, for a prime
`d | L`, the number `e` of coordinates not divisible by `d` satisfies `2 <= e` and `e * ceil(2d/K1) < d` (paper,
Lemma `lem:neargcd`, which assumes the lonely runner conjecture for `k - 2` speeds). Anything left is **OPEN AT p**.

## Programs

- `ref.py` — a slow reference written straight from the definitions above (every multiset, every lift, every
  time), for small `k` and `p`; the battery compares the fast decider with it.
- `lr.c` — the fast decider (`cc -O3 -o lr lr.c`); one gate per run, a JSON record of every count on stdout.
- `battery.py` — the red controls of the pre-registration.
