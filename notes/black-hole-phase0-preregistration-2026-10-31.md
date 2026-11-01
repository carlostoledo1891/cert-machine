# The black hole, Phase 0 (the decided layer): pre-registration, 2026-10-31

Written and committed before any enclosure exists. At the commit that adds this note, no code in this repository
encloses a Kerr curve, a shadow diameter, a ratio or an ISCO period; the only numbers on disk are the scout's float64
ones (notes/black-hole-scout-2026-10-31.md, from a throwaway script outside the repository), and none of them is an
input here. What follows fixes the claims, the inputs, the assumptions and the verdict words. A change after this
commit is written at the end, dated, as a deviation.

Phase 0 is the decided layer only: no renderer, no page (the operator's rulings, HANDOFF 2026-10-31; the plan in the
scout note). The record is certs/bh-shadow.json, written by a recorder with `--check`.

## What is decided, what is compared, what is assumed

- **DECIDED** (given the stated inputs): every number below that is a function of the Kerr metric, a spin, an
  inclination and a mass row. Enclosed in outward-rounded interval arithmetic (instruments/interval) and again by an
  independent Python decider (standard library only: `fractions` and `decimal` with directed rounding, no code shared).
- **COMPARED**: the measured ring against the decided shadow. The ring is an EHT fit to visibilities, and the factor
  between the ring a telescope sees and the shadow edge (the critical curve) is calibrated on GRMHD simulations
  (Paper VI). The result is a ratio band, published with the exact factor that each mass row would need. It is not a
  verdict on the black hole, on GR, or on which mass is right.
- **ASSUMED**: the spin range, the inclination, the Kerr metric itself, the mass rows' published boxes (68% ranges,
  read as boxes: the enclosure is decided GIVEN the box, and a box is not a hard bound on nature), and the
  ring-to-shadow factor.

## Inputs (each pinned with its source; read from the source's own abstract on 2026-10-31 unless said)

Constants (exact rationals by definition):
- c = 299 792 458 m/s (SI).
- GM☉ = 1.327 124 4 × 10²⁰ m³ s⁻² (IAU 2015 Resolution B3, the nominal solar mass parameter). The difference from the
  measured TDB value (1.327 124 400 41 × 10²⁰) is 3 × 10⁻¹¹ relative, far below every mass row's width.
- au = 149 597 870 700 m (IAU 2012 B2); pc = (648 000/π) au (IAU 2015 B2). So one au at one Mpc subtends exactly one
  µas, and **θg = GM/(c²D) in µas is the exact rational (M/M☉)·(GM☉/c²)/(D_Mpc · au)**: π cancels, nothing
  transcendental enters the angular scale.
- t_g = GM/c³ = (M/M☉)·(GM☉/c²)/c seconds; a day is 86 400 s.

Mass rows (θg depends on M/D only):

| row | source | published | read as a box |
|---|---|---|---|
| EHT 2019 | EHT Collaboration 2019, Paper VI, ApJL 875, L6 (arXiv:1906.11243) | θg = GM/(Dc²) = 3.8 ± 0.4 µas; M = 6.5 ± 0.2 (stat) ± 0.7 (sys) × 10⁹ M☉ at D = 16.8 (+0.8, −0.7) Mpc | θg ∈ [3.4, 4.2] µas (the measured quantity itself; the mass is θg × D, so its distance error does not enter θg) |
| stars, Gebhardt+11 | Gebhardt et al. 2011, ApJ 729, 119 (arXiv:1101.1954), Gemini/NIFS stellar dynamics | (6.6 ± 0.4) × 10⁹ M☉ at D = 17.9 Mpc | M ∈ [6.2, 7.0] × 10⁹ at D = 17.9 |
| stars, Liepold+23 | Liepold, Ma & Walsh 2023, ApJL 945, L35 (arXiv:2302.07884), Keck IFS, triaxial orbit models | (5.37 +0.37 −0.25 ± 0.22) × 10⁹ M☉ at D = 16.8 Mpc, the ±0.22 being the distance systematic | M ∈ [5.12, 5.74] × 10⁹ at D = 16.8 (the distance term is dropped: it cancels in M/D) |
| gas, Walsh+13 | Walsh et al. 2013, ApJ 770, 86 (arXiv:1304.7273), HST/STIS gas dynamics | (3.5 +0.9 −0.7) × 10⁹ M☉ (68%) at D = 17.9 Mpc | M ∈ [2.8, 4.4] × 10⁹ at D = 17.9 |

The distances 17.9 and 16.8 Mpc for the three dynamical rows came from a search summary and the papers' known
conventions, not from each paper's own table. **The scout's finding, adopted**: a dynamical mass scales as M ∝ D, so
M/D (and θg) is fixed by the data whatever distance is assumed; the comparison with the ring needs no distance, and
no distance uncertainty is propagated for those rows. The EHT row's θg is a measurement of angle, distance-free by
construction. **One circularity, stated**: the EHT θg was derived FROM the 2017 ring with the GRMHD calibration, so
comparing the 2017 ring to the EHT-mass shadow returns that calibration; it is printed for completeness, never as a
test.

Measured rings (COMPUTED by the EHT; compared, never decided here):
- 2017: 42 ± 3 µas (Paper VI, "across all methods, a crescent diameter of 42 ± 3 µas") → [39, 45].
- 2017–2021: 43.9 ± 0.6 µas, persistent (EHT Collaboration, "Horizon-scale variability of M87* from 2017–2021 EHT
  observations", arXiv:2509.24593) → [43.3, 44.5].

## Assumptions (stated, not decided)

- **Kerr** (GR, an uncharged black hole in vacuum; no plasma lensing). Units G = c = M = 1 for the curve.
- **Spin**: a ∈ [0, 499/500] (0.998, Thorne's 1974 limit for disk-fed holes). Negative spin is covered by the mirror
  a → −a, α → −α (asserted and checked on sample points); so the band holds for |a| ≤ 0.998. The data constrain
  nothing here (the scout note): the band is a sweep, never a pick.
- **Inclination**: the camera is fixed at θo = 17° (the operator's ruling); the band uses θo ∈ [13.9°, 20.5°] =
  17.2° ± 3.3° (Mertens et al. 2016, A&A 595, A54, from the jet). The EHT's 163° is the same curve mirrored
  (cos θo → −cos θo leaves β² and α unchanged), so every extent is the same.
- **Diameter**: the curve's horizontal extent W = max α − min α, its vertical extent H = 2 max β, and the mean
  diameter d̄ = (W + H)/2. A defined quantity, not "the" diameter; W and H are printed beside it.

## The claims to decide (the enclosures)

(a) **Schwarzschild**: b_c = √27 M (= 3√3 M). Decided exactly: b² = 27 makes r = 3 a double root of r³ − b²(r − 2)
(both the cubic and its derivative vanish at r = 3, in rationals); √27 enclosed by a verified rational bracket.

(b) **Kerr critical curve** (Bardeen 1973, in Gralla & Lupsasca's form, arXiv:1910.12873). With r̃ the spherical
photon orbit radius, λ = −[r̃³ − 3r̃² + a²r̃ + a²]/(a(r̃ − 1)), η = r̃³[4a² − r̃(r̃ − 3)²]/(a²(r̃ − 1)²),
α = −λ/sin θo, β = ±√(η + a² cos²θo − λ² cot²θo), on r̃ ∈ [r̃₋, r̃₊], the roots in [1, 4] of the cubic
r(r − 3)² = 4a². The roots are bracketed by exact rational sign changes (no arccos). To remove the 1/a singularity
the sweep uses u = (r̃ − 3)/a, in which λ = −[r̃²u + a(r̃ + 1)]/(r̃ − 1) and η = r̃³(4 − r̃u²)/(r̃ − 1)², regular at
a = 0 (where the curve is the circle of radius √27). Enclosed: W, H, d̄ at a ∈ {0, 1/2, 47/50, 99/100, 499/500},
θo = 17°; and the band of each over every a ∈ [0, 499/500] at θo = 17°, and over every θo ∈ [13.9°, 20.5°]. An
upper end is a sup over boxes that cover the curve; a lower end comes from points proven to be on the curve.

(c) **Predicted shadow diameter in µas** for each mass row: d̄ × θg, both as intervals (the 17° band and the
inclination band), and the Schwarzschild 2√27 θg.

(d) **Comparison**: ring / d̄ per mass row and ring, as an interval; the published "threshold" is that interval
itself (the factor a row needs). The ring-to-shadow factor is a calibrated premise (GRMHD, Paper VI; Gralla, Holz &
Wald 2019 put a thin disk's lensing ring ~5% outside the curve). Standing: COMPARED.

(e) **ISCO and the clock**: r_isco by Bardeen–Press–Teukolsky 1972,
Z₁ = 1 + (1 − a²)^(1/3)[(1 + a)^(1/3) + (1 − a)^(1/3)], Z₂ = √(3a² + Z₁²), r = 3 + Z₂ ∓ √((3 − Z₁)(3 + Z₁ + 2Z₂)),
at the sample spins (prograde, and retrograde at 0.998), its range over the spin range, and the circular-orbit period
P = 2π (r^(3/2) ± a) t_g in days (coordinate time at infinity, the black hole's rest frame; an observer on Earth sees
it stretched by 1 + z, z ≈ 0.0043, not applied) for each mass row, and the period at r = 6 (Schwarzschild ISCO).

## Two deciders

The JS decider (instruments/kerr/, on instruments/interval) and the Python decider (instruments/kerr/second.py,
stdlib) compute every core number: √27, the cubic's roots, θg and t_g per row, W/H/d̄ at the sample spins, the bands,
r_isco and the periods. Agreement: for every quantity the two enclosures intersect (both contain the true value, so
disjoint enclosures prove a bug and fail the record). The record prints the JS enclosure and the Python one.

## Verdicts

A claim is a stated number or interval for one of the quantities above.
- **CERTIFIED**: the claim's interval contains the enclosure (or a point claim's tolerance does), proven.
- **REFUTED**: the claim is disjoint from the enclosure: false, proven, given the inputs.
- **REFUSED**: the claim is outside the domain (a spin outside [0, 0.998] or |a| ≥ 1, an inclination outside the
  band, a mass row not pinned here), or neither contained nor disjoint at the enclosure's width.
- The ring comparison has no verdict word: COMPARED.

## Red controls (each must come out as named, every run)

1. A planted wrong Schwarzschild value √26 (and b² = 28 failing the double-root test): REFUTED.
2. A mass moved outside its box (Walsh's 3.5e9 replaced by 6.5e9 at 17.9 Mpc, a claim "θg(gas row) ∋ 3.6"): REFUTED.
3. A spin outside the range (a = 0.999, a = 1, a = 1.2): REFUSED, not decided.
4. A forged shadow diameter ("d̄ at a = 0, 17°, EHT row = 30 µas"; "Schwarzschild d̄ = 10.5 M"): REFUTED.
5. The limits: at a = 0 the curve's enclosure contains 2√27 for W, H and d̄; the mirror a ↔ −a gives the same extents.
6. Every scout float (the note's table) inside its box, or listed as a scout error: each is decided as a claim.
7. A tampered pin (a mass row edited in the recorder's input) fails `--check`.

## Prior art to cite in the record

Bardeen 1973 (Black Holes, Les Houches, eds. DeWitt & DeWitt, p. 215); Bardeen, Press & Teukolsky 1972 (ApJ 178,
347); Gralla & Lupsasca 2020 (PRD 101, 044031/044032; arXiv:1910.12873, 1910.12881); Johnson et al. 2020 (Sci. Adv. 6,
eaaz1310); Gralla, Holz & Wald 2019 (PRD 100, 024018); C. Givord 2026, "Elliptic Integrals in Kerr Spacetime: Explicit
Reduction, AGM Evaluation…" (Zenodo, DOI 10.5281/zenodo.19558035), which claims certified AGM error bounds for Kerr
elliptic integrals (its method not read; no elliptic integral is needed in Phase 0, since the Lyapunov exponent is
not among these claims). We found no prior interval enclosure of the Kerr shadow (the scout's search).

## Deviations

Written 2026-10-31, after the enclosures existed (the build, same day):

1. **The inclination band is the first decider's alone, and only for d̄.** Over a wide inclination box, α scales like
   1/sin θo and a point witness loses ~17 Δθo (radians) per box. The first decider answers it with two devices
   written for it (the bound α² ≤ λ² + η + a²cos²θo on the curve, an equality where β = 0, and bracket witnesses:
   a sign change of β² proven at both ends of a u-stretch). The second decider has neither and would need thousands
   of Python boxes. So the band over θo ∈ [13.9°, 20.5°] is decided once, for d̄ only, at tol 2 × 10⁻² M; W and H
   are banded at 17° only. The record says so (secondDecider.notCarried).
2. **The second decider's spin band is a fixed grid**, coarser than the first's branch and bound; agreement is the
   pre-registered intersection of the two enclosures, which holds.
3. **The clock's EHT mass** (the pre-registration named no mass for the EHT row's clock, whose input is θg): M ∈
   [5.6, 7.4] × 10⁹ M☉, the stat and sys halves added linearly. The clock needs M itself, so unlike θg it carries each
   row's distance.
4. **Added**: a = 99/100 among the root and ISCO spins (prograde and retrograde), to decide the scout's numbers there.
5. **Found**: the scout's float script used (3 + 2Z₁ + Z₂) where Bardeen, Press & Teukolsky have (3 + Z₁ + 2Z₂).
   Its r_isco at 0.94 and 0.998, its retrograde r_isco at 0.99, and the three ISCO periods built on them are REFUTED
   in the record (a = 0 is unaffected, since (3 − Z₁) = 0 there).
