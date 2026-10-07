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
- [x] Sergipe-Alagoas measured as its own REGION (scenario/regions.json, audit/region.py, audit/bandset.js): the
      cloud back-archive for the site alone, its pack, 3,096 pairs, bands (proposer calibrated-sergipe-v1, pinned)
      and site alpha; the 2026-10-06 records untouched; all 181 units carry a measured band. The band leans high
      (shelf gradient: the satellites see 40–100 km out) and the alpha sits at or under Table 4-1 — stated.
- [ ] Sergipe's nearshore truth: a wave buoy at the platforms, or the nearshore transfer; then the
      decommissioning view (lifts at Hs <= 1.5 m, the campaign planner); a WW3 3-hourly node for MÊS.
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

## v1.2 — reliability you can check, a tool's scale (2026-10-07, operator: "use our math, instruments and
## certification power … simple, clean and super reliable for Brazil's market"; "the UI is too big — look to Figma, Webflow")
- [x] The second verifier: instruments/window/verify/ (SPEC.md + verify_day.py, Python stdlib, written clean-room
      from the spec by an agent that never read decide.js, q.js or criteria.js); build-today.js refuses a day it
      disagrees with, and the day carries its result (today.second) — the card says "2×".
- [x] The certificate on every card: the tab's re-check, the second verifier, the band's own scoreboard state,
      exact arithmetic; "Certificado .json" downloads one decision with every number a surveyor needs by hand.
- [x] A pruned calibrated proposer stops deciding (bandset.withoutPruned; today.pruned; the card says so).
- [x] PLACAR per site and lead (descriptive; the admission still reads trial days).
- [x] A tool's scale: 12 px body, 11 px labels, 24 px controls, a 332 px rail of sections (style.js :root names
      the scale once); the method page's hero at section size; the beach point hidden from the app.
- [x] The day's data fetched before the map library (early.js); links carry the run and say when it is old.
- [ ] Decision-level scoring: every published LIBERADA at a measured site against the satellite (from 2026-10-09).
- [ ] The campaign planner (decommissioning): N operations from a date, exact counts over 32 years.
- [x] NOAA WAVEWATCH III as the second forecast proposer (2026-10-07): audit/noaa.py reads GEFS-Wave (31 members, HTSGW)
      and GFS-Wave (Hs, PERPW, DIRPW, the forcing wind, wind sea, three swells) by .idx byte range, exact packed integers
      (cross-checked once against an independent JPEG 2000 decode), every run/step/parameter checked; commit.js --noaa
      commits janela/hs-altimeter/noaa-gefs-c25of31 (order statistics 4 and 28 of 31, claim 3/4) on the ECMWF target;
      providers-v1 dated (a raw ensemble is shown, never decided; two calibrated bands -> their union); the card draws
      NOAA's band as an outline beside ECMWF's hatch; the Action runs it after the ECMWF push, allowed to fail.
      `python apps/janela/audit/noaa.py --verify corpus/janela/feed-noaa/YYYYMMDD.json.gz` re-reads a day from NOAA.
- [x] NOAA at the 181 units (noaa.py --units, after field.py in the Action; janela-field data, never main).
- [x] The sea by parts on the card (NOAA's wind sea and three swells at the chosen hour; forecast ink, never decided).
- [ ] Period/direction CRITERIA from the swell partitions (offloading heading, lifts): needs a cited limit per operation.
- [x] The calibrated WW3 band (2026-10-07): GFS-Wave back-archive 2023-07-12..2026-10-05 in the cloud, 53,538 pairs,
      certs/janela-bands-noaa.json, proposer calibrated-noaa-v1 pinned; providers-v1's union decides (2,038 of 67,744
      letters move to INDEFINIDA on the 10-07 day, none flips). NOAA's ratio band is ~20% wider than ECMWF's.
- [x] Which band decides, measured (providers-eval-v1): the union stands; graded as itself (union-v1, union-sergipe-v1);
      conditional reliability by wave regime and season in the record; the held-out number on the trust box.
- [x] The surface current (Copernicus Marine) and the current at hull depth (15.8 m) on every card — shown, not decided.
- [x] The current's truth: GlobCurrent observed daily (current-truth-v1); drifters scouted and rejected (too sparse).
- [ ] The calibrated current band (conformal, per site and lead bin) once ~19 pairs per cell exist (~10-18), then a
      current proposer on the ledger; a current limit decides only with a cited source.
- [x] The campaign planner (MÊS): N operations from the 1st of a month, 32 hindcast years, exact order statistics, at
      the sea's limit, Table 4-1's OPWF and the site alpha's.
- [ ] Planner: mobilisation/transit time between operations, any start day, the operator's own day rate in vessel-days.
- [x] The providers head to head on the same targets (PLACAR "Frente a frente"), from the first scores.
- [ ] NOAA's 06/12/18 UTC runs (a second cron) and hourly steps in the app.
- [ ] Watch GitHub's schedule (2026-10-07: neither slot fired; five slots + tools/janela-watchdog.sh since).
- [ ] The last-mile pilot with LabECO (brief written, private; Babitonga first): engine + certified band + field test.


## v1.3 — ready for outreach (2026-10-07, operator: "finish all missing items to prepare Janela to start outreach phase;
## usable, easy to spot information; information hierarchy; the use cases, the user needs"; PRODUCT.md "The outreach pass")
- [x] The use cases as ONE list (uses.js): the app's intro doors, the method page's "para quem" cards (deep links), the
      deck's table; battery checks every door and link (+1 red).
- [x] The intro (first visit open, folds to one line); the operation before the answer on a desk, after it on a phone;
      the limits in force as one line with "ajustar".
- [x] The fleet answer counts the list's own set and names the minority; the list grouped at the chosen hour.
- [x] The card reordered by hierarchy: the next window and its margin first, the node line last, what is shown but not
      decided folded.
- [x] MÊS renamed CAMPANHA and reordered (the campaign before the months); the Campanha door opens 10 × 48 h at Hs ≤ 2 m.
- [x] PLACAR opens with what is already measured (held-out coverage 96,5%, broken LIBERADA 0,33% vs 1,10%).
- [x] The run chip in Brasília time; the link-preview card (og.png) for both pages; the deck (12 slides, the app's own
      screenshots, every figure from a record) at /janela/janela-apresentacao.pdf.
- [x] Janela on the landing page (tools/build-site.js) — and the site build unblocked: the certificate shelf now
      describes the nine janela-* records (the build had refused since they were added on 2026-10-06).
- [ ] The sends (Petrobras logistics/marine operations, a marine warranty surveyor, LabECO's brief, Radar Ciclo 4) —
      the operator's, each approved per item.
- [ ] English version of the app's surface (outreach beyond Brazil) — not started; pt-BR is the market.

## v1.4 — the free frontier items (2026-10-07 night, operator: "proceed all what can do now free"; targets.json
## janela-buoy-truth-and-frontier)
- [x] ECMWF AIFS (data-driven) as the third provider: back-archive from 2026-05-13 (janela-archive what=aifs, packed in
      corpus/janela/aifs), 6,659 pairs, certs/janela-bands-aifs.json; providers-eval-aifs-v1 (dated before judging): the
      union of IFS and NOAA stands — AIFS committed daily and graded (aifs-ens-c40of50, calibrated-aifs-v1), never deciding
      (aifs.py, commit.js --aifs, the Action's step, two head-to-heads on the PLACAR). Re-asked at its first admission look.
- [x] A correction learned from the satellites (postproc-eval-v1): narrower than ECMWF's band and fewer broken LIBERADA
      than it, not as reliable as the union, JJA under 0.90 — recorded, not used.
- [x] ECMWF's Hs by period band (h1012 … h2530) read from 2026-10-08's feed and at the units: the long-period swell
      (≥10/12/14 s) on the card, forecast ink, never decided.
- [x] The PNBOIA buoys (GOOS-Brasil OPeNDAP, 2012-2019) against the hindcast CAMPANHA counts on (pnboia.py,
      certs/janela-pnboia-check.json): pairs, bias, RMS and the exact window counts on both series.
- [x] The satellite swell truth sized: the SAR/SWIM L4 swell field near the sites holds a primary-swell estimate in 0-10%
      of the 3-hourly steps (August 2026) — enough to grade period error in aggregate at the south-east basins, not daily,
      and none at the equatorial margin or Florianópolis.
- [ ] The altimeter truth v2: Copernicus L3 adds CFOSAT, HY-2B and HY-2C to the eight RADS missions (more passes, nearer
      the units) — a new truth version, dated before use, and the bands re-calibrated against it.
- [ ] Period criteria: a cited limit per operation, then the long-swell Hs decides; SAR graded in aggregate.
- [ ] The live buoys (REMO Observacional, UFSC's TriAXYS, FPSO wave radars) — partner asks, the operator's.
