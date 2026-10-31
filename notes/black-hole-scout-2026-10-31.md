# The black hole instrument: scout (2026-10-31)

The operator's idea (2026-10-31) is to merge /instruments/navier-stokes/ (the animated streamline renderer) and
/instruments/interferometer/ (M87* from the EHT's 2018 data: the set of skies the data allow) into one M87* black hole
instrument. It would be full 3D in WebGL: rays traced through the Kerr metric in a shader, an orbiting camera, the
lensed disk, the photon rings and the jet, looping without end. It would be drawn in WARRANT, "mathematically accurate,
with honesty on real and assumed". The reference to beat is OpenAI's schematic video (~/Downloads/m2-res_720p.mp4,
"Navier–Stokes Solution, proposed blow-up with smooth forcing · schematic").

This is the scout only. Nothing was built. Every number below marked *(float, scout)* came from
`scratchpad/bhscout/numbers.py`, a throwaway float64 script that is not in the repository. None of those numbers is
decided, and none should be typed on a page until a builder re-derives it.

## Gaps first

1. **sin-mfg is not on this disk.** `~/Projects/sin-mfg` does not exist (HANDOFF already records this: "LIFT sources all
   gone"). So sin-mfg's probe notes, the first place to look for prior art, were NOT searched. What could be searched
   was searched: cert-machine's own corpus/targets.json (rows `vis-interferometer-family` and `vis-warrant-grammar`
   bear on this), notes/, and playground/interferometer/INTERFEROMETER.md. **Open question 1** is where sin-mfg lives
   now.
2. **"The most accurate black hole image" cannot honestly be the headline.** The geometry can be made exact. The image
   cannot be, because what it looks like is set by the plasma, and the plasma is ASSUMED. The EHT's GRMHD libraries
   (ipole on KHARMA/iharm, BHAC, H-AMR, …) carry far more physics than a browser shader ever will. What we can be
   first at (to our knowledge) is a render in which every element's standing is drawn. "Most accurate" is not
   available to us.
3. **The reference video's palette is barred by our own law.** WARRANT v2.2 rule 6 says "No yellow and no orange";
   red is the witness only (rule 5); and a new colour needs the validator's report plus the operator's approval
   (rule 7). The video's orange outflow and red rings cannot be copied. Neither can the EHT's own `afmhot` colour map,
   which is orange. **Open question 2**: which order ramp does the disk use?
4. **"Endless looping" is not physics.** A Keplerian disk shears: the orbital period changes with radius, so no
   pattern on it returns exactly after any finite time T. That would need every P(r) to divide T. A real-time
   procedural render can run forever without looping. A seamless *loop* (for a video) is a CHOSEN device (a crossfade
   or a rigidly rotating pattern) and has to say so.
5. **An orbiting camera at fixed inclination shows nothing new.** Kerr is axisymmetric, so moving the camera in azimuth
   only shifts the source pattern (equivalent to a time shift). The motion that changes the picture is a change of
   inclination, and that leaves M87*'s actual view (~17°). Any other inclination is a picture of the model, not of
   M87* (WARRANT rule 15).
6. **The two instruments share no physics.** /instruments/navier-stokes/ draws the object in OpenAI's Navier–Stokes
   blow-up paper. Using its streamline renderer to draw the disk flow is fine as a technique. Any wording that ties
   the two together physically would be false.
7. **One small fault in our own files, one upstream inconsistency** (reported here, NOT fixed in this lane):
   - `playground/interferometer/data/LICENSE-DATA.md` says the files are redistributed "under the EHT Collaboration's
     own release terms, which require citation". The release repository's LICENSE.txt actually says: "The data files
     in this data set are licensed under the ODC-PDDL license … All python and shell scripts are licensed under
     GPLv3". PDDL is a public-domain dedication. Citation is the EHT's request, not a licence condition.
   - Upstream, not ours: the 2024-D01-01 README says the days are "April 21st, 22nd, 27th", but its own file names
     carry days 111, 112, 115 = April 21, 22, 25 — which is what our LICENSE-DATA.md says. Worth one line on a page.

## 1. Prior art (who has drawn a black hole, and what each assumes)

| work | what it is | what it assumes / its limit |
|---|---|---|
| Luminet 1979, A&A 75, 228 ([ADS](https://ui.adsabs.harvard.edu/abs/1979A&A....75..228L/abstract); [CNRS](https://www.cnrs.fr/en/first-ever-image-black-hole-cnrs-researcher-had-simulated-it-early-1979)) | the first computed image of a black hole with a thin disk: isoradials, redshift and Doppler asymmetry, viewed 10° above the disk, dots drawn by hand | Schwarzschild (no spin); geometrically thin, optically thick disk; one viewing angle |
| James, von Tunzelmann, Franklin & Thorne 2015, CQG 32, 065001 ([arXiv:1502.03808](https://arxiv.org/abs/1502.03808)) | DNGR, the Interstellar renderer: ray *bundles* through Kerr, caustics, critical curves | Kerr; the film's disk left out Doppler beaming and colour shifts for the audience (as the paper recounts), so the film image is not a physical one |
| Gralla & Lupsasca 2020, PRD 101, 044032 ([arXiv:1910.12881](https://arxiv.org/abs/1910.12881)); "Lensing by Kerr black holes" ([arXiv:1910.12873](https://arxiv.org/abs/1910.12873)) | every Kerr null geodesic in closed form (Legendre elliptic integrals, Jacobi elliptic functions); the critical parameters γ (demagnification), δ (rotation) and τ (time delay) of successive images | exact for Kerr. This is our **verification target**: the shader's geodesics can be checked against it ("verified" on the premise ladder) |
| Gralla, Holz & Wald 2019, PRD 100, 024018 ([arXiv:1906.00873](https://arxiv.org/abs/1906.00873)) | the shadow, the photon ring and the lensing ring are different things. For a thin disk the visible lensing ring sits ~5% outside the critical curve and the photon ring's brightness grows only logarithmically | the appearance is set by where the matter is. This is the reason the ring is not the shadow edge |
| Johnson et al. 2020, Sci. Adv. 6, eaaz1310 ([arXiv:1907.04329](https://arxiv.org/abs/1907.04329)) | the subrings are self-similar, set by Lyapunov exponents, and leave universal signatures on long baselines | Kerr; universality in the n → ∞ limit |
| Cárdenas-Avendaño, Lupsasca & Zhu 2023, PRD 107, 043030 ([arXiv:2211.07469](https://arxiv.org/abs/2211.07469); `pip install aart`) | AART: analytic ray tracing on an adaptive image grid, lensing bands, photon rings | Kerr; analytic, not integrated |
| kgeo, A. Chael ([github.com/achael/kgeo](https://github.com/achael/kgeo)) | analytic Kerr ray tracing in Python (elliptic integrals of the third kind via scipy) | Kerr; float64, not enclosed |
| ipole (Mościbrodzka & Gammie 2018), RAPTOR (Bronzwaer et al. 2018, [github.com/tbronzwaer/raptor](https://github.com/tbronzwaer/raptor)), GYOTO (Vincent et al. 2011, [arXiv:1109.4769](https://arxiv.org/abs/1109.4769); GYOTO 2.0 polarized, [arXiv:2311.18802](https://arxiv.org/abs/2311.18802)), Odyssey (Pu et al. 2016, [arXiv:1601.02063](https://arxiv.org/abs/1601.02063); a GPU code with an educational real-time viewer, Odyssey_Edu) | the research GRRT codes behind the EHT's synthetic images | they decide nothing; they carry the GRMHD plasma model (thermal electrons, R_high, MAD/SANE) |
| EHT GRMHD image libraries: Paper V (2019); PATOKA / Illinois library, Wong et al. 2022, ApJS 259, 64 ([EHT page](https://eventhorizontelescope.org/publications/patoka-simulating-electromagnetic-observables-black-hole-accretion)) | the physically richest M87* images that exist | GRMHD plus an electron-temperature prescription; the "v5" library is cited as "Bowden et al., in prep.", and we did not find a public download for its M87* set |
| NASA Goddard, J. Schnittman 2019 ([SVS 13326](https://svs.gsfc.nasa.gov/13326/)) | the best-known public disk visualization | Schwarzschild; a thin, hot disk; an artist-grade render |
| Riazuelo, "Seeing relativity" I–III (IJMPD 28, 2019; [arXiv:2008.04384](https://arxiv.org/abs/2008.04384)) | journeys inside and around Kerr | sky-lensing visuals; no plasma |
| Browser renderers: Grant Kot ([fable.grantkot.com](https://fable.grantkot.com/): a Schwarzschild "single WebGL2 fragment shader"; a Kerr demo "integrated for real"; a WebGPU Kerr–Schild GRRT, "in progress"); R. Reusser ([Kerr geodesics notebook](https://rreusser.github.io/notebooks/kerr-geodesics): WebGPU, one null geodesic per pixel, fixed-step RK4, Novikov–Thorne disk, follows James et al.); oseiskar/black-hole fork with an **M87\* preset** ([adriwin06](https://adriwin06.github.io/black-hole/README): three.js, but photon paths by the *Schwarzschild* Binet solver); starless (rantonels, numpy Schwarzschild; a Kerr fork exists) | **real-time Kerr in a browser is OCCUPIED** | none draws the standing of any element; none states a precision; none overlays data |

**The most accurate public images today** are the EHT's own reconstructions (the 2017, 2018 and 2021 epochs) and the
GRMHD library snapshots that the collaboration fits to them. The first are a *set* that a prior picks from (Feng,
Bouman et al. 2024, already cited in our `vis-interferometer-family` row). The second assume a plasma model. The
newest EHT result is a persistent ring of **43.9 ± 0.6 µas** over 2017–2021, with a brightness position angle that
changes year to year and a polarization helicity that flips in 2021 ([arXiv:2509.24593](https://arxiv.org/abs/2509.24593),
A&A, DOI 10.1051/0004-6361/202555855). The 2018 paper alone gave 43.3 (−3.1/+1.5) µas
([A&A 681, A79](https://doi.org/10.1051/0004-6361/202347932)), and the 2017 papers 42 ± 3 µas
([Paper VI, arXiv:1906.11243](https://arxiv.org/abs/1906.11243)).

**The photon ring has not been detected in M87\*.** Broderick et al. 2022 claimed one. Lockhart & Gralla 2022 and
Tiede et al. 2022 showed that the 2017 data do not constrain its presence. The method preferred a ring even on
synthetic data that had none, and the fitted ring carried an unphysical ~60% of the flux
([Science News](https://www.sciencenews.org/article/disputed-photon-ring-supermassive-black-hole-image-eht);
[arXiv:2208.09989](https://arxiv.org/abs/2208.09989)). So an n = 1, 2 subring on our page is the *model's*, never
"seen".

**Certified Kerr numerics.** We found no paper that encloses the Kerr shadow with interval or ball arithmetic. The
nearest are two papers that this page's claims must cite. C. Givord, "Elliptic Integrals in Kerr Spacetime: Explicit
Reduction, AGM Evaluation…" (Zenodo, DOI 10.5281/zenodo.19558035, 2026-03-30) says it uses "AGM … with certified
error bounds at every step"; its method was not read. Pantsialei 2026 ([arXiv:2601.09655](https://arxiv.org/abs/2601.09655))
gives a least-squares closed-form surrogate for the shadow diameter, with empirical error only.

## 2. Decided, computed, assumed

The critical curve (the shadow edge, Bardeen 1973) is **algebraic in the orbit radius r̃**. Gralla & Lupsasca's form
([arXiv:1910.12873](https://arxiv.org/abs/1910.12873)), with M = 1 and Δ = r̃² − 2r̃ + a²:

    λ(r̃) = a + (r̃/a)·[r̃ − 2Δ/(r̃ − 1)]        η(r̃) = (r̃³/a²)·[4Δ/(r̃ − 1)² − r̃]
    α = −λ / sin θo                          β = ±√(η + a² cos²θo − λ² cot²θo)
    r̃ ∈ [r̃−, r̃+],   r̃± = 2[1 + cos(⅔ arccos(±a))]

The endpoints r̃± are the roots in [1, 4] of the cubic r(r − 3)² = 4a² (the equatorial circular photon orbits). So they
can be bracketed with **exact rational arithmetic** (sign changes), with no arccos. The whole curve is then an
interval image of an algebraic map, given a rational a and an enclosure of cos θo. The Lyapunov exponent

    γ = 4 r̃ √χ / (a √(−u−)) · K(u+/u−),   χ = 1 − Δ/(r̃ (r̃ − 1)²)

needs one complete elliptic integral K. K = π / (2·AGM(1, √(1 − m))), and the AGM's two sequences bracket their limit
monotonically, so K encloses rigorously with what `instruments/interval` already has (sqrt, π). There is no
arccos/acos in the library and none is needed.

| quantity | standing it can reach | value *(float, scout)* | source / note |
|---|---|---|---|
| Schwarzschild critical impact parameter b_c = √27 M = 3√3 M | **DECIDED** (exact: the double root of r³ − b²(r − 2)) | 5.196152… M | textbook; the γ₀ = π and τ₀ = π√27 M limits in [1910.12873] |
| Kerr critical curve at given (a, θo) | **DECIDED** (interval enclosure of an algebraic curve; r̃± by rational root isolation) | at θo = 17°, mean diameter 10.39 M (a → 0) down to 9.67 M (a = 0.999) | Bardeen 1973; GL 2020. Matches the "9.6–10.4 M" range quoted in the literature |
| how far that diameter can move over all spin at 17° | **DECIDED** (a bracket over a ∈ [0, 1)) | [9.66, 10.40] M, a spread of ~7% | this bracket is what the overlay draws |
| Lyapunov γ and subring demagnification e^(−γ) | **DECIDED** (AGM enclosure of K) | a = 0: γ = π, e^(−γ) = 0.0432. On the arc seen at 17°: a = 0.5, [3.017, 3.046]; a = 0.94, [2.36, 2.76]; a = 0.99, [2.11, 2.71] | Johnson et al. 2020; GL 2020 |
| prograde ISCO radius r_isco(a) | **DECIDED** (Bardeen–Press–Teukolsky closed form; cube roots and sqrt, enclosable) | 6 M (a = 0), 2.136 M (0.94), 1.448 M (0.998); retrograde 8.79 M (0.99) | BPT 1972 |
| GM/c³ and orbital periods for M87* | **DECIDED given M** (interval arithmetic on stated mass rows) | t_g = 8.89 h at 6.5×10⁹ M☉. ISCO period 34.2 d (a = 0), 9.5 d (0.94), 6.4 d (0.998), 58 d retrograde (0.99) | matches the EHT's quoted "4.5–58 d" ([Paper II, arXiv:1906.11239](https://arxiv.org/abs/1906.11239)) |
| θg = GM/(c²D) from each published mass | **DECIDED per row** (the arithmetic only) | EHT 6.5e9 at 16.8 Mpc: 3.82 µas (Paper VI quotes 3.8 ± 0.4). Gebhardt+11 stars, 6.6e9 at 17.9: 3.64. Liepold+23 stars, 5.37e9 at 16.8: 3.16. Walsh+13 gas, 3.5e9 at 17.9: 1.93. Simon+23 MUSE Jeans, 8.7e9: 5.11 | sources in §3. **A dynamical mass scales as M ∝ D, so θg from dynamics does not depend on the distance**: the comparison with the ring needs no distance. Verified numerically on the Gebhardt row |
| predicted critical-curve diameter for each mass row | **DECIDED given the row** | EHT mass: 36.9–39.7 µas. Gebhardt: 35.2–37.8. Liepold: 30.5–32.8. Walsh gas: 18.7–20.1 | interval of the curve over spin × θg |
| the measured ring vs the critical curve | **COMPUTED** (the ring is an EHT fit) **and an ASSUMED premise** (the ring/curve ratio) | ring 43.9 ± 0.6 µas = 1.09–1.21 × the EHT-mass curve, 2.1–2.4 × the gas-mass curve | the ratio α_ring/α_curve is calibrated on GRMHD in Paper VI. Grade it *compared* (against GRMHD), not validated. Gralla–Holz–Wald: a thin disk's lensing ring sits ~5% outside |
| the image itself (brightness, asymmetry, flow) | **COMPUTED** (a float32 shader), resting on ASSUMED premises; WARRANT rule 15: "a field drawn from a model is a picture of the model" | — | — |
| shader geodesics | **COMPUTED**, can reach the **verified** premise grade | — | measured against GL's analytic solution and the decided critical curve, error printed (the ladder's "verified": code vs the exact solution of its own equations) |
| spin a | **ASSUMED** | unconstrained: "currently no direct, statistically significant spin constraint". MAD models marginally disfavour \|a\| ≲ 0.2 ([arXiv:2601.00394](https://arxiv.org/abs/2601.00394)) | the page should *sweep* a and draw the decided bracket, never pick one a silently. A pick is CHOSEN, dotted |
| inclination | **ASSUMED** (*compared* at best) | 17.2° ± 3.3° from the jet's motions and jet/counter-jet ratio (Mertens et al. 2016). The EHT uses 163° (spin pointing away from us) | jet direction varies over decades (Walker et al. 2018, [arXiv:1802.06166](https://arxiv.org/abs/1802.06166)) |
| emissivity profile, plasma (thermal e⁻, R_high, MAD/SANE), disk thickness, the flow | **ASSUMED** | — | nothing on the page can check them; this is where "accurate" ends |
| time variability | **ASSUMED** in the render; the data say the ring is stable while the brightness PA and polarization change year to year (2509.24593) | — | the animation is a picture of a model flow |
| the jet | **ASSUMED** at 230 GHz (the first jet-base constraints come only from 2021: new short baselines, NOEMA–IRAM 30 m and KP–SMT). At 86 GHz it is **data**: an edge-brightened jet joined to a ~64 µas ring (Lu et al. 2023, Nature, [arXiv:2304.13252](https://arxiv.org/abs/2304.13252); 60.9 ± 2.2 µas re-imaged, [arXiv:2409.00540](https://arxiv.org/abs/2409.00540)) | — | if drawn, it is a different frequency and a different image, and it must say so |

**The mass tension, and how to say it.** The gas-dynamical mass (Walsh et al. 2013, 3.5×10⁹ M☉ at 17.9 Mpc) puts the
critical curve at ~19–20 µas, so the ring would sit at 2.1–2.4× the curve, far outside the roughly 1.0–1.2 that
lensing-ring theory (~5% outside, GHW 2019) and Paper VI's GRMHD calibration allow (read Paper VI's own table before
quoting a ratio). The stellar masses (Gebhardt+11; Liepold+23 triaxial at 5.37e9) and the EHT's own mass
agree. A MUSE reanalysis argues that the gas disk's inclination was wrong (≈25° rather than 42°), which would
reconcile the two (A&A, DOI 10.1051/0004-6361/202346549, "Revisiting the black hole mass of M 87 using VLT/MUSE
adaptive optics IFU data" — the title and the ≈25° come from a search summary; not read),
and a 2025 JWST study still calls them in disagreement ([arXiv:2510.02439](https://arxiv.org/abs/2510.02439)). The
honest page says three things:
- **decided**: the critical-curve diameter for each published mass row, over every spin at 17°;
- **computed**: the ring diameter;
- **assumed**: the ring-to-curve ratio, *compared* against GRMHD.

It decides nothing about which mass is right. The ratio is the premise everything rests on.

## 3. Data and licences

| data | where | licence | notes |
|---|---|---|---|
| EHT M87 2018 calibrated Stokes I (2024-D01-01) | [github.com/eventhorizontelescope/2024-D01-01](https://github.com/eventhorizontelescope/2024-D01-01) | **ODC-PDDL** for data, GPLv3 for scripts (its LICENSE.txt, read 2026-10-31) | the interferometer already pins the 24 CSVs (playground/interferometer/data) |
| EHT M87 2017 calibrated Stokes I (2019-D01-01), imaging pipelines (2019-D01-02: difmap, eht-imaging, SMILI scripts) | github.com/eventhorizontelescope | same LICENSE.txt size (35,356 bytes); not read word for word | the fiducial images are *reproducible* from the pipelines; we did not find a published image FITS |
| EHT M87 2017 polarized (2023-D01-01), 2011–13 amplitudes (2020-D03-01), 2017 multi-wavelength (2021-D02-01) | github.com/eventhorizontelescope | NOASSERTION in GitHub's metadata; LICENSE.txt present | the 2021 epoch's data were **not found** among the org's repositories (checked 2026-10-31) |
| GRMHD image libraries | PATOKA paper CC BY 4.0; the library itself: no verified public M87* download | — | open question 4 |
| VLBI jet maps at 15 GHz | MOJAVE archive ([cv.nrao.edu/MOJAVE](https://www.cv.nrao.edu/MOJAVE)); FITS also with arXiv:2307.11660 | licence not checked | open question 5 |
| 86 GHz ring + jet (Lu+23) | the paper's data products | not checked | — |
| reference mass/distance rows | Paper VI ([1906.11243](https://arxiv.org/abs/1906.11243)); Gebhardt+11; Walsh+13; Liepold+23 ([2302.07884](https://arxiv.org/abs/2302.07884)); Simon+23 ([2303.18229](https://arxiv.org/abs/2303.18229)) | numbers cited from abstracts and search summaries | **read each paper's own table before pinning a row**: the Walsh 3.5e9 figure came through a secondary summary |

## 4. Technical

- **No library is needed.** A ray tracer is one full-screen triangle and a fragment shader in raw WebGL2. three.js
  (cdnjs has 0.186.1) would buy an orbit control and nothing else. The house practice for libraries is not a runtime
  CDN either: apps/skyaudit vendors maplibre, deck.gl and pmtiles locally, with `VENDOR-PINS.json` and
  `VENDOR-SHA256.txt`. If a library is ever used, vendor it the same way.
- **Precompute, don't integrate per frame.** For a fixed (a, θo, r_obs), the map from the image plane to the n-th
  equatorial crossing (r_n, φ_n, redshift g_n, for n = 0, 1, 2) is static. The render is then a texture lookup plus
  shading of a procedural flow, and moving in azimuth is a shift in φ. Build the maps in node, in float64, from GL's
  analytic forms (as AART does), and ship them as textures (a few 512² float16 RG/BA textures per (a, θo) in a small
  grid of a). Phones manage that easily. A live per-pixel RK4 at 1440 is 1.3 Mpx × ~300 steps, which is fine on a
  laptop GPU and marginal on phones; keep it only for the "leave M87's view" free camera, at reduced resolution.
- **float32 is a COMPUTED layer by construction.** GLSL highp is IEEE single precision (24-bit significand). Near the
  photon orbit, errors grow like e^(γn), so the subrings drawn by the shader are a picture. The DECIDED overlays come
  from the JS/interval layer: the critical-curve band over spin, its diameter for each mass row in µas, and the ISCO
  radius. Those are drawn as solid SVG/canvas strokes over the WebGL canvas. That split is exactly the grammar's own
  rule: a float operation demotes DECIDED to COMPUTED.
- **The ruler.** `tools/check-measure.js` drives every built page at 1440 and 390, and the baseline only turns down.
  A full-viewport WebGL page must answer to it like navier-stokes does. CDP screenshots of WebGL need real waits (the
  CLAUDE.md UI rule) and headless Chrome needs `--use-gl=swiftshader` or angle. Swiftshader is CPU-only, so
  screenshot only the precomputed path.

## 5. What would be new (to our knowledge, as of 2026-10-31)

Searched: arXiv/ADS via the web, GitHub, and the browser demos above. We found none of these:
- **A black-hole render with each element's standing drawn**: the critical curve solid (decided), the shader image
  dashed (computed), the chosen spin dotted, the unconstrained photon ring labelled as the model's, the premise chain
  graded.
- **The decided critical-curve band for each published mass row, overlaid on the interferometer's data-allowed set**
  (its prior-free concentration ceilings and its closure-phase-chosen ring). This shows the mass tension at a glance,
  with no distance in it.
- **A Kerr shadow curve and Lyapunov exponent enclosed in interval arithmetic** in a public page. Givord 2026 claims
  certified AGM bounds for Kerr elliptic integrals; we did not read the method, and the page must cite it.
- **Honest time.** Each second of animation is labelled in days of M87*'s time, for a stated spin, and the page says
  that a shearing disk cannot loop.

Not new, and not to be claimed: real-time Kerr in a browser (Kot, Reusser, others); an M87* preset (oseiskar fork);
"the family of images" (Feng+24, Paper IV); photon-ring visuals (DNGR, NASA, everyone).

## Recommended plan

Phase 0 (one session): **the decided layer, no graphics.** `instruments/kerr/` or a `families/` member:
- r̃± by rational root isolation of r(r − 3)² = 4a²;
- the critical curve as interval boxes for rational a and an enclosure of cos θo;
- the diameter bracket over a ∈ [0, 1) at 17° ± 3.3°;
- K by AGM enclosure, and γ;
- the BPT ISCO formula and periods for the mass rows.
Reds:
- a planted wrong √27 must fail;
- the a → 0 limits γ → π and diameter → 2√27 must hold;
- the a ↔ −a mirror must hold;
- every float value from the scout script must fall inside its box.
Writes `certs/kerr-*.json`.

Phase 1 (1–2 sessions): **transfer maps.** Node float64 from GL's analytic solution, for n = 0, 1, 2, a ∈ a small grid,
θo = 17°. Checked against Phase 0: each map's n → ∞ edge must sit inside the decided critical-curve box. That is the
"verified" rung, with its measured error. Shipped as textures with sha256 in a record.

Phase 2 (1–2 sessions): **the viewer.** Raw WebGL2:
- a procedural flow on the disk with Keplerian shear (navier-stokes' streamline renderer can draw the velocity field
  as streaks);
- g³–g⁴ beaming;
- n = 1, 2 as separate layers that can be switched off;
- runs forever and never claims to loop;
- a clock in M87* days;
- an order ramp from the register (pending the colour ruling).

Phase 3 (one session): **the merge.** Over the render:
- the interferometer's data-allowed set;
- the decided critical-curve band per mass row, solid;
- the ring diameter 43.9 ± 0.6, dashed;
- the GRMHD ratio as the named assumed premise;
- `W.premisesHtml` with the ladder: geodesics *verified*, GR *compared*, mass *compared*, inclination *assumed*, spin
  *assumed*, plasma *assumed*.

Phase 4 (optional): a free camera that leaves M87's view (labelled "a picture of the model"), and the 86 GHz jet image
as data at its own frequency.

Rough total: **5–7 sessions.** Phase 0 is worth doing even if nothing else ships: it decides the one number on the
EHT story that everyone quotes and no one encloses.

## Open questions for the operator

1. sin-mfg is not on disk. Where is it, and did its probes ever touch black holes or Kerr?
2. Colour. Orange, yellow and red are barred (v2.2). Should the disk be the grey order ramp, the order greens already
   registered for Machinidae (#9fd0bb · #5f9a83 · #335e4e, which mean "how far a birth got" there; one colour, one
   meaning), or a new order hue? A new hue needs a validator report and your approval.
3. "Most accurate" is not available honestly; the plasma is assumed. May the headline be the *standing* instead (for
   example "every line on this black hole says what it stands on")?
4. Does the instrument need GRMHD images? We found no public M87* library download. Ask the Illinois group, or go
   without?
5. The jet. Is it drawn at all at 230 GHz (assumed), or only from 86 GHz/15 GHz data at their own frequencies?
   MOJAVE's licence is unchecked.
6. Camera. Keep M87*'s 17° view as the default and make inclination changes an explicit "leave the data" control?
7. A video loop for X. If the page cannot loop honestly, may the export use a labelled crossfade?
8. Should the LICENSE-DATA.md licence wording (§ Gaps 7: the data are ODC-PDDL) be corrected in a separate small commit?
