# Certified bounds for the Brezis–Gallouët–Wainger remainder constant on the 2D torus

Constant: C_16 = L in [teorth/optimizationproblems, page 16a](https://teorth.github.io/optimizationproblems/constants/16a.html).

**Result:** 2.1562247706 ≤ L ≤ 2.1562256466

- **Lower bound.** L = max_δ [4πΘ(δ) − ln δ − ln(1+ln δ)], and any zero-mean trigonometric polynomial u gives |u(0)|²/‖∇u‖² ≤ Θ(δ(u)). The trial function is u = Σ_{0<|k|≤4000} e^{ik·x}/(|k|²(1+μ|k|²)) with μ = 1221/10000. Its lattice sums are enclosed with outward-rounded integer arithmetic. Certificate: `lower_certificate.json`; checker: `verify_c16_lower.py`.
- **Upper bound.** By Cauchy–Schwarz with weights |k|²(1+μ|k|²), for every μ > 0: |u(0)|² ≤ S1(μ)(1+μδ)/(4π²) · ‖∇u‖², where S1(μ) = Σ_{k≠0} 1/(|k|²(1+μ|k|²)). Hence F(δ) ≤ S1(μ)(1+μδ)/π − ln δ − ln(1+ln δ). This bound is convex in δ, so the endpoints of each box suffice:
  - a branch-and-bound over δ ∈ [1, 4.9·10⁸] (84 boxes), using a truncated S1 with a proven tail bound;
  - the choice μ = 1/(δ ln δ) bounds F by 2.0587 on [4.9·10⁸, ∞).

  Certificate: `upper_certificate.json`; checker: `verify_c16_upper.py`. The checker uses exact integer ceilings and rational brackets for π, Catalan's constant and log. Both checkers need Python 3 and numpy.

Run: `python verify_c16_lower.py lower_certificate.json` and `python verify_c16_upper.py upper_certificate.json`. Both print VERIFIED.

The numerical value ≈ 2.15627 in Bartuccelli–Deane–Zelik (2013) lies above the certified upper bound.

License: CC0-1.0.
