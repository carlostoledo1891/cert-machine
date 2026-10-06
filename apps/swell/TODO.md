# Swell — the port plan (written 2026-10-06; nothing ported yet)

Swell is the public face of the Janela engine: the Florianópolis sea-conditions app from
frontier-apps (`~/Projects/frontier-apps/PORT-SWELL.md`, `site/swell/`, `experiments/swell/`),
re-homed here on the same forecast feed, the same ledger and the same decider. The operator's
rulings (2026-10-06): Janela first, Swell second; Swell KEEPS the Navy (DHN) chart data.

## What the source review found (re-run here; targets row `swell-port`)
1. The breaking-calibration headline (held-out ρ 0.56 → 0.89) is beaten by a no-forecast
   baseline (each beach's training-mean foam: ρ 0.927); the real skill is within-beach over
   time, ρ 0.61 vs 0.48 offshore; the shipped factors were refit on all years, test included.
2. 14 of 21 ocean beaches can never read "big" (Hb > 2.6 m): Hb = max over probes of
   min(K·H, 0.55 h) with every probe in ≤ 4.5 m of water.
3. Side edges crossing the shelf: K wrong by ±35% within ~5 km (Guarda do Embaú reads the
   boundary value). Shadow K is numerical diffusion (0.25 / 0.18 / 0.125 at dx 60 / 30 / 15 m).
4. Wind correction trained at ~day 0, applied out to 7 days; method chosen on the test years.
5. The card's ± ignores the island model's own error; rules and constants duplicated
   (windClass ×3, the 0.6/0.33 cutoffs ×12, γ 0.55 vs 0.78); periods clamped to 6–15 s silently.
6. Good and kept: island.py reproduces Snell + Green's law within 0.1% on a planar beach,
   deterministic, 1–2 s per solve; every shipped number reproduces from cached inputs.

## The port, in order
- [ ] `apps/swell/sim/`: island.py with its battery — planar Snell/Green (calibration), K = 1
      in open deep water, the edge zone REFUSED (red: a beach inside it), the shadow's grid
      dependence measured and printed as a limit; the case library extended to 4–20 s.
- [ ] The forecast: the Janela feed at the `floripa` site (ECMWF open data), plus swell
      PARTITIONS (height, period, direction) from NOAA GFS-Wave (public domain) — the island
      model blends cases per partition; Open-Meteo (non-commercial) leaves the app.
- [ ] Breaking from the break point (march the transect seaward to K·H = γ h), not the probe cap.
- [ ] One rules module for the six activities; every cutoff once; decided by
      `instruments/window/decide.js` over the band, danger decided, "seguro" never claimed.
- [ ] Skill restated against the simple baselines; the wind correction refit per lead.
- [ ] The public scorecard from `certs/janela-ledger/` (site `floripa`): yesterday's forecast
      vs what the satellites measured.
- [ ] The app in the design system (MapLibre + pinned tiles, the SkyAudit pattern), pt-BR
      first, the bridge to /janela/. DHN-derived data under its own licence file
      (non-commercial, not for navigation), beside MIT code.
- [ ] Ground truth at the shore, each with its owners' agreement: the published Campeche
      bathymetry and SWASH runs (Lima et al., Ocean Modelling 2024), low-cost stereo-video
      breaking heights, the UFSC wave buoy off the island when it reports (SiMCosta CNM 01/2025).
