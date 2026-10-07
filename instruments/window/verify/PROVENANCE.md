# Provenance of the second verifier

`verify_day.py` and `battery.py` were written clean-room on 2026-10-07 from `SPEC.md` alone. What
was read: `SPEC.md`; one day file, `today-2026-10-06.json` (a scratchpad copy: its shape, its
published `dec` letters, and its `inputs`/`modules` pins, which are hashes and not code); and the
data records SPEC names: `apps/janela/scenario/{operations,sites,platforms,regions}.json`,
`apps/janela/scenario/rules/dnv-alpha.json`, `certs/janela-alpha.json` and
`certs/janela-alpha-sergipe.json`. What was never opened, read, grepped or diffed:
`instruments/window/{decide,q,workability,battery}.js`, anything under `apps/janela/audit/` or
`apps/janela/app/`, `apps/janela/{build-today,numbers,page,battery}.js`, and the git history of any
of them. No repository-wide search was run; the only directory listed was this one.

On the real day (run `2026-10-06T00`), all 7 pins hold and 67,396 of 67,396 published letters are
re-decided equal, in about 0.9 s (0.89–0.93 s for the decision, under 1 s wall-clock, Apple M2,
Python 3 standard library, every number a `Fraction`). The battery takes about 2.2 s: 24 green
checks with hand-computed expectations, including an 8,990-letter synthetic world; 12 red controls
that must fail, and do; and the real day. Where SPEC.md leaves room, the verifier reads it like
this. A window that runs past the forecast is `-` even when the criterion would be `n`, because the
window is defined first; the published day agrees. A limit that is MISSING anywhere in the window
cannot give V or I. The real day never tests this, because every step there carries all four
bands, so the battery covers it. A place that is in neither `sites.json` nor `platforms.json` is
refused, because SPEC gives it no alpha source. `verify_day.py` sha256 at this writing:
`23f33da91a42fb796818ef06713deba13801f91cc86fadaeef173cc5516ac948`.

After the hand-back (2026-10-07, by the integrating session, not the clean-room author): the battery's real day
defaults to the desk's copy, `site/janela/data/today.json` (written by `apps/janela/build-today.js`), instead of the
scratchpad path it was written against; `--day` still names any other. `apps/janela/build-today.js` now runs
`verify_day.py` on every day it builds and refuses one it disagrees with.
