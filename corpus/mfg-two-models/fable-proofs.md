(The author's reply, with its list of numerical candidates and its file inventory left out. Those were checked by the certifier. Everything mathematical is below, as written.)

## P1. Reduction to a Schrödinger problem — PROVED (probability 0.97)

**Statement.** (u, m, ρ) is an equilibrium at (c, A) if and only if φ = √m is a positive 1-periodic solution of

    −½ φ'' + c φ³ + A cos(2πx) φ = ρ φ,   ∫φ² = 1,

with u = −ln φ + const. Even equilibria correspond to even φ.

**Proof.**
- The second equation says σm' + mu' = J is constant. Then (m e^{2u})' = 2J e^{2u}, and periodicity forces J = 0, so m = e^{−2u}/∫e^{−2u}.
- With u = −ln φ + const and σ = ½, −σu'' + ½u'² = ½φ''/φ. Substituting gives the equation above; the converse is the same computation.

**Consequences used below.**
- φ > 0 is the ground state of −½∂² + cm + V.
- ρ = c − ½∫u'² ≤ c.
- For A > 0, ∫m sin(2πx) dx = 0 for every equilibrium, even or not (multiply by φ' and integrate).

**Not new:** the link between quadratic mean-field games and the nonlinear Schrödinger equation is in Ullmo–Swiecicki–Gobron.

## P2. Exact count at A = 0 — PROVED (probability 0.93)

**Statement.** For A = 0 and c < 0 let J = #{j ≥ 1 : π²j² < −c}.
- The equilibria, even or not, are exactly the constant and, for each j ≤ J, the translates of m_j(x) = (K/E)·dn²(2jK·x; k), where k ∈ (0,1) is the unique root of 4j²K(k)E(k) = −c, with ρ = −2j²K²(2 − k²).
- The even ones are the constant, m_j(x) and m_j(x − 1/(2j)). So there are exactly 2J + 1 even equilibria.
- The equilibrium is unique if and only if c ≥ −π². There are five for −9π² ≤ c < −4π², seven for −16π² ≤ c < −9π².

**Proof.**
- By P1 with ρ ≤ c < 0, φ'' = −2|c|φ³ + 2|ρ|φ is an autonomous double-well oscillator.
- Its positive periodic orbits are the centre and the orbits inside the right homoclinic loop, which are α·dn(β(x − x₀); k) with α²|c| = β² and ρ = −½β²(2 − k²).
- Period 1/j gives β = 2jK. Mass 1 gives α²·2jE/β = 1. Together: |c| = 4j²KE and α² = K/E.
- KE is strictly increasing from π²/4 to ∞, because (KE)' = (E² − k'²K²)/(kk'²), and E − k'K > 0 since it vanishes at k = 0 and has derivative (1 − k')(K − E)/(kk') > 0.
- A translate is even only if x₀ is a maximum or minimum of dn.

**Checks.** The formulas for ρ and min m agree with Newton to 10 digits at (c, j) = (−12, 1), (−45, 2), (−90, 2), (−90, 3).

**Would refute it:** a positive periodic solution at A = 0 that is not a dn translate.

**Probably known:** dn waves on the circle are classical. I did not find this count written for this game.

## P3. Uniqueness in a strip of c < 0, for every A — PROVED (probability 0.88)

**Statement.** If c < 0 and |c|·exp(3|c| + 3A/π) < π², the equilibrium is unique among all solutions, not only even ones.

| A | 0 | 0.5 | 1.0 | 1.2 | 3 |
|---|---|---|---|---|---|
| unique for \|c\| below | 0.8266 | 0.7156 | 0.6098 | 0.5691 | 0.2588 |

This covers about 3.5% of the map rectangle, all of it currently undecided.

**Proof.** Take two solutions and put w = ½ln(m₂/m₁), μ = m₁ + m₂, D = ∫μw'².
1. Multiplying the φ-equations by (φ₁² − φ₂²)/φ₁ and (φ₂² − φ₁²)/φ₂ and adding gives ½D = −c∫(m₁ − m₂)². For c ≥ 0 this is Lasry–Lions.
2. z = tanh w = (m₂ − m₁)/μ satisfies |z'| ≤ |w'| and ∫μz = 0.
3. So ∫(m₂ − m₁)² = ∫μ²z² ≤ μ_max·∫μ(z − z̄)² ≤ μ_max²/(4π²μ_min)·D, by Wirtinger.
4. Hence D = 0 whenever |c| < 2π²μ_min/μ_max².
5. A priori bound: ρ is a ground-state energy, ‖ψ‖∞² ≤ 1 + ‖ψ'‖ and |∫cos(2πx)ψ²| ≤ ‖ψ'‖/π for ‖ψ‖₂ = 1. So ρ ≥ −½(|c| + A/π)² − |c|.
6. Then ∫u'² = 2(c − ρ) ≤ (|c| + A/π)², so the oscillation of ln m is at most ω = |c| + A/π, and e^{−ω} ≤ m ≤ e^{ω}.
7. Therefore μ_min ≥ 2e^{−ω} and μ_max ≤ 2e^{ω}, which gives the stated condition.

**Checks.** The identity in step 1 and each inequality hold numerically on nine solution pairs (10 digits for the identity).

**Not established:** the strip is far from the true boundary; at A = 0 it gives 0.83 against the exact π².

## S2. Fold curves and the count on scanned regions — COMPUTATIONALLY SUPPORTED (probability 0.85)

**Fold curves** (Newton on the extended fold system, floating point, not certified):

| A | c₁(A) | c₂(A) | c₃(A) |
|---|---|---|---|
| 0.1 | −10.30540 | −39.48470 | −88.82649 |
| 0.5 | −11.13754 | −39.53368 | −88.82779 |
| 1.0 | −11.87121 | −39.62125 | −88.83184 |
| 1.2 | −12.12503 | −39.66217 | −88.83422 |
| 3.0 | −13.94634 | −40.14273 | −88.87510 |

- c₁(A) ≈ −π² − (3/2)(π/2)^{2/3}·A^{2/3}, from the reduced equation (c + π²)b + (π²/2)b³ + A/2 = 0. This is a formal derivation; the error is 4·10⁻⁵ at A = 0.01 and 0.034 at A = 1.2.
- Fits on A ≤ 0.5: c₂ ≈ −4π² − 0.140·A^{1.35} and c₃ ≈ −9π² − 0.0054·A^{2.00}.
- Following the same folds at fixed c: the j = 1 fold is at A ≈ 1.0998 (c = −12), 13.58 (c = −20), 49.86 (c = −30) and 135.90 (c = −45). The j = 2 fold is at A ≈ 13.1665 for c = −45, and the j = 3 fold at A ≈ 14.6262 for c = −90.

**Count by an independent shooting enumeration** (no Fourier, no Newton):
- For A ∈ {0.1, 0.3, 0.5, 0.8, 1.0, 1.2, 2, 3} and c ∈ [−16, −0.01], in steps of 0.01: exactly 1 even equilibrium for c > c₁(A) and exactly 3 below. The jump lands on the Newton fold to the grid step in all eight cases.
- For A = 0.5 and A = 1.0: 1, then 3, then 5, with the second jump at −39.53/−39.54 and −39.62/−39.63, down to c ≈ −47.6 and −48.1.

So in the map rectangle the undecided region to the right of c₁(A) is, on this evidence, truly unique, and the fold runs from (−9.87, 0) to (−12.125, 1.2).

**Not established:** nothing here is a proof. Below c ≈ −47.6 the scan is unresolved (the count flickers between 4 and 7). For c < −14 some scan cells touch non-positive trajectories.

## C1. The law — CONJECTURE (probability 0.6)

For every A ≥ 0 the number of even equilibria is 1 + 2·#{j : c < c_j(A)}, with c_j(0) = −π²j² and the curves ordered and non-crossing. In particular the equilibrium is unique if and only if c > c₁(A).

- **Evidence:** P2 at A = 0, the scans in S2, the fold tables, and a random-restart search in the even system that finds exactly 3, 3 and 5 at (−20, 0.5), (−30, 2) and (−45, 0.5).
- **Would refute it:** an isolated branch not connected to A = 0, or two fold curves crossing.

## C2. No non-even equilibria for A > 0 — CONJECTURE (probability 0.6)

- **Evidence:**
  - A search without the evenness assumption (400 starts at each of seven parameter points) found only even solutions.
  - The odd-sector spectrum of every even branch at c ∈ {−12, −20, −30, −45, −90} never crosses zero along the A-ranges traced.
  - The translation eigenvalue of the two-peak states scales as A², with a fixed sign for c ∈ [−80, −40].
- **Not established:** isolated non-even branches are not excluded.
