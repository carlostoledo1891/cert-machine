# Janela — the living build plan

## v1 (2026-10-06, built)
- [x] Sites as one definition; exact GRIB reading; the daily feed (write-once) and the GitHub Action.
- [x] The forward ledger (`certs/janela-ledger/`): ECMWF ensemble central 40 of 50, target = altimeter Hs.
- [x] The window instrument (`instruments/window/`): workability counts, the four-verdict decider.
- [x] The Capitania rule pack and the eight operations; DNV's alpha tables as one file.
- [x] 32-year workability at six basins (`certs/janela-workability.json`).
- [x] The alpha method that made Table 4-1, re-implemented and calibrated (16/20 within 0.02).
- [x] The back-archive (ECMWF × NOAA × SBLB, 2023-07 → 2026-10): fetch, pack, commit.
- [x] Matchups → calibrated bands (`certs/janela-bands.json`) → the second ledger proposer
      (calibrated-v1, pinned by the bands' sha256 in `audit/commit.js`).
- [x] Site alpha vs DNV (`certs/janela-alpha.json`) with exact exceedance counts.
- [x] The page (/janela/) and its gated build.
- [x] The app view at /janela/ (the fleet of 181 ANP units on one map); the method page at /janela/metodo/;
      the day's data (today.json + field.bin, field.py + build-today.js) on the orphan branch janela-field.
- [ ] Scoring live from 2026-10-09 (observe.py three days late, score.js; admission-v1 in audit/placar.js).

## v1.1 — the fixes after the first review (2026-10-06 night)
- [x] The Action pushes the forecasts right after commit.js; observe/score may fail without losing the day; a
      second run at 11:40 UTC; every push through audit/push.sh + guard.js (append-only, on the staged bytes).
- [x] Admission-v1 (audit/placar.js, one definition): one trial per target day by lot, looks at 30·2^j days
      with bars summing to 1/20, sticky pruning; dated in certs/janela-ledger/DEFINITIONS.json before any score.
- [x] observe.py: three days late (NOAA's D+1 file is incomplete; every file is rewritten daily), days in order,
      404s held for retry, each pass's own points kept (the value re-checks from them).
- [x] commit.js: an hour of margin before every target; a stale bands pin skips only calibrated-v1, with a warning.
- [x] The app: a late day said in words (> 36 h); published codes used only when this page's model AND modules
      made them; the map field tied to the day's run and sha256; Alívio only where there is storage (model.js
      appliesTo); the list ranked by the tightest margin; the site alpha's reach said ("só até Hs 2 m");
      ALÍVIO CRÍTICO on the band when the chosen criterion is silent, the inventory aged by production since it
      was typed, full tanks raised; MÊS says when it substitutes an area, a limit or a window; the Nota names
      the main commit and the re-run of THAT day (build-today.js --feed); the method page is a dated portrait.
- [ ] The site alpha at Hs 3–4 m (Alívio, Carga): more pairs (the AWS archive from 2023-01, pooled basins for
      the high-Hs cells, the pooling stated) — today the alpha decides only operations with Hs <= 2 m.
- [x] Sergipe-Alagoas step 1: the site `sergipe` tracked from 2026-10-07 (feed + ensemble ledger); bands borrowed
      only from measured sites (platforms.js); the cards say "acompanhado, ainda sem medição".
- [ ] Sergipe-Alagoas measured: back-archive (ECMWF + NOAA) -> matchups -> bands v2 (calibrated-v2) -> site alpha;
      then the decommissioning view (lifts at Hs <= 1.5 m, the campaign planner).
- [ ] A pruned proposer stops deciding in the app (today the PLACAR shows the prune; build-today does not yet
      withhold the band criterion). The first look is at 30 trial days, about 2026-11-08.
- [ ] The PLACAR per site and lead (descriptive); decision-level scoring (published LIBERADA vs the satellite);
      scoring the borrowed bands at the units themselves.

## Next
- Period (Tp) uncertainty for swell-sensitive operations (B706): the period-band Hs fields of the
  wave ensemble (h1012 … h2530) and pp1d; the hindcast's `fp` pass (HANDOFF B3).
- Wind alpha (Table 4-6 is a maximum "when no reliable data"): site statistics from altimeter wind
  and the P-25 METAR (anemometer height to be established).
- The berth: the Swell engine's nearshore transfer for terminals inside bays, on licensed or
  client bathymetry — until then berth wave limits stay SEM DADOS.
- Current and visibility: no feed forecasts them; the rules that limit them stay SEM DADOS.
- Swell re-homed on this engine as the public face (targets row `swell-port`).
