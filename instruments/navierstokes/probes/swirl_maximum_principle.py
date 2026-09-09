#!/usr/bin/env python3
"""The obstruction the paper never names: the swirl maximum principle.

For an AXISYMMETRIC velocity u = u_r e_r + u_θ e_θ + u_z e_z the θ-component of the
Navier–Stokes equations (viscosity one, force f), multiplied by r, gives for the swirl
Γ = r u_θ the linear drift–diffusion equation

    ∂_t Γ + u_r ∂_r Γ + u_z ∂_z Γ = ∂_r² Γ − r⁻¹ ∂_r Γ + ∂_z² Γ + r f_θ ,

with NO zeroth-order term.  Hence the weak maximum principle: for a smooth solution with
compact support (or decay) and zero initial data,

    sup_x |Γ(x,t)| ≤ ∫₀ᵗ sup_x |r f_θ(x,s)| ds ,

so a bounded, compactly supported force can only produce a BOUNDED swirl, i.e.
|u_θ| ≤ C / r for all t < 1.  The paper's leading field has u_θ = q^{−1/2−h} E(X,η) at
r = √(2qX), i.e. Γ = √(2X) q^{−h} E → ∞ as q ↓ 0 (the paper writes r u_θ = q^{−h} H itself,
p. 27).  So the axisymmetric background alone is IMPOSSIBLE as a forced solution from rest;
the theorem survives only because the physical field is not axisymmetric — the pulses carry
"nonzero integer angular frequencies" (p. 12) — and the Reynolds flux of those pulses is what
breaks the maximum principle for the angular mean.  None of this is said in the paper.

This script (1) derives the swirl equation symbolically from the cylindrical θ-momentum
equation and confirms the absence of a zeroth-order term, (2) checks that the paper's
Γ = r u_θ^{(0)} grows like q^{−h}, (3) checks that the same exponent count makes the flow
type II (|u| ≍ τ^{−1/2−h}, beyond the τ^{−1/2} of a type-I bound), which is what the
Koch–Nadirashvili–Seregin–Šverák and Chen–Strain–Yau–Tsai Liouville theorems exclude for
AXISYMMETRIC flows, and (4) tabulates the classical necessary conditions for a Navier–Stokes
singularity against the paper's exponents.  Prints PASS/FAIL lines; exit 0 iff all pass.
"""
import sys
import sympy as sp

fails = []
def report(ok, name, extra=''):
    print(('PASS ' if ok else 'FAIL ') + name + (('  ' + extra) if extra else ''))
    if not ok: fails.append(name)

r, z, t = sp.symbols('r z t', positive=True)
ur = sp.Function('u_r')(r, z, t); uth = sp.Function('u_theta')(r, z, t); uz = sp.Function('u_z')(r, z, t)
fth = sp.Function('f_theta')(r, z, t)
# axisymmetric θ-momentum, viscosity one:  ∂_t uθ + u_r ∂_r uθ + u_z ∂_z uθ + u_r uθ / r = Δuθ − uθ/r² + f_θ,  Δ = ∂_r² + r⁻¹∂_r + ∂_z²
lap = sp.diff(uth, r, 2) + sp.diff(uth, r) / r + sp.diff(uth, z, 2)
theta_eq = sp.diff(uth, t) + ur * sp.diff(uth, r) + uz * sp.diff(uth, z) + ur * uth / r - (lap - uth / r**2) - fth   # = 0
G = sp.Function('Gamma')(r, z, t)
# substitute uθ = Γ/r and multiply by r
swirl = sp.expand(sp.simplify(theta_eq.subs(uth, G / r).doit() * r))
claimed = sp.diff(G, t) + ur * sp.diff(G, r) + uz * sp.diff(G, z) - (sp.diff(G, r, 2) - sp.diff(G, r) / r + sp.diff(G, z, 2)) - r * fth
report(sp.simplify(swirl - claimed) == 0, 'swirl equation: r × (θ-momentum) with uθ = Γ/r is  ∂_tΓ + u_r∂_rΓ + u_z∂_zΓ = Γ_rr − Γ_r/r + Γ_zz + r f_θ')
# no zeroth-order term in Γ: the coefficient of Γ (undifferentiated) vanishes
coeff_G = sp.expand(swirl).coeff(G)
report(sp.simplify(coeff_G) == 0, 'no zeroth-order term in Γ (the maximum principle applies)', 'coefficient of Γ = ' + str(sp.simplify(coeff_G)))
# the drift is the physical velocity itself (no extra drift from the change of unknown)
drift_r = sp.expand(swirl).coeff(sp.diff(G, r)); drift_z = sp.expand(swirl).coeff(sp.diff(G, z))
report(sp.simplify(drift_r - (ur + 1 / r)) == 0 and sp.simplify(drift_z - uz) == 0, 'drift coefficients: u_r + 1/r on Γ_r (the 1/r being −(−1/r) from the diffusion part) and u_z on Γ_z')
# at an interior maximum of Γ (∇Γ = 0, Γ_rr ≤ 0, Γ_zz ≤ 0):  ∂_tΓ ≤ r f_θ.  Symbolic: substitute ∇Γ = 0 and Hessian terms ≤ 0.
# (a statement about signs; recorded as the printed consequence)
print('     consequence: at a spatial maximum of Γ, ∂_tΓ ≤ r f_θ, hence sup|Γ(t)| ≤ ∫₀ᵗ sup|r f_θ| ds for Γ(0) = 0 — bounded for a bounded compactly supported force')

# (2) the paper's leading swirl: uθ = q^{−A} E(X,η), A = 1/2 + h, X = r²/(2q)  ⇒  Γ = r uθ = √(2X) q^{−h} E
q, X, h = sp.symbols('q X h', positive=True)
E = sp.symbols('E', positive=True)   # E(X, η) at fixed (X, η)
r_of = sp.sqrt(2 * q * X)
Gamma_lead = sp.simplify(r_of * q**(-(sp.Rational(1, 2) + h)) * E)
report(sp.simplify(Gamma_lead - sp.sqrt(2 * X) * q**(-h) * E) == 0, "the paper's leading swirl at fixed (X, η) is Γ = √(2X) q^{−h} E(X, η), unbounded as q ↓ 0 (matches the paper's r uθ = q^{−h} H, p. 27)")
# the exponent of q in Γ is −h < 0 for every h > 0
report(sp.limit(Gamma_lead.subs({X: 1, E: 1, h: sp.Rational(1, 100)}), q, 0) == sp.oo, 'Γ → ∞ along q ↓ 0 at h = 1/100 (so no axisymmetric forced flow from rest with bounded force can have this core)')

# (3) type II: |u| ≍ τ^{−1/2−h} exceeds the type-I rate τ^{−1/2} by τ^{−h}
tau = sp.symbols('tau', positive=True)
ratio = sp.simplify(tau**(-(sp.Rational(1, 2) + h)) / tau**(-sp.Rational(1, 2)))
report(sp.simplify(ratio - tau**(-h)) == 0 and sp.limit(ratio.subs(h, sp.Rational(1, 100)), tau, 0) == sp.oo, 'the blowup is type II: |u|/τ^{−1/2} = τ^{−h} → ∞ — outside the type-I class excluded for axisymmetric flows (KNSS 2009, CSYT 2008)')

# (4) the classical necessary conditions, at the paper's exponents (viscosity one, core volume τ^{3/2−h})
hv = sp.Rational(1, 100)
vol = tau**(sp.Rational(3, 2) - hv); speed = tau**(-(sp.Rational(1, 2) + hv)); grad = speed / tau**sp.Rational(1, 2)
energy = sp.simplify(speed**2 * vol)                 # τ^{1/2−3h}
dissip = sp.simplify(grad**2 * vol)                  # τ^{−1/2−3h}
L3 = sp.simplify((speed**3 * vol)**sp.Rational(1, 3))
report(sp.limit(energy, tau, 0) == 0, 'energy of the core → 0 (bounded energy through the singularity, as Theorem 1.1 asserts)', str(energy))
report(sp.integrate(dissip, (tau, 0, 1)).is_finite, 'dissipation integrable on [0,1) (finite ∫‖∇u‖²), since 3h < 1/2', str(dissip))
report(not sp.integrate(speed**2, (tau, 0, 1)).is_finite, "Serrin/Prodi/Ladyzhenskaya (p = ∞, q = 2): ∫‖u‖_∞² dt = ∞ as a singularity requires", str(speed**2))
report(sp.limit(L3, tau, 0) == sp.oo, 'Escauriaza–Seregin–Šverák: ‖u‖_{L³} → ∞ as a singularity requires', str(L3))
report(not sp.integrate(grad, (tau, 0, 1)).is_finite, 'Beale–Kato–Majda-type: ∫‖ω‖_∞ dt = ∞ (ω ≍ u/ℓ_r)', str(grad))
report(sp.limit(speed / tau**(-sp.Rational(1, 2)), tau, 0) == sp.oo, "Leray's lower bound ‖u‖_∞ ≥ c τ^{−1/2} respected", str(sp.simplify(speed / tau**(-sp.Rational(1, 2)))))
report(sp.limit(sp.sqrt(dissip) / tau**(-sp.Rational(1, 4)), tau, 0) == sp.oo, "Leray's lower bound ‖∇u‖₂ ≥ c τ^{−1/4} respected", str(sp.simplify(sp.sqrt(dissip) / tau**(-sp.Rational(1, 4)))))
print('     CKN: one singular point, parabolic 1-measure zero — consistent; Leray: one singular time — consistent')
print(f'# {len(fails)} FAIL' + (': ' + ', '.join(fails) if fails else ''))
sys.exit(1 if fails else 0)
