# The KAUST reports plan — 2026-09-06

The group's current line is monotone operators in Banach spaces for first-order
games (Ferreira–Gomes–Ucer arXiv:2506.21212, Gomes–Ucer arXiv:2606.28378,
Alharbi–Gomes arXiv:2603.01681). The machine certifies fixed points of analytic,
periodic, second-order systems and finite algebraic objects. The plan below is
the sequence of reports that closes that gap one certificate at a time. Each
report mints exactly ONE certificate class on ONE of their published instances,
runs a literature gate on that instance before minting, and carries a falsifier
that must turn red. The scout row is corpus/targets.json `kaust-mfg-revisit`.

Standing rules: every send is operator-gated; ARTIFACT BEFORE ASK; the July
roster in sin-mfg research/CANDIDATES.md is re-verified at source on the day of
any send; mfg-cap already claims the first MFG enclosure, so every report here
is additive BY INSTANCE and says so.

## The sequence

| # | report | their paper | certificate it mints | new code | cost |
|---|---|---|---|---|---|
| 1 | **The case with no closed form, enclosed** | Almulla–Ferreira–Gomes, DGA 7(4) 2017, arXiv:1511.06576, §2.1 and Figs. 7–8 | first-order enclosure by the current reduction: rigorous periodic quadrature + interval scalar inverse + 2-D Krawczyk on (flux, H̄) | `instruments/interval/quadrature.js`, `instruments/afg/` | days |
| 2 | **BUILT 2026-09-06** as *Monotone, and provably not a gradient* (reports/monoflow.html): the interval-Cholesky certificate dissolved into the exact one-line form for this coupling; the eigenpair certificate is the content | Ferreira–Gomes–Tada arXiv:2502.20091; Ferreira–Gomes–Voskanyan PAMS 2025 | instance monotonicity (interval Cholesky of the symmetric Jacobian) + no-gradient certificate (Sturm count; port of sin-mfg research/emergent-geometry, 536 lines) over the labs/mfg multiplicity map | port + one module | days |
| 3 | **BUILT 2026-09-06** as *The empty region, painted by standing* (reports/aag.html): AMO numbers pinned from the arXiv v4 full text; γ of Figure 2 unprinted, certified over a box | Alharbi–Ashrafyan–Gomes AMO 93:40 (2026); Alharbi–Gomes arXiv:2603.01681 | boundary complementarity (exact rational KKT with the auxiliary exit flux h) + vanishing-set certificate (sign enclosure per cell, REFUSED at the free boundary) | interval BVP in 1-D, warrant contour | a week; numbers must be pinned from the AMO full text first |
| 4 | The maximal value function, drawn | Gomes–Ucer arXiv:2606.28378 | viscosity-solution certificate: exact Hopf–Lax over a rational grid, 1-D, separable convex H; DECIDED on {m>0}, CHOSEN on {m=0} | `instruments/hopflax/` | a week |
| 5 | The concentration frontier as a published measurement | Gomes–Mitake NoDEA 2015; the congestion CAP and its refusal frontier (sin-mfg mfg-congest) | none new — a measurement over the existing enclosure, layered by N, the N-free ceiling the only solid line | page only | days |
| 6 | The network census | Bakaryan–Aoun–Ribeiro–Hovakimyan–Gomes arXiv:2504.16028; Al Saleh et al. Portugaliae 2024 | none new — facelaw + wardrop-repro + eq-census as one playground | page + playground | days |
| 7 | The clearing price as a proved band | Gomes–Saúde DGA 2021; Ashrafyan–Gomes DGA 2025 (arXiv:2403.02785) | price enclosure (Krawczyk on the clearing residual, exact on the linear balance) with forecasts as boxes | MPR kernel lift + one module | a week |
| 8 | Their tables, re-decided at every build | all of the above with pinned numbers | scheme-to-solution distance (interval difference at grid points against an enclosure) | derivative of 1, 3, 4 | days |
| 9 | The regularization atlas | Ferreira–Gomes–Ucer arXiv:2506.21212 | discrete-space radii polynomial admitting the p-Laplacian | a new kernel | weeks |
| 10 | The effective Hamiltonian band | Gomes–Yang ESAIM M2AN 2020 | certified convex bracket on H̄(P), refusal at degeneracy | interval eigenvalue enclosure | weeks; weak-KAM occupancy risk |

## Report 1 in detail — the first candidate

**STATUS 2026-09-06: BUILT.** instruments/afg, certs/afg-enclosure.json, reports/afg.html. The numbers below were a float preview; the certified boxes are in the record and on the page. Not sent.

**The instance.** AFG system (1.1) on the torus, first order:

```
u_x^2/2 + V(x) + b(x) u_x = ln m + Hbar,   -(m (u_x + b))_x = 0,   int u = 0,  int m = 1,  m > 0
```

with V = sin(2πx) and b = cos²(2πx), their Figures 7–8. The paper gives closed
forms only when ∫b = 0 and says, verbatim: "If ∫b dx ≠ 0, we are not aware of
any closed-form solution." Here ∫b = 1/2. Their monotone flow at N = 100 is the
only answer on record, and it is a picture.

**The reduction (theirs in spirit; the 1-D current method).** The
Fokker–Planck equation integrates once: m (u_x + b) = j, a constant flux. Then
u_x = j/m − b and the HJB becomes a scalar equation per x:

```
phi(m) := ln m − j^2 / (2 m^2) = V(x) − b(x)^2/2 − Hbar =: r(x)
```

phi is strictly increasing from −∞ to +∞ (phi' = 1/m + j²/m³ > 0), so m(x) is
the unique inverse for any (j, Hbar). Two scalar unknowns remain, fixed by two
integral conditions: ∫m = 1 (mass) and j ∫(1/m) = ∫b (periodicity of u). When
∫b = 0 this forces j = 0 and returns exactly their closed form; when ∫b ≠ 0 it
forces j > 0.

**The certificate.** A 2-D Krawczyk enclosure of (j, Hbar) with interval-valued
F and Jacobian (∂m/∂Hbar = −1/phi'(m), ∂m/∂j = (j/m²)/phi'(m), by implicit
differentiation), where every integral is a RIGOROUS quadrature: subdivide the
torus, enclose m on each cell by interval Newton on the scalar equation, bound
m' = r'(x)/phi'(m) on the cell, sum with the midpoint remainder. Existence and
local uniqueness of (j, Hbar) in the box give existence of a classical (u, m,
Hbar) with m enclosed pointwise and certified positive; global uniqueness is
theirs (Lemma 2.3, monotone operator) and is cited, not re-proved. Three new
pieces, all inside instruments/interval: a rigorous periodic quadrature, an
interval scalar inverse, and the 2-D Krawczyk driver (krawczyk() exists).

**The control, which is the paper's own.** b = 0: j = 0 and Hbar = ln ∫e^V =
ln I₀(1). The enclosure must contain it. Float preview (K = 4000, NOT a proof):

```
b = 0      : j = 0            Hbar = 0.2359143585   m in [0.2906, 2.1470]   ln int e^V = 0.2359143585
b = cos^2  : j = 0.3461135220 Hbar = 0.1711645659   m in [0.4292, 2.3164]   u in [-0.0775, 0.0775]
```

Both are consistent with their Figures 6 and 8 by eye (peak of m near x = 0.25
at about 2.1 and 2.3). That is a look, not a measurement, and the page says so.

**Falsifiers that must fire.** (a) the quadrature with the remainder term
deleted; (b) the scalar inverse with phi' replaced by its float value;
(c) Krawczyk on a box that does not contain the root; (d) the b = 0 control with
Hbar shifted by 1e-9 — the enclosure must exclude it.

**The figure.** Their Figure 8 redrawn as a band: m(x) as a certified tube with
its pointwise width, the flux j as a single annunciated number with its bracket,
and the b = 0 control drawn as a solid line through a dotted closed form.
Second panel: the two integral conditions as curves in the (j, Hbar) plane with
the Krawczyk box at their crossing.

**Claim shape (from the literature gate, missions/FINDINGS_LIT_FERREIRA.md).**
"A validated interval enclosure of the stationary triple (u, m, Hbar) for the
first-order mean-field game of Almulla, Ferreira and Gomes (DGA 7(4) 2017) in
the case ∫b ≠ 0, for which the authors state no closed form is known." Never
"the first computer-assisted proof for a mean-field game" (mfg-cap holds that).
Never "a certified reproduction" (their §4 has figures, not tables; there is
nothing to reproduce within its rounding).

**Hazards.** The literature gate of 2026-07-27 was PARTIAL on occupancy and did
not search feasibility; re-run it on this exact instance (first-order, ∫b ≠ 0,
current reduction) before minting — the 1-D current method is Gomes's own
technique (first-order stationary MFG papers, 2017–2018) and must be cited as
the reduction. The internal collision the gate feared (mfg-congest's target is
the congestion system (2.1)) does not arise: (2.1) with b = 0 is the trivial
branch and is not the instance here. arXiv:2606.19611 (Bregman-projected mirror
iteration, this group, June 2026) validates against exact test solutions and is
the nearest neighbour; cite it.

**Recipient.** Rita Ferreira (resident, Research Scientist, verified July 2026),
through Ribeiro. Re-verify at source before any send. Gated.
