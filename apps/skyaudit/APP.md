# SkyAudit — real traffic, audited

**One line.** Real urban helicopter traffic — the exact traffic the eVTOL
industry says it will replace — replayed on a map, with every flight audited
flight-by-flight against published eVTOL aircraft specs and energy-reserve
rules. Every verdict is a mathematically certified enclosure, not a
simulation. Flightradar24 shows you where aircraft are; SkyAudit shows you
what is *provable* about them.

**The city is a pack, not a commitment** (operator ruling, 2026-08-27: pick
the best-data city). The corpus source is a GLOBAL daily dump, so candidate
cities are bbox extractions from the SAME pinned day — we extract the
candidates, count, and lead with the richest. The two leading candidates:

- **New York** — likely flagship: ADS-B Out is MANDATED inside the Mode C
  veil (14 CFR 91.225, since 2020), so capture is near-complete, on the
  densest receiver region on Earth; the replacement story is literal (Joby
  acquired Blade's passenger business — the eVTOL maker owns the helicopter
  routes it plans to convert; Archer–United announced the JFK/EWR–Manhattan
  network); charted corridors (Hudson/East River SFRA), fixed heliports as
  vertiport analogs, and the world's most recognizable 3D skyline.
- **São Paulo** — pack #2 and the EmbraerX play: the world's largest urban
  helicopter fleet (400+, ~1,300–2,200 movements/day claimed), Eve's launch
  market — but equipage is voluntary there, so the corpus undercounts the
  piston/VFR tail. Verified live: SP helicopters DO broadcast today.

Decision rule: extract both from the pinned day; the richer, cleaner corpus
leads. Facts above verified in RESEARCH.md; NYC operator/heliport status
re-verified before any page copy states it.

**The thesis it renders.** The UAM industry claims eVTOLs will replace this
exact traffic. Nobody has ever *decided* that claim — the entire literature is
Monte Carlo. The machine's evtol instrument (`instruments/evtol/`) decides it:
interval arithmetic over honest parameter boxes, three-valued verdicts,
exact-rational falsifying corners. SkyAudit points that instrument at a real
recorded day and renders the answer.

## The experience (aviation first, math as the trust layer)

A full-viewport flight dashboard — the cert-machine design system in a NEW
VIEW: 100% width × 100vh app shell, dark basemap, lateral panels. Not a report
column. (Operator definition, 2026-08-27.)

1. **The replay.** One real day over São Paulo. Aircraft trails animate with a
   time scrubber; helicopters highlighted among the traffic. The FR24 feel:
   fading trails, altitude coloring, follow-camera on click.
2. **The audit layer.** Toggle a spec (Eve, Joby, Archer, Beta — the
   comparison set) and a rule (FAA SFAR reserve, EASA SC-VTOL, ANAC status).
   Every completed flight gets its verdict color: CERTIFIED-feasible /
   REFUTED-infeasible / REFUSED (box straddles — honestly undecidable at this
   knowledge). Each dot is a proof, and the legend says so.
3. **The certificate panel** (lateral). Click a flight: route metrics, the
   mission segments as boxes, the enclosure vs the reserve floor, the verdict,
   and — for REFUTED — the exact-rational falsifying corner. A "rerun this"
   block: the certificate JSON + the stdlib check.
4. **The flip moment.** The scrubber shows margins live: pick a flight and
   watch its enclosure against the reserve bar as the mission progresses —
   the provable instant a mission stops being certifiable.
5. **The headline stat band.** "Of N real flights this day: A certifiably
   flyable by spec X under rule Y · B certifiably NOT · C undecided at the
   stated boxes." Computed at build, gated, per spec × rule.

## Mode 2 — the simulated fleet (operator addition, 2026-08-27)

A deterministic scenario engine flying a virtual eVTOL fleet over the same
map — the forward-looking half of the dashboard, and the home of the live
"flip moment":

6. **Scenario packs drive everything.** A pack = vertiport network (the
   city's real heliports — NYC: JRB/JRA/East 34th; SP: Campo de Marte and
   the rooftop grid), corridors (the charted routes — Hudson/East River
   SFRA; DECEA's helicopter corridors), a demand schedule, the fleet mix
   (Eve/Joby/Archer/Beta counts), weather boxes (wind, temperature), and a
   rule pack. Swap the pack, same engine — this is the commercial kernel
   from the brainstorm, made literal.
7. **Seed-pinned determinism.** No unpinned randomness anywhere: the same
   scenario file produces the same timeline on every machine, so every
   viewer sees the same certified day and the build gates on its headline
   numbers exactly like a report battery.
8. **Live certificates, not health bars.** Every aircraft, every tick,
   carries a remaining-mission feasibility certificate (enclosure vs the
   reserve floor). When a box degrades mid-flight — headwind widens, cold
   pack — the badge flips GO → NO-GO at a provable instant, with the
   failing corner named. The lateral panel follows any aircraft live.
9. **Ground truth on the ground too.** Turnaround is arithmetic: charge-rate
   boxes vs the schedule gap. Vertiport panels show certified turnaround
   feasibility — the first place fleet OPERATIONS (not just flight) get
   decided instead of simulated.
10. **What-if sliders, certified in the browser.** Payload, temperature,
    reserve rule, fleet size — the visitor drags, and certificates recompute
    CLIENT-SIDE: the evtol instrument is dependency-free JS, so the certifier
    itself ships in the page. "The proof re-runs in your browser" is the
    rerun story in its strongest possible form.
11. **The fusion — re-fly the day.** The simulated fleet attempts the REAL
    recorded day's demand: every actual flight becomes a dispatch request,
    and the dashboard answers the replacement thesis directly — how many
    aircraft of spec X does it take to serve this day's real demand with
    every leg certified, and where does the schedule break first. Per-leg,
    per-aircraft, per-day verdicts; the fleet-size frontier ("N aircraft:
    day REFUTED · N+1: day CERTIFIED") is the headline nobody else can print.

## Honest boundaries (on the page, not buried)

- The recorded day is real ADS-B traffic (source + sha256 pinned); coverage is
  whatever the receiver network saw — stated, not assumed complete.
- The audit is counterfactual: "had THIS route been flown by an aircraft with
  THIS published spec, under THIS rule" — a claim about arithmetic over stated
  boxes, never about any operator's actual aircraft or authority to fly.
- Specs are manufacturer-published numbers wrapped in honest uncertainty
  boxes; the box widths and their sources are on the page.
- "Mathematically certified enclosure" — never bare "certified"; no
  airworthiness meaning anywhere (aviation wording rule).
- REFUSED is a first-class outcome. A page with zero REFUSED rows would be
  the suspicious one.

## Architecture (the scenario pack is the product; the map is the render)

```
data/       the pinned day (ADS-B), aircraft-type DB slice, vertiport/corridor
            geometry, PINS.json
audit/      states → flights (segmentation) → missions (boxes) → instrument
            calls → certificates JSONL; stdlib spot-checker
sim/        the deterministic scenario engine: tick loop, dispatch, charging,
            disturbance boxes — seed-pinned, zero unpinned randomness
scenario/   the swappable packs: spec packs (per aircraft: usable kWh, eta,
            power boxes + sources), rule packs (reserve boxes + citations),
            city packs (vertiports, corridors, demand), weather packs
src/        MapLibre + deck.gl client: replay + sim modes, panels, scrubber,
            the in-browser certifier (the evtol instrument shipped to the page)
battery.js  segmentation calibrated on hand-verified flights; sim determinism
            check (two runs, identical timeline hash); audit reds (scrambled
            track must fail; sub-box forgery must be caught; a disturbance
            that must flip a badge, flips it)
build.js    re-certifies the pinned day AND the pinned scenario, computes
            headline stats exactly, refuses on any deviation; emits
            site/apps/skyaudit/
```

Decisions (operator, 2026-08-27): name **SkyAudit** · visuals **2.5D replay**
(dark basemap, animated trails, 3D building mass, scrubber) · audit set
**comparison** (Eve + Joby + Archer + Beta). Stack, data source, and rule
texts: see RESEARCH.md.

Later, same engine: a second city, a live layer, and the LRCAP sibling (the
Brazil grid map with certified auction arithmetic).
