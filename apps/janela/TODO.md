# Janela — the living build plan

## v1 (2026-10-06, in progress)
- [x] Sites as one definition; exact GRIB reading; the daily feed (write-once) and the GitHub Action.
- [x] The forward ledger (`certs/janela-ledger/`): ECMWF ensemble central 40 of 50, target = altimeter Hs.
- [x] The window instrument (`instruments/window/`): workability counts, the four-verdict decider.
- [x] The Capitania rule pack and the eight operations; DNV's alpha tables as one file.
- [x] 32-year workability at six basins (`certs/janela-workability.json`).
- [x] The alpha method that made Table 4-1, re-implemented and calibrated (16/20 within 0.02).
- [ ] The back-archive (ECMWF × NOAA × SBLB, 2023-07 → 2026-10): fetch, pack, commit.
- [ ] Matchups → calibrated bands (`certs/janela-bands.json`) → the second ledger proposer
      (calibrated-v1, pinned by the bands' sha256 in `audit/commit.js`).
- [ ] Site alpha vs DNV (`certs/janela-alpha.json`) with exact exceedance counts.
- [ ] The page (/janela/) and its gated build.
- [ ] Scoring live from 2026-10-08 (observe.py + score.js in the Action).

## Next
- Period (Tp) uncertainty for swell-sensitive operations (B706): the period-band Hs fields of the
  wave ensemble (h1012 … h2530) and pp1d; the hindcast's `fp` pass (HANDOFF B3).
- Wind alpha (Table 4-6 is a maximum "when no reliable data"): site statistics from altimeter wind
  and the P-25 METAR (anemometer height to be established).
- The berth: the Swell engine's nearshore transfer for terminals inside bays, on licensed or
  client bathymetry — until then berth wave limits stay SEM DADOS.
- Current and visibility: no feed forecasts them; the rules that limit them stay SEM DADOS.
- Swell re-homed on this engine as the public face (targets row `swell-port`).
