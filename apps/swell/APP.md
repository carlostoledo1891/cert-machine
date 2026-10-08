# Swell — the sea of Florianópolis, beach by beach

**Live:** carlostoledo.co/swell/ (unlisted; pt-BR first, EN toggle). **The day:** branch `swell-field`, rebuilt daily
by `.github/workflows/swell-feed.yml`. **Code:** MIT. **The island model's depths:** DHN chart 1902 — non-commercial,
not for navigation (`data/LICENSE-DHN.md`).

Swell is the public face of the Janela engine (operator, 2026-10-06: one engine, two faces — Janela commercial,
offshore energy; Swell public, a beach app). It was built in frontier-apps (sessions 34–37, live at
swell-floripa.vercel.app as a tester build) and ported here on 2026-10-08: same island model, same interface, new
foundations.

## What a visitor gets
1. **The answer** — one sentence for the chosen activity: the best beach, the window, the height, the swell, the wind.
2. **The list** — the beaches best first, each with its height and its measured band, the forecast word
   (bom / dá pra surfar / fraco), and — set apart — what is DECIDED (▲ PERIGO, ATENÇÃO) and the forecast warnings.
3. **A beach** — the number that matters, the band, why (how much of each swell reaches it), what is decided and
   how far it is from turning, the conditions, safety (the nearest lifeguard, the emergency numbers), the week, and a
   certificate that can be downloaded and re-run.
4. **The map** — the island model's crest lines (refraction, shelter, white water where the waves break), the wind as
   moving streaks, the longshore currents as arrows, the lifeguard posts and services.
5. **Como sabemos / Placar** — the method in plain words, every rule printed from the one table, the sources, the
   limits; the scoreboard of the open sea Swell starts from.

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
