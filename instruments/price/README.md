# instruments/price — the clearing price, as a proved band

The Gomes–Saúde price-formation model (arXiv:1807.07088) sets the electricity
price as the Lagrange multiplier that makes a fleet of storage owners absorb
exactly what the grid produces. In the linear-quadratic case with a set-point
potential (§6.2) the paper solves for the price by a Volterra equation and a
Laplace transform, up to an implicit constant. With quadratic terminal data the
constant is explicit and the price closes:

```
Ξ(t) = x̄₀ + ∫₀ᵗ Q,     Π(t) = γ (Ξ(T) − ζ) + η ∫ₜᵀ (Ξ − κ),     ϖ(t) = −c Q(t) − Π(t)
```

The price is affine in the supply path with every coefficient ≤ 0, so a
forecast box lo ≤ Q ≤ hi becomes a price band attained at its corners. With
rational data everything is a rational number and is computed as one.

```
node instruments/price/run.js          write certs/price-band.json (about 20 s)
node instruments/price/run.js --check  re-derive and compare, write nothing
node instruments/price/battery.js      the gate: 23 checks, 5 red controls
```

| file | what |
|---|---|
| `price.js` | the exact model: `model`, `price`, `theta`, `band`, `sensitivity`, `widthParts`, `certificate` — BigInt rationals throughout |
| `fd.js` | the source lab's MPR kernel ported bit for bit, with the domain, the walls (`walls: 'lab' \| 'constrained'`) and the clearing rule (`clearing: 'control' \| 'flux'`) as parameters |
| `derive.js` | everything the record states, derived live: the exact band on the lab's scenario at three η, the lab's box three ways, the wide-domain convergence runs |
| `FINDINGS_LIT.md` | what was found, against the paper and against the lab |

**What is decided.** Θ; Π_n = −Θ at every grid time (η = 0); Ξ(T) = x̄₀ + ∫Q;
the terminal and step identities (η > 0); the band and its attainment; twenty
interior paths inside it; the width decomposition. All as rational identities.

**What is measured, not decided.** Everything about the finite-difference
kernel: the energy lost at its wall, the shadow price of the box, the
first-order convergence of the flux-cleared scheme, the non-convergence of the
lab's wall treatment. Floats at fixed meshes, drawn dashed on the page.

**What is assumed.** The paper's (33) on the whole line, ε = 0, quadratic
terminal data; the averaged dynamics Ξ̇ = Q and Π̇ = −η(Ξ − κ) as an identity
for C² solutions (the paper's §6.2, cited); Q a step function on the grid.
