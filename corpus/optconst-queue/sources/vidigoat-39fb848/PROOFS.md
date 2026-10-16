# Proofs of the four bounds

Each bound comes from one explicit object. Each script in this folder recomputes its value; the
arguments below show why the value is a valid bound. Definitions follow the pages of Terence Tao's
[optimization constants repository](https://github.com/teorth/optimizationproblems).

## 16a. Brezis–Gallouët–Wainger remainder constant: L ≥ 2.156224

L is defined as max over δ ≥ 1 of 4πΘ(δ) − ln δ − ln(1 + ln δ), where Θ(δ) is the supremum of
|u(0)|² over zero-mean u on the torus with ‖∇u‖² = 1 and ‖Δu‖² = δ. Any single admissible u therefore
gives L ≥ 4π|u(0)|²/‖∇u‖² − ln δ(u) − ln(1 + ln δ(u)), provided δ(u) ≥ 1.

On T² = [0, 2π]² take u(x) = Σ c_k e^{ik·x} over the lattice points 0 < |k|² ≤ 4000², with
c_k = 1 / (|k|²(|k|² + μ)) and μ = 41/5. This is the conditional extremal of Bartuccelli, Deane and
Zelik (2013), truncated. u is real (c_k = c_{−k}) and has zero mean. By Parseval,
‖∇u‖² = (2π)² S₁ and ‖Δu‖² = (2π)² S₂, and u(0) = S₀, where S₀ = Σ c_k, S₁ = Σ |k|² c_k², S₂ = Σ |k|⁴ c_k².
So δ = S₂/S₁ ≈ 3.93181 ≥ 1, and

    L ≥ S₀² / (π S₁) − ln δ − ln(1 + ln δ) = 2.15622475…

`bgw.py` computes the three sums over n = |k|², weighted by the number of lattice points with
|k|² = n, in interval arithmetic (mpmath.iv, 40 digits), so the printed lower end is rigorous. The
interval has width about 10⁻³⁴. The torus normalisation agrees with the source: as the cutoff grows,
the value approaches the 2013 paper's numerical value 2.15627 (cutoff 50: 2.15174; 200: 2.15592;
800: 2.15621; 4000: 2.156225).

## 20a. Thin-shell constant (variance form): C ≥ 8

C is the least constant with Var(|X|²) ≤ C n for every isotropic log-concave X in Rⁿ. Take n = 1 and
X = E − 1, with E a standard exponential variable. Its density e^{−(x+1)} on (−1, ∞) is log-concave,
E X = 0 and E X² = 1, so X is isotropic. The k-th central moment of E is Σ_j C(k, j)(−1)^{k−j} j!,
which is 0, 1, 2, 9 for k = 1, 2, 3, 4. So Var(X²) = E X⁴ − (E X²)² = 9 − 1 = 8 and C ≥ 8. A product of
n independent copies is isotropic and log-concave with Var(|X|²) = 8n, so the ratio is 8 in every
dimension.

`elementary.py` computes the moments exactly.

## 20c. KLS constant: C ≥ √3

ψ_μ = 1/h_μ, where h_μ = inf over A of μ⁺(A) / min(μ(A), 1 − μ(A)). For any single set A,
ψ_μ ≥ min(μ(A), 1 − μ(A)) / μ⁺(A). Take n = 1 and μ uniform on [−√3, √3]: mean 0, variance 3/3 = 1,
log-concave. With A = (−∞, 0], μ(A) = 1/2 and μ⁺(A) is the density at 0, 1/(2√3). So ψ_μ ≥ √3 and
C ≥ √3 ≈ 1.732051, against the listed √(π/2) ≈ 1.253314.

## 70a. Reverse Brunn–Minkowski constant: C ≥ 1.20192

C is the least constant such that every pair of symmetric convex bodies in every dimension n has some
u with |det u| = 1 and |u(B₁) + B₂|^{1/n} ≤ C(|B₁|^{1/n} + |B₂|^{1/n}). Take B₁ = [0, a]ⁿ (a cube, after
centring) and B₂ = rB, the ball of radius r. Let κ_m be the volume of the unit m-ball.

Let |det u| = 1. Then P = u(B₁) is a parallelotope spanned by vectors v₁, …, vₙ with |P| = aⁿ.

1. Steiner's formula: |P + rB| = Σ_j V_j(P) κ_{n−j} r^{n−j}, where V_j are the intrinsic volumes.
2. A parallelotope is a zonotope, so V_j(P) = Σ_{|S| = j} vol_j(parallelotope spanned by v_i, i ∈ S).
3. Let G be the Gram matrix of the v_i. Then vol_j(face_S)² = det G_S and |P|² = det G. Szász's
   inequality (products of principal minors of a positive definite matrix) gives
   Π_{|S|=j} det G_S ≥ (det G)^{C(n−1, j−1)}, so Π_S vol_j(face_S) ≥ a^{n·C(n−1, j−1)}.
4. By AM–GM, V_j(P) ≥ C(n, j)·(Π_S vol_j)^{1/C(n, j)} ≥ C(n, j) a^j, since C(n−1, j−1)/C(n, j) = j/n.

So |u(B₁) + rB| ≥ Σ_j C(n, j) a^j κ_{n−j} r^{n−j} = |B₁ + rB| for every u: the cube and the ball are
already in their worst relative position. As |B₁|^{1/n} + |B₂|^{1/n} = a + κₙ^{1/n} r,

    C ≥ (Σ_j C(n, j) a^j κ_{n−j} r^{n−j})^{1/n} / (a + κₙ^{1/n} r)   for every n, a, r.

For n = 2 this is √(1/2 + 1/√π) ≈ 1.0316 (a square and a disk; `rbm.py` also checks this case on
random maps). The value grows with n: 1.0534 (n = 3), 1.1181 (n = 10), 1.1847 (n = 100), 1.2016
(n = 10,000), and 1.201927 at n = 300,000 with a/r = 0.013. `rbm_cube.py` evaluates the sum in
interval arithmetic, with the binomials and ball volumes from exact recursions
(κ_m = κ_{m−2}·2π/m), so the printed lower end is rigorous.

## 23b. Decay rate of the minimal condition number of sign matrices: C ≤ 1/2

κ(n) is the smallest condition number of an n×n ±1 matrix, and C is the largest α such that
κ(n) = 1 + f(n)/n^α for a subpolynomial f. The table's upper bound is 1.

Let n ≥ 3 be odd and A an n×n ±1 matrix; let G = AᵀA have eigenvalues λ₁ ≥ … ≥ λₙ ≥ 0, so
κ(A)² = λ₁/λₙ. Each diagonal entry of G is n, and each off-diagonal entry is a sum of n odd terms ±1,
so it is odd and its square is at least 1. With x_k = λ_k − n: Σ x_k = tr G − n² = 0 and
Σ x_k² = ‖G − nI‖²_F ≥ n(n − 1). Put a = λ₁ − n and b = n − λₙ. Every x_k lies in [−b, a], so
(a − x_k)(x_k + b) ≥ 0; summing gives Σ x_k² ≤ n·ab (the Bhatia–Davis inequality), so ab ≥ n − 1. Then
κ(A)² = (n + a)/(n − b) ≥ 1 + (a + b)/n ≥ 1 + 2√(ab)/n ≥ 1 + 2√(n − 1)/n, and so
κ(n) ≥ 1 + (2 − √2)/√n for every odd n ≥ 3. If κ(n) = 1 + f(n)/n^α with α > 1/2, then for odd n,
f(n) ≥ (2 − √2) n^(α − 1/2), which is not subpolynomial. Hence C ≤ 1/2.

Numerically: the exact minimum for n = 3 is 2.0 (bound 1.394), and random search for n = 5, 7, 9, 11
never goes below the bound.
