# instruments/hbar — the effective Hamiltonian band

The cell problem H(x, P + u′) = H̄(P) with H = p²/2 + V on the circle has a
classical answer: H̄ = max V for |P| ≤ P₀ = ∫√(2(max V − V)), and beyond that
H̄ = c with ∫√(2(c − V)) = |P|. Gomes–Yang (arXiv:1810.03483, ESAIM M2AN 2020)
compute H̄ and the Mather measure by a Hessian Riemannian flow and a Newton
method and test against this formula. This instrument encloses the formula
and holds their tables against it.

```
node instruments/hbar/run.js          write certs/hbar-band.json (about 25 s)
node instruments/hbar/run.js --check  re-derive and compare, write nothing
node instruments/hbar/battery.js      the gate: 18 checks, 5 red controls
```

| file | what |
|---|---|
| `exact.js` | Q(c) and the period T(c) by the midpoint rule with the remainder from the interval jet (taylor2.js), Riemann bounds on near-degenerate cells; P₀ with the cusp; bisection on c closed by the mean value theorem with T as Q′; the regimes FLAT / ROTATING / UNDECIDED; the Mather density |
| `derive.js` | the band for V = sin 2πx at 22 sampled P; P₀ for sin, cos, −sin against 4/π; Table 1 (separable cosine, P = (1.5, 2.5)) and the quoted Gomes–Oberman value; Table 2 (P = 0.5 on −sin); the Mather density at P = 1.5, 2 |

**Decided.** P₀ ∋ 4/π; every FLAT value = 1 exactly; every ROTATING value
to about 2e−6; H̄(1.5, 2.5) for the separable cosine Hamiltonian to 6e−8,
with the quoted 4.4099660 ABOVE it by 7e−7 and the paper's own values BELOW
it; Table 2's exact value 1; the Mather density where rotating.

**Not claimed.** Anything at the undecided P = 4/π; the non-separable
two-dimensional example; the formula itself (classical, taken from the
paper's citation of Cacace–Camilli); Mather's theorem on the flat part.
