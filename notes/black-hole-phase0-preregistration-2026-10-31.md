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
6. **The distances, read from the papers** (2026-10-31, the Phase 1 lane, closing the gap in § Inputs): each dynamical
   row's distance was read from the paper's own text in its arXiv e-print source (sha256 pinned in the record's
   `distanceSource`). Gebhardt+11 (§1): "We assume a distance to M87 of 17.9 Mpc. The value of the black-hole mass
   scales linearly with assumed distance." Liepold+23 (§1): "at a distance of 16.8 ± 0.7 Mpc to M87, the value adopted
   in [Paper VI] and in this work". Walsh+13 (§1): "Throughout the paper, we assume a distance to M87 of D = 17.9 Mpc
   in order to allow for a direct comparison to the stellar-dynamical M_BH measurement by Gebhardt et al. (2011)";
   its mass, (3.5 +0.9 −0.7) × 10⁹ M☉ (68%), confirmed from its abstract. The search summary's values were the
   papers' own: no input changed, so no enclosure, θg, ratio or ISCO period moved.

## Phase 1 — the lensing maps, computed (pre-registered 2026-10-31, before any map exists)

Written and committed before a single ray is traced. At the commit that adds this section no code in this repository
traces a Kerr null geodesic and corpus/bh-maps/ does not exist. Phase 1 is COMPUTED (double precision, never
enclosed): its maps are a picture of the geometry, checked against the DECIDED curve of Phase 0, which they never
replace. Grammar note for Phase 2: the maps draw dashed (computed); only the Phase 0 curve draws solid (decided).
No renderer, no page. The record is certs/bh-maps-check.json, written by tools/run-bh-maps.js with `--check`.

**What a map is.** For one spin a and the camera's θo = 17° (the operator's ruling), an observer at infinity, and each
pixel of the image plane (Bardeen's α, β in units of M; β along the projection of the spin axis; λ = −α sin θo,
η = (α² − a²) cos²θo + β²), the null geodesic traced backward from the observer, and along it:
- the first three crossings of the equatorial plane outside the horizon, n = 0, 1, 2 (the direct image and the first
  and second photon-ring images), each with its source radius r_s, its source azimuth φ_s (mod 2π; φ = 0 is the
  observer's azimuth, the near side of the disk) and its redshift factor g;
- the ray's fate: captured (it reaches the horizon) or escaped, and the number of crossings it made.

**The grid.** 512 × 512 pixels over α, β ∈ [−20, 20] M; pitch 5/64 M = 0.078125 M (exact); pixel centres at
−20 + (i + ½)·5/64; row 0 is the top (β largest). Stored as IEEE half floats (float16: r_s to ~0.01 M at 20 M, g to
~10⁻³), one RGB file (r_s, φ_s, g) per (spin, n) and one byte per pixel for the fate, under corpus/bh-maps/, with a
JSON manifest (grid, parameters, method, and the sha256 of every file). Budget: a few MB in all (sizes stated in the
record).

**Spins.** a ∈ {0, 1/2, 47/50, 499/500}: four of Phase 0's sample spins, so each map has a decided curve at its own
spin to be checked against. The viewer's default is a = 47/50 = 0.94, CHOSEN (the common GRMHD value 0.9375 is
within 0.003 of it, and 0.94 has Phase 0's enclosures); a = 0 is the Schwarzschild check. The spin stays ASSUMED.

**The disk (ASSUMED, the operator's simple thin-disk model).** Equatorial, geometrically thin; matter on prograde
Keplerian circular orbits, Ω = 1/(r^{3/2} + a), so g = 1/[u^t (1 − Ω λ)] with
u^t = (r^{3/2} + a)/(r^{3/4} √(r^{3/2} − 3 r^{1/2} + 2a)); the disk is CUT at the ISCO (no plunging matter): a crossing
inside r_isco keeps its r_s and φ_s and has no g. The emission the Phase 2 viewer will apply (declared now, not used
by the maps): optically thin, so every image adds; emissivity J(r) ∝ r⁻² on [r_isco, 20 M]; observed intensity
Σ_n g_n³ J(r_n) (a flat emitted spectrum at fixed observed frequency). All of it ASSUMED; none of it decided.

**The method, and why.** An ODE integration with error control, not Gralla & Lupsasca's elliptic closed form, so
that the closed form can CHECK the integration instead of being it. In Mino time τ the geodesic is the second-order
polynomial system r'' = R′(r)/2, u'' = G′(u)/2 with u = cos θ, R(r) = (r² + a² − aλ)² − Δ(η + (λ − a)²),
G(u) = η − (η + λ² − a²)u² − a²u⁴, plus the quadrature for φ: regular at every turning point (no sign bookkeeping)
and at the poles. Dormand–Prince 5(4), adaptive, local tolerance 10⁻¹² (relative and absolute, per component);
each equatorial crossing located by re-stepping the integrator itself (a secant on u = 0); rays start at r = 10⁶ M
with the exact Mino time from infinity (Gauss–Legendre on the regular integrand in 1/r). Captured: r falls below
r₊ + 10⁻⁶. Escaped: outgoing past r = 10³ M (crossings beyond that are not counted; none lies in the field). Only
+ − × ÷ and √ are used per ray (cos 17° and sin 17° are fixed doubles from Phase 0's enclosures), so the maps are
bit-reproducible on any IEEE machine. The elliptic route was the scout's suggestion; it needs four radial root
cases and incomplete elliptic integrals of the third kind for φ, and a mistake there would be invisible without a
second method. Here the second method is the closed form.

**What counts as agreement with Phase 0** (each a check in the record; the words are AGREES / DISAGREES, never
CERTIFIED: a computed map is graded, the premise ladder's "verified" rung):
1. **The pins.** Every file's sha256 matches the manifest, and a deterministic sample of pixels re-traced gives the
   same float16 bits.
2. **The closed form.** On that sample, every crossing's Mino time against Gralla & Lupsasca's angular solution
   (G_θ in Legendre form, Carlson's R_F), and every r_s against the master equation G_θ = I_r with I_r by an
   independent radial quadrature: the measured error printed; agreement if |δr_s| < 10⁻⁶ M on every sampled crossing.
3. **The shadow edge against the decided curve, pointwise.** At points proven on the curve by Phase 0's decider
   (instruments/kerr/kerr.js, interval boxes at the map's spin and 17°), the ray at (1 − 10⁻⁶)·P is captured and the
   ray at (1 + 10⁻⁶)·P escapes; on a subset the traced edge is bisected along the ray through P and its distance to
   the decided point printed.
4. **The shadow edge in the map.** Every pixel's captured bit agrees with the decided curve (inside or outside it),
   except pixels within 10⁻⁴ M of the curve, which are counted and not judged. W, H and d̄ measured from the
   captured pixels lie, within the grid's resolution (a true extent lies in [map, map + 2 × pitch]), in Phase 0's
   enclosures at the same spin (certs/bh-shadow.json).
5. **Schwarzschild.** At a = 0 the traced edge is the circle √27 M: every bisected edge point within the measured
   error of Phase 0's enclosure of √27.
6. **The photon-ring images converge to the curve.** Along spokes through decided points, the outer edge of the
   n-th lensing band (where a ray's crossings drop below n + 1), n = 1 … 4: the distance to the curve strictly
   decreases with n and the last is below one pixel; at a = 0 the ratio of successive distances is e^{−π}
   (Lyapunov γ = π) within 5% for n ≥ 2. For a ≠ 0 the ratios are printed beside e^{−γ} (γ in float from Gralla &
   Lupsasca's formula), not judged.

**Red controls** (each must come out as named, every run): a map at the wrong spin (the a = 0 map against the
a = 47/50 decided curve) DISAGREES on check 4; a map at a wrong inclination (a = 47/50 at θo = 25°, a small grid made
in the check) DISAGREES on checks 3 and 4; rays traced at a = 1/2 at the a = 47/50 decided points DISAGREE on check 3;
a forged texture byte fails check 1; a planted √26 fails check 5.
