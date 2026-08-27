# apps/ — served interactive experiences

Reports are documents; apps are experiences. An app is a page a visitor *uses* —
a map, a replay, a live panel — with the machine's certificates underneath as the
trust layer. The domain leads (aviation, energy, markets); the math is why you
can believe what you see.

## The rules (inherited, not new)

- **Born from the cert-machine design system.** Same tokens, components, and
  guidelines as the reports — but apps render through a NEW VIEW: the **app
  shell**, a full-viewport surface (100% width × 100vh, no centered prose
  column) with lateral panels — a real dashboard. The shell is a design-system
  addition (`design/`), documented in DESIGN.md like every component. No CSS or
  built pages from sin-mfg, ever.
- **Battery-gated builds.** Every app has a battery (calibration against known
  answers + reds that must fire) and its build refuses on failure, like every
  report.
- **Pinned data.** Every data corpus an app renders is hash-pinned with its
  source and acquisition date. No unpinned bytes on a served page.
- **Honest boundaries on-page.** What is certified is the arithmetic over a
  stated model; the model's fidelity to the world is a labeled assumption.
  In aviation wording: "mathematically certified enclosure," never bare
  "certified" (the word has airworthiness meaning we do not claim).
- **Done = public URL + rerunnable.** An app that only runs on this disk is
  not done.

## Layout convention (one folder per app, self-contained)

```
apps/<name>/
  APP.md        what it is, the experience beats, the honest boundaries
  TODO.md       the living build plan
  RESEARCH.md   sourced findings the app's numbers stand on
  data/         pinned corpora + PINS.json (source, sha256, date, license)
  audit/        the bridge from raw data to instrument calls to certificates
  sim/          deterministic scenario engine, if the app has one (seed-pinned;
                zero unpinned randomness — same file, same timeline, anywhere)
  scenario/     scenario packs: parameter boxes, specs, rules — the swappable part
  src/          the client experience (map, panels, replay, sim)
  battery.js    calibration + reds; the build gate
  build.js      emits site/apps/<name>/ through the design template
```

Current apps: `skyaudit/` — real urban helicopter traffic (flagship city
chosen by data richness; NYC and São Paulo are the candidate packs), audited
flight-by-flight against published eVTOL specs and energy-reserve rules.
