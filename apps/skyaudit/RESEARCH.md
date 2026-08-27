# SkyAudit — research (verified at source, 2026-08-27)

Three sweeps: the visual stack, the data sourcing, the aviation numbers and
rule texts. Everything below carries its source; load-bearing numbers get
re-verified when pinned into `data/` or `scenario/`.

## 1. The visual stack — DECIDED (all findings source-verified 2026-08-27)

**The stack: MapLibre GL JS v6.6.0 (BSD-3) + deck.gl v9.3.10 (MIT) via
`MapboxOverlay` interleaved + self-hosted Protomaps PMTiles on Vercel +
`@protomaps/basemaps` "black" flavor. Zero API keys, fully static, all
open licenses.**

- **MapLibre v6.6.0** (2026-08-24): ESM-only, WebGL2 required; globe since
  v5; style-spec `sky`/atmosphere/fog for the cinematic look.
  https://github.com/maplibre/maplibre-gl-js/releases
- **deck.gl v9.3.10** with `@deck.gl/mapbox` `MapboxOverlay` `interleaved:
  true` — trails render inside MapLibre's context with depth sorting, so
  3D buildings occlude them. `TripsLayer` (`@deck.gl/geo-layers`) does the
  animated comet trails: `currentTime` is uniform-cheap per frame (no
  attribute regen) — thousands of trails at 60 fps; a São Paulo day (~1–2k
  flights) is comfortably inside the envelope. **Gotcha: timestamps are
  32-bit floats — normalize epoch times to a day baseline.**
  https://deck.gl/docs/api-reference/geo-layers/trips-layer
- **Tiles, tested live**: Vercel serves Range requests (`206`,
  `accept-ranges: bytes` — probed today), so a `.pmtiles` file ships as a
  plain static asset. Measured with `pmtiles extract --dry-run` against the
  2026-08-26 planet build: SP city z0–15 = **91 MB** (fits Vercel Hobby's
  100 MB/file), SP metro z14 = 42 MB, SP metro z15 = 131 MB (needs Pro).
  Merge a small z0–5 world subset (~17 MB) so zoom-out isn't blank ocean.
  CLI: go-pmtiles v1.31.2; client: `pmtiles` npm v4.5.0.
  https://docs.protomaps.com/guide/getting-started
- **Dark style**: `@protomaps/basemaps` v5.7.2 `namedFlavor("black")` —
  built for data-viz overlays. https://docs.protomaps.com/basemaps/flavors
- **3D buildings over SP are genuinely good**: the PMSP Buildings Import
  put the city's official footprints WITH real `height` tags into OSM
  (CC0, whole central corridor); Protomaps tiles carry
  `buildings.height/min_height` for `fill-extrusion`.
  https://wiki.openstreetmap.org/wiki/PMSP_Buildings_Import
- **Fallback basemap**: OpenFreeMap `dark`/`fiord` — keyless, free for
  production, no request limits, OSM attribution required; use as runtime
  fallback source if the PMTiles fetch fails. https://openfreemap.org/
- **Rejected**: CesiumJS (1.6 MB+ core, heavy on phones; only wins for
  space-to-ground continuity / real terrain occlusion), Three.js-custom
  (weeks of undifferentiated tile/projection work), kepler.gl (analysis
  app, not a branded product surface).

**UX patterns to steal (attributed):**
1. Altitude-colored trails — tar1090/ADS-B Exchange's "rainbow climb-out";
   TripsLayer `getColor` per-vertex from altitude.
2. FR24 playback scrubber — bottom-docked, drag-to-scrub, zoomable time
   window, 1x–300x speed; per-flight altitude/speed graph synced to it.
3. URL-addressable replay state — tar1090's `?replay&replaySpeed=...`;
   every moment a shareable link. Cheap, huge for a demo.
4. Finite fading trails — `trailLength` ~120–180 s with `fadeTrail`:
   comets, not spaghetti; the screen self-cleans.
5. Click-to-follow — ADSBx globe: detail panel + full-day altitude-colored
   track + follow camera (`map.easeTo` per tick).

SkyAudit's twist on all five: the trail/badge color channel carries the
VERDICT (certified / refuted / refused), not just altitude — altitude
coloring stays available as a toggle.

## 2. Data sourcing (ADS-B over São Paulo) — DECIDED (source-verified 2026-08-27)

**The corpus source: adsb.lol `globe_history` daily dumps. Free, no
registration, ODbL-1.0 (redistribution in a public repo is permitted with
attribution + share-alike on the data), published as immutable GitHub
release assets — hash-pinnable by construction. Coverage over São Paulo
verified empirically: a live probe today returned 6 helicopters airborne
over SP (Bell 429, R66, AS350, Bell 505, A109 — light types included),
with registration (`r`) and ICAO type (`t`) embedded per aircraft.**

- **Acquisition (Path A)**: for day D, download release
  `vYYYY.MM.DD-planes-readsb-prod-0` (~4.04 GB in 3 tar parts, published
  ~03:30 UTC on D+1) from
  https://github.com/adsblol/globe_history_2026/releases; optionally the
  `-mlatonly` tar (~350 MB) to catch Mode-S-only helicopters.
  `cat *.tar.a? > day.tar && tar xf` → per-aircraft gzipped JSON traces
  (readsb format: https://github.com/wiedehopf/readsb/blob/dev/README-json.md).
  Filter to bbox lat −23.75..−23.30, lon −46.95..−46.30 (pre-filter: hex in
  Brazil's E40000–E7FFFF block). Docs:
  https://www.adsb.lol/docs/open-data/historical/
- **Pinning**: release tag + per-asset sha256 + sha256 of our extracted SP
  subset, all in PINS.json. **License separation: repo code MIT, the data
  corpus ODbL-1.0 with "Data © adsb.lol contributors" in a LICENSE-DATA
  file beside it.**
- **Helicopter ID**: primary = the traces' own `t` (ICAO type) +
  `category A7` (rotorcraft, squawked by the aircraft itself).
  Authoritative enrichment = **ANAC RAB open data**
  (https://sistemas.anac.gov.br/dadosabertos/Aeronaves/RAB/
  `dados_aeronaves.csv`, 23 MB, refreshed daily, government open data,
  redistributable): registration → `CD_TIPO_ICAO`. Pin its sha256 + date.
  Cross-check only, never vendored: tar1090-db `aircraft.csv.gz` (no
  license), OpenSky `aircraftDatabase.csv` (non-commercial terms).
  Filter set: AS50 AS55 R22 R44 R66 A109 A119 A139 EC20 EC30 EC35 EC45
  EC55 H160 S76 S92 B06 B407 B412 B429 B505 H500, plus the A7 catch-all.
- **Rejected sources**: OpenSky — good live cross-check (free bbox polls;
  4 of the same 6 helicopters visible) but its license is non-transferable,
  non-commercial: a recorded day may NOT be republished in a public repo;
  historical Trino access is application-gated to academic/government.
  adsb.fi — personal, non-commercial only, no redistribution. airplanes.live
  — API now email-approval-gated. ADS-B Exchange / FR24 / FlightAware —
  paid, redistribution prohibited.
- **CITY CHOICE (operator, 2026-08-27: best data wins, SP not required).**
  The dump is GLOBAL — every candidate city is a bbox extraction from the
  SAME pinned day, so the choice is measured, not guessed. Candidates and
  priors: **New York** — ADS-B Out mandated inside the Mode C veil
  (14 CFR 91.225, Jan 2020) → near-complete capture; densest receiver
  region on Earth; the replacement thesis is literal there (Joby acquired
  Blade's passenger business, 2025 — the eVTOL maker owns the helicopter
  routes it intends to convert; Archer–United announced JFK/EWR–Manhattan);
  charted Hudson/East River SFRA corridors; fixed heliports (JRB, JRA,
  East 34th) as vertiport analogs; world-class OSM 3D building coverage.
  **São Paulo** — largest claimed urban fleet (400+; ~1,300–2,200
  movements/day) and the Eve/EmbraerX play, but voluntary equipage
  undercounts the piston tail. Decision rule: extract both, count distinct
  helicopters and heli movements, lead with the richer corpus; the other
  ships as city pack #2. NYC operator/heliport facts are being re-verified
  at source (agent in flight) before any page copy states them.
- **Reality check (honest-boundary material for the page)**: SP helicopter
  ADS-B equipage is VOLUNTARY today — no mandate applies to SP city heli
  ops (offshore Campos Basin mandated since 2018; the general upper-airspace
  mandate slipped to 2030-02-08; VFR exempt) — yet modern turbines
  demonstrably broadcast. The corpus therefore undercounts the piston/VFR
  tail (some R22/R44 are MLAT-only or invisible); the page must say
  "the day the receiver network saw," never "all traffic." Fleet claims to
  cite as claims, ABRAPHE-attributed: 400–410+ helicopters, 210–260
  helipads, ~1,300–2,200 movements/day, world's largest urban fleet
  (vs ~120 in New York). Expect dozens of distinct helicopters and hundreds
  of heli movements in one day's corpus.

## 3. eVTOL specs, reserve rules, energy models — LANDED (source-verified 2026-08-27)

### 3a. The central finding: the boxes ARE the honest state of knowledge

**No OEM publishes battery capacity (kWh) or hover/cruise power. None.**
Joby's pack-level 235 Wh/kg, six 236 kW motor peaks, Vertical's 1.4 MW
battery peak, and VoloCity's exact rotor geometry (the one aircraft whose
disk loading is computable from an official datasheet: ~131 N/m²) are the
only public power-scale anchors in the industry. Every per-mission power
number must therefore come from the physics model with parameters carried
as INTERVALS — which is precisely the shape `instruments/evtol` already
takes. Manufacturer "range" claims conflate reserve treatment (Joby
"including reserves", Wisk "with reserves", Archer/Eve silent) — so the
claims themselves become auditable objects: decide whether a published
range is consistent with the physics box, or REFUSE.

### 3b. Spec table (quality-flagged; full citations in the agent transcript,
re-verified when pinned into scenario/)

- **Eve EVE-100**: 100 km design range, 4 pax at EIS [M, May-2026
  institutional presentation]. Cruise speed NOT published — bracket
  [150, 200] km/h as a stated assumption. MTOW/battery unpublished.
- **Joby S4**: 100 mi "including energy reserves", 200 mph top [M];
  ~1,000 lb payload, MTOW ~5,300 lb [T]; pack 235 Wh/kg [T-attr];
  kWh unpublished (trade estimates 130–180).
- **Archer Midnight**: designed for back-to-back ~20-mi trips with ~10-min
  charge [M]; "up to 100 mi" is marketing; 60-mi worst-case guarantee
  [T]; 150 mph; MTOW 7,000 lb [T]; ~142 kWh press-only.
- **Beta ALIA VTOL**: 153 kt max, 5 pax [M]; VTOL-variant range
  essentially unpublished (336 nm demo is the CTOL); ~325 kWh single
  trade source.
- Also researched: Vertical VX4 (100 mi/150 mph [T]), VoloCity (official
  2024 datasheet: MTOM ~1,000 kg, ~20 km operational range, 18 rotors —
  best datasheet of the set), Wisk Gen 6 (90 mi with reserves, 138 mph,
  autonomous [T]).
- **Eve × São Paulo**: Revo (OHI) binding order June 2025 — 10 firm + 40
  options, ~$250M, launch operator in SP, target EIS 2027, airport-shuttle
  use case [M]; ANAC vertiport sandbox at Campo de Marte (UrbanV/PAX;
  Eve with VertiMob/PRS) [T].

### 3c. Reserve rules — exact structures (the rule packs)

- **FAA — SFAR, 14 CFR Part 194 (89 FR 92296, eff. 2025-01-21)** [R,
  verified against the govinfo PDF]: powered-lift reserves by
  cross-reference. VFR: **20 min** if the AFM shows vertical-landing
  capability along the ENTIRE route (§194.302(l) → §91.151(b)); else
  30 day / 45 night. IFR: **30 min** if copter procedures + vertical-landing
  capability (§194.302(q) → §91.167); else 45. Part 135 mirrors the split
  (§194.306(rr)/(ss)/(uu)) and adds **route-specific deviation authority**
  (OpSpec reserves in minutes for routes with predetermined suitable
  landing areas) — directly relevant to corridor missions. History: the
  NPRM proposed airplane reserves for all powered-lift; 19 of 21
  commenters (Joby, Beta, Archer, Eve, Bristow, GAMA…) pushed back; the
  FAA granted the helicopter tier conditioned on continuous
  vertical-landing capability. The FAA's own cited method reference:
  GAMA, "Managing Range and Endurance of Battery-Electric Aircraft" v1.1.
- **EASA** [R]: design level is performance-based (SC-VTOL VTOL.2430(b)(4):
  "sufficient reserve based on a standard flight" — no minutes anywhere in
  the MOCs, grep-verified). The QUANTIFIED number is operational:
  AMC4 UAM.OP.VCA.191(b) (ED Decision 2025/010/R, under Reg. (EU)
  2024/1111): final reserve = **at least 5 minutes** at go-around/approach
  configuration, atop a mission energy plan, with "safe landing from any
  point along the route with more than final reserve remaining." A
  structurally DIFFERENT shape from FAA's flat minutes — ideal for
  side-by-side interval certificates.
- **ANAC (Brazil)** [R]: EVE-100 certified as special-class under RBAC
  21.17(b) (ANAC's own airworthiness criteria, final ~Nov 2024; Revision 1
  in consultation Jul–Aug 2026, explicitly harmonizing with FAA AC
  21.17-4). ANAC issues the original TC; FAA/EASA validations run
  concurrently. **Operational reserve rules for eVTOL not yet published**
  — ANAC told the FAA docket it favors ConOps-based reserves. Rule pack:
  state ANAC as "pending; FAA-harmonizing," audit under FAA + EASA shapes.
- **DECEA — PCA 351-7 (UAM ConOps, in force 2024-11-28)** [R, quotes from
  the verified PRENOR draft; final text bot-blocked]: doctrine is NO
  exclusive eVTOL corridors — UAM airspace volumes built on the EXISTING
  helicopter structure (REH routes), vertiports with protection-zone
  plans. São Paulo's real helicopter network is explicitly the
  infrastructure UAM starts from — which is literally this app's audit
  premise, citable.

### 3d. The energy model (the physics pack)

**Primary citable model: Kasliwal et al. 2019, Nature Communications
10:1555** [P, open access, verified verbatim]:
- Hover (momentum theory): P_hover = (m·g/η_h)·√(δ/(2ρ)); worked example
  m=1187.5 kg, δ=450 N/m², η_h=0.63 → 250.6 kW.
- Cruise: P_cruise = m·g·V/((L/D)·η_c); example L/D=17, η_c=0.765,
  V=66.7 m/s → 59.7 kW. Climb: P=(m·g/η_c)(ROC + V/(L/D)).
- **Table 1 parameter boxes (the citable intervals)**: L/D 17 [13–20];
  η_c 0.765 [0.70–0.80]; η_h 0.63; δ 450 N/m²; hover budget 60 s
  (2×30 s legs); usable capacity 80% of nameplate, 20% reserve slice.
- Mission-profile cross-reference: Uber Elevate 2016 white paper (140 kWh
  assumption, L/D 17 @150 mph / 13 @200 mph, 92% powertrain, 30-s
  transitions; and the industry's reserve position the FAA later partially
  rejected). Closest peer-reviewed antecedent to this audit: Verberne et
  al., AIAA 2024-3904, "Revisiting Energy Reserve Requirements for
  Battery-Electric VTOL Aircraft" — cite as the literature neighbor.

### 3e. Stated-assumption ledger (goes on the page, verbatim discipline)

The weakly-sourced load-bearing numbers, to be carried as labeled
assumption boxes, never as facts: every battery kWh (the single weakest
layer — intervals only); Eve cruise speed; Eve/Wisk MTOW; Joby 5,300 vs
4,800 lb MTOW; Beta VTOL range; all range claims' reserve treatment.

**Provenance note**: the agent extracted plain-text copies of every source
PDF (FR final rule, SC-VTOL + MOCs, AMC/GM Part-IAM, Kasliwal, Uber
Elevate, PRENOR 351-7, ANAC justification, VoloCity datasheet, Eve
presentation) into the session scratchpad — EPHEMERAL. Phase-1 task:
re-fetch and hash-pin each source into `data/sources/` before any page
quotes it (the corpus/sources pattern).

## 4. NYC facts — VERIFIED AT SOURCE (2026-08-27; gates page copy)

- **Joby–Blade: CLOSED and FLYING.** Announced 2025-08-04, completed
  2025-08-29 (Joby's own release; up to $125M; Blade = wholly-owned Joby
  subsidiary, medical division excluded). The routes operate under Joby
  TODAY: Q2 2026 Blade revenue $36.2M, seats +50% YoY; Manhattan–JFK/EWR
  ~$195/seat from West 30th + East 34th; 90,000+ passengers in 2025.
  https://www.jobyaviation.com/news/joby-completes-acquisition-of-blades-passenger-business
- **Joby flew REAL eVTOL demos in NYC, April 2026**: first point-to-point
  eVTOL flights in NYC history (JFK ↔ Manhattan), week-long campaign
  using JFK, Downtown Skyport, West 30th and East 34th — the exact
  heliports in our corpus.
  https://www.jobyaviation.com/news/joby-brings-electric-air-taxis-to-new-york-city-in-week-long-flight-campaign
- **Archer–United**: EWR–Downtown route announced **Nov 2022** (not 2023
  — correction), full NYC network vision April 2025; as of Q1 2026 Archer
  is in FAA Phase 4, initial US ops "expected 2026" via eIPP, NO announced
  NYC service date. https://news.archer.com/archer-and-united-airlines-announce-first-commercial-electric-air-taxi-route-in-the-us-downtown-manhattan-to-newark-liberty-international-airport
- **Joby–Delta**: active (NYC/LA home-to-airport, $60M equity). **Dubai:
  NOT launched** — "targeting first passengers in 2026" as of Aug 2026;
  write it that way.
- **Heliports**: Downtown Skyport (JRB) — renamed, Skyports/Groupe ADP
  operator, eVTOL electrification in progress; West 30th (JRA) — active,
  pads temporarily on a barge (Penn tunnel works); East 34th — active,
  VertiPorts by Atlantic preparing for eVTOLs. NYCEDC requires operator
  electrification within one year of FAA certification.
- **SFRA (ready paragraph, rule-verified)**: 14 CFR Part 93 Subpart W
  (§§93.350–353, since Nov 2009): Hudson Exclusion — transient traffic
  1,000–<1,300 ft MSL, local ops <1,000 ft, southbound west shoreline /
  northbound east; East River Exclusion below 1,500 ft, closed to
  fixed-wing except seaplanes/LGA-authorized; 140 KIAS max; CTAF 123.05 /
  123.075. https://www.law.cornell.edu/cfr/text/14/93.350
- **ADS-B mandate CONFIRMED with the appendix**: 14 CFR 91.225(d)(2) —
  within 30 nm of appendix D §1 airports, surface to 10,000 ft; appendix D
  lists JFK, LGA, EWR — the whole NYC Mode C veil (and the SFRA corridors
  inside it) requires ADS-B Out since 2020-01-01.
  https://www.law.cornell.edu/cfr/text/14/91.225
