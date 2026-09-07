# instruments/hbar — findings against Gomes–Yang arXiv:1810.03483v2

Written 2026-09-07 while building reports/hbar.html. Numbers from
certs/hbar-band.json, re-derived at every build.

## 1. What the paper prints

§6.1: for H = p²/2 + sin 2πx the exact H̄(P) is 1 for |P| ≤ P₀ = 4/π and the
inverse of ∫√(2(sin 2πs + c)) ds beyond (cited from Cacace–Camilli); Figure 1
compares the flow and Newton values at k = 10, 10², 10⁴ with the exact curve
(no table). §6.2: the separable H = |p|²/2 + cos 2πx₁ + cos 2πx₂ at
P = (1.5, 2.5), "H̄ = 4.4099660 according to [18]" (Gomes–Oberman 2004), and
Table 1: HRF 4.40251, 4.40916, 4.40989, 4.40996; NM 4.40935, 4.40994,
4.40996, 4.40996 at k = 10 … 10⁴. §6.4: H = p²/2 − sin 2πx at P = 0.5,
k = 100, "in this case H̄(P) = 1", Table 2: H̄◇ = 0.964609, 0.964754,
0.96476, 0.96476 at N = 15, 30, 60, 120. §6.2 also has a non-separable
example (sin 2πx₁ sin 2πx₂) with a surface plot and no numbers.

## 2. The enclosures

- P₀ = ∫√(2(1 − V)) for sin, cos, −sin: [1.2732366, 1.2732427] at 4096
  cells, each containing 4/π = 1.2732395… (the closed form: 2(1 − sin 2πx)
  = 4 sin²(πx − π/4)). The cusp cells take a Riemann bound.
- Q(c) = ∫√(2(c − V)) by the midpoint rule with f″ from the interval jet:
  widths 2e−7 (c = 3) to 7e−7 (c = 1.0001) at 2048 cells.
- The bracket on c: bisection until Q(mid) straddles |P|, then the mean
  value theorem with T_lo = min period over [lo, hi] as Q′: widths 1.5e−6 to
  2.0e−6 at 1024 cells across P = 1.275 … 3 (without the tightening the
  stalled bisection left brackets up to 1.7e−4).
- The band for V = sin 2πx at 22 P: 9 FLAT (= 1 exactly), 12 ROTATING,
  1 UNDECIDED (P = 4/π, inside the P₀ enclosure). Convex and continuous as
  intervals on the sample (battery B2, B3).
- The Mather density m = 1/(T(c)√(2(c − V))) at P = 1.5 and 2: the period
  enclosed (T ∈ [0.5172096, 0.5172102] at P = 2), the density integrating to
  1 within 1e−5 on the midpoints.
- Cross-checks: a 20 000-point trapezoid rule (geometrically convergent on
  a periodic analytic integrand) lands inside every bracket; Q(1.2) < Q(1.21)
  < Q(1.5) as disjoint intervals.

## 3. Their numbers

**Table 1.** c(1.5) ∈ [1.24463746, 1.24463771], c(2.5) ∈ [3.16532740,
3.16532789] (cosine, 8192 cells); sum H̄(1.5, 2.5) ∈ [4.40996523,
4.40996529]. The float trapezoid value is 4.4099652639. The quoted
4.4099660 lies ABOVE the enclosure by 7.1e−7: its seventh significant digit
is not the value's. Whether that is a rounding, a typo or a six-digit
computation printed with eight is not decided here; the number is taken
as the paper prints it and Gomes–Oberman (2004) was not consulted. The
paper's own k-sequence lies BELOW the enclosure at every k, as the entropy
penalized H̄^k = min (1/k) ln ∫e^{kH} ≤ H̄ must, and its k = 10⁴ value 4.40996
agrees with the enclosure to every digit it prints.

**Table 2.** P = 0.5 on −sin 2πx: 0.5 < P₀'s lower end, so FLAT, H̄ = 1
exactly. The printed H̄◇ sit 0.03524 … 0.03539 below 1, unchanged from
N = 60 to 120: the entropy penalization's gap at k = 100, not the mesh's.

## 4. Not done

The non-separable two-dimensional example (no formula; an inf–max upper
bound by a trial corrector would be the honest next step); H̄^k itself
(only the inequality H̄^k ≤ H̄ is used); a proof of the one-dimensional
formula; anything at the undecided point.
