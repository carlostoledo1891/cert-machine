# TERRA PORT PLAN — frontier-apps/terra into cert-machine

Written 2026-09-01 from a full read-only audit of
/Users/carlostoledo/Documents/frontier-apps (agent audit, main specimen
independently re-derived from its stored record). OPERATOR PRIORITY for the
next session. frontier-apps WAS STILL UPDATING during the audit (its own
HANDOFF was stale against a Phase-3E note and a fourth compiled paper that
landed minutes later) — RE-INSPECT before porting: diff the terra tree
against this plan's assumptions, look for NEW papers/records, and re-read
frontier-apps/HANDOFF.md, TERRA-TODO.md, NOVELTY.md, PHASE3E.md first.

## The finding (what is being ported)

Stationary discounted congestion MFG on the torus (a = 1/2):
  u - sigma u'' + (1/2)(u')^2/sqrt(m) = V(x) + gamma m
  m - sigma m'' - (sqrt(m) u')' = 1,  m > 0
with V = A1 cos 2pi x + A2 cos 4pi x, A1 > 4 A2 (exactly ONE well). At
explicit parameters the EXACT equilibrium density has exactly TWO strict
local maxima (radii-polynomial enclosure, radius ~2.5e-13, positivity walls
on m and w = m^{-1/2}); a third-harmonic instance (T6) gives THREE.
Mechanism: linear response is band-pass, c(kappa) = kappa/[(1+sigma kappa)^2
+ gamma kappa]; harmonic crossover at sigma* = 1/(8 pi^2), gamma-independent
by exact cancellation; splitting window 1/16 < r < 1/4; Chebyshev U_{k-1}
law for the k-th harmonic ((1/27, 1/3) at k = 3).

HONEST FRAMING (mandatory): the potential ALREADY CONTAINS the second
harmonic (r = 0.20); the crowd RE-WEIGHTS it by 1.88x across the 1/4
critical-point threshold. "Gain-weighted well-counting beats flat
well-counting" — never "crowds invent structure the cost lacks" (the terra
title/abstract/hero overclaim; the paper body has it right).

Honest theorem count: ONE phenomenon theorem + ONE three-peak theorem +
a SIX-INSTANCE bracket table (T2/T3/T7 are one-peak negatives, T4/T5/T8
replications). The terra PDF says "eight" in the abstract and "five" in a
section heading — do not import either number.

## Ranked port list (effort in days; do in this order)

1. A2/A3 EXTENSION OF OUR MIT PYTHON VERIFIER + T1/T6 CERTIFICATES (3-5d,
   low risk). cert-machine already owns reports/verify_congest.py — 2,220
   lines, MIT, stdlib-only, falsifiers X1-X7 — a port of the SAME validator
   at the sigma=0.5, A2=0 instance; tools/build-report-mfg-congest.js
   refuses to render without CONGEST CAP: VERIFIED. The A2/A3 data terms are
   the same small patch terra applied on the JS side (additive constants in
   Phi at k=2,3; derivative rows untouched). Blocker: terra's enclosure
   records store mCoef/uCoef but NOT the approximate inverse A the Python
   verifier consumes — either add a stdlib Gaussian inverse (N=96 -> 291x291
   fine) or have our runner emit A into the certificate (~1.7 MB at N=96;
   port T1 and T6 only, skip T5/N=176). THIS RE-PROVES THE WHOLE FINDING
   INSIDE CERT-MACHINE AT FULL STANDARD, and it kills terra's stale
   "proprietary validator blocks reproduction" flag.
2. certify-peaks.js AS A GENERIC INSTRUMENT instruments/critcount/ (4-6d,
   low-med). Three fixes are CONDITIONS OF ENTRY: (a) derive the count from
   the CERTIFIED slope/curvature chain rows and assert their alternation —
   today the final count comes from FLOAT curvature signs (latent, all nine
   records checked and alternating, but unasserted); (b) enclose coefficient
   products outward — one thin iv(float*float) conversion today; (c) fold
   the ball's sup|delta m''| into the Lipschitz cell pad. Then a battery
   whose reds FIRE: mutated region boundary, zeroed ball pad, degenerate
   f''=0 series, two critical points in one curvature region — each must go
   red. Generic over any even cosine series; reusable far beyond MFG.
3. sigma* = 1/(8 pi^2) + BAND-PASS PROPOSITION + CHEBYSHEV LAW (2-3d, low).
   The gamma-cancellation is a RATIONAL IDENTITY (sigma kappa_1 = 1/2) —
   decide it in exact rationals in cert-machine, not by 12-digit float
   agreement (terra's LAYER2.md is the source).
4. THE BRACKET INSTANCES (2d after #1, low): T2/T3/T7/T8 as a bracket TABLE
   under one theorem — not as theorems.
5. census.js — KRAWCZYK EXHAUSTION / EXACTLY-n (5-7d, low). From
   experiments/terra-cap/: exactly 3 solutions of the even Galerkin
   truncation at c=-12 for N=2..5, box printed in the record, MIT lineage,
   selftest of interval mirror vs float kernel, honest box-bounded scope.
   The most cert-machine-shaped artifact on the bench. Needs: selftest
   promoted to a registered battery + a runner writing
   certs/mfg-cap-census-*.json.
6. THE ATLAS PAGE — REBUILD ONLY (8-12d, med). Terra's page is generated
   from records (good) but in frontier's design system + vendored ECharts —
   never import. Rebuild from design/tokens+components+template. Needs a
   NEW SCATTER FORM in design/charts.js (through design/battery.js) for the
   224-cell phase map, or re-expression as strip/segments per sigma column
   (most of the budget is here). PRESERVE: "floats are the map, theorems the
   territory"; per-element float labels; T1/T6 portraits (lines form fits);
   specimen table keyed to record filenames; the mechanism prose; the
   "candidate, not certified" chip on any live solver. FIX: the hero count
   and "invents structure" wording; ADD the enclosure bounds (Y0, Z1, Z2,
   closureMargin, minW) which terra's page omits and our mfg-congest page
   already shows — match our own bar, build refuses without them.
7. FACE-DIMENSION THEOREM k = |shared| - cons + z (4-6d, med): port the
   THEOREM, REBUILD the evidence — facelaw.py writes NO record; the
   4,000-network / 572-failure claim has no artifact. Needs a seeded runner
   emitting certs/facelaw-*.json with failing instances enumerated.
8. ATTENTION WING (5-8d, med): port the PHANTOM-BIFURCATION CATALOGUE first
   (four named finite-budget artifacts — a taxonomy of how float
   experiments manufacture bifurcations; fits "a REFUTED here is proved"
   perfectly); re-decide the exact-Q theorems with our rational
   instruments, with records. Quote PHASE3E's "certifying the wrong object
   very precisely" judgement in whatever we write.

## DO NOT PORT

- terra-2p: its regime map is BYTE-IDENTICAL to our
  certs/mfg2p-regime-map.json (sha f32ea325...) — a round trip.
- lib/eqcert: interval.js byte-identical to instruments/interval/interval.js
  (sha 59556ef9...). If transcendental.js/index.js differ meaningfully,
  that is a DRIFT REPORT, not a port.
- The LLM-selection study (704/754, sonnet 37/8): NO data on that bench —
  porting the numbers would import a hardcoded claim.
- lrcap/splat/skyaudit-copy/fleet/forecast/route: killed by frontier's own
  standing rulings, already ours, or demo-grade. The frontier data/ splat
  artifacts carry an INTERRUPTED-VERIFICATION hazard flag in their HANDOFF.

## Port conditions (non-negotiable)

- frontier-apps has NO GIT — it is NOT a valid lift source. Re-lift MIT
  pieces from sin-mfg originals or author fresh; frontier's LIFTS.md is a
  research note, not provenance. sin-mfg remains READ-ONLY.
- Licensing: candidate solver + terra-cap kernels are MIT (sin-mfg
  core/mfg, .work/msn2). model.js and validate-congest-mw.js descend from
  sin-mfg PROPRIETARY paths — the port route is our MIT verify_congest.py,
  not those files.
- Exact arithmetic through instruments/interval; batteries with red
  controls that actually fire; records written by runners into certs/;
  pages born from design/; every displayed number from a gated record.
- COEFFICIENTS: terra's theorems are true of specific binary64 doubles
  (A2 = 0.0006000000000000001) while the paper names decimals. State exact
  binary64 or choose representable values (e.g. 3/1024) — decide before
  the first certificate is written.

## Paper rebuild notes

Rebuild from records via the build-lambda4-writeup.js pattern (prose once,
constants interpolated). Before anything is sendable: fix the eight/five
count inconsistency; the title/abstract overclaim; exact coefficients; cite
the radii-polynomial lineage properly (van den Berg-Lessard with real
references; Rump for Krawczyk); attribute the falsified "ceiling" as the
lab's own prior from an unreproduced 508-sample float campaign (not folk
belief); and RESOLVE THE PRIORITY QUESTION — our reports/mfg-congest.html
already claims the first validated-numerics MFG equilibrium enclosure.
OPERATOR INPUT NEEDED: was mfg-congest ever sent/published anywhere? That
decides whether the terra paper's "first" is a first or a self-citation.
Fences to keep cited: Karuturi arXiv:2605.20213 (spontaneous instability,
potential-free, cognate 8 pi^2 nu^2 constant — the mandatory fence),
Cesaroni-Cirant 1705.10741 (the foil), Osborne-Smears 2502.14687,
Cecchin-Dai Pra-Fischer-Pelino 1810.05492. Add a textbook-level cite for
"non-flat linear gain changes critical-point counts of two-harmonic
signals" — stating the mechanism as elementary ISOLATES the real
contribution (the MFG setting, the exact gamma-free constant, the
nonlinear proof).

## Red flags that must not travel

No battery anywhere in terra (deliberate policy there); the only modified
lines (the A2/A3 patch) are the only untested lines; counting inflation;
title overclaim; hardcoded numbers on a generated page (build-terra.js
face anchors, 704/754 and 572/4,000 caption constants); "outward-rounded
end to end" not literally true of certify-peaks.js until fixes (a)-(c);
no version control at the source.
