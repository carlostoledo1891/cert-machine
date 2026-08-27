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
- [ ] The range-claim audit (bonus row): each manufacturer's published
      range claim vs its own physics box — CONSISTENT / REFUTED / REFUSED
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
- [ ] Live sim mode on the map (aircraft badges, the flip moment,
      what-if sliders with the in-browser certifier) — the Phase 4b UI
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
- [ ] Click-to-follow verified live; full-day altitude graph (ADSBx
      pattern) still open
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
- [ ] Landing-page card / reports-shelf link for the app (the site's
      front door does not yet point at /apps/skyaudit)

## Later (parked, not planned)
- Live layer (adsb.lol live API atop the same client) · third city ·
  the LRCAP sibling app (Brazil grid map + certified auction arithmetic) ·
  scenario-pack editor (the commercial "computational notary" kernel)
