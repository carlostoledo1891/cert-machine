# instruments/agtable — findings against Ashrafyan–Gomes arXiv:2403.02785v2

Written 2026-09-07 while building reports/agtable.html. Numbers are from
certs/agtable-redecided.json and are re-derived at every build.

## 1. What the paper prints, and what is pinned

§8.1 (test 1): l₀ = α²/2, V = (x − ¼)²/2, ū ≡ 0, the bump m̂ = exp(−1/(1 − (1.1x)²)),
Q̇ = 5 sin 3πt − 4Q, Q(0) = −½, T = 1, domain [−1, 1]; Table 1 (p. 24), ε = 0.004.
§8.2 (test 2): l₀ = 3|α|^{4/3}/4, V = x, ū ≡ 0, the bump with 1.2; Table 2 (p. 27),
ε = 0.0002. Both tables: ρ = 2h at ρ = 0.02, 0.01, 0.005, 0.0025; columns ϖ, u at
t = 0, m at t = T; "relative errors in l∞ norms". Pinned in corpus/…/tables.json.

## 2. The analytic solutions, enclosed

- Q, K = ∫₀ᵗQ and ∫ₜ¹K in closed form (π, e as intervals). Q(1) ∈ [0.44861785366967, …],
  K(1) = 0.0281037750690…, ∫₀¹K = 0.00060317547597….
- Test 1 price ϖ₁ = −Q + (1 − t)/4 − ∫ₜ¹∫₀ˢQ: the paper's semi-explicit formula with
  ∫x m̄ = 0 (the bump is even). Width ≤ 2e−14 on the finest grid.
- Test 1 value function u = a₀ + a₁x + a₂x²: a₂ = ½ tanh(1 − t) (Riccati, closed);
  a₁ = Π − 2a₂K with Π = ∫ₜ¹(K − ¼) (from the averaged dynamics); a₀(0) =
  −∫₀¹[(Q + tanh(1 − s)K)²/2 − 1/32] ds enclosed to 7e−8 by the midpoint rule with
  the remainder from a second-order interval jet (instruments/interval/taylor2.js,
  new). The float Riccati route (RK4, 20 000 steps) lands inside every enclosure.
- The clearing identity ϖ + a₁ + 2a₂K = −Q encloses 0 at 21 times (half-width ≤ 1e−13).
- Test 1 density: the flow is affine, so m(x, t) = m̄((x − K(t))/σ(t))/σ(t) with
  σ(t) = cosh(1 − t)/cosh(1); σ(1) = 0.648054….
- Test 2: ϖ₂ = −Q^{1/3} − (1 − t) with a verified cube root (cubing the enclosure
  contains the argument); u(x, 0) = −∫₀¹|Q|^{4/3}/4 + x with the integral enclosed to
  2e−7 (midpoint + f″ off the zeros of Q, a Riemann bound through them); m(x, T) =
  m̄(x − K(1)).

## 3. The scheme, written from the paper

sl.js follows §4 and the algorithm on p. 22. Two choices the paper leaves open:
the inner infimum over α (Mathematica FindMin in the paper) is solved EXACTLY
here — the objective is convex on each P1 cell with a closed-form stationary
point — and a foot leaving [−1, 1] is held at the wall (the paper shortens h
for that node). A binary search over cells, valid because u is convex, is
checked bit for bit against the brute force (battery S1). The transport
conserves nodal mass to 1e−12.

## 4. The verdicts (at the paper's ε)

Test 1: price 1.23e−2, 6.04e−3, 3.27e−3, 2.07e−3 vs printed 1.2e−2, 6.0e−3,
3.3e−3, 2.1e−3 — REPRODUCED at every mesh. u: 2.67e−2, 1.32e−2, 6.31e−3,
2.83e−3 vs 2.5e−2, 1.1e−2, 4.7e−3, 1.2e−3 — NEAR, then DIFFERS by ×1.20,
×1.34, ×2.36. m: 9.31e−2, 4.69e−2, 2.28e−2, 1.06e−2 vs 8.8e−2, 4.2e−2, 1.8e−2,
6.7e−3 — NEAR, NEAR, ×1.27, ×1.58.
Test 2: u and m REPRODUCED at every mesh (8.53e−3 … 6.5e−3; 5.27e−2 … 6.6e−3);
price 2.66e−2 (NEAR), 1.33e−2 (R), 6.6e−3 (NEAR), 3.3e−3 vs 3.9e−3 (the port
does better, ×0.85).
Totals: 13 reproduced, 5 near, 6 differ. The u and m of test 1 at fine
meshes carry the two open choices (the density's feet and the wall); no
printed number is called wrong.

## 5. Two things the tables could not show

**The tolerance is inside the finest number.** At ε = 1e−8 (15 iterations)
the finest price error of test 1 is 1.49e−3 against 2.07e−3 at ε = 0.004:
39 % of the printed 2.1e−3 is tolerance. The printed price ratios
2.0, 1.8, 1.6 become 2.03, 2.02, 2.01 — first order — once ε is out of the
way. Test 2's implicit update converges to 1e−12 in three iterations; its
tables do not depend on ε.

**The density as printed is not one.** "exp(−1/(1 − (λx)²)) for |x| < 1" has a
positive, unbounded exponent on 1/λ < |x| < 1: on the sliver
[1/λ + 0.001, 1/λ + 0.002] its mass is at least 4e95 (λ = 1.1) and 6e87
(λ = 1.2). The figures and the digits show the authors used the bump with
support |x| < 1/λ. A typo that a table of digits rests on.

## 6. Not done

The paper's comparisons with the variational (Ashrafyan–Bakaryan–Gomes–
Gutierrez) and recurrent-network methods; the authors' code (unpublished);
intermediate meshes; the "shorten h at a node whose foot leaves the domain"
variant of the scheme.
