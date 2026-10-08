# Swell — the living plan

## Done (2026-10-08, the port)
- [x] The island model lifted and pinned (`data/PINS.json`, 69 files; DHN licence beside it). `sim/probes.py` reproduces
      frontier's island-beaches.json probe for probe, K for all 64 cases, seaward and fetch at all 33 beaches with probes,
      and adds the 8.5 and 11 m targets (every ocean beach now reaches 8.8 m or deeper).
- [x] The forecast: `audit/feed.py` — ECMWF IFS HRES (waves + wind) and NOAA GFS-Wave at the floripa site (Janela's node)
      every 3 h to 144 h then 6-hourly to 168 h, ECMWF's wind on the 16 nodes over the island, Copernicus' sea level,
      tide and water temperature; equal to Janela's own feeds at every shared lead (battery). Open-Meteo left the app.
- [x] Breaking from the break point (`model/surf.js`): crossing marched in from the deepest probe, or frontier's peak
      where larger; non-decreasing in the sea (battery sweeps 132 beach × sea cases), so the band maps exactly.
- [x] One rules module for the six activities; danger DECIDED over the band by `instruments/window/decide.js`; "seguro"
      never claimed; forecast warnings dashed.
- [x] Refusal: Guarda do Embaú (0.6 km from the south edge); the lagoon never decided.
- [x] The day built daily in the cloud (`.github/workflows/swell-feed.yml` → branch `swell-field`), re-derived in the tab.
- [x] The app in the design system (app shell, MapLibre 5.24 + the pinned Florianópolis tiles, the crest-line layer,
      wind streaks, currents, places), pt-BR + EN, "Como sabemos" generated from the records, the Placar.
- [x] Batteries wired: `make test`, `tools/build-control.js` (swell; swell feed). Layout, style, grammar, render baselines.

## Done (2026-10-08, the one-clock pass and the map pass)
- [x] One clock, one sea: the activities are legends (icons in one grammar, tooltips, a tap opens the beach); nothing
      re-ranks or re-times when one is picked.
- [x] The map pass (operator: "the wind seems like rain on the screen and makes the waves less visible"): the island
      model's crest lines stay the hero (fainter over deep water, the model box fading at its edge, visible from the
      phone's whole-island zoom); the wind redrawn as drifting grey arrows over the water only, from the island's own
      depth texture (a north wind drawn as streaks on a north-up map read as rain, and a streak cannot say which way it
      blows); quick switches for waves and wind on the map (O / V), kept per viewer; a night veil over the map's layers;
      the hour scrubber made one control (the day's sea as its track, a playhead); surf, kite and SUP icons redrawn (they
      read as a feather, an umbrella and an arrow); knots the one wind unit in the app's own words; reduced motion holds
      the sea and the wind still.
- [x] The satellite foam trait per beach (190 Sentinel-2 passes) on the card.

## Next, in order (what a beach-goer — and a partner — needs)
1. **Watch the first cloud days** (10-08 onwards): the gate, the feed, the day on swell-field, the app reading it.
2. **The Placar fills** (from 10-09): Janela's ledger at floripa. Then Swell's OWN proposer: the 3-hourly band at the
   edge (steps between Janela's 6-hourly ones) committed to its own ledger (`certs/swell-ledger/`, never Janela's — its
   scorer would grade it as Janela's), graded by the same altimeter passes.
3. **The wind refit on ECMWF**: SBFL METAR (Iowa Mesonet) against ECMWF open-data 10 m wind archived since 2023 at the
   island nodes, per lead and sector; used only if it wins on held-out years. Until then the wind stays forecast ink.
4. **Shore truth** — the model's own error at the beach. In order of cost: the published Campeche bathymetry and SWASH
   runs (Lima et al., Ocean Modelling 2024); low-cost stereo-video breaking heights (LabECO, Coastal Eng. 2024); the
   UFSC TriAXYS buoy off the island when it reports (SiMCosta CNM 01/2025). Each with its owners' agreement; partners
   stay unnamed in the repo until they agree.
5. **The rules' own words in knots**: `model/surf.js` still writes SUP's limits in m/s and km/h. It is a pinned module (the
   tab re-derives the published day with it), so it changes on a day a new Swell day is built, never between.
6. **The box**: extend the island model south so Guarda do Embaú and Pinheira sit away from the edge (needs the
   landmask and depth rebuilt: frontier's chartbathy.py + landmask.js chain, ~1 session).
7. A method page (`/swell/metodo/`), a link-preview card (og.png), the PWA (manifest + service worker) from frontier.
8. Commercial use needs licensed bathymetry (DHN data purchase or a survey) — the pipeline re-runs on it.

## Known, stated, not yet fixed
- The ECMWF open-data gust is `10fg3` at 93–144 h; Janela's feed.py asks only for `10fg`, so Janela's gust is null at
  96–144 h (Swell reads either). A Janela fix, reported 2026-10-08.
- Copernicus' 1/12° grid has no Santa Catarina island in its land mask: values exist over the island; the node used is
  open sea, 8 km off the east coast.
- NCEP's partition periods (WVPER/SWPER) are named "mean period" by the GRIB tables; whether WAVEWATCH III fills them with
  each partition's peak or mean was not confirmed. Swell uses them as published.
