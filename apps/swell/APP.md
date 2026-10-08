# Swell — the sea of Florianópolis, beach by beach

**Live:** carlostoledo.co/swell/ (unlisted; pt-BR first, EN toggle). **The day:** branch `swell-field`, rebuilt daily
by `.github/workflows/swell-feed.yml`. **Code:** MIT. **The island model's depths:** DHN chart 1902 — non-commercial,
not for navigation (`data/LICENSE-DHN.md`).

Swell is the public face of the Janela engine (operator, 2026-10-06: one engine, two faces — Janela commercial,
offshore energy; Swell public, a beach app). It was built in frontier-apps (sessions 34–37, live at
swell-floripa.vercel.app as a tester build) and ported here on 2026-10-08: same island model, same interface, new
foundations.

## What a visitor gets (the one-clock redesign, 2026-10-08, operator: "the activities must be only icons that communicate the conditions to that activity, like legends … do not change the wind and waves")
1. **One clock, one sea.** The reader picks a day and an hour (default: now, or the next daylight step); the map's
   crests and wind, every beach's waves and wind, the card and the week are all that step. Nothing else moves the clock.
2. **The top** — the time, the open sea (height, direction, period, its measured band) and the wind, then six activity
   chips: how many beaches each activity is good at, now (▲ n where a danger is decided). Tapping one only HIGHLIGHTS:
   the beaches not good for it dim, a line names where it is good and its best window of the day, with a button to go
   there — the reader moves the clock, or not.
3. **The list** — every beach by region (Norte, Leste, Sul, Continente, Baías), always in the same order: the waves at
   the shore with their measured band, the wind there, the day's wave curve, and SIX ICONS — one per activity, the
   shape its condition (filled bom · ringed dá pra ir · dim fraco · red ▲ perigo decided · violet ring atenção, the band
   straddles a decided limit · dashed aviso de previsão). Hover or focus an icon: why. Tap it: the beach, at that activity.
4. **A beach** — the waves and the wind (two numbers that never change with the activity), the band, why, then the six
   activities as rows (word + the number that matters; open one for its rule and what is decided, both ways it can
   turn), the conditions, the week with an activity × hour grid, safety, the certificate.
5. **The week tab** — the sea and the wind through the week, and the grid "when each activity is good" (for the island:
   the best beach at each hour; for an open beach: its own).
6. **The map** — the island model's crests, wind streaks, currents, and each beach's activity icons in the same grammar.

## What changed from frontier's Swell, and why
| frontier (tester build) | here |
|---|---|
| Open-Meteo's free API, called from the browser (non-commercial) | ECMWF open data (CC BY 4.0) and NOAA GFS-Wave (public domain), read exactly once a day in the cloud (`audit/feed.py`, Janela's own decoders) |
| a ± from the last 30 days' RMSE, starting at the analysis | Janela's MEASURED band at the island's edge (satellite altimeters, conformal, 9 in 10; ECMWF ∪ NOAA held-out coverage 96.5% on 21,259 passes it never saw) |
| breaking = max over probes ≤ 4.5–6.5 m of min(K·H, 0.55 h): 14 of 21 ocean beaches could never read > 2.5 m | probes to 8.8–13 m; breaking found by marching in from the deepest probe, or frontier's peak where larger; monotone in the sea, so the band maps exactly (`model/surf.js`, battery) |
| Guarda do Embaú read the model's boundary value (frontier's live app named it the island's best sea for 10-08, read that night) | refused: 0.6 km from the edge where the unrefracted plane wave enters |
| rules written three times; "Como sabemos" disagreed with the code in four places | one table (`surf.js` RULES); the page prints it |
| danger as a score threshold | the wave limits DECIDED over the band by `instruments/window/decide.js` (PERIGO / ATENÇÃO / abaixo do limite — never "seguro") |
| everything computed in the tab, unverifiable | the day built in the cloud, the tab re-derives it byte for byte (a sha256 over every height and letter) |
| the satellite "beach factors" headline (ρ 0.56 → 0.89) | dropped: a no-forecast baseline beats it (ρ 0.927) — see targets row `swell-port` |
| the wind correction fitted on Open-Meteo forecasts | dropped until refitted on ECMWF (TODO); the wind is forecast ink, said so |

## The honest boundaries (on the page)
- Decided = exact arithmetic over the measured open-sea band carried to the beach by a LINEAR island model. The
  model's own error at the shore is not measured (no buoy or camera at a beach yet).
- The wind, the scores, the currents, the rip flag, the bays' chop, the tide and the water temperature are forecast.
- Sandbars are not in the seafloor; inside 10 m the profile is fitted to the chart's 10 m line.
- Not for navigation. Not a safety guarantee.

## Layout
```
scenario/beaches.json   the 34 beaches (one definition)
data/                   PINS.json, LICENSE-DHN.md, beaches.json (sim/probes.py), island/ (64 textures + depth), tiles/, pois.json
sim/probes.py           the island model's cases -> every beach's probes, K, angles, fetch, edge distances
model/surf.js           THE model: transfer, breaking, chop, wind, currents, the six rules, decisions, the digest
audit/feed.py           the daily reader (ECMWF, NOAA, Copernicus) — test_feed.py its battery
build-day.js            the day: Janela's band at the edge + surf.js everywhere + the digest -> swell-field
app/                    build-app.js (the shell), client.js (the page), style.js (the rules on the house tokens)
battery.js · build.js   the gate · the build
```
