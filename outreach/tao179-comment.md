# Comment for teorth/erdosproblems#179 — DRAFT; verify record numbers at post time

Post AFTER certs/sublevel-tao179.json is committed and pushed (links must
resolve). Numbers below must match the record exactly; the deg-8/deg-9 lines
are included only if those runs landed.

---- PASTE BELOW THIS LINE ----

Some certified progress on the **supremum** side, from the same
certified-arithmetic engine behind [the λ(4) result](https://github.com/teorth/erdosproblems/issues/392).

For rational weights with denominator $N$, $U_\mu(x) < 0$ is exactly
$|q(x)| < 1$ for a monic degree-$N$ polynomial $q$ with roots in $[-1,1]$, so
the conjecture restricted to such measures is a statement about
root-constrained polynomials, decidable degree by degree. Using exact BigInt
Sturm isolation for the sublevel measures and a branch-and-bound over root
boxes with the pointwise bound $|q_r(x)| \ge \prod_i \mathrm{dist}(x, I_i)$
(whose sublevel measure is computable exactly, and which equals the true
measure on thin boxes):

**Per-degree theorems (certified).**
- Odd degrees $N = 3, 5, 7$: every monic degree-$N$ polynomial with roots in
  $[-1,1]$ has $|\{|q|<1\}| < 2.82 < 2\sqrt{2}$ — the whole degree falls
  strictly below the conjectured supremum. (Certificate trees are small: 127
  boxes for $N=3$.)
- Even degrees $N = 4, 6$: the degree supremum lies in
  $[2\sqrt{2},\, 2.82845]$, the left end attained by $(x^2-1)^{N/2}$ — so
  among these measures the conjectured extremizer is within $2.3\times10^{-5}$
  of optimal.

**Certified landscape data.**
- The degree-3 supremum is at an *interior* critical root: the champion shape
  is $(-1, r, 1)$ with $r \approx 0.785$, value $\approx 2.75417$ (certified
  enclosure at $r = 201/256$).
- The family $(x^2-1)^2(x-r)$ peaks near $r = 905/1024$ at $\approx 2.80109$
  and then drops discontinuously — a topological transition of the sublevel
  set (two components merge). The odd-degree suprema appear to increase
  toward $2\sqrt{2}$: $\approx 2.754,\ 2.801,\ (<2.82)$ for $N = 3, 5, 7$.

All quantities are outward rational enclosures; nothing is decided in
floating point. The instrument, the branch-and-bound certificates, and a
battery with red controls are in the repository
([instruments/sublevel](https://github.com/carlostoledo1891/cert-machine/tree/main/instruments/sublevel),
record `certs/sublevel-tao179.json`); everything re-derives in one command.
Machine-derived and not peer-reviewed; the full conjecture (all $N$, and the
even-degree equality characterization) remains open. Happy to push the degree
ladder further or aim the instrument at whatever variant is most useful.

---- END PASTE ----
