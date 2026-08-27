# SkyAudit — TODO (living; state changes update HANDOFF's TASKS BACKLOG in the same commit)

Legend: [ ] open · [x] done · [~] in flight · (word) = needs the operator's word

## Phase 0 — decisions & research
- [x] Operator decisions: name SkyAudit · 2.5D replay visuals · comparison
      set (Eve + Joby + Archer + Beta) · full-viewport app-shell view ·
      simulated fleet is in scope · city = best data (SP not required)
- [x] Research: visual stack (RESEARCH §1) · data sourcing (§2) ·
      specs/rules/energy models (§3)
- [~] NYC fact verification (Joby–Blade, Archer–United, heliports, SFRA,
      91.225) — agent in flight; lands as RESEARCH §4
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
- [ ] Heli-filter refinement: drop miscoded-A7 fixed-wing types (A320,
      BCS3, PA27 seen) — heli = type in set, or A7 with no contradicting
      fixed-wing type (quirk recorded in PINS.json)
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
- [ ] Re-fetch and hash-pin the rule/paper sources into `data/sources/`
      (FR 2024-24886 PDF, SC-VTOL + MOCs, ED 2025/010/R AMC, Kasliwal,
      Uber Elevate, PRENOR 351-7, ANAC criteria, spec pages) — the
      scratchpad extracts are ephemeral

## Phase 2 — the audit bridge (flight → certificate)
- [ ] Spec packs (`scenario/specs/*.json`): per aircraft, the parameter
      boxes with per-number source + quality flag (RESEARCH §3b/§3e);
      battery kWh ALWAYS an interval; the assumption ledger rendered
      on-page from the pack itself — no prose drift
- [ ] Rule packs (`scenario/rules/*.json`): FAA SFAR shape (20/30/45 with
      the vertical-landing-capability condition explicit), EASA shape
      (mission plan + 5-min final reserve), ANAC = "pending, FAA-
      harmonizing" placeholder; each with the rule citation verbatim
- [ ] Physics pack: Kasliwal-form hover/climb/cruise power over boxes
      (δ, L/D, η intervals) — as a scenario input, cited, swappable
- [ ] Mission mapper (`audit/mission.js`): flight metrics → evtol-
      instrument mission (hover legs, climb, cruise at measured distance;
      speed re-based to the spec's cruise box, NOT the helicopter's) —
      the counterfactual stated precisely
- [ ] Instrument extension (only if needed): mission-from-route
      constructor in `instruments/evtol/`; keep the 4 reds, add: sub-box
      forgery red (1e-9 coefficient slip must be caught), degenerate-
      flight red (zero-distance mission must REFUSE, not certify)
- [ ] Certify the day: flight × spec × rule → `certs/skyaudit-<city>-
      <date>.jsonl`; three-valued counts computed exactly
- [ ] The range-claim audit (bonus row): each manufacturer's published
      range claim vs its own physics box — CONSISTENT / REFUTED /
      REFUSED; "the claims themselves are auditable objects"
- [ ] Stdlib spot-checker (`audit/verify_skyaudit.py`): re-proves sampled
      certificates in exact rationals, zero dependencies
- [ ] Calibration: one hand-built mission with a closed-form answer
      (dyadic numbers, the evtol-battery pattern) must certify exactly;
      the known-answer red can fire

## Phase 3 — the simulated fleet
- [ ] Sim engine (`sim/engine.js`): deterministic tick loop, pinned-seed
      PRNG only, dispatch, charge model (charge-rate boxes), disturbance
      schedule (wind/temperature box widenings) from the scenario file
- [ ] City packs (`scenario/cities/*.json`): heliports/vertiports,
      corridor geometry (SFRA / REH), demand: (a) synthetic schedule,
      (b) RE-FLY mode — the real day's flights as dispatch requests
- [ ] Per-tick remaining-mission certificates; badge-flip events derived
      from enclosure-vs-floor crossings, each with its failing corner
- [ ] Turnaround certificates: charge-rate box × schedule gap → vertiport
      feasibility
- [ ] Fleet-size frontier: binary search N where the day flips REFUTED →
      CERTIFIED per spec; the headline number
- [ ] Sim battery: two runs → identical timeline hash; a disturbance that
      MUST flip a badge, flips it (red); energy conservation per aircraft
      per tick in exact arithmetic

## Phase 4 — the experience (the app shell)
- [ ] `design/app-shell.js`: the new full-viewport view — 100% width ×
      100vh, lateral panels, bottom scrubber dock; same tokens/components;
      DESIGN.md row (operator definition 2026-08-27)
- [ ] Basemap: pmtiles city extract (SP city z0–15 ≈ 91 MB fits Vercel
      Hobby; check NYC size; merge z0–5 world underlay ~17 MB), Protomaps
      "black" flavor, OpenFreeMap dark as runtime fallback; attribution
      (OSM + adsb.lol) in the shell footer
- [ ] Replay client (`src/`): MapLibre v6 + deck.gl v9 MapboxOverlay
      interleaved; TripsLayer comet trails (timestamps normalized to a
      day baseline — 32-bit float gotcha); trail/badge color = VERDICT
      channel, altitude coloring as toggle; 3D building extrusions
- [ ] Scrubber (FR24 pattern): drag, zoomable window, 1x–300x; URL-
      addressable state (?t=…&speed=…&flight=…) — every moment shareable
- [ ] Certificate panel (lateral): route metrics, segment boxes, enclosure
      vs reserve floor drawn, verdict, falsifying corner for REFUTED,
      "rerun this" block (certificate JSON + stdlib command)
- [ ] Click-to-follow + full-day track (ADSBx pattern); flight altitude
      graph synced to scrubber
- [ ] Sim mode UI: live badges, vertiport panels, the flip moment;
      what-if sliders (payload, temperature, rule, fleet size) driving
      the IN-BROWSER certifier (ship instruments/evtol to the page)
- [ ] Mode switch: REPLAY (the real day) ↔ SIM (the fleet) ↔ RE-FLY
      (the fusion) — one map, three lenses
- [ ] Mobile pass: DPR cap, trail-count throttle, panel → bottom sheet
- [ ] Screenshot/probe verification at 1440/390, light+dark, zero
      body overflow (the shot.mjs/probe.mjs pattern from DESIGN.md)

## Phase 5 — trust layer & publish
- [ ] `build.js`: emits `site/apps/skyaudit/`; GATES — full battery, the
      day re-certified from the pinned corpus, headline stats recomputed
      exactly and compared to the page, sim timeline hash re-derived;
      refuses on any deviation
- [ ] Page prose: tl;dr block; honest boundaries (§2 reality-check:
      "the day the network saw"; counterfactual wording; the assumption
      ledger; REFUSED as first-class); aviation wording sweep —
      "mathematically certified enclosure", never bare "certified"
- [ ] `make test` row + control-page battery row; `make site` integration
- [ ] HANDOFF TASKS BACKLOG updated; commit
- [ ] (word) Deploy live; announce/outreach (EmbraerX play uses city
      pack #2) — nothing outward without the operator's word

## Later (parked, not planned)
- Live layer (adsb.lol live API atop the same client) · third city ·
  the LRCAP sibling app (Brazil grid map + certified auction arithmetic) ·
  scenario-pack editor (the commercial "computational notary" kernel)
