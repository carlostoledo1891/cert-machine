# Comment for teorth/erdosproblems#179 — POSTED 2026-09-01 with operator approval
# https://github.com/teorth/erdosproblems/issues/179#issuecomment-5492843637

Record: certs/sublevel-tao179.json @ the pushed head. All numbers below match
the record: odd 3/5/7 strict, even 4/6/8 localized, deg9 attempted-open.

---- PASTE BELOW THIS LINE ----

Some certified progress on the **supremum** side, from the same
certified-arithmetic engine behind [the λ(4) result](https://github.com/teorth/erdosproblems/issues/392).

For rational weights with denominator $N$, $U_\mu(x) < 0$ is exactly
$|q(x)| < 1$ for a monic degree-$N$ polynomial $q$ with roots in $[-1,1]$, so
the conjecture restricted to such measures is a statement about
root-constrained polynomials, decidable degree by degree. Using exact BigInt
Sturm isolation for the sublevel measures, and a branch-and-bound over root
boxes pruning with the pointwise bound $|q_r(x)| \ge \prod_i \mathrm{dist}(x, I_i)$
(whose sublevel measure is computed the same way, and which equals the true
measure on thin boxes):

**Per-degree theorems (certified).**
- **Odd degrees $N = 3, 5, 7$:** every monic degree-$N$ polynomial with roots
  in $[-1,1]$ has $|\{|q|<1\}| < 2.82 < 2\sqrt{2}$ — the whole degree falls
  strictly below the conjectured supremum. (Certificate trees are small:
  127 boxes for $N=3$, 28,773 for $N=7$.)
- **Even degrees $N = 4, 6, 8$:** the degree supremum lies in
  $[2\sqrt{2},\, 2.82845]$, the left end attained by $(x^2-1)^{N/2}$ — so
  among these measures the conjectured two-atom extremizer is within
  $2.3\times10^{-5}$ of optimal.
- Degree 9 was attempted and is recorded open (box budget), not silently
  dropped.

Together: **every discrete probability measure on $[-1,1]$ whose weights have
denominator $\le 8$ satisfies the conjectured bound.**

**Certified landscape data.**
- The degree-3 supremum is at an *interior* critical root: the champion shape
  is $(-1, r, 1)$ with $r \approx 0.785$, value $\approx 2.75417$ (certified
  enclosure at $r = 201/256$).
- The family $(x^2-1)^2(x-r)$ peaks near $r = 905/1024$ at $\approx 2.80109$
  and then drops discontinuously — a topological transition where two
  components of the sublevel set merge. The odd-degree suprema climb toward
  $2\sqrt{2}$: $\approx 2.754,\ 2.801,\ (<2.82)$ for $N = 3, 5, 7$.

All quantities are outward rational enclosures; nothing is decided in
floating point. Instrument, branch-and-bound certificates, battery with red
controls, and a page with the certified family curves:
[instruments/sublevel](https://github.com/carlostoledo1891/cert-machine/tree/main/instruments/sublevel) ·
record `certs/sublevel-tao179.json` ·
[the report page](https://carlostoledo.co/reports/erdos1038-sup.html).
Everything re-derives in one command. Machine-derived and not peer-reviewed;
the conjecture itself (all measures, and the even-degree equality
characterization) remains open. Happy to push the degree ladder further or
aim the instrument at whichever variant is most useful.

---- END PASTE ----
