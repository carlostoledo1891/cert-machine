# UFSC labECO — a menu for Pedro Veras Guimarães's line (scouted 2026-09-12)

Target row: `node tools/targets.js labeco`. A menu, not a build. Every send is
operator-gated. Nothing from sin-mfg's `research/mare-farm` is lifted — it is
class C there (41 files withheld, ships empty) and stays there.

## What he actually works on now (OpenAlex + Lattes, 2024–2026)

| anchor | what it is | data |
|---|---|---|
| Reis, **Guimarães**, Farina, Paul, de Paula, Ribeiro — *Global assessment of extreme value analysis for significant wave height*, Ocean Eng. 2026, 10.1016/j.oceaneng.2026.125841, **OA**, **corrigendum** 10.1016/j.oceaneng.2026.126267 | six distributions (Weibull, Lognormal, Normal, Exponentiated Weibull, Generalized Gamma, von Mises) × four GoF tests × block sizes; Anderson–Darling wins; return levels at long return periods, map-scale | his (reanalysis grid) |
| de Bortoli, **Guimarães**, Reis, Farina, Paul, Fetter — *Impact of climate change on extreme wave events … marine structure design*, Research Square rs-8627706 (2026-01) | CMIP5-forced wave models, western South Atlantic; EW return levels on 20-yr windows and 10-yr moving blocks; ΔHs maps | code Zenodo 10.5281/zenodo.18171441 (CC-BY-4.0; API lists no files — check by hand) |
| Petrobras / ANP 2024– *Análise de Extremos Multivariada de Onda, perfil de Vento e perfil de Corrente* (coordinator, with Farina) | joint extremes for offshore design loads = environmental contours (DNV-RP-C205 §3.7, ISO 19901-1); "all codes in Python, delivered to Petrobras" | confidential |
| Vieira, Soares, **Guimarães**, Bergamasco, Campos — Coastal Eng. 2024, 10.1016/j.coastaleng.2024.104694, OA; JMSE 2020; Big Wave Tracker (Nazaré, FCT) | low-cost action-camera stereo, cheap sync scheme, validated on a pressure gauge; "spatial Hs higher than point Hs" | Sci Data 2020 open stereo set |
| **Guimarães**, Stringari, Leckler, Ardhuin — *Geometry of breaking waves at natural sea*, Zenodo 10.5281/zenodo.18408002, CC-BY-4.0, 8.9 GB | 16,000+ breaking waves, Black Sea: area, length, height, duration, speed; claim: **no self-similar geometry** | public |
| Stringari, Prevosto, Filipot, Leckler, **Guimarães** — JGR Oceans 2021 | breaking probability from the Gaussian field, kinematic criterion u/c > 1 | — |
| SKIB (Ocean Sci 2018); *Relative current effect on short wave growth* (Ocean Dyn 2022) | wave–current interaction | — |
| ReNOMO (PNBOIA, SiMCosta, GLOSS-Br), ATMOS 2.0 (Babanin, Voermans) | the national buoy network; Antarctic air–sea–wave | public buoy series |
| teaches Hidrodinâmica, Fenômenos de Transporte, Ciência de Dados, Aprendizado de Máquinas | | |

## What we hold that his field does not

- Outward-rounded intervals with certified `exp / log / tanh / sin / cos / π`
  (`instruments/interval/transcendental.js`). Every return-level formula —
  GEV, GPD, Weibull, Exponentiated Weibull — is exp, log and powers: it
  **encloses**.
- Krawczyk and the radii polynomial (`instruments/interval/radii.js`). An
  MLE is a root of the score equations; a **fit can be certified** as the
  unique stationary point in a box. Nobody in metocean does this.
- Exact rational geometry: a contour's exceedance count on pinned data is an
  **integer**, not a p-value.
- The Forecast Gym (`instruments/forecast`): exact binomial admission,
  conformal boxes — prediction as a proposer, graded by the machine.
- The app doctrine, and the killer-app test PASSES: an offshore operator is
  legally required to produce a defensible 100-year value under DNV/ISO/ABS
  rules. That is his Petrobras contract, word for word.
- Missing, cheap: certified erf / Φ / Φ⁻¹ for IFORM's Rosenblatt map — one
  series with a proved tail bound, the pattern already in transcendental.js.

## The menu, ranked

### 1. The environmental-contour benchmark, re-decided to the last point — BUILT 2026-09-12
**Shipped the same day:** `reports/ec-benchmark.html`, `/instruments/contours`, `instruments/ecbench/`, `certs/ecbench-ledger.json`, `corpus/ec-benchmark/`. See the targets row (`node tools/targets.js labeco`) and HANDOFF's fourteenth session for what was found.

**His anchor:** the Petrobras multivariate-extremes project. **Data, public:**
`github.com/ec-benchmark-organizers/ec-benchmark` — six pinned datasets
(NDBC A–C, WDCC D–F), the RETAINED ten years for A–C, and every participant's
1-yr and 20-yr contour as point lists (`results/exercise-1`, 318 files, 9
contributions; Haselsteiner et al. joint paper 2021).
**Decidable claims:** each contributed contour's exceedance count on the
retained years, exactly (point-in-polygon in rationals); whether each polygon
is closed and simple; the organizers' own statistics recomputed; the three
contour DEFINITIONS (IFORM / ISORM / highest-density) decided against each
other on the same fitted model — the field's live dispute, as arithmetic.
**Face:** a report in the easota mold ("their contours, re-decided"), plus a
playground: drag the return period, watch the contour move and the count
change, with the certified marginal return level drawn as a reference.
**Cost:** 2–3 days. **Hazard:** NDBC/WDCC terms — pin by commit, serve the
derived counts.

### 2. The return-level table as a certificate
**His anchor:** the 2026 Ocean Engineering paper (OA, with a corrigendum).
**The object:** at a handful of grid points (Santos, Campos, the RS shelf):
the MLE certified as the unique root of the score equations in a box
(Krawczyk); the return level as an enclosure from the certified parameters;
the Anderson–Darling statistic as an enclosure; the six-way RANKING **decided
or REFUSED** where two enclosures overlap — refusal as a verdict, applied to
model selection. Then the printed number either lies in the enclosure or it
does not.
**Needs:** his data at those points (or ERA5 — the CDS account that blocked
mare-farm in August is still the operator's to create). **First question to
him:** what did the corrigendum correct? **Honesty line:** the enclosure is
of the point estimate given the fit; the sampling width is statistical and
is said to be — never blur the two (the DEAD atlas row).
**Cost:** 3–4 days after data. This is the paper-shaped one.

### 3. The stereo rig's error budget, certified — BUILT 2026-09-12
**Shipped:** `/instruments/stereo-reach`, `instruments/stereo/` (budget.js, presets.js, battery.js). The Leme 2020 rig's observed RMSE (10–12 cm) lies between the best (2.9 cm) and worst (33 cm) corners of the certified budget at the gauge; the paper's 1.1 mm quantization could not be reproduced under the standard model.

**His anchor:** low-cost stereo (2020, 2024), Big Wave Tracker at Nazaré.
**The object:** baseline B, range Z, focal length / pixel pitch, disparity
uncertainty ±½ px, camera sync error δt at phase speed c → rigorous bounds on
elevation and Hs error (δZ = Z² δd / (f B), plus the sync term c·δt). Three
dials, every bound an enclosure, the "spatial Hs > point Hs" finding of the
2024 paper shown as a computed consequence of footprint.
**Face:** a design tool — "how tall a wave can this rig certify at this
range?" — the ignorance-budget idea landed in his instrument.
**Needs:** nothing. **Cost:** 1–2 days. The cheapest gift on the list.

### 4. Hs forecast credibility on PNBOIA buoys
**His anchor:** ReNOMO / SiMCosta. **Data, public:** PNBOIA and SiMCosta
series. **The object:** the Forecast Gym applied to wave forecasts — a
forecaster emits calibrated boxes, the machine grades coverage exactly, one
that misses its claimed coverage stops being admitted. Predicted and decided
never share a colour.
**Face:** an app in the SkyAudit shape; the compelled buyer is port
operations and the Navy's hydrography. **Cost:** 3–5 days; the instrument
exists, the data pipeline does not.

### 5. Sixteen thousand breaking waves against the laboratory scalings — BUILT 2026-09-12
**Shipped:** `reports/breaking-geometry.html`, `instruments/breaking/`, `certs/breaking-ledger.json`, `corpus/blacksea-breaking/` (the table extracted from the 8.9 GB archive by byte range, not downloaded). 34.5 % of events in Duncan's band; the aspect ratio's median 4.86× Duncan's; self-similarity ratios spread 2× across the middle half; speed–geometry ρ ≤ 0.41 vs 0.90 for area–length.

**His anchor:** the 2026 Zenodo dataset and its claim of no self-similarity.
**The object:** each wave decided inside / outside the Duncan–Phillips bands
(crest-length dissipation ∝ c⁵/g, whitecap area ∝ c², duration ∝ period)
exactly; the fraction outside is a COUNT, not a test statistic; the Λ(c)
moments enclosed and compared with the printed dissipation.
**Face:** a playground — the scatter with an exact envelope and a live
count. **Needs:** the tabular part of an 8.9 GB CC-BY archive. **Cost:** 2
days once the tables are out.

### 6. Waves against a current (teaching playground)
Dispersion with Doppler shift ω − kU = √(gk tanh kd), roots enclosed; the
blocking point where c_g = −U decided; rays over a current jet with the
caustic. Fits Hidrodinâmica and the SKIB line; interferometer/navier-stokes
grammar. **Cost:** 1–2 days. Low novelty, high classroom yield.

### 7. mare-farm, what actually revives
- **Track B, weather-window Wardrop — YES, as a rebuild.** Weather windows
  from Hs thresholds on pinned buoy series (persistence statistics: window
  duration and waiting time), feeding an exact Wardrop routing certificate
  for O&M vessels / port access (`reports/wardrop-repro` already holds the
  public stdlib verifier). His "serviços aquaviários" and "condições
  hidrodinâmicas de navegação" lines. The metocean half is his and exact; the
  equilibrium half is ours.
- **Track A, the farm game — LEAVE IT.** Class C bytes, method tier
  lit-OCCUPIED (Kubica–Woźniak 2010, Bordeaux–Pajot 2005), and not his topic.
  Its one honest lesson carries over: the sea-state scenario tree it wanted
  and never had is the thing his lab has.
- **Track C, wake congestion — no.** Wind farms; not his line.

## Order I would take it
1 → 3 → 2 (data-gated) → 7B. 4 and 5 when a student wants them. 6 anytime.

## Before any build
Scout the interval-MLE literature (verified global optimisation of
likelihoods exists; the INSTANCE is the claim, never the method). Write the
targets row update. Ask Pedro the three questions: the corrigendum, one
grid point's series, whether the Petrobras metocean spec is citable.
