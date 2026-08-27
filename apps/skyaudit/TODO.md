# SkyAudit — TODO (living; state changes update HANDOFF's TASKS BACKLOG in the same commit)

Legend: [ ] open · [x] done · [~] in flight · (word) = needs the operator's word

## Phase 0 — decisions & research
- [x] Operator decisions: name SkyAudit · 2.5D replay visuals · comparison
      set (Eve + Joby + Archer + Beta) · full-viewport app-shell view ·
      simulated fleet is in scope · city = best data (SP not required)
- [x] Research: visual stack (RESEARCH §1) · data sourcing (§2) ·
      specs/rules/energy models (§3)
- [x] NYC facts VERIFIED at source (RESEARCH §4): Joby-Blade CLOSED
      Aug 2025, routes flying under Joby today ($36.2M Q2-2026); Joby
      flew real JFK-Manhattan eVTOL demos Apr 2026 from OUR heliports;
      Archer-United Nov 2022 (date corrected), no NYC service date;
      Dubai NOT launched (targeting 2026); all 3 heliports active,
      Downtown Skyport eVTOL conversion underway; SFRA paragraph
      rule-verified; 91.225(d)(2)+appendix D = whole Mode C veil.
      One verified sentence added to the audit card
- [x] CITY DECISION by measurement: **NYC flagship** (143 helis / 382
      flight proxies / 17,879 airborne min vs SP 78 / 132 / 3,406);
      SP = city pack #2. Recorded in APP.md + PINS.json

## Phase 1 — the corpus (the pinned day)
- [x] Day pinned: 2026-08-26 (Wed). All 4 assets downloaded + sha256'd
      (prod .aa/.ab/.ac + mlatonly; PINS.json)
- [x] Extraction tool (`audit/extract.js`): streaming tar reader, gunzip,
      dual-bbox filter, full/heli split; calibrated on a synthetic tar
      with known answers; real run: 125,746 traces, 0 parse errors
- [x] Measurement (`audit/measure.js`): flight proxies per city → the
      city decision (also calibrated on the synthetic)
- [x] PINS.json + LICENSE-DATA (ODbL) + data/.gitignore: committed corpora
      are *.heli.jsonl.gz (NYC 4.7 MB, SP 0.8 MB); raw hashes pinned for
      gunzip-verification; *.full.jsonl local, regenerable
- [x] Heli-filter refinement: certify-day.js excludes typed non-rotorcraft
      even when A7-miscoded (3 excluded in NYC: A320, BCS3, PA27)
- [x] Spot-verification: 5 real aircraft inspected (H160 shuttle legs
      g2g at type cruise speeds, S-76 charter 227-264 km/h, B06 tour
      loiter, NYPD B407 patrol with honest gap flags) — all type-
      consistent; 2 pinned as corpus-tied battery regressions (21/21)
- [ ] Helicopter ID: traces' own `t` + `category A7`; enrichment joins —
      ANAC RAB `dados_aeronaves.csv` (SP; open data, pin sha + date) and
      the FAA Releasable Aircraft Database (NYC; public domain, pin) —
      N-number/registration → type
- [ ] Flight segmentation (`audit/flights.js`): traces → flights (takeoff/
      landing detection, gap tolerance), per-flight route metrics
      (distance, duration, altitude profile, hover-like dwell segments)
- [ ] Segmentation battery: N hand-verified flights reproduce exactly;
      reds — a scrambled trace must FAIL, a synthetic flight with known
      metrics must round-trip, a duplicated-point trace must not create
      a phantom flight
- [x] Sources pinned: 10 PDFs fetched (FR rule, SC-VTOL + 2 MOCs,
      AMC/GM Part-IAM, Kasliwal, Uber Elevate, PRENOR 351-7, ANAC
      criteria, VoloCity spec) — SOURCES-PINS.json committed (sha256 +
      url + date), PDFs local/gitignored, re-fetchable + verifiable

## Phase 2 — the audit bridge (flight → certificate)
- [x] Certified segmentation (`audit/flights.js`): monotonic-time contract
      (scrambled trace THROWS), 900 s gap split, 60 s ground-contact rule,
      honesty flags (truncatedStart/End, gaps); battery-calibrated
- [x] Spec packs (4, quality-flagged per number; Eve = all-assumption,
      stated as measured ignorance) · rule packs (FAA SFAR 20-min tier,
      EASA 5-min final reserve as NECESSARY CONDITION; ANAC pending) ·
      physics pack (Kasliwal 2019 boxes + distance pads as stated
      assumptions)
- [x] Power model (`audit/power.js`): monotone-corner box evaluation,
      outward-padded; battery reproduces the paper's worked examples
- [x] Mission mapper (`audit/mission.js`): the counterfactual precisely
      stated; eVTOL flies its own speed box over the observed distance box
- [x] Battery (`battery.js`, 11/11): segmentation calibration + 3 reds,
      power calibration, dyadic hand-computed CERTIFIED/REFUTED/REFUSED
      through the real instrument, Eve-REFUSES honesty check
- [x] THE DAY IS CERTIFIED (`audit/certify-day.js`), counts CORRECTED
      after prod+MLAT dedupe (audit/corpus.js — richest trace per icao;
      the first-pass 143/494 numbers counted corpus lines): NYC 82 unique
      (79 audited) → 382 flights → 3,056 rows; SP 61 → 148 → 1,184 rows.
      Headline: Beta ALIA 46 flights CERTIFIED under FAA-20 (110 under
      EASA-nec) — the only aircraft whose public numbers can PROVE
      missions; Archer 120 flights REFUTED under FAA-20 (exact witnesses;
      its design mission is 20-mi hops, NYC tour/charter days exceed it);
      Joby 0 certified (12 REFUTED, rest REFUSED — public numbers cannot
      decide); Eve 376/382 REFUSED (publishes least). The REFUSED mass is
      the finding: it measures both public-spec opacity AND the
      FAA-reserve conservatism the industry itself protested (Beta's own
      docket comment)
- [ ] Known-conservatism refinements (recorded, not yet applied): reserve
      power at "normal cruising speed" currently uses the full cruise-v
      box (hi end inflates reserve); mission mass = MTOW box (max-load
      strictness); per-aircraft disk loading from published geometry
      where obtainable
- [x] RANGE-CLAIM AUDIT (sim/optimize.js range_claims + panel card):
      claims are EXISTENTIAL (CONSISTENT = some point of the maker's own
      boxes achieves it; REFUTED = none does); Archer's 60-mi worst-case
      guarantee is the one UNIVERSAL claim. RESULTS: Joby 100mi-incl-
      reserves CONSISTENT · Archer up-to-100mi CONSISTENT · Archer 60-mi
      GUARANTEE = UNDECIDABLE from public numbers (margins straddle:
      -70/+65 kWh — a guarantee the public cannot check) · Eve 100km
      CONSISTENT · Beta: no VTOL claim to audit. Battery red both
      directions (5000 km must REFUTE, 2 km must CERTIFY)
- [ ] Stdlib spot-checker (`audit/verify_skyaudit.py`): re-proves sampled
      certificates in exact rationals, zero dependencies

## Phase 3 — the simulated fleet
- [x] RE-FLY THE DAY SHIPPED (`sim/refly.js`) — better than the binary
      search: the pool model (fixed departures, charge occupancy from
      worst-corner depth × the spec's charge_minutes_full box) makes
      minimum fleet EXACT via interval coloring. Both directions proved:
      N−1 REFUTED by pigeonhole at a witnessed instant; N CERTIFIED by
      the greedy schedule, verified exactly. Zero randomness; timeline
      sha256 in the record. RESULTS (FAA 20-min): NYC — Beta ALIA's 46
      provable legs need EXACTLY 5 aircraft (witness 09:58:33 ET, the
      morning rush; EASA-nec: 110 legs, 12 aircraft, witness 18:22 ET);
      Joby/Archer/Eve: zero provable legs — no fleet certifiable from
      public numbers. SP — Beta 50 legs, exactly 8 (witness 15:20 BRT).
      Non-certified demand reported as outside-the-envelope, never
      dropped. Panel carries the frontier; build gate 4 re-derives it and
      REFUSES on drift (restoring the record so a drift refuses EVERY
      run — gate-weakness found and fixed for gates 2+4)
- [x] Turnaround folded into the charge-occupancy model (charge boxes
      added to all four spec packs, quality-flagged)
- [x] Sim battery (16/16 total): known-answer frontier, RED charge-time
      must flip 2→1, RED double-booked schedule must fail verification,
      outside-envelope accounting, two-run determinism hash
- [x] THE OPTIMIZER SHIPPED (sim/optimize.js, operator direction
      2026-08-27 "show how the system could be optimized"): certified
      thresholds proved on BOTH sides of every flip, 0.4 s over the day.
      (1) BATTERY FLOORS: nameplate kWh for 50/80/95% coverage — Joby
      needs 301 kWh for HALF the day (trade estimate 130-180); Archer
      323 (vs ~142); Beta 355 (vs 250-325, the only one close); Eve 386
      (counts corrected after the strict-filter fix reached optimize).
      (2) CHARGE LEVER: Beta fleet 5 aircraft at 49+ min charge, 4 at
      24-48, 3 at <=23 — faster chargers provably worth two aircraft.
      (3) RESERVE PRICE: Beta provable legs at 5/10/15/20/25/30 min =
      194/171/110/46/8/0 — at a 30-min reserve NOTHING on this day is
      provable (the FAA docket fight, priced). Monotonicity-guarded
      bisection (red: spike on the probe path must THROW); battery 19/19
      incl. optimizer-agrees-with-audit cross-check; build gate 5
      (drift refuses, record restored); panel card "What would it
      take?"; per-flight RESERVE WHAT-IF slider (client, scales the
      recorded reserve enclosure, honest preview label, flips live
      REFUTED->REFUSED->CERTIFIED)
- [ ] Live sim mode on the map (aircraft badges, the flip moment
      animated on trails) — remaining Phase 4b UI
- [ ] Synthetic demand packs + vertiport geometry (heliport nodes,
      SFRA/REH corridors) — later scenario packs

## Phase 4 — the experience (the app shell)
- [x] `design/app-shell.js` SHIPPED: the second design-system view —
      full-viewport, top bar, lateral panel, bottom dock, app verdict
      tokens (--v-cert/--v-refu/--v-refd) in both palettes with the
      three-state guard pattern; DESIGN.md section pending
- [x] Basemap: NYC z14 pmtiles extract 36.9 MB (z15 was 114.6 MB — over
      Vercel Hobby's 100 MB), pinned in data/tiles/TILES-PINS.json,
      SAME planet build date as the traffic day (20260826); Protomaps
      "black" flavor style.json generated via @protomaps/basemaps 5.7.2;
      vendor libs pinned (maplibre-gl 5.24.0, deck.gl 9.3.10, pmtiles
      4.5.0 — VENDOR-PINS.json); attribution in the dock
- [x] Replay client (`src/app.js`): TripsLayer comet trails over the
      day-relative clock, verdict color channel (token-sourced at
      runtime) + altitude toggle, heads layer, pick-to-select,
      3D building extrusions (PMSP heights)
- [x] Scrubber: drag + speed 1–300x + ET clock + URL-addressable state
      (?t&s&k&m&f); zoomable time window and per-flight altitude graph
      still open
- [x] Certificate panel: flight metrics + truncation honesty, verdict +
      explanation, usable-vs-demanded interval bars (the refutation is
      VISIBLE — disjoint bands), exact witness string, all-8 verdict
      chips, follow/deselect; "rerun this" JSON download still open
- [x] VERIFIED by headless screenshots (1440×900): map+trails+panel
      render; found+fixed en route: python http.server serves no Range
      (dev server serve.mjs in scratchpad; Vercel verified 206 by the
      research agent)
- [x] Altitude sparkline in the flight card (SVG, cursor tracks replay
      time) + the honest flip-moment: WORST-CORNER EXHAUSTION MARKER on
      the selected route (the km at which worst-corner accrual net of
      reserve exhausts — labeled preview from recorded enclosures)
- [ ] Sim mode UI: live badges, vertiport panels, the flip moment;
      what-if sliders (payload, temperature, rule, fleet size) driving
      the IN-BROWSER certifier (ship instruments/evtol to the page)
- [ ] Mode switch: REPLAY (the real day) ↔ SIM (the fleet) ↔ RE-FLY
      (the fusion) — one map, three lenses
- [ ] Mobile pass: DPR cap, trail-count throttle, panel → bottom sheet
- [ ] Screenshot/probe verification at 1440/390, light+dark, zero
      body overflow (the shot.mjs/probe.mjs pattern from DESIGN.md)

## Phase 5 — trust layer & publish
- [x] `build.js` gates (5): battery · re-certify-and-compare (restores
      record on refusal) · bundle-match · refly-frontier-compare (same) ·
      tile-hash. All green
- [x] STDLIB RE-PROOF (`audit/verify_skyaudit.py`): independent Python
      reimplementation, exact Fractions + integer-sqrt bounds, zero deps —
      830 rows re-proved (all CERTIFIED worst-margins >= 0 exactly, all
      REFUTED best-margins < 0 exactly, power boxes contain exact
      intervals), 0 defects, 2 reds fire (flipped verdict + tampered box
      both caught)
- [x] `make test`: rows "skyaudit app" + "skyaudit stdlib verifier" —
      29/29 PASS. `make site`: runs apps/skyaudit/build.js; build-site
      treats site/apps/ as an APP-OWNED ZONE (never generates or prunes
      there — the two-builders-one-tree bug pre-empted)
- [x] Mobile + theme pass: true-390px device emulation verified (panel
      right edge 382/390, dock exactly 390; bottom-sheet layout); the
      CLI-window "overflow" was a headless >=500px window-width clamp,
      not a page bug; ?theme=light|dark param added to the app shell
      (light chrome over the always-dark map canvas — deliberate);
      headline panel text on-page
- [x] DEPLOYED LIVE (default-publish rule, 2026-08-27):
      https://carlostoledo.co/apps/skyaudit/ — all URLs verified 200,
      tiles 206 on Vercel CDN, live page screenshot green.
      DONE = public URL + rerunnable: both hold
- [ ] (word) Announce/outreach (EmbraerX play uses city pack #2) —
      nothing outward without the operator's word
- [x] Landing section shipped (tools/build-site.js "the app"): numbers
      read from the app's own gated records at build; live on /
- [x] UI V2 (operator direction 2026-08-27: "high end app design, our
      colors, sans+mono, Figma/Webflow look"): app shell rebuilt — Inter
      + IBM Plex Mono (no serif on app pages), card-based panel,
      aircraft-by-rule MATRIX, verdict stat tiles, frontier rows, verdict
      banner + enclosure track viz, segmented speed/color controls,
      styled scrubber, round transport button; mobile dock exact-fit
      (speed segment hidden <=720px). Verified live by real-time
      screenshot, desktop + mobile
- [x] TILES FIX (the map-not-loading bug): Vercel CLI silently dropped
      the 36.9 MB pmtiles from deployments (smaller files shipped) — the
      pinned tile bytes now live IN the public repo and serve from
      raw.githubusercontent (Range + CORS verified), immutably pinned by
      commit SHA in TILES-PINS.json served_from; client falls back to
      OpenFreeMap dark if the pinned URL is ever unreachable. Live
      basemap verified rendering in production

## Later (parked, not planned)
- Live layer (adsb.lol live API atop the same client) · third city ·
  the LRCAP sibling app (Brazil grid map + certified auction arithmetic) ·
  scenario-pack editor (the commercial "computational notary" kernel)

## Phase 6 — THE PRODUCT REFRAME (operator direction 2026-08-27: "less
## math, more product" — verdicts become the trust layer, answers become
## the interface). Ranked build order agreed in session:

- [x] 6.1 DONE — E-FLYABLE ✓ / BEYOND RANGE ✗ / NEEDS DATA ? on the
      surface; CERTIFIED/REFUTED/REFUSED + enclosure + witness folded
      into "The certificate — why you can trust this" details; the 12%
      provably-electric score; Earth-lap headline computed at build.
      ORIGINAL: surface labels become E-FLYABLE ✓ / BEYOND
      RANGE ✗ / NEEDS DATA ? (CERTIFIED/REFUTED/REFUSED + witnesses move
      to the certificate detail layer, one click down); counts become
      scores ("this day is 12% provably electric"); headline stat band
      gains product numbers (53,024 km flown = 1.3x around the Earth)
- [x] 6.2 DONE — scenario/fuel-rates.json (class boxes q:E, wide
      default for unknown types) + audit/economics.js + build gate 6 +
      panel card. THE DAY: 56.6-78.6 kL Jet-A, $74k-$165k, 141-200 tCO2;
      the 46 e-flyable flights: $100-$901 electricity vs $1,647-$3,580
      fuel for the SAME flights - intervals disjoint (sentence is
      computed, not asserted), 3.2-4.3 tCO2 avoided. ORIGINAL: per-type helicopter fuel-burn rates
      (published, quality-flagged, pinned) x flight durations -> today's
      Jet-A liters, $ and tonnes CO2; the provably-electric subset's MWh
      and $ from the certified enclosures; rollups per flight / route /
      operator. The first per-real-flight DECISION of the UAM industry's
      own economics pitch. New scenario pack: fuel-rates.json
- [x] 6.3 DONE — audit/stories.js + gate 7 + THE DAY card: hourly
      activity bars (peak 17:00), leaderboard (N408GG 18 legs/6.5h),
      records (720-km B407 day; 342-min B06 tour marathon; H60 at
      6,850 ft; S76 at 160 kt), INFERRED ops mix (heuristics stated),
      measured outliers (Army H60 orbit 72x direct; news B06 hovering
      46%). Fixed en route: the strict heli filter moved into corpus.js
      (one definition) - stories had leaked the miscoded-A7 A320.
      ORIGINAL: rush-hour narrative (the 09:58 /
      18:22 witness instants), busiest-aircraft leaderboard, records of
      the day (longest/fastest/highest), inferred operation types
      (tour loop / patrol / medevac / offshore — labeled INFERRED);
      "running clean vs outliers" ops view: detour factor (flown/direct),
      altitude vs SFRA bands, turnaround dwell — measurements, never
      judgments of the operator's mission
- [x] 6.4 DONE — designerGrids in optimize.js (33-point battery grid x4,
      16-point reserve grid x4, 61-point charge curve; 0.73 s total; all
      inside the gate-5 record), embedded into the page config; three
      live sliders (battery / reserve rule / charge time), every position
      a precomputed certified point. ORIGINAL: the certified curves (fleet vs
      charge time, coverage vs battery kWh, coverage vs reserve minutes)
      become live sliders — every slider position backed by a
      precomputed gated point; feels like a simulator, is a proof table
- [x] 6.5 DONE — audit/ambient-bundle.js: 4,133 non-heli aircraft
      clipped to bbox, 60-s downsample, 2.4 MB, dim non-pickable
      TripsLayer beneath the helicopters; keeps previous bundle when the
      local full.jsonl is absent (decor never gates). ORIGINAL: dim all-traffic layer under the helicopters
      (nyc.full.jsonl has 4,444 aircraft incl. every JFK/LGA/EWR
      airliner; downsample hard) — the living-city wow
- [x] 6.6 DONE + THE UX OVERHAUL (operator direction: tabs, left panel,
      gamification, Garmin benchmark):
      * FLIGHT PLANNER shipped: scenario/cities/nyc.json (7 verified-active
        heliports + hand-simplified SFRA corridor graph, honesty stated),
        sim/planner.js (Dijkstra + all 21 pairs x 8 verdicts precomputed,
        gate 8); PLAN tab: origin/dest selects + swap, magenta route on
        the map, GO/NO-GO/NEEDS-DATA annunciator lozenges per aircraft,
        time + charge-after + proved margin, band notes. JRB->JFK 24.4 km:
        Beta GO (12.4 kWh proved), everyone else NEEDS DATA
      * THREE TABS (DAY / FLEET / PLAN) on the right; SELECTED FLIGHT
        moved to a LEFT panel with minimize/close (FR24 pattern)
      * GAMIFIED designer: arc gauge (banded color), battery pictogram
        fill, eVTOL fleet silhouettes lighting up, medal leaderboard;
        aircraft heads became heading-oriented chevrons; heliport nodes +
        labels always on the map
      * Flight-ops UI research (RESEARCH section 5): Garmin/ForeFlight/
        FR24/Skydio patterns mapped and applied; color grammar kept
        token-pure
      * Found+fixed: optimize.dayFlights missed the strict rotorcraft
        filter (394 vs 382) — filter now single-sourced in corpus.js;
        floors corrected to 301/323/355/386
- [ ] Throughout: honest-boundary discipline unchanged — inferred labels
      stated, fuel rates flagged, previews labeled; the math never
      leaves, it just stops being the headline

## Phase 6.7 — PLAN tab elevated (operator direction 2026-08-27: the tab
## is GOLD — valuable; standard palette kept)
- [x] PLAN map mode: replay flights/ambient HIDDEN; the whole corridor
      NETWORK drawn translucent; hover brightens a route; click selects
      it (map or selects); the chosen pair at full opacity + width
- [x] DISPATCH: eligible (GO) aircraft get a DISPATCH button — the
      aircraft flies the route live on the map (chevron + ring, pinned
      to its route + direction) on the replay clock
- [x] LIVE MISSION card: journey bar (origin/dest codes), Garmin-style
      data blocks (SPD/ALT/BATT/MARGIN/DIST/ETA/L-D/PWR), EN ROUTE /
      RESERVE BREACH PROJECTED / LANDED annunciators, ABORT/CLEAR,
      missions-completed counter
- [x] THE SPEED-RANGE TRADEOFF, plausibly: energy vs speed acts through
      the L/D(V) line anchored on the CITED Uber Elevate points (L/D 17
      @ 241 km/h, 13 @ 322); fly faster -> L/D falls -> more kW AND more
      energy per km -> projected margin shrinks; push too hard and the
      HUD flips to RESERVE BREACH PROJECTED ("slow down to restore
      margin") — the physics as a game mechanic, honestly labeled:
      mid-box simulation; the certified verdict stays the annunciator
- [x] Mission pins its route+direction at dispatch (select changes
      cannot teleport it); reversed routes fly reversed with flipped
      heading
