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
- [x] Heli-filter refinement: certify-day.js excludes typed non-rotorcraft
      even when A7-miscoded (3 excluded in NYC: A320, BCS3, PA27)
- [ ] Certified segmentation vs hand-verification: spot-verify ~5 real
      flights by inspection (currently builder-verified via synthetic
      calibration only)
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
- [x] THE DAY IS CERTIFIED (`audit/certify-day.js`): NYC 140 aircraft →
      494 flights → 3,952 rows; SP 78 → 155 → 1,240 rows. Headline: Beta
      ALIA 105 flights CERTIFIED under FAA-20 (189 under EASA-nec) — the
      only aircraft whose public numbers can PROVE missions; Archer 129
      flights REFUTED under FAA-20 (exact witnesses; its design mission
      is 20-mi hops, NYC tour/charter days exceed it); Joby ~everything
      REFUSED (public numbers cannot decide); Eve 484/494 REFUSED
      (publishes least). The REFUSED mass is the finding: it measures
      both public-spec opacity AND the FAA-reserve conservatism the
      industry itself protested (Beta's own docket comment)
- [ ] Known-conservatism refinements (recorded, not yet applied): reserve
      power at "normal cruising speed" currently uses the full cruise-v
      box (hi end inflates reserve); mission mass = MTOW box (max-load
      strictness); per-aircraft disk loading from published geometry
      where obtainable
- [ ] The range-claim audit (bonus row): each manufacturer's published
      range claim vs its own physics box — CONSISTENT / REFUTED / REFUSED
- [ ] Stdlib spot-checker (`audit/verify_skyaudit.py`): re-proves sampled
      certificates in exact rationals, zero dependencies

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
